/**
 * Groq API client - free tier, 30 req/min.
 * Use when GROQ_API_KEY is set; falls back to OpenAI otherwise.
 */
import Groq from 'groq-sdk';

let _client = null;

export function getGroqClient() {
  const key = process.env.GROQ_API_KEY;
  if (!key) return null;
  if (!_client) _client = new Groq({ apiKey: key });
  return _client;
}

export function hasGroq() {
  return !!process.env.GROQ_API_KEY;
}

/**
 * Call Groq chat completion. Returns { content, model } or null on failure.
 * Models: llama-3.1-70b-versatile, llama-3.1-8b-instant, mixtral-8x7b-32768
 */
export async function groqChat(options) {
  const {
    prompt,
    messages = [],
    system,
    model = 'llama-3.1-8b-instant',
    maxTokens = 2000,
    temperature = 0.7,
    jsonMode = false,
  } = options;

  const client = getGroqClient();
  if (!client) return null;

  try {
    const messageList = messages.length > 0
      ? messages
      : [{ role: 'user', content: prompt || '' }];
    if (system) {
      messageList.unshift({ role: 'system', content: system });
    }

    const response = await client.chat.completions.create({
      model,
      messages: messageList,
      max_tokens: maxTokens,
      temperature,
      ...(jsonMode && { response_format: { type: 'json_object' } }),
    });

    const content = response.choices?.[0]?.message?.content || '';
    return { content, model: response.model };
  } catch (err) {
    console.error('[groq-client]', err);
    return null;
  }
}
