import { Anthropic } from "@anthropic-ai/sdk";
import { storage } from "./storage.js";
import type { InsertEducationalMaterial } from "../shared/schema.js";

const anthropic = process.env.ANTHROPIC_API_KEY
  ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  : null;

export interface GenerateMaterialOptions {
  userId: number;
  materialType: 'book' | 'slide' | 'text' | 'document' | 'video' | 'link' | 'image';
  courseId?: number;
  subjectArea?: string;
  title?: string;
  description?: string;
  language?: 'en' | 'tr';
}

export interface GeneratedMaterialContent {
  title: string;
  titleEn: string;
  titleTr: string;
  description: string;
  descriptionEn: string;
  descriptionTr: string;
  content: string;
  tags: string[];
  subjectArea?: string;
}

/**
 * Generate educational material content using AI
 */
export async function generateEducationalMaterial(
  options: GenerateMaterialOptions
): Promise<GeneratedMaterialContent> {
  const { userId, materialType, courseId, subjectArea, title, description, language = 'tr' } = options;

  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  try {
    // Get user profile for personalization
    const user = await storage.getUser(userId);
    const userLevel = await storage.getUserLevel(userId);
    const userCourses = courseId ? [] : await storage.getUserCourses(userId);

    // Get course information if courseId provided
    let courseInfo = '';
    if (courseId) {
      const course = await storage.getCourse(courseId);
      if (course) {
        courseInfo = `Course: ${course.title}\nDescription: ${course.description}\n`;
      }
    }

    // Build context for AI
    const context = {
      userLevel: userLevel?.level || 1,
      learningPace: user?.learningPace || 'moderate',
      interests: user?.interests || [],
      courseInfo,
      subjectArea: subjectArea || 'general',
    };

    // Generate material based on type
    const generatedContent = await generateMaterialContent(materialType, context, language, title, description);

    return generatedContent;
  } catch (error: any) {
    console.error('[AI-Material] Error generating material:', error);
    throw new Error(`Failed to generate material: ${error?.message || error}`);
  }
}

/**
 * Generate material content based on type
 */
async function generateMaterialContent(
  type: string,
  context: any,
  language: 'en' | 'tr',
  requestedTitle?: string,
  requestedDescription?: string
): Promise<GeneratedMaterialContent> {
  if (!anthropic) {
    throw new Error('Anthropic API key not configured');
  }

  const isTurkish = language === 'tr';

  const systemPrompt = isTurkish
    ? `Sen bir eğitim materyali üretici AI asistanısın. Öğrenciler için kişiselleştirilmiş, anlaşılır ve etkili eğitim materyalleri oluşturuyorsun.`
    : `You are an educational material generation AI assistant. You create personalized, clear, and effective educational materials for students.`;

  const materialTypePrompts: Record<string, string> = {
    book: isTurkish
      ? 'kitap bölümü veya özeti'
      : 'book chapter or summary',
    slide: isTurkish
      ? 'sunum slaytları içeriği'
      : 'presentation slide content',
    text: isTurkish
      ? 'detaylı metin içeriği'
      : 'detailed text content',
    document: isTurkish
      ? 'doküman içeriği'
      : 'document content',
    video: isTurkish
      ? 'video scripti veya transkript'
      : 'video script or transcript',
    link: isTurkish
      ? 'öğrenme kaynak linki önerisi'
      : 'learning resource link recommendation',
    image: isTurkish
      ? 'görsel açıklama veya infografik içeriği'
      : 'visual description or infographic content',
  };

  const prompt = isTurkish
    ? `
Aşağıdaki kriterlere göre bir ${materialTypePrompts[type] || 'eğitim materyali'} oluştur:

Öğrenci Seviyesi: ${context.userLevel}
Öğrenme Hızı: ${context.learningPace}
İlgi Alanları: ${context.interests.join(', ') || 'Genel'}
${context.courseInfo}
Konu Alanı: ${context.subjectArea}
${requestedTitle ? `İstenen Başlık: ${requestedTitle}` : ''}
${requestedDescription ? `İstenen Açıklama: ${requestedDescription}` : ''}

Aşağıdaki JSON formatında yanıt ver:
{
  "title": "Türkçe başlık",
  "titleEn": "English title",
  "titleTr": "Türkçe başlık",
  "description": "Türkçe açıklama (2-3 cümle)",
  "descriptionEn": "English description (2-3 sentences)",
  "descriptionTr": "Türkçe açıklama (2-3 cümle)",
  "content": "${type === 'text' || type === 'document' ? 'Detaylı içerik metni' : type === 'video' ? 'Video script içeriği' : 'Kısa özet veya açıklama'}",
  "tags": ["etiket1", "etiket2", "etiket3"],
  "subjectArea": "${context.subjectArea}"
}

İçeriği öğrencinin seviyesine ve öğrenme hızına uygun şekilde uyarla. ${type === 'text' || type === 'document' ? 'Detaylı, anlaşılır ve yapılandırılmış bir metin oluştur.' : type === 'video' ? 'Video script formatında, konuşmacı notları ve anahtar noktalar içeren bir içerik oluştur.' : 'Kısa, öz ve öğretici bir içerik oluştur.'}
`
    : `
Create a ${materialTypePrompts[type] || 'educational material'} based on the following criteria:

Student Level: ${context.userLevel}
Learning Pace: ${context.learningPace}
Interests: ${context.interests.join(', ') || 'General'}
${context.courseInfo}
Subject Area: ${context.subjectArea}
${requestedTitle ? `Requested Title: ${requestedTitle}` : ''}
${requestedDescription ? `Requested Description: ${requestedDescription}` : ''}

Respond in the following JSON format:
{
  "title": "Material title",
  "titleEn": "English title",
  "titleTr": "Turkish title",
  "description": "Description (2-3 sentences)",
  "descriptionEn": "English description (2-3 sentences)",
  "descriptionTr": "Turkish description (2-3 sentences)",
  "content": "${type === 'text' || type === 'document' ? 'Detailed content text' : type === 'video' ? 'Video script content' : 'Short summary or description'}",
  "tags": ["tag1", "tag2", "tag3"],
  "subjectArea": "${context.subjectArea}"
}

Adapt the content to the student's level and learning pace. ${type === 'text' || type === 'document' ? 'Create detailed, clear, and structured text.' : type === 'video' ? 'Create content in video script format, including speaker notes and key points.' : 'Create short, concise, and educational content.'}
`;

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    });

    const responseText = typeof response.content[0] === 'object' && 'text' in response.content[0]
      ? response.content[0].text
      : String(response.content[0]);

    // Extract JSON from response
    const jsonMatch = responseText.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) || responseText.match(/(\{[\s\S]*\})/);
    const jsonText = jsonMatch ? jsonMatch[1] : responseText;
    
    const generatedContent = JSON.parse(jsonText);

    // Validate and return
    if (!generatedContent.title || !generatedContent.description) {
      throw new Error('Invalid AI response structure');
    }

    return {
      title: generatedContent.title || generatedContent.titleTr || '',
      titleEn: generatedContent.titleEn || generatedContent.title || '',
      titleTr: generatedContent.titleTr || generatedContent.title || '',
      description: generatedContent.description || generatedContent.descriptionTr || '',
      descriptionEn: generatedContent.descriptionEn || generatedContent.description || '',
      descriptionTr: generatedContent.descriptionTr || generatedContent.description || '',
      content: generatedContent.content || '',
      tags: Array.isArray(generatedContent.tags) ? generatedContent.tags : [],
      subjectArea: generatedContent.subjectArea || context.subjectArea,
    };
  } catch (error: any) {
    console.error('[AI-Material] Error generating material content:', error);
    throw new Error(`Failed to generate material content: ${error?.message || error}`);
  }
}

/**
 * Create and save AI-generated educational material to database
 */
export async function createAIGeneratedMaterial(
  options: GenerateMaterialOptions,
  generatedContent: GeneratedMaterialContent
): Promise<any> {
  const { userId, materialType, courseId, subjectArea } = options;

  const materialData: InsertEducationalMaterial = {
    title: generatedContent.title,
    titleEn: generatedContent.titleEn,
    titleTr: generatedContent.titleTr,
    description: generatedContent.description,
    descriptionEn: generatedContent.descriptionEn,
    descriptionTr: generatedContent.descriptionTr,
    materialType,
    mentorId: null, // AI-generated materials don't have a mentor
    courseId: courseId || null,
    uploadId: null, // For text-based materials, no upload needed
    isAiGenerated: true,
    isPublic: false, // AI materials are private by default
    tags: generatedContent.tags,
    subjectArea: generatedContent.subjectArea || subjectArea || null,
    externalUrl: materialType === 'link' ? generatedContent.content : null,
  };

  const createdMaterial = await storage.createEducationalMaterial(materialData);
  return createdMaterial;
}

