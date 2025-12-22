import type { UserGoal, UserInterest } from "../../shared/schema.js";
import { aiSuggestionEngine } from "./ai-suggestion-engine.js";

export interface PreCourseSuggestion {
  id: string;
  type: "goal" | "learning_path" | "study_plan";
  title: string;
  description: string;
  confidence: number;
  estimatedTime: string;
  reasoning: string;
}

export interface PreCourseGuidanceData {
  userId: number;
  goals: UserGoal[];
  interests: UserInterest[];
  learningStyle?: string;
  careerGoal?: string;
}

class PreCourseAIGuidanceProcessor {
  /**
   * Generate comprehensive pre-course AI guidance
   */
  generatePreCourseGuidance(data: PreCourseGuidanceData): {
    goalSuggestions: PreCourseSuggestion[];
    learningPathSuggestions: PreCourseSuggestion[];
    studyPlanSuggestions: PreCourseSuggestion[];
    aiConfidence: number;
    explanation: string;
  } {
    const goalSuggestions = this.generateGoalSuggestions(data);
    const learningPathSuggestions = this.generateLearningPathSuggestions(data);
    const studyPlanSuggestions = this.generateStudyPlanSuggestions(data);

    const aiConfidence = this.calculateOverallConfidence([
      ...goalSuggestions,
      ...learningPathSuggestions,
      ...studyPlanSuggestions,
    ]);

    const explanation = this.generateExplanation(data, goalSuggestions);

    return {
      goalSuggestions,
      learningPathSuggestions,
      studyPlanSuggestions,
      aiConfidence,
      explanation,
    };
  }

  /**
   * Generate goal-based suggestions
   */
  private generateGoalSuggestions(data: PreCourseGuidanceData): PreCourseSuggestion[] {
    const suggestions: PreCourseSuggestion[] = [];

    // Career-based goals
    if (data.careerGoal) {
      const careerGoalMap: Record<string, { title: string; description: string; time: string }> = {
        web_developer: {
          title: "Become a Full-Stack Web Developer",
          description:
            "Master frontend and backend development technologies to build complete web applications",
          time: "4-6 months",
        },
        data_scientist: {
          title: "Launch a Data Science Career",
          description: "Learn Python, statistics, and machine learning for data-driven roles",
          time: "3-5 months",
        },
        mobile_developer: {
          title: "Develop Mobile Applications",
          description: "Build iOS and Android apps using native and cross-platform frameworks",
          time: "3-4 months",
        },
      };

      const goal = careerGoalMap[data.careerGoal.toLowerCase()] || {
        title: `Achieve your ${data.careerGoal} goal`,
        description: "Follow a personalized learning path for your career objective",
        time: "3-6 months",
      };

      suggestions.push({
        id: `goal-career-${Date.now()}`,
        type: "goal",
        title: goal.title,
        description: goal.description,
        confidence: 0.9,
        estimatedTime: goal.time,
        reasoning: `Based on your career goal of becoming a ${data.careerGoal}, we recommend this structured learning path`,
      });
    }

    // Interest-based goals
    data.interests.forEach((interest) => {
      suggestions.push({
        id: `goal-interest-${interest.id}`,
        type: "goal",
        title: `Master ${interest.interestTag}`,
        description: `Develop expertise in ${interest.interestTag} through structured learning`,
        confidence: parseFloat(interest.relevanceScore) * 0.9,
        estimatedTime: "8-12 weeks",
        reasoning: `Aligned with your strong interest in ${interest.interestTag} (relevance: ${interest.level})`,
      });
    });

    return suggestions.slice(0, 5);
  }

  /**
   * Generate learning path suggestions
   */
  private generateLearningPathSuggestions(data: PreCourseGuidanceData): PreCourseSuggestion[] {
    const pathTypes = [
      {
        id: "path-structured",
        title: "Structured Learning Path",
        description: "Follow a curated curriculum with guided progression",
        confidence: 0.95,
        time: "Follow at your pace",
        reasoning:
          "Recommended for learners who benefit from clear structure and predefined sequences",
      },
      {
        id: "path-project-based",
        title: "Project-Based Learning",
        description: "Learn by building real-world projects from day one",
        confidence: 0.85,
        time: "12-16 weeks",
        reasoning: "Ideal for hands-on learners who learn best by doing",
      },
      {
        id: "path-accelerated",
        title: "Accelerated Learning Path",
        description: "Intensive program for fast learners ready to move quickly",
        confidence: 0.8,
        time: "6-8 weeks",
        reasoning: "Suited for experienced learners looking to move fast",
      },
    ];

    return pathTypes.map((path) => ({
      id: path.id,
      type: "learning_path" as const,
      title: path.title,
      description: path.description,
      confidence: path.confidence,
      estimatedTime: path.time,
      reasoning: path.reasoning,
    }));
  }

  /**
   * Generate study plan suggestions
   */
  private generateStudyPlanSuggestions(data: PreCourseGuidanceData): PreCourseSuggestion[] {
    const suggestions: PreCourseSuggestion[] = [];

    // Intensive plan
    suggestions.push({
      id: "plan-intensive",
      type: "study_plan",
      title: "Intensive Study Plan (10 hours/week)",
      description: "Deep dive with 5 sessions of 2 hours each for rapid progress",
      confidence: 0.85,
      estimatedTime: "4-6 months to completion",
      reasoning: "Recommended for dedicated learners with committed study time",
    });

    // Balanced plan
    suggestions.push({
      id: "plan-balanced",
      type: "study_plan",
      title: "Balanced Study Plan (6 hours/week)",
      description: "Sustainable pace with 3 sessions of 2 hours each",
      confidence: 0.92,
      estimatedTime: "6-8 months to completion",
      reasoning: "Most popular for learners balancing work and learning",
    });

    // Flexible plan
    suggestions.push({
      id: "plan-flexible",
      type: "study_plan",
      title: "Flexible Study Plan (3 hours/week)",
      description: "Casual approach with 3 micro-sessions of 1 hour each",
      confidence: 0.8,
      estimatedTime: "12-16 months to completion",
      reasoning: "Perfect for busy professionals learning in their own time",
    });

    return suggestions;
  }

  /**
   * Calculate overall AI confidence
   */
  private calculateOverallConfidence(suggestions: PreCourseSuggestion[]): number {
    if (suggestions.length === 0) return 0.7;
    const avgConfidence = suggestions.reduce((sum, s) => sum + s.confidence, 0) / suggestions.length;
    return Math.round(avgConfidence * 100);
  }

  /**
   * Generate AI explanation for recommendations
   */
  private generateExplanation(data: PreCourseGuidanceData, goals: PreCourseSuggestion[]): string {
    let explanation = "Based on your profile, we recommend: ";

    if (data.careerGoal) {
      explanation += `Starting with skills needed for a ${data.careerGoal} role. `;
    }

    if (data.learningStyle) {
      explanation += `We've tailored suggestions for ${data.learningStyle} learners. `;
    }

    if (data.interests.length > 0) {
      explanation += `Your interests in ${data.interests.map((i) => i.interestTag).join(", ")} align well with our recommendations. `;
    }

    explanation += `This personalized guidance has ${this.calculateOverallConfidence(goals)}% confidence based on your profile.`;

    return explanation;
  }

  /**
   * Explain AI reasoning for a specific suggestion
   */
  explainAIReasoning(suggestion: PreCourseSuggestion, userData: PreCourseGuidanceData): {
    reasoning: string;
    alternatives: string[];
    supportingFactors: string[];
  } {
    return {
      reasoning: suggestion.reasoning,
      alternatives: [
        "Alternative approach based on different learning style",
        "Different timeline if you have more or less available time",
        "Specialized focus on specific skill subset",
      ],
      supportingFactors: [
        `Your career goal: ${userData.careerGoal || "Not specified"}`,
        `Your interests: ${userData.interests.map((i) => i.interestTag).join(", ")}`,
        `Your learning style: ${userData.learningStyle || "Not assessed"}`,
      ],
    };
  }

  /**
   * Accept suggestion and create action items
   */
  acceptSuggestion(suggestion: PreCourseSuggestion): {
    actionItems: string[];
    nextSteps: string[];
    timeline: string;
  } {
    return {
      actionItems: [
        "Confirm your learning preferences",
        "Set study schedule and calendar reminders",
        "Complete initial assessment",
        "Join study community",
      ],
      nextSteps: [
        "Start with foundation course",
        "Complete first hands-on project",
        "Get feedback from mentors",
        "Track progress with analytics",
      ],
      timeline: suggestion.estimatedTime,
    };
  }

  /**
   * Modify suggestion based on user preferences
   */
  modifySuggestion(
    suggestion: PreCourseSuggestion,
    modifications: {
      pace?: "slow" | "medium" | "fast";
      hoursPerWeek?: number;
      focusArea?: string;
    }
  ): PreCourseSuggestion {
    let modifiedConfidence = suggestion.confidence;
    let modifiedTime = suggestion.estimatedTime;

    if (modifications.pace === "fast") {
      modifiedConfidence *= 0.95;
      modifiedTime = "Accelerated (2-3 months)";
    } else if (modifications.pace === "slow") {
      modifiedConfidence *= 0.9;
      modifiedTime = "Extended (6+ months)";
    }

    return {
      ...suggestion,
      id: `${suggestion.id}-modified-${Date.now()}`,
      confidence: modifiedConfidence,
      estimatedTime: modifiedTime,
      description: modifications.focusArea
        ? `${suggestion.description} - Focusing on ${modifications.focusArea}`
        : suggestion.description,
    };
  }
}

export const preCourseAIGuidanceProcessor = new PreCourseAIGuidanceProcessor();
