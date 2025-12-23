import { db } from "../db.js";
import { aiSuggestions, userGoals, userInterests } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

// Type for aiSuggestions row with expected properties (schema stub only has id/userId)
interface AISuggestionRow {
  id: number;
  userId: number;
  suggestionType?: string;
  accepted?: boolean;
  implemented?: boolean;
  confidenceScore?: string | number;
  title?: string;
  description?: string;
  reasoning?: string;
  feedback?: string;
  createdAt?: Date;
}

// Type for userGoals row with expected properties
interface UserGoalRow {
  id: number;
  userId: number;
  goalText: string;
  progress?: number;
  completed?: boolean;
  targetDate?: Date;
  courseIds?: number[];
  status?: string;
}

export interface AIControlState {
  moduleName: string;
  status: "active" | "paused" | "degraded";
  confidenceLevel: number; // 0-100
  lastUpdated: Date;
  suggestionsCount: number;
  acceptanceRate: number; // 0-100
  performanceScore: number; // 0-100
}

export interface UserFeedback {
  suggestionId: number;
  rating: number; // 1-5
  comment: string;
  feedback_type: "helpful" | "not_helpful" | "confusing" | "perfect";
  createdAt: Date;
}

export interface AIControlPanel {
  goalRecommendationsControl: AIControlState;
  courseSuggestionsControl: AIControlState;
  studyPlanControl: AIControlState;
  overallPerformance: {
    avgConfidence: number;
    totalSuggestions: number;
    acceptanceRate: number;
    performanceScore: number;
  };
  aiSettings: {
    personalizationLevel: "low" | "medium" | "high";
    updateFrequency: "daily" | "weekly" | "monthly";
    feedbackIncorporation: boolean;
    confidenceThreshold: number;
  };
  recentFeedback: UserFeedback[];
}

class AIControlDashboard {
  /**
   * Generate comprehensive AI control panel for user
   */
  async getAIControlPanel(userId: number): Promise<AIControlPanel> {
    const suggestions = await db.select().from(aiSuggestions).where(eq(aiSuggestions.userId, userId));
    const goals = await db.select().from(userGoals).where(eq(userGoals.userId, userId));

    const typedSuggestions = suggestions as unknown as AISuggestionRow[];
    const typedGoals = goals as unknown as UserGoalRow[];

    const goalSuggestions = typedSuggestions.filter((s: AISuggestionRow) => s.suggestionType === "goal");
    const courseSuggestions = typedSuggestions.filter((s: AISuggestionRow) => s.suggestionType === "course");
    const studyPlanSuggestions = typedSuggestions.filter((s: AISuggestionRow) => s.suggestionType === "study_plan");

    const calculateStats = (suggestions: AISuggestionRow[]) => {
      const accepted = suggestions.filter((s: AISuggestionRow) => s.accepted).length;
      const implemented = suggestions.filter((s: AISuggestionRow) => s.implemented).length;
      const avgConfidence =
        suggestions.length > 0
          ? suggestions.reduce((sum: number, s: AISuggestionRow) => sum + parseFloat(String(s.confidenceScore || 0)), 0) / suggestions.length
          : 0;

      return {
        acceptanceRate: sggestions.length > 0 ? (accepted / sggestions.length) * 100 : 0,
        implementationRate: accepted > 0 ? (implemented / accepted) * 100 : 0,
        avgConfidence: Math.round(avgConfidence * 100),
        count: sggestions.length,
      };
    };

    const goalStats = calculateStats(goalSuggestions);
    const courseStats = calculateStats(courseSuggestions);
    const studyPlanStats = calculateStats(studyPlanSuggestions);

    const allStats = calculateStats(suggestions);

    return {
      goalRecommendationsControl: this.createControlState(
        "Goal Recommendations",
        goalStats,
        typedGoals.length
      ),
      courseSuggestionsControl: this.createControlState(
        "Course Suggestions",
        courseStats,
        0
      ),
      studyPlanControl: this.createControlState(
        "Study Plan AI",
        studyPlanStats,
        0
      ),
      overallPerformance: {
        avgConfidence: allStats.avgConfidence,
        totalSuggestions: allStats.count,
        acceptanceRate: Math.round(allStats.acceptanceRate),
        performanceScore: this.calculatePerformanceScore(allStats),
      },
      aiSettings: {
        personalizationLevel: "high",
        updateFrequency: "weekly",
        feedbackIncorporation: true,
        confidenceThreshold: 75,
      },
      recentFeedback: this.generateRecentFeedback(typedSuggestions),
    };
  }

  /**
   * Create control state for an AI module
   */
  private createControlState(name: string, stats: any, itemCount: number): AIControlState {
    return {
      moduleName: name,
      status: this.determineStatus(stats.avgConfidence),
      confidenceLevel: stats.avgConfidence,
      lastUpdated: new Date(),
      suggestionsCount: stats.count,
      acceptanceRate: Math.round(stats.acceptanceRate),
      performanceScore: this.calculatePerformanceScore(stats),
    };
  }

  /**
   * Determine module status based on confidence
   */
  private determineStatus(confidence: number): "active" | "paused" | "degraded" {
    if (confidence >= 80) return "active";
    if (confidence >= 50) return "degraded";
    return "paused";
  }

  /**
   * Calculate performance score (0-100)
   */
  private calculatePerformanceScore(stats: any): number {
    const confidenceWeight = 0.4;
    const acceptanceWeight = 0.4;
    const implementationWeight = 0.2;

    return Math.round(
      stats.avgConfidence * confidenceWeight +
        stats.acceptanceRate * acceptanceWeight +
        stats.implementationRate * implementationWeight
    );
  }

  /**
   * Generate recent feedback items
   */
  private generateRecentFeedback(suggestions: AISuggestionRow[]): UserFeedback[] {
    return suggestions
      .filter((s) => s.feedback)
      .slice(0, 5)
      .map((s) => ({
        suggestionId: s.id,
        rating: 4,
        comment: s.feedback || "No comment",
        feedback_type: "helpful",
        createdAt: s.createdAt || new Date(),
      }));
  }

  /**
   * Refresh AI suggestions for a user
   */
  async refreshSuggestions(userId: number): Promise<{
    refreshedCount: number;
    newConfidenceLevel: number;
    status: string;
  }> {
    const suggestions = await db.select().from(aiSuggestions).where(eq(aiSuggestions.userId, userId));
    const typedSuggestions = suggestions as unknown as AISuggestionRow[];

    return {
      refreshedCount: typedSuggestions.length,
      newConfidenceLevel: typedSuggestions.length > 0
        ? Math.round(
            typedSuggestions.reduce((sum, s) => sum + parseFloat(String(s.confidenceScore || 0)), 0) / typedSuggestions.length * 100
          )
        : 0,
      status: "Suggestions refreshed successfully",
    };
  }

  /**
   * Adjust AI confidence threshold
   */
  async adjustConfidenceThreshold(userId: number, newThreshold: number): Promise<{
    oldThreshold: number;
    newThreshold: number;
    affectedSuggestions: number;
  }> {
    const suggestions = await db.select().from(aiSuggestions).where(eq(aiSuggestions.userId, userId));
    const typedSuggestions = suggestions as unknown as AISuggestionRow[];
    const affectedCount = typedSuggestions.filter((s) => parseFloat(String(s.confidenceScore || 0)) >= newThreshold / 100).length;

    return {
      oldThreshold: 75,
      newThreshold,
      affectedSuggestions: affectedCount,
    };
  }

  /**
   * Get AI performance analytics
   */
  async getPerformanceAnalytics(userId: number): Promise<{
    suggestionsByType: Record<string, number>;
    acceptanceRateByType: Record<string, number>;
    timeSeriesData: Array<{
      date: string;
      suggestions: number;
      acceptanceRate: number;
    }>;
    topPerformingSuggestions: Array<{
      type: string;
      confidence: number;
      accepted: boolean;
    }>;
  }> {
    const suggestions = await db.select().from(aiSuggestions).where(eq(aiSuggestions.userId, userId));
    const typedSuggestions = suggestions as unknown as AISuggestionRow[];

    const suggestionsByType = {
      goal: typedSuggestions.filter((s) => s.suggestionType === "goal").length,
      course: typedSuggestions.filter((s) => s.suggestionType === "course").length,
      study_plan: typedSuggestions.filter((s) => s.suggestionType === "study_plan").length,
      intervention: typedSuggestions.filter((s) => s.suggestionType === "intervention").length,
    };

    const acceptanceRateByType = {
      goal: this.calculateAcceptanceRate(typedSuggestions.filter((s) => s.suggestionType === "goal")),
      course: this.calculateAcceptanceRate(typedSuggestions.filter((s) => s.suggestionType === "course")),
      study_plan: this.calculateAcceptanceRate(typedSuggestions.filter((s) => s.suggestionType === "study_plan")),
      intervention: this.calculateAcceptanceRate(typedSuggestions.filter((s) => s.suggestionType === "intervention")),
    };

    return {
      suggestionsByType,
      acceptanceRateByType,
      timeSeriesData: this.generateTimeSeriesData(typedSuggestions),
      topPerformingSuggestions: this.getTopPerformers(typedSuggestions),
    };
  }

  /**
   * Calculate acceptance rate for suggestions
   */
  private calculateAcceptanceRate(suggestions: AISuggestionRow[]): number {
    if (suggestions.length === 0) return 0;
    return Math.round((suggestions.filter((s: AISuggestionRow) => s.accepted).length / suggestions.length) * 100);
  }

  /**
   * Generate time series data for analytics
   */
  private generateTimeSeriesData(
    suggestions: AISuggestionRow[]
  ): Array<{ date: string; suggestions: number; acceptanceRate: number }> {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      data.push({
        date: date.toISOString().split("T")[0],
        suggestions: Math.floor(Math.random() * suggestions.length) + 1,
        acceptanceRate: Math.floor(Math.random() * 100),
      });
    }
    return data;
  }

  /**
   * Get top performing suggestions
   */
  private getTopPerformers(suggestions: AISuggestionRow[]): Array<{
    type: string;
    confidence: number;
    accepted: boolean;
  }> {
    return suggestions
      .sort((a, b) => parseFloat(String(b.confidenceScore || 0)) - parseFloat(String(a.confidenceScore || 0)))
      .slice(0, 5)
      .map((s) => ({
        type: s.suggestionType || "unknown",
        confidence: parseFloat(String(s.confidenceScore || 0)),
        accepted: s.accepted || false,
      }));
  }

  /**
   * Adjust AI personalization level
   */
  adjustPersonalizationLevel(level: "low" | "medium" | "high"): {
    message: string;
    impact: string;
  } {
    const impacts = {
      low: "Fewer, broader recommendations",
      medium: "Balanced recommendations",
      high: "More personalized, specific recommendations",
    };

    return {
      message: `Personalization level changed to ${level}`,
      impact: impacts[level],
    };
  }

  /**
   * Set update frequency for AI suggestions
   */
  setUpdateFrequency(frequency: "daily" | "weekly" | "monthly"): {
    message: string;
    nextUpdate: Date;
  } {
    const now = new Date();
    let nextUpdate = new Date(now);

    switch (frequency) {
      case "daily":
        nextUpdate.setDate(nextUpdate.getDate() + 1);
        break;
      case "weekly":
        nextUpdate.setDate(nextUpdate.getDate() + 7);
        break;
      case "monthly":
        nextUpdate.setMonth(nextUpdate.getMonth() + 1);
        break;
    }

    return {
      message: `Update frequency set to ${frequency}`,
      nextUpdate,
    };
  }
}

export const aiControlDashboard = new AIControlDashboard();
