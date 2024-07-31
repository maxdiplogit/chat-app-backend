// Imports
import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server, Socket } from 'socket.io';
import multer from 'multer';
import { S3Client } from '@aws-sdk/client-s3';
const multerS3 = require('multer-s3');


// Routers
import authRouter from './routers/authRouter';
import userRouter from './routers/userRouter';

// Middlewares
import verifyJWT from './middlewares/verifyJWT';

// Models
import UserModel from './models/User';
import MessageModel from './models/Message';


interface UserSocketMap {
    [userId: string]: string; // Maps userId to socketId
};


// AWS config
const s3Client = new S3Client({
    region: 'us-east-1',
    credentials: {
        accessKeyId: "",
        secretAccessKey: ""
    },
});


// Multer
const upload = multer({
    storage: multerS3({
        s3: s3Client,
        bucket: 'chat-app-bucket-test',
        metadata: function (req: any, file: any, cb: any) {
            cb(null, { fieldName: file.fieldname });
        },
        key: function (req: any, file: any, cb: any) {
            cb(null, Date.now().toString() + '-' + file.originalname);
        }
    })
});


const PORT: string = process.env.PORT || "8080";
const DB_URL: string = process.env.DB_URL || "mongodb://localhost:27017/ChatAppDatabase";


// Connecting to MongoDB Database
mongoose.connect(DB_URL)
    .then(() => {
        console.log("MongoDB Connection Success");
    })
    .catch((err) => {
        console.log(err.message);
    });


// Express Application
const app = express();


// Middlewares
app.use(
    cors({
        origin: process.env.FRONT_URL || "http://localhost:3000",
        credentials: true,
    })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());


// Routes
app.use('/auth', authRouter);
app.use('/user', userRouter);

app.post('/upload', verifyJWT, upload.single('userFile'), (req: any, res) => {
    console.log("File: ", req.file);
    if (!req.file) {
        return res.status(400).json({
            error: "No File Uploaded"
        });
    }
    return res.status(200).json({
        fileUrl: req.file.location,
        fileType: req.file.mimetype.split('/')[0],
    });
});

app.get('/test', (req, res) => {
    console.log(req.body)
    res.json({
        "Test": "OK"
    });
});

app.get('/', (req, res) => {
    res.send("Chat Application Backend");
});


const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true,
    },
    cookie: true,
});


const userSocketMap: UserSocketMap = {};


const getSocketIdForUserId = (userId: string) => {
    return userSocketMap[`${ userId }`];
};


// Socket Connection
io.on("connection", (socket: Socket) => {
    const accessToken: string = socket.request.headers.authorization?.split(' ')[1] || "";

    console.log("Socket Connected: ", accessToken);
    
    socket.on("registerUser", (data) => {
        const { userId } = data;
        userSocketMap[`${userId}`] = socket.id;
        console.log("User registered: ", userSocketMap);
        io.emit('updateOnlineStatus', Object.keys(userSocketMap));
    });

    socket.on("unRegisterUser", (data) => {
        const { userId } = data;
        delete userSocketMap[`${userId}`];
        console.log("User unRegistered: ", userSocketMap);
        io.emit('updateOnlineStatus', Object.keys(userSocketMap));
    });
    
    socket.on("friendAdded", (data) => {
        const { senderUserId, receiverUserId } = data;

        const senderUserSocketId = getSocketIdForUserId(senderUserId);
        const receiverUserSocketId = getSocketIdForUserId(receiverUserId);

        // if (senderUserSocketId) {
        //     io.to(senderUserSocketId).emit('serverFriendAdded');
        // }

        if (receiverUserSocketId) {
            io.to(receiverUserSocketId).emit('serverFriendAdded');
        }

        console.log("Friend Added");
    });
    
    socket.on("friendDeleted", (data) => {
        const { senderUserId, receiverUserId } = data;

        // const senderUserSocketId = getSocketIdForUserId(senderUserId);
        const receiverUserSocketId = getSocketIdForUserId(receiverUserId);

        // if (senderUserSocketId) {
        //     io.to(senderUserSocketId).emit('serverFriendDeleted');
        // }

        if (receiverUserSocketId) {
            io.to(receiverUserSocketId).emit('serverFriendDeleted');
        }

        console.log("Friend Deleted");
    });

    socket.on('typing', ({ userId, friendId }) => {
        console.log("TYPING");
        const friendSocketId = getSocketIdForUserId(friendId);
        if (friendSocketId) {
            io.to(friendSocketId).emit('typing', { userId });
        }
    });

    socket.on('stopTyping', ({ userId, friendId }) => {
        console.log("STOP TYPING");
        const friendSocketId = getSocketIdForUserId(friendId);
        if (friendSocketId) {
            io.to(friendSocketId).emit('stopTyping', { userId });
        }
    });

    socket.on("sendMessage", async ({ senderUserId, receiverUserId, content, fileType, fileUrl }) => {
        console.log(senderUserId, receiverUserId, content, fileType, fileUrl);
        try {
            const sender = await UserModel.findById(senderUserId).exec();
            const receiver = await UserModel.findById(receiverUserId).exec();

            console.log(sender);
            console.log(receiver);
            console.log(sender?.friends.includes(receiverUserId));
            console.log(receiver?.friends.includes(senderUserId));
    
            if (!sender || !receiver || !sender.friends.includes(receiverUserId) || !receiver.friends.includes(senderUserId)) {
                console.log('Users are not friends, or something else went wrong');
                socket.emit('error', 'Users are not friends');
                return;
            }
    
            const message = new MessageModel({
                senderUserId,
                receiverUserId,
                content,
                fileType,
                fileUrl
            });
            await message.save();
    
            const senderSocketId = getSocketIdForUserId(senderUserId);
            const receiverSocketId = getSocketIdForUserId(receiverUserId);
    
            if (senderSocketId) {
                io.to(senderSocketId).emit('receiveMessage', message);
            }
    
            if (receiverSocketId) {
                io.to(receiverSocketId).emit('receiveMessage', message);
            }
        } catch (error) {
            console.log('Error sending message: ', error);
            socket.emit('error', 'Failed to send message');
        }
    });

    socket.on("loadConversations", async ({ userId, friendId }) => {
        try {
            const user = await UserModel.findById(userId).exec();
            if (!user || !user.friends.includes(friendId)) {
                console.log('Cannot load conversations because users are not friends');
                socket.emit('error', 'Users are not friends');
                return;
            }

            const conversations = await MessageModel.find({
                $or: [
                    { senderUserId: userId, receiverUserId: friendId },
                    { senderUserId: friendId, receiverUserId: userId },
                ]
            }).sort({ timestamp: 1 });

            socket.emit('conversations', conversations);
        } catch (error) {
            console.error('Error loading conversations:', error);
            socket.emit('error', 'Failed to load conversations');
        }
    });
    
    socket.on("disconnect", () => {
        console.log("Socket Disconnected: ", accessToken);
        io.emit('updateOnlineStatus', Object.keys(userSocketMap));
    });
});


// Start the Server
server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});