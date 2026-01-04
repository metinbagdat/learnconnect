import { Anthropic } from '@anthropic-ai/sdk';
import { getTopicsByCriteria } from '../../shared/bilingual-topics.js';
import { logger } from '../utils/logger.js';

// API key guard - fail early if missing
const anthropicApiKey = process.env.ANTHROPIC_API_KEY?.trim();
if (!anthropicApiKey || anthropicApiKey.length === 0) {
  logger.error('ANTHROPIC_API_KEY is required but not set', undefined, {
    module: 'AIReasoningEngine',
    action: 'initialization'
  });
  throw new Error('ANTHROPIC_API_KEY is required but not set in environment variables');
}

// Model name from environment variable - NO DEFAULT, fail if missing
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL?.trim();
if (!ANTHROPIC_MODEL || ANTHROPIC_MODEL.length === 0) {
  logger.error('ANTHROPIC_MODEL is required but not set', undefined, {
    module: 'AIReasoningEngine',
    action: 'initialization'
  });
  throw new Error('ANTHROPIC_MODEL is required but not set in environment variables');
}

// Initialize Anthropic client
const anthropic = new Anthropic({
  apiKey: anthropicApiKey,
});

export class AIReasoningEngine {
  async generateAdaptiveDailyPlan(studentId: number, studentData: any, progressData: any) {
    try {
      logger.info('Starting adaptive planning', {
        module: 'AIReasoningEngine',
        action: 'generateAdaptiveDailyPlan',
        studentId
      });
      
      const contextAnalysis = await this.analyzeContext(studentData, progressData);
      const weaknessAnalysis = await this.assessWeaknesses(progressData);
      const contentSelection = await this.selectContent(weaknessAnalysis, studentData);
      const timeAllocation = await this.allocateTime(contentSelection, studentData);
      const dailyPlan = await this.generatePlan(timeAllocation, studentData);
      
      dailyPlan.metadata = {
        generatedAt: new Date().toISOString(),
        studentId: studentId,
        adaptiveParameters: {
          difficultyLevel: contextAnalysis.recommendedDifficulty,
          learningPace: contextAnalysis.optimalPace,
          focusAreas: weaknessAnalysis.highPriorityAreas
        }
      };
      
      logger.info('Adaptive plan generated successfully', {
        module: 'AIReasoningEngine',
        action: 'generateAdaptiveDailyPlan',
        studentId,
        planDate: dailyPlan.date
      });
      
      return dailyPlan;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error('Error in adaptive planning pipeline', error instanceof Error ? error : new Error(errorMessage), {
        module: 'AIReasoningEngine',
        action: 'generateAdaptiveDailyPlan',
        studentId
      });
      return this.generateFallbackPlan(studentData);
    }
  }

  private async analyzeContext(studentData: any, progressData: any) {
    const prompt = `
      Analyze student profile:
      - Daily study hours: ${studentData.studySettings?.dailyStudyHours || 2}
      - Target score: ${studentData.examPreferences?.tytTargetScore || 300}
      
      Return JSON with: studentLevel, optimalPace, studyPatterns, recommendedDifficulty
    `;

    try {
      const response = await anthropic.messages.create({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        messages: [{ role: "user", content: prompt }]
      });

      const content = response.content[0];
      if (content.type !== 'text') {
        throw new Error(`Invalid response type: ${content.type}`);
      }
      
      try {
        return JSON.parse(content.text);
      } catch (parseError) {
        logger.error('Failed to parse AI response as JSON', parseError instanceof Error ? parseError : new Error(String(parseError)), {
          module: 'AIReasoningEngine',
          action: 'analyzeContext'
        });
        throw new Error('Invalid JSON response from AI');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.warn('Context analysis failed, using fallback', {
        module: 'AIReasoningEngine',
        action: 'analyzeContext',
        error: errorMessage
      });
      return {
        studentLevel: 'intermediate',
        optimalPace: 'moderate',
        recommendedDifficulty: 'medium',
        studyPatterns: {}
      };
    }
  }

  private async assessWeaknesses(progressData: any) {
    return {
      prioritizedTopics: getTopicsByCriteria({ difficulty: 'medium' }).slice(0, 5),
      highPriorityAreas: ['mathematics', 'turkish'],
      improvementPotential: progressData?.weak_topics || []
    };
  }

  private async selectContent(weaknessAnalysis: any, studentData: any) {
    return {
      selectedTopics: weaknessAnalysis.prioritizedTopics,
      learningObjectives: ['Master core concepts', 'Practice problem solving', 'Review key topics']
    };
  }

  private async allocateTime(contentSelection: any, studentData: any) {
    const totalMinutes = (studentData.studySettings?.dailyStudyHours || 2) * 60;
    const topicCount = contentSelection.selectedTopics.length;
    const timePerTopic = Math.floor(totalMinutes / Math.max(topicCount, 1));

    return {
      topics: contentSelection.selectedTopics.map((topic: any) => ({
        id: topic.id,
        name: topic.name_tr,
        allocatedTime: timePerTopic,
        difficultyLevel: topic.difficulty,
        objectives: topic.learningObjectives
      })),
      totalTime: totalMinutes,
      breakSchedule: this.generateBreaks(totalMinutes)
    };
  }

  private async generatePlan(timeAllocation: any, studentData: any) {
    return {
      date: new Date().toISOString().split('T')[0],
      topics: timeAllocation.topics,
      learningObjectives: ['Progress towards exam target', 'Build proficiency in weak areas'],
      adaptiveParameters: {
        adjustDifficultyBased: 'performance',
        trackEngagement: true,
        allowBreaks: true
      },
      estimatedCompletion: timeAllocation.totalTime
    };
  }

  private generateBreaks(totalMinutes: number): any {
    const breaks = [];
    const sessionLength = 45;
    let currentTime = 0;

    while (currentTime < totalMinutes) {
      currentTime += sessionLength;
      if (currentTime < totalMinutes) {
        breaks.push({
          startTime: currentTime,
          duration: 5,
          type: 'short_break'
        });
      }
    }

    return breaks;
  }

  private generateFallbackPlan(studentData: any) {
    return {
      date: new Date().toISOString().split('T')[0],
      topics: [
        {
          id: 'math-core-1',
          name: 'Matematik - Temel Kavramlar',
          allocatedTime: 60,
          difficultyLevel: 'medium',
          objectives: ['Review basics', 'Practice problems']
        },
        {
          id: 'turkish-grammar-1',
          name: 'Türkçe - Sözcükte Anlam',
          allocatedTime: 60,
          difficultyLevel: 'medium',
          objectives: ['Vocabulary review', 'Comprehension practice']
        }
      ],
      isFallback: true,
      note: 'Auto-generated fallback plan'
    };
  }
}

export const aiReasoningEngine = new AIReasoningEngine();

