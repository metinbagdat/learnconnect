import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq, desc } from "drizzle-orm";
import { aiIntegration } from "./ai-integration.js";

interface PerformanceData {
  assignmentId: number;
  score: number;
  timeSpent: number;
  completedDate: string;
}

interface PerformanceAnalysis {
  requiresAdjustment: boolean;
  averageScore: number;
  trend: "improving" | "declining" | "stable";
  insights: string;
  recommendedPace: "slow" | "moderate" | "fast";
}

interface AdjustedPlan {
  originalDueDate: string;
  newDueDate: string;
  reasoning: string;
  assignmentIds: number[];
}

export class AdaptiveLearningSystem {
  async adjustCurriculum(userId: number, courseId: number, performanceData: PerformanceData[]): Promise<any> {
    try {
      console.log(`[AdaptiveLearning] Analyzing curriculum adjustment for user ${userId}, course ${courseId}`);

      // Step 1: Get current study plan
      const currentPlan = await this.getStudyPlan(userId, courseId);
      if (!currentPlan) {
        console.log("[AdaptiveLearning] No study plan found");
        return { success: false, message: "No study plan found" };
      }

      // Step 2: Analyze performance
      const performance = await this.analyzePerformance(performanceData);
      console.log(`[AdaptiveLearning] Performance analysis: ${performance.trend} trend, avg score ${performance.averageScore}%`);

      // Step 3: Check if adjustment is needed
      if (!performance.requiresAdjustment) {
        console.log("[AdaptiveLearning] No adjustment needed - performance is stable");
        return { success: true, adjusted: false, message: "Performance is stable" };
      }

      // Step 4: Re-optimize study plan
      const adjustedPlan = await this.reoptimizePlan(userId, courseId, currentPlan, performance);
      console.log(`[AdaptiveLearning] Generated adjusted plan with ${adjustedPlan.assignmentIds.length} assignments`);

      // Step 5: Update assignments with new due dates
      const updatedAssignments = await this.updateAssignments(userId, adjustedPlan);
      console.log(`[AdaptiveLearning] Updated ${updatedAssignments.length} assignments`);

      // Step 6: Update user's learning pace
      await this.updateUserPace(userId, performance.recommendedPace);
      console.log(`[AdaptiveLearning] Updated user pace to ${performance.recommendedPace}`);

      // Step 7: Notify user of changes
      const notification = await this.notifyUserOfChanges(userId, adjustedPlan, performance);
      console.log(`[AdaptiveLearning] Notification sent to user`);

      return {
        success: true,
        adjusted: true,
        plan: adjustedPlan,
        performance,
        updateCount: updatedAssignments.length,
      };
    } catch (error) {
      console.error("[AdaptiveLearning] Error adjusting curriculum:", error);
      throw error;
    }
  }

  private async getStudyPlan(userId: number, courseId: number): Promise<any> {
    try {
      const plans = await db.select()
        .from(schema.studyPlans)
        .where(eq(schema.studyPlans.userId, userId));
      
      return plans.length > 0 ? plans[0] : null;
    } catch (error) {
      console.error("[AdaptiveLearning] Error fetching study plan:", error);
      return null;
    }
  }

  private async analyzePerformance(performanceData: PerformanceData[]): Promise<PerformanceAnalysis> {
    try {
      if (performanceData.length === 0) {
        return {
          requiresAdjustment: false,
          averageScore: 0,
          trend: "stable",
          insights: "No performance data available",
          recommendedPace: "moderate",
        };
      }

      const scores = performanceData.map((p) => p.score);
      const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

      // Detect trend
      const recentScores = scores.slice(-5);
      const recentAvg = Math.round(recentScores.reduce((a, b) => a + b, 0) / recentScores.length);
      const previousAvg = scores.length > 5
        ? Math.round(scores.slice(0, -5).reduce((a, b) => a + b, 0) / (scores.length - 5))
        : averageScore;

      let trend: "improving" | "declining" | "stable" = "stable";
      if (recentAvg > previousAvg + 5) trend = "improving";
      if (recentAvg < previousAvg - 5) trend = "declining";

      // Determine if adjustment needed
      const requiresAdjustment = averageScore < 70 || trend === "declining";

      // Recommend pace
      let recommendedPace: "slow" | "moderate" | "fast" = "moderate";
      if (averageScore < 60) recommendedPace = "slow";
      if (averageScore > 85) recommendedPace = "fast";

      // Generate insights using AI
      const aiInsights = await this.generateAIInsights(averageScore, trend, performanceData.length);

      return {
        requiresAdjustment,
        averageScore,
        trend,
        insights: aiInsights,
        recommendedPace,
      };
    } catch (error) {
      console.error("[AdaptiveLearning] Error analyzing performance:", error);
      return {
        requiresAdjustment: false,
        averageScore: 0,
        trend: "stable",
        insights: "Error analyzing performance",
        recommendedPace: "moderate",
      };
    }
  }

  private async generateAIInsights(avgScore: number, trend: string, dataPoints: number): Promise<string> {
    try {
      const prompt = `Analyze this learner's performance:
- Average Score: ${avgScore}%
- Trend: ${trend}
- Data Points: ${dataPoints} assignments

Provide a brief, actionable insight (max 2 sentences) about what's working, what needs improvement, and a specific recommendation.`;

      const response = await aiIntegration.chat(prompt);
      return response || "Continue with your current pace and focus on weak areas.";
    } catch (error) {
      console.error("[AdaptiveLearning] Error generating AI insights:", error);
      return "Performance analysis complete. Keep practicing and reviewing difficult concepts.";
    }
  }

  private async reoptimizePlan(userId: number, courseId: number, currentPlan: any, performance: PerformanceAnalysis): Promise<AdjustedPlan> {
    try {
      // Get all pending/in-progress assignments for this course
      const assignments = await db.select()
        .from(schema.assignments)
        .where(eq(schema.assignments.courseId, courseId));

      // Get user progress for these assignments
      const userProgress = await db.select()
        .from(schema.userProgress)
        .where(eq(schema.userProgress.userId, userId));

      const pendingAssignments = assignments.filter((a: any) => {
        const progress = userProgress.find((p: any) => p.assignmentId === a.id);
        return !progress || progress.status !== "completed";
      });

      // Calculate new due dates based on performance
      const adjustmentFactor = this.getAdjustmentFactor(performance);
      const today = new Date();
      let accumulatedDays = 0;

      const assignmentIds = pendingAssignments.map((a: any) => a.id);

      return {
        originalDueDate: currentPlan.createdAt || today.toISOString(),
        newDueDate: new Date(today.getTime() + adjustmentFactor * 24 * 60 * 60 * 1000).toISOString(),
        reasoning: `Adjusted based on ${performance.trend} performance trend. Recommended pace: ${performance.recommendedPace}.`,
        assignmentIds,
      };
    } catch (error) {
      console.error("[AdaptiveLearning] Error reoptimizing plan:", error);
      return {
        originalDueDate: new Date().toISOString(),
        newDueDate: new Date().toISOString(),
        reasoning: "Reoptimization error",
        assignmentIds: [],
      };
    }
  }

  private getAdjustmentFactor(performance: PerformanceAnalysis): number {
    if (performance.trend === "declining") return 14; // 2 more weeks
    if (performance.trend === "improving") return 7; // 1 week maintained
    return 0; // No change
  }

  private async updateAssignments(userId: number, adjustedPlan: AdjustedPlan): Promise<any[]> {
    try {
      const updated = [];
      const baseDateShift = new Date(adjustedPlan.newDueDate).getTime() - new Date(adjustedPlan.originalDueDate).getTime();
      const dayShift = Math.ceil(baseDateShift / (24 * 60 * 60 * 1000));

      for (const assignmentId of adjustedPlan.assignmentIds) {
        const [assignment] = await db.select()
          .from(schema.assignments)
          .where(eq(schema.assignments.id, assignmentId));

        if (assignment && assignment.dueDate) {
          const oldDueDate = new Date(assignment.dueDate);
          const newDueDate = new Date(oldDueDate.getTime() + dayShift * 24 * 60 * 60 * 1000);

          await db.update(schema.assignments)
            .set({ dueDate: newDueDate as any })
            .where(eq(schema.assignments.id, assignmentId));

          updated.push({ assignmentId, newDueDate });
        }
      }

      return updated;
    } catch (error) {
      console.error("[AdaptiveLearning] Error updating assignments:", error);
      return [];
    }
  }

  private async updateUserPace(userId: number, newPace: "slow" | "moderate" | "fast"): Promise<void> {
    try {
      await db.update(schema.users)
        .set({ learningPace: newPace })
        .where(eq(schema.users.id, userId));
    } catch (error) {
      console.error("[AdaptiveLearning] Error updating user pace:", error);
    }
  }

  private async notifyUserOfChanges(userId: number, adjustedPlan: AdjustedPlan, performance: PerformanceAnalysis): Promise<any> {
    try {
      const [notification] = await db.insert(schema.notifications).values({
        userId,
        type: "due_assignment",
        title: `Your Study Plan Has Been Adjusted`,
        message: `Based on your ${performance.trend} performance, we've adjusted your study schedule. New recommended pace: ${performance.recommendedPace}.`,
        data: {
          planAdjustment: adjustedPlan,
          performance,
          updatedAssignments: adjustedPlan.assignmentIds.length,
        },
      }).returning();

      return notification;
    } catch (error) {
      console.error("[AdaptiveLearning] Error creating notification:", error);
      return null;
    }
  }
}

export const adaptiveLearningSystem = new AdaptiveLearningSystem();

export default adaptiveLearningSystem;
