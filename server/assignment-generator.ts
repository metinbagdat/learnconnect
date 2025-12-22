import { db } from "./db.js";
import * as schema from "../shared/schema.js";
import { eq } from "drizzle-orm";
import { aiIntegration } from "./ai-integration.js";

interface AssignmentGenerationParams {
  moduleId: number;
  moduleName: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  learningStyle: "visual" | "auditory" | "kinesthetic" | "reading";
  learningObjectives: string[];
}

export class AssignmentGenerator {
  async generateAssignment(params: AssignmentGenerationParams): Promise<any> {
    try {
      console.log(`[AssignmentGenerator] Generating ${params.difficulty} assignment for module: ${params.moduleName}`);

      const prompt = this.buildPrompt(params);
      const aiResponse = await aiIntegration.chat(prompt);

      const assignmentData = this.parseAIResponse(aiResponse, params);
      console.log(`[AssignmentGenerator] Generated assignment: ${assignmentData.title}`);

      return assignmentData;
    } catch (error) {
      console.error("[AssignmentGenerator] Error generating assignment:", error);
      throw error;
    }
  }

  async generateAssignmentsForModule(
    courseId: number,
    moduleId: number,
    count: number = 3
  ): Promise<any[]> {
    try {
      const [module] = await db.select()
        .from(schema.modules)
        .where(eq(schema.modules.id, moduleId));

      if (!module) {
        throw new Error("Module not found");
      }

      const assignments = [];
      const difficulties: Array<"beginner" | "intermediate" | "advanced"> = ["beginner", "intermediate", "advanced"];
      const learningStyles: Array<"visual" | "auditory" | "kinesthetic" | "reading"> = ["visual", "auditory", "kinesthetic", "reading"];

      for (let i = 0; i < Math.min(count, difficulties.length); i++) {
        const params: AssignmentGenerationParams = {
          moduleId,
          moduleName: module.title || "Module",
          difficulty: difficulties[i],
          learningStyle: learningStyles[i % learningStyles.length],
          learningObjectives: ["Apply concepts", "Practice problem-solving", "Test comprehension"],
        };

        const assignmentData = await this.generateAssignment(params);

        // Save to database
        const [savedAssignment] = await db.insert(schema.assignments).values({
          title: assignmentData.title,
          description: assignmentData.description,
          courseId,
          dueDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000) as any,
          points: assignmentData.points || 10,
        }).returning();

        assignments.push(savedAssignment);
      }

      console.log(`[AssignmentGenerator] Generated ${assignments.length} assignments for module ${moduleId}`);
      return assignments;
    } catch (error) {
      console.error("[AssignmentGenerator] Error generating assignments:", error);
      throw error;
    }
  }

  private buildPrompt(params: AssignmentGenerationParams): string {
    return `Create a detailed educational assignment with the following specifications:

Module: ${params.moduleName}
Difficulty Level: ${params.difficulty}
Target Learning Style: ${params.learningStyle}
Learning Objectives: ${params.learningObjectives.join(", ")}

Generate a JSON response with exactly this structure (no markdown):
{
  "title": "Assignment title",
  "description": "Detailed assignment description (2-3 sentences)",
  "instructions": ["Step 1", "Step 2", "Step 3"],
  "resources": ["Resource 1", "Resource 2"],
  "estimatedTimeMinutes": number,
  "points": number,
  "rubric": {
    "criterion1": "Description",
    "criterion2": "Description"
  }
}

For ${params.learningStyle} learners, emphasize ${this.getLearningStyleEmphasis(params.learningStyle)}.
For ${params.difficulty} level, ${this.getDifficultyGuidance(params.difficulty)}.

Return ONLY valid JSON, no additional text.`;
  }

  private getLearningStyleEmphasis(style: string): string {
    const emphasis: Record<string, string> = {
      visual: "diagrams, charts, color coding, and visual examples",
      auditory: "discussions, explanations, and verbal descriptions",
      kinesthetic: "hands-on activities, interactive exercises, and practice",
      reading: "text-based materials, detailed documentation, and written examples",
    };
    return emphasis[style] || "practical application";
  }

  private getDifficultyGuidance(difficulty: string): string {
    const guidance: Record<string, string> = {
      beginner: "focus on foundational concepts, provide clear examples, include guided steps",
      intermediate: "build on basics, include problem-solving scenarios, add complexity",
      advanced: "challenge critical thinking, require synthesis of multiple concepts, encourage research",
    };
    return guidance[difficulty] || "provide comprehensive coverage";
  }

  private parseAIResponse(response: string, params: AssignmentGenerationParams): any {
    try {
      const parsed = JSON.parse(response);
      return {
        title: parsed.title || `${params.difficulty} Assignment: ${params.moduleName}`,
        description: parsed.description || "Complete this assignment to demonstrate mastery",
        instructions: parsed.instructions || [],
        resources: parsed.resources || [],
        estimatedTimeMinutes: parsed.estimatedTimeMinutes || 60,
        points: parsed.points || 10,
        rubric: parsed.rubric || {},
      };
    } catch (error) {
      console.error("[AssignmentGenerator] Error parsing AI response:", error);
      return {
        title: `${params.difficulty} Assignment: ${params.moduleName}`,
        description: "Complete this assignment to demonstrate mastery",
        instructions: ["Review the module materials", "Answer all questions", "Submit your work"],
        resources: [],
        estimatedTimeMinutes: 60,
        points: 10,
        rubric: {},
      };
    }
  }
}

export const assignmentGenerator = new AssignmentGenerator();
