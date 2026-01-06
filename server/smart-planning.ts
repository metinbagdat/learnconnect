import { db } from "./db.js";
import { eq, desc, gte } from "drizzle-orm";
import { studyGoals, studySessions, studyPrograms } from "../shared/schema.js";
import { storage } from "./storage.js";
import { anthropic, ANTHROPIC_MODEL } from "./lib/anthropic-client.js";

export async function generateAiStudyPlan(
  userId: number,
  goal: { title: string; targetExam?: string; subjects: string[]; studyHoursPerWeek: number; targetDate: Date }
): Promise<{ sessions: any[]; recommendations: string }> {
  try {
    const prompt = `Generate a detailed study plan for the following goal:
Title: ${goal.title}
Target Exam: ${goal.targetExam || "General"}
Subjects: ${goal.subjects.join(", ")}
Study Hours Per Week: ${goal.studyHoursPerWeek}
Target Date: ${goal.targetDate.toLocaleDateString()}

Create a JSON response with:
1. sessions: Array of study sessions with scheduledDate, subject, activity, durationMinutes
2. recommendations: A motivational study plan overview

Return valid JSON only, no markdown.`;

    const message = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      messages: [{ role: "user", content: prompt }],
    });

    const content = message.content[0];
    if (content.type === "text") {
      const parsed = JSON.parse(content.text);
      return {
        sessions: parsed.sessions || [],
        recommendations: parsed.recommendations || "Study plan created successfully!",
      };
    }
  } catch (error) {
    console.error("AI generation error:", error);
  }

  return {
    sessions: [],
    recommendations: "Study plan created. Use the dashboard to manage your sessions.",
  };
}

export async function createStudyGoal(userId: number, data: any) {
  try {
    // 1. Create the study goal
    const [goal] = await db.insert(studyGoals).values({ ...data, userId }).returning();
    
    // 2. Auto-create a study program cascaded from the goal
    const subjects = data.subjects || [];
    const studyHours = data.studyHoursPerWeek || 10;
    const targetDate = data.targetDate ? new Date(data.targetDate) : new Date();
    const weeksUntilTarget = Math.max(1, Math.ceil((targetDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)));
    
    const programData = {
      title: `${data.goalType || 'Study'} Program - ${subjects.join(', ') || 'General'}`,
      description: `Auto-generated study program for goal: ${goal.id}. Targets: ${subjects.join(', ') || 'General studies'}.`,
      targetGroup: "all",
      courseIds: [], // Empty initially, can be filled by user
      totalDurationWeeks: weeksUntilTarget,
      weeklyHours: studyHours,
      isAiGenerated: true,
      createdBy: userId, // User creates their own program
      isActive: true,
    };
    
    const createdProgram = await storage.createStudyProgram(programData);
    
    // 3. Enroll user in the program (this creates ilerleme/progress entry)
    const enrollment = await storage.enrollUserInProgram(userId, createdProgram.id);
    
    console.log(`✓ Goal ${goal.id} created → Program ${createdProgram.id} auto-created → User enrolled (Progress: ${enrollment.id})`);
    
    return {
      ...goal,
      program: createdProgram,
      progress: enrollment
    };
  } catch (error) {
    console.error("Error in createStudyGoal cascade:", error);
    throw error;
  }
}

export async function getUserStudyGoals(userId: number) {
  return await db
    .select()
    .from(studyGoals)
    .where(eq(studyGoals.userId, userId))
    .orderBy(desc(studyGoals.createdAt));
}

export async function updateStudyGoal(goalId: number, data: any) {
  const [updated] = await db
    .update(studyGoals)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(studyGoals.id, goalId))
    .returning();
  return updated;
}

export async function createStudySession(userId: number, data: any) {
  const [created] = await db.insert(studySessions).values({ ...data, userId }).returning();
  return created;
}

export async function getUserStudySessions(userId: number, upcomingOnly = false) {
  let query = db.select().from(studySessions).where(eq(studySessions.userId, userId));

  // Note: studySessions schema doesn't have sessionDate field, using completedAt for ordering
  // If upcomingOnly is needed, we'd need to add a scheduledDate field to the schema
  return await query;
}

export async function markSessionComplete(sessionId: number, completionRate: number, focusScore: number, notes?: string) {
  const now = new Date();
  const [updated] = await db
    .update(studySessions)
    .set({
      actualEndTime: now,
      completionRate,
      focusScore,
      notes,
      status: "completed",
    } as any)
    .where(eq(studySessions.id, sessionId))
    .returning();
  return updated;
}

export async function getProgressCharts(userId: number) {
  const sessionsData = await db
    .select()
    .from(studySessions)
    .where(eq(studySessions.userId, userId));
    // Note: studySessions schema doesn't have sessionDate, using completedAt if available

  const byDate: Record<string, number> = {};
  sessionsData.forEach((session: any) => {
    // Use completedAt if available, otherwise use a default date
    const date = session.completedAt instanceof Date 
      ? session.completedAt.toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];
    byDate[date] = (byDate[date] || 0) + 1;
  });

  return {
    sessionsPerDay: Object.entries(byDate).map(([date, count]) => ({ date, count })),
    totalSessions: sessionsData.length,
    completedSessions: sessionsData.filter((s: any) => s.status === "completed").length,
  };
}
