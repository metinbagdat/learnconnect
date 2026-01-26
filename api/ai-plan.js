// TYT/AYT/YKS AI Study Plan Generator – OpenAI kişiye özel plan
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
const MODEL = process.env.AI_AYT_MODEL || process.env.AI_INTEGRATIONS_OPENAI_MODEL || 'gpt-4o-mini';

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

    let studyPlan;
    let aiModel = 'demo-v1.0';

    if (OPENAI_API_KEY) {
      try {
        studyPlan = await generatePlanWithOpenAI(studentProfile, curriculum, preferences);
        aiModel = MODEL;
      } catch (e) {
        console.warn('[ai-plan] OpenAI failed, using demo:', e?.message);
        studyPlan = generateStudyPlan(studentProfile, curriculum, preferences);
      }
    } else {
      studyPlan = generateStudyPlan(studentProfile, curriculum, preferences);
    }

    console.log('Generated study plan:', {
      student: studentProfile.name,
      planId: studyPlan.id,
      aiModel,
      timestamp: new Date().toISOString()
    });

    return res.status(200).json({
      success: true,
      plan: studyPlan,
      generatedAt: new Date().toISOString(),
      aiModel
    });
  } catch (error) {
    console.error('Error generating study plan:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}

async function generatePlanWithOpenAI(studentProfile, curriculum, preferences = {}) {
  const OpenAI = (await import('openai')).default;
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY });

  const systemPrompt = `Sen YKS (TYT/AYT) sınavına yönelik kişiselleştirilmiş haftalık çalışma planı hazırlayan bir koçsun.
Çıktıyı yalnızca geçerli JSON olarak üret. Açıklama veya markdown ekleme.`;

  const curriculumSummary = curriculum.map(s => ({
    id: s.id,
    title: s.title,
    estimatedHours: s.estimatedHours,
    totalTopics: s.totalTopics
  }));

  const userPrompt = `Öğrenci: ${studentProfile.name}
Hedef sınav: ${studentProfile.targetExam || 'TYT'}
Günlük çalışma saati: ${studentProfile.dailyStudyHours || 4}
Hedef gün sayısı: ${studentProfile.targetDays || 120}
Zayıf dersler: ${(studentProfile.weakSubjects || []).join(', ') || 'yok'}
Öğrenme stili: ${studentProfile.studyStyle || 'mixed'}
Seviye: ${studentProfile.currentLevel || 'intermediate'}

Müfredat: ${JSON.stringify(curriculumSummary)}

Tercihler: hafta sonu ${(preferences?.includeWeekends !== false) ? 'dahil' : 'hariç'}, tekrar günleri ${preferences?.revisionDays ?? 7}.

Bu bilgilere göre 7 günlük (bir haftalık) kişiye özel çalışma planı üret.

JSON formatı (bu yapıyı kullan):
{
  "id": "plan_<timestamp>",
  "studentName": "<isim>",
  "targetExam": "TYT",
  "totalDays": 120,
  "dailyHours": 4,
  "totalHours": 480,
  "weeklyPlan": [
    {
      "day": "Pazartesi",
      "date": "YYYY-MM-DD",
      "subjects": [
        { "subject": "Matematik", "hours": 2, "topics": [{ "id": "...", "name": "Konu adı", "estimatedTime": 45, "difficulty": "Orta" }] }
      ],
      "totalHours": 2
    }
  ],
  "monthlySummary": [
    { "subject": "Matematik", "weeklyHours": 8, "completionWeeks": 15, "priority": "HIGH" }
  ],
  "recommendations": [
    { "type": "FOCUS_AREA", "message": "...", "reason": "..." }
  ]
}

Kurallar: weeklyPlan 7 gün olmalı; her günde subjects ve totalHours olmalı; günlük toplam dailyHours'u aşmasın.`;

  const res = await openai.chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.4,
    max_tokens: 4000,
    response_format: { type: 'json_object' }
  });

  const raw = res.choices[0]?.message?.content ?? '';
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    const m = raw.match(/\{[\s\S]*\}/);
    if (m) parsed = JSON.parse(m[0]);
    else throw new Error('OpenAI plan response was not valid JSON');
  }

  const id = parsed.id || 'plan_' + Date.now();
  const now = new Date().toISOString();
  return {
    id,
    studentName: parsed.studentName ?? studentProfile.name,
    targetExam: parsed.targetExam ?? studentProfile.targetExam ?? 'TYT',
    totalDays: parsed.totalDays ?? studentProfile.targetDays ?? 120,
    dailyHours: parsed.dailyHours ?? studentProfile.dailyStudyHours ?? 4,
    totalHours: parsed.totalHours ?? (parsed.totalDays * parsed.dailyHours) ?? 480,
    weeklyPlan: Array.isArray(parsed.weeklyPlan) ? parsed.weeklyPlan : [],
    monthlySummary: Array.isArray(parsed.monthlySummary) ? parsed.monthlySummary : [],
    recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
    createdAt: now,
    updatedAt: now
  };
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
