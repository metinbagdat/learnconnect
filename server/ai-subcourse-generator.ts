// Step 3: AI-Powered Subcourse (Module) Generator
// Breaks down courses into intelligently structured modules/subcourses

import { db } from "./db.js";
import { eq } from "drizzle-orm";
import { courses, modules } from "../shared/schema.js";
import Anthropic from "@anthropic-ai/sdk";
import { parseAIJSON } from "./ai-provider-service.js";

export class AISubcourseGenerator {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic();
  }

  /**
   * Generate subcourses/modules for a course
   */
  async generateSubcourses(courseId: number): Promise<any[]> {
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
    if (!course) throw new Error("Course not found");

    const prompt = `Analyze this course and break it into 5-8 logical modules/subcourses:
Course: ${course.titleEn || course.title}
Description: ${course.descriptionEn || course.description}
Level: ${course.level || "intermediate"}

Return JSON array with modules containing:
- title: module name
- description: what will be learned
- order: sequence
- estimatedHours: study time
- topics: key topics covered`;

    const response = await this.client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [{ role: "user", content: prompt }]
    });

    const subcourses = parseAIJSON(response.content[0].type === 'text' ? response.content[0].text : '[]');
    const moduleList = Array.isArray(subcourses) ? subcourses : subcourses.modules || [];

    // Save modules to database
    const savedModules = [];
    for (const subcourse of moduleList) {
      const [saved] = await db
        .insert(modules)
        .values({
          courseId,
          titleEn: subcourse.title || "Module",
          descriptionEn: subcourse.description || "",
          order: subcourse.order || 0
        })
        .returning();

      savedModules.push(saved);
    }

    return savedModules;
  }

  /**
   * Generate subcourses for multiple courses
   */
  async generateSubcoursesForCourses(courseIds: number[]): Promise<any> {
    const results: any = {};

    for (const courseId of courseIds) {
      try {
        results[courseId] = await this.generateSubcourses(courseId);
      } catch (error) {
        console.error(`Error generating subcourses for course ${courseId}:`, error);
        results[courseId] = [];
      }
    }

    return results;
  }
}

export const aiSubcourseGenerator = new AISubcourseGenerator();
