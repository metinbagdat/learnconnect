import { Express } from "express";
import { db } from "../db.js";
import { userGoals, userInterests, aiProfiles } from "../../shared/schema.js";
import { eq } from "drizzle-orm";
import { preCourseAIGuidanceProcessor } from "./pre-course-ai-guidance-processor.js";

export function registerPreCourseAIEndpoints(app: Express) {
  // Get pre-course AI guidance
  app.get("/api/ai/suggestions/pre-course", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const goals = await db.select().from(userGoals).where(eq(userGoals.userId, req.user.id));
      const interests = await db.select().from(userInterests).where(eq(userInterests.userId, req.user.id));
      const profile = await db.select().from(aiProfiles).where(eq(aiProfiles.userId, req.user.id));

      const guidance = preCourseAIGuidanceProcessor.generatePreCourseGuidance({
        userId: req.user.id,
        goals,
        interests,
        learningStyle: (profile[0]?.learningStyle as string) || undefined,
        careerGoal: (profile[0]?.careerGoals?.[0] as string) || undefined,
      });

      res.json({
        status: "success",
        data: guidance,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate pre-course guidance" });
    }
  });

  // Explain AI reasoning for a suggestion
  app.post("/api/ai/suggest/explain-reasoning", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { suggestion } = req.body;

      const interests = await db.select().from(userInterests).where(eq(userInterests.userId, req.user.id));
      const profile = await db.select().from(aiProfiles).where(eq(aiProfiles.userId, req.user.id));

      const explanation = preCourseAIGuidanceProcessor.explainAIReasoning(suggestion, {
        userId: req.user.id,
        goals: [],
        interests,
        learningStyle: (profile[0]?.learningStyle as string) || undefined,
        careerGoal: (profile[0]?.careerGoals?.[0] as string) || undefined,
      });

      res.json({
        status: "success",
        data: explanation,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to explain AI reasoning" });
    }
  });

  // Accept AI suggestion
  app.post("/api/ai/suggest/accept", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { suggestion } = req.body;

      const actionItems = preCourseAIGuidanceProcessor.acceptSuggestion(suggestion);

      res.json({
        status: "success",
        data: actionItems,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to accept suggestion" });
    }
  });

  // Modify AI suggestion
  app.post("/api/ai/suggest/modify", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { suggestion, modifications } = req.body;

      const modifiedSuggestion = preCourseAIGuidanceProcessor.modifySuggestion(
        suggestion,
        modifications
      );

      res.json({
        status: "success",
        data: modifiedSuggestion,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to modify suggestion" });
    }
  });

  // Reject AI suggestion
  app.post("/api/ai/suggest/reject", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { suggestionId, reason } = req.body;

      // Log rejection for future model improvements
      console.log(`[AI] Suggestion ${suggestionId} rejected by user ${req.user.id}. Reason: ${reason}`);

      res.json({
        status: "success",
        message: "Suggestion rejection logged for model improvement",
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to reject suggestion" });
    }
  });

  console.log("[PreCourseAI] Endpoints registered successfully");
}
