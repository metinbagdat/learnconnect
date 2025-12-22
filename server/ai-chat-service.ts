import { storage } from "./storage.js";
import { callAIWithFallback } from "./ai-provider-service.js";

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export interface ChatHistory {
  userId: number;
  messages: ChatMessage[];
  lastUpdated: Date;
}

// In-memory chat history storage (could be moved to database later)
const chatHistories = new Map<number, ChatHistory>();

const STUDY_COMPANION_SYSTEM_PROMPT = `You are an advanced AI Study Companion for the EduLearn platform, designed to help students master their enrolled courses. Your role is to explain course concepts systematically and hierarchically.

## CRITICAL - COURSE-SPECIFIC LEARNING:
- **ONLY** discuss concepts from the student's current course and its modules
- List course concepts in a structured, numbered format
- Explain each concept with examples and applications
- Show how concepts relate to other topics in the SAME course
- When no message is provided, suggest key concepts from the course
- Help students understand the hierarchical structure: Course → Module → Concepts

## Your Capabilities:
1. **Course Concept Expert**: List and explain concepts FROM THE ENROLLED COURSE:
   - Extract concepts from course modules and lessons
   - Present concepts in a numbered list
   - Provide clear explanations with course-relevant examples
   - Show concept prerequisites and relationships
   - Build understanding from fundamentals to advanced topics

2. **Module-Based Learning**: Follow course structure:
   - Reference specific modules when discussing topics
   - Explain how concepts connect across modules
   - Guide through course progression sequentially

3. **Problem Solver**: Help students work through practice problems using course concepts

4. **Study Strategy Advisor**: Suggest study methods for mastering course concepts

5. **Multilingual Support**: Communicate in Turkish or English based on student preference

## MANDATORY Response Guidelines:
- **Response Type 1 (Concept Listing)**: When user asks about topic or sends empty message:
  1. List main course concepts (numbered)
  2. Explain each concept (2-3 sentences)
  3. Show relationships between concepts
  4. End with: "Which concept would you like to explore deeper?"

- **Response Type 2 (Detailed Explanation)**: When user asks about specific concept:
  1. Define the concept clearly
  2. Provide step-by-step explanation
  3. Give real-world applications
  4. Connect to other course concepts
  5. Suggest related concepts to learn next

- **Response Type 3 (Suggestions)**: Always suggest NEW concepts when appropriate:
  - "Now that you understand [Concept A], you might want to learn about [Concept B]..."
  - Suggest concepts the student hasn't covered yet

## Response Format:
- Use numbered lists for concepts
- Use headers for clarity
- Include examples and applications
- Be conversational but precise
- Always reference the course/module name
- End with a question or suggestion to continue learning

## RESTRICTIONS:
- Do NOT discuss topics outside the student's enrolled courses
- Do NOT use generic examples - use course-specific examples
- Do NOT suggest unrelated concepts
- Focus 100% on helping master the CURRENT COURSE content`;

/**
 * Process a chat message with context awareness
 */
export async function processStudyCompanionChat(
  userId: number,
  message: string,
  courseId?: number,
  lessonId?: number
): Promise<string> {
  try {
    // Get or create chat history for this user
    let chatHistory = chatHistories.get(userId);
    if (!chatHistory) {
      chatHistory = {
        userId,
        messages: [{ role: 'system', content: STUDY_COMPANION_SYSTEM_PROMPT }],
        lastUpdated: new Date()
      };
      chatHistories.set(userId, chatHistory);
    }

    // Get user context for personalized responses
    const user = await storage.getUser(userId);
    const userCourses = await storage.getUserCourses(userId);
    const userLevel = await storage.getUserLevel(userId);

    // Build context about the user
    let contextInfo = '';
    let courseList = '';
    
    if (user) {
      contextInfo += `Student: ${user.displayName}\n`;
      if (userLevel) {
        contextInfo += `Level: ${userLevel.level} (${userLevel.currentXp} XP)\n`;
      }
      
      if (userCourses.length > 0) {
        contextInfo += `Enrolled Courses:\n`;
        userCourses.forEach(uc => {
          contextInfo += `- ${uc.course.title} (${Math.round(uc.progress)}% complete)\n`;
          courseList += `${uc.course.title}, `;
        });
      }
    }

    // Add specific course context if provided
    let courseContext = '';
    let courseModulesConcepts = '';
    
    if (courseId) {
      try {
        const course = await storage.getCourse(courseId);
        if (course) {
          courseContext += `\n=== CURRENT COURSE ===\n`;
          courseContext += `Course: ${course.titleEn || course.title}\n`;
          courseContext += `Turkish: ${course.titleTr}\n`;
          courseContext += `Category: ${course.category}\n`;
          courseContext += `Description: ${course.descriptionEn || course.description}\n`;
          
          // Fetch modules and lessons for course structure
          const modules = await storage.getModules(courseId);
          if (modules && modules.length > 0) {
            courseContext += `\n=== COURSE MODULES & CONCEPTS ===\n`;
            courseModulesConcepts = `COURSE CONCEPTS GUIDE:\n`;
            
            for (const module of modules) {
              const moduleName = module.titleEn || module.title;
              const moduleTr = module.titleTr;
              courseContext += `\nModule: ${moduleName} (${moduleTr})\n`;
              courseModulesConcepts += `- ${moduleName}: ${module.descriptionEn || module.description}\n`;
              
              // Get lessons for each module
              const lessons = await storage.getLessons(module.id);
              if (lessons && lessons.length > 0) {
                lessons.forEach((lesson, idx) => {
                  const lessonName = lesson.titleEn || lesson.title;
                  courseContext += `  ${idx + 1}. ${lessonName}\n`;
                  courseModulesConcepts += `  • ${lessonName}\n`;
                });
              }
            }
          }
        }
        
        if (lessonId) {
          courseContext += `\nCurrently working on Lesson ID: ${lessonId}\n`;
        }
      } catch (error) {
        console.error('Error fetching course context:', error);
      }
    } else if (userCourses.length > 0) {
      // If no specific courseId, use first enrolled course
      const firstCourse = userCourses[0].course;
      if (firstCourse) {
        courseContext += `\n=== PRIMARY COURSE ===\n`;
        courseContext += `Course: ${firstCourse.titleEn || firstCourse.title}\n`;
        courseContext += `Turkish: ${firstCourse.titleTr}\n`;
        
        try {
          const modules = await storage.getModules(firstCourse.id);
          if (modules && modules.length > 0) {
            courseContext += `\nMain Topics:\n`;
            modules.forEach(m => {
              courseContext += `- ${m.titleEn || m.title}\n`;
            });
          }
        } catch (error) {
          console.error('Error fetching course modules:', error);
        }
      }
    }

    // Prepare the conversation context
    const contextMessage = contextInfo + courseContext + (courseModulesConcepts ? `\n${courseModulesConcepts}` : '');
    
    // Create user message - if empty, generate suggestion prompt focused on course concepts
    const userMessageContent = message.trim() || `I'm ready to study. Please list the KEY CONCEPTS from my current course modules and explain each one briefly. Help me understand what topics I should master.`;
    
    // Add user message to history
    chatHistory.messages.push({
      role: 'user',
      content: userMessageContent,
      timestamp: new Date()
    });

    // Keep last 10 messages for context (to avoid token limits)
    const recentMessages = chatHistory.messages.slice(-10);
    
    // Prepare messages for OpenAI
    const aiMessages: ChatMessage[] = [
      { role: 'system' as const, content: STUDY_COMPANION_SYSTEM_PROMPT },
      ...(contextMessage ? [{ role: 'system' as const, content: `Student Context:\n${contextMessage}` }] : []),
      ...recentMessages.filter(msg => msg.role !== 'system')
    ];

    // Get AI response using unified provider
    const aiResult = await callAIWithFallback({
      messages: aiMessages,
      temperature: 0.7,
      maxTokens: 800,
    });
    
    const aiResponse = aiResult.content;
    if (!aiResponse) {
      throw new Error("Empty response from AI");
    }

    // Add AI response to history
    chatHistory.messages.push({
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date()
    });

    // Update last activity
    chatHistory.lastUpdated = new Date();

    return aiResponse;

  } catch (error) {
    console.error('Error in AI chat processing:', error);
    
    // Fallback response
    const fallbackResponses = [
      "I'm having trouble processing your question right now. Could you please try rephrasing it?",
      "I'm experiencing some technical difficulties. In the meantime, try reviewing your course materials or checking the lesson content.",
      "Sorry, I can't respond properly at the moment. Please try asking your question again in a few minutes.",
    ];
    
    return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
  }
}

/**
 * Get chat history for a user
 */
export function getChatHistory(userId: number): ChatMessage[] {
  const history = chatHistories.get(userId);
  return history ? history.messages.filter(msg => msg.role !== 'system') : [];
}

/**
 * Clear chat history for a user
 */
export function clearChatHistory(userId: number): boolean {
  return chatHistories.delete(userId);
}

/**
 * Generate study tips based on user's current courses and progress
 */
export async function generateStudyTips(userId: number): Promise<string[]> {
  try {
    const userCourses = await storage.getUserCourses(userId);
    const userLevel = await storage.getUserLevel(userId);
    
    if (userCourses.length === 0) {
      return [
        "Start by enrolling in a course that matches your interests",
        "Set a regular study schedule and stick to it",
        "Take notes while learning new concepts",
        "Practice regularly with exercises and quizzes"
      ];
    }

    // Analyze courses for personalized tips - filter out null courses
    const courseTitles = userCourses.filter(uc => uc.course).map(uc => uc.course.title).join(', ') || "various courses";
    const avgProgress = userCourses.reduce((sum, uc) => sum + uc.progress, 0) / userCourses.length;

    const prompt = `Generate 3-4 personalized study tips for a student who is:
    - Level ${userLevel?.level || 1} with ${userLevel?.currentXp || 0} XP
    - Enrolled in: ${courseTitles}
    - Average progress across courses: ${Math.round(avgProgress)}%
    
    Focus on practical, actionable advice that will help them succeed in these specific subjects.
    Return as a JSON array of strings.`;

    try {
      if (!openai) {
        throw new Error('OpenAI client not initialized');
      }
      const completion = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are an expert study advisor. Provide practical, personalized study tips." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content;
      if (response) {
        const parsed = JSON.parse(response);
        return parsed.tips || parsed.study_tips || [];
      }
    } catch (aiError) {
      console.warn('AI service unavailable, using fallback tips');
    }

    return [];
  } catch (error) {
    console.error('Error generating study tips:', error);
    return [
      "Review your notes regularly to reinforce learning",
      "Practice active recall by testing yourself",
      "Break study sessions into focused 25-minute intervals",
      "Connect new concepts to things you already know"
    ];
  }
}

/**
 * Generate encouraging messages based on user progress
 */
export async function generateMotivationalMessage(userId: number): Promise<string> {
  try {
    const userCourses = await storage.getUserCourses(userId);
    const userLevel = await storage.getUserLevel(userId);
    
    if (userCourses.length === 0) {
      return "Welcome to your learning journey! Every expert was once a beginner. Take the first step by enrolling in a course that interests you.";
    }

    const completedCourses = userCourses.filter(uc => uc.completed).length;
    const totalProgress = userCourses.reduce((sum, uc) => sum + uc.progress, 0);
    const avgProgress = totalProgress / userCourses.length;

    let message = "";
    
    if (completedCourses > 0) {
      message = `🎉 Congratulations on completing ${completedCourses} course${completedCourses > 1 ? 's' : ''}! `;
    }
    
    if (avgProgress > 75) {
      message += "You're doing amazing! Your dedication to learning is truly impressive. Keep up the excellent work!";
    } else if (avgProgress > 50) {
      message += "You're making great progress! You're more than halfway through your courses. The finish line is in sight!";
    } else if (avgProgress > 25) {
      message += "You're building momentum! Every step forward is progress. Keep going - you've got this!";
    } else {
      message += "Every journey begins with a single step, and you've taken yours! Consistency is key to success.";
    }

    if (userLevel && userLevel.currentXp > 0) {
      message += ` You've earned ${userLevel.currentXp} XP and reached Level ${userLevel.level}!`;
    }

    return message;
    
  } catch (error) {
    console.error('Error generating motivational message:', error);
    return "Keep learning and growing! Every moment you spend studying is an investment in your future success.";
  }
}