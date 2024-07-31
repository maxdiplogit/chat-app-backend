import express from 'express';

// Middleware
import verifyJWT from '../middlewares/verifyJWT';

// Router
const authRouter = express.Router();


// Controllers
import registerUser from '../controllers/authControllers/registerController';
import loginUser from '../controllers/authControllers/loginController';
import logoutUser from '../controllers/authControllers/logoutController';


authRouter.route('/register')
    .post(registerUser);
    
authRouter.route('/login')
    .post(loginUser);

authRouter.route('/logout')
    .post(verifyJWT, logoutUser);


export default authRouter;