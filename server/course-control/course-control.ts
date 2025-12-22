import { courseManager } from "./course-manager.js";
import { contentManager } from "./content-manager.js";
import { enrollmentManager } from "./enrollment-manager.js";
import { recommendationEngine } from "./recommendation-engine.js";
import { courseAnalytics } from "./course-analytics.js";
import { coursePermissions } from "./course-permissions.js";
import { interactionChainManager } from "./interaction-chain-manager.js";
import type { Course } from "../../shared/schema.js";

export class CourseControl {
  // Unified course operations
  courseManager = courseManager;
  contentManager = contentManager;
  enrollmentManager = enrollmentManager;
  recommendationEngine = recommendationEngine;
  courseAnalytics = courseAnalytics;
  permissions = coursePermissions;
  interactionChain = interactionChainManager;

  // High-level operations combining multiple managers
  async createCourseWithContent(courseData: any, userRole: string, userId: number = 0, sessionId: string = "default"): Promise<{ course: any; status: string }> {
    if (!this.permissions.canCreateCourse(userRole)) {
      return { course: null, status: "Permission denied" };
    }

    try {
      this.interactionChain.setUserContext(userId, sessionId);
      this.interactionChain.logInteraction("course_management", "course_management", "create_course", { courseData }, sessionId);

      const course = await this.courseManager.createCourse(courseData);
      
      this.interactionChain.logInteraction("course_management", "analytics_engine", "course_created", { courseId: course?.id }, sessionId);
      
      console.log("[CourseControl] Course created with content");
      return { course, status: "success" };
    } catch (error) {
      return { course: null, status: "Error creating course" };
    }
  }

  async getUserLearningDashboard(userId: number) {
    try {
      const courses = await this.enrollmentManager.getUserCourses(userId);
      const recommendations = await this.recommendationEngine.recommendCourses(userId);
      const analytics = await this.courseAnalytics.getUserCoursesAnalytics(userId);

      return {
        enrolledCourses: courses,
        recommendations,
        analytics,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[CourseControl] Error building learning dashboard:", error);
      return null;
    }
  }

  async generateCoursePath(userId: number, interests: string[]) {
    try {
      const courses = await this.recommendationEngine.getCoursesForLearningPath(interests, 10);
      await this.enrollmentManager.enrollUser(userId, courses[0]?.id || 1);

      return {
        userId,
        interests,
        recommendedCourses: courses,
        enrolledIn: courses[0]?.id,
        status: "success",
      };
    } catch (error) {
      console.error("[CourseControl] Error generating course path:", error);
      return null;
    }
  }

  async syncWithStudyPlanner(userId: number, courseId: number) {
    try {
      const courseContent = await this.contentManager.getCourseContent(courseId);
      const progress = await this.enrollmentManager.getUserProgress(userId, courseId);

      return {
        userId,
        courseId,
        content: courseContent,
        progress,
        status: "synced",
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[CourseControl] Error syncing with study planner:", error);
      return null;
    }
  }

  async getComprehensiveCourseReport(courseId: number, userRole: string) {
    if (!this.permissions.canViewAnalytics(userRole)) {
      return { status: "Permission denied" };
    }

    try {
      const stats = await this.courseAnalytics.getCourseStats(courseId);
      const trends = await this.courseAnalytics.getEnrollmentTrends(courseId);
      const distribution = await this.courseAnalytics.getProgressDistribution(courseId);
      const topPerformers = await this.courseAnalytics.getTopPerformers(courseId);

      return {
        courseId,
        stats,
        trends,
        distribution,
        topPerformers,
        generatedAt: new Date().toISOString(),
      };
    } catch (error) {
      console.error("[CourseControl] Error generating report:", error);
      return null;
    }
  }

  getStatus(): { status: string; modules: string[]; timestamp: string } {
    return {
      status: "operational",
      modules: [
        "courseManager",
        "contentManager",
        "enrollmentManager",
        "recommendationEngine",
        "courseAnalytics",
        "permissions",
        "interactionChain",
      ],
      timestamp: new Date().toISOString(),
    };
  }

  initializeWithUserContext(userId: number, sessionId: string): void {
    this.interactionChain.setUserContext(userId, sessionId);
  }
}

export const courseControl = new CourseControl();
