import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq, sql, inArray } from "drizzle-orm";
import { aiIntegration } from "./ai-integration.js";

interface CourseScore {
  courseId: number;
  score: number;
  reason: string;
  matchedTags: string[];
}

export class AICourseRecommender {
  /**
   * Content-based filtering using Jaccard similarity: |I ∩ T| / |I ∪ T|
   */
  async recommendCoursesByInterests(userId: number, limit: number = 5): Promise<CourseScore[]> {
    try {
      console.log(`[AICourseRecommender] Getting recommendations for user ${userId}`);

      // Get user interests
      const userInterests = await db.select().from(schema.userInterests).where(eq(schema.userInterests.userId, userId));
      const interestSet = new Set(userInterests.map((u: any) => u.interest.toLowerCase()));

      if (interestSet.size === 0) {
        return this.getTopCourses(limit);
      }

      // Get all courses with their tags
      const allCourses = await db.select().from(schema.courses).limit(100);
      const courseTags = await db.select().from(schema.courseTags);
      
      // Group tags by courseId
      const courseTagMap = new Map<number, Set<string>>();
      courseTags.forEach((ct: any) => {
        if (!courseTagMap.has(ct.courseId)) {
          courseTagMap.set(ct.courseId, new Set());
        }
        courseTagMap.get(ct.courseId)!.add(ct.tag.toLowerCase());
      });

      // Calculate Jaccard similarity for each course
      const scores: CourseScore[] = allCourses.map((course: any) => {
        const courseTags = courseTagMap.get(course.id) || new Set();
        
        // Jaccard Similarity: |I ∩ T| / |I ∪ T|
        const intersection = new Set([...interestSet].filter(i => courseTags.has(i)));
        const union = new Set([...interestSet, ...courseTags]);
        const jaccardScore = union.size === 0 ? 0 : (intersection.size / union.size);

        // Normalize to 0-100 scale
        const score = Math.round(jaccardScore * 100);
        
        return {
          courseId: course.id,
          score,
          reason: `${score}% match with ${Array.from(intersection).join(", ") || "similar topics"}`,
          matchedTags: Array.from(intersection),
        };
      });

      return scores.filter((s) => s.score > 0).sort((a, b) => b.score - a.score).slice(0, limit);
    } catch (error) {
      console.error("[AICourseRecommender] Error recommending courses:", error);
      return [];
    }
  }

  /**
   * Collaborative filtering using enrollment patterns
   */
  async recommendCoursesByCollaborativeFiltering(userId: number, limit: number = 5): Promise<CourseScore[]> {
    try {
      // Get user's enrolled courses
      const userCourses = await db.select().from(schema.userCourses).where(eq(schema.userCourses.userId, userId));
      const enrolledCourseIds = userCourses.map((u: any) => u.courseId);

      if (enrolledCourseIds.length === 0) {
        return this.getTopCourses(limit);
      }

      // Find similar users (users who took similar courses)
      const similarUserIds = await db
        .select({ userId: schema.userCourses.userId })
        .from(schema.userCourses)
        .where(inArray(schema.userCourses.courseId, enrolledCourseIds))
        .then((results) => [...new Set(results.map((r: any) => r.userId).filter((id) => id !== userId))]);

      if (similarUserIds.length === 0) {
        return this.getTopCourses(limit);
      }

      // Find courses taken by similar users but not by current user
      const recommendedCourses = await db
        .select({ courseId: schema.userCourses.courseId })
        .from(schema.userCourses)
        .where(sql`user_id IN (${sql.raw(similarUserIds.join(","))}) AND course_id NOT IN (${sql.raw(enrolledCourseIds.join(","))})`)
        .limit(100);

      // Score by frequency
      const courseFreq = new Map<number, number>();
      recommendedCourses.forEach((r: any) => {
        courseFreq.set(r.courseId, (courseFreq.get(r.courseId) || 0) + 1);
      });

      const scores: CourseScore[] = Array.from(courseFreq.entries())
        .map(([courseId, freq]) => ({
          courseId,
          score: freq,
          reason: `${freq} similar users recommended this`,
          matchedTags: [],
        }))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      return scores;
    } catch (error) {
      console.error("[AICourseRecommender] Error with collaborative filtering:", error);
      return [];
    }
  }

  /**
   * Get top-rated courses as fallback
   */
  private async getTopCourses(limit: number): Promise<CourseScore[]> {
    try {
      const topCourses = await db
        .select()
        .from(schema.courses)
        .orderBy(sql`COALESCE(rating, 0) DESC`)
        .limit(limit);

      return topCourses.map((course: any) => ({
        courseId: course.id,
        score: course.rating || 0,
        reason: "Top-rated course",
        matchedTags: [course.category],
      }));
    } catch (error) {
      console.error("[AICourseRecommender] Error getting top courses:", error);
      return [];
    }
  }

  /**
   * Save user interest for future recommendations
   */
  async saveUserInterest(userId: number, interest: string): Promise<void> {
    try {
      await db.insert(schema.userInterests).values({ userId, interest }).onConflictDoNothing();
      console.log(`[AICourseRecommender] Saved interest "${interest}" for user ${userId}`);
    } catch (error) {
      console.error("[AICourseRecommender] Error saving interest:", error);
    }
  }
}

export const aiCourseRecommender = new AICourseRecommender();
