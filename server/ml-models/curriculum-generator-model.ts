// Step 7.1: Curriculum Generator ML Model

import {
  CurriculumFeatureExtractor,
  UserContext as FEUserContext,
  CourseSelection as FECourseSelection,
  ExtractedFeatures,
} from "./curriculum-feature-extractor.js";
import {
  CurriculumOptimizer,
  CurriculumOption,
  UserContext as OptUserContext,
} from "./curriculum-optimizer.js";

export interface Constraint {
  maxDurationHours?: number;
  minDifficulty?: number;
  maxDifficulty?: number;
  flexible?: boolean;
  skipCourses?: number[];
}

export interface GeneratedCurriculum extends CurriculumOption {
  reasoning: string[];
  confidenceScore: number;
}

export interface CurriculumGenerationResult {
  options: GeneratedCurriculum[];
  confidenceScores: number[];
  aiReasoning: Array<{
    curriculumId: string;
    keyFactors: string[];
    strengths: string[];
    considerations: string[];
    expectedOutcomes: string[];
  }>;
  comparisonMetrics: Record<string, any>;
  modelMetadata: {
    modelVersion: string;
    generatedAt: number;
    processingTimeMs: number;
  };
}

export class CurriculumGeneratorModel {
  private featureExtractor: CurriculumFeatureExtractor;
  private optimizer: CurriculumOptimizer;
  private modelVersion = "v1.0";

  constructor() {
    this.featureExtractor = new CurriculumFeatureExtractor();
    this.optimizer = new CurriculumOptimizer();
  }

  /**
   * Generate multiple curriculum options using ML model
   */
  generateCurriculumOptions(
    userContext: FEUserContext,
    courseSelections: FECourseSelection[],
    constraints: Constraint
  ): CurriculumGenerationResult {
    const startTime = Date.now();

    // Extract features for ML model
    const features = this.featureExtractor.extractFeatures(
      userContext,
      courseSelections,
      constraints
    );

    // Generate curriculum options (simulate ML model inference)
    const curriculumOptions = this.generateOptions(
      features,
      courseSelections,
      constraints
    );

    // Optimize each option
    const optimizedOptions: GeneratedCurriculum[] = [];
    for (const option of curriculumOptions) {
      const optimized = this.optimizer.optimizeCurriculum(
        option,
        userContext as OptUserContext
      );
      const reasoning = this.optimizer.generateOptimizationReasoning(
        option,
        optimized,
        userContext as OptUserContext
      );

      optimizedOptions.push({
        ...optimized,
        reasoning,
        confidenceScore: this.calculateConfidenceScore(optimized, features),
      });
    }

    // Sort by confidence score
    optimizedOptions.sort((a, b) => b.confidenceScore - a.confidenceScore);

    // Generate AI reasoning for each option
    const aiReasoning = this.generateAIReasoning(
      optimizedOptions,
      userContext,
      features
    );

    // Calculate comparison metrics
    const comparisonMetrics = this.calculateComparisonMetrics(optimizedOptions);

    const processingTime = Date.now() - startTime;

    return {
      options: optimizedOptions,
      confidenceScores: optimizedOptions.map((o) => o.confidenceScore),
      aiReasoning,
      comparisonMetrics,
      modelMetadata: {
        modelVersion: this.modelVersion,
        generatedAt: Date.now(),
        processingTimeMs: processingTime,
      },
    };
  }

  /**
   * Generate curriculum options based on features
   */
  private generateOptions(
    features: ExtractedFeatures,
    courseSelections: FECourseSelection[],
    constraints: Constraint
  ): CurriculumOption[] {
    const options: CurriculumOption[] = [];

    // Option 1: Aggressive (maximize learning, compressed timeline)
    options.push(
      this.createCurriculumOption(
        "aggressive",
        courseSelections,
        constraints,
        0.8
      )
    );

    // Option 2: Balanced (moderate pace, good retention)
    options.push(
      this.createCurriculumOption("balanced", courseSelections, constraints, 1.0)
    );

    // Option 3: Conservative (slow pace, high retention)
    options.push(
      this.createCurriculumOption(
        "conservative",
        courseSelections,
        constraints,
        1.2
      )
    );

    return options;
  }

  /**
   * Create a curriculum option with specific pace
   */
  private createCurriculumOption(
    id: string,
    courseSelections: FECourseSelection[],
    constraints: Constraint,
    paceMultiplier: number
  ): CurriculumOption {
    const courses = courseSelections.map((selection, index) => ({
      courseId: selection.courseId,
      order: index + 1,
      estimatedHours: 40 * paceMultiplier,
      rationale: `Selected course addressing goal ${index + 1} with ${selection.priority} priority`,
    }));

    const totalDuration = courses.reduce((sum, c) => sum + c.estimatedHours, 0);
    const estimatedDifficulty = 50; // Base difficulty

    return {
      id: `${id}-${Date.now()}`,
      courses,
      totalDuration,
      estimatedDifficulty,
      successProbability: 0.75,
      alignmentScore: 75,
    };
  }

  /**
   * Calculate confidence score for generated curriculum
   */
  private calculateConfidenceScore(
    option: CurriculumOption,
    features: ExtractedFeatures
  ): number {
    let score = 0.5; // Base confidence

    // Add confidence based on feature clarity
    const avgUserProfile = features.userProfile.reduce((a, b) => a + b, 0) / features.userProfile.length;
    score += avgUserProfile * 0.2;

    // Add confidence based on course selection clarity
    const avgCourseEmbedding = features.courseEmbeddings.reduce((a, b) => a + b, 0) / features.courseEmbeddings.length;
    score += avgCourseEmbedding * 0.15;

    // Add confidence based on success probability
    score += option.successProbability * 0.15;

    // Add confidence based on alignment
    score += (option.alignmentScore / 100) * 0.2;

    return Math.min(Math.max(score, 0.3), 0.99);
  }

  /**
   * Generate AI reasoning for recommendations
   */
  private generateAIReasoning(
    options: GeneratedCurriculum[],
    userContext: FEUserContext,
    features: ExtractedFeatures
  ) {
    return options.map((option) => ({
      curriculumId: option.id,
      keyFactors: this.identifyKeyFactors(option, userContext, features),
      strengths: this.identifyStrengths(option, userContext),
      considerations: this.identifyConsiderations(option, userContext),
      expectedOutcomes: this.predictOutcomes(option, userContext),
    }));
  }

  /**
   * Identify key factors influencing curriculum generation
   */
  private identifyKeyFactors(
    option: CurriculumOption,
    userContext: FEUserContext,
    features: ExtractedFeatures
  ): string[] {
    const factors: string[] = [];

    factors.push(`User proficiency level: ${userContext.proficiency}/100`);
    factors.push(`Available learning time: ${userContext.timeAvailable} hours/week`);
    factors.push(
      `Number of learning goals: ${userContext.currentGoals.length}`
    );
    factors.push(`Curriculum pace: ${(option.totalDuration / 120).toFixed(1)}x standard`);

    return factors;
  }

  /**
   * Identify strengths of curriculum option
   */
  private identifyStrengths(
    option: CurriculumOption,
    userContext: FEUserContext
  ): string[] {
    const strengths: string[] = [];

    if (option.successProbability > 0.8) {
      strengths.push("High success probability based on your profile");
    }

    if (option.alignmentScore > 80) {
      strengths.push("Excellent alignment with your stated goals");
    }

    if (option.courses.length <= 5) {
      strengths.push("Manageable course load for focused learning");
    }

    strengths.push("Optimized course sequence for progressive learning");

    return strengths;
  }

  /**
   * Identify considerations for curriculum option
   */
  private identifyConsiderations(
    option: CurriculumOption,
    userContext: FEUserContext
  ): string[] {
    const considerations: string[] = [];

    if (option.totalDuration > userContext.timeAvailable * 1.2) {
      considerations.push("Curriculum may require more time than initially available");
    }

    if (option.estimatedDifficulty > userContext.proficiency + 20) {
      considerations.push("Some courses may be challenging given your current level");
    }

    if (option.courses.length > 8) {
      considerations.push("Large number of courses - consider pacing carefully");
    }

    return considerations;
  }

  /**
   * Predict expected outcomes
   */
  private predictOutcomes(
    option: CurriculumOption,
    userContext: FEUserContext
  ): string[] {
    const outcomes: string[] = [];

    outcomes.push(
      `Estimated completion time: ${option.totalDuration.toFixed(1)} hours`
    );
    outcomes.push(
      `Projected proficiency gain: +${Math.round(option.courses.length * 8)} points`
    );
    outcomes.push(
      `Success probability: ${(option.successProbability * 100).toFixed(0)}%`
    );
    outcomes.push(
      `Goal coverage: ${Math.round((option.alignmentScore / 100) * userContext.currentGoals.length)} of ${userContext.currentGoals.length} goals`
    );

    return outcomes;
  }

  /**
   * Calculate comparison metrics between options
   */
  private calculateComparisonMetrics(options: GeneratedCurriculum[]) {
    return {
      bestSuccessProbability: Math.max(
        ...options.map((o) => o.successProbability)
      ),
      bestAlignmentScore: Math.max(...options.map((o) => o.alignmentScore)),
      fastestOption: Math.min(...options.map((o) => o.totalDuration)),
      slowestOption: Math.max(...options.map((o) => o.totalDuration)),
      avgConfidenceScore:
        options.reduce((sum, o) => sum + o.confidenceScore, 0) / options.length,
    };
  }
}
