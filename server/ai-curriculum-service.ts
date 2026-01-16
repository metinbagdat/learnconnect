import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { 
  Course, Module, Lesson, 
  InsertCourseCurriculum, InsertCurriculumSkill, InsertCurriculumModule,
  InsertUserCurriculum, InsertUserCurriculumTask, InsertCurriculumCheckpoint
} from "../shared/schema.js";
import { storage } from "./storage.js";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Types for curriculum generation
export type GeneratedSkill = {
  titleEn: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  category: "technical" | "analytical" | "practical" | "conceptual";
  estimatedHours: number;
  order: number;
  prerequisites: number[]; // References to other skill indices
  assessmentCriteria: string[];
};

export type GeneratedCurriculumModule = {
  titleEn: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  order: number;
  estimatedDuration: number; // hours
  learningObjectives: string[];
  skillIndex?: number; // Reference to skill being taught
  resources: {
    readings?: string[];
    videos?: string[];
    practice?: string[];
  };
};

export type GeneratedCheckpoint = {
  titleEn: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  checkpointType: "quiz" | "project" | "skill_assessment" | "milestone";
  order: number;
  requiredProgress: number; // percentage
  requiredSkills: number[]; // skill indices
  passingScore: number;
  estimatedDuration: number; // minutes
};

export type GeneratedCurriculum = {
  titleEn: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  goals: string[];
  prerequisites: string[];
  totalDuration: number; // hours
  difficultyLevel: "Beginner" | "Intermediate" | "Advanced";
  skills: GeneratedSkill[];
  modules: GeneratedCurriculumModule[];
  checkpoints: GeneratedCheckpoint[];
};

export type UserProfile = {
  currentLevel: string;
  weeklyStudyHours: number;
  learningPace: "slow" | "normal" | "fast" | "intensive";
  goals: string[];
  strengths: string[];
  weaknesses: string[];
  preferredLanguage: "en" | "tr";
};

// System prompts for curriculum generation
const CURRICULUM_BLUEPRINT_PROMPT = `You are an expert curriculum designer specialized in creating comprehensive, skills-oriented learning programs.

Your task is to analyze course content and create a detailed curriculum blueprint with the following structure:

1. SKILLS FRAMEWORK:
   - Identify 5-10 core skills students will master
   - Each skill should have clear technical/analytical/practical/conceptual categorization
   - Define skill prerequisites and dependencies
   - Estimate hours needed to master each skill
   - Define clear assessment criteria for skill mastery

2. MODULAR STRUCTURE:
   - Break down the curriculum into logical modules (8-15 modules)
   - Each module should focus on developing specific skills
   - Include detailed learning objectives for each module
   - Estimate realistic time for completion
   - Suggest resources (readings, videos, practice materials)

3. CHECKPOINT SYSTEM:
   - Design 4-6 strategic checkpoints throughout the curriculum
   - Mix assessment types: quizzes, projects, skill assessments, milestones
   - Define progress requirements to unlock each checkpoint
   - Set passing scores and estimated completion times

4. BILINGUAL SUPPORT:
   - Provide all titles and descriptions in both English and Turkish
   - Ensure translations are pedagogically appropriate, not literal

Return a comprehensive JSON object with the curriculum structure.`;

const PERSONALIZATION_PROMPT = `You are a personalized learning specialist who adapts curricula to individual student needs.

Given a base curriculum and user profile, your task is to:

1. PACE ADJUSTMENT:
   - Modify module durations based on available study hours
   - Adjust difficulty progression based on current level
   - Account for learning pace preference (slow/normal/fast/intensive)

2. GOAL ALIGNMENT:
   - Prioritize skills and modules that align with user goals
   - Suggest additional focus areas based on stated objectives

3. ADAPTIVE DIFFICULTY:
   - Start from user's current level
   - Identify knowledge gaps based on weaknesses
   - Build on existing strengths

4. PERSONALIZED RECOMMENDATIONS:
   - Suggest specific resources for weak areas
   - Recommend practice activities matching user's learning style

Return personalized curriculum adaptations and recommendations as JSON.`;

const TASK_BREAKDOWN_PROMPT = `You are a learning task designer who creates actionable study plans.

Your task is to break down curriculum modules into daily/weekly tasks that:

1. TASK CHARACTERISTICS:
   - Specific, measurable, achievable daily tasks
   - Balanced mix of study, practice, review activities
   - Appropriate duration (30-120 minutes per task)
   - Clear skill progress contribution

2. SCHEDULING:
   - Distribute tasks across available study days
   - Account for weekly study hour limits
   - Include review and assessment tasks at strategic points

3. PROGRESSION:
   - Follow skill prerequisites and dependencies
   - Gradual difficulty increase
   - Regular reinforcement of previous concepts

Return structured task breakdown with scheduling recommendations as JSON.`;

/**
 * Generate a comprehensive AI-driven curriculum for a course
 */
export async function generateCourseCurriculum(
  course: Course,
  modules: Module[],
  lessons: Lesson[],
  userProfile?: UserProfile
): Promise<GeneratedCurriculum> {
  try {
    // Step 1: Analyze course content and generate base curriculum blueprint
    // Include full lesson data for comprehensive analysis
    const courseContext = {
      course: {
        title: course.titleEn || course.title,
        description: course.descriptionEn || course.description,
        level: course.level,
        category: course.category,
        durationHours: course.durationHours,
      },
      modules: modules.map(m => {
        const moduleLessons = lessons.filter(l => l.moduleId === m.id);
        return {
          title: m.titleEn || m.title,
          description: m.descriptionEn || m.descriptionTr || '',
          order: m.order,
          lessons: moduleLessons.map(l => ({
            title: l.titleEn || l.title,
            description: l.descriptionEn || l.descriptionTr || '',
            content: l.contentEn || l.content || '',
            // estimatedTime: l.estimatedTime, // Not in schema
            // tags: l.tags || [], // Not in schema
            order: l.order,
          })),
        };
      }),
      totalLessons: lessons.length,
    };

    const blueprintPrompt = `Analyze this course and create a comprehensive skills-oriented curriculum:

Course: ${JSON.stringify(courseContext, null, 2)}

Create a curriculum that:
- Identifies core skills students will master
- Organizes content into logical, progressive modules
- Includes strategic checkpoints for assessment
- Provides bilingual content (English and Turkish)
- Estimates realistic time requirements

Return the complete curriculum structure as JSON.`;

    // Use Anthropic Claude for pedagogical design (better at structured thinking)
    const blueprintResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      system: CURRICULUM_BLUEPRINT_PROMPT,
      messages: [{
        role: "user",
        content: blueprintPrompt
      }]
    });

    const blueprintContent = blueprintResponse.content[0].type === 'text' 
      ? blueprintResponse.content[0].text 
      : '';
    
    // Extract JSON from markdown code blocks if present
    const jsonMatch = blueprintContent.match(/```json\n([\s\S]*?)\n```/) || 
                     blueprintContent.match(/```\n([\s\S]*?)\n```/);
    const blueprintData = jsonMatch 
      ? JSON.parse(jsonMatch[1]) 
      : JSON.parse(blueprintContent);

    // Step 2: Personalize curriculum if user profile provided
    if (userProfile) {
      const personalizationPrompt = `Personalize this curriculum for the user:

Base Curriculum: ${JSON.stringify(blueprintData, null, 2)}

User Profile:
- Current Level: ${userProfile.currentLevel}
- Weekly Study Hours: ${userProfile.weeklyStudyHours}
- Learning Pace: ${userProfile.learningPace}
- Goals: ${userProfile.goals.join(', ')}
- Strengths: ${userProfile.strengths.join(', ')}
- Weaknesses: ${userProfile.weaknesses.join(', ')}
- Language: ${userProfile.preferredLanguage}

Adapt the curriculum to match the user's profile, adjusting pace, difficulty, and focus areas.
Return the personalized curriculum as JSON.`;

      const personalizationResponse = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 3000,
        system: PERSONALIZATION_PROMPT,
        messages: [{
          role: "user",
          content: personalizationPrompt
        }]
      });

      const personalizationContent = personalizationResponse.content[0].type === 'text'
        ? personalizationResponse.content[0].text
        : '';
      
      const personalizedJsonMatch = personalizationContent.match(/```json\n([\s\S]*?)\n```/) ||
                                   personalizationContent.match(/```\n([\s\S]*?)\n```/);
      const personalizedData = personalizedJsonMatch
        ? JSON.parse(personalizedJsonMatch[1])
        : JSON.parse(personalizationContent);

      return personalizedData as GeneratedCurriculum;
    }

    return blueprintData as GeneratedCurriculum;
  } catch (error: any) {
    console.error("Error generating curriculum:", error);
    throw new Error(`Failed to generate curriculum: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate daily/weekly task breakdown from curriculum
 */
export async function generateCurriculumTasks(
  curriculum: GeneratedCurriculum,
  weeklyHours: number,
  startDate: Date
): Promise<Array<{
  titleEn: string;
  titleTr: string;
  descriptionEn: string;
  descriptionTr: string;
  taskType: "study" | "practice" | "assessment" | "checkpoint";
  scheduledDate: Date;
  estimatedDuration: number;
  skillIndices: number[];
  moduleIndex: number;
}>> {
  try {
    const taskBreakdownPrompt = `Create a detailed task breakdown for this curriculum:

Curriculum: ${JSON.stringify(curriculum, null, 2)}

Constraints:
- Weekly study hours: ${weeklyHours}
- Start date: ${startDate.toISOString()}
- Distribute tasks evenly across available study time
- Balance study, practice, and assessment activities
- Respect skill prerequisites and module order

Generate a complete schedule of daily/weekly tasks that covers the entire curriculum.
Return as JSON array of tasks with scheduling information.`;

    const taskResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 4000,
      system: TASK_BREAKDOWN_PROMPT,
      messages: [{
        role: "user",
        content: taskBreakdownPrompt
      }]
    });

    const taskContent = taskResponse.content[0].type === 'text'
      ? taskResponse.content[0].text
      : '';
    
    const taskJsonMatch = taskContent.match(/```json\n([\s\S]*?)\n```/) ||
                         taskContent.match(/```\n([\s\S]*?)\n```/);
    const taskData = taskJsonMatch
      ? JSON.parse(taskJsonMatch[1])
      : JSON.parse(taskContent);

    // Parse ISO date strings into Date objects for type safety
    const tasks = (taskData.tasks || taskData) as Array<any>;
    return tasks.map(task => ({
      ...task,
      scheduledDate: task.scheduledDate ? new Date(task.scheduledDate) : new Date(),
    }));
  } catch (error: any) {
    console.error("Error generating curriculum tasks:", error);
    throw new Error(`Failed to generate tasks: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Analyze user progress and adapt curriculum
 */
export async function adaptCurriculum(
  userCurriculumId: number,
  progressData: {
    completedSkills: number[];
    skillScores: Record<number, number>;
    completedCheckpoints: number[];
    overallProgress: number;
    timeSpent: number; // hours
    strugglingAreas: string[];
  }
): Promise<{
  adaptations: Record<string, any>;
  recommendations: string[];
  paceAdjustment: "slower" | "maintain" | "faster";
}> {
  try {
    const adaptationPrompt = `Analyze this learning progress and provide adaptive recommendations:

Progress Data: ${JSON.stringify(progressData, null, 2)}

Analyze:
1. Learning pace (too fast/slow/appropriate)
2. Skill mastery patterns
3. Struggling areas needing extra support
4. Areas of strength for acceleration
5. Curriculum adjustments needed

Provide concrete adaptations and recommendations as JSON.`;

    const adaptationResponse = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are an adaptive learning specialist who analyzes student progress and provides personalized curriculum adjustments."
        },
        { role: "user", content: adaptationPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const responseContent = adaptationResponse.choices[0].message.content;
    if (!responseContent) {
      throw new Error("Empty response from AI service");
    }

    return JSON.parse(responseContent);
  } catch (error: any) {
    console.error("Error adapting curriculum:", error);
    throw new Error(`Failed to adapt curriculum: ${error.message || 'Unknown error'}`);
  }
}

/**
 * Generate personalized skill assessment feedback
 */
export async function generateSkillFeedback(
  skillName: string,
  assessmentResults: {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    questionDetails: Array<{
      question: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
    }>;
  },
  language: "en" | "tr" = "en"
): Promise<{
  feedback: string;
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
}> {
  try {
    const feedbackPrompt = `Generate personalized feedback for this skill assessment:

Skill: ${skillName}
Score: ${assessmentResults.score}%
Correct: ${assessmentResults.correctAnswers}/${assessmentResults.totalQuestions}
Time: ${assessmentResults.timeSpent} minutes

Question Analysis:
${JSON.stringify(assessmentResults.questionDetails, null, 2)}

Language: ${language === 'tr' ? 'Turkish' : 'English'}

Provide:
1. Encouraging feedback on performance
2. Specific strengths demonstrated
3. Areas needing improvement
4. Actionable recommendations for mastery

Return as JSON in the specified language.`;

    const feedbackResponse = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: feedbackPrompt
      }]
    });

    const feedbackContent = feedbackResponse.content[0].type === 'text'
      ? feedbackResponse.content[0].text
      : '';
    
    const feedbackJsonMatch = feedbackContent.match(/```json\n([\s\S]*?)\n```/) ||
                             feedbackContent.match(/```\n([\s\S]*?)\n```/);
    const feedbackData = feedbackJsonMatch
      ? JSON.parse(feedbackJsonMatch[1])
      : JSON.parse(feedbackContent);

    return feedbackData;
  } catch (error: any) {
    console.error("Error generating skill feedback:", error);
    throw new Error(`Failed to generate feedback: ${error.message || 'Unknown error'}`);
  }
}
