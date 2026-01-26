/**
 * AYT AIReasoningEngine – curriculum, learning tree, study plan generation
 * Uses callAIWithFallback (OpenAI / Anthropic / OpenRouter) and ayt-prompts.
 */

import { callAIWithFallback, parseAIJSON } from "../ai-provider-service.js";
import {
  AYT_CURRICULUM,
  getLearningTreePrompts,
  getStudyPlanPrompts,
} from "../../api/prompts/ayt-prompts.js";

const MODEL = (process.env.AI_AYT_MODEL?.trim() ||
  process.env.AI_INTEGRATIONS_OPENAI_MODEL?.trim()) as string | undefined;
const DEFAULT_MODEL = "gpt-4o-mini";

function modelOrDefault(): string {
  return MODEL || DEFAULT_MODEL;
}

export interface AYTSubject {
  title: string;
  description: string;
  topics: Array<{
    title: string;
    estimatedHours: number;
    difficulty: "easy" | "medium" | "hard";
  }>;
}

export interface AYTCurriculumResult {
  subjects: AYTSubject[];
}

export interface LearningTreeSubtopic {
  title: string;
  prerequisites: string[];
  outcomes: string[];
}

export interface LearningTreeResult {
  topic: string;
  subtopics: LearningTreeSubtopic[];
}

export interface StudyPlanDay {
  day: number;
  focus: string;
  tasks: string[];
}

export interface StudyPlanResult {
  topic: string;
  totalDays: number;
  dailyPlan: StudyPlanDay[];
}

/**
 * 1) AYT Müfredat Üretimi – full AYT curriculum (subjects + topics)
 */
export async function generateAYTCurriculum(): Promise<AYTCurriculumResult> {
  const { content } = await callAIWithFallback({
    messages: [
      { role: "system", content: AYT_CURRICULUM.system },
      { role: "user", content: AYT_CURRICULUM.user },
    ],
    model: modelOrDefault() as any,
    maxTokens: 4000,
    temperature: 0.3,
    jsonMode: true,
  });

  const parsed = parseAIJSON(content, { subjects: [] }) as AYTCurriculumResult;
  if (!parsed.subjects || !Array.isArray(parsed.subjects)) {
    throw new Error("AI response missing or invalid 'subjects' array");
  }
  return parsed;
}

/**
 * 2) Konu → Alt konu → Kazanım ağacı
 */
export async function generateLearningTree(
  topicTitle: string,
  subject: string = "AYT Matematik"
): Promise<LearningTreeResult> {
  const { system, user } = getLearningTreePrompts(topicTitle, subject);

  const { content } = await callAIWithFallback({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    model: modelOrDefault() as any,
    maxTokens: 3000,
    temperature: 0.4,
    jsonMode: true,
  });

  const parsed = parseAIJSON(content, { topic: topicTitle, subtopics: [] }) as LearningTreeResult;
  if (!Array.isArray(parsed.subtopics)) {
    throw new Error("AI response missing or invalid 'subtopics' array");
  }
  return { ...parsed, topic: parsed.topic || topicTitle };
}

/**
 * 3) Her konuya AI çalışma planı
 */
export async function generateStudyPlan(
  topicTitle: string,
  estimatedHours: number = 8,
  studentLevel: string = "orta",
  dailyHours: number = 2
): Promise<StudyPlanResult> {
  const { system, user } = getStudyPlanPrompts(
    topicTitle,
    estimatedHours,
    studentLevel,
    dailyHours
  );

  const { content } = await callAIWithFallback({
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
    model: modelOrDefault() as any,
    maxTokens: 2000,
    temperature: 0.5,
    jsonMode: true,
  });

  const parsed = parseAIJSON(content, {
    topic: topicTitle,
    totalDays: 1,
    dailyPlan: [],
  }) as StudyPlanResult;
  if (!Array.isArray(parsed.dailyPlan)) {
    throw new Error("AI response missing or invalid 'dailyPlan' array");
  }
  return {
    ...parsed,
    topic: parsed.topic || topicTitle,
    totalDays: parsed.totalDays ?? parsed.dailyPlan.length,
  };
}
