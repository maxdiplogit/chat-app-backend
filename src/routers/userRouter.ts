import express from 'express';

// Controllers
import addFriend from '../controllers/userControllers/addFriend';
import deleteFriend from '../controllers/userControllers/deleteFriend';
import getFriends from '../controllers/userControllers/getFriends';
import getUsers from '../controllers/userControllers/getUsers';

// Middlewares
import verifyJWT from '../middlewares/verifyJWT';


// Router
const userRouter = express.Router();


userRouter.route('/addFriend')
    .post(verifyJWT, addFriend);

userRouter.route('/deleteFriend')
    .post(verifyJWT, deleteFriend);

userRouter.route('/getFriends')
    .get(verifyJWT, getFriends);

userRouter.route('/getUsersList')
    .get(verifyJWT, getUsers);


export default userRouter;