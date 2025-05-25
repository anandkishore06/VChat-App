import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
    try {
        const token = req.cookies.token;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized - No Token Provided" })
        }

        const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

        if (!decodedToken) {
            return res.status(401).json({ message: "Unauthorized - Token is invalid" })
        }

        const user = await User.findById(decodedToken.userId).select("-password");

        if (!user) {
            return res.status(404).json({ message: "User not found" })
        }

        req.user = user;
        next();
    }
    catch (err) {
        console.log("Error in ProtectRpute controller", err.message);

        res.status(500).json({ message: "Internal Server Error" })
    }
}