import { storage } from "../storage.js";
import type { UserCourse, UserLesson } from "../../shared/schema.js";

export class EnrollmentManager {
  async enrollUser(userId: number, courseId: number): Promise<UserCourse | undefined> {
    try {
      const enrollment = await storage.createUserCourse({
        userId,
        courseId,
        progress: 0,
        currentModule: 1,
        completed: false,
      });
      console.log("[EnrollmentManager] User", userId, "enrolled in course", courseId);
      return enrollment;
    } catch (error) {
      console.error("[EnrollmentManager] Error enrolling user:", error);
      throw error;
    }
  }

  async updateProgress(userId: number, courseId: number, progress: number): Promise<UserCourse | undefined> {
    try {
      // Find the userCourse record first
      const userCourses = await storage.getUserCourses(userId);
      const userCourse = userCourses.find((uc: any) => uc.courseId === courseId);
      if (!userCourse || !userCourse.id) {
        throw new Error(`User course not found for user ${userId} and course ${courseId}`);
      }
      
      const enrollment = await storage.updateUserCourse(userCourse.id, {
        progress: Math.min(100, Math.max(0, progress)),
      });
      console.log("[EnrollmentManager] Progress updated for user", userId, "in course", courseId);
      return enrollment;
    } catch (error) {
      console.error("[EnrollmentManager] Error updating progress:", error);
      throw error;
    }
  }

  async markLessonComplete(userId: number, lessonId: number): Promise<UserLesson | undefined> {
    try {
      const created = await storage.createUserLesson({
        userId,
        lessonId,
        completed: true,
        progress: 100,
      });
      console.log("[EnrollmentManager] Lesson", lessonId, "marked complete for user", userId);
      return created;
    } catch (error) {
      console.error("[EnrollmentManager] Error marking lesson complete:", error);
      throw error;
    }
  }

  async getUserCourses(userId: number): Promise<UserCourse[]> {
    try {
      return await storage.getUserCourses(userId);
    } catch (error) {
      console.error("[EnrollmentManager] Error getting user courses:", error);
      return [];
    }
  }

  async getUserProgress(userId: number, courseId: number) {
    try {
      const userCourses = await storage.getUserCourses(userId);
      const enrollment = userCourses.find((uc: { courseId: number }) => uc.courseId === courseId);
      if (!enrollment) return null;

      const courseModules = await storage.getModules(courseId);
      let totalLessons = 0;

      for (const module of courseModules) {
        const lessons = await storage.getLessons(module.id);
        totalLessons += lessons.length;
      }

      return {
        progress: enrollment.progress,
        completedLessons: Math.round((enrollment.progress / 100) * totalLessons),
        totalLessons,
      };
    } catch (error) {
      console.error("[EnrollmentManager] Error getting progress:", error);
      return null;
    }
  }

  async completeEnrollment(userId: number, courseId: number): Promise<UserCourse | undefined> {
    try {
      // Find the userCourse record first
      const userCourses = await storage.getUserCourses(userId);
      const userCourse = userCourses.find((uc: any) => uc.courseId === courseId);
      if (!userCourse || !userCourse.id) {
        throw new Error(`User course not found for user ${userId} and course ${courseId}`);
      }
      
      const updated = await storage.updateUserCourse(userCourse.id, {
        completed: true,
        progress: 100,
      });
      console.log("[EnrollmentManager] Course", courseId, "completed for user", userId);
      return updated;
    } catch (error) {
      console.error("[EnrollmentManager] Error completing course:", error);
      throw error;
    }
  }
}

export const enrollmentManager = new EnrollmentManager();
