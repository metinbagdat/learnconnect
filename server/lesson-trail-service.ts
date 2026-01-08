import Anthropic from '@anthropic-ai/sdk';
import { db } from './db.js';
import { 
  lessonTrails, 
  trailNodes, 
  userTrailProgress, 
  personalizedRecommendations,
  learningAnalytics,
  lessons,
  modules,
  courses,
  userCourses,
  userLevels,
  userAchievements
} from '../shared/schema.js';
import { eq, and, desc, asc, inArray, sql } from 'drizzle-orm';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface TrailNodeData {
  id: string;
  position: { x: number; y: number };
  type: 'lesson' | 'checkpoint' | 'bonus' | 'assessment';
  lessonId: number;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  prerequisites: string[];
  unlockConditions: {
    requiredNodes?: string[];
    minimumScore?: number;
    achievementRequired?: number;
  };
  hoverInfo: {
    summary: string;
    learningObjectives: string[];
    keyTopics: string[];
    tips: string[];
    resources: string[];
  };
  rewards: {
    xp: number;
    points: number;
    badges?: number[];
  };
  isOptional: boolean;
}

export interface LessonTrailData {
  nodes: TrailNodeData[];
  connections: Array<{
    from: string;
    to: string;
    type: 'prerequisite' | 'recommended' | 'optional';
  }>;
  metadata: {
    totalEstimatedTime: number;
    difficultyDistribution: Record<string, number>;
    skillProgression: string[];
  };
}

function mockTrail(): LessonTrailData {
  const nodes: TrailNodeData[] = [
    {
      id: 'n1',
      position: { x: 100, y: 100 },
      type: 'lesson',
      lessonId: 1,
      title: 'Foundations',
      description: 'Start with core concepts.',
      difficulty: 'easy',
      estimatedTime: 30,
      prerequisites: [],
      unlockConditions: {},
      hoverInfo: {
        summary: 'Key ideas and terminology',
        learningObjectives: ['Understand basics'],
        keyTopics: ['Intro'],
        tips: ['Skim once, then review'],
        resources: ['Notes']
      },
      rewards: { xp: 50, points: 50 },
      isOptional: false
    },
    {
      id: 'n2',
      position: { x: 260, y: 160 },
      type: 'lesson',
      lessonId: 2,
      title: 'Practice',
      description: 'Apply what you learned.',
      difficulty: 'medium',
      estimatedTime: 40,
      prerequisites: ['n1'],
      unlockConditions: { requiredNodes: ['n1'] },
      hoverInfo: {
        summary: 'Exercises and drills',
        learningObjectives: ['Apply basics'],
        keyTopics: ['Practice'],
        tips: ['Work through examples'],
        resources: ['Exercises']
      },
      rewards: { xp: 70, points: 70 },
      isOptional: false
    },
    {
      id: 'n3',
      position: { x: 420, y: 120 },
      type: 'checkpoint',
      lessonId: 3,
      title: 'Checkpoint',
      description: 'Quick review and quiz.',
      difficulty: 'medium',
      estimatedTime: 20,
      prerequisites: ['n2'],
      unlockConditions: { requiredNodes: ['n2'] },
      hoverInfo: {
        summary: 'Assess understanding',
        learningObjectives: ['Recall', 'Apply'],
        keyTopics: ['Review'],
        tips: ['Note gaps'],
        resources: ['Quiz']
      },
      rewards: { xp: 60, points: 60 },
      isOptional: false
    }
  ];

  return {
    nodes,
    connections: [
      { from: 'n1', to: 'n2', type: 'prerequisite' },
      { from: 'n2', to: 'n3', type: 'prerequisite' },
    ],
    metadata: {
      totalEstimatedTime: nodes.reduce((s, n) => s + n.estimatedTime, 0),
      difficultyDistribution: calculateDifficultyDistribution(nodes),
      skillProgression: extractSkillProgression(nodes),
    },
  };
}

/**
 * Generates an interactive lesson trail for a course using AI
 */
export async function generateLessonTrail(courseId: number, userId: number): Promise<LessonTrailData> {
  try {
    if (!process.env.DATABASE_URL) {
      return mockTrail();
    }
    // Get course and lesson data
    const [course] = await db.select().from(courses).where(eq(courses.id, courseId));
    if (!course) throw new Error('Course not found');

    const courseModules = await db.select().from(modules).where(eq(modules.courseId, courseId)).orderBy(asc(modules.order));
    
    const courseLessons = await db.select({
      lesson: lessons,
      module: modules
    })
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.order), asc(lessons.order));

    // Get user learning data for personalization
    const [userLevel] = await db.select().from(userLevels).where(eq(userLevels.userId, userId));
    const userAchievementsList = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
    
    // Get user's learning analytics for difficulty adjustment
    const recentAnalytics = await db.select()
      .from(learningAnalytics)
      .where(eq(learningAnalytics.userId, userId))
      .orderBy(desc(learningAnalytics.createdAt))
      .limit(20);

    const averagePerformance = recentAnalytics.length > 0 
      ? recentAnalytics.reduce((sum, a) => sum + (Number(a.performanceScore) || 0.7), 0) / recentAnalytics.length
      : 0.7;

    const prompt = `Create an interactive lesson trail for the course "${course.title}" with the following lessons:

${courseLessons.map((l, i) => `${i + 1}. ${l.lesson.title} (Module: ${l.module.title})`).join('\n')}

User Profile:
- Level: ${userLevel?.level || 1}
- XP: ${userLevel?.totalXp || 0}
- Recent Performance: ${(averagePerformance * 100).toFixed(1)}%
- Achievements Earned: ${userAchievementsList.length}

Design an engaging, interactive lesson trail that:
1. Creates logical learning progression with prerequisites
2. Includes checkpoints and optional bonus content
3. Provides educational hover information for each node
4. Adapts difficulty based on user performance
5. Includes gamification elements (XP, points, badges)

Return a JSON object with this structure:
{
  "trailTitle": "string",
  "trailDescription": "string",
  "estimatedTime": number,
  "difficulty": "easy|medium|hard",
  "nodes": [
    {
      "nodeId": "unique_id",
      "position": {"x": number, "y": number},
      "type": "lesson|checkpoint|bonus|assessment",
      "lessonId": number,
      "title": "string",
      "description": "string",
      "difficulty": "easy|medium|hard",
      "estimatedTime": number,
      "prerequisites": ["node_id"],
      "unlockConditions": {
        "requiredNodes": ["node_id"],
        "minimumScore": number,
        "achievementRequired": number
      },
      "hoverInfo": {
        "summary": "Brief educational summary",
        "learningObjectives": ["objective1", "objective2"],
        "keyTopics": ["topic1", "topic2"],
        "tips": ["tip1", "tip2"],
        "resources": ["resource1", "resource2"]
      },
      "rewards": {
        "xp": number,
        "points": number,
        "badges": [badge_id]
      },
      "isOptional": boolean
    }
  ],
  "connections": [
    {
      "from": "node_id",
      "to": "node_id", 
      "type": "prerequisite|recommended|optional"
    }
  ]
}

Make the trail visually interesting with varied node positions, multiple learning paths, and clear progression. Include checkpoint nodes every 3-4 lessons and bonus content for advanced learners.`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const trailData = JSON.parse(responseText);

    // Convert to our TrailNodeData format
    const nodes: TrailNodeData[] = trailData.nodes.map((node: any) => ({
      id: node.nodeId,
      position: node.position,
      type: node.type,
      lessonId: node.lessonId,
      title: node.title,
      description: node.description,
      difficulty: node.difficulty,
      estimatedTime: node.estimatedTime,
      prerequisites: node.prerequisites || [],
      unlockConditions: node.unlockConditions || {},
      hoverInfo: node.hoverInfo,
      rewards: node.rewards,
      isOptional: node.isOptional || false
    }));

    return {
      nodes,
      connections: trailData.connections,
      metadata: {
        totalEstimatedTime: trailData.estimatedTime,
        difficultyDistribution: calculateDifficultyDistribution(nodes),
        skillProgression: extractSkillProgression(nodes)
      }
    };

  } catch (error) {
    console.error('Error generating lesson trail:', error);
    // Return a basic trail structure if AI fails
    return generateFallbackTrail(courseId);
  }
}

/**
 * Saves a generated lesson trail to the database
 */
export async function saveLessonTrail(
  courseId: number,
  trailData: LessonTrailData,
  title: string,
  description: string
) {
  const [trail] = await db.insert(lessonTrails).values({
    courseId,
    title,
    description,
    trailData: trailData as any,
    difficulty: trailData.metadata.difficultyDistribution.hard > 0.5 ? 'hard' : 
                trailData.metadata.difficultyDistribution.easy > 0.5 ? 'easy' : 'medium',
    estimatedTime: trailData.metadata.totalEstimatedTime,
    isAiGenerated: true
  }).returning();

  // Save individual trail nodes
  for (const node of trailData.nodes) {
    await db.insert(trailNodes).values({
      trailId: trail.id,
      lessonId: node.lessonId,
      nodePosition: node.position as any,
      nodeType: node.type,
      unlockConditions: node.unlockConditions as any,
      hoverInfo: node.hoverInfo as any,
      rewards: node.rewards as any,
      isOptional: node.isOptional
    });
  }

  return trail;
}

/**
 * Gets user's progress on a specific trail
 */
export async function getUserTrailProgress(userId: number, trailId: number) {
  const [progress] = await db.select()
    .from(userTrailProgress)
    .where(and(
      eq(userTrailProgress.userId, userId),
      eq(userTrailProgress.trailId, trailId)
    ));

  return progress;
}

/**
 * Updates user progress on a trail node
 */
export async function updateTrailProgress(
  userId: number,
  trailId: number,
  nodeId: string,
  timeSpent: number
) {
  const [existingProgress] = await db.select()
    .from(userTrailProgress)
    .where(and(
      eq(userTrailProgress.userId, userId),
      eq(userTrailProgress.trailId, trailId)
    ));

  if (existingProgress) {
    const completedNodes = existingProgress.completedNodes || [];
    if (!completedNodes.includes(parseInt(nodeId))) {
      completedNodes.push(parseInt(nodeId));
    }

    const progress = Math.round((completedNodes.length / await getTrailNodeCount(trailId)) * 100);

    await db.update(userTrailProgress)
      .set({
        completedNodes,
        currentNode: parseInt(nodeId),
        progress,
        timeSpent: (existingProgress.timeSpent || 0) + timeSpent,
        lastAccessedAt: new Date(),
        completedAt: progress === 100 ? new Date() : null
      })
      .where(eq(userTrailProgress.id, existingProgress.id));
  } else {
    await db.insert(userTrailProgress).values({
      userId,
      trailId,
      completedNodes: [parseInt(nodeId)],
      currentNode: parseInt(nodeId),
      progress: Math.round((1 / await getTrailNodeCount(trailId)) * 100),
      timeSpent
    });
  }
}

/**
 * Generates personalized learning recommendations based on user progress
 */
export async function generatePersonalizedRecommendations(userId: number) {
  try {
    if (!process.env.DATABASE_URL) {
      return [];
    }
    // Get user's learning data
    const [userLevel] = await db.select().from(userLevels).where(eq(userLevels.userId, userId));
    const userProgressData = await db.select()
      .from(userTrailProgress)
      .where(eq(userTrailProgress.userId, userId));

    const recentAnalytics = await db.select()
      .from(learningAnalytics)
      .where(eq(learningAnalytics.userId, userId))
      .orderBy(desc(learningAnalytics.createdAt))
      .limit(50);

    const prompt = `Analyze this user's learning data and provide personalized recommendations:

User Level: ${userLevel?.level || 1}
Total XP: ${userLevel?.totalXp || 0}
Current Streak: ${userLevel?.streak || 0}

Trail Progress: ${userProgressData.length} trails started
Recent Analytics: ${recentAnalytics.length} learning sessions

Learning Patterns:
${recentAnalytics.slice(0, 10).map(a => 
  `- ${a.activityType}: ${a.timeSpentSeconds}s, Score: ${a.performanceScore}, Difficulty: ${a.difficultyRating}/5`
).join('\n')}

Generate 3-5 personalized recommendations focusing on:
1. Skill gaps to address
2. Optimal difficulty level
3. Learning style preferences
4. Time management

Return JSON array:
[
  {
    "type": "lesson|course|trail|skill_gap",
    "resourceId": number,
    "title": "string",
    "reasoning": "detailed AI explanation",
    "confidence": number (0.0-1.0),
    "priority": "high|medium|low",
    "estimatedTime": number,
    "metadata": {
      "difficultyAdjustment": "easier|harder|maintain",
      "focusAreas": ["topic1", "topic2"],
      "learningStyle": "visual|auditory|kinesthetic|reading"
    }
  }
]`;

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
    const recommendations = JSON.parse(responseText);

    // Save recommendations to database
    for (const rec of recommendations) {
      await db.insert(personalizedRecommendations).values({
        userId,
        recommendationType: rec.type,
        resourceId: rec.resourceId,
        resourceType: rec.type,
        aiReasoning: rec.reasoning,
        confidence: rec.confidence.toString(),
        metadata: rec.metadata as any,
        isActive: true
      });
    }

    return recommendations;

  } catch (error) {
    console.error('Error generating personalized recommendations:', error);
    return [];
  }
}

/**
 * Records learning analytics for AI personalization
 */
export async function recordLearningAnalytics(
  userId: number,
  sessionId: string,
  data: {
    lessonId?: number;
    courseId?: number;
    activityType: string;
    timeSpent: number;
    interactionData: any;
    performanceScore?: number;
    difficultyRating?: number;
  }
) {
  await db.insert(learningAnalytics).values({
    userId,
    sessionId,
    lessonId: data.lessonId,
    courseId: data.courseId,
    activityType: data.activityType,
    timeSpentSeconds: data.timeSpent,
    interactionData: data.interactionData as any,
    performanceScore: data.performanceScore?.toString(),
    difficultyRating: data.difficultyRating
  });
}

// Helper functions
function calculateDifficultyDistribution(nodes: TrailNodeData[]) {
  const total = nodes.length;
  const easy = nodes.filter(n => n.difficulty === 'easy').length / total;
  const medium = nodes.filter(n => n.difficulty === 'medium').length / total;
  const hard = nodes.filter(n => n.difficulty === 'hard').length / total;
  
  return { easy, medium, hard };
}

function extractSkillProgression(nodes: TrailNodeData[]) {
  return nodes
    .filter(n => n.type === 'lesson')
    .flatMap(n => n.hoverInfo.keyTopics || [])
    .filter((topic, index, arr) => arr.indexOf(topic) === index);
}

async function getTrailNodeCount(trailId: number) {
  const result = await db.select({ count: sql`count(*)` })
    .from(trailNodes)
    .where(eq(trailNodes.trailId, trailId));
  
  return parseInt(result[0].count as string);
}

async function generateFallbackTrail(courseId: number): Promise<LessonTrailData> {
  // Get basic lesson data for fallback
  const courseLessons = await db.select()
    .from(lessons)
    .innerJoin(modules, eq(lessons.moduleId, modules.id))
    .where(eq(modules.courseId, courseId))
    .orderBy(asc(modules.order), asc(lessons.order));

  const nodes: TrailNodeData[] = courseLessons.map((lesson, index) => ({
    id: `lesson_${lesson.lessons.id}`,
    position: { x: 100 + (index % 4) * 200, y: 100 + Math.floor(index / 4) * 150 },
    type: 'lesson' as const,
    lessonId: lesson.lessons.id,
    title: lesson.lessons.title,
    description: `Study ${lesson.lessons.title}`,
    difficulty: 'medium' as const,
    estimatedTime: lesson.lessons.duration || 30,
    prerequisites: index > 0 ? [`lesson_${courseLessons[index - 1].lessons.id}`] : [],
    unlockConditions: {},
    hoverInfo: {
      summary: `Learn about ${lesson.lessons.title}`,
      learningObjectives: ['Understand key concepts', 'Apply knowledge'],
      keyTopics: [lesson.lessons.title],
      tips: ['Take notes', 'Practice regularly'],
      resources: ['Course materials', 'Additional readings']
    },
    rewards: { xp: 50, points: 25 },
    isOptional: false
  }));

  return {
    nodes,
    connections: nodes.slice(1).map((node, index) => ({
      from: nodes[index].id,
      to: node.id,
      type: 'prerequisite' as const
    })),
    metadata: {
      totalEstimatedTime: nodes.reduce((sum, n) => sum + n.estimatedTime, 0),
      difficultyDistribution: { easy: 0.2, medium: 0.6, hard: 0.2 },
      skillProgression: nodes.map(n => n.title)
    }
  };
}