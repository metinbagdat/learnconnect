import { Express } from "express";
import { dataFlowController } from "./data-flow-controller.js";

export function registerDataFlowEndpoints(app: Express) {
  // Create pipeline
  app.post("/api/data-flow/pipelines", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { name, source, targets, schema, errorHandling } = req.body;

      if (!name || !source || !targets || !schema) {
        return res.status(400).json({ message: "Missing required fields: name, source, targets, schema" });
      }

      const pipeline = dataFlowController.createPipeline(name, source, targets, schema, errorHandling);

      res.json({
        status: "success",
        pipeline,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to create pipeline", error: String(error) });
    }
  });

  // List pipelines
  app.get("/api/data-flow/pipelines", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const pipelines = dataFlowController.listPipelines();

      res.json({
        status: "success",
        pipelines,
        count: pipelines.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to list pipelines" });
    }
  });

  // Get pipeline details
  app.get("/api/data-flow/pipelines/:pipelineId", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const pipeline = dataFlowController.getPipeline(req.params.pipelineId);

      if (!pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }

      res.json({
        status: "success",
        pipeline,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get pipeline" });
    }
  });

  // Process data flow
  app.post("/api/data-flow/process", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { pipelineId, data } = req.body;

      if (!pipelineId || !data) {
        return res.status(400).json({ message: "Missing required fields: pipelineId, data" });
      }

      const result = await dataFlowController.processDataFlow(pipelineId, data);

      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to process data flow", error: String(error) });
    }
  });

  // Get flow events
  app.get("/api/data-flow/events/:pipelineId", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const limit = parseInt((req.query.limit as string) || "50");
      const events = dataFlowController.getFlowEvents(req.params.pipelineId, limit);

      res.json({
        status: "success",
        events,
        count: events.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get flow events" });
    }
  });

  // Get pipeline metrics
  app.get("/api/data-flow/metrics/:pipelineId", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const metrics = dataFlowController.getFlowMetrics(req.params.pipelineId);

      if (!metrics.pipeline) {
        return res.status(404).json({ message: "Pipeline not found" });
      }

      res.json({
        status: "success",
        data: metrics,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get metrics" });
    }
  });

  // Get all metrics
  app.get("/api/data-flow/metrics", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const metrics = dataFlowController.getAllMetrics();

      res.json({
        status: "success",
        data: metrics,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get metrics" });
    }
  });

  // Clear pipeline history
  app.post("/api/data-flow/clear/:pipelineId", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      dataFlowController.clearPipelineHistory(req.params.pipelineId);

      res.json({
        status: "success",
        message: "Pipeline history cleared",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear history" });
    }
  });

  console.log("[DataFlowController] Endpoints registered successfully");
}
