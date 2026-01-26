/**
 * AYT AIReasoningEngine – API layer (Vercel serverless)
 * Uses OpenAI + ayt-prompts; mirrors server/ai/ayt-curriculum-engine logic.
 */

import {
  AYT_CURRICULUM,
  getLearningTreePrompts,
  getStudyPlanPrompts,
} from '../prompts/ayt-prompts.js';

const OPENAI_API_KEY =
  process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const MODEL = process.env.AI_AYT_MODEL || process.env.AI_INTEGRATIONS_OPENAI_MODEL || 'gpt-4o-mini';

function parseJSON(content, fallback = {}) {
  try {
    return JSON.parse(content);
  } catch {
    const m = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || content.match(/(\{[\s\S]*\})/);
    if (m) {
      try {
        return JSON.parse(m[1] || m[0]);
      } catch {
        return fallback;
      }
    }
    return fallback;
  }
}

async function callAI(messages, temperature = 0.3, maxTokens = 4000) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY or AI_INTEGRATIONS_OPENAI_API_KEY required for AYT engine');
  }
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });
  const res = await openai.chat.completions.create({
    model: MODEL,
    messages,
    temperature,
    max_tokens: maxTokens,
    response_format: { type: 'json_object' },
  });
  return res.choices[0]?.message?.content ?? '';
}

export async function generateAYTCurriculum() {
  const content = await callAI(
    [
      { role: 'system', content: AYT_CURRICULUM.system },
      { role: 'user', content: AYT_CURRICULUM.user },
    ],
    0.3,
    4000
  );
  const parsed = parseJSON(content, { subjects: [] });
  if (!parsed.subjects || !Array.isArray(parsed.subjects)) {
    throw new Error("AI response missing or invalid 'subjects' array");
  }
  return { subjects: parsed.subjects };
}

export async function generateLearningTree(topicTitle, subject = 'AYT Matematik') {
  const { system, user } = getLearningTreePrompts(topicTitle, subject);
  const content = await callAI(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    0.4,
    3000
  );
  const parsed = parseJSON(content, { topic: topicTitle, subtopics: [] });
  if (!Array.isArray(parsed.subtopics)) {
    throw new Error("AI response missing or invalid 'subtopics' array");
  }
  return { topic: parsed.topic || topicTitle, subtopics: parsed.subtopics };
}

export async function generateStudyPlan(
  topicTitle,
  estimatedHours = 8,
  studentLevel = 'orta',
  dailyHours = 2
) {
  const { system, user } = getStudyPlanPrompts(topicTitle, estimatedHours, studentLevel, dailyHours);
  const content = await callAI(
    [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
    0.5,
    2000
  );
  const parsed = parseJSON(content, { topic: topicTitle, totalDays: 1, dailyPlan: [] });
  if (!Array.isArray(parsed.dailyPlan)) {
    throw new Error("AI response missing or invalid 'dailyPlan' array");
  }
  return {
    topic: parsed.topic || topicTitle,
    totalDays: parsed.totalDays ?? parsed.dailyPlan.length,
    dailyPlan: parsed.dailyPlan,
  };
}
