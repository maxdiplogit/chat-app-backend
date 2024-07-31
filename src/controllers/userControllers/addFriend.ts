// Models
import UserModel from "../../models/User";


const addFriend = async(req: any, res: any, next: any) => {
    const { id: senderUserId } = req.user;
    const { receiverUserId } = req.body;
    console.log(receiverUserId);

    const senderUser = await UserModel.findOne({ _id: senderUserId }).exec();
    const receiverUser = await UserModel.findOne({ _id: receiverUserId }).exec();

    if (senderUser === null) {
        return res.status(404).json({
            error: "Sender user not found"
        });
    }

    if (receiverUser === null) {
        return res.status(404).json({
            error: "Receiver user not found"
        });
    }

    // Check if they are already friends with each other

    senderUser.friends.push(receiverUser._id);
    receiverUser.friends.push(senderUser._id);

    
    await senderUser.save();
    await receiverUser.save();
    
    const allUsers = await UserModel.find({}).exec();
    const senderUserFriends = allUsers.filter((user) => senderUser.friends.includes(user._id));
    console.log("Add SenderUserFriends: ", senderUserFriends);

    return res.status(200).json({
        friends: senderUserFriends,
    });
};


export default addFriend;