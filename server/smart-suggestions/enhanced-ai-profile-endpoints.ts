import { Express } from "express";
import { db } from "../db.js";
import { aiProfiles, aiSuggestions, enhancedInteractionLogs, users } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export function registerEnhancedAIEndpoints(app: Express) {
  // Create or update AI profile
  app.post("/api/ai-profiles", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { learningStyle, careerGoals, skillGaps, preferences } = req.body;

      // Check if profile exists
      const existing = await db.select().from(aiProfiles).where(eq(aiProfiles.userId, req.user.id));

      let profile;
      if (existing.length > 0) {
        // Update
        profile = await db.update(aiProfiles)
          .set({
            learningStyle,
            careerGoals,
            skillGaps,
            preferences,
            updatedAt: new Date(),
          })
          .where(eq(aiProfiles.userId, req.user.id))
          .returning();
      } else {
        // Create
        profile = await db.insert(aiProfiles)
          .values({
            userId: req.user.id,
            learningStyle,
            careerGoals,
            skillGaps,
            preferences,
            aiProfileData: { initialized: true },
          })
          .returning();
      }

      res.json({ status: "success", data: profile[0] });
    } catch (error) {
      res.status(500).json({ message: "Failed to save AI profile" });
    }
  });

  // Get AI profile
  app.get("/api/ai-profiles", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const profile = await db.select().from(aiProfiles).where(eq(aiProfiles.userId, req.user.id));

      if (profile.length === 0) {
        return res.status(404).json({ message: "AI profile not found" });
      }

      res.json({ status: "success", data: profile[0] });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch AI profile" });
    }
  });

  // Create AI suggestion (for recording suggestions made by the system)
  app.post("/api/ai-suggestions", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { suggestionType, suggestionData, confidenceScore, reasoning } = req.body;

      const suggestion = await db.insert(aiSuggestions)
        .values({
          userId: req.user.id,
          suggestionType,
          suggestionData,
          confidenceScore: confidenceScore?.toString(),
          reasoning,
        })
        .returning();

      res.json({ status: "success", data: suggestion[0] });
    } catch (error) {
      res.status(500).json({ message: "Failed to create suggestion" });
    }
  });

  // Get user's suggestions
  app.get("/api/ai-suggestions", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const suggestionType = req.query.type as string | undefined;
      let query = db.select().from(aiSuggestions).where(eq(aiSuggestions.userId, req.user.id)) as any;

      if (suggestionType) {
        query = query.where(eq(aiSuggestions.suggestionType, suggestionType));
      }

      const suggestions = await query;

      res.json({ status: "success", data: suggestions, count: suggestions.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch suggestions" });
    }
  });

  // Accept/implement suggestion
  app.patch("/api/ai-suggestions/:suggestionId", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { accepted, implemented, feedback } = req.body;
      const suggestionId = parseInt(req.params.suggestionId);

      const updated = await db.update(aiSuggestions)
        .set({
          accepted,
          implemented: implemented !== undefined ? implemented : false,
          feedback,
        })
        .where(eq(aiSuggestions.id, suggestionId))
        .returning();

      res.json({ status: "success", data: updated[0] });
    } catch (error) {
      res.status(500).json({ message: "Failed to update suggestion" });
    }
  });

  // Log enhanced interaction
  app.post("/api/interactions/log", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { module, action, data, sessionId, aiContext, responseTime, status } = req.body;

      const log = await db.insert(enhancedInteractionLogs)
        .values({
          userId: req.user.id,
          module,
          action,
          data,
          sessionId,
          aiContext,
          responseTime,
          status: status || "success",
        })
        .returning();

      res.json({ status: "success", data: log[0] });
    } catch (error) {
      res.status(500).json({ message: "Failed to log interaction" });
    }
  });

  // Get user interaction logs
  app.get("/api/interactions/logs", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const limit = parseInt((req.query.limit as string) || "100");
      const logs = await db.select()
        .from(enhancedInteractionLogs)
        .where(eq(enhancedInteractionLogs.userId, req.user.id))
        .limit(limit);

      res.json({ status: "success", data: logs, count: logs.length });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interaction logs" });
    }
  });

  // Comprehensive AI analytics (admin)
  app.get("/api/ai-analytics", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const user = await db.select().from(users).where(eq(users.id, req.user.id));
      if (!user[0] || user[0].role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const totalProfiles = await db.select().from(aiProfiles);
      const totalSuggestions = await db.select().from(aiSuggestions);
      const acceptedSuggestions = totalSuggestions.filter((s) => s.accepted);
      const implementedSuggestions = totalSuggestions.filter((s) => s.implemented);

      const analytics = {
        totalUsers: totalProfiles.length,
        totalSuggestions: totalSuggestions.length,
        acceptanceRate: totalSuggestions.length > 0 ? (acceptedSuggestions.length / totalSuggestions.length) * 100 : 0,
        implementationRate: acceptedSuggestions.length > 0 ? (implementedSuggestions.length / acceptedSuggestions.length) * 100 : 0,
        avgConfidenceScore: totalSuggestions.length > 0
          ? (totalSuggestions.reduce((sum, s) => sum + parseFloat(s.confidenceScore), 0) / totalSuggestions.length)
          : 0,
        suggestionsByType: {
          goal: totalSuggestions.filter((s) => s.suggestionType === "goal").length,
          course: totalSuggestions.filter((s) => s.suggestionType === "course").length,
          study_plan: totalSuggestions.filter((s) => s.suggestionType === "study_plan").length,
          intervention: totalSuggestions.filter((s) => s.suggestionType === "intervention").length,
        },
      };

      res.json({ status: "success", data: analytics });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate AI analytics" });
    }
  });

  console.log("[EnhancedAI] Endpoints registered successfully");
}
