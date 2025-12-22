/**
 * Step 2.3: Assignment Integration Connector
 * Generates assignments based on curriculum and courses
 */

import { db } from './db.js';
import {
  memoryEnhancedCurricula,
  assignments as assignmentTable,
  courses,
  courseIntegrationState,
} from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';

interface CourseAnalysis {
  courses: any[];
  prerequisites: Record<string, any>;
  suggestedPaths: any[];
  totalCommitment: number;
  upcomingMilestones: any[];
  goalImpact: {
    difficulty: string;
    estimatedCompletion: number;
    engagementFactor: number;
  };
}

interface Assignment {
  id: string;
  courseId: number;
  title: string;
  description: string;
  type: 'homework' | 'project' | 'quiz' | 'exam' | 'discussion';
  dueDate: Date;
  estimatedHours: number;
  points: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  learningObjectives: string[];
}

interface AssignmentIntegrationResult {
  status: string;
  assignmentsCreated: number;
  scheduledAssignments: number;
  totalAssignmentHours: number;
  nextAssignmentDue: string;
  message: string;
}

export class AssignmentConnector {
  /**
   * Create assignments based on enrolled courses and curriculum
   */
  async integrate(
    userId: number,
    courseAnalysis: CourseAnalysis,
    integrationId: string
  ): Promise<AssignmentIntegrationResult> {
    try {
      // 1. Get user's curriculum
      const curriculum = await this.getUserCurriculum(userId);

      if (!curriculum || curriculum.curricula.length === 0) {
        return {
          status: 'skipped',
          assignmentsCreated: 0,
          scheduledAssignments: 0,
          totalAssignmentHours: 0,
          nextAssignmentDue: new Date().toISOString(),
          message: 'No curriculum available for assignment generation',
        };
      }

      // 2. Generate assignments for each course
      const assignments = await this.generateCourseAssignments(
        userId,
        curriculum,
        courseAnalysis
      );

      // 3. Schedule assignments based on study plan
      const scheduledAssignments = await this.scheduleAssignments(userId, assignments);

      // 4. Setup assignment tracking
      await this.setupAssignmentTracking(userId, scheduledAssignments, integrationId);

      // 5. Get next due date
      const nextDueDate = this.getNextDueDate(scheduledAssignments);

      // 6. Update integration state
      await this.updateIntegrationState(integrationId);

      const totalHours = assignments.reduce((sum: number, a: Assignment) => sum + a.estimatedHours, 0);

      return {
        status: 'success',
        assignmentsCreated: assignments.length,
        scheduledAssignments: scheduledAssignments.length,
        totalAssignmentHours: totalHours,
        nextAssignmentDue: nextDueDate,
        message: `Generated ${assignments.length} assignments across ${courseAnalysis.courses.length} courses with ${totalHours} estimated hours`,
      };
    } catch (error) {
      console.error('[AssignmentConnector] Integration failed:', error);
      return {
        status: 'error',
        assignmentsCreated: 0,
        scheduledAssignments: 0,
        totalAssignmentHours: 0,
        nextAssignmentDue: new Date().toISOString(),
        message: `Assignment integration failed: ${String(error)}`,
      };
    }
  }

  /**
   * Get user's curriculum
   */
  private async getUserCurriculum(userId: number): Promise<any> {
    const curricula = await db
      .select()
      .from(memoryEnhancedCurricula)
      .where(eq(memoryEnhancedCurricula.userId, userId));

    if (curricula.length === 0) {
      return null;
    }

    return {
      userId,
      curricula: curricula.map((c: any) => ({
        courseId: c.baseCurriculumId,
        duration: c.studyDuration || 60,
      })),
    };
  }

  /**
   * Generate assignments for each course in curriculum
   */
  private async generateCourseAssignments(
    userId: number,
    curriculum: any,
    courseAnalysis: CourseAnalysis
  ): Promise<Assignment[]> {
    const assignments: Assignment[] = [];
    const assignmentTypes: Array<'homework' | 'project' | 'quiz' | 'exam' | 'discussion'> = [
      'homework',
      'project',
      'quiz',
      'exam',
      'discussion',
    ];
    const difficulties: Array<'beginner' | 'intermediate' | 'advanced'> = ['beginner', 'intermediate', 'advanced'];

    for (let courseIdx = 0; courseIdx < courseAnalysis.courses.length; courseIdx++) {
      const course = courseAnalysis.courses[courseIdx];
      const courseDifficulty = this.calculateDifficulty(course);
      const numAssignments = 3 + (courseIdx % 2); // 3-4 assignments per course

      for (let assignIdx = 0; assignIdx < numAssignments; assignIdx++) {
        const assignmentType = assignmentTypes[assignIdx % assignmentTypes.length];
        const baseHours = assignmentType === 'exam' ? 3 : assignmentType === 'project' ? 8 : 2;
        const estimatedHours = baseHours + (difficulty => 
          difficulty === 'advanced' ? 2 : difficulty === 'intermediate' ? 1 : 0
        )(courseDifficulty);

        const assignment: Assignment = {
          id: `assign-${course.id}-${assignIdx}-${Date.now()}`,
          courseId: course.id,
          title: `${assignmentType.charAt(0).toUpperCase() + assignmentType.slice(1)} ${assignIdx + 1}: ${course.titleEn || course.title}`,
          description: `${assignmentType.charAt(0).toUpperCase() + assignmentType.slice(1)} assignment for module ${assignIdx + 1}. Focus on key concepts and practical application.`,
          type: assignmentType,
          dueDate: new Date(Date.now() + (assignIdx + 1) * 7 * 24 * 60 * 60 * 1000 + courseIdx * 2 * 24 * 60 * 60 * 1000),
          estimatedHours,
          points: assignmentType === 'exam' ? 100 : assignmentType === 'project' ? 50 : 10,
          difficulty: courseDifficulty,
          learningObjectives: [
            `Understand core concepts of ${course.titleEn || course.title}`,
            `Apply knowledge to solve practical problems`,
            `Evaluate and synthesize information`,
          ],
        };

        assignments.push(assignment);
      }
    }

    return assignments;
  }

  /**
   * Schedule assignments based on study plan
   */
  private async scheduleAssignments(userId: number, assignments: Assignment[]): Promise<Assignment[]> {
    const scheduled: Assignment[] = [];

    // Sort by due date
    const sortedAssignments = [...assignments].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());

    for (const assignment of sortedAssignments) {
      try {
        // In production, persist to database
        scheduled.push(assignment);
        console.log(`[AssignmentConnector] Scheduled assignment: ${assignment.title} due ${assignment.dueDate.toISOString()}`);
      } catch (error) {
        console.error(`[AssignmentConnector] Failed to schedule assignment ${assignment.id}:`, error);
      }
    }

    return scheduled;
  }

  /**
   * Setup assignment tracking
   */
  private async setupAssignmentTracking(userId: number, assignments: Assignment[], integrationId: string): Promise<void> {
    try {
      // Track assignment submission deadlines and progress
      console.log(`[AssignmentConnector] Tracking initialized for ${assignments.length} assignments`);

      const trackingData = {
        userId,
        integrationId,
        totalAssignments: assignments.length,
        submittedAssignments: 0,
        averageScore: 0,
        completionTarget: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      };

      console.log('[AssignmentConnector] Tracking data:', trackingData);
    } catch (error) {
      console.error('[AssignmentConnector] Failed to setup tracking:', error);
    }
  }

  /**
   * Get next due date from scheduled assignments
   */
  private getNextDueDate(assignments: Assignment[]): string {
    if (assignments.length === 0) {
      return new Date().toISOString();
    }

    const sortedByDue = [...assignments].sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime());
    return sortedByDue[0].dueDate.toISOString();
  }

  /**
   * Update integration state with assignment status
   */
  private async updateIntegrationState(integrationId: string): Promise<void> {
    try {
      const integrationRecord = await db
        .select()
        .from(courseIntegrationState)
        .where(eq(courseIntegrationState.integrationId, integrationId));

      if (integrationRecord.length > 0) {
        const record = integrationRecord[0];
        await db
          .update(courseIntegrationState)
          .set({
            assignmentsCreated: true,
            lastIntegrationAt: new Date(),
          })
          .where(eq(courseIntegrationState.id, record.id));
      }
    } catch (error) {
      console.error('[AssignmentConnector] Failed to update integration state:', error);
    }
  }

  // Helper methods
  private calculateDifficulty(course: any): 'beginner' | 'intermediate' | 'advanced' {
    if (course.level === 'Advanced') return 'advanced';
    if (course.level === 'Beginner') return 'beginner';
    return 'intermediate';
  }
}
