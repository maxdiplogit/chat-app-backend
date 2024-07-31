import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Models
import UserModel from '../../models/User';


const loginUser = async(req: any, res: any, next: any) => {
    const { email, password } = req.body;
    const foundUser = await UserModel.findOne({ email }).exec();
    const allUsers = await UserModel.find({}).exec();

    const foundUserFriends = allUsers.filter((user) => foundUser?.friends.includes(user._id));

    // If user does not exist
    if (!foundUser) {
        return res.status(401).json({
            error: `${ email } doesn't exist`,
        });
    }

    const match = await bcrypt.compare(password, foundUser.password);

    // If passwords match
    if (match) {
        // Generate access token for user
        const accessToken = jwt.sign({
            userInfo: {
                id: foundUser._id,
                email: foundUser.email,
            }
        }, process.env.ACCESS_TOKEN_SECRET || "some_secret", {
            expiresIn: '20m'
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            sameSite: 'strict',
            secure: process.env.NODE_ENV === "production",
        });

        return res.status(200).json({
            _id: foundUser.id,
            firstName: foundUser.firstName || "",
            lastName: foundUser.lastName || "",
            email: foundUser.email,
            friends: foundUserFriends,
            allUsers,
            accessToken
        });
    }

    return res.status(401).json({
        error: `Incorrect password`
    });
};


export default loginUser;