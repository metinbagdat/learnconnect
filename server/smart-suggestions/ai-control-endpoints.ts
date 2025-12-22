import { Express } from "express";
import { aiControlDashboard } from "./ai-control-system.js";

export function registerAIControlEndpoints(app: Express) {
  // Get comprehensive AI control panel
  app.get("/api/ai/control-panel", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const panel = await aiControlDashboard.getAIControlPanel(req.user.id);

      res.json({
        status: "success",
        data: panel,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch control panel" });
    }
  });

  // Refresh AI suggestions
  app.post("/api/ai/refresh-suggestions", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const result = await aiControlDashboard.refreshSuggestions(req.user.id);

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to refresh suggestions" });
    }
  });

  // Adjust confidence threshold
  app.post("/api/ai/adjust-confidence", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { threshold } = req.body;

      if (threshold < 0 || threshold > 100) {
        return res.status(400).json({ message: "Threshold must be between 0 and 100" });
      }

      const result = await aiControlDashboard.adjustConfidenceThreshold(req.user.id, threshold);

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to adjust confidence threshold" });
    }
  });

  // Get performance analytics
  app.get("/api/ai/performance-analytics", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const analytics = await aiControlDashboard.getPerformanceAnalytics(req.user.id);

      res.json({
        status: "success",
        data: analytics,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch performance analytics" });
    }
  });

  // Adjust personalization level
  app.post("/api/ai/personalization-level", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { level } = req.body;

      if (!["low", "medium", "high"].includes(level)) {
        return res.status(400).json({ message: "Invalid personalization level" });
      }

      const result = aiControlDashboard.adjustPersonalizationLevel(level);

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to adjust personalization level" });
    }
  });

  // Set update frequency
  app.post("/api/ai/update-frequency", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { frequency } = req.body;

      if (!["daily", "weekly", "monthly"].includes(frequency)) {
        return res.status(400).json({ message: "Invalid update frequency" });
      }

      const result = aiControlDashboard.setUpdateFrequency(frequency);

      res.json({
        status: "success",
        data: result,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to set update frequency" });
    }
  });

  console.log("[AIControl] Endpoints registered successfully");
}
