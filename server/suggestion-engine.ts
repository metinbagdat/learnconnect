import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq, desc } from "drizzle-orm";
import { aiIntegration } from "./ai-integration.js";

interface LearningData {
  userId: number;
  completedAssignments: number;
  totalAssignments: number;
  averageScore: number;
  totalHoursLearned: number;
  currentPace: "slow" | "moderate" | "fast";
  enrolledCourses: number;
  recentPerformance: number[];
  strengthAreas: string[];
  weakAreas: string[];
}

interface Suggestion {
  type: "learning_path" | "resource" | "pace" | "peer" | "review";
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  action: string;
  reasoning: string;
}

export class SuggestionEngine {
  async generateSuggestions(userId: number): Promise<Suggestion[]> {
    try {
      console.log(`[SuggestionEngine] Generating suggestions for user ${userId}`);

      // Step 1: Get user learning data
      const userData = await this.getUserLearningData(userId);
      console.log(`[SuggestionEngine] Retrieved learning data for user ${userId}`);

      // Step 2: Analyze learning patterns with AI
      const patterns = await this.analyzeLearningPatterns(userData);
      console.log(`[SuggestionEngine] Analyzed learning patterns`);

      // Step 3: Generate multiple suggestion types in parallel
      const [
        learningPathSuggestions,
        resourceSuggestions,
        paceSuggestions,
        peerSuggestions,
        reviewSuggestions,
      ] = await Promise.all([
        this.suggestLearningPath(userData, patterns),
        this.recommendResources(userData, patterns),
        this.adjustPaceSuggestions(userData, patterns),
        this.peerLearningSuggestions(userData, patterns),
        this.reviewSuggestions(userData, patterns),
      ]);

      // Step 4: Combine and prioritize all suggestions
      const allSuggestions = [
        ...learningPathSuggestions,
        ...resourceSuggestions,
        ...paceSuggestions,
        ...peerSuggestions,
        ...reviewSuggestions,
      ];

      const prioritized = this.prioritizeSuggestions(allSuggestions);
      console.log(`[SuggestionEngine] Generated and prioritized ${prioritized.length} suggestions`);

      return prioritized;
    } catch (error) {
      console.error("[SuggestionEngine] Error generating suggestions:", error);
      throw error;
    }
  }

  private async getUserLearningData(userId: number): Promise<LearningData> {
    try {
      // Get user
      const [user] = await db.select().from(schema.users).where(eq(schema.users.id, userId));

      // Get user progress data
      const userProgress = await db.select()
        .from(schema.userProgress)
        .where(eq(schema.userProgress.userId, userId));

      const completedCount = userProgress.filter((p: any) => p.status === "completed").length;
      const totalCount = userProgress.length;
      const scores = userProgress
        .filter((p: any) => p.score !== null)
        .map((p: any) => p.score || 0);
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((a: number, b: number) => a + b, 0) / scores.length)
        : 0;

      // Get enrollments
      const enrollments = await db.select()
        .from(schema.userCourses)
        .where(eq(schema.userCourses.userId, userId));

      // Recent performance (last 10 assignments)
      const recentPerformance = userProgress
        .slice(-10)
        .map((p: any) => p.score || 0);

      return {
        userId,
        completedAssignments: completedCount,
        totalAssignments: totalCount,
        averageScore,
        totalHoursLearned: Math.floor(totalCount * 1.5),
        currentPace: (user?.learningPace as any) || "moderate",
        enrolledCourses: enrollments.length,
        recentPerformance,
        strengthAreas: this.identifyStrengths(userProgress),
        weakAreas: this.identifyWeaknesses(userProgress),
      };
    } catch (error) {
      console.error("[SuggestionEngine] Error getting user learning data:", error);
      throw error;
    }
  }

  private async analyzeLearningPatterns(userData: LearningData): Promise<any> {
    try {
      const prompt = `Analyze this learner's progress data and identify learning patterns:
- Completed: ${userData.completedAssignments}/${userData.totalAssignments}
- Average Score: ${userData.averageScore}%
- Total Hours: ${userData.totalHoursLearned}h
- Current Pace: ${userData.currentPace}
- Strengths: ${userData.strengthAreas.join(", ") || "None identified"}
- Weak Areas: ${userData.weakAreas.join(", ") || "None identified"}
- Recent Performance Trend: ${userData.recentPerformance.join(", ")}

Provide insights on:
1. Learning consistency and engagement
2. Performance trends (improving/declining)
3. Optimal pace for this learner
4. Key areas for intervention or acceleration`;

      const response = await aiIntegration.chat(prompt);
      return response;
    } catch (error) {
      console.error("[SuggestionEngine] Error analyzing patterns:", error);
      return "Unable to analyze patterns at this time";
    }
  }

  private async suggestLearningPath(userData: LearningData, patterns: any): Promise<Suggestion[]> {
    try {
      if (userData.completedAssignments < 5) {
        return [
          {
            type: "learning_path",
            title: "Complete Foundation Module",
            description: "Master the basics before moving to advanced topics",
            priority: "high",
            action: "Start Module",
            reasoning: "You're just getting started. Building a strong foundation is key.",
          },
        ];
      }

      if (userData.averageScore > 85) {
        return [
          {
            type: "learning_path",
            title: "Challenge: Advanced Concepts",
            description: "You're excelling - ready for more complex material",
            priority: "high",
            action: "Take Challenge",
            reasoning: "Your high performance indicates readiness for advanced topics.",
          },
        ];
      }

      return [
        {
          type: "learning_path",
          title: "Continue Current Path",
          description: "Stay focused on your current course progression",
          priority: "medium",
          action: "Continue",
          reasoning: "Consistent progress on your current learning path.",
        },
      ];
    } catch (error) {
      console.error("[SuggestionEngine] Error suggesting learning path:", error);
      return [];
    }
  }

  private async recommendResources(userData: LearningData, patterns: any): Promise<Suggestion[]> {
    try {
      const weakAreas = userData.weakAreas.slice(0, 2);
      if (weakAreas.length === 0) {
        return [];
      }

      return weakAreas.map((area) => ({
        type: "resource",
        title: `Resource: ${area} Deep Dive`,
        description: `Strengthen your understanding of ${area}`,
        priority: userData.averageScore < 70 ? "high" : "medium",
        action: "View Resources",
        reasoning: `You've identified ${area} as an area to improve. Extra resources can help.`,
      }));
    } catch (error) {
      console.error("[SuggestionEngine] Error recommending resources:", error);
      return [];
    }
  }

  private async adjustPaceSuggestions(userData: LearningData, patterns: any): Promise<Suggestion[]> {
    try {
      if (userData.averageScore < 60 && userData.currentPace !== "slow") {
        return [
          {
            type: "pace",
            title: "Slow Down Your Learning Pace",
            description: "Consider reducing pace to focus on mastery",
            priority: "high",
            action: "Adjust Pace",
            reasoning: "Lower scores suggest you might benefit from a slower pace for deeper learning.",
          },
        ];
      }

      if (userData.averageScore > 90 && userData.currentPace !== "fast") {
        return [
          {
            type: "pace",
            title: "Accelerate Your Learning",
            description: "You're performing exceptionally - consider a faster pace",
            priority: "medium",
            action: "Speed Up",
            reasoning: "Excellent performance indicates you could handle a faster pace.",
          },
        ];
      }

      return [];
    } catch (error) {
      console.error("[SuggestionEngine] Error suggesting pace:", error);
      return [];
    }
  }

  private async peerLearningSuggestions(userData: LearningData, patterns: any): Promise<Suggestion[]> {
    try {
      if (userData.enrolledCourses >= 2) {
        return [
          {
            type: "peer",
            title: "Join Study Group",
            description: "Connect with peers taking similar courses",
            priority: "medium",
            action: "Find Group",
            reasoning: "You're taking multiple courses - study groups can accelerate learning.",
          },
        ];
      }

      if (userData.completedAssignments > 10) {
        return [
          {
            type: "peer",
            title: "Become a Peer Mentor",
            description: "Help other learners and reinforce your knowledge",
            priority: "low",
            action: "Join as Mentor",
            reasoning: "You have solid progress - mentoring others deepens understanding.",
          },
        ];
      }

      return [];
    } catch (error) {
      console.error("[SuggestionEngine] Error suggesting peer learning:", error);
      return [];
    }
  }

  private async reviewSuggestions(userData: LearningData, patterns: any): Promise<Suggestion[]> {
    try {
      if (userData.recentPerformance.length > 0) {
        const avgRecent = Math.round(
          userData.recentPerformance.reduce((a, b) => a + b, 0) / userData.recentPerformance.length
        );

        if (avgRecent < userData.averageScore - 5) {
          return [
            {
              type: "review",
              title: "Review Previous Topics",
              description: "Your recent performance is declining - review fundamentals",
              priority: "high",
              action: "Review",
              reasoning: "Recent scores are lower than your average - revisit core concepts.",
            },
          ];
        }
      }

      return [];
    } catch (error) {
      console.error("[SuggestionEngine] Error suggesting reviews:", error);
      return [];
    }
  }

  private prioritizeSuggestions(suggestions: Suggestion[]): Suggestion[] {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    const typeOrder = { learning_path: 0, pace: 1, review: 2, resource: 3, peer: 4 };

    return suggestions.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;

      return typeOrder[a.type] - typeOrder[b.type];
    });
  }

  private identifyStrengths(userProgress: any[]): string[] {
    if (userProgress.length === 0) return [];

    const topPerformers = userProgress
      .filter((p: any) => p.score && p.score >= 80)
      .slice(-5);

    if (topPerformers.length === 0) return [];

    return ["Problem Solving", "Time Management", "Consistency"];
  }

  private identifyWeaknesses(userProgress: any[]): string[] {
    if (userProgress.length === 0) return [];

    const lowPerformers = userProgress
      .filter((p: any) => p.score && p.score < 70)
      .slice(-5);

    if (lowPerformers.length === 0) return [];

    return ["Advanced Topics", "Complex Concepts"];
  }
}

export const suggestionEngine = new SuggestionEngine();

// Export singleton for easy access
export default suggestionEngine;
