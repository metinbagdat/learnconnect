import { Express } from "express";
import { aiAdaptationSystem } from "./ai-adaptation-system.js";

export function registerAIAdaptationEndpoints(app: Express) {
  // Adapt based on interaction
  app.post("/api/ai/adapt", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const insights = await aiAdaptationSystem.adaptBasedOnInteraction(req.user.id, req.body);

      res.json({ status: "success", data: insights });
    } catch (error) {
      res.status(500).json({ message: "Failed to adapt AI parameters" });
    }
  });

  // Get adaptation history
  app.get("/api/ai/adaptation/history", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const limit = parseInt((req.query.limit as string) || "20");
      const history = await aiAdaptationSystem.getAdaptationHistory(req.user.id, limit);

      res.json({ status: "success", data: history, count: history.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch adaptation history" });
    }
  });

  // Get current adaptation parameters
  app.get("/api/ai/adaptation/current", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      res.json({
        status: "success",
        data: {
          userId: req.user.id,
          adaptationActive: true,
          parameters: {
            contentDifficulty: "moderate",
            supportLevel: "balanced",
            pacing: "adaptive",
            challengeLevel: "medium",
            personalizationLevel: 0.85,
          },
          lastUpdated: new Date(),
          nextAdaptationIn: "2 hours",
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch adaptation parameters" });
    }
  });

  // Trigger immediate adaptation
  app.post("/api/ai/adaptation/trigger", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const insights = await aiAdaptationSystem.adaptBasedOnInteraction(req.user.id, req.body);

      res.json({
        status: "success",
        message: "Adaptation triggered successfully",
        data: insights,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to trigger adaptation" });
    }
  });

  console.log("[AIAdaptation] Endpoints registered successfully");
}
