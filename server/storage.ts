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
import * as schema from "../shared/schema.js";

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
  educationalMaterials,
  mentorMaterialAssignments,
  mentors,
  userMentors,
  uploads,
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
  // Educational Materials Methods
  createEducationalMaterial(material: any): Promise<any>;
  getEducationalMaterials(filters?: any): Promise<any[]>;
  getEducationalMaterial(id: number): Promise<any>;
  updateEducationalMaterial(id: number, updates: any): Promise<any>;
  deleteEducationalMaterial(id: number): Promise<any>;
  getMaterialsForStudent(userId: number): Promise<any[]>;
  getAIGeneratedMaterials(userId: number): Promise<any[]>;
  getMentorMaterials(mentorId: number): Promise<any[]>;
  getPublicMaterials(): Promise<any[]>;
  assignMaterialToStudent(materialId: number, studentId: number, mentorId: number, notes?: string): Promise<any>;
  getUserMentor(userId: number): Promise<any>;
  getMentors(filters?: any): Promise<any[]>;
  autoAssignMentor(userId: number): Promise<any>;
  assignMentorToUser(userId: number, mentorId: number, options?: any): Promise<any>;
  createMentor(mentorData: any): Promise<any>;
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
      // Get all courses the user is enrolled in
      const userCourseRows = await db
        .select()
        .from(userCourses)
        .where(eq(userCourses.userId, userId));

      if (userCourseRows.length === 0) {
        return [];
      }

      const courseIds = userCourseRows.map((uc) => uc.courseId);

      // Fetch assignments linked to those courses, together with course metadata
      const rows = await db
        .select({
          id: assignments.id,
          title: assignments.title,
          description: assignments.description,
          courseId: assignments.courseId,
          studyPlanId: assignments.studyPlanId,
          lessonId: assignments.lessonId,
          points: assignments.points,
          dueDate: assignments.dueDate,
          status: assignments.status,
          createdAt: assignments.createdAt,
          course: courses,
        })
        .from(assignments)
        .leftJoin(courses, eq(assignments.courseId, courses.id))
        .where(inArray(assignments.courseId, courseIds));

      return rows;
    } catch (error: any) {
      console.error(
        `[STORAGE] Error getting assignments for user ${userId}:`,
        error?.message || error,
      );
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
    try {
      const [userMentor] = await db
        .select()
        .from(userMentors)
        .where(eq(userMentors.userId, userId))
        .limit(1);
      
      if (!userMentor || !userMentor.mentorId) {
        return null;
      }

      // Get mentor details
      const [mentor] = await db
        .select()
        .from(mentors)
        .where(eq(mentors.id, userMentor.mentorId));

      return mentor ? { ...userMentor, mentor } : null;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting user mentor for ${userId}:`, error?.message || error);
      return null;
    }
  }

  async getMentors(filters?: { isAiMentor?: boolean; isActive?: boolean; specialization?: string; userId?: number }) {
    try {
      let query = db.select().from(mentors);
      const conditions: any[] = [];

      if (filters?.isAiMentor !== undefined) {
        conditions.push(eq(mentors.isAiMentor, filters.isAiMentor));
      }
      if (filters?.userId !== undefined) {
        conditions.push(eq(mentors.userId, filters.userId));
      }
      if (filters?.specialization) {
        conditions.push(eq(mentors.specialization, filters.specialization));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      return await query;
    } catch (error: any) {
      console.error('[STORAGE] Error getting mentors:', error?.message || error);
      return [];
    }
  }

  async autoAssignMentor(userId: number) {
    try {
      // Check if user already has a mentor
      const existing = await this.getUserMentor(userId);
      if (existing) {
        return existing;
      }

      // Find an AI mentor or available mentor
      const [aiMentor] = await db
        .select()
        .from(mentors)
        .where(eq(mentors.isAiMentor, true))
        .limit(1);

      if (aiMentor) {
        const [assignment] = await db
          .insert(userMentors)
          .values({
            userId,
            mentorId: aiMentor.id,
            assignedAt: new Date(),
          })
          .returning();

        return { ...assignment, mentor: aiMentor };
      }

      return null;
    } catch (error: any) {
      console.error(`[STORAGE] Error auto-assigning mentor for ${userId}:`, error?.message || error);
      return null;
    }
  }

  async assignMentorToUser(userId: number, mentorId: number, options?: { preferredCommunication?: string; communicationLanguage?: string; notes?: string }) {
    try {
      // Remove existing assignment
      await db.delete(userMentors).where(eq(userMentors.userId, userId));

      // Create new assignment
      const [assignment] = await db
        .insert(userMentors)
        .values({
          userId,
          mentorId,
          assignedAt: new Date(),
        })
        .returning();

      const [mentor] = await db
        .select()
        .from(mentors)
        .where(eq(mentors.id, mentorId));

      return mentor ? { ...assignment, mentor } : assignment;
    } catch (error: any) {
      console.error(`[STORAGE] Error assigning mentor to user ${userId}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to assign mentor'}`);
    }
  }

  async createMentor(mentorData: any) {
    try {
      const [created] = await db.insert(mentors).values(mentorData).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating mentor:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create mentor'}`);
    }
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

  // Educational Materials Methods
  async createEducationalMaterial(material: any) {
    try {
      const [created] = await db.insert(educationalMaterials).values({
        ...material,
        updatedAt: new Date(),
      }).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating educational material:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create educational material'}`);
    }
  }

  async getEducationalMaterials(filters?: {
    mentorId?: number;
    courseId?: number | null;
    materialType?: string;
    isPublic?: boolean;
    isAiGenerated?: boolean;
  }) {
    try {
      let query = db.select().from(educationalMaterials);

      const conditions = [];
      if (filters?.mentorId !== undefined) {
        conditions.push(eq(educationalMaterials.mentorId, filters.mentorId));
      }
      if (filters?.courseId !== undefined) {
        if (filters.courseId === null) {
          conditions.push(sql`${educationalMaterials.courseId} IS NULL`);
        } else {
          conditions.push(eq(educationalMaterials.courseId, filters.courseId));
        }
      }
      if (filters?.materialType) {
        conditions.push(eq(educationalMaterials.materialType, filters.materialType));
      }
      if (filters?.isPublic !== undefined) {
        conditions.push(eq(educationalMaterials.isPublic, filters.isPublic));
      }
      if (filters?.isAiGenerated !== undefined) {
        conditions.push(eq(educationalMaterials.isAiGenerated, filters.isAiGenerated));
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions)) as any;
      }

      return await query.orderBy(desc(educationalMaterials.createdAt));
    } catch (error: any) {
      console.error('[STORAGE] Error getting educational materials:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get educational materials'}`);
    }
  }

  async getEducationalMaterial(id: number) {
    try {
      const [material] = await db.select().from(educationalMaterials).where(eq(educationalMaterials.id, id));
      return material || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting educational material ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get educational material'}`);
    }
  }

  async updateEducationalMaterial(id: number, updates: any) {
    try {
      const [updated] = await db
        .update(educationalMaterials)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(educationalMaterials.id, id))
        .returning();
      return updated;
    } catch (error: any) {
      console.error(`[STORAGE] Error updating educational material ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to update educational material'}`);
    }
  }

  async deleteEducationalMaterial(id: number) {
    try {
      await db.delete(educationalMaterials).where(eq(educationalMaterials.id, id));
      return { success: true };
    } catch (error: any) {
      console.error(`[STORAGE] Error deleting educational material ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to delete educational material'}`);
    }
  }

  async getMaterialsForStudent(userId: number) {
    try {
      // Get student's mentor
      const [userMentor] = await db
        .select()
        .from(userMentors)
        .where(eq(userMentors.userId, userId))
        .limit(1);

      // Get materials assigned to this student
      const assignedMaterialIds = userMentor
        ? await db
            .select({ materialId: mentorMaterialAssignments.materialId })
            .from(mentorMaterialAssignments)
            .where(eq(mentorMaterialAssignments.studentId, userId))
        : [];

      const assignedIds = assignedMaterialIds.map(a => a.materialId);

      // Get all materials student can access:
      // 1. AI-generated materials for this user (if no mentor assigned)
      // 2. Materials assigned by mentor
      // 3. Public materials
      // 4. Course-specific materials for courses student is enrolled in
      const userCoursesList = await db.select().from(userCourses).where(eq(userCourses.userId, userId));
      const enrolledCourseIds = userCoursesList.map(uc => uc.courseId);

      const conditions = [];
      
      // If no mentor, get AI materials
      if (!userMentor) {
        conditions.push(and(
          eq(educationalMaterials.isAiGenerated, true),
          sql`${educationalMaterials.courseId} IS NULL`
        ));
      }

      // Assigned materials
      if (assignedIds.length > 0) {
        conditions.push(inArray(educationalMaterials.id, assignedIds));
      }

      // Public materials
      conditions.push(eq(educationalMaterials.isPublic, true));

      // Course-specific materials
      if (enrolledCourseIds.length > 0) {
        conditions.push(inArray(educationalMaterials.courseId, enrolledCourseIds));
      }

      if (conditions.length === 0) {
        return [];
      }

      const materials = await db
        .select()
        .from(educationalMaterials)
        .where(or(...conditions))
        .orderBy(desc(educationalMaterials.createdAt));

      return materials;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting materials for student ${userId}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get materials for student'}`);
    }
  }

  async getAIGeneratedMaterials(userId: number) {
    try {
      // Get AI-generated materials for user (non-course specific)
      const materials = await db
        .select()
        .from(educationalMaterials)
        .where(and(
          eq(educationalMaterials.isAiGenerated, true),
          sql`${educationalMaterials.courseId} IS NULL`
        ))
        .orderBy(desc(educationalMaterials.createdAt));

      return materials;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting AI materials for user ${userId}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get AI materials'}`);
    }
  }

  async getMentorMaterials(mentorId: number) {
    try {
      return await db
        .select()
        .from(educationalMaterials)
        .where(eq(educationalMaterials.mentorId, mentorId))
        .orderBy(desc(educationalMaterials.createdAt));
    } catch (error: any) {
      console.error(`[STORAGE] Error getting mentor materials for ${mentorId}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get mentor materials'}`);
    }
  }

  async getPublicMaterials() {
    try {
      return await db
        .select()
        .from(educationalMaterials)
        .where(eq(educationalMaterials.isPublic, true))
        .orderBy(desc(educationalMaterials.createdAt));
    } catch (error: any) {
      console.error('[STORAGE] Error getting public materials:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get public materials'}`);
    }
  }

  async assignMaterialToStudent(materialId: number, studentId: number, mentorId: number, notes?: string) {
    try {
      // Check if assignment already exists
      const existing = await db
        .select()
        .from(mentorMaterialAssignments)
        .where(and(
          eq(mentorMaterialAssignments.materialId, materialId),
          eq(mentorMaterialAssignments.studentId, studentId),
          eq(mentorMaterialAssignments.mentorId, mentorId)
        ))
        .limit(1);

      if (existing.length > 0) {
        return existing[0];
      }

      const [assignment] = await db
        .insert(mentorMaterialAssignments)
        .values({
          materialId,
          studentId,
          mentorId,
          notes: notes || null,
          assignedAt: new Date(),
        })
        .returning();

      return assignment;
    } catch (error: any) {
      console.error('[STORAGE] Error assigning material to student:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to assign material'}`);
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
  // Educational Materials Methods - Stubs
  async createEducationalMaterial(_material: any) { return { id: this.nextId++, ..._material }; }
  async getEducationalMaterials(_filters?: any) { return []; }
  async getEducationalMaterial(_id: number) { return null; }
  async updateEducationalMaterial(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async deleteEducationalMaterial(_id: number) { return { success: true }; }
  async getMaterialsForStudent(_userId: number) { return []; }
  async getAIGeneratedMaterials(_userId: number) { return []; }
  async getMentorMaterials(_mentorId: number) { return []; }
  async getPublicMaterials() { return []; }
  async assignMaterialToStudent(_materialId: number, _studentId: number, _mentorId: number, _notes?: string) { return { id: this.nextId++ }; }
  async getUserMentor(_userId: number) { return null; }
  async getMentors(_filters?: any) { return []; }
  async autoAssignMentor(_userId: number) { return null; }
  async assignMentorToUser(_userId: number, _mentorId: number, _options?: any) { return { id: this.nextId++ }; }
  async createMentor(_mentorData: any) { return { id: this.nextId++, ..._mentorData }; }
}

const useDatabase = !!process.env.DATABASE_URL;
export const storage: IStorage = useDatabase ? new DatabaseStorage() : new InMemoryStorage();
