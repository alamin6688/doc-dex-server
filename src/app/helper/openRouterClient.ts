import axios from "axios";
import config from "../../config";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Sends messages to OpenRouter and returns the assistant's reply text.
 *
 * @param messages - OpenAI-compatible message array (role + content)
 * @param model    - OpenRouter model slug. Defaults to gpt-3.5-turbo so
 *                   existing callers (e.g. doctor suggestion) are unaffected.
 *                   Pass "anthropic/claude-sonnet-4" for the medical chatbot.
 */
export const askOpenRouter = async (
  messages: { role: string; content: string }[],
  model = "openai/gpt-3.5-turbo"
): Promise<string> => {
  if (!config.openRouterApiKey) {
    console.error("OpenRouter Error: API Key is missing in config");
    throw new Error("AI service configuration error");
  }

  // Debug Key Presence (Safe)
  const key = config.openRouterApiKey as string;
  console.log(
    `Using OpenRouter Key: ${key.slice(0, 10)}...${key.slice(-4)} (Length: ${key.length})`
  );

  try {
    const response = await axios.post(
      OPENROUTER_API_URL,
      { model, messages },
      {
        headers: {
          Authorization: `Bearer ${config.openRouterApiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": config.clientUrl || "http://localhost:3000",
          "X-Title": "DocDex",
        },
      }
    );

    if (!response.data?.choices?.[0]?.message?.content) {
      console.error("OpenRouter Error: Invalid response format", response.data);
      throw new Error("Invalid response format from OpenRouter");
    }

    return response.data.choices[0].message.content as string;
  } catch (error: any) {
    console.error(
      "OpenRouter Request Failed for model:",
      model,
      error.response?.data || error.message
    );

    // Fallback if the specific model failed but it wasn't an auth/config error
    if (model !== "openai/gpt-3.5-turbo" && error.response?.status !== 401) {
      console.log("Attempting fallback to gpt-3.5-turbo...");
      return askOpenRouter(messages, "openai/gpt-3.5-turbo");
    }

    throw error;
  }
};
