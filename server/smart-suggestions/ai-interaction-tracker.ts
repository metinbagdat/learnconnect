import { db } from "../db.js";
import { enhancedInteractionLogs, aiProfiles, userGoals, userCourses, users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export interface ContextSnapshot {
  userProfile: Record<string, any>;
  currentGoals: Array<{ id: number; goalText: string; progress: number }>;
  courseProgress: Array<{ courseId: number; progress: number; status: string }>;
  recentActivity: Array<{ action: string; timestamp: Date }>;
  learningPatterns: {
    averageSessionDuration: number;
    preferredStudyTime: string;
    weeklyEngagement: number;
  };
}

export interface AIInteraction {
  interactionId: string;
  userId: number;
  timestamp: Date;
  module: string;
  action: string;
  userInput: any;
  aiResponse: any;
  aiModelVersion: string;
  confidenceScores: Record<string, number>;
  contextSnapshot: ContextSnapshot;
  sessionData: Record<string, any>;
  responseTime: number;
  status: string;
}

// Type for database row with expected properties
interface EnhancedInteractionLogRow {
  id: number;
  userId: number;
  module?: string;
  action?: string;
  aiContext?: any;
  sessionId?: string;
  responseTime?: number;
  status?: string;
  data?: any;
}

class AIInteractionTracker {
  /**
   * Log AI interaction with full context
   */
  async logAIInteraction(
    userId: number,
    module: string,
    action: string,
    userInput: any,
    aiResponse: any,
    responseTime: number = 0
  ): Promise<AIInteraction> {
    const timestamp = new Date();
    const interactionId = `ai_${timestamp.getTime()}_${userId}`;

    // Capture full context
    const contextSnapshot = await this.captureContextSnapshot(userId);
    const sessionData = this.getSessionData(userId);

    const interaction: AIInteraction = {
      interactionId,
      userId,
      timestamp,
      module,
      action,
      userInput,
      aiResponse,
      aiModelVersion: "v1",
      confidenceScores: aiResponse?.confidenceScores || {},
      contextSnapshot,
      sessionData,
      responseTime,
      status: "logged",
    };

    // Store in database (schema is stub with only id/userId, so cast to any)
    await db.insert(enhancedInteractionLogs).values({
      userId,
      module,
      action,
      data: { userInput, aiResponse },
      sessionId: sessionData.sessionId,
      aiContext: contextSnapshot,
      responseTime,
      status: "success",
    } as any);

    return interaction;
  }

  /**
   * Capture complete context for AI interactions
   */
  private async captureContextSnapshot(userId: number): Promise<ContextSnapshot> {
    const [profile, goals, courses, activities] = await Promise.all([
      db.select().from(aiProfiles).where(eq(aiProfiles.userId, userId)),
      db.select().from(userGoals).where(eq(userGoals.userId, userId)),
      db.select().from(userCourses).where(eq(userCourses.userId, userId)),
      db.select().from(enhancedInteractionLogs).where(eq(enhancedInteractionLogs.userId, userId)),
    ]);

    const profileRow = profile[0] as any;
    const typedGoals = goals as Array<{ id: number; userId: number; goalText: string; progress?: number; completed?: boolean; targetDate?: Date; courseIds?: number[]; status?: string }>;
    
    return {
      userProfile: profileRow?.aiProfileData || {},
      currentGoals: typedGoals.map((g) => ({
        id: g.id,
        goalText: g.goalText,
        progress: g.progress || 0,
      })),
      courseProgress: courses.map((c) => ({
        courseId: c.courseId,
        progress: c.progress || 0,
        status: c.completed ? "completed" : "in_progress",
      })),
      recentActivity: (activities as unknown as EnhancedInteractionLogRow[]).slice(-5).map((a) => ({
        action: a.action || "unknown",
        timestamp: new Date(), // timestamp not in schema, use current date
      })),
      learningPatterns: this.analyzeLearningPatterns(activities),
    };
  }

  /**
   * Analyze learning patterns from interaction history
   */
  private analyzeLearningPatterns(
    activities: any[]
  ): {
    averageSessionDuration: number;
    preferredStudyTime: string;
    weeklyEngagement: number;
  } {
    if (activities.length === 0) {
      return {
        averageSessionDuration: 0,
        preferredStudyTime: "flexible",
        weeklyEngagement: 0,
      };
    }

    const typedActivities = activities as unknown as EnhancedInteractionLogRow[];

    // Calculate average session duration
    const avgDuration = typedActivities.reduce((sum, a) => sum + (a.responseTime || 0), 0) / typedActivities.length;

    // Determine preferred study time (use current time since timestamp not in schema)
    const hours = typedActivities.map(() => new Date().getHours());
    const avgHour = Math.round(hours.reduce((a, b) => a + b, 0) / hours.length);
    let preferredTime = "flexible";
    if (avgHour < 12) preferredTime = "morning";
    else if (avgHour < 17) preferredTime = "afternoon";
    else preferredTime = "evening";

    // Calculate weekly engagement (interactions per week)
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const weeklyCount = activities.filter((a) => new Date(a.timestamp).getTime() > weekAgo).length;

    return {
      averageSessionDuration: Math.round(avgDuration),
      preferredStudyTime: preferredTime,
      weeklyEngagement: weeklyCount,
    };
  }

  /**
   * Get session data for interaction
   */
  private getSessionData(userId: number): Record<string, any> {
    return {
      sessionId: `session_${userId}_${Date.now()}`,
      userId,
      startTime: new Date(),
      browser: "unknown",
      device: "unknown",
    };
  }

  /**
   * Get interaction history
   */
  async getInteractionHistory(userId: number, limit: number = 50): Promise<AIInteraction[]> {
    const logs = await db
      .select()
      .from(enhancedInteractionLogs)
      .where(eq(enhancedInteractionLogs.userId, userId))
      .limit(limit);

    const typedLogs = logs as unknown as EnhancedInteractionLogRow[];
    return typedLogs.map((log: EnhancedInteractionLogRow) => ({
      interactionId: `ai_${log.id}`,
      userId: log.userId,
      timestamp: new Date(), // Use current date since timestamp not in schema
      module: log.module || "unknown",
      action: log.action || "unknown",
      userInput: log.data?.userInput || {},
      aiResponse: log.data?.aiResponse || {},
      aiModelVersion: "v1",
      confidenceScores: {},
      contextSnapshot: (log.aiContext || {}) as ContextSnapshot,
      sessionData: { sessionId: log.sessionId || "" },
      responseTime: log.responseTime || 0,
      status: log.status || "logged",
    }));
  }

  /**
   * Get interaction metrics
   */
  async getInteractionMetrics(userId: number): Promise<{
    totalInteractions: number;
    interactionsByModule: Record<string, number>;
    averageResponseTime: number;
    successRate: number;
    topActions: Array<{ action: string; count: number }>;
  }> {
    const logs = await db.select().from(enhancedInteractionLogs).where(eq(enhancedInteractionLogs.userId, userId));
    const typedLogs = logs as unknown as EnhancedInteractionLogRow[];

    const interactionsByModule: Record<string, number> = {};
    const actionCounts: Record<string, number> = {};
    let totalResponseTime = 0;
    let successCount = 0;

    typedLogs.forEach((log: EnhancedInteractionLogRow) => {
      if (log.module) interactionsByModule[log.module] = (interactionsByModule[log.module] || 0) + 1;
      if (log.action) actionCounts[log.action] = (actionCounts[log.action] || 0) + 1;
      totalResponseTime += log.responseTime || 0;
      if (log.status === "success") successCount++;
    });

    const topActions = Object.entries(actionCounts)
      .map(([action, count]) => ({ action, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalInteractions: logs.length,
      interactionsByModule,
      averageResponseTime: logs.length > 0 ? Math.round(totalResponseTime / logs.length) : 0,
      successRate: logs.length > 0 ? Math.round((successCount / logs.length) * 100) : 0,
      topActions,
    };
  }

  /**
   * Get user engagement score
   */
  async getEngagementScore(userId: number): Promise<{
    score: number;
    level: "low" | "medium" | "high" | "excellent";
    factors: Array<{ factor: string; score: number }>;
  }> {
    const [logs, goals, courses] = await Promise.all([
      db.select().from(enhancedInteractionLogs).where(eq(enhancedInteractionLogs.userId, userId)),
      db.select().from(userGoals).where(eq(userGoals.userId, userId)),
      db.select().from(userCourses).where(eq(userCourses.userId, userId)),
    ]);

    // Calculate factors
    const interactionFrequency = Math.min(logs.length / 10, 25); // 0-25
    const goalProgress = goals.length > 0 ? (goals.reduce((sum, g) => sum + ((g as any).progress || 0), 0) / goals.length) * 0.25 : 0; // 0-25
    const courseCompletion = courses.length > 0 ? (courses.filter((c) => c.completed).length / courses.length) * 25 : 0; // 0-25
    const consistency = Math.min(logs.length / 20, 25); // 0-25

    const score = Math.round(interactionFrequency + goalProgress + courseCompletion + consistency);

    let level: "low" | "medium" | "high" | "excellent" = "low";
    if (score >= 80) level = "excellent";
    else if (score >= 60) level = "high";
    else if (score >= 40) level = "medium";

    return {
      score: Math.min(score, 100),
      level,
      factors: [
        { factor: "Interaction Frequency", score: Math.round(interactionFrequency) },
        { factor: "Goal Progress", score: Math.round(goalProgress) },
        { factor: "Course Completion", score: Math.round(courseCompletion) },
        { factor: "Consistency", score: Math.round(consistency) },
      ],
    };
  }

  /**
   * Get learning insights
   */
  async getLearningInsights(userId: number): Promise<{
    insights: string[];
    recommendations: string[];
    anomalies: string[];
  }> {
    const interactions = await this.getInteractionHistory(userId, 100);
    const metrics = await this.getInteractionMetrics(userId);
    const engagement = await this.getEngagementScore(userId);

    const insights = [];
    const recommendations = [];
    const anomalies = [];

    // Generate insights
    if (metrics.totalInteractions > 50) {
      insights.push("You're highly engaged with the platform");
    }
    if (metrics.averageResponseTime < 200) {
      insights.push("Your AI recommendations are being processed efficiently");
    }

    // Generate recommendations
    if (engagement.score < 40) {
      recommendations.push("Consider setting specific learning goals to increase engagement");
      anomalies.push("Low engagement detected - consider checking notification settings");
    }
    if (metrics.successRate < 70) {
      recommendations.push("Try refining your learning preferences for better recommendations");
    }
    if (Object.keys(metrics.interactionsByModule).length < 3) {
      recommendations.push("Explore different learning modules to diversify your experience");
    }

    return { insights, recommendations, anomalies };
  }
}

export const aiInteractionTracker = new AIInteractionTracker();
