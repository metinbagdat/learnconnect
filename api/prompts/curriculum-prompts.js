// AI Curriculum Generation Prompts for TYT/AYT/YKS
// Türkiye YKS Sınav Sistemi İçin Müfredat Prompt Şablonları

export const CURRICULUM_PROMPTS = {
  tyt_full: {
    system: `Sen Türkiye YKS sınav sistemi uzmanı bir eğitim müfredat tasarımcısısın.
MEB ve ÖSYM'nin resmi TYT müfredatına göre eksiksiz içerik üretiyorsun.
Yanıtını sadece geçerli JSON formatında ver. Markdown kullanma.`,
    
    user: `TYT için eksiksiz müfredat oluştur. 

**Dersler:**
- Türkçe (40 soru)
- Matematik (40 soru)  
- Fen Bilimleri (20 soru - Fizik, Kimya, Biyoloji)
- Sosyal Bilimler (20 soru - Tarih, Coğrafya, Felsefe, Din Kültürü)

**Her ders için:**
- Güncel MEB müfredatına uygun konular
- Konuların alt başlıkları (subtopics)
- Zorluk seviyeleri (easy/medium/hard)
- Tahmini çalışma süreleri (saat)
- Öncül konular (prerequisites) - boş array olabilir

**JSON Format:**
{
  "subjects": [
    {
      "title": "TYT Matematik",
      "description": "TYT matematik müfredatı - 40 soru",
      "icon": "🧮",
      "color": "blue",
      "order": 1,
      "estimatedHours": 120,
      "topics": [
        {
          "title": "Temel Kavramlar",
          "name": "Temel Kavramlar",
          "order": 1,
          "estimatedHours": 12,
          "difficulty": "easy",
          "subtopics": [
            "Doğal Sayılar",
            "Tam Sayılar",
            "Rasyonel Sayılar",
            "Bölünebilme Kuralları"
          ],
          "prerequisites": []
        }
      ]
    }
  ]
}

Lütfen TÜM 4 dersi (Türkçe, Matematik, Fen, Sosyal) eksiksiz şekilde oluştur.`
  },
  
  ayt_full: {
    system: `Sen Türkiye YKS sınav sistemi uzmanı bir eğitim müfredat tasarımcısısın.
MEB ve ÖSYM'nin resmi AYT müfredatına göre eksiksiz içerik üretiyorsun.
Yanıtını sadece geçerli JSON formatında ver. Markdown kullanma.`,
    
    user: `AYT için eksiksiz müfredat oluştur.

**Sayısal Alan:**
- Matematik (40 soru)
- Fizik (14 soru)
- Kimya (13 soru)
- Biyoloji (13 soru)

**Sözel Alan:**
- Türk Dili ve Edebiyatı (24 soru)
- Tarih-1 (10 soru)
- Coğrafya-1 (6 soru)
- Tarih-2 (11 soru)
- Coğrafya-2 (11 soru)
- Felsefe (12 soru)
- Din Kültürü (6 soru)

**Her ders için:**
- Güncel MEB müfredatına uygun konular
- Konuların alt başlıkları (subtopics)
- Zorluk seviyeleri (easy/medium/hard)
- Tahmini çalışma süreleri (saat)
- Öncül konular (prerequisites) - boş array olabilir

Aynı JSON formatında döndür. TÜM dersleri eksiksiz oluştur.`
  },
  
  tyt_matematik: {
    system: `Sen matematik eğitimi uzmanısın. TYT Matematik müfredatı konusunda derin bilgin var.`,
    user: `TYT Matematik dersi için eksiksiz müfredat oluştur.

**Ana Konular (öneriler):**
- Temel Kavramlar
- Sayı Basamakları  
- Bölme ve Bölünebilme
- EBOB - EKOK
- Rasyonel Sayılar
- Basit Eşitsizlikler
- Üslü Sayılar
- Köklü Sayılar
- Çarpanlara Ayırma
- Oran ve Orantı
- Denklem ve Problemler
- Kümeler
- Fonksiyonlar
- Polinomlar
- İkinci Dereceden Denklemler
- Permütasyon ve Kombinasyon
- Olasılık
- Geometri Temel Kavramlar
- Üçgenler
- Çokgenler
- Çember ve Daire
- Katı Cisimler

Her konu için alt başlıklar, zorluk, tahmini saat ekle.`
  },

  custom: (subject, details) => ({
    system: `Sen ${subject} konusunda uzman bir eğitim içerik oluşturucususun. MEB ve ÖSYM müfredatlarına hakimsin.`,
    user: `${subject} için detaylı müfredat oluştur: ${details}

Yanıtı JSON formatında ver:
{
  "subjects": [{
    "title": "...",
    "description": "...",
    "icon": "...",
    "color": "...",
    "order": 1,
    "estimatedHours": ...,
    "topics": [...]
  }]
}`
  })
};

// Helper function to get prompt by exam type
export function getPromptByExamType(examType, useFullTemplate = true) {
  const key = `${examType}_full`;
  if (useFullTemplate && CURRICULUM_PROMPTS[key]) {
    return CURRICULUM_PROMPTS[key];
  }
  return null;
}

// Helper function to get subject-specific prompt
export function getSubjectPrompt(subject) {
  const key = subject.toLowerCase().replace(/\s+/g, '_');
  return CURRICULUM_PROMPTS[key] || null;
}
