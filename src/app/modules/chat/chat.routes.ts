import express from "express";
import { ChatController } from "./chat.controller";

const router = express.Router();

/**
 * POST /api/v1/chat
 *
 * Public endpoint — no auth middleware required because the chatbot is
 * accessible to unauthenticated visitors on the landing page.
 * The API key lives server-side only (see config/index.ts).
 *
 * If you want to restrict this to logged-in users, add:
 *   auth(UserRole.PATIENT, UserRole.DOCTOR, ...)
 * before ChatController.chat.
 */
router.post("/", ChatController.chat);

export const ChatRoutes = router;
