import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq } from "drizzle-orm";

export async function enrollUserInCourse(userId: number, courseId: number) {
  try {
    // 1. Create enrollment record
    const [enrollment] = await db.insert(schema.userCourses).values({
      userId,
      courseId,
      progress: 0,
      currentModule: 1,
      completed: false,
      enrolledAt: new Date(),
    }).returning();

    // 2. Get the curriculum for the course
    const modules = await db.select().from(schema.modules).where(eq(schema.modules.courseId, courseId));
    
    if (modules.length === 0) {
      return { enrollment, studyPlan: null, assignments: [] };
    }

    // 3. Create study plan
    const now = new Date();
    const [studyPlan] = await db.insert(schema.studyPlans).values({
      userId,
      courseId,
      status: "active",
      startDate: now,
      completionPercentage: 0,
    }).returning();

    // 4. Create assignments for each curriculum item with cumulative due dates
    const assignments = [];
    let cumulativeDays = 0;
    
    for (const module of modules) {
      // Get lessons in this module
      const lessons = await db.select().from(schema.lessons).where(eq(schema.lessons.moduleId, module.id));
      
      for (const lesson of lessons) {
        // Add estimated duration (assuming duration is in days, convert if needed)
        const estimatedDurationDays = lesson.durationMinutes ? Math.ceil(lesson.durationMinutes / 60 / 5) : 1;
        cumulativeDays += estimatedDurationDays;
        
        // Calculate due date based on cumulative days
        const dueDate = new Date(now);
        dueDate.setDate(dueDate.getDate() + cumulativeDays);
        
        const [assignment] = await db.insert(schema.userAssignments).values({
          userId,
          studyPlanId: studyPlan.id,
          assignmentId: lesson.id,
          title: lesson.title,
          description: `Complete lesson: ${lesson.title}`,
          moduleId: module.id,
          type: "lesson",
          dueDate,
          status: "pending",
          order: cumulativeDays,
        }).returning();
        
        assignments.push(assignment);
      }
    }

    // Update study plan with target completion date
    const targetCompletionDate = new Date(now);
    targetCompletionDate.setDate(targetCompletionDate.getDate() + cumulativeDays);
    
    await db.update(schema.studyPlans)
      .set({ 
        targetCompletionDate,
        duration: Math.ceil(cumulativeDays / 7),
      })
      .where(eq(schema.studyPlans.id, studyPlan.id));

    return { enrollment, studyPlan: { ...studyPlan, targetCompletionDate }, assignments };
  } catch (error) {
    console.error("Enrollment error:", error);
    throw error;
  }
}

export async function completeAssignment(userId: number, assignmentId: number, score?: number) {
  const now = new Date();
  const [updated] = await db.update(schema.userAssignments)
    .set({ status: "completed", completedAt: now, score: score || 100 })
    .where(eq(schema.userAssignments.id, assignmentId))
    .returning();
  
  // Update study plan progress
  const assignment = await db.select().from(schema.userAssignments).where(eq(schema.userAssignments.id, assignmentId));
  if (assignment.length > 0) {
    const studyPlanId = assignment[0].studyPlanId;
    const allAssignments = await db.select().from(schema.userAssignments).where(eq(schema.userAssignments.studyPlanId, studyPlanId));
    const completedCount = allAssignments.filter(a => a.status === "completed").length;
    const completionPercentage = Math.round((completedCount / allAssignments.length) * 100);
    
    await db.update(schema.studyPlans)
      .set({ completionPercentage })
      .where(eq(schema.studyPlans.id, studyPlanId));
  }
  
  return updated;
}

export async function getUserAssignments(userId: number) {
  return db.select().from(schema.userAssignments).where(eq(schema.userAssignments.userId, userId));
}

export async function getUserProgress(userId: number, studyPlanId: number) {
  const [progress] = await db.select().from(schema.userProgress).where(
    eq(schema.userProgress.userId, userId) && eq(schema.userProgress.studyPlanId, studyPlanId)
  );
  return progress;
}
