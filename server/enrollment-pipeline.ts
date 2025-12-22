import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { aiCurriculumGenerator } from "./ai-curriculum-generator.js";
import { aiPersonalization } from "./ai-personalization.js";

interface EnrollmentResult {
  success: boolean;
  studyPlan: any;
  enrollment: any;
  curriculum: any;
  assignments: any[];
  notifications: any[];
  aiPersonalized: boolean;
  aiPoweredModules: any[];
  personalizedContent: Record<string, any>;
}

export class EnrollmentPipeline {
  async processEnrollment(userId: number, courseId: number): Promise<EnrollmentResult> {
    try {
      console.log(`\n✅ [ENROLLMENT EVENT TRIGGERED] User ${userId} enrolling in Course ${courseId}`);
      console.log(`[EnrollmentPipeline] Starting 5-step automation pipeline...\n`);

      // Step 1: Create enrollment
      const enrollment = await this.createEnrollment(userId, courseId);
      console.log(`📝 [STEP 1 COMPLETE] Enrollment created: ${enrollment.id}`);

      // Step 2: Get or generate curriculum
      const curriculum = await this.getOrGenerateCurriculum(courseId);
      console.log(`📚 [STEP 2 COMPLETE] Curriculum obtained: ${curriculum.id}`);

      // Step 2.5: Generate AI personalization
      console.log(`🤖 [STEP 2.5 STARTING] Generating AI-powered personalization...`);
      const personalization = await aiPersonalization.generatePersonalizedContent(userId, courseId, curriculum);
      console.log(`🎯 [STEP 2.5 COMPLETE - AI PERSONALIZATION EVENT] Generated ${personalization.aiPoweredModules.length} AI-powered modules`);
      console.log(`   - aiPersonalized: ${personalization.aiPersonalized}`);
      console.log(`   - aiPoweredModules: ${personalization.aiPoweredModules.length} modules`);
      console.log(`   - personalizedContent: ${Object.keys(personalization.personalizedContent).length} modules with content\n`);

      // Step 3: Create personalized study plan
      const studyPlan = await this.createStudyPlan(userId, courseId, curriculum);
      console.log(`📋 [STEP 3 COMPLETE] Study plan created: ${studyPlan.id}`);

      // Step 4: Generate initial assignments
      const assignments = await this.generateAssignments(userId, studyPlan, curriculum, courseId);
      console.log(`✏️  [STEP 4 COMPLETE] Assignments generated: ${assignments.length} assignments`);

      // Step 5: Trigger welcome package
      const notifications = await this.sendWelcomePackage(userId, courseId, studyPlan);
      console.log(`📧 [STEP 5 COMPLETE] Welcome notifications sent: ${notifications.length} notifications`);

      console.log(`\n✨ [ENROLLMENT PIPELINE COMPLETE] All 5 steps finished successfully!`);
      console.log(`📊 Summary: Enrollment(${enrollment.id}), StudyPlan(${studyPlan.id}), Assignments(${assignments.length}), AIModules(${personalization.aiPoweredModules.length})\n`);

      return {
        success: true,
        studyPlan,
        enrollment,
        curriculum,
        assignments,
        notifications,
        aiPersonalized: personalization.aiPersonalized,
        aiPoweredModules: personalization.aiPoweredModules,
        personalizedContent: personalization.personalizedContent,
      };
    } catch (error) {
      console.error(`[EnrollmentPipeline] Error during enrollment:`, error);
      await this.handleEnrollmentError(userId, courseId, error);
      throw error;
    }
  }

  private async createEnrollment(userId: number, courseId: number) {
    try {
      const existing = await db.select()
        .from(schema.userCourses)
        .where(eq(schema.userCourses.userId, userId))
        .limit(1);

      if (existing.length > 0 && existing[0].courseId === courseId) {
        throw new Error("User already enrolled in this course");
      }

      const [enrollment] = await db.insert(schema.userCourses).values({
        userId,
        courseId,
        progress: 0,
        currentModule: 1,
        completed: false,
      }).returning();

      return enrollment;
    } catch (error) {
      console.error("[EnrollmentPipeline] Failed to create enrollment:", error);
      throw error;
    }
  }

  private async getOrGenerateCurriculum(courseId: number) {
    try {
      const [existing] = await db.select()
        .from(schema.curriculums)
        .where(eq(schema.curriculums.courseId, courseId));

      if (existing) {
        console.log(`[EnrollmentPipeline] Curriculum exists for course ${courseId}`);
        return existing;
      }

      // Generate curriculum using AI
      const curriculumStructure = await aiCurriculumGenerator.generateCurriculum(courseId, "beginner");

      const [curriculum] = await db.insert(schema.curriculums).values({
        courseId,
        title: `Beginner Curriculum for Course ${courseId}`,
        structureJson: curriculumStructure,
        aiGenerated: true,
      }).returning();

      console.log(`[EnrollmentPipeline] Curriculum generated via AI for course ${courseId}`);
      return curriculum;
    } catch (error) {
      console.error("[EnrollmentPipeline] Failed to get or generate curriculum:", error);
      throw error;
    }
  }

  private async createStudyPlan(userId: number, courseId: number, curriculum: any) {
    try {
      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

      const [studyPlan] = await db.insert(schema.studyPlans).values({
        userId,
        courseId,
        curriculumId: curriculum.id,
        title: `Study Plan - Course ${courseId}`,
        startDate,
        endDate,
        status: "active",
      }).returning();

      console.log(`[EnrollmentPipeline] Study plan created: ${studyPlan.id} (${courseId}, curriculum: ${curriculum.id})`);
      return studyPlan;
    } catch (error) {
      console.error("[EnrollmentPipeline] Failed to create study plan:", error);
      throw error;
    }
  }

  private async generateAssignments(
    userId: number,
    studyPlan: any,
    curriculum: any,
    courseId: number
  ) {
    try {
      const assignments: any[] = [];
      
      // Get or create modules
      let modules = await db.select()
        .from(schema.modules)
        .where(eq(schema.modules.courseId, courseId));

      if (modules.length === 0 && curriculum?.structureJson?.modules) {
        // Create modules from curriculum
        for (const mod of curriculum.structureJson.modules.slice(0, 3)) {
          const [newModule] = await db.insert(schema.modules).values({
            courseId: courseId,
            title: mod.title || `Module ${modules.length + 1}`,
            order: modules.length,
          }).returning();
          modules.push(newModule);
        }
      }

      const startDate = new Date();
      let cumulativeDuration = 0;

      for (const module of modules) {
        let lessons = await db.select()
          .from(schema.lessons)
          .where(eq(schema.lessons.moduleId, module.id));

        if (lessons.length === 0 && curriculum?.structureJson?.modules) {
          // Create lessons from curriculum
          const curModule = curriculum.structureJson.modules.find((m: any) => m.title === module.title);
          if (curModule?.lessons) {
            for (const les of curModule.lessons.slice(0, 2)) {
              const [newLesson] = await db.insert(schema.lessons).values({
                moduleId: module.id,
                title: les.title || `Lesson ${lessons.length + 1}`,
                content: les.content || les.title || "",
                durationMinutes: les.duration || 30,
                order: lessons.length,
              }).returning();
              lessons.push(newLesson);
            }
          }
        }

        for (const lesson of lessons) {
          cumulativeDuration += lesson.durationMinutes || 60;
          const dueDate = new Date(startDate.getTime() + cumulativeDuration * 60 * 1000);

          const [assignment] = await db.insert(schema.assignments).values({
            title: `${module.title} - ${lesson.title}`,
            description: lesson.content || lesson.title,
            courseId,
            studyPlanId: studyPlan.id,
            lessonId: lesson.id,
            dueDate: dueDate as any,
            points: 10,
            status: "pending",
          }).returning();

          assignments.push(assignment);

          // Create initial progress tracking
          await db.insert(schema.userProgress).values({
            userId,
            assignmentId: assignment.id,
            status: "pending",
          }).onConflictDoNothing();
        }
      }

      console.log(`[EnrollmentPipeline] Generated ${assignments.length} assignments with cumulative due dates`);
      return assignments;
    } catch (error) {
      console.error("[EnrollmentPipeline] Failed to generate assignments:", error);
      throw error;
    }
  }

  private async sendWelcomePackage(userId: number, courseId: number, studyPlan: any) {
    try {
      const [course] = await db.select().from(schema.courses).where(eq(schema.courses.id, courseId));
      const notifications: any[] = [];

      // Welcome notification
      const [welcomeNotif] = await db.insert(schema.notifications).values({
        userId,
        type: "due_assignment",
        title: `Welcome to ${course?.title || "Your Course"}!`,
        message: `You've been enrolled successfully. Your personalized study plan is ready. Start learning today!`,
        data: { courseId, studyPlanId: studyPlan.id },
      }).returning();

      notifications.push(welcomeNotif);

      // Study plan overview notification
      const [planNotif] = await db.insert(schema.notifications).values({
        userId,
        type: "due_assignment",
        title: "Your Study Plan is Ready",
        message: `Your 30-day personalized study plan has been created. Check your dashboard to view assignments and due dates.`,
        data: { studyPlanId: studyPlan.id },
      }).returning();

      notifications.push(planNotif);

      // First assignment reminder
      const [firstAssignmentNotif] = await db.insert(schema.notifications).values({
        userId,
        type: "due_assignment",
        title: "First Assignment Ready",
        message: "Your first assignment is ready! Begin with the foundational concepts.",
        data: { courseId },
      }).returning();

      notifications.push(firstAssignmentNotif);

      console.log(`[EnrollmentPipeline] Sent ${notifications.length} welcome notifications`);
      return notifications;
    } catch (error) {
      console.error("[EnrollmentPipeline] Failed to send welcome package:", error);
      throw error;
    }
  }

  private async handleEnrollmentError(userId: number, courseId: number, error: any) {
    try {
      console.error(`[EnrollmentPipeline] Handling enrollment error for user ${userId}, course ${courseId}:`, error);

      // Create error notification
      await db.insert(schema.notifications).values({
        userId,
        type: "due_assignment",
        title: "Enrollment Error",
        message: `There was an issue enrolling in this course. Please try again or contact support: ${error.message}`,
        data: { courseId, error: error.message },
      }).onConflictDoNothing();

      // Log the error for monitoring
      console.error("[EnrollmentPipeline] Error notification sent to user");
    } catch (logError) {
      console.error("[EnrollmentPipeline] Failed to handle enrollment error:", logError);
    }
  }
}

export const enrollmentPipeline = new EnrollmentPipeline();

// Export singleton for easy access
export default enrollmentPipeline;
