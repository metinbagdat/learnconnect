import { learnConnectAISystem } from "./core-ai-system.js";
import { aiSuggestionEngine } from "./ai-suggestion-engine.js";

export interface RegistrationData {
  email: string;
  educationalBackground?: string;
  careerGoal?: string;
  currentLevel?: string;
  learningPace?: "slow" | "medium" | "fast";
  availableHoursPerWeek?: number;
  interests?: string[];
  targetDomain?: string;
  previousExperience?: string;
  motivation?: string;
  challenges?: string[];
}

export interface ProfileInsights {
  learningStylePrediction: {
    style: "visual" | "auditory" | "kinesthetic" | "reading";
    confidence: number;
    description: string;
  };
  skillGapAnalysis: {
    gaps: Array<{
      skill: string;
      proficiency: "beginner" | "intermediate" | "advanced";
      priority: "high" | "medium" | "low";
    }>;
    totalGaps: number;
    priorityAreas: string[];
  };
  motivationFactors: {
    primaryDriver: string;
    secondaryDrivers: string[];
    riskFactors: string[];
  };
  potentialRoadblocks: {
    obstacles: string[];
    mitigationStrategies: string[];
    supportRecommendations: string[];
  };
  optimalStudyTimes: {
    recommendedHoursPerWeek: number;
    sessionsPerWeek: number;
    sessionDuration: string;
    bestTimeOfDay: string;
  };
  reliabilityScore: number; // 0-100
}

export interface OnboardingPlan {
  phase: "discovery" | "foundation" | "practice" | "specialization";
  duration: string;
  keyMilestones: Array<{
    milestone: string;
    estimatedWeek: number;
    description: string;
  }>;
  recommendedResources: string[];
  successMetrics: string[];
  checkpoints: Array<{
    week: number;
    action: string;
    description: string;
  }>;
}

export interface RegistrationProcessingResult {
  status: "success" | "error";
  profileInsights?: ProfileInsights;
  goalSuggestions?: any[];
  onboardingPlan?: OnboardingPlan;
  aiConfidence: number;
  message?: string;
}

class RegistrationAIProcessor {
  /**
   * Process complete registration data for initial AI insights
   */
  processRegistrationData(userId: number, userData: RegistrationData): RegistrationProcessingResult {
    try {
      // Extract AI-powered insights from registration data
      const profileInsights = this.extractAIInsights(userData);

      // Generate initial goal suggestions based on insights
      const goalSuggestions = this.generateInitialGoals(profileInsights, userData);

      // Create personalized onboarding plan
      const onboardingPlan = this.createOnboardingPlan(profileInsights, goalSuggestions);

      // Calculate overall AI confidence
      const aiConfidence = this.calculateConfidence(profileInsights);

      return {
        status: "success",
        profileInsights,
        goalSuggestions,
        onboardingPlan,
        aiConfidence,
      };
    } catch (error) {
      console.error("[RegistrationAIProcessor] Processing failed:", error);
      return {
        status: "error",
        aiConfidence: 0,
        message: `Registration processing failed: ${String(error)}`,
      };
    }
  }

  /**
   * Extract AI-powered insights from registration data
   */
  private extractAIInsights(userData: RegistrationData): ProfileInsights {
    const learningStyle = this.predictLearningStyle(userData);
    const skillGaps = this.analyzeSkillGaps(userData);
    const motivation = this.identifyMotivationFactors(userData);
    const roadblocks = this.predictPotentialRoadblocks(userData);
    const studyTimes = this.predictOptimalStudyTimes(userData);

    return {
      learningStylePrediction: learningStyle,
      skillGapAnalysis: skillGaps,
      motivationFactors: motivation,
      potentialRoadblocks: roadblocks,
      optimalStudyTimes: studyTimes,
      reliabilityScore: this.calculateProfileReliability(userData),
    };
  }

  /**
   * Predict learning style based on registration answers
   */
  private predictLearningStyle(userData: RegistrationData): ProfileInsights["learningStylePrediction"] {
    let style: "visual" | "auditory" | "kinesthetic" | "reading" = "visual";
    let confidence = 0.65;

    // Analyze patterns
    if (userData.previousExperience?.includes("video") || userData.interests?.includes("design")) {
      style = "visual";
      confidence = 0.8;
    } else if (userData.previousExperience?.includes("lecture") || userData.interests?.includes("discussion")) {
      style = "auditory";
      confidence = 0.75;
    } else if (userData.previousExperience?.includes("project") || userData.interests?.includes("hands-on")) {
      style = "kinesthetic";
      confidence = 0.8;
    } else if (userData.interests?.includes("reading") || userData.interests?.includes("documentation")) {
      style = "reading";
      confidence = 0.7;
    }

    const descriptions = {
      visual: "You learn best through visual materials like diagrams, charts, and videos",
      auditory: "You learn best through listening and verbal explanations",
      kinesthetic: "You learn best through hands-on practice and experimentation",
      reading: "You learn best through reading and writing",
    };

    return {
      style,
      confidence,
      description: descriptions[style],
    };
  }

  /**
   * Analyze skill gaps based on background and goals
   */
  private analyzeSkillGaps(userData: RegistrationData): ProfileInsights["skillGapAnalysis"] {
    const gaps: Array<{ skill: string; proficiency: "beginner" | "intermediate" | "advanced"; priority: "high" | "medium" | "low" }> = [];

    // Map career goals to required skills
    const skillMap: Record<string, string[]> = {
      web_developer: ["HTML/CSS", "JavaScript", "Backend Development", "Database Design"],
      data_scientist: ["Python", "Statistics", "Machine Learning", "Data Visualization"],
      mobile_developer: ["Mobile UI", "API Integration", "Mobile Architecture", "Performance Optimization"],
      devops_engineer: ["Linux", "Docker", "Kubernetes", "CI/CD", "Cloud Platforms"],
      product_manager: ["Product Strategy", "Data Analysis", "User Research", "Roadmap Planning"],
    };

    const targetSkills = skillMap[userData.careerGoal?.toLowerCase() || ""] || [];

    targetSkills.forEach((skill) => {
      gaps.push({
        skill,
        proficiency: userData.currentLevel === "advanced" ? "intermediate" : "beginner",
        priority: Math.random() > 0.5 ? "high" : "medium",
      });
    });

    return {
      gaps,
      totalGaps: gaps.length,
      priorityAreas: gaps.filter((g) => g.priority === "high").map((g) => g.skill),
    };
  }

  /**
   * Identify motivation factors
   */
  private identifyMotivationFactors(userData: RegistrationData): ProfileInsights["motivationFactors"] {
    const motivationKeywords: Record<string, string> = {
      career: "Career advancement",
      money: "Financial growth",
      learning: "Personal learning",
      challenge: "Overcoming challenges",
      community: "Community connection",
      skill: "Skill mastery",
      certification: "Certification achievement",
      hobby: "Personal hobby",
    };

    let primaryDriver = "Personal development";
    let secondaryDrivers: string[] = [];

    if (userData.motivation) {
      Object.entries(motivationKeywords).forEach(([key, value]) => {
        if (userData.motivation?.toLowerCase().includes(key)) {
          secondaryDrivers.push(value);
        }
      });
    }

    if (userData.careerGoal) {
      primaryDriver = `Pursuing a career as ${userData.careerGoal}`;
    }

    const riskFactors: string[] = [];
    if (userData.availableHoursPerWeek && userData.availableHoursPerWeek < 3) {
      riskFactors.push("Limited time availability");
    }
    if (userData.challenges?.includes("procrastination")) {
      riskFactors.push("Procrastination tendency");
    }
    if (userData.challenges?.includes("retention")) {
      riskFactors.push("Information retention difficulty");
    }

    return {
      primaryDriver,
      secondaryDrivers,
      riskFactors,
    };
  }

  /**
   * Predict potential roadblocks
   */
  private predictPotentialRoadblocks(userData: RegistrationData): ProfileInsights["potentialRoadblocks"] {
    const obstacles = [];
    const mitigationStrategies = [];
    const supportRecommendations = [];

    // Time-based obstacles
    if (userData.availableHoursPerWeek && userData.availableHoursPerWeek < 5) {
      obstacles.push("Limited study time");
      mitigationStrategies.push("Use focused micro-learning sessions (15-30 minutes)");
      supportRecommendations.push("Consider setting study reminders");
    }

    // Experience-based obstacles
    if (userData.currentLevel === "beginner") {
      obstacles.push("Steep learning curve");
      mitigationStrategies.push("Start with foundational courses");
      supportRecommendations.push("Join study groups for peer support");
    }

    // Motivation obstacles
    if (userData.challenges?.includes("motivation")) {
      obstacles.push("Maintaining motivation over time");
      mitigationStrategies.push("Break learning into smaller milestones");
      supportRecommendations.push("Gamification and progress tracking");
    }

    // Technical obstacles
    if (!userData.previousExperience) {
      obstacles.push("Lack of prior experience");
      mitigationStrategies.push("Structured curriculum with prerequisites");
      supportRecommendations.push("Mentor assignment for guidance");
    }

    return {
      obstacles,
      mitigationStrategies,
      supportRecommendations,
    };
  }

  /**
   * Predict optimal study times and pace
   */
  private predictOptimalStudyTimes(userData: RegistrationData): ProfileInsights["optimalStudyTimes"] {
    let hoursPerWeek = userData.availableHoursPerWeek || 10;
    let sessionsPerWeek = 0;
    let sessionDuration = "60 minutes";
    let bestTimeOfDay = "morning";

    // Adjust based on learning pace
    if (userData.learningPace === "fast") {
      hoursPerWeek = Math.min(hoursPerWeek * 1.2, 40);
      sessionsPerWeek = Math.ceil(hoursPerWeek / 2);
      sessionDuration = "90-120 minutes";
    } else if (userData.learningPace === "slow") {
      hoursPerWeek = Math.max(hoursPerWeek * 0.8, 5);
      sessionsPerWeek = Math.ceil(hoursPerWeek / 0.75);
      sessionDuration = "30-45 minutes";
    } else {
      sessionsPerWeek = Math.ceil(hoursPerWeek / 1.5);
    }

    // Predict best time
    if (userData.previousExperience?.includes("morning")) {
      bestTimeOfDay = "morning (6-10 AM)";
    } else if (userData.previousExperience?.includes("evening")) {
      bestTimeOfDay = "evening (6-9 PM)";
    } else {
      bestTimeOfDay = "flexible (any time works for new learners)";
    }

    return {
      recommendedHoursPerWeek: Math.round(hoursPerWeek),
      sessionsPerWeek,
      sessionDuration,
      bestTimeOfDay,
    };
  }

  /**
   * Calculate reliability of extracted profile
   */
  private calculateProfileReliability(userData: RegistrationData): number {
    let score = 50; // Base score

    if (userData.educationalBackground) score += 10;
    if (userData.careerGoal) score += 10;
    if (userData.interests && userData.interests.length > 0) score += 10;
    if (userData.previousExperience) score += 10;
    if (userData.learningPace) score += 5;
    if (userData.availableHoursPerWeek) score += 5;
    if (userData.motivation) score += 10;

    return Math.min(score, 100);
  }

  /**
   * Generate initial goal suggestions
   */
  generateInitialGoals(
    insights: ProfileInsights,
    userData: RegistrationData
  ): Array<{
    goal: string;
    type: string;
    timelineWeeks: number;
    milestones: string[];
    confidence: number;
  }> {
    const goals: Array<{
      goal: string;
      type: string;
      timelineWeeks: number;
      milestones: string[];
      confidence: number;
    }> = [];

    // Career-based goal
    if (userData.careerGoal) {
      goals.push({
        goal: `Build skills to become a ${userData.careerGoal}`,
        type: "career",
        timelineWeeks: userData.learningPace === "fast" ? 12 : userData.learningPace === "slow" ? 24 : 16,
        milestones: [
          `Learn foundational concepts (${insights.skillGapAnalysis.priorityAreas[0] || "core skills"})`,
          "Complete first project",
          "Build portfolio piece",
          "Achieve intermediate proficiency",
        ],
        confidence: 0.85,
      });
    }

    // Skill-based goal
    if (insights.skillGapAnalysis.priorityAreas.length > 0) {
      goals.push({
        goal: `Master ${insights.skillGapAnalysis.priorityAreas[0]}`,
        type: "skill",
        timelineWeeks: 8,
        milestones: [
          "Understand fundamentals",
          "Apply in practice exercises",
          "Build working project",
          "Achieve proficiency certification",
        ],
        confidence: 0.8,
      });
    }

    // Personal development goal
    goals.push({
      goal: "Build a consistent learning habit",
      type: "personal",
      timelineWeeks: 4,
      milestones: [
        "Complete first lesson",
        "Maintain 1-week streak",
        "Maintain 1-month streak",
        "Join study community",
      ],
      confidence: 0.9,
    });

    return goals;
  }

  /**
   * Create personalized onboarding plan
   */
  createOnboardingPlan(
    insights: ProfileInsights,
    goalSuggestions: any[]
  ): OnboardingPlan {
    const phase = insights.skillGapAnalysis.gaps.length > 5 ? "discovery" : "foundation";
    const duration =
      phase === "discovery"
        ? "2-3 weeks (explore and assess)"
        : "1-2 weeks (learn fundamentals)";

    return {
      phase,
      duration,
      keyMilestones: [
        {
          milestone: "Complete learning style assessment",
          estimatedWeek: 1,
          description: `Confirmed learning style: ${insights.learningStylePrediction.style}`,
        },
        {
          milestone: "Build first learning habit",
          estimatedWeek: 2,
          description: `Establish ${insights.optimalStudyTimes.sessionsPerWeek}x weekly study sessions`,
        },
        {
          milestone: "Complete onboarding path",
          estimatedWeek: 3,
          description: "Master foundational concepts",
        },
        {
          milestone: "Set first major goal",
          estimatedWeek: 4,
          description: goalSuggestions[0]?.goal || "Define learning objectives",
        },
      ],
      recommendedResources: [
        "Beginner-friendly video tutorials",
        "Interactive practice exercises",
        "Community discussion forums",
        "Progress tracking dashboard",
      ],
      successMetrics: [
        "Complete 3 lessons in first week",
        "Build 1 streak of 5 consecutive study days",
        "Achieve 80%+ on first assessment",
        "Join at least 1 study group or community",
      ],
      checkpoints: [
        {
          week: 1,
          action: "take-assessment",
          description: "Assess current knowledge level",
        },
        {
          week: 2,
          action: "complete-foundation",
          description: "Finish foundational module",
        },
        {
          week: 4,
          action: "start-first-project",
          description: "Begin first hands-on project",
        },
      ],
    };
  }

  /**
   * Calculate overall AI confidence
   */
  private calculateConfidence(insights: ProfileInsights): number {
    const avgConfidence =
      (insights.learningStylePrediction.confidence +
        (insights.skillGapAnalysis.totalGaps > 0 ? 0.8 : 0.6) +
        (insights.reliabilityScore / 100) +
        0.85) /
      4;

    return Math.round(avgConfidence * 100);
  }
}

export const registrationAIProcessor = new RegistrationAIProcessor();
