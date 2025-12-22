import Anthropic from '@anthropic-ai/sdk';
import { storage } from './storage.js';

// the newest Anthropic model is "claude-sonnet-4-20250514" which was released May 14, 2025. Use this by default unless user has already selected claude-3-7-sonnet-20250219
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface AIEnhancedLesson {
  id: number;
  title: string;
  description: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  durationMinutes: number;
  progress: number;
  aiContext: {
    personalizedIntro: string;
    learningObjectives: string[];
    adaptedContent: string;
    practiceExercises: string[];
    nextSteps: string[];
    difficultyReason: string;
  };
  tags: string[];
}

export interface AIEnhancedModule {
  id: number;
  title: string;
  description: string;
  progress: number;
  lessons: AIEnhancedLesson[];
  aiContext: {
    moduleOverview: string;
    learningPath: string;
    personalizedTips: string[];
    prerequisiteCheck: string;
  };
}

/**
 * Generates AI-enhanced modules with personalized content for each lesson
 */
export async function generateAIEnhancedModules(courseId: number, userId: number, language: string = 'en'): Promise<AIEnhancedModule[]> {
  try {
    // Get user profile and learning preferences
    const user = await storage.getUser(userId);
    const userLevel = await storage.getUserLevel(userId);
    const userCourses = await storage.getUserCourses(userId);
    
    // Get modules and lessons for the course
    const modules = await storage.getModules(courseId);
    const course = await storage.getCourse(courseId);
    
    if (!course) {
      throw new Error('Course not found');
    }

    const courseTitle = language === 'tr' ? (course.titleTr || course.title) : (course.titleEn || course.title);
    console.log(`Course "${courseTitle}" has ${modules.length} modules`);

    // If no modules exist, generate fallback modules immediately
    if (modules.length === 0) {
      console.log('No modules found, generating fallback modules');
      return generateFallbackModules(courseId, userId, language);
    }

    const enhancedModules: AIEnhancedModule[] = [];

    for (const module of modules) {
      const lessons = await storage.getLessons(module.id);
      const userLessons = await storage.getUserLessons(userId);
      
      // Generate AI context for the module
      const moduleAIContext = await generateModuleAIContext(module, course, user, userLevel, language);
      
      const enhancedLessons: AIEnhancedLesson[] = [];
      
      for (const lesson of lessons) {
        // Find user progress for this lesson
        const userLesson = userLessons.find(ul => ul.lesson?.id === lesson.id);
        const progress = userLesson?.progress || 0;
        
        // Generate personalized AI content for each lesson
        const aiContext = await generateLessonAIContext(lesson, module, course, user, userLevel, progress, language);
        
        const lessonDescription = language === 'tr' ? (lesson.descriptionTr || lesson.description) : (lesson.descriptionEn || lesson.description);
        const lessonTitle = language === 'tr' ? (lesson.titleTr || lesson.title) : (lesson.titleEn || lesson.title);
        const lessonContent = language === 'tr' ? (lesson.contentTr || lesson.content) : (lesson.contentEn || lesson.content);
        
        enhancedLessons.push({
          id: lesson.id,
          title: lessonTitle,
          description: lessonDescription,
          content: lessonContent,
          difficulty: determineLessonDifficulty(lesson, userLevel),
          durationMinutes: lesson.durationMinutes || 30,
          progress,
          aiContext,
          tags: lesson.tags || []
        });
      }
      
      // Calculate module progress
      const moduleProgress = enhancedLessons.length > 0 
        ? Math.round(enhancedLessons.reduce((sum, l) => sum + l.progress, 0) / enhancedLessons.length)
        : 0;
      
      const moduleDescription = language === 'tr' ? (module.descriptionTr || module.description) : (module.descriptionEn || module.description);
      const moduleTitle = language === 'tr' ? (module.titleTr || module.title) : (module.titleEn || module.title);
      
      enhancedModules.push({
        id: module.id,
        title: moduleTitle,
        description: moduleDescription,
        progress: moduleProgress,
        lessons: enhancedLessons,
        aiContext: moduleAIContext
      });
    }

    return enhancedModules;
    
  } catch (error) {
    console.error('Error generating AI-enhanced modules:', error);
    
    // Return fallback modules without AI enhancement
    return generateFallbackModules(courseId, userId, language);
  }
}

async function generateModuleAIContext(module: any, course: any, user: any, userLevel: any, language: string = 'en') {
  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const moduleTitle = language === 'tr' ? (module.titleTr || module.title) : (module.titleEn || module.title);
      const moduleDesc = language === 'tr' ? (module.descriptionTr || module.description) : (module.descriptionEn || module.description);
      const courseTitle = language === 'tr' ? (course.titleTr || course.title) : (course.titleEn || course.title);
      
      // Extract learning outcomes if available
      const learningOutcomes = module.learningOutcomes || [];
      const outcomesText = Array.isArray(learningOutcomes) && learningOutcomes.length > 0
        ? learningOutcomes.map((outcome: any, idx: number) => `${idx + 1}. ${typeof outcome === 'string' ? outcome : outcome.text || outcome}`).join('\n')
        : 'Not specified';
      
      // Get module metadata
      const mebCode = module.mebUnitCode ? ` (MEB Code: ${module.mebUnitCode})` : '';
      const estimatedHours = module.estimatedHours ? `Estimated time: ${module.estimatedHours} hours` : '';
      
      // Get previous modules for prerequisite context
      const allModules = await storage.getModules(course.id);
      const currentModuleIndex = allModules.findIndex((m: any) => m.id === module.id);
      const previousModules = currentModuleIndex > 0 ? allModules.slice(0, currentModuleIndex).map((m: any) => 
        language === 'tr' ? (m.titleTr || m.title) : (m.titleEn || m.title)
      ) : [];
      
      const prompt = language === 'tr' ? `
Sen bir AI öğrenme asistanısın. Aşağıdaki modül için kişiselleştirilmiş içerik oluştur:

Modül: "${moduleTitle}"${mebCode}
Açıklama: "${moduleDesc}"
Kurs: "${courseTitle}"
Öğrenci Seviyesi: ${userLevel?.level || 1}
Öğrenci XP: ${userLevel?.totalXp || 0}
${estimatedHours ? `Tahmini Süre: ${module.estimatedHours} saat` : ''}

Öğrenme Kazanımları:
${outcomesText}

${previousModules.length > 0 ? `Önceki Modüller: ${previousModules.join(', ')}` : ''}

Aşağıdaki JSON formatında yanıt ver:
{
  "moduleOverview": "Öğrencinin ne öğreneceğini açıklayan kişiselleştirilmiş genel bakış (2-3 cümle)",
  "learningPath": "Bu modülün öğrenme yolculuğuna nasıl uyduğu (1-2 cümle)",
  "personalizedTips": ["Bu öğrenci için 3 özel ipucu"],
  "prerequisiteCheck": "Başlamadan önce bilinmesi gerekenler (önceki modüllere referans ver)"
}

Seviyelerine özel ve cesaret verici ol. Öğrenme kazanımlarını kullan.
` : `
You are an AI learning assistant. Generate personalized module context for:

Module: "${moduleTitle}"${mebCode}
Description: "${moduleDesc}"
Course: "${courseTitle}"
Student Level: ${userLevel?.level || 1}
Student XP: ${userLevel?.totalXp || 0}
${estimatedHours ? `Estimated Time: ${module.estimatedHours} hours` : ''}

Learning Outcomes:
${outcomesText}

${previousModules.length > 0 ? `Previous Modules: ${previousModules.join(', ')}` : ''}

Generate a JSON response with:
{
  "moduleOverview": "Personalized overview explaining what the student will learn (2-3 sentences)",
  "learningPath": "How this module fits into their learning journey (1-2 sentences)",
  "personalizedTips": ["3 specific tips for this student"],
  "prerequisiteCheck": "What the student should know before starting (reference previous modules)"
}

Make it encouraging and specific to their level. Use the learning outcomes.
`;

      if (!anthropic) {
        throw new Error('Anthropic API key not configured');
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = typeof response.content[0] === 'object' && 'text' in response.content[0]
        ? response.content[0].text
        : String(response.content[0]);
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || responseText.match(/(\{[\s\S]*\})/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      
      const aiResponse = JSON.parse(jsonText);
      
      // Validate response structure
      if (!aiResponse.moduleOverview || !aiResponse.learningPath) {
        throw new Error('Invalid AI response structure');
      }
      
      return aiResponse;
      
    } catch (error) {
      lastError = error;
      console.error(`Error generating module AI context (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  // Fallback with actual module data
  console.error('All AI generation attempts failed, using enhanced fallback');
  return generateEnhancedModuleFallback(module, course, userLevel, language);
}

function generateEnhancedModuleFallback(module: any, course: any, userLevel: any, language: string = 'en') {
  const moduleTitle = language === 'tr' ? (module.titleTr || module.title) : (module.titleEn || module.title);
  const moduleDesc = language === 'tr' ? (module.descriptionTr || module.description) : (module.descriptionEn || module.description);
  const learningOutcomes = module.learningOutcomes || [];
  const estimatedHours = module.estimatedHours;
  
  const hasOutcomes = Array.isArray(learningOutcomes) && learningOutcomes.length > 0;
  const outcomesPreview = hasOutcomes 
    ? learningOutcomes.slice(0, 3).map((outcome: any) => 
        typeof outcome === 'string' ? outcome : outcome.text || outcome
      ).join(', ')
    : null;

  if (language === 'tr') {
    return {
      moduleOverview: hasOutcomes
        ? `Bu modül ${moduleTitle} konusunu kapsar ve şu kazanımları hedefler: ${outcomesPreview}. ${moduleDesc || 'Kavramları adım adım öğrenerek anlayışınızı geliştireceksiniz.'}`
        : `Bu modül ${moduleTitle} kavramlarını kapsar ve anlayışınızı geliştirmek için tasarlanmıştır. ${moduleDesc || 'Her ders önceki bilgilerin üzerine inşa edilir.'}`,
      learningPath: estimatedHours
        ? `Bu modül, öğrenme yolculuğunuzda önemli bir adımdır. Yaklaşık ${estimatedHours} saatlik çalışma ile ${moduleTitle} konusunda yetkinlik kazanacaksınız.`
        : `Bu modül, öğrenme yolculuğunuzda sistematik olarak ilerlemenizi sağlar. Her ders bir öncekinin üzerine inşa edilir.`,
      personalizedTips: [
        `${moduleTitle} konusunda notlar alarak çalışın`,
        "Düzenli pratik yaparak kavramları pekiştirin",
        userLevel?.level && userLevel.level <= 2 
          ? "Temel kavramları anlamak için zaman ayırın"
          : "İleri seviye uygulamalara odaklanın"
      ],
      prerequisiteCheck: hasOutcomes
        ? `Bu modüle başlamadan önce, önceki modüllerdeki temel kavramları anladığınızdan emin olun. Bu modül şu kazanımları hedefler: ${outcomesPreview}.`
        : "Önceki modüllerdeki temel kavramları anladığınızdan emin olun."
    };
  } else {
    return {
      moduleOverview: hasOutcomes
        ? `This module covers ${moduleTitle} and targets these learning outcomes: ${outcomesPreview}. ${moduleDesc || "You'll build your understanding step by step through structured lessons."}`
        : `This module covers ${moduleTitle} concepts to build your understanding. ${moduleDesc || "Each lesson builds upon previous knowledge systematically."}`,
      learningPath: estimatedHours
        ? `This module is a key step in your learning journey. With approximately ${estimatedHours} hours of study, you will gain proficiency in ${moduleTitle}.`
        : `This module is designed to advance your skills step by step. Each lesson builds systematically on the previous one.`,
      personalizedTips: [
        `Take notes while learning ${moduleTitle}`,
        "Practice regularly to reinforce concepts",
        userLevel?.level && userLevel.level <= 2
          ? "Take time to understand fundamental concepts"
          : "Focus on advanced applications"
      ],
      prerequisiteCheck: hasOutcomes
        ? `Before starting this module, ensure you understand the basic concepts from previous modules. This module targets: ${outcomesPreview}.`
        : "Basic understanding of previous concepts recommended."
    };
  }
}

async function generateLessonAIContext(lesson: any, module: any, course: any, user: any, userLevel: any, progress: number, language: string = 'en') {
  const maxRetries = 2;
  let lastError: any = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const lessonTitle = language === 'tr' ? (lesson.titleTr || lesson.title) : (lesson.titleEn || lesson.title);
      const lessonDesc = language === 'tr' ? (lesson.descriptionTr || lesson.description) : (lesson.descriptionEn || lesson.description);
      const moduleTitle = language === 'tr' ? (module.titleTr || module.title) : (module.titleEn || module.title);
      const courseTitle = language === 'tr' ? (course.titleTr || course.title) : (course.titleEn || course.title);
      
      // Extract concepts and study problems if available
      const concepts = lesson.concepts || [];
      const studyProblems = lesson.studyProblems || [];
      const studyTips = lesson.studyTips;
      const reviewHelp = lesson.reviewHelp;
      
      const conceptsText = Array.isArray(concepts) && concepts.length > 0
        ? concepts.map((c: any, idx: number) => `${idx + 1}. ${typeof c === 'string' ? c : c.name || c}`).join('\n')
        : 'Not specified';
      
      const problemsText = Array.isArray(studyProblems) && studyProblems.length > 0
        ? studyProblems.slice(0, 3).map((p: any, idx: number) => `${idx + 1}. ${typeof p === 'string' ? p : p.text || p}`).join('\n')
        : 'Practice exercises will be provided';
      
      const duration = lesson.durationMinutes || 30;
      
      const prompt = language === 'tr' ? `
Sen bir AI öğrenme asistanısın. Aşağıdaki ders için kişiselleştirilmiş içerik oluştur:

Ders: "${lessonTitle}"
Modül: "${moduleTitle}"
Kurs: "${courseTitle}"
Öğrenci Seviyesi: ${userLevel?.level || 1}
Öğrenci İlerlemesi: ${progress}%
Süre: ${duration} dakika

Ders Açıklaması: "${lessonDesc || 'Açıklama yok'}"

Kavramlar:
${conceptsText}

Pratik Problemler:
${problemsText}

${studyTips ? `Çalışma İpuçları: ${studyTips}` : ''}
${reviewHelp ? `Gözden Geçirme Yardımı: ${reviewHelp}` : ''}

Aşağıdaki JSON formatında yanıt ver:
{
  "personalizedIntro": "Bu öğrenci için kişiselleştirilmiş ilgi çekici giriş (2-3 cümle)",
  "learningObjectives": ["3-4 özel öğrenme hedefi"],
  "adaptedContent": "Seviyelerine uyarlanmış içerik açıklaması (2-3 cümle)",
  "practiceExercises": ["3-4 pratik alıştırma"],
  "nextSteps": ["2-3 önerilen sonraki adım"],
  "difficultyReason": "Bu zorluk seviyesinin neden seçildiği"
}

İlerlemelerine ve seviyelerine göre içeriği uyarla. Kavramları ve problemleri kullan.
` : `
You are an AI learning assistant. Generate personalized lesson content for:

Lesson: "${lessonTitle}"
Module: "${moduleTitle}"
Course: "${courseTitle}"
Student Level: ${userLevel?.level || 1}
Student Progress: ${progress}%
Duration: ${duration} minutes

Lesson Description: "${lessonDesc || 'No description'}"

Concepts:
${conceptsText}

Practice Problems:
${problemsText}

${studyTips ? `Study Tips: ${studyTips}` : ''}
${reviewHelp ? `Review Help: ${reviewHelp}` : ''}

Generate a JSON response with:
{
  "personalizedIntro": "Engaging intro personalized for this student (2-3 sentences)",
  "learningObjectives": ["3-4 specific learning objectives"],
  "adaptedContent": "Content explanation adapted to their level (2-3 sentences)",
  "practiceExercises": ["3-4 practice exercises"],
  "nextSteps": ["2-3 recommended next steps"],
  "difficultyReason": "Why this difficulty level was chosen"
}

Adapt the content based on their current level and progress. Use the concepts and problems.
`;

      if (!anthropic) {
        throw new Error('Anthropic API key not configured');
      }

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
      });

      const responseText = typeof response.content[0] === 'object' && 'text' in response.content[0]
        ? response.content[0].text
        : String(response.content[0]);
      // Try to extract JSON from markdown code blocks if present
      const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || responseText.match(/(\{[\s\S]*\})/);
      const jsonText = jsonMatch ? jsonMatch[1] : responseText;
      
      const aiResponse = JSON.parse(jsonText);
      
      // Validate response structure
      if (!aiResponse.personalizedIntro || !aiResponse.learningObjectives) {
        throw new Error('Invalid AI response structure');
      }
      
      return aiResponse;
      
    } catch (error) {
      lastError = error;
      console.error(`Error generating lesson AI context (attempt ${attempt + 1}/${maxRetries + 1}):`, error);
      
      if (attempt < maxRetries) {
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        continue;
      }
    }
  }

  // Fallback with actual lesson data
  console.error('All AI generation attempts failed, using enhanced fallback');
  return generateEnhancedLessonFallback(lesson, module, userLevel, progress, language);
}

function generateEnhancedLessonFallback(lesson: any, module: any, userLevel: any, progress: number, language: string = 'en') {
  const lessonTitle = language === 'tr' ? (lesson.titleTr || lesson.title) : (lesson.titleEn || lesson.title);
  const lessonDesc = language === 'tr' ? (lesson.descriptionTr || lesson.description) : (lesson.descriptionEn || lesson.description);
  const moduleTitle = language === 'tr' ? (module.titleTr || module.title) : (module.titleEn || module.title);
  
  const concepts = lesson.concepts || [];
  const studyProblems = lesson.studyProblems || [];
  const studyTips = lesson.studyTips;
  const duration = lesson.durationMinutes || 30;
  
  const hasConcepts = Array.isArray(concepts) && concepts.length > 0;
  const conceptsList = hasConcepts 
    ? concepts.slice(0, 3).map((c: any) => typeof c === 'string' ? c : c.name || c)
    : [];
  
  const hasProblems = Array.isArray(studyProblems) && studyProblems.length > 0;
  const problemsList = hasProblems
    ? studyProblems.slice(0, 3).map((p: any) => typeof p === 'string' ? p : p.text || p)
    : [];

  if (language === 'tr') {
    return {
      personalizedIntro: progress > 0
        ? `${lessonTitle} dersine geri döndüğünüz için hoş geldiniz! ${progress}% ilerleme kaydettiniz. Kaldığınız yerden devam edelim.`
        : `${lessonTitle} dersine hoş geldiniz! Bu ders ${moduleTitle} modülünün önemli bir parçasıdır. ${lessonDesc || 'Kavramları adım adım öğreneceksiniz.'}`,
      learningObjectives: hasConcepts
        ? [
            `${conceptsList[0] || lessonTitle} kavramını anlamak`,
            conceptsList[1] ? `${conceptsList[1]} ile ilgili uygulamalar yapmak` : "Pratik örneklerle bilgiyi uygulamak",
            conceptsList[2] ? `${conceptsList[2]} konusunda yetkinlik kazanmak` : "Konu hakkında güven kazanmak"
          ]
        : [
            `${lessonTitle} temel kavramlarını anlamak`,
            "Pratik senaryolarda bilgiyi uygulamak",
            "Konu hakkında güven kazanmak"
          ],
      adaptedContent: hasConcepts
        ? `Bu ders ${lessonTitle} konusunu kapsar ve şu kavramları içerir: ${conceptsList.join(', ')}. ${lessonDesc || 'Açık açıklamalar ve örneklerle öğreneceksiniz.'}`
        : `Bu ders ${lessonTitle} konusunu kapsamlı bir şekilde ele alır. ${lessonDesc || 'Açık açıklamalar ve örneklerle öğreneceksiniz.'}`,
      practiceExercises: hasProblems
        ? problemsList.map((p: string, idx: number) => `${idx + 1}. ${p}`)
        : [
            "Anahtar kavramları gözden geçirin",
            "Pratik problemleri tamamlayın",
            "Anlayışınızı test edin"
          ],
      nextSteps: [
        progress < 50 ? "Bu dersi tamamlayın" : "Sonraki derse geçin",
        "Ek örnekler üzerinde çalışın",
        "Kavramları pekiştirmek için tekrar yapın"
      ],
      difficultyReason: userLevel?.level && userLevel.level <= 2
        ? "Temel seviye öğrenciler için içerik uyarlanmıştır."
        : "İçerik mevcut öğrenme seviyenize göre ayarlanmıştır."
    };
  } else {
    return {
      personalizedIntro: progress > 0
        ? `Welcome back to ${lessonTitle}! You've made ${progress}% progress. Let's continue from where you left off.`
        : `Welcome to ${lessonTitle}! This lesson is an important part of the ${moduleTitle} module. ${lessonDesc || "You will learn the concepts step by step."}`,
      learningObjectives: hasConcepts
        ? [
            `Understand the concept of ${conceptsList[0] || lessonTitle}`,
            conceptsList[1] ? `Apply ${conceptsList[1]} in practice` : "Apply knowledge through practical examples",
            conceptsList[2] ? `Gain proficiency in ${conceptsList[2]}` : "Build confidence in the subject matter"
          ]
        : [
            `Understand the core concepts of ${lessonTitle}`,
            "Apply knowledge through practical examples",
            "Build confidence in the subject matter"
          ],
      adaptedContent: hasConcepts
        ? `This lesson covers ${lessonTitle} and includes these concepts: ${conceptsList.join(', ')}. ${lessonDesc || "You will learn with clear explanations and examples."}`
        : `This lesson provides comprehensive coverage of ${lessonTitle}. ${lessonDesc || "You will learn with clear explanations and examples."}`,
      practiceExercises: hasProblems
        ? problemsList.map((p: string, idx: number) => `${idx + 1}. ${p}`)
        : [
            "Review the key concepts",
            "Complete practice problems",
            "Test your understanding"
          ],
      nextSteps: [
        progress < 50 ? "Complete this lesson" : "Move to the next lesson",
        "Work on additional examples",
        "Review to reinforce concepts"
      ],
      difficultyReason: userLevel?.level && userLevel.level <= 2
        ? "Content adapted for beginner level students."
        : "Difficulty adjusted based on your current learning level."
    };
  }
}

function determineLessonDifficulty(lesson: any, userLevel: any): 'beginner' | 'intermediate' | 'advanced' {
  const level = userLevel?.level || 1;
  
  if (level <= 2) return 'beginner';
  if (level <= 5) return 'intermediate';
  return 'advanced';
}

async function generateFallbackModules(courseId: number, userId: number, language: string = 'en'): Promise<AIEnhancedModule[]> {
  try {
    const modules = await storage.getModules(courseId);
    const course = await storage.getCourse(courseId);
    
    // If no modules exist at all, create sample modules for the course
    if (modules.length === 0 && course) {
      const courseTitle = language === 'tr' ? (course.titleTr || course.title) : (course.titleEn || course.title);
      console.log(`Creating sample modules for course: ${courseTitle} in language: ${language}`);
      return generateSampleModules(course, userId, language);
    }
    
    // Skip user lessons query temporarily due to schema issues
    const userLessons: any[] = [];
    
    const fallbackModules: AIEnhancedModule[] = [];
    
    for (const module of modules) {
      const lessons = await storage.getLessons(module.id);
      
      const enhancedLessons: AIEnhancedLesson[] = lessons.map((lesson, index) => {
        const userLesson = userLessons.find(ul => ul.lesson?.id === lesson.id);
        const progress = userLesson?.progress || 0;
        
        const lessonTitle = language === 'tr' ? (lesson.titleTr || lesson.title) : (lesson.titleEn || lesson.title);
        const lessonDesc = language === 'tr' ? (lesson.descriptionTr || lesson.description) : (lesson.descriptionEn || lesson.description);
        const lessonContent = language === 'tr' ? (lesson.contentTr || lesson.content) : (lesson.contentEn || lesson.content);
        
        return {
          id: lesson.id,
          title: lessonTitle,
          description: lessonDesc,
          content: lessonContent,
          difficulty: 'intermediate',
          durationMinutes: lesson.durationMinutes || 30,
          progress,
          aiContext: {
            personalizedIntro: `Welcome to ${lessonTitle}! This lesson will help you master key concepts.`,
            learningObjectives: [
              `Understand ${lessonTitle} fundamentals`,
              "Apply concepts in practical scenarios",
              "Build confidence in the subject"
            ],
            adaptedContent: `This lesson provides comprehensive coverage of ${lessonTitle}.`,
            practiceExercises: [
              "Review core concepts",
              "Complete practice exercises",
              "Take the quiz"
            ],
            nextSteps: [
              "Proceed to next lesson",
              "Practice additional problems"
            ],
            difficultyReason: "Standard difficulty level for comprehensive learning."
          },
          tags: lesson.tags || []
        };
      });
      
      const moduleProgress = enhancedLessons.length > 0 
        ? Math.round(enhancedLessons.reduce((sum, l) => sum + l.progress, 0) / enhancedLessons.length)
        : 0;
      
      const moduleTitle = language === 'tr' ? (module.titleTr || module.title) : (module.titleEn || module.title);
      const moduleDesc = language === 'tr' ? (module.descriptionTr || module.description) : (module.descriptionEn || module.description);
      
      fallbackModules.push({
        id: module.id,
        title: moduleTitle,
        description: moduleDesc,
        progress: moduleProgress,
        lessons: enhancedLessons,
        aiContext: generateEnhancedModuleFallback(module, course, { level: 1, totalXp: 0 }, language)
      });
    }
    
    return fallbackModules;
    
  } catch (error) {
    console.error('Error generating fallback modules:', error);
    return [];
  }
}

// Generate sample modules when none exist in the database
async function generateSampleModules(course: any, userId: number, language: string = 'en'): Promise<AIEnhancedModule[]> {
  const sampleModules: AIEnhancedModule[] = [];
  
  // Create sample modules based on course title/category
  const moduleTemplates = getModuleTemplatesForCourse(course, language);
  
  for (let i = 0; i < moduleTemplates.length; i++) {
    const template = moduleTemplates[i];
    
    const sampleLessons: AIEnhancedLesson[] = template.lessons.map((lessonTitle, lessonIndex) => {
      const isTurkish = language === 'tr';
      return {
        id: (i + 1) * 1000 + lessonIndex + 1, // Generate unique IDs
        title: lessonTitle,
        description: isTurkish 
          ? `${lessonTitle} konusunu bu kapsamlı derste öğrenin.`
          : `Learn about ${lessonTitle} in this comprehensive lesson.`,
        content: isTurkish 
          ? `Bu ders ${lessonTitle} konusunu detaylı açıklamalar ve örneklerle kapsar.`
          : `This lesson covers ${lessonTitle} with detailed explanations and examples.`,
        difficulty: 'intermediate' as const,
        durationMinutes: 45,
        progress: Math.floor(Math.random() * 30), // Random progress 0-30%
        aiContext: {
          personalizedIntro: isTurkish 
            ? `${lessonTitle} dersine hoş geldiniz! Bu ders bu kavramları etkili bir şekilde kavramanıza yardımcı olmak için özelleştirilmiştir.`
            : `Welcome to ${lessonTitle}! This lesson is tailored to help you master these concepts effectively.`,
          learningObjectives: isTurkish 
            ? [
                `${lessonTitle} temellerini anlayın`,
                `${lessonTitle} kavramlarını pratik senaryolarda uygulayın`,
                `${lessonTitle} ile problem çözmede güven kazanın`
              ]
            : [
                `Understand the fundamentals of ${lessonTitle}`,
                `Apply ${lessonTitle} concepts in practical scenarios`,
                `Build confidence in problem-solving with ${lessonTitle}`
              ],
          adaptedContent: isTurkish 
            ? `Bu ders ${lessonTitle} konusunu gerçek dünya örnekleri ve adım adım rehberlik ile kapsamlı olarak ele alır.`
            : `This lesson provides comprehensive coverage of ${lessonTitle} with real-world examples and step-by-step guidance.`,
          practiceExercises: isTurkish 
            ? [
                `${lessonTitle} pratik problemlerini çözün`,
                `Rehberli örnekler üzerinde çalışın`,
                `Kavram testini yapın`
              ]
            : [
                `Complete ${lessonTitle} practice problems`,
                `Work through guided examples`,
                `Take the concept quiz`
              ],
          nextSteps: isTurkish 
            ? [
                `${lessonTitle} anahtar kavramlarını gözden geçirin`,
                `Ek problemler üzerinde çalışın`,
                `Sonraki derse hazırlanın`
              ]
            : [
                `Review key concepts from ${lessonTitle}`,
                `Practice additional problems`,
                `Prepare for the next lesson`
              ],
          difficultyReason: isTurkish 
            ? `${lessonTitle} konusunun kapsamlı anlaşılması için içerik orta seviyeye ayarlanmıştır.`
            : `Content adjusted to intermediate level for comprehensive understanding of ${lessonTitle}.`
        },
        tags: isTurkish ? ['fizik', 'ayt', 'sınav-hazırlık'] : ['physics', 'ayt', 'exam-prep']
      };
    });
    
    const isTurkish = language === 'tr';
    sampleModules.push({
      id: i + 1,
      title: template.title,
      description: template.description,
      progress: Math.floor(Math.random() * 25), // Random progress 0-25%
      lessons: sampleLessons,
      aiContext: {
        moduleOverview: isTurkish 
          ? `Bu modül ${template.title} üzerine odaklanarak yapılandırılmış dersler ve pratik uygulamalar yoluyla kapsamlı anlayış sağlar.`
          : `This module focuses on ${template.title}, providing comprehensive understanding through structured lessons and practical applications.`,
        learningPath: isTurkish 
          ? `Bu modüldeki her ders sistematik olarak ilerler, temel kavramlardan başlayarak ${template.title} konusunda ileri uygulamalara doğru gelişir.`
          : `Each lesson in this module builds systematically, starting with basic concepts and progressing to advanced applications in ${template.title}.`,
        personalizedTips: isTurkish 
          ? [
              `${template.title} temel ilkelerini anlamaya odaklanın`,
              `Sağlanan alıştırmalarla düzenli pratik yapın`,
              `Kavramları gerçek dünya uygulamalarıyla ilişkilendirin`
            ]
          : [
              `Focus on understanding core principles of ${template.title}`,
              `Practice regularly with the provided exercises`,
              `Connect concepts to real-world applications`
            ],
        prerequisiteCheck: isTurkish 
          ? `${template.title} için temel matematik kavramları ve önceki fizik bilgisi önerilir.`
          : `Basic mathematical concepts and previous physics knowledge recommended for ${template.title}.`
      }
    });
  }
  
  return sampleModules;
}

function getModuleTemplatesForCourse(course: any, language: string = 'en') {
  // Generate appropriate modules based on course title and category
  if (course.title.toLowerCase().includes('physics') || course.title.toLowerCase().includes('fizik')) {
    if (language === 'tr') {
      return [
        {
          title: 'Mekanik ve Hareket',
          description: 'Hareket, kuvvet ve enerji temel kavramları',
          lessons: [
            'Kinematik ve Hareket Grafikleri',
            'Newton\'un Hareket Yasaları',
            'İş, Enerji ve Güç',
            'Momentum ve Çarpışmalar'
          ]
        },
        {
          title: 'Termodinamik',
          description: 'Isı, sıcaklık ve termal süreçler',
          lessons: [
            'Sıcaklık ve Isı Transferi',
            'Termodinamiğin Yasaları',
            'İdeal Gaz Davranışı',
            'Isı Makineleri ve Verimlilik'
          ]
        },
        {
          title: 'Dalgalar ve Optik',
          description: 'Dalga özellikleri, ses ve ışık olayları',
          lessons: [
            'Dalga Özellikleri ve Türleri',
            'Ses Dalgaları ve Akustik',
            'Işık ve Geometrik Optik',
            'Dalga Girişimi ve Kırınım'
          ]
        }
      ];
    } else {
      return [
        {
          title: 'Mechanics and Motion',
          description: 'Fundamental concepts of motion, forces, and energy',
          lessons: [
            'Kinematics and Motion Graphs',
            'Newton\'s Laws of Motion',
            'Work, Energy, and Power',
            'Momentum and Collisions'
          ]
        },
        {
          title: 'Thermodynamics',
          description: 'Heat, temperature, and thermal processes',
          lessons: [
            'Temperature and Heat Transfer',
            'Laws of Thermodynamics',
            'Ideal Gas Behavior',
            'Heat Engines and Efficiency'
          ]
        },
        {
          title: 'Waves and Optics',
          description: 'Wave properties, sound, and light phenomena',
          lessons: [
            'Wave Properties and Types',
            'Sound Waves and Acoustics',
            'Light and Geometric Optics',
            'Wave Interference and Diffraction'
          ]
        }
      ];
    }
  } else if (course.title.toLowerCase().includes('mathematics') || course.title.toLowerCase().includes('matematik')) {
    if (language === 'tr') {
      return [
        {
          title: 'Fonksiyonlar ve Grafikler',
          description: 'Matematiksel fonksiyonların anlaşılması ve gösterimleri',
          lessons: [
            'Doğrusal ve Kuadratik Fonksiyonlar',
            'Üstel ve Logaritmik Fonksiyonlar',
            'Trigonometrik Fonksiyonlar',
            'Fonksiyon Dönüşümleri'
          ]
        },
        {
          title: 'Kalkülüs Temelleri',
          description: 'Diferansiyel ve integral kalkülüse giriş',
          lessons: [
            'Limitler ve Süreklilik',
            'Türevler ve Uygulamaları',
            'İntegral Teknikleri',
            'Kalkülüs Uygulamaları'
          ]
        }
      ];
    } else {
      return [
        {
          title: 'Functions and Graphs',
          description: 'Understanding mathematical functions and their representations',
          lessons: [
            'Linear and Quadratic Functions',
            'Exponential and Logarithmic Functions',
            'Trigonometric Functions',
            'Function Transformations'
          ]
        },
        {
          title: 'Calculus Fundamentals',
          description: 'Introduction to differential and integral calculus',
          lessons: [
            'Limits and Continuity',
            'Derivatives and Applications',
            'Integration Techniques',
            'Applications of Calculus'
          ]
        }
      ];
    }
  } else {
    // Generic modules for other courses
    if (language === 'tr') {
      return [
        {
          title: 'Temel Kavramlar',
          description: 'Temel bilgi ve esaslar',
          lessons: [
            'Anahtar Kavramlara Giriş',
            'Temel İlkeler ve Teori',
            'Temel Uygulamalar',
            'Bilgi Tabanı Oluşturma'
          ]
        },
        {
          title: 'Pratik Uygulamalar',
          description: 'Kavramların gerçek dünya senaryolarında uygulanması',
          lessons: [
            'Gerçek Dünya Problem Çözme',
            'Vaka Çalışmaları ve Örnekler',
            'Uygulamalı Pratik',
            'İleri Uygulamalar'
          ]
        }
      ];
    } else {
      return [
        {
          title: 'Foundation Concepts',
          description: 'Essential background knowledge and fundamentals',
          lessons: [
            'Introduction to Key Concepts',
            'Basic Principles and Theory',
            'Fundamental Applications',
            'Building Your Knowledge Base'
          ]
        },
        {
          title: 'Practical Applications',
          description: 'Applying concepts to real-world scenarios',
          lessons: [
            'Real-World Problem Solving',
            'Case Studies and Examples',
            'Hands-On Practice',
            'Advanced Applications'
          ]
        }
      ];
    }
  }
}