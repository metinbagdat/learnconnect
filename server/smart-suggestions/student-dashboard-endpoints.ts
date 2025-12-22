import { Express } from "express";
import { studentDashboardSystem } from "./student-dashboard-system.js";

export function registerStudentDashboardEndpoints(app: Express) {
  // Get dashboard overview
  app.get("/api/ai/dashboard/overview", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const overview = await studentDashboardSystem.getDashboardOverview(req.user.id);

      res.json({ status: "success", data: overview });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard overview" });
    }
  });

  // Get dashboard goals
  app.get("/api/ai/dashboard/goals", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const goals = await studentDashboardSystem.getDashboardGoals(req.user.id);

      res.json({ status: "success", data: goals });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard goals" });
    }
  });

  // Get dashboard suggestions
  app.get("/api/ai/dashboard/suggestions", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const suggestions = await studentDashboardSystem.getDashboardSuggestions(req.user.id);

      res.json({ status: "success", data: suggestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard suggestions" });
    }
  });

  // Get dashboard performance
  app.get("/api/ai/dashboard/performance", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const performance = await studentDashboardSystem.getDashboardPerformance(req.user.id);

      res.json({ status: "success", data: performance });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard performance" });
    }
  });

  // Refresh AI suggestions
  app.post("/api/ai/dashboard/refresh", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const result = await studentDashboardSystem.refreshAISuggestions(req.user.id);

      res.json({ status: "success", data: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh suggestions" });
    }
  });

  // Update personalization level
  app.post("/api/ai/dashboard/personalization", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { level } = req.body;

      if (!["low", "medium", "high"].includes(level)) {
        return res.status(400).json({ message: "Invalid personalization level" });
      }

      const result = await studentDashboardSystem.updatePersonalizationLevel(req.user.id, level);

      res.json({ status: "success", data: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to update personalization" });
    }
  });

  // Provide AI feedback
  app.post("/api/ai/dashboard/feedback", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { type, rating, comment } = req.body;

      const result = await studentDashboardSystem.provideAIFeedback(req.user.id, {
        type,
        rating,
        comment,
      });

      res.json({ status: "success", data: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to submit feedback" });
    }
  });

  console.log("[StudentDashboard] Endpoints registered successfully");
}
