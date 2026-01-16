import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq, and, inArray } from "drizzle-orm";

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
    } as any).returning();

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
      title: `Study Plan for Course ${courseId}`,
      status: "active",
      startDate: now,
      // completionPercentage not in schema
    } as any).returning();

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
        
        // Create assignment in assignments table first
        const [assignmentRecord] = await db.insert(schema.assignments).values({
          title: lesson.title,
          description: `Complete lesson: ${lesson.title}`,
          courseId,
          lessonId: lesson.id,
          studyPlanId: studyPlan.id,
          dueDate,
          status: "pending",
          points: 10,
        } as any).returning();
        
        // Then create user assignment link
        const [assignment] = await db.insert(schema.userAssignments).values({
          userId,
          assignmentId: assignmentRecord.id,
          status: "not_started",
        } as any).returning();
        
        assignments.push(assignment);
      }
    }

    // Update study plan with end date
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + cumulativeDays);
    
    await db.update(schema.studyPlans)
      .set({ 
        endDate,
        // targetCompletionDate, duration not in schema
      } as any)
      .where(eq(schema.studyPlans.id, studyPlan.id));

    return { enrollment, studyPlan: { ...studyPlan, endDate }, assignments };
  } catch (error) {
    console.error("Enrollment error:", error);
    throw error;
  }
}

export async function completeAssignment(userId: number, assignmentId: number, score?: number) {
  const now = new Date();
  const [updated] = await db.update(schema.userAssignments)
    .set({ status: "completed", submittedAt: now, grade: score || 100 } as any)
    .where(eq(schema.userAssignments.id, assignmentId))
    .returning();
  
  // Update user progress
  const assignment = await db.select().from(schema.userAssignments).where(eq(schema.userAssignments.id, assignmentId));
  if (assignment.length > 0) {
    // Check if progress record exists
    const existing = await db.select().from(schema.userProgress)
      .where(
        and(
          eq(schema.userProgress.userId, userId),
          eq(schema.userProgress.assignmentId, assignment[0].assignmentId)
        )
      )
      .limit(1);
    
    if (existing.length > 0) {
      // Update existing
      await db.update(schema.userProgress)
        .set({
          status: "completed",
          completedAt: now,
          score: score || 100,
        } as any)
        .where(eq(schema.userProgress.id, existing[0].id));
    } else {
      // Create new
      await db.insert(schema.userProgress).values({
        userId,
        assignmentId: assignment[0].assignmentId,
        status: "completed",
        completedAt: now,
        score: score || 100,
      } as any);
    }
  }
  
  return updated;
}

export async function getUserAssignments(userId: number) {
  return db.select().from(schema.userAssignments).where(eq(schema.userAssignments.userId, userId));
}

export async function getUserProgress(userId: number, studyPlanId: number) {
  // Get assignments for this study plan
  const assignments = await db.select().from(schema.assignments).where(eq(schema.assignments.studyPlanId, studyPlanId));
  const assignmentIds = assignments.map(a => a.id);
  
  if (assignmentIds.length === 0) return null;
  
  // Get user progress for these assignments
  const progress = await db.select().from(schema.userProgress)
    .where(
      and(
        eq(schema.userProgress.userId, userId),
        inArray(schema.userProgress.assignmentId, assignmentIds)
      )
    )
    .limit(1);
  
  return progress[0] || null;
}
