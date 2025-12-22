import { storage } from "../storage.js";
import type { Course } from "../../shared/schema.js";

export class CourseManager {
  async createCourse(courseData: any): Promise<Course | undefined> {
    try {
      const course = await storage.createCourse(courseData);
      console.log("[CourseManager] Course created:", course?.id);
      return course;
    } catch (error) {
      console.error("[CourseManager] Error creating course:", error);
      throw error;
    }
  }

  async updateCourse(courseId: number, updates: Partial<Course>): Promise<Course | undefined> {
    try {
      const course = await storage.updateCourse(courseId, updates);
      console.log("[CourseManager] Course updated:", courseId);
      return course;
    } catch (error) {
      console.error("[CourseManager] Error updating course:", error);
      throw error;
    }
  }

  async getCourse(courseId: number): Promise<Course | undefined> {
    try {
      return await storage.getCourse(courseId);
    } catch (error) {
      console.error("[CourseManager] Error getting course:", error);
      return undefined;
    }
  }

  async getAllCourses(): Promise<Course[]> {
    try {
      return await storage.getCourses();
    } catch (error) {
      console.error("[CourseManager] Error getting all courses:", error);
      return [];
    }
  }

  async searchCourses(query: string): Promise<Course[]> {
    try {
      const allCourses = await storage.getCourses();
      const lowerQuery = query.toLowerCase();
      return allCourses.filter((c: Course) =>
        (c.titleEn?.toLowerCase() || "").includes(lowerQuery) ||
        (c.titleTr?.toLowerCase() || "").includes(lowerQuery) ||
        (c.descriptionEn?.toLowerCase() || "").includes(lowerQuery) ||
        (c.descriptionTr?.toLowerCase() || "").includes(lowerQuery)
      );
    } catch (error) {
      console.error("[CourseManager] Error searching courses:", error);
      return [];
    }
  }

  async getCoursesByCategory(categoryId: number): Promise<Course[]> {
    try {
      return await storage.getCoursesInCategory(categoryId);
    } catch (error) {
      console.error("[CourseManager] Error getting courses by category:", error);
      return [];
    }
  }

  async getCoursesByInstructor(instructorId: number): Promise<Course[]> {
    try {
      const allCourses = await storage.getCourses();
      return allCourses.filter((c: Course) => c.instructorId === instructorId);
    } catch (error) {
      console.error("[CourseManager] Error getting courses by instructor:", error);
      return [];
    }
  }
}

export const courseManager = new CourseManager();
