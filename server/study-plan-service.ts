import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq, and } from "drizzle-orm";
import { notificationsService } from "./notifications-service.js";

/**
 * Study Plan Management Service
 * Handles dynamic adjustments and pace changes for study plans
 */

export class StudyPlanService {
  /**
   * Update user's learning pace
   */
  async updateLearningPace(
    userId: number,
    newPace: "slow" | "moderate" | "fast"
  ): Promise<any> {
    try {
      console.log(`[StudyPlanService] Updating learning pace for user ${userId} to ${newPace}`);

      const [user] = await db
        .select()
        .from(schema.users)
        .where(eq(schema.users.id, userId));

      if (!user) throw new Error("User not found");

      // Update user's learning pace
      await db
        .update(schema.users)
        .set({ learningPace: newPace })
        .where(eq(schema.users.id, userId));

      console.log(`[StudyPlanService] ✓ Updated learning pace to ${newPace}`);
      return { success: true, newPace };
    } catch (error) {
      console.error("[StudyPlanService] Error updating learning pace:", error);
      throw error;
    }
  }

  /**
   * Adjust study plan duration (extend or accelerate)
   */
  async adjustStudyPlanDuration(
    userId: number,
    studyPlanId: number,
    adjustmentDays: number,
    reason: string = ""
  ): Promise<any> {
    try {
      console.log(
        `[StudyPlanService] Adjusting study plan ${studyPlanId} by ${adjustmentDays} days`
      );

      // Get study plan
      const [studyPlan] = await db
        .select()
        .from(schema.studyPlans)
        .where(
          and(
            eq(schema.studyPlans.id, studyPlanId),
            eq(schema.studyPlans.userId, userId)
          )
        );

      if (!studyPlan) throw new Error("Study plan not found or unauthorized");

      const oldEndDate = new Date(studyPlan.endDate || studyPlan.startDate);
      const newEndDate = new Date(oldEndDate.getTime() + adjustmentDays * 24 * 60 * 60 * 1000);

      // Update study plan
      const [updated] = await db
        .update(schema.studyPlans)
        .set({ endDate: newEndDate })
        .where(eq(schema.studyPlans.id, studyPlanId))
        .returning();

      // Send notification
      const adjustmentType = adjustmentDays > 0 ? "extended" : "accelerated";
      await notificationsService.notifyStudyPlanAdjustment(
        userId,
        studyPlanId,
        adjustmentType,
        `New deadline: ${newEndDate.toLocaleDateString()}. ${reason}`
      );

      console.log(`[StudyPlanService] ✓ Study plan adjusted. New end date: ${newEndDate}`);
      return {
        success: true,
        oldEndDate,
        newEndDate,
        adjustmentDays,
        adjustmentType
      };
    } catch (error) {
      console.error("[StudyPlanService] Error adjusting study plan:", error);
      throw error;
    }
  }

  /**
   * Manually change study plan pace and recalculate due dates
   */
  async changePaceAndRecalculate(
    userId: number,
    studyPlanId: number,
    newPace: "slow" | "moderate" | "fast"
  ): Promise<any> {
    try {
      console.log(`[StudyPlanService] Changing pace to ${newPace} for study plan ${studyPlanId}`);

      // Get study plan and assignments
      const [studyPlan] = await db
        .select()
        .from(schema.studyPlans)
        .where(
          and(
            eq(schema.studyPlans.id, studyPlanId),
            eq(schema.studyPlans.userId, userId)
          )
        );

      if (!studyPlan) throw new Error("Study plan not found");

      const assignments = await db
        .select()
        .from(schema.assignments)
        .where(eq(schema.assignments.studyPlanId, studyPlanId));

      // Calculate pace multipliers
      const paceMultipliers: Record<string, number> = {
        slow: 1.5, // 50% more time
        moderate: 1, // normal time
        fast: 0.75 // 25% less time
      };

      const multiplier = paceMultipliers[newPace] || 1;

      // Calculate new end date
      const totalDurationMinutes = assignments.reduce((sum, a) => {
        const dueDate = a.dueDate ? new Date(a.dueDate) : new Date();
        const startDate = new Date(studyPlan.startDate);
        const durationMinutes = (dueDate.getTime() - startDate.getTime()) / (1000 * 60);
        return sum + durationMinutes;
      }, 0);

      const adjustedDurationMinutes = totalDurationMinutes * multiplier;
      const newEndDate = new Date(
        new Date(studyPlan.startDate).getTime() + adjustedDurationMinutes * 60 * 1000
      );

      // Update study plan
      await db
        .update(schema.studyPlans)
        .set({ endDate: newEndDate })
        .where(eq(schema.studyPlans.id, studyPlanId));

      // Update user's learning pace
      await db
        .update(schema.users)
        .set({ learningPace: newPace })
        .where(eq(schema.users.id, userId));

      // Send notification
      const adjustmentType = multiplier > 1 ? "extended" : "accelerated";
      await notificationsService.notifyStudyPlanAdjustment(
        userId,
        studyPlanId,
        adjustmentType,
        `Your learning pace is now set to "${newPace}". New deadline: ${newEndDate.toLocaleDateString()}`
      );

      console.log(`[StudyPlanService] ✓ Pace changed to ${newPace}. New end date: ${newEndDate}`);
      return {
        success: true,
        newPace,
        newEndDate,
        multiplier,
        message: `Study plan recalculated with ${newPace} pace`
      };
    } catch (error) {
      console.error("[StudyPlanService] Error changing pace:", error);
      throw error;
    }
  }
}

export const studyPlanService = new StudyPlanService();
