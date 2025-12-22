import { db } from "./db.js";
import { 
  courses, 
  userCourses, 
  courseCurriculums, 
  curriculumModules, 
  curriculumSkills,
  userCurriculums,
  userCurriculumTasks
} from "../shared/schema.js";
import { eq, and, desc, asc, sql } from "drizzle-orm";

interface UserContext {
  userId: number;
  enrolledCourses: any[];
  completedCourses: any[];
  learningStyle: string;
  skillLevel: string;
  availableHours: number;
  goals: any[];
}

interface CurriculumOption {
  courses: any[];
  estimatedDuration: number;
  difficulty: string;
  reason: string;
}

interface PersonalizedCurriculum {
  title: string;
  description: string;
  courses: any[];
  skills: any[];
  estimatedDuration: number;
  milestones: any[];
  aiConfidence: number;
  generationMethod: string;
  difficulty?: string;
}

interface GenerationSession {
  id: string;
  userId: number;
  startedAt: Date;
  completedAt?: Date;
  status: 'in_progress' | 'completed' | 'failed';
  productionId?: number;
}

interface ProductionData {
  generationId: string;
  userContext: UserContext;
  curriculumOptions: CurriculumOption[];
  selectedCurriculum: PersonalizedCurriculum;
  aiInsights: Record<string, any>;
  interactionLog: any[];
  createdAt: Date;
  savedAt: Date;
}

/**
 * AI-Powered Curriculum Generation Engine
 * Generates personalized learning paths based on user enrollment and preferences
 */
export class CurriculumAIEngine {
  private generationSessions: Map<string, GenerationSession> = new Map();
  private productionStore: Map<string, ProductionData> = new Map();
  private interactionLog: any[] = [];

  /**
   * Generate personalized curriculum for a user
   */
  async generatePersonalizedCurriculum(
    userId: number,
    preferences?: {
      difficulty?: string;
      focusAreas?: string[];
      estimatedWeeklyHours?: number;
      targetDuration?: number;
    }
  ): Promise<{
    success: boolean;
    curriculum?: PersonalizedCurriculum;
    generationId?: string;
    message?: string;
  }> {
    const generationId = `gen_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      // Track session
      const session: GenerationSession = {
        id: generationId,
        userId,
        startedAt: new Date(),
        status: 'in_progress'
      };
      this.generationSessions.set(generationId, session);
      this.logInteraction({ type: 'generation_started', generationId, userId, timestamp: new Date() });

      // Analyze user context
      const userContext = await this._analyzeUserContext(userId);
      this.logInteraction({ type: 'context_analyzed', userId, context: userContext });

      // Generate curriculum options
      const options = await this._generateCurriculumOptions(userContext, preferences);
      this.logInteraction({ type: 'options_generated', userId, optionCount: options.length });

      // Select best option based on AI insights
      const selectedCurriculum = this._selectBestCurriculum(options, userContext, preferences);
      this.logInteraction({ type: 'curriculum_selected', userId, selectedOption: selectedCurriculum.title });

      // Personalize further
      const personalizedCurriculum = await this._personalizeCurriculum(selectedCurriculum, userContext);
      this.logInteraction({ type: 'curriculum_personalized', userId });

      // Save production
      const production: ProductionData = {
        generationId,
        userContext,
        curriculumOptions: options,
        selectedCurriculum: personalizedCurriculum,
        aiInsights: {
          confidenceScore: this._calculateConfidence(userContext),
          recommendationReason: this._generateRecommendationReason(selectedCurriculum),
          adaptationSuggestions: this._generateAdaptationSuggestions(personalizedCurriculum)
        },
        interactionLog: [...this.interactionLog],
        createdAt: new Date(),
        savedAt: new Date()
      };

      this.productionStore.set(generationId, production);
      this.logInteraction({ type: 'production_saved', generationId, productionSize: JSON.stringify(production).length });

      // Complete session
      session.status = 'completed';
      session.completedAt = new Date();
      session.productionId = Date.now();

      return {
        success: true,
        curriculum: personalizedCurriculum,
        generationId,
        message: 'Curriculum generated successfully'
      };
    } catch (error) {
      const session = this.generationSessions.get(generationId);
      if (session) {
        session.status = 'failed';
        session.completedAt = new Date();
      }
      this.logInteraction({ type: 'generation_failed', generationId, error: String(error) });

      return {
        success: false,
        message: `Curriculum generation failed: ${error}`
      };
    }
  }

  /**
   * Analyze user's learning context
   */
  private async _analyzeUserContext(userId: number): Promise<UserContext> {
    try {
      // Get enrolled courses
      const enrolled = await db
        .select()
        .from(userCourses)
        .where(eq(userCourses.userId, userId));

      const enrolledCourseIds = enrolled.map(e => e.courseId);
      const enrolledCourses = await db
        .select()
        .from(courses)
        .where(sql`${courses.id} = ANY(${enrolledCourseIds})`);

      // Get completed courses
      const completed = enrolled.filter(e => e.completed);
      const completedCourses = enrolledCourses.filter(c => completed.some(e => e.courseId === c.id));

      // Determine skill level
      const skillLevel = this._determineSkillLevel(enrolledCourses, completed.length);

      return {
        userId,
        enrolledCourses: enrolledCourses as any[],
        completedCourses: completedCourses as any[],
        learningStyle: 'mixed', // Can be extended with user preferences
        skillLevel,
        availableHours: 20, // Default, can come from user settings
        goals: [] // Can be extended with user goals
      };
    } catch (error) {
      console.error('Error analyzing user context:', error);
      return {
        userId,
        enrolledCourses: [],
        completedCourses: [],
        learningStyle: 'mixed',
        skillLevel: 'beginner',
        availableHours: 20,
        goals: []
      };
    }
  }

  /**
   * Generate multiple curriculum options
   */
  private async _generateCurriculumOptions(
    userContext: UserContext,
    preferences?: any
  ): Promise<CurriculumOption[]> {
    const options: CurriculumOption[] = [];

    try {
      // Option 1: Progressive difficulty based on enrolled courses
      const progressiveOption = await this._generateProgressiveCurriculum(userContext);
      options.push(progressiveOption);

      // Option 2: Focused skill development
      const focusedOption = await this._generateFocusedCurriculum(userContext, preferences);
      options.push(focusedOption);

      // Option 3: Accelerated learning path
      const acceleratedOption = await this._generateAcceleratedCurriculum(userContext);
      options.push(acceleratedOption);

      return options;
    } catch (error) {
      console.error('Error generating curriculum options:', error);
      return [];
    }
  }

  /**
   * Generate progressive curriculum (gradual advancement)
   */
  private async _generateProgressiveCurriculum(userContext: UserContext): Promise<CurriculumOption> {
    const orderedCourses = [...userContext.enrolledCourses].sort((a, b) => {
      const levelOrder: Record<string, number> = { 'Beginner': 1, 'Intermediate': 2, 'Advanced': 3 };
      return (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0);
    });

    return {
      courses: orderedCourses,
      estimatedDuration: orderedCourses.length * 40, // Estimate 40 hours per course
      difficulty: 'progressive',
      reason: 'Gradual advancement from beginner to advanced content'
    };
  }

  /**
   * Generate focused curriculum (concentrated on specific areas)
   */
  private async _generateFocusedCurriculum(userContext: UserContext, preferences?: any): Promise<CurriculumOption> {
    let focusedCourses = [...userContext.enrolledCourses];

    // Filter by focus areas if provided
    if (preferences?.focusAreas?.length) {
      focusedCourses = focusedCourses.filter(c => 
        preferences.focusAreas.some((area: string) => c.titleEn?.toLowerCase().includes(area.toLowerCase()))
      );
    }

    // Prioritize incomplete courses
    const sorted = focusedCourses.sort((a, b) => {
      const aProgress = a.progress || 0;
      const bProgress = b.progress || 0;
      return bProgress - aProgress; // Put lower progress courses first
    });

    return {
      courses: sorted.slice(0, Math.min(sorted.length, 5)),
      estimatedDuration: Math.min(sorted.length, 5) * 30,
      difficulty: 'focused',
      reason: 'Concentrated learning path focusing on specific skill areas'
    };
  }

  /**
   * Generate accelerated curriculum (faster paced)
   */
  private async _generateAcceleratedCurriculum(userContext: UserContext): Promise<CurriculumOption> {
    const highValue = userContext.enrolledCourses
      .filter(c => c.rating && c.rating >= 4)
      .slice(0, 8);

    return {
      courses: highValue.length > 0 ? highValue : userContext.enrolledCourses.slice(0, 8),
      estimatedDuration: Math.min(highValue.length, 8) * 25,
      difficulty: 'accelerated',
      reason: 'Fast-paced learning using high-rated courses'
    };
  }

  /**
   * Select the best curriculum option
   */
  private _selectBestCurriculum(
    options: CurriculumOption[],
    userContext: UserContext,
    preferences?: any
  ): PersonalizedCurriculum {
    // Score each option
    let bestOption = options[0];
    let bestScore = -1;

    for (const option of options) {
      let score = 0;

      // Prefer courses matching user's available hours
      if (option.estimatedDuration <= userContext.availableHours * 4) {
        score += 10;
      }

      // Prefer progressive for beginners
      if (userContext.skillLevel === 'beginner' && option.difficulty === 'progressive') {
        score += 8;
      }

      // Prefer focused if specified
      if (preferences?.focusAreas && option.difficulty === 'focused') {
        score += 8;
      }

      // Prefer accelerated for advanced users
      if (userContext.skillLevel === 'advanced' && option.difficulty === 'accelerated') {
        score += 8;
      }

      if (score > bestScore) {
        bestScore = score;
        bestOption = option;
      }
    }

    return this._convertOptionToCurriculum(bestOption);
  }

  /**
   * Personalize curriculum with additional details
   */
  private async _personalizeCurriculum(
    curriculum: PersonalizedCurriculum,
    userContext: UserContext
  ): Promise<PersonalizedCurriculum> {
    // Generate milestones
    const milestones = this._generateMilestones(curriculum.courses);

    // Enhance with skills and learning outcomes
    const skills = this._extractSkills(curriculum.courses);

    return {
      ...curriculum,
      milestones,
      skills,
      aiConfidence: this._calculateConfidence(userContext),
      generationMethod: 'ai_personalized'
    };
  }

  /**
   * Generate course milestones
   */
  private _generateMilestones(courses: any[]): any[] {
    return courses.map((course, index) => ({
      id: `milestone_${index + 1}`,
      title: `Complete ${course.titleEn || 'Course'}`,
      dueDate: new Date(Date.now() + (index + 1) * 30 * 24 * 60 * 60 * 1000),
      type: 'course_completion',
      order: index + 1
    }));
  }

  /**
   * Extract skills from courses
   */
  private _extractSkills(courses: any[]): any[] {
    const skillsSet = new Set<string>();

    // Common skills extracted from course content
    const skillMappings: Record<string, string[]> = {
      'mathematics': ['Problem Solving', 'Analytical Thinking', 'Quantitative Reasoning'],
      'programming': ['Coding', 'Debugging', 'Algorithm Design', 'Data Structures'],
      'english': ['Communication', 'Writing', 'Critical Reading', 'Vocabulary'],
      'science': ['Scientific Method', 'Research', 'Analysis', 'Experimental Design']
    };

    courses.forEach(course => {
      const title = (course.titleEn || '').toLowerCase();
      Object.entries(skillMappings).forEach(([key, skills]) => {
        if (title.includes(key)) {
          skills.forEach(s => skillsSet.add(s));
        }
      });
    });

    return Array.from(skillsSet).map((skill, i) => ({
      id: i + 1,
      name: skill,
      level: 'beginner',
      targetLevel: 'intermediate'
    }));
  }

  /**
   * Convert curriculum option to full curriculum object
   */
  private _convertOptionToCurriculum(option: CurriculumOption): PersonalizedCurriculum {
    return {
      title: `Personalized ${option.difficulty} Learning Path`,
      description: option.reason,
      courses: option.courses,
      skills: [],
      estimatedDuration: option.estimatedDuration,
      milestones: [],
      aiConfidence: 0.85,
      generationMethod: 'ai_engine'
    };
  }

  /**
   * Determine user's skill level based on courses
   */
  private _determineSkillLevel(courses: any[], completedCount: number): string {
    if (completedCount >= 10) return 'advanced';
    if (completedCount >= 5) return 'intermediate';
    return 'beginner';
  }

  /**
   * Calculate AI confidence score
   */
  private _calculateConfidence(userContext: UserContext): number {
    let confidence = 0.5;

    if (userContext.enrolledCourses.length >= 5) confidence += 0.15;
    if (userContext.completedCourses.length >= 3) confidence += 0.15;
    if (userContext.skillLevel !== 'beginner') confidence += 0.1;

    return Math.min(confidence, 0.95);
  }

  /**
   * Generate recommendation reason
   */
  private _generateRecommendationReason(curriculum: PersonalizedCurriculum): string {
    return `Based on your ${curriculum.courses.length} enrolled courses and learning preferences, this personalized path will help you master essential skills in approximately ${curriculum.estimatedDuration} hours.`;
  }

  /**
   * Generate adaptation suggestions
   */
  private _generateAdaptationSuggestions(curriculum: PersonalizedCurriculum): string[] {
    return [
      'Take breaks every 25-30 minutes (Pomodoro technique)',
      'Review previous material weekly to reinforce learning',
      'Practice with real-world projects for hands-on experience',
      'Join study groups for collaborative learning',
      'Track your progress weekly and adjust pace as needed'
    ];
  }

  /**
   * Log interaction for later analysis
   */
  private logInteraction(data: any): void {
    this.interactionLog.push({
      ...data,
      timestamp: new Date().toISOString()
    });

    // Keep log size manageable
    if (this.interactionLog.length > 1000) {
      this.interactionLog = this.interactionLog.slice(-500);
    }
  }

  /**
   * Get production data for analysis
   */
  getProductionData(generationId: string): ProductionData | undefined {
    return this.productionStore.get(generationId);
  }

  /**
   * Get all production IDs for a user
   */
  getProductions(userId: number): string[] {
    const userProductions: string[] = [];
    this.productionStore.forEach((production, generationId) => {
      if (production.userContext.userId === userId) {
        userProductions.push(generationId);
      }
    });
    return userProductions;
  }

  /**
   * Get generation session
   */
  getGenerationSession(generationId: string): GenerationSession | undefined {
    return this.generationSessions.get(generationId);
  }

  /**
   * Export interaction log for analytics
   */
  exportInteractionLog(): any[] {
    return [...this.interactionLog];
  }
}

// Singleton instance
export const curriculumAIEngine = new CurriculumAIEngine();
