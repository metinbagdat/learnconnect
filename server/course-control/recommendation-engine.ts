import { storage } from "../storage.js";
import type { Course } from "../../shared/schema.js";

export class RecommendationEngine {
  async recommendCourses(userId: number, limit: number = 5): Promise<Course[]> {
    try {
      const userCourses = await storage.getUserCourses(userId);
      const enrolledCourseIds = new Set(userCourses.map((uc: { courseId: number }) => uc.courseId));

      const allCourses = await storage.getCourses();
      const user = await storage.getUser(userId);

      const recommendations = allCourses.filter((c: Course) => !enrolledCourseIds.has(c.id));

      const scored = recommendations.map((course: Course) => {
        let score = 0;

        if (user?.interests && Array.isArray(user.interests)) {
          const courseTitle = (course.titleEn || "") + (course.titleTr || "");
          for (const interest of user.interests) {
            if (courseTitle.toLowerCase().includes((interest as string).toLowerCase())) {
              score += 30;
            }
          }
        }

        if (course.rating && course.rating >= 4) {
          score += 20;
        }

        if (course.level === "Beginner") {
          score += 10;
        }

        return { course, score };
      });

      return scored
        .sort((a: { course: Course; score: number }, b: { course: Course; score: number }) => b.score - a.score)
        .slice(0, limit)
        .map((item: { course: Course; score: number }) => item.course);
    } catch (error) {
      console.error("[RecommendationEngine] Error recommending courses:", error);
      return [];
    }
  }

  async getRelatedCourses(courseId: number, limit: number = 5): Promise<Course[]> {
    try {
      const course = await storage.getCourse(courseId);
      if (!course) return [];

      const allCourses = await storage.getCourses();
      const related = allCourses.filter(
        (c: Course) => c.id !== courseId && (c.categoryId === course.categoryId || c.level === course.level)
      );

      return related.slice(0, limit);
    } catch (error) {
      console.error("[RecommendationEngine] Error getting related courses:", error);
      return [];
    }
  }

  async getTrendingCourses(limit: number = 5): Promise<Course[]> {
    try {
      const allCourses = await storage.getCourses();
      const trending = allCourses
        .filter((c: Course) => c.rating !== null)
        .sort((a: Course, b: Course) => (b.rating || 0) - (a.rating || 0))
        .slice(0, limit);

      return trending;
    } catch (error) {
      console.error("[RecommendationEngine] Error getting trending courses:", error);
      return [];
    }
  }

  async getCoursesForLearningPath(interests: string[], limit: number = 10): Promise<Course[]> {
    try {
      const allCourses = await storage.getCourses();

      const scored = allCourses.map((course: Course) => {
        let score = 0;
        const courseText = ((course.titleEn || "") + (course.titleTr || "")).toLowerCase();

        for (const interest of interests) {
          if (courseText.includes(interest.toLowerCase())) {
            score += 20;
          }
        }

        if (course.rating && course.rating >= 4) {
          score += 10;
        }

        if (course.level === "Beginner") {
          score += 5;
        }

        return { course, score };
      });

      return scored
        .filter((item: { course: Course; score: number }) => item.score > 0)
        .sort((a: { course: Course; score: number }, b: { course: Course; score: number }) => b.score - a.score)
        .slice(0, limit)
        .map((item: { course: Course; score: number }) => item.course);
    } catch (error) {
      console.error("[RecommendationEngine] Error generating learning path:", error);
      return [];
    }
  }
}

export const recommendationEngine = new RecommendationEngine();
