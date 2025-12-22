import { Express } from "express";
import { adminAIManagement } from "./admin-ai-management.js";

export function registerAdminAIEndpoints(app: Express) {
  // Get comprehensive AI management data
  app.get("/api/admin/ai/management", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      const data = await adminAIManagement.getAIManagementData();
      res.json({ status: "success", data });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI management data" });
    }
  });

  // Get user analytics
  app.get("/api/admin/ai/users", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      const analytics = await adminAIManagement.getUserAnalytics();
      res.json({ status: "success", data: analytics });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user analytics" });
    }
  });

  // Get suggestions by type
  app.get("/api/admin/ai/suggestions/:type", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      const { type } = req.params;
      const suggestions = await adminAIManagement.getSuggestionDetailsByType(type);
      res.json({ status: "success", data: suggestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Get top engaged users
  app.get("/api/admin/ai/top-users", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      const limit = parseInt((req.query.limit as string) || "10");
      const users = await adminAIManagement.getTopUsersByEngagement(limit);
      res.json({ status: "success", data: users });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch top users" });
    }
  });

  // Generate system report
  app.get("/api/admin/ai/report", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      const report = await adminAIManagement.generateSystemReport();
      res.json({ status: "success", data: report });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  console.log("[AdminAI] Endpoints registered successfully");
}
