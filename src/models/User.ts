import mongoose from 'mongoose';
import validator from 'validator';


const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
    },
    lastName: {
        type: String,
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: [true, "Email already exists"],
        validate: [validator.isEmail, "Invalid Email"],
    },
    password: {
        type: String,
        required: [true, "Password is required"],
    },
    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        }
    ],
}, {
    timestamps: true,
});


const UserModel = mongoose.model('User', userSchema);

export default UserModel;