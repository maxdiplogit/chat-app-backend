import jwt from 'jsonwebtoken';


const verifyJWT = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization || req.headers.Authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'JWT accessToken missing from request headers' });
    }

    const accessToken = authHeader.split(' ')[1];

    if (accessToken === "") {
        return res.status(401).json({
            error: "JWT accessToken not provided"
        });
    }

    console.log("\n\n\nverifyJWT AccessToken: ", accessToken, "\n\n\n");

    jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET || "some_secret",
        (err: any, decoded: any) => {
            if (err) {
                return res.status(403).json({
                    error: "JWT accessToken invalid"
                });
            }
            req.user = {
                id: decoded.userInfo.id,
                email: decoded.userInfo.email,
            };
            next();
        }
    );
};


export default verifyJWT;