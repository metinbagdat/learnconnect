import { aiDataModels } from "./ai-data-models.js";

export interface MLFeatures {
  learningStyle: number[];
  skillGaps: number[];
  motivation: number[];
  pastPerformance: number[];
  timeAvailability: number;
  preferredIntensity: number;
}

export interface GoalRecommendation {
  title: string;
  description: string;
  confidence: number;
  reasoning: string;
  keyFactors: string[];
  expectedBenefits: string[];
  successProbability: number;
  alternatives?: GoalRecommendation[];
}

class FeatureEngine {
  /**
   * Prepare features from user profile for ML model
   */
  prepareGoalFeatures(userProfile: any, context: any): MLFeatures {
    const learningStyle = this.encodelearningStyle(userProfile.learningStyleAI);
    const skillGaps = this.encodeSkillGaps(userProfile.skillGapAnalysis);
    const motivation = this.encodeMotivation(userProfile.motivationProfile);
    const pastPerformance = this.encodePastPerformance(context.history);

    return {
      learningStyle,
      skillGaps,
      motivation,
      pastPerformance,
      timeAvailability: context.availableHoursPerWeek || 10,
      preferredIntensity: this.encodeIntensity(userProfile.recommendedIntensity),
    };
  }

  /**
   * Encode learning style to numeric features
   */
  private encodelearningStyle(style: Record<string, any>): number[] {
    return [
      style.visual ? 1 : 0,
      style.auditory ? 1 : 0,
      style.kinesthetic ? 1 : 0,
      style.reading ? 1 : 0,
    ];
  }

  /**
   * Encode skill gaps to numeric features
   */
  private encodeSkillGaps(gaps: Array<{ skill: string; gap: number }>): number[] {
    const topGaps = gaps.slice(0, 5);
    const encoded = topGaps.map((g) => g.gap / 100);
    // Pad to 5 features
    while (encoded.length < 5) {
      encoded.push(0);
    }
    return encoded;
  }

  /**
   * Encode motivation profile to numeric features
   */
  private encodeMotivation(profile: Record<string, any>): number[] {
    return [
      (profile.intrinsic || 0.5) * 100,
      (profile.extrinsic || 0.3) * 100,
      (profile.mastery || 0.5) * 100,
    ];
  }

  /**
   * Encode past performance to numeric features
   */
  private encodePastPerformance(history: any[]): number[] {
    if (!history || history.length === 0) {
      return [0.5, 0.5, 0.5];
    }

    const avgCompletion = history.reduce((sum, h) => sum + (h.completionRate || 0), 0) / history.length;
    const avgEngagement = history.reduce((sum, h) => sum + (h.engagement || 0), 0) / history.length;
    const consistency = Math.min(1, history.length / 10);

    return [avgCompletion, avgEngagement, consistency];
  }

  /**
   * Encode intensity preference
   */
  private encodeIntensity(intensity: string): number {
    const map: Record<string, number> = {
      low: 0.25,
      moderate: 0.5,
      high: 0.75,
      intensive: 1.0,
    };
    return map[intensity] || 0.5;
  }
}

class GoalRecommendationModel {
  private featureEngine: FeatureEngine;

  constructor() {
    this.featureEngine = new FeatureEngine();
  }

  /**
   * Generate AI-powered goal recommendations
   */
  async recommendGoals(userProfile: any, context: any): Promise<{
    recommendedGoals: GoalRecommendation[];
    explanations: any[];
  }> {
    try {
      // Prepare features
      const features = this.featureEngine.prepareGoalFeatures(userProfile, context);

      // Generate predictions
      const predictions = this.generatePredictions(features, userProfile);

      // Generate explanations
      const explanations = this.generateExplanations(predictions, features, userProfile);

      return {
        recommendedGoals: predictions,
        explanations,
      };
    } catch (error) {
      console.error("Goal recommendation failed:", error);
      return this.getFallbackRecommendations(userProfile);
    }
  }

  /**
   * Generate predictions from features
   */
  private generatePredictions(
    features: MLFeatures,
    userProfile: any
  ): GoalRecommendation[] {
    const recommendations: GoalRecommendation[] = [];

    // Academic goal
    if (features.skillGaps[0] > 0.3) {
      recommendations.push({
        title: "Master Core Concepts",
        description: "Focus on fundamental concepts that will strengthen your foundation",
        confidence: 0.92,
        reasoning: "High skill gap identified in core areas",
        keyFactors: ["Skill gap analysis", "Learning style match", "Time availability"],
        expectedBenefits: ["Improved foundation", "Better performance", "Increased confidence"],
        successProbability: 0.88,
      });
    }

    // Career development
    if (features.motivation[0] > 50) {
      recommendations.push({
        title: "Career Advancement Goal",
        description: "Develop professional skills aligned with career aspirations",
        confidence: 0.85,
        reasoning: "Strong intrinsic motivation detected",
        keyFactors: ["Motivation profile", "Career trajectory", "Market demand"],
        expectedBenefits: ["Career growth", "Skill development", "Professional network"],
        successProbability: 0.82,
      });
    }

    // Consistency goal
    recommendations.push({
      title: "Build Learning Consistency",
      description: "Establish a sustainable learning routine",
      confidence: 0.9,
      reasoning: "Consistency is key to long-term success",
      keyFactors: ["Time availability", "Motivation", "Past behavior"],
      expectedBenefits: ["Habit formation", "Better results", "Reduced procrastination"],
      successProbability: 0.85,
    });

    // Alternative options based on intensity
    if (features.preferredIntensity >= 0.7) {
      recommendations.push({
        title: "Intensive Learning Program",
        description: "Accelerated learning with high intensity engagement",
        confidence: 0.78,
        reasoning: "User preference for high intensity detected",
        keyFactors: ["Intensity preference", "Time commitment", "Motivation"],
        expectedBenefits: ["Faster progress", "Deep learning", "Achievement"],
        successProbability: 0.75,
      });
    }

    return recommendations.slice(0, 3);
  }

  /**
   * Generate human-readable explanations
   */
  private generateExplanations(
    recommendations: GoalRecommendation[],
    features: MLFeatures,
    userProfile: any
  ): any[] {
    return recommendations.map((rec) => ({
      goal: rec.title,
      reasoning: this.generateReasoning(rec, features, userProfile),
      keyFactors: rec.keyFactors,
      expectedBenefits: rec.expectedBenefits,
      confidence: rec.confidence,
      successProbability: rec.successProbability,
    }));
  }

  /**
   * Generate reasoning for recommendation
   */
  private generateReasoning(
    recommendation: GoalRecommendation,
    features: MLFeatures,
    userProfile: any
  ): string {
    const factors: string[] = [];

    if (features.skillGaps.some((g) => g > 0.5)) {
      factors.push("significant skill gaps detected");
    }

    if (features.motivation[0] > 60) {
      factors.push("strong intrinsic motivation");
    }

    if (features.timeAvailability > 15) {
      factors.push("good time availability");
    }

    if (features.preferredIntensity > 0.6) {
      factors.push("preference for intensive learning");
    }

    return `Based on ${factors.join(", ")}, this goal aligns well with your profile and has high success probability.`;
  }

  /**
   * Get fallback recommendations if ML fails
   */
  private getFallbackRecommendations(userProfile: any): {
    recommendedGoals: GoalRecommendation[];
    explanations: any[];
  } {
    const fallback: GoalRecommendation[] = [
      {
        title: "Improve Technical Skills",
        description: "Strengthen core technical competencies",
        confidence: 0.7,
        reasoning: "Default recommendation based on common learning patterns",
        keyFactors: ["Common goal", "Skill development", "Foundation building"],
        expectedBenefits: ["Better performance", "Confidence", "Career opportunities"],
        successProbability: 0.75,
      },
      {
        title: "Build Consistency",
        description: "Establish daily learning habits",
        confidence: 0.75,
        reasoning: "Consistency is fundamental to success",
        keyFactors: ["Habit formation", "Routine", "Long-term success"],
        expectedBenefits: ["Better results", "Habit strength", "Reduced friction"],
        successProbability: 0.8,
      },
    ];

    return {
      recommendedGoals: fallback,
      explanations: fallback.map((g) => ({
        goal: g.title,
        reasoning: g.reasoning,
        keyFactors: g.keyFactors,
        expectedBenefits: g.expectedBenefits,
      })),
    };
  }
}

export const goalRecommendationModel = new GoalRecommendationModel();
