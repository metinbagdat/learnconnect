import { db } from "./db.js";
// ✅ CRITICAL FIX: Lazy load schema to prevent module loading errors
// import * as schema from "../shared/schema.js"; // REMOVED - will load lazily when needed
import Anthropic from "@anthropic-ai/sdk";
import { eq, and, inArray } from "drizzle-orm";

// Lazy schema loader
let schemaModule: any = null;
function getSchema() {
  if (!schemaModule) {
    try {
      schemaModule = require("../shared/schema.js");
    } catch (err: any) {
      console.warn("Schema loading failed in ai-features.ts, using empty object:", err?.message);
      schemaModule = {};
    }
  }
  return schemaModule;
}
const schema = new Proxy({} as any, {
  get: (_target, prop) => {
    const mod = getSchema();
    return mod[prop];
  }
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * AI Features for LearnConnect
 * 1. Course Suggestions - Based on interests & past enrollments
 * 2. Study Plan Adjustment - Dynamic adjustment based on progress
 * 3. Curriculum Generation - From course description
 */

export class AIFeatures {
  /**
   * Feature 1: Suggest courses based on user interests and past enrollments
   */
  async suggestCourses(userId: number): Promise<any[]> {
    try {
      console.log(`[AI-Features] Generating course suggestions for user ${userId}`);

      // Get user profile
      const users = await db.select().from(schema.users).where(eq(schema.users.id, userId));
      const user = users[0];
      if (!user) throw new Error("User not found");

      // Get user's past enrollments
      const enrollments = await db
        .select()
        .from(schema.userCourses)
        .where(eq(schema.userCourses.userId, userId));

      // Get enrolled course details
      const enrolledCourseIds = enrollments.map(e => e.courseId);
      const enrolledCourses = enrolledCourseIds.length > 0
        ? await db.select().from(schema.courses).where(inArray(schema.courses.id, enrolledCourseIds))
        : [];

      // Get all available courses
      const allCourses = await db.select().from(schema.courses).limit(20);

      // Filter out already enrolled courses
      const availableCourses = allCourses.filter(
        c => !enrolledCourseIds.includes(c.id)
      );

      // Use AI to generate suggestions
      const prompt = `You are an educational course recommendation expert.

User Profile:
- Learning Pace: ${user.learningPace}
- Interests: ${user.interests?.join(", ") || "Not specified"}

Past Enrollments:
${enrolledCourses.map(c => `- ${c.title}: ${c.description}`).join("\n")}

Available Courses:
${availableCourses.slice(0, 10).map(c => `- ID: ${c.id}, Title: ${c.title}, Category: ${c.category}, Description: ${c.description}`).join("\n")}

Based on the user's interests, learning pace, and past enrollments, recommend 3-5 courses that would be most beneficial.

Return ONLY valid JSON (no markdown, no extra text) with this structure:
{
  "recommendations": [
    {
      "courseId": number,
      "reason": "string explaining why this course is recommended",
      "relevanceScore": number (0-100),
      "suggestedStartDate": "YYYY-MM-DD"
    }
  ],
  "summary": "brief summary of recommendations"
}`;

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type === "text") {
        try {
          const result = JSON.parse(content.text);
          console.log(`[AI-Features] Generated ${result.recommendations?.length || 0} course suggestions`);
          return result.recommendations || [];
        } catch (e) {
          console.error("[AI-Features] Failed to parse AI response:", e);
          return [];
        }
      }
    } catch (error) {
      console.error("[AI-Features] Error suggesting courses:", error);
      return [];
    }
  }

  /**
   * Feature 2: Dynamically adjust study plan based on progress
   */
  async adjustStudyPlan(userId: number, studyPlanId: number): Promise<any> {
    try {
      console.log(`[AI-Features] Analyzing progress for study plan adjustment`);

      // Get study plan
      const studyPlans = await db
        .select()
        .from(schema.studyPlans)
        .where(and(eq(schema.studyPlans.id, studyPlanId), eq(schema.studyPlans.userId, userId)));

      if (!studyPlans[0]) throw new Error("Study plan not found");
      const studyPlan = studyPlans[0];

      // Get assignments for this study plan
      const assignments = await db
        .select()
        .from(schema.assignments)
        .where(eq(schema.assignments.studyPlanId, studyPlanId));

      // Get user progress on these assignments
      const userProgress = await db
        .select()
        .from(schema.userProgress)
        .where(eq(schema.userProgress.userId, userId));

      // Calculate progress metrics
      const completedCount = userProgress.filter(p => p.status === "completed").length;
      const totalCount = assignments.length;
      const completionRate = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

      // Calculate time-based metrics
      const now = new Date();
      const startDate = new Date(studyPlan.startDate);
      const endDate = new Date(studyPlan.endDate || startDate.getTime() + 30 * 24 * 60 * 60 * 1000);
      const totalPlanDays = (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const daysElapsed = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24);
      const expectedCompletionRate = (daysElapsed / totalPlanDays) * 100;

      // Determine if user is ahead, on-track, or behind
      const paceVariance = completionRate - expectedCompletionRate;
      let adjustment = "";
      let newEndDate = endDate;

      if (paceVariance > 20) {
        adjustment = "accelerated";
        console.log(`[AI-Features] User is ${paceVariance.toFixed(1)}% ahead - could accelerate`);
      } else if (paceVariance < -20) {
        adjustment = "decelerated";
        const daysToAdd = Math.ceil((totalPlanDays * 0.25)); // Extend by 25%
        newEndDate = new Date(endDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
        console.log(`[AI-Features] User is ${Math.abs(paceVariance).toFixed(1)}% behind - extending deadline`);
      } else {
        adjustment = "on_track";
        console.log(`[AI-Features] User is on track`);
      }

      // Use AI to generate adjustment recommendation
      const prompt = `You are a learning coach analyzing a student's study plan progress.

Study Plan Progress:
- Completion Rate: ${completionRate.toFixed(1)}%
- Expected Rate: ${expectedCompletionRate.toFixed(1)}%
- Days Elapsed: ${Math.round(daysElapsed)} days
- Total Assignments: ${totalCount}
- Completed: ${completedCount}
- Current Status: ${adjustment}

Generate a JSON response with adjustment recommendations:
{
  "currentPace": "ahead" | "on_track" | "behind",
  "recommendation": "string with specific recommendation",
  "durationAdjustment": number (days to add/subtract),
  "priorityAdjustments": ["list of high-priority items"],
  "motivationalMessage": "encouraging message for the student"
}`;

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 512,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type === "text") {
        try {
          const aiAdjustment = JSON.parse(content.text);
          
          // Apply adjustment to database if significantly behind
          if (adjustment === "decelerated" && aiAdjustment.durationAdjustment > 0) {
            const newEnd = new Date(endDate.getTime() + aiAdjustment.durationAdjustment * 24 * 60 * 60 * 1000);
            await db.update(schema.studyPlans)
              .set({ endDate: newEnd } as any)
              .where(eq(schema.studyPlans.id, studyPlanId));
            
            console.log(`[AI-Features] ✓ Extended study plan by ${aiAdjustment.durationAdjustment} days`);
          }

          return {
            adjustment,
            completionRate: completionRate.toFixed(1),
            expectedRate: expectedCompletionRate.toFixed(1),
            ...aiAdjustment,
          };
        } catch (e) {
          console.error("[AI-Features] Failed to parse adjustment response:", e);
          return { adjustment, completionRate, expectedRate: expectedCompletionRate };
        }
      }
    } catch (error) {
      console.error("[AI-Features] Error adjusting study plan:", error);
      throw error;
    }
  }

  /**
   * Feature 3: Generate curriculum from course description
   */
  async generateCurriculumFromDescription(courseId: number, description: string): Promise<any> {
    try {
      console.log(`[AI-Features] Generating curriculum from description for course ${courseId}`);

      // Get course details
      const courses = await db.select().from(schema.courses).where(eq(schema.courses.id, courseId));
      if (!courses[0]) throw new Error("Course not found");
      const course = courses[0];

      // Use AI to generate structured curriculum
      const prompt = `You are an expert curriculum designer. Create a comprehensive, well-structured curriculum for the following course.

Course Title: ${course.title}
Course Description: ${description}

Generate a detailed curriculum with:
- 3-5 modules with progressive difficulty
- 2-3 lessons per module
- Each lesson should include:
  - Title
  - Learning objectives (2-3)
  - Estimated duration in minutes (30-60)
  - Key concepts to cover
  - Suggested activities
  - Assessment type (quiz, project, etc)

Return ONLY valid JSON (no markdown, no extra text) with this structure:
{
  "title": "Curriculum Title",
  "description": "brief description",
  "modules": [
    {
      "id": "module_1",
      "title": "Module Title",
      "description": "module description",
      "order": 1,
      "lessons": [
        {
          "id": "lesson_1",
          "title": "Lesson Title",
          "description": "lesson description",
          "duration": 45,
          "objectives": ["obj1", "obj2", "obj3"],
          "content": "detailed content outline",
          "activities": ["activity1", "activity2"],
          "assessment": "quiz or project description",
          "order": 1
        }
      ]
    }
  ],
  "estimatedTotalDuration": number (in minutes),
  "difficulty": "beginner|intermediate|advanced"
}`;

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type === "text") {
        try {
          const curriculum = JSON.parse(content.text);

          // Save curriculum to database
          const [savedCurriculum] = await db
            .insert(schema.curriculums)
            .values({
              courseId,
              title: curriculum.title || `Curriculum for ${course.title}`,
              structureJson: curriculum,
              aiGenerated: true,
            } as any)
            .returning();

          console.log(`[AI-Features] ✓ Curriculum generated: ${curriculum.modules?.length || 0} modules, ${curriculum.estimatedTotalDuration || 0} minutes total`);

          // Create modules and lessons in database
          for (const module of curriculum.modules || []) {
            const [dbModule] = await db
              .insert(schema.modules)
              .values({
                courseId,
                title: module.title,
                titleEn: module.title || module.title,
                titleTr: module.title || module.title,
                descriptionEn: module.description || "",
                descriptionTr: module.description || "",
                order: module.order || 1,
              } as any)
              .returning();

            for (const lesson of module.lessons || []) {
              await db
                .insert(schema.lessons)
                .values({
                  moduleId: dbModule.id,
                  title: lesson.title,
                  titleEn: lesson.title || lesson.title,
                  titleTr: lesson.title || lesson.title,
                  content: lesson.content,
                  contentEn: lesson.content || "",
                  contentTr: lesson.content || "",
                  descriptionEn: lesson.description || "",
                  descriptionTr: lesson.description || "",
                  durationMinutes: lesson.duration,
                  order: lesson.order || 1,
                } as any)
                .returning();
            }
          }

          return {
            success: true,
            curriculumId: savedCurriculum.id,
            curriculum,
          };
        } catch (e) {
          console.error("[AI-Features] Failed to parse curriculum response:", e);
          throw e;
        }
      }
    } catch (error) {
      console.error("[AI-Features] Error generating curriculum:", error);
      throw error;
    }
  }
}

export const aiFeatures = new AIFeatures();
