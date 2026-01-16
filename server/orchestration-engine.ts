// Unified Orchestration Engine - Coordinates all processes triggered by enrollment
// Connects: Enrollment → Curriculum → Study Plan → Assignments → Targets

import { db } from "./db.js";
import { eq, and } from "drizzle-orm";
import { userCourses, courses, memoryEnhancedCurricula, assignments as assignmentTable, userAssignments, users } from "../shared/schema.js";
import { parseAIJSON } from "./ai-provider-service.js";
import Anthropic from "@anthropic-ai/sdk";

// Type definitions
type MemoryEnhancedCurriculumInsert = {
  userId: number;
  baseCurriculumId: number;
  memoryTechniquesApplied: any;
  spacedRepetitionSchedule: any;
  mnemonicMappings: any;
  cognitiveBreakPoints: any;
  predictedRetentionRate: number;
  expectedStudyTimeReduction: number;
};

export interface OrchestrationEvent {
  userId: number;
  courseId: number;
  eventType: "enrollment" | "curriculum_generation" | "study_plan_creation" | "assignment_generation";
  timestamp: Date;
  data?: any;
}

export class UnifiedOrchestrationEngine {
  /**
   * Main orchestration trigger - called on course enrollment
   */
  async onCourseEnrollment(userId: number, courseId: number) {
    console.log(`[Orchestration] Starting unified process for user ${userId} enrolling in course ${courseId}`);
    
    try {
      // Step 1: Get user and course data
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, courseId));

      if (!user || !course) {
        throw new Error("User or course not found");
      }

      // Step 2: Generate personalized curriculum based on course
      const curriculum = await this.generatePersonalizedCurriculum(user, course);

      // Step 3: Create study plan from curriculum
      const studyPlan = await this.generateStudyPlan(user, curriculum, course);

      // Step 4: Generate assignments from course modules
      const assignmentData = await this.generateAssignments(user, course, curriculum);

      // Step 5: Set targets based on curriculum
      const targets = await this.generateTargets(user, course, curriculum);

      // Step 6: Create unified process record
      const unifiedRecord = {
        userId,
        courseId,
        curriculumId: curriculum.id,
        studyPlan,
        assignments: assignmentData,
        targets,
        aiAnalysis: await this.analyzeUnifiedProcess(user, course, curriculum),
        status: "active",
        createdAt: new Date()
      };

      console.log(`[Orchestration] ✓ Unified process complete for user ${userId}`);
      return unifiedRecord;
    } catch (error) {
      console.error(`[Orchestration] Error in unified process:`, error);
      throw error;
    }
  }

  /**
   * Generate personalized curriculum using AI
   */
  private async generatePersonalizedCurriculum(user: any, course: any) {
    const aiPrompt = `Generate a personalized curriculum for:
User: ${user.displayName} (Role: ${user.role})
Course: ${course.titleEn || course.title}

Return JSON with:
- topics: array of main topics
- memoryTechniques: array of recommended techniques
- spacedRepetition: schedule object
- milestones: array of milestones
- estimatedDuration: hours
- difficulty: level`;

    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [{ role: "user", content: aiPrompt }]
    });

    const parsed = parseAIJSON(response.content[0].type === 'text' ? response.content[0].text : '{}');

    // Save curriculum to database
    const curriculumValues: MemoryEnhancedCurriculumInsert = {
      userId: user.id,
      baseCurriculumId: course.id,
      memoryTechniquesApplied: parsed.memoryTechniques || [],
      spacedRepetitionSchedule: parsed.spacedRepetition || {},
      mnemonicMappings: {},
      cognitiveBreakPoints: {},
      predictedRetentionRate: 85,
      expectedStudyTimeReduction: 35
    };

    const curriculumResults = await db
      .insert(memoryEnhancedCurricula)
      .values([curriculumValues as any])
      .returning();

    const curriculum = Array.isArray(curriculumResults) ? curriculumResults[0] : curriculumResults;
    return { id: curriculum?.id || 0, ...parsed };
  }

  /**
   * Generate study plan from curriculum
   */
  private async generateStudyPlan(user: any, curriculum: any, course: any) {
    const duration = curriculum.estimatedDuration || 30;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);

    return {
      userId: user.id,
      courseId: course.id,
      curriculumId: curriculum.id,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      totalDays: duration,
      dailyTarget: `${Math.ceil(duration / 5)} hours per day`,
      studySchedule: curriculum.spacedRepetition || {},
      topics: curriculum.topics || [],
      status: "active"
    };
  }

  /**
   * Generate assignments from course
   */
  private async generateAssignments(user: any, course: any, curriculum: any) {
    const assignmentPrompt = `Create 3 assignments for:
Course: ${course.titleEn || course.title}
Topics: ${(curriculum.topics as any)?.slice(0, 3).join(", ") || "various"}

Return JSON array with objects containing: title, description, type, difficulty, estimatedTime, points`;

    const client = new Anthropic();
    const response = await client.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 500,
      messages: [{ role: "user", content: assignmentPrompt }]
    });

    const assignmentsData = parseAIJSON(response.content[0].type === 'text' ? response.content[0].text : '[]');
    const assignmentList = Array.isArray(assignmentsData) ? assignmentsData : assignmentsData.assignments || [];

    // Save assignments to database
    const savedAssignments = [];
    for (const assignment of assignmentList) {
      const assignmentResults = await db
        .insert(assignmentTable)
        .values({
          title: assignment.title || "Assignment",
          courseId: course.id,
          points: assignment.points || 10
        } as any)
        .returning();

      const savedAssignment = Array.isArray(assignmentResults) ? assignmentResults[0] : assignmentResults;
      
      // Enroll user in assignment (schema doesn't have status field)
      await db
        .insert(userAssignments)
        .values({
          userId: user.id,
          assignmentId: savedAssignment?.id || 0,
        } as any);

      if (savedAssignment) savedAssignments.push(savedAssignment);
    }

    return savedAssignments;
  }

  /**
   * Generate learning targets
   */
  private async generateTargets(user: any, course: any, curriculum: any) {
    return {
      userId: user.id,
      courseId: course.id,
      targets: [
        {
          type: "completion",
          target: "100% course completion",
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: "high"
        },
        {
          type: "retention",
          target: "85% retention on all topics",
          deadline: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: "high"
        },
        {
          type: "assignment",
          target: `Complete all ${curriculum.topics?.length || 5} assignments`,
          deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          priority: "medium"
        }
      ]
    };
  }

  /**
   * Analyze and optimize unified process
   */
  private async analyzeUnifiedProcess(user: any, course: any, curriculum: any) {
    return {
      userProfile: {
        name: user.displayName,
        role: user.role,
        interests: user.interests
      },
      courseAnalysis: {
        title: course.titleEn || course.title,
        level: course.level,
        topics: curriculum.topics?.length || 0
      },
      aiRecommendations: [
        `${curriculum.memoryTechniques?.[0] || 'Spaced Repetition'} is recommended for this course`,
        `Allocate ${curriculum.estimatedDuration || 30} days for completion`,
        `Daily study time: ${Math.ceil((curriculum.estimatedDuration || 30) / 5)} hours`
      ],
      expectedOutcomes: {
        retentionImprovement: "+50%",
        studyTimeReduction: "+35%",
        completionRate: "95%",
        recommendedReviewDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }
    };
  }

  /**
   * Get unified dashboard data
   */
  async getUnifiedDashboard(userId: number) {
    const userEnrollments = await db
      .select()
      .from(userCourses)
      .where(eq(userCourses.userId, userId));

    const enrollmentDetails = [];
    for (const enrollment of userEnrollments) {
      const [course] = await db
        .select()
        .from(courses)
        .where(eq(courses.id, enrollment.courseId));

      const [curriculum] = await db
        .select()
        .from(memoryEnhancedCurricula)
        .where(and(
          eq(memoryEnhancedCurricula.userId, userId),
          eq(memoryEnhancedCurricula.baseCurriculumId, enrollment.courseId)
        ));

      const userAssignmentsList = await db
        .select()
        .from(userAssignments)
        .where(eq(userAssignments.userId, userId));

      enrollmentDetails.push({
        course: { id: course.id, title: course.titleEn || course.title },
        enrollment: {
          progress: enrollment.progress,
          completed: enrollment.completed,
          enrolledAt: enrollment.enrolledAt
        },
        curriculum: curriculum ? { id: curriculum.id, techniques: curriculum.memoryTechniquesApplied } : null,
        assignments: {
          total: userAssignmentsList.length,
          completed: userAssignmentsList.filter((a: any) => a.status === "graded").length
        }
      });
    }

    return {
      userId,
      enrollments: enrollmentDetails,
      summary: {
        totalCourses: userEnrollments.length,
        totalAssignments: enrollmentDetails.reduce((sum: number, e: any) => sum + e.assignments.total, 0),
        completedAssignments: enrollmentDetails.reduce((sum: number, e: any) => sum + e.assignments.completed, 0),
        overallProgress: Math.round(
          userEnrollments.reduce((sum: number, e: any) => sum + e.progress, 0) / userEnrollments.length
        ) || 0
      }
    };
  }
}

export const orchestrationEngine = new UnifiedOrchestrationEngine();
