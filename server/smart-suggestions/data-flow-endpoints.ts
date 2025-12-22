import { Express } from "express";
import { aiDataFlowManagement } from "./ai-data-flow-management.js";

export function registerDataFlowEndpoints(app: Express) {
  // Initialize data flow
  app.post("/api/ai/data-flow/initialize", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const result = await aiDataFlowManagement.initializeUserDataFlow(req.user.id);
      res.json({ status: "success", data: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to initialize data flow" });
    }
  });

  // Archive old data
  app.post("/api/ai/data-flow/archive", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const result = await aiDataFlowManagement.archiveOldData(req.user.id, req.body.policy);
      res.json({ status: "success", data: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to archive data" });
    }
  });

  // Cleanup expired data
  app.post("/api/ai/data-flow/cleanup", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const result = await aiDataFlowManagement.cleanupExpiredData(req.user.id, req.body.policy);
      res.json({ status: "success", data: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to cleanup data" });
    }
  });

  // Get data flow metrics
  app.get("/api/ai/data-flow/metrics", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const metrics = await aiDataFlowManagement.getDataFlowMetrics(req.user.id);
      res.json({ status: "success", data: metrics });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Export data
  app.post("/api/ai/data-flow/export", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const format = (req.body.format || "json") as "json" | "csv";
      const result = await aiDataFlowManagement.exportUserData(req.user.id, format);
      res.json({ status: "success", data: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Import data
  app.post("/api/ai/data-flow/import", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const result = await aiDataFlowManagement.importUserData(req.user.id, req.body);
      res.json({ status: "success", data: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to import data" });
    }
  });

  // Get data lineage
  app.get("/api/ai/data-flow/lineage", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const limit = parseInt((req.query.limit as string) || "20");
      const lineage = await aiDataFlowManagement.getDataLineage(req.user.id, limit);
      res.json({ status: "success", data: lineage });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch lineage" });
    }
  });

  // Optimize storage
  app.post("/api/ai/data-flow/optimize", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const result = await aiDataFlowManagement.optimizeDataStorage(req.user.id);
      res.json({ status: "success", data: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to optimize storage" });
    }
  });

  // Validate data integrity
  app.get("/api/ai/data-flow/validate", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const result = await aiDataFlowManagement.validateDataIntegrity(req.user.id);
      res.json({ status: "success", data: result });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate data" });
    }
  });

  console.log("[DataFlow] Endpoints registered successfully");
}
