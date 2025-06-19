import express from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import { getMessages, getUsersForSidebar, sendMessage, getAiSuggestedReplies, getChatSummary, translateMessage, detectEmotion } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/users", protectRoute, getUsersForSidebar);
router.get("/:id", protectRoute, getMessages);
router.post("/send/:id", protectRoute, sendMessage);
router.post("/suggest-replies", protectRoute, getAiSuggestedReplies);
router.post("/summary/:id", protectRoute, getChatSummary);
router.post("/translate", protectRoute, translateMessage);
router.post("/detect-emotion", protectRoute, detectEmotion);

export default router;