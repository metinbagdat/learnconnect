/**
 * Step 2.2: Study Planner Integration Connector
 * Automatically triggers study planner based on curriculum
 */

import { db } from './db.js';
import {
  memoryEnhancedCurricula,
  courses,
  users,
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

interface StudySession {
  id: string;
  courseId: number;
  sessionDate: Date;
  duration: number; // in minutes
  topicsCovered: string[];
  sessionType: 'lecture' | 'practice' | 'review' | 'assessment';
  priority: 'high' | 'medium' | 'low';
}

interface StudyPlan {
  totalHours: number;
  estimatedCompletion: Date;
  weeklySchedule: Map<string, StudySession[]>;
  sessions: StudySession[];
  intensity: number; // 0-1
}

interface StudyPlannerIntegrationResult {
  status: string;
  studyPlanGenerated: boolean;
  sessionsScheduled: number;
  totalStudyHours: number;
  completionDate: string;
  weeklyCommitment: number;
  message: string;
}

export class StudyPlannerConnector {
  /**
   * Automatically generate study plan from curriculum
   */
  async integrate(
    userId: number,
    courseAnalysis: CourseAnalysis,
    integrationId: string
  ): Promise<StudyPlannerIntegrationResult> {
    try {
      // 1. Get generated curriculum
      const curriculum = await this.getUserCurriculum(userId);

      if (!curriculum) {
        return {
          status: 'skipped',
          studyPlanGenerated: false,
          sessionsScheduled: 0,
          totalStudyHours: 0,
          completionDate: new Date().toISOString(),
          weeklyCommitment: 0,
          message: 'No curriculum available for study planning',
        };
      }

      // 2. Get user schedule and preferences
      const userSchedule = await this.getUserSchedule(userId);
      const learningPace = await this.getLearningPace(userId);
      const intensityPreference = await this.getIntensityPreference(userId);

      // 3. Generate comprehensive study plan
      const studyPlan = await this.generateStudyPlan(
        userId,
        curriculum,
        courseAnalysis,
        userSchedule,
        learningPace,
        intensityPreference
      );

      // 4. Schedule study sessions
      const scheduledSessions = await this.scheduleStudySessions(studyPlan, userId);

      // 5. Setup progress tracking
      await this.setupProgressTracking(studyPlan, userId, integrationId);

      // 6. Update integration state
      await this.updateIntegrationState(integrationId);

      const weeklyHours = Math.round(studyPlan.totalHours / (Math.ceil((studyPlan.estimatedCompletion.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)) || 1));

      return {
        status: 'success',
        studyPlanGenerated: true,
        sessionsScheduled: scheduledSessions.length,
        totalStudyHours: studyPlan.totalHours,
        completionDate: studyPlan.estimatedCompletion.toISOString(),
        weeklyCommitment: weeklyHours,
        message: `Study plan generated with ${scheduledSessions.length} sessions over ${Math.ceil(studyPlan.totalHours / weeklyHours)} weeks`,
      };
    } catch (error) {
      console.error('[StudyPlannerConnector] Integration failed:', error);
      return {
        status: 'error',
        studyPlanGenerated: false,
        sessionsScheduled: 0,
        totalStudyHours: 0,
        completionDate: new Date().toISOString(),
        weeklyCommitment: 0,
        message: `Study planner integration failed: ${String(error)}`,
      };
    }
  }

  /**
   * Get user's current curriculum
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
        techniques: typeof c.memoryTechniquesApplied === 'string'
          ? JSON.parse(c.memoryTechniquesApplied)
          : c.memoryTechniquesApplied || [],
      })),
    };
  }

  /**
   * Generate comprehensive study plan from curriculum
   */
  private async generateStudyPlan(
    userId: number,
    curriculum: any,
    courseAnalysis: CourseAnalysis,
    userSchedule: any,
    learningPace: string,
    intensityPreference: number
  ): Promise<StudyPlan> {
    const sessions: StudySession[] = [];
    const weeklySchedule = new Map<string, StudySession[]>();

    // Calculate total study hours from all courses
    const totalHours = courseAnalysis.totalCommitment || 120;

    // Determine weekly commitment based on intensity preference
    const weeklyHours = Math.max(5, Math.min(20, totalHours * intensityPreference / 12));

    // Distribute sessions across weeks
    const weeksNeeded = Math.ceil(totalHours / weeklyHours);
    const startDate = new Date();
    const completionDate = new Date(startDate.getTime() + weeksNeeded * 7 * 24 * 60 * 60 * 1000);

    // Create sessions for each course
    const sessionTypes: Array<'lecture' | 'practice' | 'review' | 'assessment'> = ['lecture', 'practice', 'review', 'assessment'];

    for (let i = 0; i < courseAnalysis.courses.length; i++) {
      const course = courseAnalysis.courses[i];
      const courseHours = course.durationHours || 40;
      const courseSessions = Math.ceil((courseHours / totalHours) * (weeksNeeded * 4)); // 4 sessions per week

      for (let j = 0; j < Math.min(courseSessions, weeksNeeded * 4); j++) {
        const sessionDate = new Date(startDate.getTime() + (j * 7 * 24 * 60 * 60 * 1000) / Math.max(courseSessions, 1));
        const sessionType = sessionTypes[j % sessionTypes.length];
        const priority = j < 2 ? 'high' : j < 4 ? 'medium' : 'low';

        const session: StudySession = {
          id: `session-${course.id}-${j}-${Date.now()}`,
          courseId: course.id,
          sessionDate,
          duration: Math.round((courseHours / courseSessions) * 60),
          topicsCovered: [
            `${course.titleEn || course.title} - Topic ${(j % 3) + 1}`,
            `Module ${(j % 4) + 1}`,
          ],
          sessionType,
          priority,
        };

        sessions.push(session);

        // Add to weekly schedule
        const weekKey = `week-${Math.floor(j / 4)}`;
        if (!weeklySchedule.has(weekKey)) {
          weeklySchedule.set(weekKey, []);
        }
        weeklySchedule.get(weekKey)!.push(session);
      }
    }

    return {
      totalHours,
      estimatedCompletion: completionDate,
      weeklySchedule,
      sessions,
      intensity: intensityPreference,
    };
  }

  /**
   * Schedule study sessions
   */
  private async scheduleStudySessions(studyPlan: StudyPlan, userId: number): Promise<StudySession[]> {
    const scheduled: StudySession[] = [];

    // Sort sessions by date and priority
    const sortedSessions = [...studyPlan.sessions].sort((a, b) => {
      if (a.sessionDate.getTime() !== b.sessionDate.getTime()) {
        return a.sessionDate.getTime() - b.sessionDate.getTime();
      }
      const priorityOrder = { high: 0, medium: 1, low: 2 };
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    for (const session of sortedSessions) {
      try {
        // In production, this would persist to database
        scheduled.push(session);
        console.log(`[StudyPlannerConnector] Scheduled session: ${session.id} on ${session.sessionDate.toISOString()}`);
      } catch (error) {
        console.error(`[StudyPlannerConnector] Failed to schedule session ${session.id}:`, error);
      }
    }

    return scheduled;
  }

  /**
   * Setup progress tracking for study plan
   */
  private async setupProgressTracking(studyPlan: StudyPlan, userId: number, integrationId: string): Promise<void> {
    try {
      // Create progress tracking entries
      console.log(`[StudyPlannerConnector] Progress tracking initialized for ${studyPlan.sessions.length} sessions`);

      // Track completion targets
      const trackingData = {
        userId,
        integrationId,
        totalSessions: studyPlan.sessions.length,
        completedSessions: 0,
        completionTarget: studyPlan.estimatedCompletion,
        weeklyTarget: Math.round(studyPlan.totalHours / Math.ceil((studyPlan.estimatedCompletion.getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000))),
      };

      console.log('[StudyPlannerConnector] Tracking data:', trackingData);
    } catch (error) {
      console.error('[StudyPlannerConnector] Failed to setup progress tracking:', error);
    }
  }

  /**
   * Update integration state with study plan status
   */
  private async updateIntegrationState(integrationId: string): Promise<void> {
    try {
      const integrationRecord = await db
        .select()
        .from(courseIntegrationState)
        .where(eq(courseIntegrationState.integrationId, integrationId));

      if (integrationRecord.length > 0) {
        await db
          .update(courseIntegrationState)
          .set({
            studyPlanGenerated: true,
            lastIntegrationAt: new Date(),
          })
          .where(eq(courseIntegrationState.integrationId, integrationId));
      }
    } catch (error) {
      console.error('[StudyPlannerConnector] Failed to update integration state:', error);
    }
  }

  // Helper methods
  private async getUserSchedule(userId: number): Promise<any> {
    // Placeholder - would retrieve from user profile
    return {
      availableHoursPerDay: 2,
      preferredStudyDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      preferredTimes: ['09:00-11:00', '14:00-16:00', '18:00-20:00'],
    };
  }

  private async getLearningPace(userId: number): Promise<string> {
    // Placeholder - would retrieve from user profile or infer from history
    return 'moderate'; // 'slow', 'moderate', 'fast'
  }

  private async getIntensityPreference(userId: number): Promise<number> {
    // Placeholder - returns value 0-1
    // 0 = very light (1-2 hours/week), 1 = very intensive (20+ hours/week)
    return 0.6; // Moderate intensity
  }
}
