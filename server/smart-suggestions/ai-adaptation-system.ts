import { db } from "../db.js";
import { enhancedInteractionLogs, aiProfiles } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export interface InteractionInsights {
  engagementLevel: number;
  preferenceSignals: Record<string, any>;
  successIndicators: Record<string, any>;
  improvementOpportunities: string[];
  adaptationRecommendations: string[];
}

export interface AdaptationRule {
  id: string;
  trigger: string;
  condition: (data: any) => boolean;
  action: (userId: number) => Promise<any>;
  priority: number;
}

class AIAdaptationSystem {
  private adaptationRules: AdaptationRule[] = [];

  constructor() {
    this.loadAdaptationRules();
  }

  /**
   * Load adaptation rules
   */
  private loadAdaptationRules(): void {
    this.adaptationRules = [
      {
        id: "low_engagement",
        trigger: "engagement < 30%",
        condition: (data: any) => data.engagement < 0.3,
        action: async (userId: number) => this.increaseMotivation(userId),
        priority: 1,
      },
      {
        id: "high_success",
        trigger: "success rate > 80%",
        condition: (data: any) => data.successRate > 0.8,
        action: async (userId: number) => this.increaseIntensity(userId),
        priority: 2,
      },
      {
        id: "consistent_performance",
        trigger: "3+ sessions completed",
        condition: (data: any) => data.sessionCount >= 3,
        action: async (userId: number) => this.adjustLearningPath(userId),
        priority: 1,
      },
      {
        id: "skill_gap_detected",
        trigger: "skill gap > 40%",
        condition: (data: any) => data.maxSkillGap > 0.4,
        action: async (userId: number) => this.updateSkillFocus(userId),
        priority: 1,
      },
    ];
  }

  /**
   * Adapt AI behavior based on user interactions
   */
  async adaptBasedOnInteraction(userId: number, interactionData: any): Promise<InteractionInsights> {
    try {
      // Analyze the interaction
      const insights = this.analyzeInteraction(interactionData);

      // Update user model
      await this.updateUserModel(userId, insights);

      // Adjust AI parameters
      await this.adjustAIParameters(userId, insights);

      // Evaluate and execute adaptation rules
      await this.evaluateAdaptationRules(userId, insights);

      // Log the adaptation
      await this.logAdaptation(userId, insights);

      return insights;
    } catch (error) {
      console.error("Adaptation failed:", error);
      throw error;
    }
  }

  /**
   * Analyze interaction for insights
   */
  private analyzeInteraction(interactionData: any): InteractionInsights {
    const engagement = this.calculateEngagement(interactionData);
    const preferences = this.extractPreferences(interactionData);
    const successIndicators = this.identifySuccessIndicators(interactionData);
    const improvements = this.findImprovementOpportunities(interactionData);

    return {
      engagementLevel: engagement,
      preferenceSignals: preferences,
      successIndicators,
      improvementOpportunities: improvements,
      adaptationRecommendations: this.generateRecommendations(engagement, preferences, improvements),
    };
  }

  /**
   * Calculate engagement level (0-1)
   */
  private calculateEngagement(data: any): number {
    let score = 0;

    if (data.timeSpent && data.timeSpent > 10) score += 0.2;
    if (data.actionsCount && data.actionsCount > 5) score += 0.2;
    if (data.focusTime && data.focusTime > 0.8) score += 0.2;
    if (data.interactionFrequency && data.interactionFrequency > 0.7) score += 0.2;
    if (data.completionRate && data.completionRate > 0.8) score += 0.2;

    return Math.min(score, 1);
  }

  /**
   * Extract user preference signals
   */
  private extractPreferences(data: any): Record<string, any> {
    return {
      preferredContentType: data.contentType || "mixed",
      preferredPace: data.pace > 0.7 ? "fast" : data.pace > 0.4 ? "moderate" : "slow",
      preferredDifficulty: data.difficulty || "medium",
      preferredFormat: data.format || "visual",
      learningStyle: data.learningStyle || "mixed",
      timeOfDay: data.timeOfDay || "flexible",
      batchSize: data.sessionLength > 60 ? "long" : data.sessionLength > 30 ? "medium" : "short",
    };
  }

  /**
   * Identify success indicators
   */
  private identifySuccessIndicators(data: any): Record<string, any> {
    return {
      completionRate: data.completionRate || 0,
      accuracyRate: data.accuracyRate || 0,
      retentionScore: data.retentionScore || 0,
      progressVelocity: data.progressVelocity || 0,
      consistencyScore: data.consistencyScore || 0,
      goalsAchieved: data.goalsAchieved || 0,
    };
  }

  /**
   * Find improvement opportunities
   */
  private findImprovementOpportunities(data: any): string[] {
    const opportunities: string[] = [];

    if (data.completionRate && data.completionRate < 0.5) {
      opportunities.push("Increase content completion rate");
    }

    if (data.focusTime && data.focusTime < 0.5) {
      opportunities.push("Reduce distractions during study sessions");
    }

    if (data.accuracyRate && data.accuracyRate < 0.7) {
      opportunities.push("Review fundamental concepts");
    }

    if (data.progressVelocity && data.progressVelocity < 0.3) {
      opportunities.push("Adjust learning pace or intensity");
    }

    if (!data.consistencyScore || data.consistencyScore < 0.6) {
      opportunities.push("Build more consistent study habits");
    }

    return opportunities;
  }

  /**
   * Generate adaptation recommendations
   */
  private generateRecommendations(
    engagement: number,
    preferences: Record<string, any>,
    improvements: string[]
  ): string[] {
    const recommendations: string[] = [];

    if (engagement > 0.8) {
      recommendations.push("Maintain current momentum with slightly increased difficulty");
    } else if (engagement > 0.5) {
      recommendations.push("Adjust content to maintain engagement");
    } else {
      recommendations.push("Provide motivational support and simplify content");
    }

    if (preferences.preferredPace === "fast") {
      recommendations.push("Consider accelerated learning path");
    } else if (preferences.preferredPace === "slow") {
      recommendations.push("Allow more time for concept consolidation");
    }

    recommendations.push(...improvements.map((imp) => `Action: ${imp}`));

    return recommendations;
  }

  /**
   * Update user model with insights
   */
  private async updateUserModel(userId: number, insights: InteractionInsights): Promise<void> {
    const profile = await db.select().from(aiProfiles).where(eq(aiProfiles.userId, userId));

    if (profile.length > 0) {
      const currentData = (profile[0].aiProfileData || {}) as Record<string, any>;

      const updated = {
        aiProfileData: {
          ...currentData,
          lastAdaptation: new Date(),
          engagementTrend: insights.engagementLevel,
          preferences: insights.preferenceSignals,
          successMetrics: insights.successIndicators,
          adaptationHistory: [
            ...(currentData.adaptationHistory || []),
            {
              date: new Date(),
              insights,
            },
          ],
        },
      };

      // Update would go here in production
    }
  }

  /**
   * Adjust AI parameters based on insights
   */
  private async adjustAIParameters(userId: number, insights: InteractionInsights): Promise<any> {
    const adjustments: Record<string, any> = {};

    if (insights.engagementLevel > 0.8) {
      adjustments.contentDifficulty = "increase";
      adjustments.challengeLevel = "advanced";
    } else if (insights.engagementLevel < 0.4) {
      adjustments.contentDifficulty = "decrease";
      adjustments.supportLevel = "high";
    }

    if (insights.successIndicators.completionRate > 0.9) {
      adjustments.pacing = "accelerate";
    } else if (insights.successIndicators.completionRate < 0.5) {
      adjustments.pacing = "slow_down";
    }

    adjustments.adaptationTimestamp = new Date();
    adjustments.userId = userId;

    return adjustments;
  }

  /**
   * Evaluate and execute adaptation rules
   */
  private async evaluateAdaptationRules(userId: number, insights: InteractionInsights): Promise<void> {
    const sortedRules = this.adaptationRules.sort((a, b) => a.priority - b.priority);

    const evaluationData = {
      engagement: insights.engagementLevel,
      successRate: insights.successIndicators.completionRate,
      sessionCount: 1, // In production, fetch from interaction history
      maxSkillGap: Math.max(...Object.values(insights.successIndicators as Record<string, number>)),
    };

    for (const rule of sortedRules) {
      if (rule.condition(evaluationData)) {
        try {
          await rule.action(userId);
        } catch (error) {
          console.error(`Failed to execute adaptation rule ${rule.id}:`, error);
        }
      }
    }
  }

  /**
   * Log adaptation event
   */
  private async logAdaptation(userId: number, insights: InteractionInsights): Promise<void> {
    const logEntry = {
      userId,
      module: "ai_adaptation",
      action: "adapt",
      data: insights,
      status: "success" as const,
    };

    // Log would be written to database in production
  }

  /**
   * Increase motivation for user
   */
  private async increaseMotivation(userId: number): Promise<any> {
    return {
      action: "increase_motivation",
      tactics: [
        "Show progress visualizations",
        "Provide encouragement messages",
        "Offer reward badges",
        "Simplify next challenges",
      ],
      timestamp: new Date(),
    };
  }

  /**
   * Increase learning intensity
   */
  private async increaseIntensity(userId: number): Promise<any> {
    return {
      action: "increase_intensity",
      adjustments: [
        "Advanced content",
        "Increased difficulty",
        "More challenges",
        "Higher pacing",
      ],
      timestamp: new Date(),
    };
  }

  /**
   * Adjust learning path
   */
  private async adjustLearningPath(userId: number): Promise<any> {
    return {
      action: "adjust_learning_path",
      changes: [
        "Personalize content sequence",
        "Focus on weak areas",
        "Introduce new topics",
        "Adjust pacing",
      ],
      timestamp: new Date(),
    };
  }

  /**
   * Update skill focus areas
   */
  private async updateSkillFocus(userId: number): Promise<any> {
    return {
      action: "update_skill_focus",
      focusAreas: [
        "Identified skill gaps",
        "Remedial content",
        "Foundation building",
        "Practice exercises",
      ],
      timestamp: new Date(),
    };
  }

  /**
   * Get adaptation history for user
   */
  async getAdaptationHistory(userId: number, limit: number = 20): Promise<any[]> {
    const logs = await db
      .select()
      .from(enhancedInteractionLogs)
      .where(eq(enhancedInteractionLogs.userId, userId))
      .limit(limit);

    return logs.map((log) => ({
      timestamp: log.timestamp,
      module: log.module,
      action: log.action,
      data: log.data,
    }));
  }
}

export const aiAdaptationSystem = new AIAdaptationSystem();
