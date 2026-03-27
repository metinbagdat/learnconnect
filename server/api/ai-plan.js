const DEMO_MODEL = 'demo-v1.0';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed', allowed: ['POST'] });
  }

  try {
    const { studentProfile, curriculum, preferences } = req.body ?? {};

    if (!studentProfile || !curriculum) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['studentProfile', 'curriculum']
      });
    }

    if (!Array.isArray(curriculum)) {
      return res.status(400).json({
        error: 'Invalid curriculum format',
        expected: 'Array'
      });
    }

    const safeStudentProfile = {
      name: studentProfile?.name || 'Öğrenci',
      targetExam: studentProfile?.targetExam || 'TYT',
      dailyStudyHours: Number(studentProfile?.dailyStudyHours) || 4,
      targetDays: Number(studentProfile?.targetDays) || 120,
      weakSubjects: Array.isArray(studentProfile?.weakSubjects) ? studentProfile.weakSubjects : [],
      studyStyle: studentProfile?.studyStyle,
      currentLevel: studentProfile?.currentLevel
    };

    const normalizedCurriculum = curriculum.length > 0 ? curriculum : getDefaultCurriculum();
    const studyPlan = generateStudyPlan(safeStudentProfile, normalizedCurriculum, preferences);

    console.log('Generated study plan:', {
      student: safeStudentProfile.name,
      planId: studyPlan.id,
      aiModel: DEMO_MODEL,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      plan: studyPlan,
      generatedAt: new Date().toISOString(),
      aiModel: DEMO_MODEL
    });
  } catch (error) {
    console.error('Error generating study plan:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Demo AI Plan Generator Function
function generateStudyPlan(studentProfile, curriculum, preferences = {}) {
  const totalDays = studentProfile.targetDays || 120;
  const dailyHours = studentProfile.dailyStudyHours || 4;
  const totalHours = totalDays * dailyHours;
  const includeWeekends = preferences?.includeWeekends !== false;
  const studyDaysInWeek = includeWeekends ? 7 : 5;
  const weeklyTargetHours = dailyHours * studyDaysInWeek;

  // Konuları zorluğa ve önceliğe göre sırala
  const prioritizedSubjects = curriculum
    .map((subject) => {
      const studentWeakness = studentProfile.weakSubjects?.includes(subject.id) ? 2 : 1;
      const subjectWeight = Math.max(1, (subject.estimatedHours || 60) * studentWeakness);

      return {
        ...subject,
        weight: subjectWeight
      };
    })
    .sort((a, b) => b.weight - a.weight);

  const totalWeight = prioritizedSubjects.reduce((sum, subject) => sum + subject.weight, 0);
  const subjectsWithWeeklyHours = prioritizedSubjects.map((subject) => ({
    ...subject,
    weeklyHours: Math.max(1, Math.round((subject.weight / totalWeight) * weeklyTargetHours))
  }));

  const subjectBuckets = subjectsWithWeeklyHours.map((subject) => ({
    ...subject,
    remainingHours: subject.weeklyHours
  }));

  // Haftalık plan oluştur
  const weeklyPlan = Array.from({ length: 7 }).map((_, dayIndex) => {
    if (!includeWeekends && dayIndex >= 5) {
      return {
        day: getDayName(dayIndex),
        date: getFutureDate(dayIndex),
        subjects: [],
        totalHours: 0
      };
    }

    let remaining = dailyHours;
    const daySubjects = [];

    for (const subject of subjectBuckets) {
      if (remaining <= 0) break;
      if (subject.remainingHours <= 0) continue;

      const allocation = Math.min(2, remaining, subject.remainingHours);
      subject.remainingHours -= allocation;
      remaining -= allocation;

      daySubjects.push({
        subject: subject.title,
        hours: allocation,
        topics: selectTopicsForDay(subject, dayIndex)
      });
    }

    return {
      day: getDayName(dayIndex),
      date: getFutureDate(dayIndex),
      subjects: daySubjects,
      totalHours: dailyHours - remaining
    };
  });

  // Aylık özet
  const monthlySummary = subjectsWithWeeklyHours.map((subject) => ({
    subject: subject.title,
    weeklyHours: subject.weeklyHours,
    completionWeeks: Math.ceil((subject.estimatedHours || 60) / Math.max(1, subject.weeklyHours)),
    priority: subject.weight > 150 ? 'HIGH' : subject.weight > 90 ? 'MEDIUM' : 'LOW'
  }));

  return {
    id: 'plan_' + Date.now(),
    studentName: studentProfile.name,
    targetExam: studentProfile.targetExam || 'TYT',
    totalDays,
    dailyHours,
    totalHours,
    weeklyPlan,
    monthlySummary,
    recommendations: generateRecommendations(studentProfile, subjectsWithWeeklyHours, preferences),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

// Yardımcı fonksiyonlar
function selectTopicsForDay(subject, dayIndex) {
  const topicCount = Math.min(3, subject.totalTopics || 5);
  return Array.from({ length: topicCount }).map((_, i) => ({
    id: `${subject.id}_topic_${dayIndex}_${i}`,
    name: `Konu ${i + 1}`,
    estimatedTime: 45,
    difficulty: i === 0 ? 'Kolay' : i === 1 ? 'Orta' : 'Zor'
  }));
}

function getDayName(index) {
  const days = ['Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi', 'Pazar'];
  return days[index] || 'Gün ' + (index + 1);
}

function getFutureDate(daysToAdd) {
  const date = new Date();
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString().split('T')[0];
}

function generateRecommendations(studentProfile, subjects, preferences) {
  const recommendations = [];

  if (subjects[0]?.weight > 150) {
    recommendations.push({
      type: 'FOCUS_AREA',
      message: `${subjects[0].title} dersine öncelik verin`,
      reason: 'En yüksek ağırlığa sahip'
    });
  }

  if (preferences?.includeWeekends === false) {
    recommendations.push({
      type: 'BALANCE',
      message: 'Hafta sonlarını dinlenme ve tekrar için kullanın',
      reason: 'Daha sürdürülebilir çalışma temposu'
    });
  }

  if (studentProfile.studyStyle === 'visual') {
    recommendations.push({
      type: 'STYLE_TIP',
      message: 'Görsel öğrenme materyallerini kullanın',
      reason: 'Öğrenme stilinize uygun'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: 'CONSISTENCY',
      message: 'Düzenli tekrarlarla planı sürdürülebilir hale getirin',
      reason: 'Verimli ilerleme için tutarlılık önemli'
    });
  }

  return recommendations;
}

function getDefaultCurriculum() {
  return [
    { id: 'mathematics', title: 'Matematik', totalTopics: 25, estimatedHours: 120 },
    { id: 'turkish', title: 'Türkçe', totalTopics: 20, estimatedHours: 80 },
    { id: 'science', title: 'Fen Bilimleri', totalTopics: 35, estimatedHours: 100 },
    { id: 'social', title: 'Sosyal Bilimler', totalTopics: 30, estimatedHours: 90 }
  ];
}
