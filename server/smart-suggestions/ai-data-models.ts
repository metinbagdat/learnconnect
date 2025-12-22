import { db } from "../db.js";
import { aiProfiles, enhancedInteractionLogs } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

/**
 * Comprehensive AI Data Models for storing AI insights and predictions
 */

export interface AIUserProfileData {
  userId: number;
  learningStyleAI: Record<string, any>;
  skillGapAnalysis: Array<{ skill: string; gap: number; priority: string }>;
  motivationProfile: Record<string, any>;
  behavioralPatterns: Record<string, any>;
  successProbability: number;
  predictedCompletionTime: number; // in days
  recommendedIntensity: "low" | "moderate" | "high" | "intensive";
  feedbackHistory: Array<{ date: Date; feedback: string; rating: number }>;
  modelAdjustments: Array<{ date: Date; adjustment: string; impact: number }>;
  personalizationCoefficients: Record<string, number>;
}

export interface AISuggestionLogEntry {
  userId: number;
  suggestionType: string;
  inputContext: Record<string, any>;
  aiModelUsed: string;
  modelVersion: string;
  suggestionOutput: Record<string, any>;
  confidenceScores: Record<string, number>;
  reasoningChain: string[];
  userFeedback?: { rating: number; comment: string };
}

export interface AIInteractionArchiveEntry {
  userId: number;
  interactionType: string;
  module: string;
  inputData: Record<string, any>;
  aiResponse: Record<string, any>;
  contextSnapshot: Record<string, any>;
  performanceMetrics: {
    responseTime: number;
    successRate: number;
    userSatisfaction?: number;
  };
}

class AIDataModels {
  /**
   * Store or update AI user profile with comprehensive insights
   */
  async updateAIUserProfile(data: AIUserProfileData): Promise<any> {
    const existing = await db.select().from(aiProfiles).where(eq(aiProfiles.userId, data.userId));

    const profileData = {
      aiProfileData: {
        learningStyle: data.learningStyleAI,
        skillGaps: data.skillGapAnalysis,
        motivation: data.motivationProfile,
        patterns: data.behavioralPatterns,
        successProbability: data.successProbability,
        estimatedCompletionDays: data.predictedCompletionTime,
        intensity: data.recommendedIntensity,
        feedbackHistory: data.feedbackHistory,
        adjustments: data.modelAdjustments,
        coefficients: data.personalizationCoefficients,
      },
    };

    if (existing.length > 0) {
      return await db
        .update(aiProfiles)
        .set(profileData)
        .where(eq(aiProfiles.userId, data.userId));
    }

    return await db.insert(aiProfiles).values({
      userId: data.userId,
      ...profileData,
    });
  }

  /**
   * Get AI user profile
   */
  async getAIUserProfile(userId: number): Promise<AIUserProfileData | null> {
    const profiles = await db.select().from(aiProfiles).where(eq(aiProfiles.userId, userId));

    if (profiles.length === 0) return null;

    const profile = profiles[0];
    const data = profile.aiProfileData || {};

    return {
      userId,
      learningStyleAI: data.learningStyle || {},
      skillGapAnalysis: data.skillGaps || [],
      motivationProfile: data.motivation || {},
      behavioralPatterns: data.patterns || {},
      successProbability: data.successProbability || 0.5,
      predictedCompletionTime: data.estimatedCompletionDays || 0,
      recommendedIntensity: data.intensity || "moderate",
      feedbackHistory: data.feedbackHistory || [],
      modelAdjustments: data.adjustments || [],
      personalizationCoefficients: data.coefficients || {},
    };
  }

  /**
   * Log AI suggestion with full context
   */
  async logAISuggestion(entry: AISuggestionLogEntry): Promise<any> {
    const logEntry = {
      userId: entry.userId,
      module: "ai_suggestion",
      action: entry.suggestionType,
      data: {
        inputContext: entry.inputContext,
        aiModel: entry.aiModelUsed,
        modelVersion: entry.modelVersion,
        output: entry.suggestionOutput,
        confidence: entry.confidenceScores,
        reasoning: entry.reasoningChain,
        feedback: entry.userFeedback,
      },
      status: "success" as const,
    };

    return await db.insert(enhancedInteractionLogs).values(logEntry);
  }

  /**
   * Archive AI interaction with full metrics
   */
  async archiveAIInteraction(entry: AIInteractionArchiveEntry): Promise<any> {
    const archiveEntry = {
      userId: entry.userId,
      module: entry.module,
      action: entry.interactionType,
      data: {
        input: entry.inputData,
        response: entry.aiResponse,
        context: entry.contextSnapshot,
        metrics: entry.performanceMetrics,
      },
      responseTime: entry.performanceMetrics.responseTime,
      status: "success" as const,
    };

    return await db.insert(enhancedInteractionLogs).values(archiveEntry);
  }

  /**
   * Get interaction history for analysis
   */
  async getInteractionHistory(userId: number, limit: number = 100): Promise<AIInteractionArchiveEntry[]> {
    const logs = await db
      .select()
      .from(enhancedInteractionLogs)
      .where(eq(enhancedInteractionLogs.userId, userId))
      .limit(limit);

    return logs.map((log) => ({
      userId: log.userId,
      interactionType: log.action,
      module: log.module,
      inputData: (log.data?.input as Record<string, any>) || {},
      aiResponse: (log.data?.response as Record<string, any>) || {},
      contextSnapshot: (log.data?.context as Record<string, any>) || {},
      performanceMetrics: {
        responseTime: log.responseTime || 0,
        successRate: log.status === "success" ? 100 : 0,
      },
    }));
  }

  /**
   * Calculate AI insights from interaction data
   */
  async calculateAIInsights(userId: number): Promise<{
    learningStyle: string;
    preferredPace: "slow" | "moderate" | "fast";
    strongAreas: string[];
    weakAreas: string[];
    recommendedFocus: string;
  }> {
    const history = await this.getInteractionHistory(userId, 50);

    // Analyze patterns
    const moduleCounts: Record<string, number> = {};
    history.forEach((h) => {
      moduleCounts[h.module] = (moduleCounts[h.module] || 0) + 1;
    });

    const topModule = Object.entries(moduleCounts).sort(([, a], [, b]) => b - a)[0]?.[0];

    return {
      learningStyle: "visual",
      preferredPace: "moderate",
      strongAreas: [topModule || "general"],
      weakAreas: ["advanced concepts"],
      recommendedFocus: "consolidate fundamentals",
    };
  }

  /**
   * Generate success prediction
   */
  generateSuccessPrediction(userId: number, goalData: any): number {
    let confidence = 0.5;

    if (goalData.title && goalData.title.length > 10) confidence += 0.1;
    if (goalData.description && goalData.description.length > 50) confidence += 0.1;
    if (goalData.deadline) confidence += 0.15;
    if (goalData.priority && goalData.priority > 1) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }

  /**
   * Update personalization coefficients based on feedback
   */
  updatePersonalizationCoefficients(
    current: Record<string, number>,
    feedback: { rating: number; category: string }
  ): Record<string, number> {
    const updated = { ...current };
    const adjustmentFactor = feedback.rating > 3 ? 1.1 : 0.9;

    updated[feedback.category] = (updated[feedback.category] || 0.5) * adjustmentFactor;
    updated[feedback.category] = Math.max(0, Math.min(1, updated[feedback.category]));

    return updated;
  }
}

export const aiDataModels = new AIDataModels();
