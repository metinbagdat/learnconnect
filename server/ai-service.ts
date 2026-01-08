import { Course, insertCourseSchema, LearningPath, InsertLearningPath, InsertLearningPathStep } from "../shared/schema.js";
import { z } from "zod";
import { storage } from "./storage.js";
import { callAIWithFallback, parseAIJSON } from "./ai-provider-service.js";
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;
const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }) : null;

// Define InsertCourse type from the schema
type InsertCourse = z.infer<typeof insertCourseSchema>;

// Course generation prompts
const COURSE_GENERATION_SYSTEM_PROMPT = `
You are an expert educational content creator specialized in developing comprehensive course outlines. 
Your task is to create a structured course with detailed modules based on the topic provided.
The output should be in JSON format and should include:
- title: A concise and engaging course title
- description: A detailed overview of what the course covers (150-200 words)
- category: The main category the course belongs to (Programming, Design, Business, etc.)
- moduleCount: The number of modules (between 5-12)
- durationHours: Estimated time to complete the course (between 10-50 hours)
- modules: An array of module objects, each containing:
  - title: The module title
  - description: A brief description of the module content
  - lessons: An array of lesson titles for this module (3-8 lessons per module)
`;

export type GeneratedModule = {
  title: string;
  description: string;
  lessons: string[];
};

export type GeneratedCourse = {
  title: string;
  description: string;
  category: string;
  moduleCount: number;
  durationHours: number;
  modules: GeneratedModule[];
};

/**
 * Generates a full course structure based on a topic and optional parameters
 */
export async function generateCourse(
  topic: string,
  options: {
    level?: "Beginner" | "Intermediate" | "Advanced";
    targetAudience?: string;
    specificFocus?: string;
  } = {}
): Promise<GeneratedCourse> {
  // Create the prompt with all parameters
  let prompt = `Generate a detailed course about "${topic}".`;
  
  if (options.level) {
    prompt += ` The course should be aimed at ${options.level} level students.`;
  }
  
  if (options.targetAudience) {
    prompt += ` The target audience is ${options.targetAudience}.`;
  }
  
  if (options.specificFocus) {
    prompt += ` The course should focus specifically on ${options.specificFocus}.`;
  }
  
  try {
    const result = await callAIWithFallback({
      messages: [
        { role: "system", content: COURSE_GENERATION_SYSTEM_PROMPT },
        { role: "user", content: prompt }
      ],
      maxTokens: 2000,
      temperature: 0.7,
      jsonMode: true,
    });
    
    const parsed = parseAIJSON(result.content, {});
    return parsed as GeneratedCourse;
  } catch (error: any) {
    console.error("Error generating course:", error);
    throw new Error(`Failed to generate course: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Saves a generated course to the database
 */
export async function saveGeneratedCourse(
  generatedCourse: GeneratedCourse,
  instructorId: number
): Promise<Course> {
  // Convert the generated course to the database schema format
  const courseData: InsertCourse = {
    title: generatedCourse.title,
    description: generatedCourse.description,
    category: generatedCourse.category,
    moduleCount: generatedCourse.moduleCount,
    durationHours: generatedCourse.durationHours,
    instructorId: instructorId,
    // Add a generic course image based on category
    imageUrl: `https://placehold.co/600x400/${getCategoryColor(generatedCourse.category)}/FFFFFF/png?text=${encodeURIComponent(generatedCourse.category)}+Course`,
  };
  
  // Save to database
  const createdCourse = await storage.createCourse(courseData);
  return createdCourse;
}

/**
 * Generates course recommendations based on user interests and past courses
 */
export async function generateCourseRecommendations(
  userId: number,
  interests: string[] = [],
  limit: number = 3
): Promise<string[]> {
  // Get user's enrolled courses
  const userCourses = await storage.getUserCourses(userId);
  
  // Extract course titles and categories for context
  const enrolledCourses = userCourses.map(uc => ({
    title: uc.course.title,
    category: uc.course.category,
    completed: uc.completed
  }));
  
  const prompt = `
    The user has taken these courses:
    ${enrolledCourses.map(c => `- "${c.title}" (${c.category})${c.completed ? ' [Completed]' : ''}`).join('\n')}
    
    ${interests.length > 0 ? `The user has expressed interest in: ${interests.join(', ')}` : ''}
    
    Based on this information, suggest ${limit} course topics (just the topics, not full courses) that would be valuable for this user to learn next. Return as a JSON array of strings.
  `;
  
  try {
    const result = await callAIWithFallback({
      messages: [
        { 
          role: "system", 
          content: "You are an expert educational advisor. Provide personalized course recommendations based on a user's learning history and interests." 
        },
        { role: "user", content: prompt }
      ],
      maxTokens: 2000,
      temperature: 0.7,
      jsonMode: true,
    });
    
    const recommendations = parseAIJSON(result.content, { recommendations: [] });
    return recommendations.recommendations || [];
  } catch (error: any) {
    console.error("Error generating recommendations:", error);
    throw new Error(`Failed to generate recommendations: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Helper function to generate a color based on course category
 */
function getCategoryColor(category: string): string {
  const categoryColors: Record<string, string> = {
    'Programming': '3b82f6',
    'Web Development': '14b8a6',
    'Data Science': 'a855f7',
    'Business': 'f59e0b',
    'Design': 'ec4899',
    'Marketing': '06b6d4',
    'Finance': '84cc16',
    'Languages': 'ef4444',
    'Personal Development': '8b5cf6',
  };
  
  // Default color if category not found
  return categoryColors[category] || '64748b';
}

// Learning path types
export type LearningPathStep = {
  courseId: number;
  courseName: string;
  order: number;
  required: boolean;
  notes: string;
};

export type GeneratedLearningPath = {
  title: string;
  description: string;
  goal: string;
  estimatedDuration: number;
  steps: LearningPathStep[];
};

const LEARNING_PATH_SYSTEM_PROMPT = `
You are an expert educational advisor specialized in creating personalized learning paths that are tailored to specific career goals.
Your task is to create a structured learning path based on a user's goal, career field, timeframe, and the available courses.
The output should be in JSON format and should include:
- title: A concise and engaging title for the learning path that reflects both the learning goal and career path
- description: A detailed overview of what this learning path will help the user achieve professionally (100-150 words), with emphasis on career relevance
- goal: The main learning goal (copied from the user's input)
- estimatedDuration: Estimated weeks to complete the learning path (integer, adjust based on the user's timeframe)
- steps: An array of step objects, each containing:
  - courseId: The ID of the course (from the provided course list)
  - courseName: The name of the course (from the provided course list)
  - order: The sequence number (starting from 1)
  - required: Boolean indicating if this course is essential (true) or optional (false)
  - notes: A brief note explaining the course's relevance to both the learning goal and career aspirations (1-2 sentences)

Be sure to structure the path in a logical progression that builds skills incrementally toward the career goal.
Focus on practical, career-relevant skills that would be valuable in the specified profession.
For career transitions or upskilling, emphasize the most directly transferable and in-demand skills first.
`;

/**
 * Generates a learning path based on a user's goal, career field, and available courses
 */
export async function generateLearningPath(
  userId: number,
  goal: string,
  options: {
    careerField?: string;
    timeframe?: string;
  } = {}
): Promise<GeneratedLearningPath> {
  // Get all available courses
  const allCourses = await storage.getCourses();
  
  // Get user's enrolled courses
  const userCourses = await storage.getUserCourses(userId);
  const enrolledCourseIds = userCourses.map(uc => uc.courseId);
  
  // Get user's interests
  const user = await storage.getUser(userId);
  const interests = user?.interests || [];
  
  // Create a list of relevant courses by excluding already enrolled courses
  const availableCourses = allCourses
    .filter(course => !enrolledCourseIds.includes(course.id))
    .map(course => ({
      id: course.id,
      title: course.title,
      category: course.category,
      level: course.level || "Intermediate",
      durationHours: course.durationHours || 10
    }));
  
  // Extract career field and timeframe from options
  const careerField = options.careerField || '';
  const timeframe = options.timeframe || '6 months';
  
  // Estimate number of weeks based on timeframe
  let estimatedWeeks = 12; // default to 12 weeks
  if (timeframe.includes('month')) {
    const months = parseInt(timeframe.split(' ')[0]) || 6;
    estimatedWeeks = months * 4; // roughly 4 weeks per month
  } else if (timeframe.includes('year')) {
    const years = parseInt(timeframe.split(' ')[0]) || 1;
    estimatedWeeks = years * 52; // 52 weeks per year
  }

  const prompt = `
    Create a personalized learning path to help the user achieve this goal: "${goal}"
    
    ${careerField ? `The user's target career field is: ${careerField}` : ''}
    ${timeframe ? `The user plans to complete this learning path in approximately: ${timeframe}` : ''}
    
    Available courses to include in the path:
    ${availableCourses.map(c => `- ID: ${c.id}, Title: "${c.title}", Category: ${c.category}, Level: ${c.level || "Intermediate"}, Duration: ${c.durationHours || 10}h`).join('\n')}
    
    ${interests.length > 0 ? `The user has expressed interest in: ${interests.join(', ')}` : ''}
    
    Important:
    1. Only include courses from the available list
    2. Order courses in a logical progression that builds career-relevant skills step by step
    3. Include 3-7 courses that would help achieve the goal
    4. Mark essential courses as required
    5. Add brief notes for each course explaining its relevance to the goal and the target career field
    6. Focus particularly on skills essential for someone pursuing a career in ${careerField || "the user's field of interest"}
    7. Structure the learning path to be completable within the ${timeframe} timeframe
  `;
  
  try {
    // Try with Claude first if available
    if (process.env.ANTHROPIC_API_KEY && anthropic) {
      try {
        const response = await anthropic.messages.create({
          model: "claude-3-sonnet-20240229",
          system: LEARNING_PATH_SYSTEM_PROMPT,
          max_tokens: 1500,
          temperature: 0.7,
          messages: [{ role: "user", content: prompt }]
        });

        // Process Claude's response
        if (response.content && response.content.length > 0) {
          const contentBlock = response.content[0];
          if ('text' in contentBlock) {
            const text = contentBlock.text;
            // Try to extract JSON from various formats
            const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || 
                             text.match(/```\n([\s\S]*?)\n```/) ||
                             text.match(/{[\s\S]*}/);
                           
            if (jsonMatch) {
              const jsonStr = jsonMatch[1] || jsonMatch[0];
              return JSON.parse(jsonStr) as GeneratedLearningPath;
            }
          }
        }
      } catch (claudeError) {
        console.error("Claude API error, falling back to OpenAI:", claudeError);
        // Continue to OpenAI fallback
      }
    }
    
    // Try OpenAI
    if (!openai) {
      throw new Error('OpenAI API key not configured');
    }
    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: LEARNING_PATH_SYSTEM_PROMPT },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });
      
      const responseContent = completion.choices[0].message.content;
      if (responseContent) {
        return JSON.parse(responseContent) as GeneratedLearningPath;
      }
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      // Fall through to fallback
    }
    
    // If we reach here, both API calls failed or returned invalid data
    console.log("API calls failed, using fallback learning path generator");
    
  } catch (error) {
    console.error("Error generating learning path:", error);
  }
  
  // Always return a fallback plan (either if APIs aren't available or if they fail)
  const careerFieldText = careerField ? ` for a career in ${careerField}` : '';
  const fallbackPath: GeneratedLearningPath = {
    title: `Learning Path: ${goal}${careerFieldText}`,
    description: `A carefully structured learning journey to help you achieve your goal: ${goal}${careerFieldText}. This path has been curated based on your interests, career aspirations, and learning objectives to be completed within ${timeframe}.`,
    goal,
    estimatedDuration: estimatedWeeks,
    steps: availableCourses.slice(0, 5).map((course, index) => ({
      courseId: course.id,
      courseName: course.title,
      order: index + 1,
      required: index < 3, // First 3 courses required
      notes: `This course provides essential knowledge ${careerFieldText ? `and skills for ${careerField}` : ''} to achieve your goal of ${goal}.`
    }))
  };
  
  return fallbackPath;
}

/**
 * Saves a generated learning path to the database
 */
export async function saveLearningPath(
  userId: number,
  generatedPath: GeneratedLearningPath
): Promise<LearningPath> {
  // Create the learning path
  const learningPath = await storage.createLearningPath({
    userId,
    title: generatedPath.title,
    description: generatedPath.description,
    goal: generatedPath.goal,
    estimatedDuration: generatedPath.estimatedDuration,
    progress: 0,
    isAiGenerated: true
  });
  
  // Add all steps
  for (const step of generatedPath.steps) {
    await storage.addLearningPathStep({
      pathId: learningPath.id,
      courseId: step.courseId,
      order: step.order,
      required: step.required,
      notes: step.notes,
      completed: false
    });
  }
  
  return learningPath;
}