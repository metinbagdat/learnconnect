import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { storage } from "./storage.js";
import type { 
  TytSubject, 
  TytTopic, 
  UserTopicProgress,
  TytStudentProfile,
  InsertAiDailyPlan 
} from "../shared/schema.js";
import { UserProfileRow, ExamCategoryRow } from "./types/database.js";

// Initialize AI clients only if API keys are provided
const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
const anthropic = anthropicKey && anthropicKey.length > 0
  ? new Anthropic({
      apiKey: anthropicKey,
    })
  : null;

const openaiKey = process.env.OPENAI_API_KEY?.trim();
const openai = openaiKey && openaiKey.length > 0
  ? new OpenAI({
      apiKey: openaiKey,
    })
  : null;

// Types for AI-generated daily plan
export type DailyPlanTask = {
  time: string; // e.g., "09:00-10:30"
  subject: string;
  topic: string;
  activity: string; // e.g., "Study", "Practice Questions", "Review"
  duration: number; // in minutes
  description: string;
  priority: "high" | "medium" | "low";
  resources?: string[];
};

export type DailyPlanSection = {
  timeOfDay: "morning" | "afternoon" | "evening";
  tasks: DailyPlanTask[];
};

export type GeneratedDailyPlan = {
  date: string;
  totalStudyTime: number; // in minutes
  motivationalMessage: string;
  studyTips: string[];
  plan: {
    morning: DailyPlanTask[];
    afternoon: DailyPlanTask[];
    evening: DailyPlanTask[];
  };
};

const DAILY_PLAN_SYSTEM_PROMPT = `
You are an expert Turkish university entrance exam (TYT) study planner. Your task is to create personalized, realistic daily study plans for students preparing for the TYT exam.

Key principles:
1. **Realistic**: Don't overload students - respect human attention spans and energy levels
2. **Balanced**: Mix different subjects and activity types (study, practice, review)
3. **Adaptive**: Prioritize weak subjects while maintaining strong ones
4. **Sustainable**: Include breaks, varied activities, and achievable goals
5. **Strategic**: Focus on high-impact topics with better score weights
6. **Motivating**: Provide encouraging messages and practical study tips

Time blocks:
- Morning (09:00-12:00): Best for difficult subjects requiring deep focus
- Afternoon (14:00-17:00): Good for practice and medium-difficulty topics
- Evening (19:00-21:00): Best for review, lighter topics, or memorization

Activity types:
- Study: Learning new content (45-90 min blocks)
- Practice: Solving questions (30-60 min blocks)
- Review: Revisiting previous topics (20-45 min blocks)

Always output valid JSON with this exact structure:
{
  "date": "YYYY-MM-DD",
  "totalStudyTime": <total minutes>,
  "motivationalMessage": "An encouraging, specific message for the student",
  "studyTips": ["Tip 1", "Tip 2", "Tip 3"],
  "plan": {
    "morning": [
      {
        "time": "09:00-10:30",
        "subject": "Mathematics",
        "topic": "Quadratic Equations",
        "activity": "Study",
        "duration": 90,
        "description": "Learn solution methods and practice basic examples",
        "priority": "high",
        "resources": ["Textbook Chapter 5", "Online video series"]
      }
    ],
    "afternoon": [...],
    "evening": [...]
  }
}
`;

interface GeneratePlanOptions {
  userId: number;
  date: string;
  language?: "tr" | "en";
  targetStudyTime?: number; // in minutes, default 240 (4 hours)
  focusSubjects?: string[]; // specific subjects to prioritize
}

/**
 * Generate a personalized daily study plan using AI
 */
export async function generateDailyStudyPlan(
  options: GeneratePlanOptions
): Promise<GeneratedDailyPlan> {
  const { userId, date, language = "tr", targetStudyTime = 240, focusSubjects } = options;

  try {
    // Gather student context (optional - gracefully handle missing data)
    let fetchedProfile = undefined;
    let fetchedSubjects = undefined;
    let fetchedProgress = undefined;
    
    try {
      fetchedProfile = await storage.getTytStudentProfile(userId);
    } catch (error) {
      console.warn('No TYT profile found for user, using generic plan');
    }
    
    try {
      fetchedSubjects = await storage.getTytSubjects();
    } catch (error) {
      console.warn('No TYT subjects found, using generic plan');
    }
    
    try {
      fetchedProgress = await getUserProgressSummary(userId);
    } catch (error) {
      console.warn('No progress summary found, using generic plan');
    }
    
    // Use typed defaults for missing context
    const subjects: TytSubject[] = fetchedSubjects ?? [];
    const userProgress = fetchedProgress ?? new Map();
    
    // Build context-rich prompt
    const prompt = buildDailyPlanPrompt({
      date,
      language,
      targetStudyTime,
      focusSubjects,
      profile: fetchedProfile,
      subjects,
      userProgress,
    });

    // Generate plan using Anthropic (Claude)
    if (!anthropic) {
      throw new Error('Anthropic API key not configured');
    }
    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      temperature: 0.7,
      system: DAILY_PLAN_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from AI");
    }

    // Parse and validate response
    const generatedPlan = JSON.parse(content.text) as GeneratedDailyPlan;
    
    // Validate the plan structure
    validateDailyPlan(generatedPlan);

    return generatedPlan;
  } catch (error: any) {
    console.error("Error generating daily study plan:", error);
    
    // Fallback to OpenAI if Anthropic fails
    if (process.env.OPENAI_API_KEY) {
      console.log("Falling back to OpenAI for plan generation");
      return await generateDailyPlanWithOpenAI(options);
    }
    
    throw new Error(`Failed to generate daily study plan: ${error.message}`);
  }
}

/**
 * Fallback plan generation using OpenAI
 */
async function generateDailyPlanWithOpenAI(
  options: GeneratePlanOptions
): Promise<GeneratedDailyPlan> {
  const { userId, date, language = "tr", targetStudyTime = 240, focusSubjects } = options;

  // Gather student context (optional - gracefully handle missing data)
  let fetchedProfile = undefined;
  let fetchedSubjects = undefined;
  let fetchedProgress = undefined;
  
  try {
    fetchedProfile = await storage.getTytStudentProfile(userId);
  } catch (error) {
    console.warn('No TYT profile found for user, using generic plan');
  }
  
  try {
    fetchedSubjects = await storage.getTytSubjects();
  } catch (error) {
    console.warn('No TYT subjects found, using generic plan');
  }
  
  try {
    fetchedProgress = await getUserProgressSummary(userId);
  } catch (error) {
    console.warn('No progress summary found, using generic plan');
  }

  // Use typed defaults for missing context
  const subjects: TytSubject[] = fetchedSubjects ?? [];
  const userProgress = fetchedProgress ?? new Map();

  const prompt = buildDailyPlanPrompt({
    date,
    language,
    targetStudyTime,
    focusSubjects,
    profile: fetchedProfile,
    subjects,
    userProgress,
  });

  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  if (!openai) {
    throw new Error('OpenAI API key not configured');
  }
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: DAILY_PLAN_SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    response_format: { type: "json_object" },
    temperature: 0.7,
  });

  const responseContent = completion.choices[0].message.content;
  if (!responseContent) {
    throw new Error("Empty response from OpenAI");
  }

  const generatedPlan = JSON.parse(responseContent) as GeneratedDailyPlan;
  validateDailyPlan(generatedPlan);

  return generatedPlan;
}

/**
 * Build a context-rich prompt for daily plan generation
 */
function buildDailyPlanPrompt(params: {
  date: string;
  language: "tr" | "en";
  targetStudyTime: number;
  focusSubjects?: string[];
  profile?: TytStudentProfile;
  subjects?: TytSubject[];
  userProgress?: Map<string, { progress: number; mastery: number; lastStudied?: Date }>;
}): string {
  const { date, language, targetStudyTime, focusSubjects, profile, subjects, userProgress } = params;

  const languageText = language === "tr" ? "Turkish" : "English";
  const dayOfWeek = new Date(date).toLocaleDateString(language, { weekday: "long" });

  let prompt = `Generate a daily study plan for ${date} (${dayOfWeek}) in ${languageText}.\n\n`;

  // Student profile context
  if (profile) {
    const profileRow = profile as UserProfileRow;
    prompt += `Student Profile:
- Class: ${profileRow.studentClass || "Not specified"}
- Exam Year: ${profileRow.examYear || "Not specified"}
- Target Net Score: ${profileRow.targetNetScore || "Not specified"}
- Daily Study Target: ${profileRow.dailyStudyHoursTarget || 0} hours
- Selected Subjects: ${profileRow.selectedSubjects?.join(", ") || "Not specified"}
- Weak Subjects: ${profileRow.weakSubjects?.join(", ") || "None identified"}
- Strong Subjects: ${profileRow.strongSubjects?.join(", ") || "None identified"}
- Motivation Level: ${profileRow.motivationLevel || "Not specified"}/10\n\n`;
  }

  // Target study time
  prompt += `Target Study Time: ${targetStudyTime} minutes (${Math.floor(targetStudyTime / 60)} hours ${targetStudyTime % 60} minutes)\n\n`;

  // Subject priorities
  if (focusSubjects && focusSubjects.length > 0) {
    prompt += `Priority Subjects for Today: ${focusSubjects.join(", ")}\n\n`;
  }

  // Progress summary
  if (userProgress && userProgress.size > 0) {
    prompt += "Current Progress:\n";
    userProgress.forEach((data, subject) => {
      const lastStudiedText = data.lastStudied 
        ? `last studied ${Math.floor((Date.now() - data.lastStudied.getTime()) / (1000 * 60 * 60 * 24))} days ago`
        : "never studied";
      prompt += `- ${subject}: ${data.progress}% complete, ${data.mastery}% mastery (${lastStudiedText})\n`;
    });
    prompt += "\n";
  }

  // Available subjects (only if TYT context is available)
  if (subjects && subjects.length > 0) {
    prompt += "Available TYT Subjects:\n";
    subjects.forEach((subject) => {
      const subjectRow = subject as ExamCategoryRow;
      prompt += `- ${subjectRow.displayName || subjectRow.title || subjectRow.name || "Unknown"} (${subjectRow.name || subjectRow.title || "N/A"}): ${subjectRow.totalQuestions || subjectRow.questionCount || 0} questions in exam\n`;
    });
    prompt += "\n";
  } else {
    // Generic subjects for non-TYT students
    prompt += "Generate a balanced study plan covering general academic subjects.\n\n";
  }

  prompt += "\nCreate a balanced, realistic study plan that helps the student make steady progress toward their goals.";

  return prompt;
}

/**
 * Get user progress summary across all subjects
 */
async function getUserProgressSummary(
  userId: number
): Promise<Map<string, { progress: number; mastery: number; lastStudied?: Date }>> {
  const progressMap = new Map<string, { progress: number; mastery: number; lastStudied?: Date }>();

  try {
    const subjects = await storage.getTytSubjects();
    
    for (const subject of subjects) {
      const topics = await storage.getTytTopics(subject.id);
      const topicIds = topics.map(t => t.id);
      
      // Get progress for all topics in this subject
      const allProgress = await Promise.all(
        topicIds.map(topicId => storage.getUserTopicProgress(userId, topicId))
      );
      
      const flatProgress = allProgress.flat().filter(p => p !== undefined) as UserTopicProgress[];
      
      if (flatProgress.length > 0) {
        const avgProgress = flatProgress.reduce((sum, p) => sum + ((p as any).progressPercent || 0), 0) / flatProgress.length;
        const avgMastery = flatProgress.reduce((sum, p) => sum + ((p as any).masteryLevel || 0), 0) / flatProgress.length;
        const lastStudied = flatProgress
          .map(p => (p as any).lastStudiedAt)
          .filter(d => d !== null)
          .sort((a, b) => (b?.getTime() || 0) - (a?.getTime() || 0))[0] || undefined;
        
        progressMap.set(subject.displayName, {
          progress: Math.round(avgProgress),
          mastery: Math.round(avgMastery),
          lastStudied: lastStudied ? new Date(lastStudied) : undefined,
        });
      } else {
        progressMap.set(subject.displayName, { progress: 0, mastery: 0 });
      }
    }
  } catch (error) {
    console.error("Error getting user progress summary:", error);
  }

  return progressMap;
}

/**
 * Validate the generated daily plan structure
 */
function validateDailyPlan(plan: GeneratedDailyPlan): void {
  if (!plan.date || !plan.totalStudyTime || !plan.motivationalMessage || !plan.studyTips || !plan.plan) {
    throw new Error("Invalid plan structure: missing required fields");
  }

  if (!Array.isArray(plan.studyTips) || plan.studyTips.length === 0) {
    throw new Error("Invalid plan structure: studyTips must be a non-empty array");
  }

  const sections = ["morning", "afternoon", "evening"] as const;
  for (const section of sections) {
    if (!Array.isArray(plan.plan[section])) {
      throw new Error(`Invalid plan structure: ${section} must be an array`);
    }
  }

  // Validate total study time matches sum of tasks
  const calculatedTime = [
    ...plan.plan.morning,
    ...plan.plan.afternoon,
    ...plan.plan.evening,
  ].reduce((sum, task) => sum + task.duration, 0);

  if (Math.abs(calculatedTime - plan.totalStudyTime) > 5) {
    console.warn(`Warning: Calculated time (${calculatedTime}) doesn't match totalStudyTime (${plan.totalStudyTime})`);
  }
}

/**
 * Save a generated daily plan to the database
 * 
 * NOTE: This will fail until the Neon database endpoint is re-enabled!
 */
export async function saveGeneratedDailyPlan(
  userId: number,
  generatedPlan: GeneratedDailyPlan
): Promise<void> {
  try {
    const planData: InsertAiDailyPlan = {
      userId,
      // date, plan, totalStudyTime, etc. not in schema - storing only userId for now
      // TODO: Add these fields to aiDailyPlans table schema if needed
    } as any;

    await storage.createAiDailyPlan(planData);
    console.log(`Daily plan saved for user ${userId} on ${generatedPlan.date}`);
  } catch (error: any) {
    console.error("Error saving daily plan to database:", error);
    throw new Error(`Failed to save daily plan: ${error.message}`);
  }
}

/**
 * Generate and save a daily plan in one step
 * 
 * NOTE: Saving will fail until the Neon database endpoint is re-enabled!
 */
export async function generateAndSaveDailyPlan(
  options: GeneratePlanOptions
): Promise<GeneratedDailyPlan> {
  const plan = await generateDailyStudyPlan(options);
  await saveGeneratedDailyPlan(options.userId, plan);
  return plan;
}
