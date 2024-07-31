// Models
import UserModel from "../../models/User";


const getUsers = async (req: any, res: any, next: any) => {
    const { id } = req.user;
    const foundUser = await UserModel.findById(id).exec();
    const allUsers = await UserModel.find({}).exec();

    const foundUserFriends = allUsers.filter((user) => foundUser?.friends.includes(user._id));

    return res.status(200).json({
        friends: foundUserFriends,
        usersList: allUsers
    });
};


export default getUsers