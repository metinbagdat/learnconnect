/**
 * Unified AI Provider Service with Smart Fallback Logic
 * Supports: OpenAI (Replit AI) → Anthropic (Replit AI) → OpenRouter (includes DeepSeek)
 */

import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";

type AIProvider = "openai" | "anthropic" | "openrouter";
type AIModel = "gpt-4o-mini" | "gpt-3.5-turbo" | "claude-opus-4-1" | "claude-sonnet-4-20250514" | "deepseek-chat";

interface AICallOptions {
  prompt?: string;
  messages?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  systemPrompt?: string;
  model?: AIModel;
  maxTokens?: number;
  temperature?: number;
  jsonMode?: boolean;
}

interface AIResponse {
  content: string;
  provider: AIProvider;
  model: string;
}

/**
 * Call AI with automatic provider fallback
 * Tries: OpenAI → Anthropic → OpenRouter (DeepSeek)
 */
export async function callAIWithFallback(options: AICallOptions): Promise<AIResponse> {
  const {
    prompt,
    messages = [],
    systemPrompt,
    model = "gpt-4o-mini",
    maxTokens = 2000,
    temperature = 0.7,
    jsonMode = false,
  } = options;

  // Try OpenAI first (Replit AI)
  if (process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
    try {
      const openai = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      });

      const messageList = messages.length > 0 ? messages : [{ role: "user" as const, content: prompt || "" }];

      const response = await openai.chat.completions.create({
        model: model === "gpt-4o-mini" || model === "gpt-3.5-turbo" ? model : "gpt-4o-mini",
        messages: messageList as any,
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode && { response_format: { type: "json_object" } }),
      });

      const content = response.choices[0]?.message?.content || "";
      return {
        content,
        provider: "openai",
        model: model === "gpt-4o-mini" || model === "gpt-3.5-turbo" ? model : "gpt-4o-mini",
      };
    } catch (error: any) {
      console.warn("[AI] OpenAI failed, trying Anthropic:", error.message);
    }
  }

  // Try Anthropic (Replit AI)
  if (process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY) {
    try {
      const anthropic = new Anthropic({
        apiKey: process.env.AI_INTEGRATIONS_ANTHROPIC_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_ANTHROPIC_BASE_URL,
      });

      const messageList =
        messages.length > 0
          ? messages.filter((m) => m.role !== "system")
          : [{ role: "user" as const, content: prompt || "" }];

      const response = await anthropic.messages.create({
        model: model === "claude-opus-4-1" || model === "claude-sonnet-4-20250514" ? model : "claude-opus-4-1",
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt || (messages.find((m) => m.role === "system")?.content || ""),
        messages: messageList as any,
      });

      const content =
        response.content[0] && "text" in response.content[0] ? response.content[0].text : "";
      return {
        content,
        provider: "anthropic",
        model: model === "claude-opus-4-1" || model === "claude-sonnet-4-20250514" ? model : "claude-opus-4-1",
      };
    } catch (error: any) {
      console.warn("[AI] Anthropic failed, trying OpenRouter:", error.message);
    }
  }

  // Fallback to OpenRouter (includes DeepSeek)
  if (process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY) {
    try {
      const openrouter = new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENROUTER_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENROUTER_BASE_URL || "https://openrouter.ai/api/v1",
      });

      const messageList = messages.length > 0 ? messages : [{ role: "user" as const, content: prompt || "" }];

      const response = await openrouter.chat.completions.create({
        model: model === "deepseek-chat" ? "deepseek/deepseek-chat" : "deepseek/deepseek-chat",
        messages: messageList as any,
        max_tokens: maxTokens,
        temperature,
        ...(jsonMode && { response_format: { type: "json_object" } }),
      });

      const content = response.choices[0]?.message?.content || "";
      return {
        content,
        provider: "openrouter",
        model: "deepseek-chat",
      };
    } catch (error: any) {
      console.warn("[AI] OpenRouter failed:", error.message);
    }
  }

  throw new Error(
    "All AI providers unavailable. Please set up at least one: OpenAI, Anthropic, or OpenRouter integration."
  );
}

/**
 * Parse JSON response safely with fallback
 */
export function parseAIJSON(content: string, fallback: any = {}) {
  try {
    // Try direct JSON parse
    return JSON.parse(content);
  } catch {
    // Try extracting JSON from markdown code blocks
    const jsonMatch =
      content.match(/```json\n([\s\S]*?)\n```/) ||
      content.match(/```\n([\s\S]*?)\n```/) ||
      content.match(/{[\s\S]*}/);

    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } catch {
        return fallback;
      }
    }

    return fallback;
  }
}
