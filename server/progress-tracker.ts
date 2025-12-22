import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { aiIntegration } from "./ai-integration.js";

interface ProgressMetrics {
  assignmentId: number;
  score: number;
  timeSpent: number;
  completedAt: string;
  attempts: number;
}

interface InterventionAlert {
  userId: number;
  type: "low_score" | "stuck" | "falling_behind" | "excelling";
  severity: "high" | "medium" | "low";
  message: string;
  recommendedAction: string;
}

export class ProgressTracker {
  trackUserProgress(userId: number, metrics: ProgressMetrics): void {
    console.log(`[ProgressTracker] Tracking progress for user ${userId}:`, metrics);
    this.analyzeForIntervention(userId, metrics);
  }

  private async analyzeForIntervention(userId: number, metrics: ProgressMetrics): Promise<void> {
    try {
      console.log(`[ProgressTracker] Analyzing metrics for intervention signals`);

      const alerts: InterventionAlert[] = [];

      // Check for low scores
      if (metrics.score < 60) {
        alerts.push({
          userId,
          type: "low_score",
          severity: "high",
          message: `Score of ${metrics.score}% is below mastery level`,
          recommendedAction: "Provide additional resources and practice opportunities",
        });
      }

      // Check for time spent (stuck)
      if (metrics.timeSpent > 180 && metrics.score < 70) {
        alerts.push({
          userId,
          type: "stuck",
          severity: "high",
          message: "User spent extended time but still struggling",
          recommendedAction: "Offer hints, break down concepts, provide worked examples",
        });
      }

      // Check for excelling
      if (metrics.score >= 90) {
        alerts.push({
          userId,
          type: "excelling",
          severity: "low",
          message: `Excellent performance (${metrics.score}%)`,
          recommendedAction: "Recommend advanced challenges or next module",
        });
      }

      // Get user's recent progress to detect trends
      const recentProgress = await db.select()
        .from(schema.userProgress)
        .where(eq(schema.userProgress.userId, userId));

      const recentScores = recentProgress
        .slice(-5)
        .map((p: any) => p.score || 0);

      if (recentScores.length >= 3) {
        const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const trend = recentScores[recentScores.length - 1] - recentScores[0];

        if (trend < -10) {
          alerts.push({
            userId,
            type: "falling_behind",
            severity: "high",
            message: "Performance is declining",
            recommendedAction: "Adjust pace slower, review previous concepts",
          });
        }
      }

      // Send alerts to user via notifications
      for (const alert of alerts) {
        await this.createAlert(userId, alert);
      }

      console.log(`[ProgressTracker] Generated ${alerts.length} intervention alerts`);
    } catch (error) {
      console.error("[ProgressTracker] Error analyzing intervention:", error);
    }
  }

  private async createAlert(userId: number, alert: InterventionAlert): Promise<void> {
    try {
      await db.insert(schema.notifications).values({
        userId,
        type: "due_assignment",
        title: `Learning Alert: ${alert.type}`,
        message: `${alert.message}. ${alert.recommendedAction}`,
        data: { alert, severity: alert.severity },
      }).onConflictDoNothing();
    } catch (error) {
      console.error("[ProgressTracker] Error creating alert:", error);
    }
  }

  async getProgressSummary(userId: number): Promise<any> {
    try {
      const userProgress = await db.select()
        .from(schema.userProgress)
        .where(eq(schema.userProgress.userId, userId));

      if (userProgress.length === 0) {
        return { completed: 0, pending: 0, averageScore: 0, trend: "neutral" };
      }

      const completed = userProgress.filter((p: any) => p.status === "completed").length;
      const pending = userProgress.filter((p: any) => p.status === "pending").length;
      const scores = userProgress.filter((p: any) => p.score).map((p: any) => p.score);
      const averageScore = scores.length > 0
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0;

      const recentScores = scores.slice(-5);
      let trend = "stable";
      if (recentScores.length >= 2) {
        const avgRecent = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
        const avgOlder = scores.slice(0, -5).reduce((a, b) => a + b, 0) / Math.max(1, scores.length - 5);
        if (avgRecent > avgOlder + 5) trend = "improving";
        if (avgRecent < avgOlder - 5) trend = "declining";
      }

      return { completed, pending, averageScore, trend };
    } catch (error) {
      console.error("[ProgressTracker] Error getting summary:", error);
      return null;
    }
  }
}

export const progressTracker = new ProgressTracker();
