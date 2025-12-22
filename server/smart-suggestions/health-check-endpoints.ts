import { Express } from "express";
import { systemHealthCheck } from "./system-health-check.js";

export function registerHealthCheckEndpoints(app: Express) {
  // System health status
  app.get("/api/system/health", async (req, res) => {
    try {
      const health = await systemHealthCheck.getSystemHealth();
      res.json({ status: "success", data: health });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch system health" });
    }
  });

  // Implementation checklist
  app.get("/api/system/checklist", async (req, res) => {
    try {
      const checklist = await systemHealthCheck.getImplementationChecklist();
      res.json({ status: "success", data: checklist });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch checklist" });
    }
  });

  // Success metrics
  app.get("/api/system/metrics", async (req, res) => {
    try {
      const metrics = await systemHealthCheck.getSuccessMetrics();
      res.json({ status: "success", data: metrics });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch metrics" });
    }
  });

  // Run diagnostics
  app.post("/api/system/diagnostics", async (req, res) => {
    try {
      const results = await systemHealthCheck.runDiagnostics();
      res.json({ status: "success", data: results });
    } catch (error) {
      res.status(500).json({ message: "Failed to run diagnostics" });
    }
  });

  console.log("[HealthCheck] Endpoints registered successfully");
}
