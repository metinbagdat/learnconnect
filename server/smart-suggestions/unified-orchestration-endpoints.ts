// Unified Orchestration Endpoints
// Integrates curriculum generation, study planning, and enrollment

import { Express } from "express";
import { orchestrationEngine } from "../orchestration-engine.js";
import { aiCurriculumGenerator } from "../ai-curriculum-generator.js";

export function registerUnifiedOrchestrationEndpoints(app: Express) {
  // Trigger full orchestration on course enrollment
  app.post(
    "/api/orchestration/enroll-and-generate",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const { courseId } = req.body;
        if (!courseId) {
          return res.status(400).json({ message: "Course ID required" });
        }

        // Trigger unified orchestration
        const result = await orchestrationEngine.onCourseEnrollment(req.user.id, courseId);

        res.json({
          success: true,
          message: "Enrollment orchestration complete",
          orchestration: result
        });
      } catch (error: any) {
        res.status(500).json({
          message: "Orchestration failed",
          error: error.message
        });
      }
    }
  );

  // Generate personalized curriculum from multiple courses
  app.post(
    "/api/orchestration/generate-curriculum",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const { enrolledCourseIds, preferences } = req.body;
        if (!enrolledCourseIds || !Array.isArray(enrolledCourseIds) || enrolledCourseIds.length === 0) {
          return res.status(400).json({ message: "Enrolled course IDs required" });
        }

        // Generate curriculum for the first course (generateCurriculum only accepts single courseId)
        // TODO: Update generateCurriculum to accept multiple courseIds if needed
        const firstCourseId = enrolledCourseIds[0];
        const userLevel = preferences?.userLevel || "beginner";
        const curriculum = await aiCurriculumGenerator.generateCurriculum(firstCourseId, userLevel);

        res.json({
          success: true,
          message: "Curriculum generated successfully",
          curriculum
        });
      } catch (error: any) {
        res.status(500).json({
          message: "Curriculum generation failed",
          error: error.message
        });
      }
    }
  );

  // Get unified dashboard for all enrolled courses
  app.get(
    "/api/orchestration/dashboard",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const dashboard = await orchestrationEngine.getUnifiedDashboard(req.user.id);

        res.json({
          success: true,
          dashboard
        });
      } catch (error: any) {
        res.status(500).json({
          message: "Dashboard fetch failed",
          error: error.message
        });
      }
    }
  );

  console.log("[UnifiedOrchestration] Orchestration endpoints registered successfully");
}
