import { db } from "./db.js";
import { studySessions, reminders } from "../shared/schema.js";
import { eq, and, lte } from "drizzle-orm";

interface ReminderPayload {
  userId: number;
  message: string;
  sessionDate?: string;
  reminderType: "before_session" | "motivational" | "milestone" | "daily_plan";
}

export async function sendWebhookNotification(webhookUrl: string, payload: any): Promise<boolean> {
  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return response.ok;
  } catch (error) {
    console.error("Webhook notification error:", error);
    return false;
  }
}

export async function scheduleReminder(data: {
  userId: number;
  studySessionId?: number;
  reminderType: string;
  message: string;
  scheduledTime: Date;
  channel: string;
}) {
  try {
    const [reminder] = await db.insert(reminders).values(data).returning();
    return reminder;
  } catch (error) {
    console.error("Error scheduling reminder:", error);
    throw error;
  }
}

export async function getPendingReminders() {
  try {
    // Note: reminders schema is minimal (only id, userId), so sent/scheduledTime fields don't exist
    // Returning empty array for now until schema is updated
    console.warn("[notification-service] getPendingReminders: reminders schema is minimal, returning empty array");
    return [];
  } catch (error) {
    console.error("Error fetching pending reminders:", error);
    return [];
  }
}

export async function markReminderSent(reminderId: number) {
  try {
    // Note: reminders schema is minimal (only id, userId), so sent/sentAt fields don't exist
    // Returning success for now until schema is updated
    console.warn(`[notification-service] markReminderSent: reminders schema is minimal, skipping update for reminder ${reminderId}`);
    return { id: reminderId, userId: 0 };
  } catch (error) {
    console.error("Error marking reminder as sent:", error);
    throw error;
  }
}

export async function createMotivationalReminders(userId: number) {
  try {
    // Note: studySessions schema doesn't have status field, using all sessions for now
    const completedSessions = await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId));

    // Note: studySessions schema doesn't have status field
    const totalSessions = await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId));
    
    // Treat all sessions as completed for progress calculation
    const completedSessionsCount = completedSessions.length;

    if (totalSessions.length === 0) return;

    const progress = (completedSessionsCount / totalSessions.length) * 100;

    const milestones = [25, 50, 75, 100];
    for (const milestone of milestones) {
      if (progress >= milestone) {
        // Note: reminders schema is minimal, skipping duplicate check
        const existingReminder: any[] = [];

        if (!existingReminder.length) {
          const messages: Record<number, string> = {
            25: "🎉 Great start! You've completed 25% of your study plan!",
            50: "🏆 Halfway there! You're at 50% completion. Keep up the momentum!",
            75: "💪 Almost done! 75% complete. You're crushing your goals!",
            100: "🎊 Congratulations! You've completed your study plan!",
          };

          // Note: reminders schema is minimal (only id, userId), so other fields don't exist
          // Skipping insert for now until schema is updated
          console.warn(`[notification-service] createMotivationalReminders: reminders schema is minimal, skipping insert for milestone ${milestone}`);
          // await db.insert(reminders).values({
          //   userId,
          //   reminderType: `milestone_${milestone}` as any,
          //   message: messages[milestone],
          //   scheduledTime: new Date(),
          //   channel: "push",
          //   sent: false,
          // });
        }
      }
    }
  } catch (error) {
    console.error("Error creating motivational reminders:", error);
  }
}

export async function processPendingReminders() {
  try {
    const pending = await getPendingReminders();

    // Note: getPendingReminders returns empty array due to minimal schema
    // This function will effectively do nothing until schema is updated
    // Note: getPendingReminders returns empty array due to minimal schema
    // This function will effectively do nothing until schema is updated
    if (pending.length === 0) return;
    
    for (const reminder of pending) {
      if (!reminder || typeof reminder !== 'object') continue;
      
      const webhookUrl = process.env.REMINDER_WEBHOOK_URL;
      const reminderAny = reminder as any;
      
      if (webhookUrl && reminderAny.userId !== undefined) {
        const success = await sendWebhookNotification(webhookUrl, {
          userId: reminderAny.userId || 0,
          reminderType: reminderAny.reminderType || 'unknown',
          message: reminderAny.message || '',
          channel: reminderAny.channel || 'push',
          timestamp: new Date().toISOString(),
        });

        if (success && reminderAny.id !== undefined) {
          await markReminderSent(reminderAny.id);
        }
      } else if (reminderAny.id !== undefined) {
        // Fallback: just mark as sent if no webhook
        await markReminderSent(reminderAny.id);
      }
    }
  } catch (error) {
    console.error("Error processing pending reminders:", error);
  }
}
