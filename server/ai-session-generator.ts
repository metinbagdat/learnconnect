import { db } from "./db.js";
import { eq } from "drizzle-orm";
import Anthropic from "@anthropic-ai/sdk";
import { studyGoals, studySessions } from "../shared/schema.js";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export async function generateStudySessionsFromGoal(goalId: number, userId: number) {
  try {
    // Get the study goal
    const [goal] = await db.select().from(studyGoals).where(eq(studyGoals.id, goalId));

    if (!goal) {
      throw new Error("Study goal not found");
    }

    const prompt = `Generate a detailed weekly study schedule for the following goal:
Title: ${goal.title}
Target Exam: ${goal.targetExam || "General"}
Subjects: ${goal.subjects?.join(", ") || "Not specified"}
Study Hours Per Week: ${goal.studyHoursPerWeek}
Current Progress: ${goal.currentProgress}%
Target Date: ${goal.targetDate}

Create a JSON response with exactly this structure:
{
  "sessions": [
    {
      "subject": "Subject Name",
      "activity": "Type of activity (Theory, Practice, Quiz, Review)",
      "durationMinutes": 60,
      "dayOfWeek": 1,
      "timeSlot": "09:00"
    }
  ],
  "recommendations": "Brief motivational message"
}

Return ONLY valid JSON, no markdown or explanations.`;

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 2048,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Claude");
    }

    let parsed;
    try {
      parsed = JSON.parse(content.text);
    } catch {
      console.error("Failed to parse Claude response:", content.text);
      throw new Error("Invalid JSON response from Claude");
    }

    // Create study sessions for each generated session
    const createdSessions = [];
    const today = new Date();

    for (let i = 0; i < (parsed.sessions?.length || 0); i++) {
      const sessionData = parsed.sessions[i];

      // Calculate scheduled date (starting from next Monday)
      const daysUntilMonday = (1 - today.getDay() + 7) % 7 || 7;
      const scheduledDate = new Date(today);
      scheduledDate.setDate(scheduledDate.getDate() + daysUntilMonday + (sessionData.dayOfWeek - 1 || 0));

      const [session] = await db
        .insert(studySessions)
        .values({
          userId,
          goalId,
          subject: sessionData.subject,
          activity: sessionData.activity,
          durationMinutes: sessionData.durationMinutes || 45,
          scheduledDate: scheduledDate.toISOString().split("T")[0],
          status: "scheduled",
        })
        .returning();

      createdSessions.push(session);
    }

    // Update goal progress to reflect planning
    await db
      .update(studyGoals)
      .set({
        currentProgress: Math.min(10, (goal.currentProgress || 0) + 5),
        updatedAt: new Date(),
      })
      .where(eq(studyGoals.id, goalId));

    return {
      success: true,
      sessionsCreated: createdSessions.length,
      sessions: createdSessions,
      message: parsed.recommendations,
    };
  } catch (error) {
    console.error("Error generating study sessions:", error);
    throw error;
  }
}

export async function autoGenerateWeeklyPlan(userId: number) {
  try {
    // Get all active goals for the user
    const activeGoals = await db
      .select()
      .from(studyGoals)
      .where(eq(studyGoals.userId, userId));

    const results = [];
    for (const goal of activeGoals) {
      if (goal.status === "active") {
        const result = await generateStudySessionsFromGoal(goal.id, userId);
        results.push(result);
      }
    }

    return results;
  } catch (error) {
    console.error("Error auto-generating weekly plans:", error);
    throw error;
  }
}
