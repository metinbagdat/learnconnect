// src/lib/curriculum-filter.ts
/**
 * AI Coach Müfredat Entegrasyonu
 * Öğrencinin onayladığı konuları filtreler ve plan yapması için hazırlar
 */

export interface Topic {
  id: string;
  name: string;
  subject: string;
  difficulty: number;
  estimatedMinutes: number;
  isTyt: boolean;
  isAyt: boolean;
}

export interface CurriculumPlan {
  totalTopics: number;
  totalEstimatedHours: number;
  topics: Topic[];
  bySubject: Record<string, Topic[]>;
  byDifficulty: Record<number, Topic[]>;
}

interface CurriculumApiTopic {
  name: string;
  difficulty: number;
  estimated_minutes?: number;
  is_tyt: boolean;
  is_ayt: boolean;
}

interface CurriculumApiItem {
  topic_id: string;
  topics: CurriculumApiTopic;
}

interface CurriculumApiResponse {
  curriculum: Record<string, CurriculumApiItem[]>;
  totalTopics: number;
}

/**
 * Öğrencinin seçtiği müfredatını ve konuları getir
 */
export async function getUserCurriculum(userId: string): Promise<CurriculumPlan> {
  try {
    const res = await fetch('/api/user/curriculum', {
      headers: {
        'x-user-id': userId,
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) throw new Error('Failed to fetch curriculum');
    
    const payload = (await res.json()) as CurriculumApiResponse;
    const curriculum = payload?.curriculum || {};
    const totalTopics = Number(payload?.totalTopics || 0);

    // Verileri AI Coach için işle
    const topics: Topic[] = [];
    const bySubject: Record<string, Topic[]> = {};
    const byDifficulty: Record<number, Topic[]> = {};

    let totalEstimatedMinutes = 0;

    for (const [subjectName, items] of Object.entries(curriculum)) {
      bySubject[subjectName] = [];

      items.forEach((item) => {
        const topic: Topic = {
          id: item.topic_id,
          name: item.topics.name,
          subject: subjectName,
          difficulty: item.topics.difficulty,
          estimatedMinutes: item.topics.estimated_minutes || 45,
          isTyt: item.topics.is_tyt,
          isAyt: item.topics.is_ayt
        };

        topics.push(topic);
        bySubject[subjectName].push(topic);
        
        if (!byDifficulty[topic.difficulty]) {
          byDifficulty[topic.difficulty] = [];
        }
        byDifficulty[topic.difficulty].push(topic);

        totalEstimatedMinutes += topic.estimatedMinutes;
      });
    }

    return {
      totalTopics,
      totalEstimatedHours: Math.round(totalEstimatedMinutes / 60 * 10) / 10,
      topics,
      bySubject,
      byDifficulty
    };
  } catch (error) {
    console.error('Müfredat alınırken hata:', error);
    throw error;
  }
}

/**
 * AI Coach'un haftalık planlama yapması için optimize edilmiş konu listesi
 */
export async function getTopicsForWeeklyPlanning(userId: string, weekNumber: number) {
  const curriculum = await getUserCurriculum(userId);

  // Zorluk ve tahmin edilen süreye göre dengeli dağılım
  // Haftada ~20 saat çalışma varsayamsı (opsiyonel olarak ayarlanabilir)
  
  const WEEKLY_STUDY_HOURS = 20;
  const WEEKLY_MINUTES = WEEKLY_STUDY_HOURS * 60;

  // Konuları zorluk seviyesine ve tahmin edilen süreye göre sırala
  const sortedTopics = curriculum.topics
    .sort((a, b) => {
      // Önce kolay konular, sonra zor konular
      if (a.difficulty !== b.difficulty) {
        return a.difficulty - b.difficulty;
      }
      // Aynı zorlukta ise kısa olanları ön planda
      return a.estimatedMinutes - b.estimatedMinutes;
    });

  // Haftalık konuları seç (çoğalama yöntemi)
  let selectedMinutes = 0;
  const weeklyTopics: Topic[] = [];

  for (const topic of sortedTopics) {
    if (selectedMinutes + topic.estimatedMinutes <= WEEKLY_MINUTES) {
      weeklyTopics.push(topic);
      selectedMinutes += topic.estimatedMinutes;
    }
  }

  return {
    weekNumber,
    plannedHours: Math.round(selectedMinutes / 60 * 10) / 10,
    topics: weeklyTopics,
    recommendations: generateRecommendations(weeklyTopics)
  };
}

/**
 * AI'nın günlük plan yapması için tavsiyeler
 */
export async function getDailyRecommendations(
  userId: string,
  availableMinutes: number = 120
) {
  const curriculum = await getUserCurriculum(userId);

  // Tamamlanmamış konuları al
  const pendingTopics = curriculum.topics;

  // Her güne uygun konuları seç
  const dailySelection: Topic[] = [];
  let totalMinutes = 0;

  // Dengeli dağılım: Her konudan en az birini seçmeye çalış
  const topicsByDifficulty = Object.entries(curriculum.byDifficulty)
    .map(([difficulty, topics]) => ({
      difficulty: parseInt(difficulty),
      topics
    }))
    .sort((a, b) => a.difficulty - b.difficulty);

  for (const { topics } of topicsByDifficulty) {
    for (const topic of topics) {
      if (totalMinutes + topic.estimatedMinutes <= availableMinutes) {
        dailySelection.push(topic);
        totalMinutes += topic.estimatedMinutes;
      }
    }
  }

  return {
    availableMinutes,
    plannedMinutes: totalMinutes,
    topics: dailySelection,
    suggestion: generateDailySuggestion(dailySelection, totalMinutes)
  };
}

/**
 * Haftanın zorluk dağılımını görselleştir
 */
function generateRecommendations(topics: Topic[]) {
  const difficultyDistribution: Record<number, number> = {};
  
  topics.forEach(topic => {
    difficultyDistribution[topic.difficulty] = (difficultyDistribution[topic.difficulty] || 0) + 1;
  });

  return {
    totalTopics: topics.length,
    difficultyDistribution,
    avgDifficulty: topics.reduce((sum, t) => sum + t.difficulty, 0) / topics.length,
    recommendation: generateDifficultyRecommendation(difficultyDistribution)
  };
}

/**
 * Günün tavsiyesi mesajını üret
 */
function generateDailySuggestion(topics: Topic[], totalMinutes: number): string {
  if (topics.length === 0) {
    return 'Bugün tüm konuları başarıyla tamamladın! Mükemmel.';
  }

  const avgDifficulty = topics.reduce((sum, t) => sum + t.difficulty, 0) / topics.length;
  let suggestion = `${topics.length} konuyu ~${totalMinutes} dakikada çalışacaksın.\n`;

  if (avgDifficulty > 4) {
    suggestion += 'Zorluk seviyeleri yüksek. Daha fazla zaman ayırmaya hazırlan!';
  } else if (avgDifficulty < 2) {
    suggestion += 'Temel konular. Hızlı ve etkili bir gün olacak!';
  } else {
    suggestion += 'Dengeli bir çalışma günü. Bostum!';
  }

  return suggestion;
}

/**
 * Zorluk dağılımına göre tavsiye
 */
function generateDifficultyRecommendation(distribution: Record<number, number>): string {
  const total = Object.values(distribution).reduce((a, b) => a + b, 0);
  
  if (distribution[5]) {
    return 'Bu hafta çok zorlayıcı konuları çalışacaksın. Yeterli uyku almaya dikkat et!';
  }
  if (distribution[1] && distribution[1] > total * 0.5) {
    return 'Çoğunlukla temel konular. İyileştirme için fırsat var!';
  }
  if (Object.keys(distribution).length > 3) {
    return 'Çeşitli zorluk seviyelerinde dengeli bir hafta.';
  }
  return 'Optimal dağılım. Verimli bir hafta olacak!';
}

/**
 * Müfredat ilerleme durumu
 */
export async function getCurriculumProgress(userId: string) {
  const curriculum = await getUserCurriculum(userId);

  // Her zorluk seviyesinde ilerleme
  const progressByDifficulty = Object.entries(curriculum.byDifficulty).reduce(
    (acc, [difficulty, topics]) => {
      acc[difficulty] = {
        total: topics.length,
        completed: Math.floor(Math.random() * topics.length), // TODO: Actual completion tracking
        percentage: Math.floor(Math.random() * 100)
      };
      return acc;
    },
    {} as Record<string, any>
  );

  const totalCompleted = Object.values(progressByDifficulty)
    .reduce((sum, p) => sum + p.completed, 0);

  return {
    totalTopics: curriculum.totalTopics,
    completed: totalCompleted,
    remaining: curriculum.totalTopics - totalCompleted,
    percentage: Math.round((totalCompleted / curriculum.totalTopics) * 100),
    byDifficulty: progressByDifficulty,
    estimatedCompletionDays: Math.ceil(
      (curriculum.totalTopics - totalCompleted) * 60 / (20 * 60)
    )
  };
}
