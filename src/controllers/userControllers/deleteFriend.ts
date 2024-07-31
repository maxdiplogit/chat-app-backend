import mongoose from "mongoose";

// Models
import UserModel from "../../models/User";
import MessageModel from "../../models/Message";


const deleteFriend = async(req: any, res: any, next: any) => {
    const { id: senderUserId } = req.user;
    const { receiverUserId } = req.body;

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

    // Check if they are not friends in the first place

    senderUser.friends = senderUser.friends.filter((id: mongoose.Types.ObjectId) => !id.equals(receiverUser._id));
    receiverUser.friends = receiverUser.friends.filter((id: mongoose.Types.ObjectId) => !id.equals(senderUser._id));

    await senderUser.save();
    await receiverUser.save();

    await MessageModel.deleteMany({ senderUserId: senderUser._id, receiverUserId: receiverUser._id });
    await MessageModel.deleteMany({ receiverUserId: senderUser._id, senderUserId: receiverUser._id });

    const allUsers = await UserModel.find({}).exec();
    const senderUserFriends = allUsers.filter((user) => senderUser.friends.includes(user._id));
    console.log("Delete SenderUserFriends: ", senderUserFriends);

    return res.status(200).json({
        friends: senderUserFriends,
    });
};


export default deleteFriend;