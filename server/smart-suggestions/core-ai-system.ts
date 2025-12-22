import { aiSuggestionEngine } from "./ai-suggestion-engine.js";
import type { UserGoal, UserInterest } from "../../shared/schema.js";

export interface UserProfile {
  userId: number;
  educationalBackground: string;
  careerGoal: string;
  interests: string[];
  learningPace: "slow" | "medium" | "fast";
  availableHoursPerWeek: number;
  enrollmentDate: Date;
}

export interface AISystemState {
  userId: number;
  profile: UserProfile;
  modelsInitialized: string[];
  lastUpdated: Date;
  status: "active" | "paused" | "idle";
}

class LearnConnectAISystem {
  private aiModels = {
    goalRecommendation: "initialized",
    courseSuggestion: "initialized",
    progressPrediction: "initialized",
    engagementOptimizer: "initialized",
    personalizationEngine: "initialized",
  };

  private userJourneyStates: Map<number, AISystemState> = new Map();
  private userProfiles: Map<number, UserProfile> = new Map();

  constructor() {
    console.log("[LearnConnectAISystem] Core AI System initialized with models:", Object.keys(this.aiModels));
  }

  /**
   * Initialize AI system for a new user during registration
   */
  initializeUserJourney(userId: number, registrationData: any): {
    status: "success" | "error";
    userProfile?: UserProfile;
    initialSuggestions?: any;
    aiModelsInitialized?: string[];
    message?: string;
  } {
    try {
      // Create comprehensive user profile from registration data
      const userProfile = this.createAIProfile(userId, registrationData);

      // Store profile for future reference
      this.userProfiles.set(userId, userProfile);

      // Initialize AI system state for user
      const systemState: AISystemState = {
        userId,
        profile: userProfile,
        modelsInitialized: Object.keys(this.aiModels),
        lastUpdated: new Date(),
        status: "active",
      };

      this.userJourneyStates.set(userId, systemState);

      // Generate initial suggestions based on profile
      const initialSuggestions = this.generateInitialSuggestions(userProfile);

      return {
        status: "success",
        userProfile,
        initialSuggestions,
        aiModelsInitialized: Object.keys(this.aiModels),
      };
    } catch (error) {
      console.error(`[LearnConnectAISystem] Initialization failed for user ${userId}:`, error);
      return {
        status: "error",
        message: `AI system initialization failed: ${String(error)}`,
      };
    }
  }

  /**
   * Create comprehensive user profile from registration data
   */
  private createAIProfile(userId: number, data: any): UserProfile {
    return {
      userId,
      educationalBackground: data.educationalBackground || "not_specified",
      careerGoal: data.careerGoal || "not_specified",
      interests: data.interests || [],
      learningPace: data.learningPace || "medium",
      availableHoursPerWeek: data.availableHoursPerWeek || 10,
      enrollmentDate: new Date(),
    };
  }

  /**
   * Generate initial AI suggestions for new user
   */
  private generateInitialSuggestions(profile: UserProfile): any {
    return {
      suggestedGoals: aiSuggestionEngine.generateGoalSuggestions(
        profile.userId,
        profile.educationalBackground,
        profile.careerGoal,
        profile.interests
      ),
      learningPathRecommendation: this.recommendLearningPath(profile),
      estimatedTimeToComplete: this.estimateTimeToComplete(profile),
      personalizedTips: this.generatePersonalizedTips(profile),
    };
  }

  /**
   * Recommend learning path based on profile
   */
  private recommendLearningPath(profile: UserProfile): {
    phases: string[];
    estimatedDuration: string;
    keyMilestones: string[];
  } {
    const phases = [];

    if (profile.interests.includes("programming")) {
      phases.push("Fundamentals", "Web Development", "Advanced Topics");
    } else if (profile.interests.includes("data")) {
      phases.push("Statistics", "Data Analysis", "Machine Learning");
    } else {
      phases.push("Foundations", "Intermediate Skills", "Advanced Practice");
    }

    const totalHours = phases.length * 40;
    const weeksNeeded = Math.ceil(totalHours / profile.availableHoursPerWeek);

    return {
      phases,
      estimatedDuration: `${weeksNeeded} weeks`,
      keyMilestones: [`Complete Phase 1: ${phases[0]}`, `Complete Phase 2: ${phases[1] || "Practice"}`, `Capstone Project`],
    };
  }

  /**
   * Estimate time to complete based on learning pace
   */
  private estimateTimeToComplete(profile: UserProfile): Record<string, string> {
    const baseHours = 40;
    const paceMultipliers = {
      fast: 0.7,
      medium: 1,
      slow: 1.4,
    };

    const adjustedHours = baseHours * paceMultipliers[profile.learningPace];
    const weeks = Math.ceil(adjustedHours / profile.availableHoursPerWeek);
    const months = Math.ceil(weeks / 4);

    return {
      weeks: `${weeks} weeks`,
      months: `${months} months`,
      hoursPerWeek: `${profile.availableHoursPerWeek} hours`,
    };
  }

  /**
   * Generate personalized learning tips
   */
  private generatePersonalizedTips(profile: UserProfile): string[] {
    const tips = [];

    if (profile.learningPace === "fast") {
      tips.push("You learn quickly! Consider challenging courses to accelerate your progress.");
    } else if (profile.learningPace === "slow") {
      tips.push("Take your time and practice thoroughly. Quality over speed leads to better retention.");
    }

    if (profile.availableHoursPerWeek < 5) {
      tips.push("With limited time, focus on high-impact courses. Short daily sessions are effective.");
    }

    if (profile.interests.length === 0) {
      tips.push("Explore different topics to discover your interests. This helps personalize your learning.");
    }

    tips.push("Regular practice and feedback will help you stay on track with your goals.");

    return tips;
  }

  /**
   * Update user journey with new interactions
   */
  updateUserJourney(userId: number, interaction: any): void {
    const state = this.userJourneyStates.get(userId);
    if (state) {
      state.lastUpdated = new Date();
      this.userJourneyStates.set(userId, state);
    }
  }

  /**
   * Get AI system status for user
   */
  getSystemStatus(userId: number): AISystemState | null {
    return this.userJourneyStates.get(userId) || null;
  }

  /**
   * Get user profile
   */
  getUserProfile(userId: number): UserProfile | null {
    return this.userProfiles.get(userId) || null;
  }

  /**
   * Predict user progress based on historical data
   */
  predictProgress(userId: number, completedCourses: number, enrolledCourses: number): {
    estimatedCompletionRate: number;
    riskOfDropout: "low" | "medium" | "high";
    recommendations: string[];
  } {
    const completionRate = enrolledCourses > 0 ? (completedCourses / enrolledCourses) * 100 : 0;
    let dropoutRisk: "low" | "medium" | "high" = "low";

    if (completionRate < 25) {
      dropoutRisk = "high";
    } else if (completionRate < 60) {
      dropoutRisk = "medium";
    }

    const recommendations = [];
    if (dropoutRisk === "high") {
      recommendations.push("Consider scheduling regular study sessions");
      recommendations.push("Join a study group for motivation and accountability");
    }

    return {
      estimatedCompletionRate: Math.round(completionRate),
      riskOfDropout: dropoutRisk,
      recommendations,
    };
  }

  /**
   * Optimize engagement through personalized interventions
   */
  getEngagementOptimization(userId: number, lastActivityDays: number): {
    shouldIntervene: boolean;
    interventionType?: "reminder" | "incentive" | "milestone" | "course_recommendation";
    message?: string;
  } {
    if (lastActivityDays > 7) {
      return {
        shouldIntervene: true,
        interventionType: "reminder",
        message: `You haven't studied in ${lastActivityDays} days. Let's get back on track!`,
      };
    }

    if (lastActivityDays > 3) {
      return {
        shouldIntervene: true,
        interventionType: "incentive",
        message: "Continue your streak! You're making great progress.",
      };
    }

    return {
      shouldIntervene: false,
    };
  }

  /**
   * Comprehensive AI report for admin dashboard
   */
  getComprehensiveReport(): {
    totalActiveUsers: number;
    aiModelsStatus: Record<string, string>;
    systemHealth: "healthy" | "degraded" | "critical";
  } {
    return {
      totalActiveUsers: this.userJourneyStates.size,
      aiModelsStatus: this.aiModels,
      systemHealth: this.userJourneyStates.size > 0 ? "healthy" : "idle",
    };
  }
}

export const learnConnectAISystem = new LearnConnectAISystem();
