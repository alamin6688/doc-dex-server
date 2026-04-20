import { askOpenRouter } from "../../helper/openRouterClient";
import { MEDICAL_SYSTEM_PROMPT } from "./chat.constants";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

// Upgraded to gpt-4o-mini for significantly better recognition of regional brand names
const CHAT_MODEL = "openai/gpt-4o-mini";

/**
 * Sends the conversation to OpenRouter (Claude) and returns the AI reply.
 *
 * OpenRouter uses the OpenAI chat-completions format: the system prompt is
 * injected as the first message with role "system", followed by the
 * alternating user/assistant history, then the new user turn.
 */
const sendMessage = async (
  message: string,
  history: ChatMessage[] = []
): Promise<string> => {
  const messages = [
    { role: "system", content: MEDICAL_SYSTEM_PROMPT },
    ...history
      .filter((m) => (m.role === "user" || m.role === "assistant") && m.content)
      .map((m) => ({ role: m.role, content: m.content })),
    { role: "user", content: message },
  ];

  const reply = await askOpenRouter(messages, CHAT_MODEL);
  return reply;
};

export const ChatService = { sendMessage };

