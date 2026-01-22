export interface GeneratedSubject {
  title: string;
  description?: string;
  icon?: string;
  color?: string;
  order: number;
  estimatedHours: number;
  topics: Array<{
    title: string;
    name?: string;
    order: number;
    estimatedHours?: number;
    difficulty?: 'easy' | 'medium' | 'hard';
    subtopics: string[];
  }>;
}

export interface GenerateCurriculumResponse {
  success: boolean;
  data?: GeneratedSubject[];
  error?: string;
}

export async function generateCurriculum(
  prompt: string,
  examType: 'tyt' | 'ayt' | 'yks' = 'tyt',
  useTemplate = false
): Promise<GenerateCurriculumResponse> {
  try {
    const body: Record<string, unknown> = { examType };
    if (useTemplate) {
      body.useTemplate = true;
      body.prompt = prompt || `${examType.toUpperCase()} tam müfredatı`;
    } else {
      body.useTemplate = false;
      body.prompt = `${prompt}\n\nLütfen yanıtı şu JSON formatında ver:\n{
          "subjects": [{
            "title": "Ders Adı",
            "description": "Açıklama",
            "icon": "📘",
            "color": "blue",
            "order": 1,
            "estimatedHours": 40,
            "topics": [{
              "title": "Konu Başlığı",
              "name": "Konu Başlığı",
              "order": 1,
              "estimatedHours": 5,
              "difficulty": "medium",
              "subtopics": ["Alt konu 1", "Alt konu 2"]
            }]
          }]
        }`;
    }

    const response = await fetch('/api/generate-curriculum', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Validate response structure
    if (data.subjects && Array.isArray(data.subjects)) {
      return {
        success: true,
        data: data.subjects
      };
    } else if (data.curriculum && Array.isArray(data.curriculum)) {
      return {
        success: true,
        data: data.curriculum
      };
    } else {
      throw new Error('Invalid response format from AI service');
    }
  } catch (error) {
    console.error('AI Service Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Generate full curriculum using API template (tyt_full / ayt_full).
 * Uses CURRICULUM_PROMPTS from api/prompts/curriculum-prompts.js.
 */
export async function generateCurriculumWithTemplate(
  examType: 'tyt' | 'ayt' | 'yks' = 'tyt'
): Promise<GenerateCurriculumResponse> {
  return generateCurriculum(
    examType === 'tyt' ? 'TYT tam müfredatı' : `${examType.toUpperCase()} tam müfredatı`,
    examType,
    true
  );
}
