import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { ConnectDB } from "./lib/db.js";
import cors from "cors";
import { app, server } from "./lib/socket.js";
import path from "path";

dotenv.config();

const PORT = process.env.PORT;
const __dirname = path.resolve();

app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.NODE_ENV === "production"
        ? ["https://vchat-app-6.onrender.com", "https://vchatappl.onrender.com"]
        : "http://localhost:5173",
    credentials: true
}));


app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, "../frontend/dist")));
    console.log("Before *");

    app.get("/{*}", (req, res) => {
        res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
    });
    console.log("After *");

}

ConnectDB().then(() => {
    server.listen(PORT, () => {
        console.log("Server is listening at port: " + PORT);

    })
})
