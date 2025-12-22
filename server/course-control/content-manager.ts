import { storage } from "../storage.js";
import type { Module, Lesson } from "../../shared/schema.js";

export class ContentManager {
  async createModule(courseId: number, moduleData: any): Promise<Module | undefined> {
    try {
      const module = await storage.createModule({
        ...moduleData,
        courseId,
      });
      console.log("[ContentManager] Module created for course", courseId);
      return module;
    } catch (error) {
      console.error("[ContentManager] Error creating module:", error);
      throw error;
    }
  }

  async getModulesByCourse(courseId: number): Promise<Module[]> {
    try {
      return await storage.getModules(courseId);
    } catch (error) {
      console.error("[ContentManager] Error getting modules:", error);
      return [];
    }
  }

  async createLesson(moduleId: number, lessonData: any): Promise<Lesson | undefined> {
    try {
      const lesson = await storage.createLesson({
        ...lessonData,
        moduleId,
      });
      console.log("[ContentManager] Lesson created for module", moduleId);
      return lesson;
    } catch (error) {
      console.error("[ContentManager] Error creating lesson:", error);
      throw error;
    }
  }

  async getLessonsByModule(moduleId: number): Promise<Lesson[]> {
    try {
      return await storage.getLessons(moduleId);
    } catch (error) {
      console.error("[ContentManager] Error getting lessons:", error);
      return [];
    }
  }

  async getCourseContent(courseId: number) {
    try {
      const modules = await this.getModulesByCourse(courseId);
      const content = {
        courseId,
        modules: [] as any[],
        totalLessons: 0,
        totalDuration: 0,
      };

      for (const module of modules) {
        const lessons = await this.getLessonsByModule(module.id);
        content.modules.push({
          ...module,
          lessons,
        });
        content.totalLessons += lessons.length;
        content.totalDuration += lessons.reduce((sum, l) => sum + (l.durationMinutes || 0), 0);
      }

      return content;
    } catch (error) {
      console.error("[ContentManager] Error getting course content:", error);
      return null;
    }
  }
}

export const contentManager = new ContentManager();
