import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";
import { openai } from "../lib/openai.js";
import fetch from "node-fetch";

export const getUsersForSidebar = async (req, res) => {
    try {
        const loggedInUserId = req.user._id;
        const filteredUsers = await User.find({ _id: { $ne: loggedInUserId } }).select("-password");
        res.status(200).json(filteredUsers);
    }
    catch (err) {
        console.log("Error in getUsersForSidebar controller", err.message);

        res.status(500).json({ message: "Internal Server Error" })
    }
};

export const getMessages = async (req, res) => {
    try {
        const { id: userToChatId } = req.params;
        const myId = req.user._id;

        const messages = await Message.find({
            $or: [
                { senderId: myId, receiverId: userToChatId },
                { senderId: userToChatId, receiverId: myId }
            ]
        })

        res.status(200).json(messages);
    }
    catch (err) {
        console.log("Error in getMessages controller", err.message);

        res.status(500).json({ message: "Internal Server Error" })
    }
};

export const sendMessage = async (req, res) => {
    try {
        const { text, image } = req.body;
        const { id: receiverId } = req.params;
        const senderId = req.user._id;

        let imageUrl;
        if (image) {
            // upload base64 image to cloudinary
            const uploadResponse = await cloudinary.uploader.upload(image);
            imageUrl = uploadResponse.secure_url;
        }

        const newMessage = new Message({
            senderId,
            receiverId,
            text,
            image: imageUrl,
        })

        await newMessage.save();

        // todo: realtime functionality -> socket.io

        const receiverSocketId = getReceiverSocketId(receiverId);
        if (receiverSocketId) {
            io.to(receiverSocketId).emit("newMessage", newMessage);
        }

        res.status(201).json(newMessage);
    }
    catch (err) {
        console.log("Error in sendMessage controller", err.message);

        res.status(500).json({ message: "Internal Server Error" })
    }
}


export const getAiSuggestedReplies = async (req, res) => {
    const { message } = req.body;

    try {
        const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                model: "gpt-4o", // or gpt-3.5-turbo
                messages: [
                    {
                        role: "system",
                        content: "You are an assistant suggesting 2-3 short and helpful replies for a chat message.",
                    },
                    {
                        role: "user",
                        content: `Give 3 smart replies to: "${message}"`,
                    },
                ],
            }),
        });

        const data = await openaiRes.json();
        const rawReply = data.choices?.[0]?.message?.content || "";

        const replies = rawReply
            .split("\n")
            .map((line) => line.replace(/^\d+\.\s*/, "").trim())
            .filter(Boolean);

        res.json({ replies });
    } catch (err) {
        console.error("AI Suggest Error:", err.message);
        res.status(500).json({ error: "Failed to get AI suggestions" });
    }
};

export const getChatSummary = async (req, res) => {
    const { id: otherUserId } = req.params;
    const userId = req.user._id;

    const messages = await Message.find({
        $or: [
            { senderId: userId, receiverId: otherUserId },
            { senderId: otherUserId, receiverId: userId }
        ]
    }).sort({ createdAt: 1 });

    const textOnly = messages
        .filter((msg) => msg.text)
        .map((m) => `${m.senderId.equals(userId) ? "Me" : "User"}: ${m.text}`)
        .join("\n");

    const prompt = `Summarize this chat in 4-5 bullet points:\n${textOnly}`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
    });

    res.json({ summary: response.choices[0].message.content });
};

export const translateMessage = async (req, res) => {
    const { text, targetLang } = req.body;

    const prompt = `Translate the following message to ${targetLang}:\n${text}`;

    const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
    });

    res.json({ translated: response.choices[0].message.content });
};


export const detectEmotion = async (req, res) => {
    try {
        const { text } = req.body;

        const prompt = `Detect the sentiment of this message and return a single emoji that best represents it. Examples: happy 😄, angry 😡, sad 😢, love ❤️, neutral 😐. Message: "${text}"`;

        const chatResponse = await openai.chat.completions.create({
            messages: [{ role: "user", content: prompt }],
            model: "gpt-3.5-turbo",
        });

        const emoji = chatResponse.choices[0].message.content.trim();
        res.status(200).json({ emoji });
    } catch (err) {
        console.error("Emotion detection error:", err.message);
        res.status(500).json({ message: "Emotion detection failed." });
    }
};
