// TYT AI Study Plan Generator
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Only POST allowed
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      error: 'Method not allowed',
      allowed: ['POST']
    });
  }
  
  try {
    const { studentProfile, curriculum, preferences } = req.body;
    
    if (!studentProfile || !curriculum) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['studentProfile', 'curriculum']
      });
    }
    
    // Demo AI Plan Generator (gerçek AI için OpenAI/Anthropic bağlanabilir)
    const studyPlan = generateStudyPlan(studentProfile, curriculum, preferences);
    
    // Planı kaydet (Firestore'a)
    console.log('Generated study plan:', {
      student: studentProfile.name,
      planId: studyPlan.id,
      timestamp: new Date().toISOString()
    });
    
    return res.status(200).json({
      success: true,
      plan: studyPlan,
      generatedAt: new Date().toISOString(),
      aiModel: 'demo-v1.0'
    });
    
  } catch (error) {
    console.error('Error generating study plan:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

// Demo AI Plan Generator Function
function generateStudyPlan(studentProfile, curriculum, preferences = {}) {
  const totalDays = studentProfile.targetDays || 120;
  const dailyHours = studentProfile.dailyStudyHours || 4;
  const totalHours = totalDays * dailyHours;
  
  // Konuları zorluğa ve önceliğe göre sırala
  const prioritizedSubjects = curriculum.map(subject => {
    const studentWeakness = studentProfile.weakSubjects?.includes(subject.id) ? 2 : 1;
    const subjectWeight = (subject.estimatedHours || 0) * studentWeakness;
    
    return {
      ...subject,
      weight: subjectWeight,
      weeklyHours: Math.ceil((subjectWeight / totalHours) * (dailyHours * 7))
    };
  }).sort((a, b) => b.weight - a.weight);
  
  // Haftalık plan oluştur
  const weeklyPlan = Array.from({ length: 7 }).map((_, dayIndex) => {
    const daySubjects = prioritizedSubjects
      .filter(subject => dayIndex < (subject.weeklyHours || 0) / dailyHours)
      .map(subject => ({
        subject: subject.title,
        hours: dailyHours,
        topics: selectTopicsForDay(subject, dayIndex)
      }));
    
    return {
      day: getDayName(dayIndex),
      date: getFutureDate(dayIndex),
      subjects: daySubjects,
      totalHours: daySubjects.reduce((sum, subj) => sum + subj.hours, 0)
    };
  });
  
  // Aylık özet
  const monthlySummary = prioritizedSubjects.map(subject => ({
    subject: subject.title,
    weeklyHours: subject.weeklyHours,
    completionWeeks: Math.ceil((subject.estimatedHours || 0) / ((subject.weeklyHours || 0) * 4)),
    priority: subject.weight > 100 ? 'HIGH' : 'MEDIUM'
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
    recommendations: generateRecommendations(studentProfile, prioritizedSubjects),
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
    difficulty: i === 0 ? 'Başlangıç' : 'Orta'
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

function generateRecommendations(studentProfile, subjects) {
  const recommendations = [];
  
  if (subjects[0]?.weight > 150) {
    recommendations.push({
      type: 'FOCUS_AREA',
      message: `${subjects[0].title} dersine öncelik verin`,
      reason: 'En yüksek ağırlığa sahip'
    });
  }
  
  if (studentProfile.studyStyle === 'visual') {
    recommendations.push({
      type: 'STYLE_TIP',
      message: 'Görsel öğrenme materyallerini kullanın',
      reason: 'Öğrenme stilinize uygun'
    });
  }
  
  return recommendations;
}
