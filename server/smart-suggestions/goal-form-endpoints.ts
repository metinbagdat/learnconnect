import { Express } from "express";
import { goalFormSystem } from "./goal-form-system.js";

export function registerGoalFormEndpoints(app: Express) {
  // Get AI goal suggestions
  app.get("/api/goals/suggestions", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const type = (req.query.type as string) || undefined;
      const suggestions = await goalFormSystem.generateGoalSuggestions(req.user.id, type);

      res.json({ status: "success", data: suggestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate suggestions" });
    }
  });

  // Generate AI description
  app.post("/api/goals/generate-description", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { title, goalType } = req.body;

      if (!title || !goalType) {
        return res.status(400).json({ message: "Title and goal type required" });
      }

      const description = await goalFormSystem.generateAIDescription(title, goalType);

      res.json({ status: "success", data: { description } });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate description" });
    }
  });

  // Analyze goal
  app.post("/api/goals/analyze", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { title, description, goalType, deadline } = req.body;

      if (!title || !goalType) {
        return res.status(400).json({ message: "Title and goal type required" });
      }

      const analysis = await goalFormSystem.analyzeGoal(
        req.user.id,
        title,
        description || "",
        goalType,
        deadline ? new Date(deadline) : undefined
      );

      res.json({ status: "success", data: analysis });
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze goal" });
    }
  });

  // Suggest deadline
  app.get("/api/goals/suggest-deadline", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      const { goalType } = req.query;

      if (!goalType) {
        return res.status(400).json({ message: "Goal type required" });
      }

      const deadline = goalFormSystem.suggestDeadline(goalType as string);

      res.json({ status: "success", data: { deadline } });
    } catch (error) {
      res.status(500).json({ message: "Failed to suggest deadline" });
    }
  });

  // Validate goal form
  app.post("/api/goals/validate", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      const validation = goalFormSystem.validateGoalForm(req.body);

      res.json({ status: "success", data: validation });
    } catch (error) {
      res.status(500).json({ message: "Failed to validate goal" });
    }
  });

  // Save goal
  app.post("/api/goals/save", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const result = await goalFormSystem.saveGoal(req.user.id, req.body);

      res.json({ status: "success", data: result, message: "Goal saved successfully" });
    } catch (error: any) {
      res.status(400).json({ message: error.message || "Failed to save goal" });
    }
  });

  console.log("[GoalForm] Endpoints registered successfully");
}
