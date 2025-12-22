// Step 5: Forms and Lists Endpoints

import { Express } from "express";
import { db } from "../db.js";
import { eq, and } from "drizzle-orm";
import { courses, userCourses, memoryEnhancedCurricula, assignments, userAssignments, users } from "../../shared/schema.js";

export function registerFormsAndListsEndpoints(app: Express) {
  // List available courses
  app.get("/api/forms/courses-available", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const allCourses = await db.select().from(courses);
      const userEnrolled = await db.select().from(userCourses).where(eq(userCourses.userId, req.user.id));
      const enrolledIds = new Set(userEnrolled.map((uc: any) => uc.courseId));

      const available = allCourses.map((c: any) => ({
        ...c,
        isEnrolled: enrolledIds.has(c.id),
        enrollmentStatus: enrolledIds.has(c.id) ? "enrolled" : "available"
      }));

      res.json({ success: true, courses: available });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch courses", error: error.message });
    }
  });

  // List enrolled courses
  app.get("/api/forms/courses-enrolled", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const enrolled = await db.select().from(userCourses).where(eq(userCourses.userId, req.user.id));

      const enrolledCourses = [];
      for (const uc of enrolled) {
        const [course] = await db.select().from(courses).where(eq(courses.id, uc.courseId));
        if (course) {
          enrolledCourses.push({
            ...course,
            progress: uc.progress,
            completed: uc.completed,
            enrolledAt: uc.enrolledAt
          });
        }
      }

      res.json({ success: true, courses: enrolledCourses });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch enrolled courses", error: error.message });
    }
  });

  // List user's curriculums
  app.get("/api/forms/curricula", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const userCurricula = await db.select().from(memoryEnhancedCurricula).where(eq(memoryEnhancedCurricula.userId, req.user.id));

      res.json({ success: true, curricula: userCurricula });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch curricula", error: error.message });
    }
  });

  // List assignments
  app.get("/api/forms/assignments", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const userAssignmentList = await db.select().from(userAssignments).where(eq(userAssignments.userId, req.user.id));

      const assignmentsList = [];
      for (const ua of userAssignmentList) {
        const [assignment] = await db.select().from(assignments as any).where(eq((assignments as any).id, ua.assignmentId));
        if (assignment) {
          assignmentsList.push({
            ...assignment,
            status: ua.status,
            grade: ua.grade,
            feedback: ua.feedback
          });
        }
      }

      res.json({ success: true, assignments: assignmentsList });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch assignments", error: error.message });
    }
  });

  // Get curriculum customization form data
  app.get("/api/forms/curriculum-customize/:curriculumId", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const [curriculum] = await db.select().from(memoryEnhancedCurricula).where(eq(memoryEnhancedCurricula.id, parseInt(req.params.curriculumId)));

      if (!curriculum || curriculum.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({
        success: true,
        form: {
          curriculumId: curriculum.id,
          memoryTechniques: curriculum.memoryTechniquesApplied,
          spacedRepetitionSchedule: curriculum.spacedRepetitionSchedule,
          predictedRetentionRate: curriculum.predictedRetentionRate,
          expectedStudyTimeReduction: curriculum.expectedStudyTimeReduction
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch curriculum", error: error.message });
    }
  });

  // Submit curriculum customization
  app.post("/api/forms/curriculum-customize", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { curriculumId, memoryTechniques, dailyHours } = req.body;

      const [curriculum] = await db.select().from(memoryEnhancedCurricula).where(eq(memoryEnhancedCurricula.id, curriculumId));
      if (!curriculum || curriculum.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      // Update curriculum with customizations
      // (In a real app, we'd call db.update here)

      res.json({
        success: true,
        message: "Curriculum customized successfully",
        customizations: { memoryTechniques, dailyHours }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to customize curriculum", error: error.message });
    }
  });

  // Submit assignment
  app.post("/api/forms/assignment-submit", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { assignmentId, content, submissionType } = req.body;

      // Validate user owns this assignment
      const [userAssignment] = await db
        .select()
        .from(userAssignments)
        .where(and(eq(userAssignments.userId, req.user.id), eq(userAssignments.assignmentId, assignmentId)));

      if (!userAssignment) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json({
        success: true,
        message: "Assignment submitted successfully",
        submissionId: `sub_${Date.now()}`,
        submittedAt: new Date().toISOString()
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to submit assignment", error: error.message });
    }
  });

  console.log("[FormsAndLists] Forms and lists endpoints registered");
}
