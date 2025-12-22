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
    const now = new Date();
    return await db
      .select()
      .from(reminders)
      .where(and(eq(reminders.sent, false), lte(reminders.scheduledTime, now)))
      .orderBy(reminders.scheduledTime);
  } catch (error) {
    console.error("Error fetching pending reminders:", error);
    return [];
  }
}

export async function markReminderSent(reminderId: number) {
  try {
    const [updated] = await db
      .update(reminders)
      .set({
        sent: true,
        sentAt: new Date(),
      })
      .where(eq(reminders.id, reminderId))
      .returning();
    return updated;
  } catch (error) {
    console.error("Error marking reminder as sent:", error);
    throw error;
  }
}

export async function createMotivationalReminders(userId: number) {
  try {
    const completedSessions = await db
      .select()
      .from(studySessions)
      .where(and(eq(studySessions.userId, userId), eq(studySessions.status, "completed" as any)));

    const totalSessions = await db
      .select()
      .from(studySessions)
      .where(eq(studySessions.userId, userId));

    if (totalSessions.length === 0) return;

    const progress = (completedSessions.length / totalSessions.length) * 100;

    const milestones = [25, 50, 75, 100];
    for (const milestone of milestones) {
      if (progress >= milestone) {
        const existingReminder = await db
          .select()
          .from(reminders)
          .where(
            and(
              eq(reminders.userId, userId),
              eq(reminders.reminderType, `milestone_${milestone}` as any)
            )
          );

        if (!existingReminder.length) {
          const messages: Record<number, string> = {
            25: "🎉 Great start! You've completed 25% of your study plan!",
            50: "🏆 Halfway there! You're at 50% completion. Keep up the momentum!",
            75: "💪 Almost done! 75% complete. You're crushing your goals!",
            100: "🎊 Congratulations! You've completed your study plan!",
          };

          await db.insert(reminders).values({
            userId,
            reminderType: `milestone_${milestone}` as any,
            message: messages[milestone],
            scheduledTime: new Date(),
            channel: "push",
            sent: false,
          });
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

    for (const reminder of pending) {
      const webhookUrl = process.env.REMINDER_WEBHOOK_URL;
      if (webhookUrl) {
        const success = await sendWebhookNotification(webhookUrl, {
          userId: reminder.userId,
          reminderType: reminder.reminderType,
          message: reminder.message,
          channel: reminder.channel,
          timestamp: new Date().toISOString(),
        });

        if (success) {
          await markReminderSent(reminder.id);
        }
      } else {
        // Fallback: just mark as sent if no webhook
        await markReminderSent(reminder.id);
      }
    }
  } catch (error) {
    console.error("Error processing pending reminders:", error);
  }
}
