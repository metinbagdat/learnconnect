import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import Anthropic from "@anthropic-ai/sdk";
import { eq } from "drizzle-orm";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

interface PersonalizationResult {
  aiPersonalized: boolean;
  aiPoweredModules: any[];
  personalizedContent: Record<string, any>;
}

export class AIPersonalization {
  async generatePersonalizedContent(
    userId: number,
    courseId: number,
    curriculum: any
  ): Promise<PersonalizationResult> {
    try {
      // Get user profile for personalization
      const users = await db.select().from(schema.users).where(eq(schema.users.id, userId));
      const user = users[0];
      const learningPace = user?.learningPace || "moderate";
      
      console.log(`   [AI-Personalization] User learning pace: ${learningPace}`);

      // Generate personalized modules using AI
      console.log(`   [AI-Personalization] Generating AI-powered modules based on curriculum...`);
      const personalizedModules = await this.generateAIModules(
        curriculum,
        learningPace,
        userId
      );
      console.log(`   [AI-Personalization] ✨ Generated ${personalizedModules.length} AI-powered modules`);

      // Generate personalized content for each module
      const personalizedContent: Record<string, any> = {};
      console.log(`   [AI-Personalization] Generating personalized content for modules...`);
      for (const module of personalizedModules.slice(0, 3)) {
        personalizedContent[module.id] = await this.generateAIContent(
          module,
          learningPace,
          "en"
        );
        console.log(`   [AI-Personalization] ✓ Module "${module.title}" content generated`);
      }

      return {
        aiPersonalized: true,
        aiPoweredModules: personalizedModules,
        personalizedContent,
      };
    } catch (error) {
      console.error("[AIPersonalization] Error generating personalized content:", error);
      return {
        aiPersonalized: false,
        aiPoweredModules: [],
        personalizedContent: {},
      };
    }
  }

  private async generateAIModules(
    curriculum: any,
    learningPace: string,
    userId: number
  ): Promise<any[]> {
    try {
      const prompt = `Given this curriculum structure and user learning pace "${learningPace}", 
generate 3-5 AI-powered personalized modules that adapt the content.
Curriculum: ${JSON.stringify(curriculum?.structureJson || {})}

Return JSON with array of modules, each with:
- id: unique id
- title: personalized title
- adaptiveLevel: adjusted difficulty level
- estimatedDuration: personalized duration in minutes
- focusAreas: array of focus areas for this user
- engagementStrategy: how to keep user engaged`;

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type === "text") {
        const parsed = JSON.parse(content.text);
        return parsed.modules || [];
      }
    } catch (error) {
      console.error("[AIPersonalization] Error generating AI modules:", error);
    }
    return [];
  }

  private async generateAIContent(
    module: any,
    learningPace: string,
    language: string
  ): Promise<any> {
    try {
      const prompt = `Generate personalized learning content for this module adapted to learning pace "${learningPace}":
Module: ${JSON.stringify(module)}
Language: ${language}

Return JSON with:
- mainContent: personalized explanation
- examples: 2-3 relevant examples
- keyTakeaways: 3-4 key points
- practiceExercises: suggested practice activities
- supportingResources: recommended resources`;

      const message = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const content = message.content[0];
      if (content.type === "text") {
        return JSON.parse(content.text);
      }
    } catch (error) {
      console.error("[AIPersonalization] Error generating AI content:", error);
    }
    return {};
  }
}

export const aiPersonalization = new AIPersonalization();
