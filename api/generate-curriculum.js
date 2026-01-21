// TYT/AYT/YKS AI Curriculum Generator
import { CURRICULUM_PROMPTS, getPromptByExamType } from './prompts/curriculum-prompts.js';

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
    const { prompt, examType = 'tyt', useTemplate = true } = req.body;
    
    // Determine which prompts to use
    let systemPrompt, userPrompt;
    
    if (useTemplate) {
      const template = getPromptByExamType(examType);
      if (template) {
        systemPrompt = template.system;
        userPrompt = template.user;
      } else if (CURRICULUM_PROMPTS.custom && prompt) {
        const customTemplate = CURRICULUM_PROMPTS.custom(examType.toUpperCase(), prompt);
        systemPrompt = customTemplate.system;
        userPrompt = customTemplate.user;
      } else {
        systemPrompt = 'Sen eğitim müfredat tasarımcısısın. Yanıtını sadece JSON formatında ver.';
        userPrompt = prompt || `${examType.toUpperCase()} için müfredat oluştur.`;
      }
    } else {
      if (!prompt) {
        return res.status(400).json({
          error: 'Missing required field: prompt (when useTemplate is false)'
        });
      }
      systemPrompt = 'Sen eğitim müfredat tasarımcısısın. Yanıtını sadece JSON formatında ver.';
      userPrompt = prompt;
    }

    // Check if OpenAI API key is available
    const openaiApiKey = process.env.OPENAI_API_KEY;
    
    if (!openaiApiKey) {
      // Return mock data if OpenAI is not configured
      console.warn('OpenAI API key not configured, returning mock data');
      return res.status(200).json({
        subjects: [
          {
            title: 'Matematik',
            description: `${examType.toUpperCase()} Matematik müfredatı`,
            icon: '🧮',
            color: 'blue',
            order: 1,
            estimatedHours: 120,
            topics: [
              {
                title: 'Sayılar',
                name: 'Sayılar',
                order: 1,
                estimatedHours: 15,
                difficulty: 'medium',
                subtopics: ['Doğal Sayılar', 'Tam Sayılar', 'Rasyonel Sayılar', 'Üslü Sayılar']
              },
              {
                title: 'Cebir',
                name: 'Cebir',
                order: 2,
                estimatedHours: 25,
                difficulty: 'medium',
                subtopics: ['Denklemler', 'Eşitsizlikler', 'Fonksiyonlar', 'Polinomlar']
              }
            ]
          }
        ]
      });
    }

    // Use OpenAI API if available
    let OpenAI;
    try {
      OpenAI = (await import('openai')).default;
    } catch (error) {
      console.warn('OpenAI package not available, using mock data');
      // Return mock data
      return res.status(200).json({
        subjects: [
          {
            title: 'Matematik',
            description: `${examType.toUpperCase()} Matematik müfredatı`,
            icon: '🧮',
            color: 'blue',
            order: 1,
            estimatedHours: 120,
            topics: [
              {
                title: 'Sayılar',
                name: 'Sayılar',
                order: 1,
                estimatedHours: 15,
                difficulty: 'medium',
                subtopics: ['Doğal Sayılar', 'Tam Sayılar', 'Rasyonel Sayılar']
              }
            ]
          }
        ]
      });
    }

    const openai = new OpenAI({ apiKey: openaiApiKey });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0].message.content;
    let parsedData;

    try {
      parsedData = JSON.parse(responseText);
    } catch (parseError) {
      // Try to extract JSON from markdown code blocks
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[1]);
      } else {
        throw new Error('Could not parse AI response as JSON');
      }
    }

    // Ensure the response has the expected structure
    if (parsedData.subjects && Array.isArray(parsedData.subjects)) {
      return res.status(200).json(parsedData);
    } else if (parsedData.curriculum && Array.isArray(parsedData.curriculum)) {
      return res.status(200).json({ subjects: parsedData.curriculum });
    } else {
      throw new Error('Invalid response structure from AI');
    }
    
  } catch (error) {
    console.error('Error generating curriculum:', error);
    
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
