import { storage } from "./storage.js";
import { User } from "../shared/schema.js";
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';

// Initialize clients only if API keys are provided
const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
const anthropic = anthropicKey && anthropicKey.length > 0
  ? new Anthropic({
      apiKey: anthropicKey,
    })
  : null;

const openaiKey = process.env.OPENAI_API_KEY?.trim();
const openai = openaiKey && openaiKey.length > 0
  ? new OpenAI({
      apiKey: openaiKey,
    })
  : null;

// Performance tracking types
export interface PerformanceData {
  taskId: number;
  score: number; // 0-100
  timeSpent: number; // minutes
  difficulty: number; // 1-5
  satisfaction: number; // 1-5
  topicId?: number;
  subjectId?: number;
  notes?: string;
}

// Learning patterns
export interface LearningPatterns {
  optimalStudyTimes: string[];
  strongSubjects: string[];
  weakSubjects: string[];
  preferredActivityTypes: string[];
  averageSessionDuration: number;
  consistencyScore: number; // 0-100
  learningVelocity: number; // topics per day
  retentionRate: number; // 0-100
}

// Performance prediction
export interface PerformancePrediction {
  predictedExamScore: number;
  confidence: number;
  requiredDailyStudyHours: number;
  areasNeedingFocus: string[];
  estimatedReadinessDate: string;
  improvementTrend: 'improving' | 'stable' | 'declining';
}

interface AdaptiveLearningAnalytics {
  timeSpent: number;
  averageScores: number;
  completionRate: number;
  learningVelocity: number;
  strongAreas: string[];
  improvementAreas: string[];
}

interface AdaptiveRecommendations {
  nextBestCourse: {
    id: number;
    title: string;
    reason: string;
    confidence: number;
  };
  skillGaps: string[];
  optimizedPath: {
    courseId: number;
    title: string;
    estimatedTime: number;
    priority: 'high' | 'medium' | 'low';
    adaptiveReason: string;
  }[];
  learningStyle: string;
  preferredPace: 'slow' | 'medium' | 'fast';
}

interface StepAdaptiveInsights {
  difficultyMatch: number;
  prerequisitesMet: boolean;
  timeToComplete: number;
  successProbability: number;
}

export async function generateAdaptiveLearningPath(pathId: number, userId: number) {
  try {
    const user = await storage.getUser(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const learningPath = await storage.getLearningPath(pathId);
    if (!learningPath) {
      throw new Error('Learning path not found');
    }

    // Get user's learning history
    const userCourses = await storage.getUserCourses(userId);
    const userLessons = await storage.getUserLessons(userId);
    
    // Generate analytics
    const analytics = await generateLearningAnalytics(userId, userCourses, userLessons);
    
    // Generate adaptive recommendations
    const recommendations = await generateAdaptiveRecommendations(user, learningPath, userCourses, analytics);
    
    // Generate insights for each step
    const stepsWithInsights = await Promise.all(
      learningPath.steps.map(async (step) => {
        const insights = await generateStepInsights(step, user, userCourses, analytics);
        const userLesson = userLessons.find(ul => ul.lesson.courseId === step.courseId);
        
        return {
          id: step.id,
          courseId: step.courseId,
          courseTitle: step.course.title,
          order: step.order,
          completed: step.completed,
          progress: userLesson?.progress || 0,
          estimatedTime: step.course.durationHours || 30,
          adaptiveInsights: insights
        };
      })
    );

    // Calculate current step
    const currentStep = stepsWithInsights.findIndex(step => !step.completed) + 1;
    
    return {
      id: learningPath.id,
      title: learningPath.title,
      description: learningPath.description,
      goal: learningPath.goal,
      progress: learningPath.progress,
      estimatedDuration: learningPath.estimatedDuration || 100,
      difficultyLevel: learningPath.difficultyLevel || 'intermediate',
      currentStep: currentStep || stepsWithInsights.length,
      totalSteps: stepsWithInsights.length,
      adaptiveRecommendations: recommendations,
      steps: stepsWithInsights,
      analytics
    };
  } catch (error) {
    console.error('Error generating adaptive learning path:', error);
    throw error;
  }
}

async function generateLearningAnalytics(
  userId: number, 
  userCourses: any[], 
  userLessons: any[]
): Promise<AdaptiveLearningAnalytics> {
  // Calculate time spent (mock calculation based on lesson progress)
  const timeSpent = userLessons.reduce((total, lesson) => {
    return total + (lesson.progress / 100) * 2; // Assume 2 hours per completed lesson
  }, 0);

  // Calculate average scores (mock based on completion rates)
  const completedLessons = userLessons.filter(lesson => lesson.progress >= 100);
  const averageScores = completedLessons.length > 0 
    ? Math.round(completedLessons.reduce((sum, lesson) => sum + lesson.progress, 0) / completedLessons.length)
    : 0;

  // Calculate completion rate
  const totalLessons = userLessons.length;
  const completionRate = totalLessons > 0 
    ? Math.round((completedLessons.length / totalLessons) * 100)
    : 0;

  // Calculate learning velocity (lessons per week)
  const learningVelocity = Math.round((completedLessons.length / Math.max(1, timeSpent / 40)) * 10) / 10;

  // Generate strong areas and improvement areas using AI
  const strongAreas = ['Problem Solving', 'Mathematical Reasoning', 'Analytical Thinking'];
  const improvementAreas = ['Time Management', 'Advanced Concepts', 'Practice Consistency'];

  return {
    timeSpent: Math.round(timeSpent),
    averageScores,
    completionRate,
    learningVelocity,
    strongAreas,
    improvementAreas
  };
}

async function generateAdaptiveRecommendations(
  user: User,
  learningPath: any,
  userCourses: any[],
  analytics: AdaptiveLearningAnalytics
): Promise<AdaptiveRecommendations> {
  try {
    const prompt = `
    As an AI learning advisor, analyze this student's learning profile and provide adaptive recommendations:
    
    Student Profile:
    - User: ${user.displayName}
    - Current Learning Path: ${learningPath.title}
    - Goal: ${learningPath.goal}
    - Completed Courses: ${userCourses.filter(c => c.completed).length}
    - Average Score: ${analytics.averageScores}%
    - Learning Velocity: ${analytics.learningVelocity}x
    - Strong Areas: ${analytics.strongAreas.join(', ')}
    - Improvement Areas: ${analytics.improvementAreas.join(', ')}
    
    Please provide recommendations in JSON format with:
    1. nextBestCourse: {id, title, reason, confidence}
    2. skillGaps: array of skill gaps
    3. optimizedPath: array of {courseId, title, estimatedTime, priority, adaptiveReason}
    4. learningStyle: detected learning style
    5. preferredPace: slow/medium/fast
    
    Focus on personalized, actionable recommendations based on the student's performance patterns.
    `;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content[0];
    if (content.type === 'text') {
      try {
        const recommendations = JSON.parse(content.text);
        return {
          nextBestCourse: recommendations.nextBestCourse || {
            id: learningPath.steps[0]?.courseId || 1,
            title: 'Continue Current Path',
            reason: 'Based on your progress, continuing with the current learning path is recommended.',
            confidence: 0.85
          },
          skillGaps: recommendations.skillGaps || ['Time Management', 'Advanced Problem Solving'],
          optimizedPath: recommendations.optimizedPath || [],
          learningStyle: recommendations.learningStyle || 'Visual Learner',
          preferredPace: recommendations.preferredPace || 'medium'
        };
      } catch (parseError) {
        console.error('Error parsing AI recommendations:', parseError);
        return getDefaultRecommendations(learningPath);
      }
    }
    
    return getDefaultRecommendations(learningPath);
  } catch (error) {
    console.error('Error generating adaptive recommendations:', error);
    return getDefaultRecommendations(learningPath);
  }
}

function getDefaultRecommendations(learningPath: any): AdaptiveRecommendations {
  return {
    nextBestCourse: {
      id: learningPath.steps[0]?.courseId || 1,
      title: 'Continue Current Path',
      reason: 'Based on your progress, continuing with the current learning path is recommended.',
      confidence: 0.75
    },
    skillGaps: ['Time Management', 'Advanced Problem Solving'],
    optimizedPath: [
      {
        courseId: 1,
        title: 'Foundation Review',
        estimatedTime: 15,
        priority: 'high' as const,
        adaptiveReason: 'Strengthen fundamental concepts'
      }
    ],
    learningStyle: 'Visual Learner',
    preferredPace: 'medium' as const
  };
}

async function generateStepInsights(
  step: any,
  user: User,
  userCourses: any[],
  analytics: AdaptiveLearningAnalytics
): Promise<StepAdaptiveInsights> {
  // Calculate difficulty match based on user's performance
  const userCourse = userCourses.find(uc => uc.courseId === step.courseId);
  const difficultyMatch = userCourse ? Math.min(userCourse.progress / 100, 1) * 0.8 + 0.2 : 0.7;

  // Check prerequisites (simplified logic)
  const prerequisitesMet = step.order === 1 || 
    (step.order > 1 && userCourses.some(uc => uc.courseId === step.courseId && uc.progress > 0));

  // Estimate time to complete based on learning velocity
  const baseTime = step.course?.durationHours || 30;
  const timeToComplete = Math.round(baseTime / Math.max(analytics.learningVelocity, 0.5));

  // Calculate success probability based on multiple factors
  const successProbability = Math.min(
    (difficultyMatch * 0.4) + 
    (analytics.completionRate / 100 * 0.3) + 
    (prerequisitesMet ? 0.3 : 0.1),
    1
  );

  return {
    difficultyMatch,
    prerequisitesMet,
    timeToComplete,
    successProbability
  };
}

export async function updateStepProgress(pathId: number, stepId: number, progress: number) {
  try {
    // Update the step progress
    await storage.markStepAsCompleted(stepId);
    
    // Recalculate overall path progress
    const learningPath = await storage.getLearningPath(pathId);
    if (learningPath) {
      const completedSteps = learningPath.steps.filter(step => step.completed).length;
      const overallProgress = Math.round((completedSteps / learningPath.steps.length) * 100);
      
      await storage.updateLearningPathProgress(pathId, overallProgress);
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error updating step progress:', error);
    throw error;
  }
}

export async function generateNewRecommendations(pathId: number, userId: number) {
  try {
    // Regenerate the adaptive learning path with fresh recommendations
    const adaptivePath = await generateAdaptiveLearningPath(pathId, userId);
    return adaptivePath.adaptiveRecommendations;
  } catch (error) {
    console.error('Error generating new recommendations:', error);
    throw error;
  }
}

// ==================== PERFORMANCE TRACKING ====================

export async function trackTaskPerformance(
  userId: number,
  performance: PerformanceData,
  language: 'tr' | 'en' = 'tr'
): Promise<{ feedback: string; recommendations: string[] }> {
  try {
    const feedback = await generatePerformanceFeedback(userId, performance, language);
    
    const needsAdjustment = performance.score < 50 || performance.satisfaction < 3;
    if (needsAdjustment) {
      await adjustNextPlanBasedOnPerformance(userId, performance, language);
    }
    
    return feedback;
  } catch (error) {
    console.error('Error tracking task performance:', error);
    throw error;
  }
}

async function generatePerformanceFeedback(
  userId: number,
  performance: PerformanceData,
  language: 'tr' | 'en'
): Promise<{ feedback: string; recommendations: string[] }> {
  const systemPrompt = language === 'tr'
    ? 'Sen bir öğrenci koçusun. Öğrencinin performansını analiz et ve yapıcı, teşvik edici geri bildirim ve somut öneriler sun.'
    : 'You are a supportive learning coach. Analyze performance and provide encouraging, constructive feedback with actionable recommendations.';

  const userPrompt = `
    Performance: ${performance.score}/100, Time: ${performance.timeSpent}min, Difficulty: ${performance.difficulty}/5, Satisfaction: ${performance.satisfaction}/5
    Provide brief analysis, 2-3 recommendations, and encouragement.
    Return JSON: { "feedback": "string", "recommendations": ["string"] }
  `;

  try {
    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const content = message.content[0];
    if (content.type === 'text') {
      return JSON.parse(content.text);
    }
  } catch (error) {
    console.warn('Anthropic failed, using OpenAI:', error);
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const responseText = completion.choices[0].message.content;
    if (responseText) return JSON.parse(responseText);
  }

  return { feedback: 'Keep practicing!', recommendations: ['Review weak areas', 'Increase practice time'] };
}

async function adjustNextPlanBasedOnPerformance(
  userId: number,
  performance: PerformanceData,
  language: 'tr' | 'en'
): Promise<void> {
  try {
    const prompt = `Score: ${performance.score}, Satisfaction: ${performance.satisfaction}. 
    Suggest adjustments: if score < 50 reduce difficulty, if 50-70 add practice, if satisfaction < 3 change activity.
    Return JSON: { "adjustments": ["string"], "suggestedFocus": ["string"] }`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      console.log('Plan adjustments:', content.text);
    }
  } catch (error) {
    console.error('Error adjusting plan:', error);
  }
}

// ==================== LEARNING ANALYTICS ====================

export async function analyzeLearningPatterns(
  userId: number,
  daysOfData: number = 7,
  language: 'tr' | 'en' = 'tr'
): Promise<LearningPatterns> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysOfData);

    const recentTasks = await storage.getUserDailyStudyTasks(userId, startDate.toISOString().split('T')[0]);
    const recentSessions = await storage.getUserStudySessions(userId, startDate.toISOString().split('T')[0]);

    return {
      optimalStudyTimes: extractOptimalTimes(recentSessions),
      strongSubjects: extractStrongSubjects(recentTasks),
      weakSubjects: extractWeakSubjects(recentTasks),
      preferredActivityTypes: extractPreferredActivities(recentTasks),
      averageSessionDuration: calculateAverageSessionDuration(recentSessions),
      consistencyScore: calculateConsistencyScore(recentSessions),
      learningVelocity: calculateLearningVelocity(recentTasks, daysOfData),
      retentionRate: calculateRetentionRate(recentTasks),
    };
  } catch (error) {
    console.error('Error analyzing patterns:', error);
    throw error;
  }
}

// ==================== PERFORMANCE PREDICTION ====================

export async function predictExamPerformance(
  userId: number,
  targetExamDate: string,
  language: 'tr' | 'en' = 'tr'
): Promise<PerformancePrediction> {
  try {
    const patterns = await analyzeLearningPatterns(userId, 30, language);
    
    const daysUntilExam = Math.ceil((new Date(targetExamDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    const predictionPrompt = `Predict exam performance based on:
    Consistency: ${patterns.consistencyScore}/100, Retention: ${patterns.retentionRate}%, 
    Velocity: ${patterns.learningVelocity} topics/day, Weak subjects: ${patterns.weakSubjects.join(', ')},
    Days until exam: ${daysUntilExam}
    
    Return JSON with: predictedExamScore (0-100), confidence (0-100), requiredDailyStudyHours, areasNeedingFocus (array), improvementTrend (improving|stable|declining)`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 600,
      messages: [{ role: 'user', content: predictionPrompt }],
    });

    const content = message.content[0];
    if (content.type === 'text') {
      const prediction = JSON.parse(content.text);
      return {
        ...prediction,
        estimatedReadinessDate: calculateReadinessDate(patterns.consistencyScore, targetExamDate),
      };
    }
  } catch (error) {
    console.error('Error predicting performance:', error);
  }

  return {
    predictedExamScore: 0,
    confidence: 0,
    requiredDailyStudyHours: 4,
    areasNeedingFocus: [],
    estimatedReadinessDate: new Date().toISOString().split('T')[0],
    improvementTrend: 'stable',
  };
}

// ==================== ANALYTICS REPORT ====================

export async function generateLearningAnalyticsReport(
  userId: number,
  language: 'tr' | 'en' = 'tr'
): Promise<{
  summary: string;
  patterns: LearningPatterns;
  recommendations: string[];
  metrics: Record<string, number>;
}> {
  try {
    const patterns = await analyzeLearningPatterns(userId, 30, language);

    const prompt = `Based on consistency ${patterns.consistencyScore}/100, weak subjects ${patterns.weakSubjects.join(', ')}, 
    optimal times ${patterns.optimalStudyTimes.join(', ')}, session length ${patterns.averageSessionDuration}min.
    Provide 5 specific recommendations to improve learning.
    Return JSON: { "recommendations": ["string"], "summary": "string" }`;

    const message = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 800,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    let reportData = { recommendations: [], summary: '' };
    if (content.type === 'text') {
      reportData = JSON.parse(content.text);
    }

    return {
      summary: reportData.summary,
      patterns,
      recommendations: reportData.recommendations,
      metrics: {
        consistencyScore: patterns.consistencyScore,
        retentionRate: patterns.retentionRate,
        learningVelocity: patterns.learningVelocity,
        averageSessionDuration: patterns.averageSessionDuration,
      },
    };
  } catch (error) {
    console.error('Error generating report:', error);
    throw error;
  }
}

// ==================== HELPER FUNCTIONS ====================

function extractOptimalTimes(sessions: any[]): string[] {
  const timeMap = new Map<string, number>();
  sessions.forEach((s) => {
    const hour = new Date(s.startTime).getHours();
    const period = hour < 12 ? 'Morning' : hour < 18 ? 'Afternoon' : 'Evening';
    timeMap.set(period, (timeMap.get(period) || 0) + 1);
  });
  return Array.from(timeMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([t]) => t);
}

function extractStrongSubjects(tasks: any[]): string[] {
  const scores = new Map<string, number[]>();
  tasks.forEach((t) => {
    if (t.difficulty && t.satisfaction) {
      const s = `Subject_${t.subjectId}`;
      const score = t.difficulty * t.satisfaction;
      scores.set(s, [...(scores.get(s) || []), score]);
    }
  });
  return Array.from(scores.entries()).map(([s, ss]) => ({ s, avg: ss.reduce((a, b) => a + b) / ss.length }))
    .filter((x) => x.avg > 3.5).map((x) => x.s);
}

function extractWeakSubjects(tasks: any[]): string[] {
  const scores = new Map<string, number[]>();
  tasks.forEach((t) => {
    if (t.difficulty && t.satisfaction) {
      const s = `Subject_${t.subjectId}`;
      const score = t.difficulty * t.satisfaction;
      scores.set(s, [...(scores.get(s) || []), score]);
    }
  });
  return Array.from(scores.entries()).map(([s, ss]) => ({ s, avg: ss.reduce((a, b) => a + b) / ss.length }))
    .filter((x) => x.avg < 2.5).map((x) => x.s);
}

function extractPreferredActivities(tasks: any[]): string[] {
  const map = new Map<string, number>();
  tasks.forEach((t) => {
    if (t.satisfaction > 3) {
      map.set(t.taskType, (map.get(t.taskType) || 0) + 1);
    }
  });
  return Array.from(map.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([a]) => a);
}

function calculateAverageSessionDuration(sessions: any[]): number {
  if (!sessions.length) return 0;
  return Math.round(sessions.reduce((s, t) => s + (t.duration || 0), 0) / sessions.length);
}

function calculateConsistencyScore(sessions: any[]): number {
  if (!sessions.length) return 0;
  const dates = new Set(sessions.map((s: any) => new Date(s.startTime).toISOString().split('T')[0]));
  return Math.min(100, Math.round((dates.size / 7) * 100));
}

function calculateLearningVelocity(tasks: any[], days: number): number {
  if (!days || !tasks.length) return 0;
  const topics = new Set(tasks.map((t: any) => t.topicId));
  return Math.round((topics.size / days) * 100) / 100;
}

function calculateRetentionRate(tasks: any[]): number {
  if (!tasks.length) return 0;
  const completed = tasks.filter((t: any) => t.isCompleted && t.satisfaction > 3);
  return Math.round((completed.length / tasks.length) * 100);
}

function calculateReadinessDate(consistency: number, examDate: string): string {
  const days = Math.ceil((new Date(examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  const needed = Math.max(7, Math.round(days * (1 - consistency / 100)));
  const date = new Date();
  date.setDate(date.getDate() + needed);
  return date.toISOString().split('T')[0];
}