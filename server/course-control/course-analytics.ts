import { storage } from "../storage.js";
import { db } from "../db.js";
import { userCourses } from "../../shared/schema.js";

export class CourseAnalytics {
  async getCourseStats(courseId: number) {
    try {
      const allEnrollments = await db.select().from(userCourses);
      const courseEnrollments = allEnrollments.filter((e: any) => e.courseId === courseId);

      const completedCount = courseEnrollments.filter((e: any) => e.completed).length;
      const avgProgress =
        courseEnrollments.length > 0
          ? Math.round(courseEnrollments.reduce((sum: number, e: any) => sum + e.progress, 0) / courseEnrollments.length)
          : 0;

      return {
        courseId,
        totalEnrollments: courseEnrollments.length,
        completedEnrollments: completedCount,
        averageProgress: avgProgress,
        completionRate:
          courseEnrollments.length > 0 ? Math.round((completedCount / courseEnrollments.length) * 100) : 0,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[CourseAnalytics] Error getting course stats:", error);
      return null;
    }
  }

  async getUserCoursesAnalytics(userId: number) {
    try {
      const userCourses = await storage.getUserCourses(userId);
      const analytics = {
        userId,
        totalCoursesEnrolled: userCourses.length,
        completedCourses: userCourses.filter((uc: any) => uc.completed).length,
        averageProgress:
          userCourses.length > 0
            ? Math.round(userCourses.reduce((sum: number, uc: any) => sum + uc.progress, 0) / userCourses.length)
            : 0,
        courses: userCourses.map((uc: any) => ({
          courseId: uc.courseId,
          progress: uc.progress,
          completed: uc.completed,
          enrolledAt: uc.enrolledAt,
        })),
        timestamp: new Date().toISOString(),
      };

      return analytics;
    } catch (error) {
      console.error("[CourseAnalytics] Error getting user analytics:", error);
      return null;
    }
  }

  async getProgressDistribution(courseId: number) {
    try {
      const allEnrollments = await db.select().from(userCourses);
      const courseEnrollments = allEnrollments.filter((e: any) => e.courseId === courseId);

      const distribution = {
        "0-25%": 0,
        "26-50%": 0,
        "51-75%": 0,
        "76-99%": 0,
        "100%": 0,
      };

      for (const enrollment of courseEnrollments) {
        if (enrollment.progress === 100) {
          distribution["100%"]++;
        } else if (enrollment.progress >= 76) {
          distribution["76-99%"]++;
        } else if (enrollment.progress >= 51) {
          distribution["51-75%"]++;
        } else if (enrollment.progress >= 26) {
          distribution["26-50%"]++;
        } else {
          distribution["0-25%"]++;
        }
      }

      return {
        courseId,
        distribution,
        totalEnrollments: courseEnrollments.length,
      };
    } catch (error) {
      console.error("[CourseAnalytics] Error getting progress distribution:", error);
      return null;
    }
  }

  async getTopPerformers(courseId: number, limit: number = 10) {
    try {
      const allEnrollments = await db.select().from(userCourses);
      const courseEnrollments = allEnrollments
        .filter((e: any) => e.courseId === courseId)
        .sort((a: any, b: any) => b.progress - a.progress)
        .slice(0, limit);

      return {
        courseId,
        topPerformers: courseEnrollments,
      };
    } catch (error) {
      console.error("[CourseAnalytics] Error getting top performers:", error);
      return null;
    }
  }

  async getEnrollmentTrends(courseId: number) {
    try {
      const allEnrollments = await db.select().from(userCourses);
      const courseEnrollments = allEnrollments.filter((e: any) => e.courseId === courseId);

      // Group by date
      const trends = courseEnrollments.reduce(
        (acc: any[], enrollment: any) => {
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
      console.error("[CourseAnalytics] Error getting enrollment trends:", error);
      return [];
    }
  }
}

export const courseAnalytics = new CourseAnalytics();
