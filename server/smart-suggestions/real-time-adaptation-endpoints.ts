// Step 7.2: Real-time Curriculum Adaptation Endpoints

import { Express } from "express";
import { storage } from "../storage.js";
import { RealTimeAdaptationEngine } from "../ml-models/real-time-adaptation-engine.js";
import { FeedbackProcessor, InteractionData } from "../ml-models/feedback-processor.js";

const adaptationEngine = new RealTimeAdaptationEngine();
const feedbackProcessor = new FeedbackProcessor();

// Store active user sessions for real-time tracking
const userSessions = new Map<number, InteractionData[]>();

export function registerRealTimeAdaptationEndpoints(app: Express) {
  // Log user interaction
  app.post(
    "/api/ai/interaction/log",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const {
          curriculumId,
          courseId,
          action,
          duration,
          successRate,
          difficultyRating,
          feedback,
        } = req.body;

        const interaction: InteractionData = {
          userId: req.user.id,
          curriculumId,
          courseId,
          action,
          timestamp: Date.now(),
          duration,
          successRate,
          difficultyRating,
          feedback,
        };

        // Add to user session
        if (!userSessions.has(req.user.id)) {
          userSessions.set(req.user.id, []);
        }
        userSessions.get(req.user.id)!.push(interaction);

        // Keep only last 50 interactions
        const session = userSessions.get(req.user.id)!;
        if (session.length > 50) {
          session.shift();
        }

        res.json({
          success: true,
          message: "Interaction logged successfully",
          interactionId: `${req.user.id}-${Date.now()}`,
        });
      } catch (error: any) {
        res
          .status(500)
          .json({
            message: "Failed to log interaction",
            error: error.message,
          });
      }
    }
  );

  // Get real-time insights for user
  app.get(
    "/api/ai/adaptation/insights",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const interactions = userSessions.get(req.user.id) || [];
        const { insights, trends, anomalies } =
          feedbackProcessor.processBatch(interactions);

        res.json({
          success: true,
          insights,
          trends,
          anomalies,
          interactionCount: interactions.length,
          timestamp: Date.now(),
        });
      } catch (error: any) {
        res
          .status(500)
          .json({
            message: "Failed to fetch insights",
            error: error.message,
          });
      }
    }
  );

  // Adapt curriculum in real-time
  app.post(
    "/api/ai/adaptation/adapt-curriculum",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const { curriculumId, currentCurriculum } = req.body;

        if (!curriculumId || !currentCurriculum) {
          return res.status(400).json({ message: "Missing required parameters" });
        }

        // Get user interactions
        const interactions = userSessions.get(req.user.id) || [];

        if (interactions.length === 0) {
          return res.json({
            success: true,
            message: "No interactions to adapt from",
            adaptations: [],
            adaptedCurriculum: currentCurriculum,
          });
        }

        // Analyze interactions
        const { insights } = feedbackProcessor.processBatch(interactions);

        // Generate adaptations
        const adaptations = adaptationEngine.generateAdaptations(
          currentCurriculum,
          insights
        );

        // Apply adaptations
        const adaptedCurriculum = adaptationEngine.applyAdaptations(
          currentCurriculum,
          adaptations
        );

        // Generate reasoning
        const reasoning = adaptationEngine.generateAdaptationReasoning(adaptations);

        // Save adaptation history
        await storage.saveLearningData({
          generationSessionId: 0,
          inputData: {
            interactions: interactions.length,
            insights,
          },
          outputData: {
            adaptations,
            reasoning,
          },
          performanceMetrics: {
            adaptationsApplied: adaptations.length,
            engagementLevel: insights.engagementLevel,
            learningVelocity: insights.learningVelocity,
          },
          learningSignals: {
            adaptationType: "real-time",
            curriculumId,
          },
        });

        res.json({
          success: true,
          curriculumId,
          insights,
          adaptations,
          adaptedCurriculum,
          reasoning,
          timestamp: Date.now(),
        });
      } catch (error: any) {
        res
          .status(500)
          .json({
            message: "Failed to adapt curriculum",
            error: error.message,
          });
      }
    }
  );

  // Get adaptation history for user
  app.get(
    "/api/ai/adaptation/history",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const recentData = await storage.getRecentLearningData(50);
        const userAdaptations = recentData.filter(
          (d: any) => d.learningSignals?.adaptationType === "real-time"
        );

        res.json({
          success: true,
          adaptationHistory: userAdaptations,
          totalAdaptations: userAdaptations.length,
        });
      } catch (error: any) {
        res
          .status(500)
          .json({
            message: "Failed to fetch adaptation history",
            error: error.message,
          });
      }
    }
  );

  // Get current user interactions session
  app.get(
    "/api/ai/adaptation/session",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const interactions = userSessions.get(req.user.id) || [];
        const insights =
          interactions.length > 0
            ? feedbackProcessor.analyzeInteraction(interactions)
            : {
                engagementLevel: 0.5,
                learningVelocity: 0.5,
                difficultyPerception: 0.5,
                preferenceSignals: {},
                timestamp: Date.now(),
              };

        res.json({
          success: true,
          sessionActive: interactions.length > 0,
          interactionCount: interactions.length,
          insights,
          recentInteractions: interactions.slice(-10),
        });
      } catch (error: any) {
        res
          .status(500)
          .json({
            message: "Failed to fetch session",
            error: error.message,
          });
      }
    }
  );

  // Clear user session (logout)
  app.post(
    "/api/ai/adaptation/clear-session",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        userSessions.delete(req.user.id);

        res.json({
          success: true,
          message: "Session cleared successfully",
        });
      } catch (error: any) {
        res
          .status(500)
          .json({
            message: "Failed to clear session",
            error: error.message,
          });
      }
    }
  );

  console.log(
    "[RealTimeAdaptation] Step 7.2 Real-time adaptation endpoints registered successfully"
  );
}
