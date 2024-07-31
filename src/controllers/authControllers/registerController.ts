import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Models
import UserModel from '../../models/User';


const registerUser = async(req: any, res: any, next: any) => {
    const { firstName, lastName, email, password } = req.body;

    // Check for duplicate users
    const duplicate = await UserModel.findOne({ email }).exec();
    if (duplicate) {
        return res.status(409).json({
            error: `User with email: ${ email } already exists. Instead try logging in.`
        });
    }

    // Encrypt password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create and store the new user
    const newUser = new UserModel({ firstName, lastName, email, password: hashedPassword });
    await newUser.save();
    console.log(`NewUser created: ${ newUser }`);
    return res.status(201).json(newUser);
};


export default registerUser;