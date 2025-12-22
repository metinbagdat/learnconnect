import { Express } from "express";
import { aiInteractionTracker } from "./ai-interaction-tracker.js";

export function registerInteractionTrackingEndpoints(app: Express) {
  // Log AI interaction
  app.post("/api/ai/interactions/log", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { module, action, userInput, aiResponse, responseTime } = req.body;

      const interaction = await aiInteractionTracker.logAIInteraction(
        req.user.id,
        module,
        action,
        userInput,
        aiResponse,
        responseTime
      );

      res.json({ status: "success", data: interaction });
    } catch (error) {
      res.status(500).json({ message: "Failed to log interaction" });
    }
  });

  // Get interaction history
  app.get("/api/ai/interactions/history", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const limit = parseInt((req.query.limit as string) || "50");
      const history = await aiInteractionTracker.getInteractionHistory(req.user.id, limit);

      res.json({ status: "success", data: history, count: history.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interaction history" });
    }
  });

  // Get interaction metrics
  app.get("/api/ai/interactions/metrics", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const metrics = await aiInteractionTracker.getInteractionMetrics(req.user.id);

      res.json({ status: "success", data: metrics });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interaction metrics" });
    }
  });

  // Get engagement score
  app.get("/api/ai/interactions/engagement", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const engagement = await aiInteractionTracker.getEngagementScore(req.user.id);

      res.json({ status: "success", data: engagement });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch engagement score" });
    }
  });

  // Get learning insights
  app.get("/api/ai/interactions/insights", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const insights = await aiInteractionTracker.getLearningInsights(req.user.id);

      res.json({ status: "success", data: insights });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch learning insights" });
    }
  });

  console.log("[InteractionTracking] Endpoints registered successfully");
}
