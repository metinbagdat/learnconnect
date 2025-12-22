// Enrollment Event Handler - Triggers system-wide updates on course enrollment
// Implements Signal/Event system for automatic curriculum generation and planning

import { db } from "./db.js";
import { eq } from "drizzle-orm";
import { userCourses, courses, users } from "../shared/schema.js";
import { orchestrationEngine } from "./orchestration-engine.js";
import { unifiedIntegrationLayer } from "./unified-integration-layer.js";

/**
 * Event handler triggered when user enrolls in course
 */
export async function handleCourseEnrollment(userId: number, courseId: number): Promise<any> {
  console.log(`[EnrollmentEvent] Processing enrollment: user ${userId}, course ${courseId}`);

  try {
    // Get user data
    const [user] = await db.select().from(users).where(eq(users.id, userId));
    if (!user) {
      throw new Error("User not found");
    }

    // Get course data
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
    if (!course) {
      throw new Error("Course not found");
    }

    // Get all enrolled courses for this user
    const enrolledCourseRecords = await db
      .select()
      .from(userCourses)
      .where(eq(userCourses.userId, userId));

    const enrolledCourseIds = enrolledCourseRecords.map((uc: any) => uc.courseId);

    // Trigger unified orchestration with full cascade integration
    console.log(`[EnrollmentEvent] Triggering orchestration for user ${userId} with ${enrolledCourseIds.length} courses`);
    
    // Use unified integration for complete ecosystem cascading
    const orchestrationResult = await unifiedIntegrationLayer.cascadeEnrollment(userId, courseId);

    // Log event
    console.log(`[EnrollmentEvent] ✓ Enrollment orchestration complete for user ${userId}`);

    return {
      success: true,
      event: "enrollment",
      userId,
      courseId,
      orchestration: orchestrationResult,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error(`[EnrollmentEvent] Error processing enrollment:`, error);
    throw error;
  }
}

/**
 * Batch process enrollments for multiple courses
 */
export async function handleMultipleCourseEnrollments(userId: number, courseIds: number[]): Promise<any[]> {
  console.log(`[EnrollmentEvent] Processing batch enrollment: user ${userId}, ${courseIds.length} courses`);

  const results = [];
  for (const courseId of courseIds) {
    try {
      const result = await handleCourseEnrollment(userId, courseId);
      results.push(result);
    } catch (error) {
      console.error(`[EnrollmentEvent] Error processing course ${courseId}:`, error);
      results.push({
        success: false,
        courseId,
        error: (error as any).message
      });
    }
  }

  return results;
}

/**
 * Event emitter for enrollment events
 */
export class EnrollmentEventEmitter {
  private listeners: Map<string, ((data: any) => Promise<void>)[]> = new Map();

  on(eventName: string, listener: (data: any) => Promise<void>) {
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(listener);
  }

  async emit(eventName: string, data: any) {
    const eventListeners = this.listeners.get(eventName) || [];
    console.log(`[EnrollmentEventEmitter] Emitting event: ${eventName} with ${eventListeners.length} listeners`);

    for (const listener of eventListeners) {
      try {
        await listener(data);
      } catch (error) {
        console.error(`[EnrollmentEventEmitter] Listener error for ${eventName}:`, error);
      }
    }
  }
}

// Global enrollment event emitter
export const enrollmentEventEmitter = new EnrollmentEventEmitter();

// Register default enrollment handlers
enrollmentEventEmitter.on("course.enrolled", async (data: any) => {
  console.log(`[EnrollmentEvent] course.enrolled signal received for user ${data.userId}`);
  await handleCourseEnrollment(data.userId, data.courseId);
});
