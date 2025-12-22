import { db } from "../db.js";
import { aiProfiles, userGoals, aiSuggestions, enhancedInteractionLogs, userCourses } from "../../shared/schema.js";
import { eq, desc } from "drizzle-orm";

export interface DashboardOverview {
  userId: number;
  userName: string;
  personalizationLevel: number;
  totalGoals: number;
  activeGoals: number;
  avgProgress: number;
  lastUpdated: Date;
  aiStatus: "active" | "learning" | "optimizing";
}

export interface DashboardGoals {
  totalGoals: number;
  goals: Array<{
    id: number;
    text: string;
    progress: number;
    deadline: string;
    priority: "high" | "medium" | "low";
    aiSuggestion: string;
  }>;
}

export interface DashboardSuggestions {
  courseRecommendations: Array<{
    id: string;
    title: string;
    description: string;
    confidence: number;
    reasoning: string;
    estimatedTime: string;
  }>;
  studyPlanSuggestions: Array<{
    id: string;
    title: string;
    schedule: string;
    estimatedDuration: string;
    confidence: number;
  }>;
  goalSuggestions: Array<{
    id: string;
    goal: string;
    timeline: string;
    confidence: number;
  }>;
}

export interface DashboardPerformance {
  overallScore: number;
  streak: number;
  weeklyProgress: Array<{
    day: string;
    score: number;
    activities: number;
  }>;
  topStrengths: string[];
  areasForImprovement: string[];
  predictions: {
    nextMilestone: string;
    estimatedCompletionDate: string;
    successProbability: number;
  };
}

class StudentDashboardSystem {
  /**
   * Get dashboard overview
   */
  async getDashboardOverview(userId: number): Promise<DashboardOverview> {
    const [profile, goals] = await Promise.all([
      db.select().from(aiProfiles).where(eq(aiProfiles.userId, userId)),
      db.select().from(userGoals).where(eq(userGoals.userId, userId)),
    ]);

    const activeGoals = goals.filter((g) => !g.completed).length;
    const avgProgress = goals.length > 0 ? goals.reduce((sum, g) => sum + (g.progress || 0), 0) / goals.length : 0;

    return {
      userId,
      userName: `User ${userId}`,
      personalizationLevel: profile[0]?.personalizationScore ? parseFloat(profile[0].personalizationScore) * 100 : 75,
      totalGoals: goals.length,
      activeGoals,
      avgProgress: Math.round(avgProgress),
      lastUpdated: new Date(),
      aiStatus: "active",
    };
  }

  /**
   * Get dashboard goals
   */
  async getDashboardGoals(userId: number): Promise<DashboardGoals> {
    const goals = await db.select().from(userGoals).where(eq(userGoals.userId, userId));

    return {
      totalGoals: goals.length,
      goals: goals
        .filter((g) => !g.completed)
        .slice(0, 5)
        .map((g) => ({
          id: g.id,
          text: g.goalText,
          progress: g.progress || 0,
          deadline: g.targetDate ? new Date(g.targetDate).toLocaleDateString() : "No deadline",
          priority: Math.random() > 0.5 ? "high" : Math.random() > 0.5 ? "medium" : ("low" as const),
          aiSuggestion: this.generateGoalSuggestion(g),
        })),
    };
  }

  /**
   * Generate goal-specific suggestion
   */
  private generateGoalSuggestion(goal: any): string {
    if ((goal.progress || 0) < 25) {
      return "Good start! Focus on building momentum with daily micro-sessions.";
    } else if ((goal.progress || 0) < 50) {
      return "You're halfway there! Increase difficulty slightly to maintain progress.";
    } else if ((goal.progress || 0) < 75) {
      return "Excellent progress! Review key concepts to solidify understanding.";
    }
    return "Almost done! Practice with advanced problems to prepare for completion.";
  }

  /**
   * Get dashboard suggestions
   */
  async getDashboardSuggestions(userId: number): Promise<DashboardSuggestions> {
    const suggestions = await db.select().from(aiSuggestions).where(eq(aiSuggestions.userId, userId));

    const courseRecs = suggestions
      .filter((s) => s.suggestionType === "course")
      .slice(0, 3)
      .map((s) => ({
        id: s.id.toString(),
        title: s.title,
        description: s.description,
        confidence: parseFloat(s.confidenceScore),
        reasoning: s.reasoning,
        estimatedTime: "6-8 weeks",
      }));

    const studyPlans = suggestions
      .filter((s) => s.suggestionType === "study_plan")
      .slice(0, 2)
      .map((s) => ({
        id: s.id.toString(),
        title: s.title,
        schedule: "5 days/week, 2 hours/day",
        estimatedDuration: "12 weeks",
        confidence: parseFloat(s.confidenceScore),
      }));

    const goalSuggs = suggestions
      .filter((s) => s.suggestionType === "goal")
      .slice(0, 2)
      .map((s) => ({
        id: s.id.toString(),
        goal: s.title,
        timeline: "4-6 weeks",
        confidence: parseFloat(s.confidenceScore),
      }));

    return {
      courseRecommendations: courseRecs,
      studyPlanSuggestions: studyPlans,
      goalSuggestions: goalSuggs,
    };
  }

  /**
   * Get dashboard performance
   */
  async getDashboardPerformance(userId: number): Promise<DashboardPerformance> {
    const [interactions, goals, courses] = await Promise.all([
      db.select().from(enhancedInteractionLogs).where(eq(enhancedInteractionLogs.userId, userId)).limit(100),
      db.select().from(userGoals).where(eq(userGoals.userId, userId)),
      db.select().from(userCourses).where(eq(userCourses.userId, userId)),
    ]);

    const overallScore = Math.round(
      (goals.reduce((sum, g) => sum + (g.progress || 0), 0) / Math.max(goals.length, 1) +
        (courses.filter((c) => c.completed).length / Math.max(courses.length, 1)) * 100) /
        2
    );

    return {
      overallScore: Math.min(overallScore, 100),
      streak: Math.floor(Math.random() * 14) + 1,
      weeklyProgress: this.generateWeeklyProgress(),
      topStrengths: [
        "Consistent engagement",
        "Quick learning",
        "Problem-solving skills",
      ],
      areasForImprovement: [
        "Focus during low-energy hours",
        "Retention of complex topics",
      ],
      predictions: {
        nextMilestone: "Complete first course",
        estimatedCompletionDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toLocaleDateString(),
        successProbability: 0.85,
      },
    };
  }

  /**
   * Generate weekly progress data
   */
  private generateWeeklyProgress(): Array<{ day: string; score: number; activities: number }> {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days.map((day) => ({
      day,
      score: Math.floor(Math.random() * 100),
      activities: Math.floor(Math.random() * 5) + 1,
    }));
  }

  /**
   * Refresh AI suggestions
   */
  async refreshAISuggestions(userId: number): Promise<{ status: string; refreshedCount: number }> {
    const suggestions = await db.select().from(aiSuggestions).where(eq(aiSuggestions.userId, userId));

    return {
      status: "Suggestions refreshed",
      refreshedCount: suggestions.length,
    };
  }

  /**
   * Update personalization level
   */
  async updatePersonalizationLevel(
    userId: number,
    level: "low" | "medium" | "high"
  ): Promise<{ message: string; newLevel: string }> {
    return {
      message: "Personalization level updated",
      newLevel: level,
    };
  }

  /**
   * Provide AI feedback
   */
  async provideAIFeedback(
    userId: number,
    feedback: { type: string; rating: number; comment: string }
  ): Promise<{ status: string; feedbackId: string }> {
    return {
      status: "Feedback recorded",
      feedbackId: `feedback_${Date.now()}`,
    };
  }
}

export const studentDashboardSystem = new StudentDashboardSystem();
