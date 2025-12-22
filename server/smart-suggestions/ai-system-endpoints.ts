import { Express } from "express";
import { learnConnectAISystem } from "./core-ai-system.js";
import { db } from "../db.js";
import { users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export function registerAISystemEndpoints(app: Express) {
  // Initialize AI system for user (typically called after registration)
  app.post("/api/ai/initialize-journey", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { educationalBackground, careerGoal, interests, learningPace, availableHoursPerWeek } = req.body;

      const result = learnConnectAISystem.initializeUserJourney(req.user.id, {
        educationalBackground,
        careerGoal,
        interests,
        learningPace,
        availableHoursPerWeek,
      });

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to initialize AI journey" });
    }
  });

  // Get user AI profile
  app.get("/api/ai/profile", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const profile = learnConnectAISystem.getUserProfile(req.user.id);

      if (!profile) {
        return res.status(404).json({ message: "AI profile not found. Please initialize your journey first." });
      }

      res.json({ status: "success", data: profile });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI profile" });
    }
  });

  // Get AI system status
  app.get("/api/ai/system-status", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const status = learnConnectAISystem.getSystemStatus(req.user.id);

      res.json({
        status: "success",
        data: status || { message: "System not initialized for this user" },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system status" });
    }
  });

  // Predict user progress
  app.post("/api/ai/predict-progress", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { completedCourses, enrolledCourses } = req.body;

      const prediction = learnConnectAISystem.predictProgress(
        req.user.id,
        completedCourses || 0,
        enrolledCourses || 0
      );

      res.json({
        status: "success",
        data: prediction,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to predict progress" });
    }
  });

  // Get engagement optimization
  app.post("/api/ai/engagement-optimization", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { lastActivityDays } = req.body;

      const optimization = learnConnectAISystem.getEngagementOptimization(req.user.id, lastActivityDays || 0);

      res.json({
        status: "success",
        data: optimization,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get engagement optimization" });
    }
  });

  // Comprehensive AI report (admin only)
  app.get("/api/ai/report", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      // Check if admin
      const user = await db.select().from(users).where(eq(users.id, req.user.id));
      if (!user[0] || user[0].role !== "admin") {
        return res.status(403).json({ message: "Only admins can access AI reports" });
      }

      const report = learnConnectAISystem.getComprehensiveReport();

      res.json({
        status: "success",
        data: report,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI report" });
    }
  });

  console.log("[AISystem] Endpoints registered successfully");
}
