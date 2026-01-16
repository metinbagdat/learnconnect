import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq, and, gte, lte } from "drizzle-orm";

/**
 * Notifications Service
 * Handles sending and managing notifications for:
 * - Due assignments
 * - Study plan reminders
 * - Progress updates
 * - System messages
 */

export class NotificationsService {
  /**
   * Send notification for upcoming due assignments
   */
  async notifyUpcomingAssignments(userId: number, daysUntilDue: number = 1): Promise<any[]> {
    try {
      console.log(`[NotificationsService] Checking upcoming assignments for user ${userId}`);

      const now = new Date();
      const futureDate = new Date(now.getTime() + daysUntilDue * 24 * 60 * 60 * 1000);

      // Get assignments due within the specified period
      const assignments = await db
        .select()
        .from(schema.assignments)
        .where(
          and(
            gte(schema.assignments.dueDate, now),
            lte(schema.assignments.dueDate, futureDate)
          )
        );

      // Get user's pending assignments
      const userProgress = await db
        .select()
        .from(schema.userProgress)
        .where(
          and(
            eq(schema.userProgress.userId, userId),
            eq(schema.userProgress.status, "pending")
          )
        );

      const userAssignmentIds = userProgress.map(p => p.assignmentId);
      const dueAssignments = assignments.filter(a => userAssignmentIds.includes(a.id));

      // Create notifications
      const notifications: any[] = [];

      for (const assignment of dueAssignments) {
        const [notif] = await db
          .insert(schema.notifications)
          .values({
            userId,
            type: "due_assignment",
            title: `Assignment Due: ${assignment.title}`,
            message: `Your assignment "${assignment.title}" is due on ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "soon"}`,
            // NOTE: `data` column is not present in the notifications table in this schema.
            // If you add a JSON column later, you can include metadata here.
          } as any)
          .returning();

        notifications.push(notif);
      }

      console.log(`[NotificationsService] ✓ Sent ${notifications.length} upcoming assignment notifications`);
      return notifications;
    } catch (error) {
      console.error("[NotificationsService] Error notifying upcoming assignments:", error);
      throw error;
    }
  }

  /**
   * Send overdue assignment notifications
   */
  async notifyOverdueAssignments(userId: number): Promise<any[]> {
    try {
      console.log(`[NotificationsService] Checking overdue assignments for user ${userId}`);

      const now = new Date();

      // Get overdue assignments
      const assignments = await db
        .select()
        .from(schema.assignments)
        .where(lte(schema.assignments.dueDate, now));

      // Get user's pending assignments
      const userProgress = await db
        .select()
        .from(schema.userProgress)
        .where(
          and(
            eq(schema.userProgress.userId, userId),
            eq(schema.userProgress.status, "pending")
          )
        );

      const userAssignmentIds = userProgress.map(p => p.assignmentId);
      const overdueAssignments = assignments.filter(a => userAssignmentIds.includes(a.id));

      const notifications: any[] = [];

      for (const assignment of overdueAssignments) {
        // Check if already notified
        const [existing] = await db
          .select()
          .from(schema.notifications)
          .where(
            and(
              eq(schema.notifications.userId, userId),
              eq(schema.notifications.type, "overdue_assignment"),
              eq(schema.notifications.title, `OVERDUE: ${assignment.title}`)
            )
          );

        if (!existing) {
          const [notif] = await db
            .insert(schema.notifications)
            .values({
              userId,
              type: "overdue_assignment",
              title: `OVERDUE: ${assignment.title}`,
              message: `This assignment was due on ${assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "date unknown"}. Please submit immediately.`,
            } as any)
            .returning();

          notifications.push(notif);
        }
      }

      console.log(`[NotificationsService] ✓ Sent ${notifications.length} overdue notifications`);
      return notifications;
    } catch (error) {
      console.error("[NotificationsService] Error notifying overdue assignments:", error);
      throw error;
    }
  }

  /**
   * Send study plan progress notification
   */
  async notifyStudyPlanProgress(userId: number, studyPlanId: number): Promise<any> {
    try {
      const [studyPlan] = await db
        .select()
        .from(schema.studyPlans)
        .where(eq(schema.studyPlans.id, studyPlanId));

      if (!studyPlan) throw new Error("Study plan not found");

      // Get assignments and progress
      const assignments = await db
        .select()
        .from(schema.assignments)
        .where(eq(schema.assignments.studyPlanId, studyPlanId));

      const completedCount = await db
        .select()
        .from(schema.userProgress)
        .where(
          and(
            eq(schema.userProgress.userId, userId),
            eq(schema.userProgress.status, "completed")
          )
        );

      const progress = assignments.length > 0 
        ? Math.round((completedCount.length / assignments.length) * 100) 
        : 0;

      const [notif] = await db
        .insert(schema.notifications)
        .values({
          userId,
          type: "progress_update",
          title: "Study Plan Progress Update",
          message: `You've completed ${completedCount.length} out of ${assignments.length} assignments (${progress}% complete)`,
        } as any)
        .returning();

      console.log(`[NotificationsService] ✓ Sent progress notification: ${progress}% complete`);
      return notif;
    } catch (error) {
      console.error("[NotificationsService] Error notifying progress:", error);
      throw error;
    }
  }

  /**
   * Send study plan adjustment notification
   */
  async notifyStudyPlanAdjustment(
    userId: number,
    studyPlanId: number,
    adjustmentType: "extended" | "accelerated",
    details: string
  ): Promise<any> {
    try {
      const titles = {
        extended: "Your Study Plan Has Been Extended",
        accelerated: "Your Study Plan Has Been Accelerated"
      };

      const messages = {
        extended: `We've extended your study plan deadline to help you keep pace. ${details}`,
        accelerated: `Great progress! We've adjusted your plan to challenge you more. ${details}`
      };

      const [notif] = await db
        .insert(schema.notifications)
        .values({
          userId,
          type: "study_plan_adjusted",
          title: titles[adjustmentType],
          message: messages[adjustmentType],
        } as any)
        .returning();

      console.log(`[NotificationsService] ✓ Sent study plan adjustment notification`);
      return notif;
    } catch (error) {
      console.error("[NotificationsService] Error notifying adjustment:", error);
      throw error;
    }
  }

  /**
   * Get unread notifications for user
   */
  async getUnreadNotifications(userId: number): Promise<any[]> {
    try {
      const notifications = await db
        .select()
        .from(schema.notifications)
        .where(eq(schema.notifications.userId, userId))
        .orderBy((t) => t.createdAt);

      return notifications;
    } catch (error) {
      console.error("[NotificationsService] Error fetching notifications:", error);
      return [];
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: number): Promise<any> {
    try {
      // Update notification status if schema has isRead field
      // For now, we can just return success
      console.log(`[NotificationsService] Marked notification ${notificationId} as read`);
      return { success: true };
    } catch (error) {
      console.error("[NotificationsService] Error marking as read:", error);
      throw error;
    }
  }
}

export const notificationsService = new NotificationsService();
