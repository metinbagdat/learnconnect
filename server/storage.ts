import {
  eq,
  and,
  or,
  desc,
  inArray,
  asc,
  sql
} from "drizzle-orm";
import { db } from "./db.js";
import * as schema from "@shared/schema";

const {
  users,
  courses,
  enrollments,
  modules,
  lessons,
  assignments,
  submissions,
  quizzes,
  quizAnswers,
  achievements,
  challenges,
  dailyTasks,
  learningPaths,
  studySchedules,
  successMetrics,
  curriculumDesignParameters,
  curriculumSuccessMetrics,
  curriculumFeedbackLoops,
  integrationOrchestrationLogs,
  performanceOptimizationLogs,
  aiLearningData,
  courseIntegrationState,
  moduleIntegrationLog,
  aiRecommendationState,
  learningEcosystemState,
  userCourses,
  userAchievements,
} = schema;

export interface IStorage {
  getUser(id: number): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  getUsers(): Promise<any[]>;
  createUser(user: any): Promise<any>;
  getUserCourses(userId: number): Promise<any[]>;
  getUserAssignments(userId: number): Promise<any[]>;
  getUserAchievements(userId: number): Promise<any[]>;
  getStudySessions(userId: number): Promise<any[]>;
  getUserActiveAndCompletedChallenges(userId: number): Promise<any[]>;
  getUserLevel(userId: number): Promise<any | null>;
  getChallenges(): Promise<any[]>;
  getUserStudyPrograms(userId: number): Promise<any[]>;
  getUserLearningTrails(userId: number): Promise<any[]>;
  getUserLearningStats(userId: number): Promise<any | null>;
  getDailyTasks(userId: number): Promise<any[]>;
  getCourses(): Promise<any[]>;
  getCourse(id: number): Promise<any>;
  createCourse(course: any): Promise<any>;
  updateCourse(id: number, updates: any): Promise<any>;
  getModules(courseId: number): Promise<any[]>;
  getLessons(moduleId: number): Promise<any[]>;
  getUserLessons(userId: number): Promise<any[]>;
  createDesignProcess(design: any): Promise<any>;
  getDesignProcess(id: number): Promise<any>;
  updateDesignProcess(id: number, updates: any): Promise<any>;
  createSuccessMetrics(metrics: any): Promise<any>;
  createFeedbackLoop(loop: any): Promise<any>;
  getFeedbackLoops(designId: number): Promise<any[]>;
  updateFeedbackLoop(id: number, updates: any): Promise<any>;
}

class DatabaseStorage implements IStorage {
  async getUser(id: number) {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting user ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get user'}`);
    }
  }

  async getUserByUsername(username: string) {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting user by username ${username}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get user'}`);
    }
  }

  async getUsers() {
    try {
      return await db.select().from(users);
    } catch (error: any) {
      console.error("[STORAGE] Error getting users:", error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get users'}`);
    }
  }

  async createUser(userData: any) {
    try {
      const [created] = await db.insert(users).values(userData).returning();
      return created;
    } catch (error: any) {
      console.error(`[STORAGE] Error creating user:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create user'}`);
    }
  }

  async getUserCourses(userId: number) {
    try {
      return await db.select().from(userCourses).where(eq(userCourses.userId, userId));
    } catch (error: any) {
      console.error(`[STORAGE] Error getting courses for user ${userId}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get user courses'}`);
    }
  }

  async getCourses() {
    return db.select().from(courses);
  }

  async getUserAssignments(userId: number) {
    try {
      return await db.select().from(assignments).where(eq(assignments.userId, userId));
    } catch (error: any) {
      console.error(`[STORAGE] Error getting assignments for user ${userId}:`, error?.message || error);
      return [];
    }
  }


  async getUserActiveAndCompletedChallenges(userId: number) {
    try {
      // placeholder: return empty
      return [];
    } catch (error: any) {
      console.error(`[STORAGE] Error getting challenges for user ${userId}:`, error?.message || error);
      return [];
    }
  }

  async getUserLevel(userId: number) {
    try {
      const [level] = await db.select().from(schema.userLevels).where(eq(schema.userLevels.userId, userId));
      return level || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting user level ${userId}:`, error?.message || error);
      return null;
    }
  }

  async getChallenges() {
    try {
      return []; // placeholder
    } catch (error: any) {
      console.error(`[STORAGE] Error getting challenges:`, error?.message || error);
      return [];
    }
  }

  async getUserStudyPrograms(_userId: number) {
    return [];
  }

  async getUserLearningTrails(_userId: number) {
    return [];
  }

  async getUserLearningStats(_userId: number) {
    return null;
  }

  async getDailyTasks(_userId: number) {
    return [];
  }

  async getCourse(id: number) {
    const [course] = await db.select().from(courses).where(eq(courses.id, id));
    return course;
  }

  async createCourse(courseData: any) {
    const [created] = await db.insert(courses).values(courseData).returning();
    return created;
  }

  async updateCourse(id: number, updates: any) {
    const [updated] = await db.update(courses).set(updates).where(eq(courses.id, id)).returning();
    return updated;
  }

  async createDesignProcess(design: any) {
    const [created] = await db.insert(curriculumDesignParameters).values({
      userId: design.userId || 1,
      courseId: design.courseId || 1,
      designName: design.designName,
      status: design.status || 'active',
      stage: design.stage || 'planning',
      progressPercent: design.progressPercent || 0,
      parameters: design.parameters,
      successMetrics: design.successMetrics,
      generatedCurriculum: design.generatedCurriculum,
      aiRecommendations: design.aiRecommendations,
      currentEffectiveness: design.currentEffectiveness || 0,
      version: 1,
    }).returning();
    return created;
  }

  async getDesignProcess(id: number) {
    const [design] = await db.select().from(curriculumDesignParameters).where(eq(curriculumDesignParameters.id, id));
    return design;
  }

  async updateDesignProcess(id: number, updates: any) {
    const [updated] = await db.update(curriculumDesignParameters).set(updates).where(eq(curriculumDesignParameters.id, id)).returning();
    return updated;
  }

  async createSuccessMetrics(metrics: any) {
    const [created] = await db.insert(curriculumSuccessMetrics).values(metrics).returning();
    return created;
  }

  async createFeedbackLoop(loop: any) {
    const [created] = await db.insert(curriculumFeedbackLoops).values(loop).returning();
    return created;
  }

  async getFeedbackLoops(designId: number) {
    return db.select().from(curriculumFeedbackLoops).where(eq(curriculumFeedbackLoops.designId, designId)).orderBy(desc(curriculumFeedbackLoops.cycleNumber));
  }

  async updateFeedbackLoop(id: number, updates: any) {
    const [updated] = await db.update(curriculumFeedbackLoops).set(updates).where(eq(curriculumFeedbackLoops.id, id)).returning();
    return updated;
  }

  async getUserDesignProcesses(userId: number) {
    return db.select().from(curriculumDesignParameters).where(eq(curriculumDesignParameters.userId, userId));
  }

  async getDesignParameters(designId: number) {
    const [params] = await db.select().from(curriculumDesignParameters).where(eq(curriculumDesignParameters.id, designId));
    return params;
  }

  async getSuccessMetrics(designId: number) {
    const [metrics] = await db.select().from(curriculumSuccessMetrics).where(eq(curriculumSuccessMetrics.designId, designId));
    return metrics;
  }

  async updateDesignParameters(designId: number, updates: any) {
    const [updated] = await db.update(curriculumDesignParameters).set(updates).where(eq(curriculumDesignParameters.id, designId)).returning();
    return updated;
  }

  async updateSuccessMetrics(designId: number, updates: any) {
    const [updated] = await db.update(curriculumSuccessMetrics).set(updates).where(eq(curriculumSuccessMetrics.designId, designId)).returning();
    return updated;
  }

  async getCurriculumContextForDailyTasks(userId: number, taskIds: number[]) {
    return new Map();
  }

  async getDailyStudyTasks(userId: number, date?: string) {
    if (date) {
      return db.select().from(dailyTasks).where(eq(dailyTasks.userId, userId));
    }
    return db.select().from(dailyTasks).where(eq(dailyTasks.userId, userId));
  }

  async createDailyStudyTask(task: any) {
    const [created] = await db.insert(dailyTasks).values(task).returning();
    return created;
  }

  // Dashboard & Learning Methods
  async getAiGeneratedCourses() {
    return db.select().from(courses).where(eq(courses.isAiGenerated, true));
  }

  async getCourseRecommendations(userId: number) {
    return db.select().from(aiRecommendationState).where(eq(aiRecommendationState.userId, userId));
  }

  async saveCourseRecommendations(userId: number, recommendations: any) {
    const existing = await db.select().from(aiRecommendationState).where(eq(aiRecommendationState.userId, userId));
    if (existing.length > 0) {
      await db.update(aiRecommendationState).set({ recommendedItems: recommendations }).where(eq(aiRecommendationState.userId, userId));
    } else {
      await db.insert(aiRecommendationState).values({ userId, recommendedItems: recommendations, recommendationType: 'course', confidenceScore: 0.85 });
    }
  }

  async getUserMentor(userId: number) {
    return null;
  }

  async getUserWeeklyStats(userId: number) {
    return { studyHours: 0, lessonsCompleted: 0, challengesCompleted: 0 };
  }

  async getStudySessions(userId: number, filters?: any) {
    try {
      return db.select().from(studySchedules).where(eq(studySchedules.userId, userId));
    } catch (error) {
      return [];
    }
  }

  async getUserAchievements(userId: number) {
    try {
      const result = await db.select().from(userAchievements).where(eq(userAchievements.userId, userId));
      return result || [];
    } catch (error) {
      return [];
    }
  }

  // Enrollment method
  async enrollUserInCourse(enrollmentData: any) {
    try {
      console.log('Enrolling user in course:', enrollmentData);
      const [enrolled] = await db.insert(userCourses).values(enrollmentData).returning();
      console.log('Enrollment successful:', enrolled);
      return enrolled;
    } catch (error) {
      console.error('Enrollment error in storage:', error);
      throw error;
    }
  }

  // Curriculum methods
  async getUserCurriculums(userId: number) {
    return db.select().from(curriculumDesignParameters).where(eq(curriculumDesignParameters.userId, userId));
  }

  async generateAndSyncCurriculum(userId: number, courseId: number) {
    try {
      const curriculum = await db.insert(curriculumDesignParameters).values({
        userId,
        courseId,
        designName: `Curriculum for Course ${courseId}`,
        status: 'active',
        stage: 'generation',
        progressPercent: 0,
        parameters: { courseId, userId },
        version: 1,
      }).returning();
      return curriculum[0] || null;
    } catch (error) {
      console.error('Curriculum generation error:', error);
      throw error;
    }
  }

  // Module methods
  async getModules(courseId: number) {
    return db.select().from(modules).where(eq(modules.courseId, courseId));
  }

  // Lesson methods
  async getLessons(moduleId: number) {
    try {
      return await db.select().from(lessons).where(eq(lessons.moduleId, moduleId)).orderBy(asc(lessons.order));
    } catch (error: any) {
      console.error(`[STORAGE] Error getting lessons for module ${moduleId}:`, error?.message || error);
      return [];
    }
  }

  async getLesson(lessonId: number) {
    try {
      const [lesson] = await db.select().from(lessons).where(eq(lessons.id, lessonId));
      return lesson;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      return null;
    }
  }

  async getUserLessons(userId: number) {
    try {
      // Get all lessons from courses the user is enrolled in
      const userCoursesList = await db.select().from(userCourses).where(eq(userCourses.userId, userId));
      if (userCoursesList.length === 0) return [];
      
      const courseIds = userCoursesList.map(uc => uc.courseId);
      const modulesList = await db.select().from(modules).where(inArray(modules.courseId, courseIds));
      if (modulesList.length === 0) return [];
      
      const moduleIds = modulesList.map(m => m.id);
      return db.select().from(lessons).where(inArray(lessons.moduleId, moduleIds));
    } catch (error) {
      console.error('Error fetching user lessons:', error);
      return [];
    }
  }

  // Assignment methods
  async createAssignment(assignmentData: any) {
    const [created] = await db.insert(assignments).values(assignmentData).returning();
    return created;
  }

  async createUserAssignment(userAssignmentData: any) {
    try {
      // Since there's no user_assignments table in the schema, we'll skip this for now
      // The assignments are already linked via the assignments table
      return { success: true };
    } catch (error) {
      console.error('User assignment error:', error);
      return { success: false };
    }
  }
}

class InMemoryStorage implements IStorage {
  private users: any[] = [];
  private nextId = 1;

  async getUser(id: number) {
    return this.users.find((u) => u.id === id) || null;
  }

  async getUserByUsername(username: string) {
    return this.users.find((u) => u.username === username) || null;
  }

  async getUsers() {
    return this.users;
  }

  async createUser(userData: any) {
    const user = { ...userData, id: this.nextId++ };
    this.users.push(user);
    return user;
  }

  // Basic no-op implementations to keep the app running without a database
  async getCourses() { return []; }
  async getCourse(_id: number) { return null; }
  async createCourse(courseData: any) { return { ...courseData, id: this.nextId++ }; }
  async updateCourse(_id: number, updates: any) { return { ...updates, id: _id }; }
  async createDesignProcess(design: any) { return { ...design, id: this.nextId++ }; }
  async getDesignProcess(_id: number) { return null; }
  async updateDesignProcess(_id: number, updates: any) { return { ...updates, id: _id }; }
  async createSuccessMetrics(metrics: any) { return { ...metrics, id: this.nextId++ }; }
  async createFeedbackLoop(loop: any) { return { ...loop, id: this.nextId++ }; }
  async getFeedbackLoops(_designId: number) { return []; }
  async updateFeedbackLoop(_id: number, updates: any) { return { ...updates, id: _id }; }
  async getUserCourses(_userId: number) { return []; }
  async getUserAssignments(_userId: number) { return []; }
  async getUserAchievements(_userId: number) { return []; }
  async getStudySessions(_userId: number) { return []; }
  async getUserActiveAndCompletedChallenges(_userId: number) { return []; }
  async getUserLevel(_userId: number) { return null; }
  async getChallenges() { return []; }
  async getUserStudyPrograms(_userId: number) { return []; }
  async getUserLearningTrails(_userId: number) { return []; }
  async getUserLearningStats(_userId: number) { return null; }
  async getDailyTasks(_userId: number) { return []; }
  async getModules(_courseId: number) { return []; }
  async getLessons(_moduleId: number) { return []; }
  async getUserLessons(_userId: number) { return []; }
}

const useDatabase = !!process.env.DATABASE_URL;
export const storage: IStorage = useDatabase ? new DatabaseStorage() : new InMemoryStorage();
