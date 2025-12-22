import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq } from "drizzle-orm";

/**
 * Student Dashboard Service
 * Provides comprehensive dashboard data for students including:
 * - Enrolled courses
 * - Current assignments with due dates and status
 * - Progress overall and per course
 */

export interface AssignmentWithProgress {
  id: number;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: string;
  lessonId: number | null;
  points: number;
  progress?: {
    status: string;
    completedAt: Date | null;
    score: number | null;
  };
}

export interface StudyPlanWithAssignments {
  id: number;
  courseId: number | null;
  title: string;
  startDate: Date;
  endDate: Date | null;
  status: string;
  assignments: AssignmentWithProgress[];
  progress: number; // percentage 0-100
}

export interface CourseWithStudyPlan {
  id: number;
  title: string;
  description: string;
  category: string;
  level?: string;
  progress: number; // percentage 0-100
  studyPlan: StudyPlanWithAssignments | null;
  enrollmentStatus: string;
  enrolledAt: Date;
}

export interface DashboardData {
  userId: number;
  enrolledCourses: CourseWithStudyPlan[];
  currentAssignments: AssignmentWithProgress[];
  overallProgress: number;
  totalEnrolled: number;
  completedCourses: number;
  upcomingAssignments: AssignmentWithProgress[];
  summary: {
    totalAssignments: number;
    completedAssignments: number;
    pendingAssignments: number;
    overdueAssignments: number;
  };
}

export class DashboardService {
  async getStudentDashboard(userId: number): Promise<DashboardData> {
    try {
      // 1. Get all enrollments for user
      const enrollments = await db
        .select()
        .from(schema.userCourses)
        .where(eq(schema.userCourses.userId, userId));

      // 2. For each enrollment, gather complete data
      const coursesWithStudyPlans: CourseWithStudyPlan[] = await Promise.all(
        enrollments.map(async (enrollment) => {
          // Get course details
          const [course] = await db
            .select()
            .from(schema.courses)
            .where(eq(schema.courses.id, enrollment.courseId));

          if (!course) return null;

          // Get study plan for this enrollment
          const [studyPlan] = await db
            .select()
            .from(schema.studyPlans)
            .where(
              eq(schema.studyPlans.userId, userId)
            )
            .where(eq(schema.studyPlans.courseId, enrollment.courseId));

          let studyPlanWithAssignments: StudyPlanWithAssignments | null = null;

          if (studyPlan) {
            // Get assignments for this study plan
            const assignments = await db
              .select()
              .from(schema.assignments)
              .where(eq(schema.assignments.studyPlanId, studyPlan.id));

            // Get progress for each assignment
            const assignmentsWithProgress: AssignmentWithProgress[] = await Promise.all(
              assignments.map(async (assignment) => {
                const [progress] = await db
                  .select()
                  .from(schema.userProgress)
                  .where(
                    eq(schema.userProgress.userId, userId)
                  )
                  .where(eq(schema.userProgress.assignmentId, assignment.id));

                return {
                  id: assignment.id,
                  title: assignment.title,
                  description: assignment.description,
                  dueDate: assignment.dueDate ? new Date(assignment.dueDate) : null,
                  status: assignment.status || "pending",
                  lessonId: assignment.lessonId,
                  points: assignment.points || 0,
                  progress: progress ? {
                    status: progress.status,
                    completedAt: progress.completedAt ? new Date(progress.completedAt) : null,
                    score: progress.score,
                  } : undefined,
                };
              })
            );

            // Calculate progress for this study plan
            const completedAssignments = assignmentsWithProgress.filter(
              (a) => a.progress?.status === "completed"
            ).length;
            const studyPlanProgress =
              assignmentsWithProgress.length > 0
                ? Math.round((completedAssignments / assignmentsWithProgress.length) * 100)
                : 0;

            studyPlanWithAssignments = {
              id: studyPlan.id,
              courseId: studyPlan.courseId,
              title: studyPlan.title,
              startDate: new Date(studyPlan.startDate),
              endDate: studyPlan.endDate ? new Date(studyPlan.endDate) : null,
              status: studyPlan.status || "active",
              assignments: assignmentsWithProgress,
              progress: studyPlanProgress,
            };
          }

          return {
            id: course.id,
            title: course.title,
            description: course.description,
            category: course.category,
            level: course.level,
            progress: enrollment.progress || 0,
            studyPlan: studyPlanWithAssignments,
            enrollmentStatus: enrollment.completed ? "completed" : "active",
            enrolledAt: new Date(enrollment.enrolledAt),
          };
        })
      );

      // Filter out nulls
      const validCourses = coursesWithStudyPlans.filter(
        (c): c is CourseWithStudyPlan => c !== null
      );

      // 3. Calculate overall statistics
      const allAssignments = validCourses
        .flatMap((c) => c.studyPlan?.assignments || [])
        .sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate.getTime() - b.dueDate.getTime();
        });

      const currentAssignments = allAssignments.filter(
        (a) => a.status === "pending" || a.status === "in_progress"
      );

      const now = new Date();
      const upcomingAssignments = allAssignments.filter(
        (a) => a.dueDate && a.dueDate > now && a.status === "pending"
      );

      const overdueAssignments = allAssignments.filter(
        (a) => a.dueDate && a.dueDate < now && a.status !== "completed"
      );

      const completedAssignments = allAssignments.filter(
        (a) => a.status === "completed"
      );

      const overallProgress =
        allAssignments.length > 0
          ? Math.round((completedAssignments.length / allAssignments.length) * 100)
          : 0;

      const completedCourses = validCourses.filter(
        (c) => c.enrollmentStatus === "completed"
      ).length;

      return {
        userId,
        enrolledCourses: validCourses,
        currentAssignments,
        overallProgress,
        totalEnrolled: validCourses.length,
        completedCourses,
        upcomingAssignments: upcomingAssignments.slice(0, 10), // Top 10 upcoming
        summary: {
          totalAssignments: allAssignments.length,
          completedAssignments: completedAssignments.length,
          pendingAssignments: currentAssignments.length,
          overdueAssignments: overdueAssignments.length,
        },
      };
    } catch (error) {
      console.error("[DashboardService] Error fetching dashboard:", error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();
