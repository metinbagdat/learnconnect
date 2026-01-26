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
      
      (dailyPlan as any).metadata = {
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

  /** AYT AIReasoningEngine prompt package: full AYT curriculum (subjects + topics) */
  async generateAYTCurriculum() {
    const { generateAYTCurriculum: gen } = await import('./ayt-curriculum-engine.js');
    return gen();
  }

  /** AYT AIReasoningEngine prompt package: learning tree (subtopics, outcomes, prerequisites) */
  async generateLearningTree(topicTitle: string, subject: string = 'AYT Matematik') {
    const { generateLearningTree: gen } = await import('./ayt-curriculum-engine.js');
    return gen(topicTitle, subject);
  }

  /** AYT AIReasoningEngine prompt package: per-topic study plan */
  async generateStudyPlan(
    topicTitle: string,
    estimatedHours: number = 8,
    studentLevel: string = 'orta',
    dailyHours: number = 2
  ) {
    const { generateStudyPlan: gen } = await import('./ayt-curriculum-engine.js');
    return gen(topicTitle, estimatedHours, studentLevel, dailyHours);
  }
}

export const aiReasoningEngine = new AIReasoningEngine();

/* =====================================================
   STANDALONE AI FUNCTIONS FOR CURRICULUM GENERATION
   These functions use Claude directly for AYT curriculum generation
===================================================== */

async function callClaude(prompt: string) {
  try {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }]
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error("Invalid AI response type");
    }

    // JSON çıktısını temizle ve parse et
    const text = content.text.trim();
    // JSON başlangıcını bul
    const jsonStart = text.indexOf('{');
    const jsonEnd = text.lastIndexOf('}');
    
    if (jsonStart === -1 || jsonEnd === -1) {
      throw new Error("No JSON found in response");
    }
    
    const jsonStr = text.substring(jsonStart, jsonEnd + 1);
    return JSON.parse(jsonStr);
  } catch (error) {
    logger.error('Error in callClaude', error instanceof Error ? error : new Error(String(error)), {
      module: 'AIReasoningEngine',
      action: 'callClaude'
    });
    throw error;
  }
}

/**
 * 1) AYT FULL CURRICULUM
 * Generates complete AYT curriculum with all subjects and topics
 */
export async function generateAYTCurriculum() {
  const prompt = `
Sen Türkiye YKS sistemine hakim müfredat uzmanısın.
Sadece JSON üret. Metin ekleme.

AYT sınavı için eksiksiz müfredat üret.

Dersler:
- AYT Matematik
- AYT Fizik
- AYT Kimya
- AYT Biyoloji
- AYT Türk Dili ve Edebiyatı
- AYT Tarih
- AYT Coğrafya

JSON formatı:

{
 "subjects":[
   {
     "title":"AYT Matematik",
     "description":"...",
     "topics":[
       {
         "title":"Limit ve Süreklilik",
         "estimatedHours":8,
         "difficulty":"medium"
       }
     ]
   }
 ]
}

Kurallar:
- Konular güncel ÖSYM AYT içeriğine uygun olsun
- estimatedHours: 4–12 arası
- difficulty: easy | medium | hard
- Her ders için en az 5 konu ekle
- Sadece JSON üret, başka açıklama yok
`;

  return await callClaude(prompt);
}

/**
 * 2) LEARNING TREE FOR ONE TOPIC
 * Generates learning tree with subtopics, prerequisites, and outcomes
 */
export async function generateLearningTree(topicTitle: string, subject: string = "AYT Matematik") {
  const prompt = `
Sen pedagojik öğrenme kazanım ağacı uzmanısın.
Sadece JSON üret.

${subject} dersinde "${topicTitle}" konusu için:

- Alt konular
- Her alt konu için kazanımlar
- Ön koşul ilişkileri

JSON formatı:

{
 "topic":"${topicTitle}",
 "subject":"${subject}",
 "subtopics":[
   {
     "title":"Alt konu adı",
     "prerequisites":[],
     "outcomes":[
        "Ölçülebilir kazanım cümlesi"
     ]
   }
 ]
}

Kurallar:
- prerequisites alt konu title referansı
- outcomes ölçülebilir cümle olsun
- Alt konular mantıksal sırada olsun
- En az 3 alt konu oluştur
- Kazanımlar "yapabilir", "hesaplayabilir", "çözebilir" gibi fiillerle bitsin
- Sadece JSON üret
`;

  return await callClaude(prompt);
}

/**
 * 3) STUDY PLAN FOR ONE TOPIC
 * Generates daily study plan for a specific topic
 */
export async function generateStudyPlan(
  topicTitle: string,
  totalHours: number = 8,
  level: string = "medium",
  dailyHours: number = 2
) {
  const prompt = `
Sen sınav koçu gibi çalışma planı hazırlayan AI'sın.
Sadece JSON üret.

Öğrenci seviyesi: ${level}
Günlük çalışma süresi: ${dailyHours} saat

Konu: "${topicTitle}"
Tahmini toplam süre: ${totalHours} saat

Bu konu için günlük çalışma planı üret.

JSON formatı:

{
 "topic":"${topicTitle}",
 "totalDays":4,
 "dailyPlan":[
   {
     "day":1,
     "focus":"Odaklanılan alt konu",
     "tasks":[
        "Görev 1 (30 dk)",
        "Görev 2 (45 dk)",
        "Görev 3 (15 dk)"
     ]
   }
 ]
}

Kurallar:
- Günlük toplam süre ${dailyHours * 60} dakikayı geçmesin
- tasks array'inde uygulanabilir, kısa görevler olsun
- Her görevin yanında parantez içinde süre belirt
- Toplam gün sayısı = totalHours / ${dailyHours} (yuvarlak)
- Sadece JSON üret
`;

  return await callClaude(prompt);
}
