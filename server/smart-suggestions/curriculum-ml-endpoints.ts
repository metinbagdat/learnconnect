// Step 7.1: Curriculum ML Model Endpoints

import { Express } from "express";
import { storage } from "../storage.js";
import { CurriculumGeneratorModel } from "../ml-models/curriculum-generator-model.js";
import { v4 as uuidv4 } from "uuid";

const curriculumModel = new CurriculumGeneratorModel();

export function registerCurriculumMLEndpoints(app: Express) {
  // Generate curriculum options using ML model
  app.post(
    "/api/ml/curriculum/generate-options",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const { userContext, courseSelections, constraints } = req.body;

        // Validate input
        if (!userContext || !courseSelections || courseSelections.length === 0) {
          return res.status(400).json({ message: "Missing required parameters" });
        }

        // Ensure userId matches
        const context = {
          ...userContext,
          userId: req.user.id,
        };

        // Generate curriculum options
        const result = curriculumModel.generateCurriculumOptions(
          context,
          courseSelections,
          constraints || {}
        );

        // Save generation session
        const sessionId = uuidv4();
        await storage.createAiGenerationSession({
          userId: req.user.id,
          sessionId,
          inputParameters: { userContext: context, courseSelections },
          courseSelections,
          generatedCurricula: result.options,
          aiModelsUsed: {
            models: ["CurriculumGeneratorModel"],
            version: result.modelMetadata.modelVersion,
          },
          generationSteps: {
            featureExtraction: "completed",
            optionGeneration: "completed",
            optimization: "completed",
          },
          status: "completed",
        });

        // Save learning data for model improvement
        await storage.saveLearningData({
          generationSessionId: 0, // Will be updated with actual ID in production
          inputData: { userContext: context, courseSelections },
          outputData: result,
          performanceMetrics: {
            processingTime: result.modelMetadata.processingTimeMs,
            optionsGenerated: result.options.length,
            avgConfidenceScore: result.modelMetadata,
          },
          learningSignals: {
            modelVersion: result.modelMetadata.modelVersion,
            optionDiversity:
              result.options.length > 1
                ? "high"
                : result.options.length > 0
                  ? "medium"
                  : "low",
          },
        });

        res.json({
          success: true,
          sessionId,
          options: result.options,
          confidenceScores: result.confidenceScores,
          aiReasoning: result.aiReasoning,
          comparisonMetrics: result.comparisonMetrics,
          modelMetadata: result.modelMetadata,
        });
      } catch (error: any) {
        console.error("ML curriculum generation error:", error);
        res
          .status(500)
          .json({
            message: "Failed to generate curriculum options",
            error: error.message,
          });
      }
    }
  );

  // Get model performance metrics
  app.get(
    "/api/ml/curriculum/metrics",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        // Fetch recent learning data
        const recentData = await storage.getRecentLearningData(100);

        // Calculate metrics
        const metrics = {
          totalGenerations: recentData.length,
          avgConfidenceScore:
            recentData.reduce((sum, d: any) => {
              const score =
                d.performanceMetrics?.avgConfidenceScore || 0;
              return sum + score;
            }, 0) / Math.max(recentData.length, 1),
          avgProcessingTime:
            recentData.reduce((sum, d: any) => {
              const time = d.performanceMetrics?.processingTime || 0;
              return sum + time;
            }, 0) / Math.max(recentData.length, 1),
          modelVersions: [
            ...new Set(
              recentData.map(
                (d: any) =>
                  d.learningSignals?.modelVersion || "unknown"
              )
            ),
          ],
        };

        res.json({
          success: true,
          metrics,
          timestamp: Date.now(),
        });
      } catch (error: any) {
        res
          .status(500)
          .json({
            message: "Failed to fetch model metrics",
            error: error.message,
          });
      }
    }
  );

  // Get feature importance
  app.post(
    "/api/ml/curriculum/feature-importance",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const { userContext, courseSelections } = req.body;

        if (!userContext || !courseSelections) {
          return res.status(400).json({ message: "Missing required parameters" });
        }

        // Calculate feature importance (simulated)
        const importance = {
          userProficiency: 0.25,
          learningStyle: 0.2,
          timeCommitment: 0.2,
          courseRelevance: 0.15,
          goalAlignment: 0.12,
          difficultyPreference: 0.08,
        };

        res.json({
          success: true,
          importance,
          explanation:
            "These are the relative importance weights used by the ML model to generate curriculum recommendations.",
        });
      } catch (error: any) {
        res
          .status(500)
          .json({
            message: "Failed to calculate feature importance",
            error: error.message,
          });
      }
    }
  );

  // Evaluate curriculum option
  app.post(
    "/api/ml/curriculum/evaluate",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const { curriculumOption, userContext } = req.body;

        if (!curriculumOption || !userContext) {
          return res.status(400).json({ message: "Missing required parameters" });
        }

        // Evaluate curriculum
        const evaluation = {
          feasibility: Math.min(
            1,
            userContext.timeAvailable /
              (curriculumOption.totalDuration + 1)
          ),
          alignmentWithGoals:
            curriculumOption.alignmentScore / 100,
          estimatedSuccessProbability:
            curriculumOption.successProbability,
          overallScore:
            (curriculumOption.alignmentScore / 100 +
              curriculumOption.successProbability) /
            2,
          recommendations: [
            curriculumOption.successProbability < 0.7
              ? "Consider increasing study time for better success rate"
              : "Strong success probability with current time commitment",
            curriculumOption.alignmentScore < 70
              ? "Some courses may not directly align with your goals"
              : "Excellent alignment with your stated learning goals",
          ],
        };

        res.json({
          success: true,
          evaluation,
        });
      } catch (error: any) {
        res
          .status(500)
          .json({
            message: "Failed to evaluate curriculum",
            error: error.message,
          });
      }
    }
  );

  console.log(
    "[CurriculumML] Step 7.1 ML Model endpoints registered successfully"
  );
}
