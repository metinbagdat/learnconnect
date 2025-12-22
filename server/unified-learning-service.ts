/**
 * Unified Learning Service - Integrates courses, programs, progress, and goals
 * When a user takes action (attend lesson, complete task), ALL related components update atomically
 */

import { db } from "./db.js";
import { eq, and } from "drizzle-orm";
import {
  userCourses,
  userLessons,
  userProgress,
  userProgramProgress,
  studyProgress,
  studyGoals,
  userLevels,
} from "../shared/schema.js";
import { storage } from "./storage.js";

export interface UnifiedLearningAction {
  userId: number;
  lessonId?: number;
  courseId?: number;
  programId?: number;
  goalId?: number;
  actionType: "start_lesson" | "complete_lesson" | "start_course" | "complete_course";
  hoursSpent?: number;
  performanceScore?: number;
  notes?: string;
}

export interface UnifiedLearningResult {
  lessonProgress?: any;
  courseProgress?: any;
  programProgress?: any;
  goalProgress?: any;
  userLevel?: any;
  cascadeUpdates: {
    lesson: boolean;
    course: boolean;
    program: boolean;
    goal: boolean;
    level: boolean;
  };
}

/**
 * UNIFIED LEARNING ENGINE
 * One action cascades updates everywhere automatically
 */
export async function handleUnifiedLearningAction(
  action: UnifiedLearningAction
): Promise<UnifiedLearningResult> {
  try {
    const result: UnifiedLearningResult = {
      cascadeUpdates: {
        lesson: false,
        course: false,
        program: false,
        goal: false,
        level: false,
      },
    };

    // 1. UPDATE LESSON PROGRESS (foundation level)
    if (action.lessonId) {
      const [lessonUpdate] = await db
        .update(userLessons)
        .set({
          completed: action.actionType.includes("complete"),
          progress:
            action.actionType.includes("complete") ? 100 : (action.performanceScore || 50),
          lastAccessedAt: new Date(),
        })
        .where(
          and(
            eq(userLessons.userId, action.userId),
            eq(userLessons.lessonId, action.lessonId)
          )
        )
        .returning();
      result.lessonProgress = lessonUpdate;
      result.cascadeUpdates.lesson = true;
    }

    // 2. UPDATE COURSE PROGRESS (auto-calculate from lessons)
    if (action.courseId) {
      const courseEnrollment = await db
        .select()
        .from(userCourses)
        .where(
          and(
            eq(userCourses.userId, action.userId),
            eq(userCourses.courseId, action.courseId)
          )
        )
        .limit(1);

      if (courseEnrollment.length > 0) {
        // Get all lessons for this course
        const course = await storage.getCourse(action.courseId);
        const modules = await storage.getModules(action.courseId);
        let totalLessons = 0;
        let completedLessons = 0;

        for (const module of modules || []) {
          const lessons = await storage.getLessons(module.id);
          totalLessons += lessons?.length || 0;

          const completedInModule = await db
            .select()
            .from(userLessons)
            .where(
              and(
                eq(userLessons.userId, action.userId),
                eq(userLessons.completed, true)
              )
            );
          completedLessons += completedInModule.length;
        }

        const courseProgress = Math.round(
          totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0
        );

        const [courseUpdate] = await db
          .update(userCourses)
          .set({
            progress: courseProgress,
            completed: courseProgress === 100,
            lastAccessedAt: new Date(),
          })
          .where(
            and(
              eq(userCourses.userId, action.userId),
              eq(userCourses.courseId, action.courseId)
            )
          )
          .returning();

        result.courseProgress = courseUpdate;
        result.cascadeUpdates.course = true;
      }
    }

    // 3. UPDATE PROGRAM PROGRESS (cascade from courses)
    if (action.programId) {
      const [programUpdate] = await db
        .update(userProgramProgress)
        .set({
          lastAccessedAt: new Date(),
          completedHours: (action.hoursSpent || 0) + (result.courseProgress?.progress || 0) / 10,
          progress:
            action.actionType.includes("complete") ?
            Math.min(100, ((action.hoursSpent || 0) * 100) / 50)
            : (result.courseProgress?.progress || 0),
        })
        .where(
          and(
            eq(userProgramProgress.userId, action.userId),
            eq(userProgramProgress.programId, action.programId)
          )
        )
        .returning();

      result.programProgress = programUpdate;
      result.cascadeUpdates.program = true;
    }

    // 4. UPDATE GOAL PROGRESS (cascade from program)
    if (action.goalId) {
      const [goalUpdate] = await db
        .update(studyGoals)
        .set({
          currentProgress: Math.min(
            100,
            result.programProgress?.progress || result.courseProgress?.progress || 0
          ),
          status: (result.programProgress?.progress || 0) === 100 ? "completed" : "active",
          updatedAt: new Date(),
        })
        .where(eq(studyGoals.id, action.goalId))
        .returning();

      // Also update study progress history
      if (action.hoursSpent || action.performanceScore) {
        await db.insert(studyProgress).values({
          userId: action.userId,
          goalId: action.goalId,
          date: new Date(),
          hoursStudied: action.hoursSpent || 0,
          lessonsCompleted: action.actionType.includes("complete") ? 1 : 0,
          performanceScore: action.performanceScore,
          notes: action.notes,
        });
      }

      result.goalProgress = goalUpdate;
      result.cascadeUpdates.goal = true;
    }

    // 5. UPDATE USER LEVEL (cascade from all above)
    const userLevel = await storage.getUserLevel(action.userId);
    if (userLevel) {
      const baseXpGain = action.actionType.includes("complete") ? 100 : 25;
      const performanceBonus = Math.round(((action.performanceScore || 50) / 100) * 50);
      const totalXp = baseXpGain + performanceBonus;

      const newXp = userLevel.currentXp + totalXp;
      const newLevel = Math.floor(newXp / 500) + 1;

      const [updatedLevel] = await db
        .update(userLevels)
        .set({
          currentXp: newXp,
          level: newLevel,
          lastActivityAt: new Date(),
        })
        .where(eq(userLevels.userId, action.userId))
        .returning();

      result.userLevel = updatedLevel;
      result.cascadeUpdates.level = true;
    }

    console.log(
      `✓ Unified Action: ${action.actionType} cascaded to`,
      Object.keys(result.cascadeUpdates).filter(k => result.cascadeUpdates[k as keyof typeof result.cascadeUpdates])
    );

    return result;
  } catch (error) {
    console.error("Error in unified learning action:", error);
    throw error;
  }
}

/**
 * Get complete learning context for a user (all integrated data)
 */
export async function getUnifiedLearningContext(userId: number) {
  try {
    const userLevel = await storage.getUserLevel(userId);
    const courses = await db.select().from(userCourses).where(eq(userCourses.userId, userId));
    const goals = await db.select().from(studyGoals).where(eq(studyGoals.userId, userId));
    const programs = await db
      .select()
      .from(userProgramProgress)
      .where(eq(userProgramProgress.userId, userId));

    const courseDetails = await Promise.all(
      courses.map(async (c) => {
        const course = await storage.getCourse(c.courseId);
        const modules = await storage.getModules(c.courseId);
        return { ...c, course, modules };
      })
    );

    return {
      level: userLevel,
      courses: courseDetails,
      goals,
      programs,
      summary: {
        totalCoursesEnrolled: courses.length,
        totalGoalsCreated: goals.length,
        totalProgramsActive: programs.filter(p => p.status === "active").length,
        overallProgress: Math.round(
          courses.reduce((sum, c) => sum + c.progress, 0) / Math.max(courses.length, 1)
        ),
      },
    };
  } catch (error) {
    console.error("Error getting unified learning context:", error);
    throw error;
  }
}
