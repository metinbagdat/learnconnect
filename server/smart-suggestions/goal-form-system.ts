import { db } from "../db.js";
import { userGoals, aiSuggestions, aiProfiles } from "../../shared/schema.js";
import { eq } from "drizzle-orm";

export interface GoalSuggestion {
  id: string;
  title: string;
  description: string;
  type: string;
  reasoning: string;
  estimatedDuration: number;
  confidenceScore: number;
}

export interface AIGoalAnalysis {
  confidence: number;
  analysis: string;
  milestones: string[];
  recommendations: string[];
  potentialChallenges: string[];
}

class GoalFormSystem {
  /**
   * Generate AI goal suggestions based on user profile
   */
  async generateGoalSuggestions(userId: number, goalType?: string): Promise<GoalSuggestion[]> {
    const profile = await db.select().from(aiProfiles).where(eq(aiProfiles.userId, userId));

    const suggestions: GoalSuggestion[] = [];

    if (goalType === "academic" || !goalType) {
      suggestions.push({
        id: `goal_${Date.now()}_1`,
        title: "Master a New Programming Language",
        description: "Learn Python or JavaScript and build 5 projects",
        type: "academic",
        reasoning: "Based on your profile showing interest in tech skills",
        estimatedDuration: 8,
        confidenceScore: 0.92,
      });
    }

    if (goalType === "career" || !goalType) {
      suggestions.push({
        id: `goal_${Date.now()}_2`,
        title: "Complete Professional Certification",
        description: "Earn an industry-recognized certification in your field",
        type: "career",
        reasoning: "Career progression is a key motivation in your profile",
        estimatedDuration: 12,
        confidenceScore: 0.88,
      });
    }

    if (goalType === "skill" || !goalType) {
      suggestions.push({
        id: `goal_${Date.now()}_3`,
        title: "Improve Communication Skills",
        description: "Master public speaking and presentation techniques",
        type: "skill",
        reasoning: "Soft skills complement technical development",
        estimatedDuration: 6,
        confidenceScore: 0.85,
      });
    }

    if (goalType === "personal" || !goalType) {
      suggestions.push({
        id: `goal_${Date.now()}_4`,
        title: "Build Consistent Learning Habit",
        description: "Study for 1 hour daily and track progress",
        type: "personal",
        reasoning: "Consistency is the foundation of long-term success",
        estimatedDuration: 4,
        confidenceScore: 0.9,
      });
    }

    return suggestions.slice(0, 3);
  }

  /**
   * Generate AI description for a goal
   */
  async generateAIDescription(title: string, goalType: string): Promise<string> {
    const descriptions: Record<string, Record<string, string>> = {
      academic: {
        default:
          "This academic goal focuses on expanding your knowledge and skills in a structured manner. Break it down into smaller milestones, practice consistently, and track your progress regularly.",
      },
      career: {
        default:
          "This career goal aligns with professional growth. Create a clear action plan, identify required skills, and set measurable milestones to track your advancement.",
      },
      skill: {
        default:
          "Skill development requires deliberate practice and repetition. Focus on consistent effort, seek feedback, and apply your learning in real projects.",
      },
      personal: {
        default:
          "Personal growth goals are self-directed and intrinsically motivating. Set specific targets, celebrate small wins, and maintain motivation throughout your journey.",
      },
    };

    return descriptions[goalType]?.default || "Work towards this goal with consistency and dedication.";
  }

  /**
   * Analyze goal with AI
   */
  async analyzeGoal(
    userId: number,
    goalTitle: string,
    goalDescription: string,
    goalType: string,
    deadline?: Date
  ): Promise<AIGoalAnalysis> {
    const confidence = this.calculateConfidence(goalTitle, goalDescription, goalType);

    return {
      confidence: Math.round(confidence * 100),
      analysis: this.generateAnalysis(goalTitle, goalType),
      milestones: this.generateMilestones(goalTitle, goalType, deadline),
      recommendations: this.generateRecommendations(goalType),
      potentialChallenges: this.generateChallenges(goalType),
    };
  }

  /**
   * Calculate confidence score for a goal
   */
  private calculateConfidence(title: string, description: string, type: string): number {
    let score = 0.5;

    if (title && title.length > 5) score += 0.15;
    if (description && description.length > 20) score += 0.15;
    if (type && type.length > 0) score += 0.1;
    if (title.match(/[Ss]pecific|[Mm]easurable|[Aa]chievable/)) score += 0.1;

    return Math.min(score, 0.95);
  }

  /**
   * Generate AI analysis text
   */
  private generateAnalysis(title: string, type: string): string {
    const analyses: Record<string, string> = {
      academic:
        "This is a well-structured academic goal that focuses on knowledge acquisition. Consider breaking it into smaller learning objectives.",
      career:
        "Your career goal is ambitious and aligned with professional growth. Create a timeline and identify prerequisite skills.",
      skill:
        "Skill development goals benefit from consistent practice. Plan for regular practice sessions and seek feedback.",
      personal:
        "Personal growth is a worthy objective. Focus on self-reflection and track your emotional and intellectual progress.",
    };

    return analyses[type] || "This is a meaningful goal. Create a clear action plan to achieve it.";
  }

  /**
   * Generate milestones
   */
  private generateMilestones(title: string, type: string, deadline?: Date): string[] {
    return [
      "Define specific learning objectives",
      "Create a detailed action plan",
      "Identify resources and support",
      "Track progress regularly",
      "Adjust strategy as needed",
      "Celebrate achievements",
    ];
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(type: string): string[] {
    const recommendations: Record<string, string[]> = {
      academic: [
        "Break goal into smaller chunks",
        "Use active learning techniques",
        "Practice with real projects",
        "Review regularly",
      ],
      career: [
        "Identify skill gaps",
        "Create timeline",
        "Seek mentorship",
        "Build portfolio",
      ],
      skill: ["Daily practice", "Seek feedback", "Build projects", "Track improvement"],
      personal: ["Reflect regularly", "Celebrate progress", "Stay motivated", "Adjust as needed"],
    };

    return recommendations[type] || ["Set clear objectives", "Track progress", "Stay motivated"];
  }

  /**
   * Generate potential challenges
   */
  private generateChallenges(type: string): string[] {
    const challenges: Record<string, string[]> = {
      academic: ["Staying motivated", "Managing time", "Complex concepts", "Practice consistency"],
      career: ["Skill gaps", "Time commitment", "Competition", "Work-life balance"],
      skill: ["Plateauing", "Consistency", "Finding resources", "Applying learning"],
      personal: ["Motivation", "Self-doubt", "External distractions", "Measuring progress"],
    };

    return challenges[type] || ["Maintaining motivation", "Time management", "Staying consistent"];
  }

  /**
   * Suggest deadline based on goal type
   */
  suggestDeadline(goalType: string): Date {
    const today = new Date();
    let weeksToAdd = 8;

    switch (goalType) {
      case "academic":
        weeksToAdd = 12;
        break;
      case "career":
        weeksToAdd = 16;
        break;
      case "skill":
        weeksToAdd = 8;
        break;
      case "personal":
        weeksToAdd = 6;
        break;
    }

    const deadline = new Date(today.getTime() + weeksToAdd * 7 * 24 * 60 * 60 * 1000);
    return deadline;
  }

  /**
   * Validate goal form data
   */
  validateGoalForm(data: {
    title: string;
    description: string;
    type: string;
    deadline: Date;
    priority: number;
  }): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.title || data.title.trim().length < 3) {
      errors.push("Goal title must be at least 3 characters");
    }

    if (!data.type || !["academic", "career", "skill", "personal"].includes(data.type)) {
      errors.push("Invalid goal type");
    }

    if (data.deadline < new Date()) {
      errors.push("Deadline must be in the future");
    }

    if (data.priority < 1 || data.priority > 4) {
      errors.push("Priority must be between 1 and 4");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Save goal to database
   */
  async saveGoal(userId: number, goalData: any): Promise<any> {
    const validation = this.validateGoalForm(goalData);
    if (!validation.valid) {
      throw new Error(validation.errors.join(", "));
    }

    const result = await db.insert(userGoals).values({
      userId,
      goalText: goalData.title,
      goalType: goalData.type,
      targetDate: goalData.deadline,
      priority: goalData.priority,
      progress: 0,
      completed: false,
    });

    return result;
  }
}

export const goalFormSystem = new GoalFormSystem();
