import { db } from "./db.js";
import { studyProgress } from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { anthropic, ANTHROPIC_MODEL } from "./lib/anthropic-client.js";

export interface ResourceRecommendation {
  id: string;
  type: "video" | "article" | "practice" | "summary";
  title: string;
  description: string;
  reason: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedTime: number; // in minutes
  topic: string;
}

/**
 * Analyzes user's learning progress and recommends resources
 */
export async function analyzeProgressAndRecommend(
  userId: number
): Promise<ResourceRecommendation[]> {
  try {
    // Get user's recent progress data
    const userProgress = await db
      .select()
      .from(studyProgress)
      .where(eq(studyProgress.userId, userId))
      .limit(10);

    if (userProgress.length === 0) {
      return getDefaultRecommendations();
    }

    // Calculate performance metrics based on available fields.
    // Current studyProgress schema is minimal, so we only use record counts and dates.
    const completionRate = (userProgress.length / Math.max(userProgress.length, 1)) * 100;
    const avgHours = 0; // hoursStudied not present in current schema

    // Without detailed per-topic metrics, we approximate struggling topics by index.
    const strugglingTopics = userProgress.map((_, idx) => idx);

    // Generate AI-powered recommendations
    return await generateAIRecommendations(
      userId,
      strugglingTopics,
      completionRate,
      userProgress
    );
  } catch (error) {
    console.error("Error analyzing progress:", error);
    return getDefaultRecommendations();
  }
}

/**
 * Uses Claude AI to generate personalized resource recommendations
 */
async function generateAIRecommendations(
  userId: number,
  strugglingTopics: number[],
  completionRate: number,
  userProgress: any[]
): Promise<ResourceRecommendation[]> {
  try {
    const prompt = `
    Based on the following learning analytics, suggest 5 resources to help this student improve:
    
    - Completion Rate: ${completionRate.toFixed(1)}%
    - Struggling Topics: ${strugglingTopics.length} topics
    - Total Progress Records: ${userProgress.length}
    - Average Time Spent: ${(userProgress.reduce((sum, p) => sum + (p.timeSpent || 0), 0) / userProgress.length).toFixed(0)} minutes
    
    For each recommendation, provide:
    1. Resource type (video, article, practice, summary)
    2. Title (specific to the topic)
    3. Description (2-3 sentences)
    4. Reason (why this helps)
    5. Difficulty level
    6. Estimated time (in minutes)
    
    Format response as JSON array with these exact fields:
    [
      {
        "type": "video|article|practice|summary",
        "title": "...",
        "description": "...",
        "reason": "...",
        "difficulty": "beginner|intermediate|advanced",
        "estimatedTime": number,
        "topic": "..."
      }
    ]
    
    Make recommendations based on the completion rate:
    - If < 50%: Focus on foundational videos and practice
    - If 50-75%: Mix of practice and advanced topics
    - If > 75%: Advanced challenges and optimization
    `;

    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const responseText =
      message.content[0].type === "text" ? message.content[0].text : "";

    // Extract JSON from response
    const jsonMatch = responseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      return getDefaultRecommendations();
    }

    const recommendations = JSON.parse(jsonMatch[0]);

    // Add unique IDs and return
    return recommendations.map((rec: any, idx: number) => ({
      ...rec,
      id: `rec-${userId}-${Date.now()}-${idx}`,
    }));
  } catch (error) {
    console.error("Error generating AI recommendations:", error);
    return getDefaultRecommendations();
  }
}

/**
 * Default recommendations when AI is unavailable
 */
function getDefaultRecommendations(): ResourceRecommendation[] {
  return [
    {
      id: "default-1",
      type: "video",
      title: "Foundational Concepts Overview",
      description: "A comprehensive video covering key concepts to strengthen your foundation.",
      reason: "Helps clarify fundamental concepts that may be causing struggles in more complex topics.",
      difficulty: "beginner",
      estimatedTime: 15,
      topic: "General",
    },
    {
      id: "default-2",
      type: "practice",
      title: "Guided Practice Exercises",
      description: "Step-by-step practice problems with detailed solutions.",
      reason: "Hands-on practice helps reinforce learning and identify knowledge gaps.",
      difficulty: "intermediate",
      estimatedTime: 30,
      topic: "General",
    },
    {
      id: "default-3",
      type: "article",
      title: "Study Strategy Guide",
      description: "Evidence-based study techniques to improve retention and performance.",
      reason: "Better study methods lead to faster progress and improved comprehension.",
      difficulty: "beginner",
      estimatedTime: 10,
      topic: "Study Skills",
    },
    {
      id: "default-4",
      type: "summary",
      title: "Quick Reference Sheet",
      description: "Condensed summary of key formulas and concepts for quick review.",
      reason: "Quick reference materials are perfect for revision sessions and exam prep.",
      difficulty: "intermediate",
      estimatedTime: 5,
      topic: "General",
    },
    {
      id: "default-5",
      type: "practice",
      title: "Challenge Problems",
      description: "Advanced problems to test mastery and push your limits.",
      reason: "Challenging yourself helps solidify knowledge and prepares you for harder material.",
      difficulty: "advanced",
      estimatedTime: 45,
      topic: "General",
    },
  ];
}

/**
 * Get resources for a specific topic based on performance
 */
export async function getTopicResources(
  userId: number,
  topicId: number,
  performanceLevel: "struggling" | "developing" | "proficient"
): Promise<ResourceRecommendation[]> {
  try {
    const resourcePool = {
      struggling: [
        { type: "video" as const, difficulty: "beginner" as const },
        { type: "article" as const, difficulty: "beginner" as const },
        { type: "practice" as const, difficulty: "beginner" as const },
      ],
      developing: [
        { type: "article" as const, difficulty: "intermediate" as const },
        { type: "practice" as const, difficulty: "intermediate" as const },
        { type: "summary" as const, difficulty: "beginner" as const },
      ],
      proficient: [
        { type: "practice" as const, difficulty: "advanced" as const },
        { type: "video" as const, difficulty: "advanced" as const },
        { type: "summary" as const, difficulty: "intermediate" as const },
      ],
    };

    const resources = resourcePool[performanceLevel];
    return resources.map((r, idx) => ({
      ...r,
      id: `topic-${topicId}-${idx}`,
      title: `${r.type.charAt(0).toUpperCase() + r.type.slice(1)} Resource for Topic ${topicId}`,
      description: `Tailored ${r.type} for your current proficiency level.`,
      reason: `This ${r.type} matches your ${performanceLevel} performance level.`,
      estimatedTime: r.type === "video" ? 20 : r.type === "article" ? 10 : 30,
      topic: `Topic ${topicId}`,
    }));
  } catch (error) {
    console.error("Error getting topic resources:", error);
    return [];
  }
}

/**
 * Track resource engagement
 */
export async function trackResourceEngagement(
  userId: number,
  resourceId: string,
  timeSpent: number,
  helpful: boolean
): Promise<void> {
  try {
    // In a real system, this would save to a resource_engagement table
    console.log(`Resource ${resourceId} engagement tracked:`, {
      userId,
      timeSpent,
      helpful,
    });
  } catch (error) {
    console.error("Error tracking resource engagement:", error);
  }
}
