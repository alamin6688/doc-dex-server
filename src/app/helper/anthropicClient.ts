import axios from "axios";
import config from "../../config";
import ApiError from "../errors/ApiError";
import httpStatus from "http-status";

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";
const DEFAULT_MAX_TOKENS = 1024;

export type AnthropicMessage = {
  role: "user" | "assistant";
  content: string;
};

type AskAnthropicOptions = {
  systemPrompt: string;
  messages: AnthropicMessage[];
  model?: string;
  maxTokens?: number;
};

/**
 * Sends a conversation to the Anthropic Messages API and returns the reply text.
 * The API key is read exclusively from the server-side config — never exposed to the client.
 */
export const askAnthropic = async ({
  systemPrompt,
  messages,
  model = DEFAULT_MODEL,
  maxTokens = DEFAULT_MAX_TOKENS,
}: AskAnthropicOptions): Promise<string> => {
  if (!config.anthropicApiKey) {
    throw new ApiError(
      httpStatus.INTERNAL_SERVER_ERROR,
      "Anthropic API key is not configured on the server."
    );
  }

  const response = await axios.post(
    ANTHROPIC_API_URL,
    {
      model,
      max_tokens: maxTokens,
      system: systemPrompt,
      messages,
    },
    {
      headers: {
        "x-api-key": config.anthropicApiKey,
        "anthropic-version": ANTHROPIC_VERSION,
        "Content-Type": "application/json",
      },
    }
  );

  const reply: string = response.data.content?.[0]?.text ?? "";
  return reply;
};
