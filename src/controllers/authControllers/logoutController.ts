import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Models
import UserModel from '../../models/User';


const logoutUser = async(req: any, res: any, next: any) => {
    res.clearCookie('accessToken', {
        httpOnly: true,
        sameSite: 'strict',
        secure: process.env.NODE_ENV === "production",
    });

    return res.status(200).json({
        message: "Logged Out Successfully"
    });
};


export default logoutUser;