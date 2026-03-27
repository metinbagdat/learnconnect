/**
 * AYT AIReasoningEngine prompt package
 * JSON-only, Firestore-writable. OpenAI / DeepSeek Chat Completion optimized.
 * Used by server/ai/ayt-curriculum-engine, api/lib/ayt-engine, /api/ai/* routes.
 */

/** 1) AYT Müfredat Üretimi → Firestore curriculum_ayt */
export const AYT_CURRICULUM = {
  system: `Sen Türkiye YKS sistemine hakim bir müfredat tasarım uzmanısın.
Çıktıyı yalnızca geçerli JSON olarak üret.
Açıklama, markdown veya metin ekleme.`,

  user: `AYT sınavı için eksiksiz müfredat üret.

Dersler:
- AYT Matematik
- AYT Fizik
- AYT Kimya
- AYT Biyoloji
- AYT Türk Dili ve Edebiyatı
- AYT Tarih
- AYT Coğrafya

Her ders için:
- description
- topics listesi

JSON formatı:

{
  "subjects": [
    {
      "title": "AYT Matematik",
      "description": "...",
      "topics": [
        {
          "title": "Limit ve Süreklilik",
          "estimatedHours": 8,
          "difficulty": "medium"
        }
      ]
    }
  ]
}

Kurallar:
- Konular güncel ÖSYM AYT içeriğine uygun olmalı
- estimatedHours: 4–12 arası
- difficulty: easy | medium | hard`
};

/** 2) Konu → Alt konu → Kazanım ağacı */
export function getLearningTreePrompts(topicTitle, subject = 'AYT Matematik') {
  return {
    system: `Sen pedagojik öğrenme kazanım ağacı tasarım uzmanısın.
Sadece JSON üret.`,

    user: `${subject} dersinde
"${topicTitle}" konusu için:

- Alt konular
- Her alt konu için kazanımlar
- Ön koşul ilişkileri

JSON formatı:

{
  "topic": "${topicTitle}",
  "subtopics": [
    {
      "title": "Limit Kavramı",
      "prerequisites": [],
      "outcomes": [
        "Limit tanımını yapabilir",
        "Sağdan soldan limit hesaplar"
      ]
    }
  ]
}

Kurallar:
- Kazanımlar ölçülebilir cümle olsun
- prerequisites: alt konu title referansı`
  };
}

/** 3) Her konuya AI çalışma planı → Firestore studyPlans/{userId}/{topicId} */
export function getStudyPlanPrompts(topicTitle, estimatedHours, studentLevel = 'orta', dailyHours = 2) {
  const dailyMinutes = Math.round(dailyHours * 60);
  return {
    system: `Sen sınav koçu gibi kişisel çalışma planı hazırlayan bir AI'sın.
Sadece JSON üret.`,

    user: `Öğrenci seviyesi: ${studentLevel}
Günlük çalışma süresi: ${dailyHours} saat

Konu: "${topicTitle}"
Tahmini toplam süre: ${estimatedHours} saat

Bu konu için günlük çalışma planı üret.

JSON formatı:

{
  "topic": "${topicTitle}",
  "totalDays": 4,
  "dailyPlan": [
    {
      "day": 1,
      "focus": "Limit kavramı ve temel örnekler",
      "tasks": [
        "Video ders izle (30 dk)",
        "Örnek soru çöz (45 dk)",
        "Kısa tekrar (15 dk)"
      ]
    }
  ]
}

Kurallar:
- tasks uygulanabilir kısa görevler olsun
- Günlük toplam süre ${dailyMinutes} dakikayı aşmasın`
  };
}

// Vercel treats every file under /api as a serverless route.
// Expose a default handler so helper modules don't break deployment.
export default function handler(_req, res) {
  return res.status(404).json({ error: 'Not Found' });
}
