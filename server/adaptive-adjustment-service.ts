import { db } from "./db.js";
import { studyProgress, studyGoals } from "../shared/schema.js";
import { eq, and } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { UserProgressRow, StudyGoalRow } from "./types/database.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AdaptiveAdjustment {
  paceAdjustment: "accelerate" | "maintain" | "slow_down";
  difficultyAdjustment: "increase" | "maintain" | "decrease";
  focusAreas: string[];
  recommendations: string[];
  adjustmentReason: string;
  nextMilestone: {
    title: string;
    targetDate: string;
    description: string;
  };
}

/**
 * Analyzes learning progress and generates adaptive adjustments
 */
export async function generateAdaptiveAdjustments(
  userId: number
): Promise<AdaptiveAdjustment> {
  try {
    // Get recent progress data
    const recentProgress = await db
      .select()
      .from(studyProgress)
      .where(eq(studyProgress.userId, userId))
      .limit(20);

    if (recentProgress.length === 0) {
      return getDefaultAdjustments();
    }

    // Calculate metrics from available fields
    const progressRows = recentProgress.map(row => row as UserProgressRow);
    const completedCount = progressRows.filter(p => (p.lessonsCompleted || 0) > 0).length;
    const completionRate = (completedCount / progressRows.length) * 100;
    const avgHours = progressRows.reduce((sum, p) => sum + (p.hoursStudied || 0), 0) / progressRows.length;
    const avgScore = progressRows.reduce((sum, p) => sum + (p.performanceScore || 0), 0) / progressRows.length;
    const strugglingTopics = recentProgress
      .filter(p => (p.performanceScore || 0) < 50)
      .map((_, idx) => `Learning Area ${idx + 1}`);

    // Get user's goals
    const userGoals = await db
      .select()
      .from(studyGoals)
      .where(and(eq(studyGoals.userId, userId), eq(studyGoals.isCompleted, false)))
      .limit(1);

    const goal = userGoals[0];
    const goalRow = goal as StudyGoalRow;
    const status = goalRow?.status || 'active';

    // Generate AI-powered adjustments
    return await generateAIAdjustments(
      completionRate,
      avgHours,
      strugglingTopics,
      goalRow
    );
  } catch (error) {
    console.error("Error generating adaptive adjustments:", error);
    return getDefaultAdjustments();
  }
}

/**
 * Uses Claude AI to generate personalized adjustments
 */
async function generateAIAdjustments(
  completionRate: number,
  avgTimeSpent: number,
  strugglingTopics: string[],
  goal: any
): Promise<AdaptiveAdjustment> {
  try {
    const prompt = `
    Based on the following learning metrics, generate adaptive adjustments to optimize learning:
    
    - Completion Rate: ${completionRate.toFixed(1)}%
    - Average Time Per Topic: ${avgTimeSpent.toFixed(0)} minutes
    - Struggling Topics: ${strugglingTopics.join(", ") || "None"}
    - Goal: ${goal?.title || "General Learning"}
    - Target Date: ${goal?.targetDate || "Not specified"}
    
    Return ONLY valid JSON (no markdown, no explanation) with this exact structure:
    {
      "paceAdjustment": "accelerate|maintain|slow_down",
      "difficultyAdjustment": "increase|maintain|decrease",
      "focusAreas": ["area1", "area2", "area3"],
      "recommendations": ["recommendation1", "recommendation2", "recommendation3"],
      "adjustmentReason": "brief explanation",
      "nextMilestone": {
        "title": "milestone name",
        "targetDate": "YYYY-MM-DD",
        "description": "milestone description"
      }
    }
    
    Decision logic:
    - If completion rate < 40%: slow_down pace, decrease difficulty
    - If 40-70%: maintain or slight adjustment
    - If > 70%: consider accelerate, increase difficulty
    - Avg time > 60 min: might indicate struggle, consider slow_down
    - Multiple struggling topics: add to focusAreas
    `;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract and parse JSON
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return getDefaultAdjustments();
    }

    const adjustments = JSON.parse(jsonMatch[0]);

    // Validate and return
    return {
      paceAdjustment: adjustments.paceAdjustment || "maintain",
      difficultyAdjustment: adjustments.difficultyAdjustment || "maintain",
      focusAreas: adjustments.focusAreas || [],
      recommendations: adjustments.recommendations || [],
      adjustmentReason: adjustments.adjustmentReason || "Optimizing based on performance",
      nextMilestone: {
        title: adjustments.nextMilestone?.title || "Next Checkpoint",
        targetDate: adjustments.nextMilestone?.targetDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        description: adjustments.nextMilestone?.description || "Continue with current pace",
      },
    };
  } catch (error) {
    console.error("Error generating AI adjustments:", error);
    return getDefaultAdjustments();
  }
}

/**
 * Default adjustments when AI is unavailable
 */
function getDefaultAdjustments(): AdaptiveAdjustment {
  return {
    paceAdjustment: "maintain",
    difficultyAdjustment: "maintain",
    focusAreas: ["Foundational Concepts", "Practice Exercises"],
    recommendations: [
      "Review previous lessons to strengthen foundation",
      "Increase practice problem solving time",
      "Take regular breaks to maintain focus",
    ],
    adjustmentReason: "Maintaining current learning pace for optimal progress",
    nextMilestone: {
      title: "Complete Current Module",
      targetDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      description: "Master the current module before moving to advanced topics",
    },
  };
}

/**
 * Detect if user needs intervention
 */
export async function detectLearningInterventionNeeds(
  userId: number
): Promise<{
  needsIntervention: boolean;
  interventionType: "motivational" | "tutoring" | "pacing" | "none";
  severity: "low" | "medium" | "high";
  message: string;
}> {
  try {
    const recentProgress = await db
      .select()
      .from(studyProgress)
      .where(eq(studyProgress.userId, userId))
      .limit(15);

    if (recentProgress.length === 0) {
      return {
        needsIntervention: false,
        interventionType: "none",
        severity: "low",
        message: "Getting started - no intervention needed yet",
      };
    }

    const progressRows = recentProgress.map(row => row as UserProgressRow);
    const completedCount = progressRows.filter(p => (p.lessonsCompleted || 0) > 0).length;
    const completionRate = (completedCount / progressRows.length) * 100;
    const avgScore = progressRows.reduce((sum, p) => sum + (p.performanceScore || 0), 0) / progressRows.length;
    const lastUpdated = Math.max(
      ...recentProgress.map(p => new Date(p.createdAt).getTime())
    );
    const daysSinceUpdate = (Date.now() - lastUpdated) / (1000 * 60 * 60 * 24);

    // Detection logic
    if (avgScore < 40 || completionRate < 30) {
      return {
        needsIntervention: true,
        interventionType: "tutoring",
        severity: "high",
        message: "Low performance detected. Consider reaching out for tutoring support.",
      };
    }

    if (daysSinceUpdate > 7) {
      return {
        needsIntervention: true,
        interventionType: "motivational",
        severity: "high",
        message: "We haven't seen you in a while. Let's get back on track!",
      };
    }

    if (completionRate < 50 || avgScore < 60) {
      return {
        needsIntervention: true,
        interventionType: "pacing",
        severity: "medium",
        message: "Consider adjusting your pace. We can create a more manageable schedule.",
      };
    }

    return {
      needsIntervention: false,
      interventionType: "none",
      severity: "low",
      message: "You're doing great! Keep up the momentum.",
    };
  } catch (error) {
    console.error("Error detecting intervention needs:", error);
    return {
      needsIntervention: false,
      interventionType: "none",
      severity: "low",
      message: "Continue your learning journey",
    };
  }
}
