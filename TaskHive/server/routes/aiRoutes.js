import express from "express";
import { suggestTaskTitle } from "../controllers/aiChatController.js";
import { isAuthenticated } from "../middlewares/auth.js";

const router = express.Router();

// Route for AI-powered task title suggestions
// POST /api/v1/ai/suggest-title
router.post("/suggest-title", isAuthenticated, suggestTaskTitle);

export default router;
