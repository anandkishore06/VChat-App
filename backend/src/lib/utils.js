import jwt from "jsonwebtoken";

export const generateToken = async (userId, res) => {
    const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
        expiresIn: "7d"
    })

    res.cookie("token", token, {
        maxAge: 7 * 24 * 60 * 1000,
        httpOnly: true,
        sameSite: "None",
        secure: process.env.NODE_ENV !== "development"
    });

    return token;
}