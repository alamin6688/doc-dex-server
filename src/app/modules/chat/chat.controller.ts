import { Request, Response } from "express";
import httpStatus from "http-status";
import catchAsync from "../../shared/catchAsync";
import sendResponse from "../../shared/sendResponse";
import { ChatService, ChatMessage } from "./chat.service";

/**
 * POST /api/v1/chat
 *
 * Body:
 *   message  string          — the user's current message (required)
 *   history  ChatMessage[]   — previous turns in the conversation (optional)
 */
const chat = catchAsync(async (req: Request, res: Response) => {
  console.log("Chat Request Body:", req.body);
  const { message, history = [] }: { message: string; history: ChatMessage[] } =
    req.body;

  if (!message || typeof message !== "string" || message.trim().length === 0) {
    return res.status(httpStatus.BAD_REQUEST).json({
      success: false,
      message: "A non-empty 'message' string is required.",
    });
  }

  const reply = await ChatService.sendMessage(message.trim(), history);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "AI response generated successfully.",
    data: { reply },
  });
});

export const ChatController = { chat };
