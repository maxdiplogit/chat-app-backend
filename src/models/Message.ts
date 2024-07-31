import mongoose from "mongoose";


const messageSchema = new mongoose.Schema({
    senderUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    content: {
        type: String,
    },
    fileType: {
        type: String,
    },
    fileUrl: {
        type: String,
    },
    timestamp: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true,
});


const MessageModel = mongoose.model('Message', messageSchema);

export default MessageModel;