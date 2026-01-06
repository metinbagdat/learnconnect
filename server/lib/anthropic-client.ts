import Anthropic from "@anthropic-ai/sdk";
import { logger } from "../utils/logger.js";

/**
 * Shared Anthropic client used across server services.
 * Ensures API key and model are present at process start.
 */

const rawApiKey = process.env.ANTHROPIC_API_KEY?.trim();
if (!rawApiKey) {
  logger.error(
    "[AnthropicClient] ANTHROPIC_API_KEY is required but not set in environment",
    undefined,
    { module: "AnthropicClient", action: "init" }
  );
  // We throw here so that server fails fast in environments where Anthropic is mandatory.
  throw new Error("ANTHROPIC_API_KEY is required but not set");
}

export const ANTHROPIC_MODEL =
  process.env.ANTHROPIC_MODEL?.trim() || "claude-3-5-sonnet-20241022";

export const anthropic = new Anthropic({
  apiKey: rawApiKey,
});

export function getAnthropicClient(): Anthropic {
  if (!anthropic) {
    // This should never happen because we construct eagerly above,
    // but keep a defensive check for TypeScript / future refactors.
    throw new Error("Anthropic client not initialized");
  }
  return anthropic;
}


