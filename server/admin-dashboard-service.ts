import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq } from "drizzle-orm";

/**
 * Admin Dashboard Service
 * Provides comprehensive admin analytics including:
 * - Course statistics (enrollments, progress)
 * - Student performance metrics
 * - Enrollment pipeline health
 */

export interface CourseStats {
  id: number;
  title: string;
  category: string;
  level: string | null | undefined;
  enrollmentCount: number;
  completedEnrollments: number;
  activeEnrollments: number;
  averageProgress: number;
  totalAssignments: number;
  completedAssignments: number;
  studentProgress: StudentProgressInCourse[];
}

export interface StudentProgressInCourse {
  userId: number;
  displayName: string;
  progress: number;
  assignmentsCompleted: number;
  totalAssignments: number;
  status: "completed" | "active" | "enrolled";
}

export interface AdminDashboardData {
  totalCourses: number;
  totalEnrollments: number;
  totalStudents: number;
  averageCourseProgress: number;
  courses: CourseStats[];
  topPerformingCourses: CourseStats[];
  pipelineHealth: {
    totalEnrollments: number;
    successfulEnrollments: number;
    studyPlansCreated: number;
    assignmentsGenerated: number;
    successRate: number;
  };
}

export class AdminDashboardService {
  async getAdminDashboard(): Promise<AdminDashboardData> {
    try {
      console.log("[AdminDashboardService] Generating admin dashboard");

      // Get all courses
      const allCourses = await db.select().from(schema.courses);

      // Get all enrollments
      const allEnrollments = await db.select().from(schema.userCourses);

      // Get all users
      const allUsers = await db.select().from(schema.users).where(eq(schema.users.role, "student"));

      // Build course stats
      const courseStats: CourseStats[] = await Promise.all(
        allCourses.map(async (course) => {
          // Get enrollments for this course
          const courseEnrollments = allEnrollments.filter(e => e.courseId === course.id);
          const completedEnrollments = courseEnrollments.filter(e => e.completed).length;
          const activeEnrollments = courseEnrollments.filter(e => !e.completed).length;

          // Get assignments for this course
          const assignments = await db
            .select()
            .from(schema.assignments)
            .where(eq(schema.assignments.courseId, course.id));

          // Get progress for students in this course
          const studentProgress: StudentProgressInCourse[] = await Promise.all(
            courseEnrollments.map(async (enrollment) => {
              const [user] = await db
                .select()
                .from(schema.users)
                .where(eq(schema.users.id, enrollment.userId));

              // Get completed assignments for this student in this course
              const studentAssignments = assignments;
              const completedCount = await db
                .select()
                .from(schema.userProgress)
                .where(eq(schema.userProgress.userId, enrollment.userId));

              const completed = completedCount.filter(p => p.status === "completed").length;
              const progress =
                studentAssignments.length > 0
                  ? Math.round((completed / studentAssignments.length) * 100)
                  : 0;

              return {
                userId: enrollment.userId,
                displayName: user?.displayName || user?.username || "Unknown",
                progress,
                assignmentsCompleted: completed,
                totalAssignments: studentAssignments.length,
                status: enrollment.completed ? "completed" : "active"
              };
            })
          );

          // Calculate course averages
          const totalCompleted = studentProgress.reduce((sum, sp) => sum + sp.assignmentsCompleted, 0);
          const totalAssignments = studentProgress.reduce((sum, sp) => sum + sp.totalAssignments, 0);
          const averageProgress =
            studentProgress.length > 0
              ? Math.round(studentProgress.reduce((sum, sp) => sum + sp.progress, 0) / studentProgress.length)
              : 0;

          return {
            id: course.id,
            title: course.title,
            category: course.category,
            level: course.level,
            enrollmentCount: courseEnrollments.length,
            completedEnrollments,
            activeEnrollments,
            averageProgress,
            totalAssignments: assignments.length,
            completedAssignments: totalCompleted,
            studentProgress
          };
        })
      );

      // Sort by enrollment count to find top performing
      const topPerformingCourses = courseStats
        .sort((a, b) => b.averageProgress - a.averageProgress)
        .slice(0, 5);

      // Calculate overall metrics
      const totalEnrollments = allEnrollments.length;
      const completedStudents = allEnrollments.filter(e => e.completed).length;
      const uniqueStudents = new Set(allEnrollments.map(e => e.userId)).size;

      // Get pipeline health
      const studyPlans = await db.select().from(schema.studyPlans);
      const allAssignments = await db.select().from(schema.assignments);

      const pipelineHealth = {
        totalEnrollments,
        successfulEnrollments: completedStudents,
        studyPlansCreated: studyPlans.length,
        assignmentsGenerated: allAssignments.length,
        successRate: totalEnrollments > 0 ? Math.round((completedStudents / totalEnrollments) * 100) : 0
      };

      // Calculate overall average progress
      const allProgress = courseStats.reduce((sum, c) => sum + c.averageProgress, 0);
      const averageCourseProgress =
        courseStats.length > 0 ? Math.round(allProgress / courseStats.length) : 0;

      console.log(
        `[AdminDashboardService] ✓ Generated dashboard: ${allCourses.length} courses, ${totalEnrollments} enrollments`
      );

      return {
        totalCourses: allCourses.length,
        totalEnrollments,
        totalStudents: uniqueStudents,
        averageCourseProgress,
        courses: courseStats,
        topPerformingCourses,
        pipelineHealth
      };
    } catch (error) {
      console.error("[AdminDashboardService] Error generating dashboard:", error);
      throw error;
    }
  }

  /**
   * Get detailed stats for a single course
   */
  async getCourseDetailedStats(courseId: number): Promise<CourseStats> {
    try {
      const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, courseId));

      if (!course) throw new Error("Course not found");

      const enrollments = await db
        .select()
        .from(schema.userCourses)
        .where(eq(schema.userCourses.courseId, courseId));

      const assignments = await db
        .select()
        .from(schema.assignments)
        .where(eq(schema.assignments.courseId, courseId));

      const completedEnrollments = enrollments.filter(e => e.completed).length;
      const activeEnrollments = enrollments.filter(e => !e.completed).length;

      // Get progress for each student
      const studentProgress: StudentProgressInCourse[] = await Promise.all(
        enrollments.map(async (enrollment) => {
          const [user] = await db
            .select()
            .from(schema.users)
            .where(eq(schema.users.id, enrollment.userId));

          const completedCount = await db
            .select()
            .from(schema.userProgress)
            .where(eq(schema.userProgress.userId, enrollment.userId));

          const completed = completedCount.filter(p => p.status === "completed").length;
          const progress =
            assignments.length > 0 ? Math.round((completed / assignments.length) * 100) : 0;

          return {
            userId: enrollment.userId,
            displayName: user?.displayName || user?.username || "Unknown",
            progress,
            assignmentsCompleted: completed,
            totalAssignments: assignments.length,
            status: enrollment.completed ? "completed" : "active"
          };
        })
      );

      const totalCompleted = studentProgress.reduce((sum, sp) => sum + sp.assignmentsCompleted, 0);
      const averageProgress =
        studentProgress.length > 0
          ? Math.round(studentProgress.reduce((sum, sp) => sum + sp.progress, 0) / studentProgress.length)
          : 0;

      return {
        id: course.id,
        title: course.title,
        category: course.category,
        level: course.level,
        enrollmentCount: enrollments.length,
        completedEnrollments,
        activeEnrollments,
        averageProgress,
        totalAssignments: assignments.length,
        completedAssignments: totalCompleted,
        studentProgress
      };
    } catch (error) {
      console.error("[AdminDashboardService] Error getting course stats:", error);
      throw error;
    }
  }

  /**
   * Get enrollment trends over time
   */
  async getEnrollmentTrends(): Promise<any[]> {
    try {
      const enrollments = await db.select().from(schema.userCourses);

      // Group by date
      const trends = enrollments.reduce(
        (acc, enrollment) => {
          const date = new Date(enrollment.enrolledAt).toISOString().split("T")[0];
          const existing = acc.find(t => t.date === date);

          if (existing) {
            existing.count++;
          } else {
            acc.push({ date, count: 1 });
          }

          return acc;
        },
        [] as { date: string; count: number }[]
      );

      return trends.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error("[AdminDashboardService] Error getting enrollment trends:", error);
      return [];
    }
  }
}

export const adminDashboardService = new AdminDashboardService();
