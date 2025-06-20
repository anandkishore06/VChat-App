// import express from "express";
// import authRoutes from "./routes/auth.route.js";
// import messageRoutes from "./routes/message.route.js";
// import dotenv from "dotenv";
// import cookieParser from "cookie-parser";
// import { ConnectDB } from "./lib/db.js";
// import cors from "cors";
// import { app, server } from "./lib/socket.js";
// import path from "path";

// dotenv.config();

// const PORT = process.env.PORT;
// const __dirname = path.resolve();

// app.use(express.json({ limit: '10mb' }));
// app.use(cookieParser());
// app.use(cors({
//     origin: "http://localhost:5173",
//     credentials: true
// }))

// app.use("/api/auth", authRoutes);
// app.use("/api/messages", messageRoutes);

// if (process.env.NODE_ENV === "production") {
//     app.use(express.static(path.join(__dirname, "../frontend/dist")));

//     app.get("/*", (req, res) => {
//         res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
//     });
// }

// ConnectDB().then(() => {
//     server.listen(PORT, () => {
//         console.log("Server is listening at port: " + PORT);

//     })
// })

import express from "express";
import authRoutes from "./routes/auth.route.js";
import messageRoutes from "./routes/message.route.js";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { ConnectDB } from "./lib/db.js";
import cors from "cors";
import { app, server } from "./lib/socket.js";
import path from "path";
// For ES Modules, we need to explicitly get __dirname
import { fileURLToPath } from 'url';
import { dirname } from 'path';

dotenv.config();

const PORT = process.env.PORT || 5000;

// Get __filename and __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const currentModuleDir = dirname(__filename); // This will be /opt/render/project/src/backend/src/

// Determine the project root based on your structure
// If index.js is in /backend/src/, then project root is two levels up
const projectRoot = path.join(currentModuleDir, '..', '..'); // Points to /opt/render/project/src/

console.log('--- Debugging Paths ---');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Current Module Directory (__dirname from import.meta.url):', currentModuleDir);
console.log('Calculated Project Root:', projectRoot);
console.log('--- End Debugging Paths ---');


app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(cors({
    origin: process.env.NODE_ENV === "production"
        ? "https://vchatappl.onrender.com" // Use your actual Render URL here
        : "http://localhost:5173",
    credentials: true
}));

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);

if (process.env.NODE_ENV === "production") {
    const frontendDistPath = path.join(projectRoot, "frontend", "dist");

    console.log('--- Production Path Check ---');
    console.log('Attempting to serve static files from:', frontendDistPath);
    console.log('Attempting to send index.html from:', path.join(frontendDistPath, "index.html"));
    console.log('--- End Production Path Check ---');

    app.use(express.static(frontendDistPath));

    app.get("/*", (req, res) => {
        res.sendFile(path.join(frontendDistPath, "index.html"));
    });
} else {
    console.log('Not in production, skipping static file serving.');
}


ConnectDB().then(() => {
    server.listen(PORT, () => {
        console.log("Server is listening at port: " + PORT);
    });
}).catch(err => {
    console.error("Failed to connect to DB or start server:", err);
});