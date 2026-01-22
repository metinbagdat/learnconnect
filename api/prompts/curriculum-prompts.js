/**
 * Curriculum generation prompts for TYT/AYT/YKS
 * Used by /api/generate-curriculum endpoint
 */

export const CURRICULUM_PROMPTS = {
  tyt_full: {
    system: `Sen Türkiye'deki TYT (Temel Yeterlilik Testi) sınavı için müfredat tasarımcısısın. 
    Yanıtını SADECE geçerli JSON formatında ver. Hiçbir açıklama, yorum veya ek metin ekleme.
    
    JSON formatı:
    {
      "subjects": [
        {
          "title": "Ders Adı",
          "description": "Kısa açıklama",
          "icon": "📘",
          "color": "blue",
          "order": 1,
          "estimatedHours": 120,
          "topics": [
            {
              "title": "Konu Başlığı",
              "name": "Konu Başlığı",
              "order": 1,
              "estimatedHours": 15,
              "difficulty": "medium",
              "subtopics": ["Alt konu 1", "Alt konu 2"]
            }
          ]
        }
      ]
    }`,
    
    user: `TYT sınavı için 4 ana dersin tam müfredatını oluştur:
    1. Matematik (TYT Matematik tüm konuları)
    2. Türkçe (TYT Türkçe tüm konuları)
    3. Fen Bilimleri (Fizik, Kimya, Biyoloji - TYT seviyesi)
    4. Sosyal Bilimler (Tarih, Coğrafya, Felsefe, Din Kültürü - TYT seviyesi)
    
    Her ders için:
    - Detaylı konu listesi
    - Her konu için alt konular
    - Tahmini çalışma saatleri
    - Zorluk seviyeleri (easy/medium/hard)
    - Mantıklı sıralama (order)
    
    Sadece JSON döndür, başka hiçbir şey yazma.`
  },
  
  ayt_full: {
    system: `Sen Türkiye'deki AYT (Alan Yeterlilik Testi) sınavı için müfredat tasarımcısısın.
    Yanıtını SADECE geçerli JSON formatında ver.`,
    
    user: `AYT sınavı için tüm derslerin müfredatını oluştur:
    - Matematik
    - Fizik
    - Kimya
    - Biyoloji
    - Türk Dili ve Edebiyatı
    - Tarih
    - Coğrafya
    - Felsefe
    
    Her ders için detaylı konu ve alt konu yapısı oluştur.`
  },
  
  yks_full: {
    system: `Sen Türkiye'deki YKS (Yükseköğretim Kurumları Sınavı) için müfredat tasarımcısısın.
    YKS = TYT + AYT. Yanıtını SADECE geçerli JSON formatında ver.`,
    
    user: `YKS için hem TYT hem AYT derslerinin tam müfredatını oluştur.`
  },
  
  custom: (examType, customPrompt) => ({
    system: `Sen ${examType} sınavı için müfredat tasarımcısısın. Yanıtını SADECE JSON formatında ver.`,
    user: customPrompt || `${examType} için müfredat oluştur.`
  })
};

/**
 * Get prompt template by exam type
 */
export function getPromptByExamType(examType) {
  const key = `${examType}_full`;
  return CURRICULUM_PROMPTS[key] || CURRICULUM_PROMPTS.tyt_full;
}
