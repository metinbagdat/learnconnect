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
  modules,
  lessons,
  assignments,
  achievements,
  challenges,
  dailyTasks,
  learningPaths,
  studySchedules,
  curriculumDesignParameters,
  curriculumSuccessMetrics,
  curriculumFeedbackLoops,
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
  userChallenges,
  userLevels,
  learningPathSteps,
  courseCategories,
  userLessons,
  studySessions,
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
  // Challenge methods
  createChallenge(challenge: any): Promise<any>;
  getChallenge(id: number): Promise<any>;
  updateChallenge(id: number, updates: any): Promise<any>;
  deactivateChallenge(id: number): Promise<any>;
  getUserChallenges(userId: number): Promise<any[]>;
  assignChallengeToUser(userId: number, challengeId: number): Promise<any>;
  updateUserChallengeProgress(userId: number, challengeId: number, progress: number): Promise<any>;
  completeUserChallenge(userId: number, challengeId: number): Promise<any>;
  getCourseRelatedChallenges(courseId: number): Promise<any[]>;
  // User Level methods
  initializeUserLevel(userId: number): Promise<any>;
  updateUserStreak(userId: number): Promise<any>;
  addUserXp(userId: number, xp: number): Promise<any>;
  getAllUsersWithLevels(): Promise<any[]>;
  // Achievement methods
  getAllAchievements(): Promise<any[]>;
  unlockUserAchievement(userId: number, achievementId: number): Promise<any>;
  checkAndUnlockAchievements(userId: number): Promise<any[]>;
  // Learning Path methods
  createLearningPath(pathData: any): Promise<any>;
  getLearningPath(pathId: number): Promise<any>;
  getLearningPaths(userId?: number): Promise<any[]>;
  getUserLearningPaths(userId: number): Promise<any[]>;
  updateLearningPath(id: number, updates: any): Promise<any>;
  updateLearningPathProgress(pathId: number, progress: number): Promise<any>;
  deleteLearningPath(id: number): Promise<any>;
  createLearningPathStep(stepData: any): Promise<any>;
  addLearningPathStep(stepData: any): Promise<any>;
  markStepAsCompleted(pathId: number, stepId: number): Promise<any>;
  // Module and Lesson methods
  createModule(moduleData: any): Promise<any>;
  createLesson(lessonData: any): Promise<any>;
  // Assignment methods
  createAssignment(assignmentData: any): Promise<any>;
  createUserAssignment(assignmentData: any): Promise<any>;
  updateUserCourseProgress(userId: number, courseId: number, progress: number): Promise<any>;
  // Course methods
  getAllCourses(): Promise<any[]>;
  getCoursesInCategory(categoryId: number): Promise<any[]>;
  getCourseRecommendations(userId: number): Promise<any[]>;
  saveCourseRecommendations(userId: number, recommendations: any[]): Promise<any>;
  updateUserInterests(userId: number, interests: string[]): Promise<any>;
  updateUserStripeInfo(userId: number, stripeData: { customerId?: string; subscriptionId?: string }): Promise<void>;
  getAiGeneratedCourses(): Promise<any[]>;
  getPopularCourses(): Promise<any[]>;
  enrollUserInCourse(userId: number, courseId: number): Promise<any>;
  createUserCourse(data: any): Promise<any>;
  updateUserCourse(id: number, updates: any): Promise<any>;
  createUserLesson(data: any): Promise<any>;
  // Category methods
  getCategories(): Promise<any[]>;
  getCategoryTree(): Promise<any[]>;
  getCategory(id: number): Promise<any>;
  createCategory(categoryData: any): Promise<any>;
  updateCategory(id: number, updates: any): Promise<any>;
  deleteCategory(id: number): Promise<any>;
  // Activity and Analytics methods
  logUserActivity(userId: number, activity: any): Promise<any>;
  getUserActivities(userId: number, limit?: number): Promise<any[]>;
  getUserActivityByTimeframe(userId: number, startDate: Date, endDate: Date): Promise<any[]>;
  getUserActivityLogs(userId: number, limit?: number): Promise<any[]>;
  getCourseAnalytics(courseId: number): Promise<any>;
  updateCourseAnalytics(courseId: number, analytics: any): Promise<any>;
  getUserProgressOverTime(userId: number, startDate: Date, endDate: Date): Promise<any[]>;
  createUserProgressSnapshot(userId: number, snapshot: any): Promise<any>;
  getPlatformStats(): Promise<any>;
  // Study Program methods
  getStudyPrograms(): Promise<any[]>;
  getStudyProgram(id: number): Promise<any>;
  enrollUserInProgram(userId: number, programId: number): Promise<any>;
  updateUserProgramProgress(userId: number, programId: number, progress: number): Promise<any>;
  createStudyProgram(programData: any): Promise<any>;
  createStudySession(sessionData: any): Promise<any>;
  updateStudySession(id: number, updates: any): Promise<any>;
  getUserWeeklyStats(userId: number): Promise<any>;
  getProgramSchedules(programId: number): Promise<any[]>;
  createProgramSchedule(scheduleData: any): Promise<any>;
  // Assessment methods
  getLevelAssessment(id: number): Promise<any>;
  getAssessmentQuestions(assessmentId: number): Promise<any[]>;
  createLevelAssessment(assessmentData: any): Promise<any>;
  createAssessmentQuestion(questionData: any): Promise<any>;
  updateAssessmentQuestion(id: number, updates: any): Promise<any>;
  updateLevelAssessment(id: number, updates: any): Promise<any>;
  updateUserSkillLevel(userId: number, skillId: number, level: number): Promise<any>;
  getUserAssessments(userId: number): Promise<any[]>;
  getUserSkillLevels(userId: number): Promise<any[]>;
  // TYT methods
  getTytStudentProfile(userId: number): Promise<any>;
  createTytStudentProfile(profileData: any): Promise<any>;
  updateTytStudentProfile(userId: number, updates: any): Promise<any>;
  getTytSubjects(): Promise<any[]>;
  getTytTopics(subjectId?: number): Promise<any[]>;
  getUserTopicProgress(userId: number, topicId: number): Promise<any>;
  updateUserTopicProgress(userId: number, topicId: number, progress: any): Promise<any>;
  getTytTrialExams(userId: number): Promise<any[]>;
  getTytTrialExam(id: number): Promise<any>;
  createTytTrialExam(examData: any): Promise<any>;
  deleteTytTrialExam(id: number): Promise<any>;
  getDailyStudyTasks(userId: number): Promise<any[]>;
  getCurriculumContextForDailyTasks(userId: number): Promise<any>;
  getDailyStudyTask(id: number): Promise<any>;
  createDailyStudyTask(taskData: any): Promise<any>;
  completeDailyStudyTask(id: number): Promise<any>;
  deleteDailyStudyTask(id: number): Promise<any>;
  updateDailyStudyTask(id: number, updates: any): Promise<any>;
  getTytStudySessions(userId: number): Promise<any[]>;
  createTytStudySession(sessionData: any): Promise<any>;
  getTytStudySession(id: number): Promise<any>;
  endTytStudySession(id: number): Promise<any>;
  getTytStudyGoals(userId: number): Promise<any[]>;
  createTytStudyGoal(goalData: any): Promise<any>;
  getTytStudyGoal(id: number): Promise<any>;
  updateTytStudyGoal(id: number, updates: any): Promise<any>;
  deleteTytStudyGoal(id: number): Promise<any>;
  getTytStudyStreaks(userId: number): Promise<any[]>;
  getTytStudyStats(userId: number): Promise<any>;
  getDailyStudyGoal(userId: number, date: Date): Promise<any>;
  getDailyStudyGoals(userId: number): Promise<any[]>;
  createDailyStudyGoal(goalData: any): Promise<any>;
  updateDailyStudyGoal(id: number, updates: any): Promise<any>;
  getStudyHabits(userId: number): Promise<any[]>;
  createStudyHabit(habitData: any): Promise<any>;
  getDailyStudySessions(userId: number): Promise<any[]>;
  createDailyStudySession(sessionData: any): Promise<any>;
  getTytResources(): Promise<any[]>;
  createTytResource(resourceData: any): Promise<any>;
  updateTytResource(id: number, updates: any): Promise<any>;
  deleteTytResource(id: number): Promise<any>;
  getAiDailyPlan(userId: number, date: Date): Promise<any>;
  getAiDailyPlans(userId: number): Promise<any[]>;
  createAiDailyPlan(planData: any): Promise<any>;
  updateAiDailyPlanProgress(id: number, progress: any): Promise<any>;
  generateAndSyncCurriculum(userId: number): Promise<any>;
  getUserCurriculums(userId: number): Promise<any[]>;
  getCurriculumSkills(curriculumId: number): Promise<any[]>;
  getCurriculumModules(curriculumId: number): Promise<any[]>;
  getCurriculumCheckpoints(curriculumId: number): Promise<any[]>;
  getUserCurriculumTasks(userId: number, curriculumId?: number): Promise<any[]>;
  getUserSkillProgress(userId: number, skillId?: number): Promise<any>;
  getUserCurriculumTask(id: number): Promise<any>;
  completeUserCurriculumTask(id: number): Promise<any>;
  updateUserCurriculumTask(id: number, updates: any): Promise<any>;
  updateUserCurriculumProgress(userId: number, curriculumId: number, progress: number): Promise<any>;
  updateUserSkillProgress(userId: number, skillId: number, progress: number): Promise<any>;
  getSkillAssessments(skillId?: number): Promise<any[]>;
  createSkillAssessment(assessmentData: any): Promise<any>;
  // Upload methods
  getUserUploads(userId: number): Promise<any[]>;
  getUpload(id: number): Promise<any>;
  createUpload(uploadData: any): Promise<any>;
  deleteUpload(id: number): Promise<any>;
  // Essay methods
  getUserEssays(userId: number): Promise<any[]>;
  getEssay(id: number): Promise<any>;
  createEssay(essayData: any): Promise<any>;
  updateEssay(id: number, updates: any): Promise<any>;
  submitEssay(id: number): Promise<any>;
  generateAiFeedback(essayId: number): Promise<any>;
  // Weekly Study Plan methods
  getUserWeeklyStudyPlans(userId: number): Promise<any[]>;
  getActiveWeeklyPlan(userId: number): Promise<any>;
  getWeeklyStudyPlan(id: number): Promise<any>;
  createWeeklyStudyPlan(planData: any): Promise<any>;
  generateWeeklyAiRecommendations(userId: number, planId: number): Promise<any>;
  updateWeeklyStudyPlan(id: number, updates: any): Promise<any>;
  completeWeeklyPlan(id: number): Promise<any>;
  // Forum methods
  getForumPosts(filters?: any): Promise<any[]>;
  getForumPost(id: number): Promise<any>;
  incrementPostViews(id: number): Promise<any>;
  createForumPost(postData: any): Promise<any>;
  updateForumPost(id: number, updates: any): Promise<any>;
  deleteForumPost(id: number): Promise<any>;
  getPostComments(postId: number): Promise<any[]>;
  createForumComment(commentData: any): Promise<any>;
  getForumComment(id: number): Promise<any>;
  updateForumComment(id: number, updates: any): Promise<any>;
  deleteForumComment(id: number): Promise<any>;
  // Certificate methods
  getUserCertificates(userId: number): Promise<any[]>;
  getCertificate(id: number): Promise<any>;
  verifyCertificate(id: string): Promise<any>;
  createCertificate(certificateData: any): Promise<any>;
  revokeCertificate(id: number): Promise<any>;
  // Design Process methods
  getDesignParameters(designId: number): Promise<any>;
  getSuccessMetrics(designId: number): Promise<any[]>;
  updateDesignParameters(id: number, updates: any): Promise<any>;
  updateSuccessMetrics(id: number, updates: any): Promise<any>;
  createDesignParameters(data: any): Promise<any>;
  getUserDesignProcesses(userId: number): Promise<any[]>;
  // AI Generation Session methods
  createAiGenerationSession(sessionData: any): Promise<any>;
  getGenerationSession(id: number): Promise<any>;
  getUserGenerationSessions(userId: number): Promise<any[]>;
  updateGenerationSession(id: number, updates: any): Promise<any>;
  archiveProduction(archiveData: any): Promise<any>;
  getProductionArchives(userId: number): Promise<any[]>;
  saveLearningData(data: any): Promise<any>;
  getLearningDataBySession(sessionId: number): Promise<any[]>;
  getRecentLearningData(userId: number, limit?: number): Promise<any[]>;
  updateLearningDataFeedback(id: number, feedback: any): Promise<any>;
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
    } as any).returning();
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
    // userId doesn't exist on curriculumDesignParameters table, return empty array
    return [];
  }

  async getDesignParameters(designId: number) {
    const [params] = await db.select().from(curriculumDesignParameters).where(eq(curriculumDesignParameters.id, designId));
    return params;
  }

  async getSuccessMetrics(designId: number) {
    try {
      const metrics = await db.select().from(curriculumSuccessMetrics).where(eq((curriculumSuccessMetrics as any).designId, designId));
    return metrics;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting success metrics:`, error?.message || error);
      return [];
    }
  }

  async updateDesignParameters(designId: number, updates: any) {
    const [updated] = await db.update(curriculumDesignParameters).set(updates as any).where(eq(curriculumDesignParameters.id, designId)).returning();
    return updated;
  }

  async updateSuccessMetrics(designId: number, updates: any) {
    try {
      const [updated] = await db.update(curriculumSuccessMetrics).set(updates as any).where(eq((curriculumSuccessMetrics as any).designId, designId)).returning();
      return updated || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error updating success metrics:`, error?.message || error);
      return null;
    }
  }

  async getCurriculumContextForDailyTasks(userId: number) {
    return {};
  }

  async getDailyStudyTasks(userId: number) {
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

  async saveCourseRecommendations(userId: number, recommendations: any[]) {
    const existing = await db.select().from(aiRecommendationState).where(eq(aiRecommendationState.userId, userId));
    if (existing.length > 0) {
      // Schema doesn't have recommendedItems field, skip update
      console.warn('[STORAGE] saveCourseRecommendations: recommendedItems field not in schema, skipping update');
    } else {
      await db.insert(aiRecommendationState).values({ userId, recommendationType: 'course' } as any);
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
          } as any)
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
        } as any)
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
  async enrollUserInCourse(userId: number, courseId: number) {
    try {
      const existing = await db.select()
        .from(userCourses)
        .where(and(eq(userCourses.userId, userId), eq(userCourses.courseId, courseId)))
        .limit(1);
      
      if (existing.length > 0) return existing[0];
      
      const [enrolled] = await db.insert(userCourses).values({
        userId,
        courseId,
      } as any).returning();
      return enrolled;
    } catch (error) {
      console.error('Enrollment error in storage:', error);
      throw error;
    }
  }

  // Curriculum methods
  async getUserCurriculums(userId: number) {
    // userId doesn't exist on curriculumDesignParameters table, return empty array
    return [];
  }

  async generateAndSyncCurriculum(userId: number) {
    try {
      // Generate a unique designId (could use a sequence or timestamp-based ID)
      const designId = Date.now();
      const curriculum = await db.insert(curriculumDesignParameters).values({
        designId,
        courseTitle: `Curriculum for User ${userId}`,
        status: 'active',
        stage: 'generation',
        progressPercent: 0,
        parameters: { userId },
        version: 1,
      } as any).returning();
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
        } as any)
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

  // Challenge methods - Stub implementations
  async createChallenge(challengeData: any) {
    try {
      const [created] = await db.insert(challenges).values(challengeData).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating challenge:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create challenge'}`);
    }
  }

  async getChallenge(id: number) {
    try {
      const [challenge] = await db.select().from(challenges).where(eq(challenges.id, id));
      return challenge || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting challenge ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get challenge'}`);
    }
  }

  async updateChallenge(id: number, updates: any) {
    try {
      const [updated] = await db.update(challenges).set(updates).where(eq(challenges.id, id)).returning();
      return updated || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error updating challenge ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to update challenge'}`);
    }
  }

  async deactivateChallenge(id: number) {
    return this.updateChallenge(id, { isActive: false });
  }

  async getUserChallenges(userId: number) {
    try {
      const userChallengesList = await db.select().from(userChallenges).where(eq(userChallenges.userId, userId));
      return userChallengesList;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting user challenges:`, error?.message || error);
      return [];
    }
  }

  async assignChallengeToUser(userId: number, challengeId: number) {
    try {
      const [assigned] = await db.insert(userChallenges).values({ userId, challengeId, progress: 0, isCompleted: false, completed: false } as any).returning();
      return assigned;
    } catch (error: any) {
      console.error('[STORAGE] Error assigning challenge:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to assign challenge'}`);
    }
  }

  async updateUserChallengeProgress(userId: number, challengeId: number, progress: number) {
    try {
      const [updated] = await db.update(userChallenges)
        .set({ progress } as any)
        .where(and(eq(userChallenges.userId, userId), eq(userChallenges.challengeId, challengeId)))
        .returning();
      return updated || null;
    } catch (error: any) {
      console.error('[STORAGE] Error updating challenge progress:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to update challenge progress'}`);
    }
  }

  async completeUserChallenge(userId: number, challengeId: number) {
    try {
      const [updated] = await db.update(userChallenges)
        .set({ isCompleted: true, completed: true, completedAt: new Date() } as any)
        .where(and(eq(userChallenges.userId, userId), eq(userChallenges.challengeId, challengeId)))
        .returning();
      return updated || null;
    } catch (error: any) {
      console.error('[STORAGE] Error completing challenge:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to complete challenge'}`);
    }
  }

  async getCourseRelatedChallenges(courseId: number) {
    try {
      const courseChallenges = await db.select().from(challenges).where(eq((challenges as any).courseId, courseId));
      return courseChallenges;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting course challenges:`, error?.message || error);
      return [];
    }
  }

  // User Level methods - Stub implementations
  async initializeUserLevel(userId: number) {
    try {
      const existing = await this.getUserLevel(userId);
      if (existing) return existing;
      
      const [level] = await db.insert(userLevels).values({
        userId,
        level: 1,
        currentXp: 0,
        totalXp: 0,
        nextLevelXp: 100,
        streak: 0,
        totalPoints: 0
      } as any).returning();
      return level;
    } catch (error: any) {
      console.error(`[STORAGE] Error initializing user level:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to initialize user level'}`);
    }
  }

  async updateUserStreak(userId: number) {
    try {
      const userLevel: any = await this.getUserLevel(userId);
      if (!userLevel) {
        await this.initializeUserLevel(userId);
        return { streak: 1 };
      }
      
      const today = new Date().toISOString().split('T')[0];
      const lastActivity = userLevel.lastActivityDate ? new Date(userLevel.lastActivityDate).toISOString().split('T')[0] : null;
      
      let newStreak = userLevel.streak || 0;
      if (lastActivity !== today) {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];
        
        if (lastActivity === yesterdayStr) {
          newStreak = (userLevel.streak || 0) + 1;
        } else {
          newStreak = 1;
        }
      }
      
      const [updated] = await db.update(userLevels)
        .set({ streak: newStreak, lastActivityDate: new Date() } as any)
        .where(eq(userLevels.userId, userId))
        .returning();
      return updated;
    } catch (error: any) {
      console.error(`[STORAGE] Error updating user streak:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to update user streak'}`);
    }
  }

  async addUserXp(userId: number, xp: number) {
    try {
      let userLevel: any = await this.getUserLevel(userId);
      if (!userLevel) {
        userLevel = await this.initializeUserLevel(userId);
      }
      
      const newTotalXp = (userLevel.totalXp || 0) + xp;
      const newCurrentXp = (userLevel.currentXp || 0) + xp;
      
      // Calculate new level
      let newLevel = userLevel.level || 1;
      let nextLevelXp = userLevel.nextLevelXp || 100;
      let currentXp = newCurrentXp;
      
      while (currentXp >= nextLevelXp) {
        newLevel++;
        currentXp -= nextLevelXp;
        nextLevelXp = Math.floor(nextLevelXp * 1.5);
      }
      
      const [updated] = await db.update(userLevels)
        .set({
          level: newLevel,
          currentXp: currentXp,
          totalXp: newTotalXp,
          nextLevelXp: nextLevelXp
        } as any)
        .where(eq(userLevels.userId, userId))
        .returning();
      return updated;
    } catch (error: any) {
      console.error(`[STORAGE] Error adding user XP:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to add user XP'}`);
    }
  }

  async getAllUsersWithLevels() {
    try {
      const usersWithLevels = await db.select({
        userId: users.id,
        username: users.username,
        user: users,
        level: (userLevels as any).level,
        totalXp: (userLevels as any).totalXp,
        streak: (userLevels as any).streak,
        totalPoints: (userLevels as any).totalPoints
      })
      .from(users)
      .leftJoin(userLevels, eq(users.id, userLevels.userId));
      return usersWithLevels;
    } catch (error: any) {
      console.error('[STORAGE] Error getting users with levels:', error?.message || error);
      return [];
    }
  }

  // Achievement methods - Stub implementations
  async getAllAchievements() {
    try {
      return await db.select().from(achievements);
    } catch (error: any) {
      console.error('[STORAGE] Error getting all achievements:', error?.message || error);
      return [];
    }
  }

  async unlockUserAchievement(userId: number, achievementId: number) {
    try {
      const existing = await db.select()
        .from(userAchievements)
        .where(and(eq(userAchievements.userId, userId), eq(userAchievements.achievementId, achievementId)))
        .limit(1);
      
      if (existing.length > 0) return existing[0];
      
      const [unlocked] = await db.insert(userAchievements).values({
        userId,
        achievementId,
      } as any).returning();
      return unlocked;
    } catch (error: any) {
      console.error('[STORAGE] Error unlocking achievement:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to unlock achievement'}`);
    }
  }

  async checkAndUnlockAchievements(userId: number) {
    // This would check user progress and unlock achievements accordingly
    // For now, return empty array
    return [];
  }

  // Learning Path methods - Stub implementations
  async createLearningPath(pathData: any) {
    try {
      const [created] = await db.insert(learningPaths).values(pathData).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating learning path:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create learning path'}`);
    }
  }

  async getLearningPath(pathId: number) {
    try {
      const [path] = await db.select().from(learningPaths).where(eq(learningPaths.id, pathId));
      return path || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting learning path ${pathId}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to get learning path'}`);
    }
  }

  async getLearningPaths(userId?: number) {
    try {
      if (userId) {
        return await db.select().from(learningPaths).where(eq(learningPaths.userId, userId));
      }
      return await db.select().from(learningPaths);
    } catch (error: any) {
      console.error('[STORAGE] Error getting learning paths:', error?.message || error);
      return [];
    }
  }

  async getUserLearningPaths(userId: number) {
    return this.getLearningPaths(userId);
  }

  async updateLearningPath(id: number, updates: any) {
    try {
      const [updated] = await db.update(learningPaths).set(updates).where(eq(learningPaths.id, id)).returning();
      return updated || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error updating learning path ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to update learning path'}`);
    }
  }

  async updateLearningPathProgress(pathId: number, progress: number) {
    return this.updateLearningPath(pathId, { completion: progress });
  }

  async deleteLearningPath(id: number) {
    try {
      await db.delete(learningPaths).where(eq(learningPaths.id, id));
      return { success: true };
    } catch (error: any) {
      console.error(`[STORAGE] Error deleting learning path ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to delete learning path'}`);
    }
  }

  async createLearningPathStep(stepData: any) {
    try {
      const [created] = await db.insert(learningPathSteps).values(stepData).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating learning path step:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create learning path step'}`);
    }
  }

  async addLearningPathStep(stepData: any) {
    return this.createLearningPathStep(stepData);
  }

  async markStepAsCompleted(pathId: number, stepId: number) {
    try {
      // Schema doesn't have completed field, skip update
      const [updated] = await db.select()
        .from(learningPathSteps)
        .where(and(eq(learningPathSteps.pathId, pathId), eq(learningPathSteps.id, stepId)))
        .limit(1);
      return updated || null;
    } catch (error: any) {
      console.error('[STORAGE] Error marking step as completed:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to mark step as completed'}`);
    }
  }

  // Module and Lesson methods - Stub implementations
  async createModule(moduleData: any) {
    try {
      const [created] = await db.insert(modules).values(moduleData).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating module:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create module'}`);
    }
  }

  async createLesson(lessonData: any) {
    try {
      const [created] = await db.insert(lessons).values(lessonData).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating lesson:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create lesson'}`);
    }
  }

  async updateUserCourseProgress(userId: number, courseId: number, progress: number) {
    try {
      // Schema doesn't have progress field, skip update
      const [updated] = await db.select()
        .from(userCourses)
        .where(and(eq(userCourses.userId, userId), eq(userCourses.courseId, courseId)))
        .limit(1);
      return updated || null;
    } catch (error: any) {
      console.error('[STORAGE] Error updating user course progress:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to update user course progress'}`);
    }
  }

  // Course methods - Stub implementations
  async getAllCourses() {
    return this.getCourses();
  }

  async getCoursesInCategory(categoryId: number) {
    try {
      return await db.select().from(courses).where(eq(courses.categoryId, categoryId));
    } catch (error: any) {
      console.error('[STORAGE] Error getting courses in category:', error?.message || error);
      return [];
    }
  }

  async updateUserInterests(userId: number, interests: string[]) {
    // Stub implementation
    return { success: true };
  }

  async updateUserStripeInfo(userId: number, stripeData: { customerId?: string; subscriptionId?: string }) {
    // Schema doesn't have stripeCustomerId/stripeSubscriptionId fields, skip update
    console.warn('[STORAGE] updateUserStripeInfo: stripe fields not in schema, skipping update');
  }

  async getPopularCourses() {
    // Stub implementation - return empty array for now
    return [];
  }

  async createUserCourse(data: any) {
    try {
      const [created] = await db.insert(userCourses).values(data).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating user course:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create user course'}`);
    }
  }

  async updateUserCourse(id: number, updates: any) {
    try {
      const [updated] = await db.update(userCourses).set(updates).where(eq(userCourses.id, id)).returning();
      return updated || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error updating user course ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to update user course'}`);
    }
  }

  async createUserLesson(data: any) {
    try {
      const [created] = await db.insert(userLessons).values(data).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating user lesson:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create user lesson'}`);
    }
  }

  // Category methods - Stub implementations
  async getCategories() {
    try {
      return await db.select().from(courseCategories);
    } catch (error: any) {
      console.error('[STORAGE] Error getting categories:', error?.message || error);
      return [];
    }
  }

  async getCategoryTree() {
    // Stub implementation
    return [];
  }

  async getCategory(id: number) {
    try {
      const [category] = await db.select().from(courseCategories).where(eq(courseCategories.id, id));
      return category || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting category ${id}:`, error?.message || error);
      return null;
    }
  }

  async createCategory(categoryData: any) {
    try {
      const [created] = await db.insert(courseCategories).values(categoryData).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating category:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create category'}`);
    }
  }

  async updateCategory(id: number, updates: any) {
    try {
      const [updated] = await db.update(courseCategories).set(updates).where(eq(courseCategories.id, id)).returning();
      return updated || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error updating category ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to update category'}`);
    }
  }

  async deleteCategory(id: number) {
    try {
      await db.delete(courseCategories).where(eq(courseCategories.id, id));
      return { success: true };
    } catch (error: any) {
      console.error(`[STORAGE] Error deleting category ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to delete category'}`);
    }
  }

  // Activity and Analytics methods - Stub implementations returning empty arrays/objects
  async logUserActivity(userId: number, activity: any) {
    return { success: true };
  }

  async getUserActivities(userId: number, limit?: number) {
    return [];
  }

  async getUserActivityByTimeframe(userId: number, startDate: Date, endDate: Date) {
    return [];
  }

  async getUserActivityLogs(userId: number, limit?: number) {
    return [];
  }

  async getCourseAnalytics(courseId: number) {
    return {};
  }

  async updateCourseAnalytics(courseId: number, analytics: any) {
    return { success: true };
  }

  async getUserProgressOverTime(userId: number, startDate: Date, endDate: Date) {
    return [];
  }

  async createUserProgressSnapshot(userId: number, snapshot: any) {
    return { success: true };
  }

  async getPlatformStats() {
    return {};
  }

  // Study Program methods - Stub implementations
  async getStudyPrograms() { return []; }
  async getStudyProgram(id: number) { return null; }
  async enrollUserInProgram(userId: number, programId: number) { return { success: true }; }
  async updateUserProgramProgress(userId: number, programId: number, progress: number) { return { success: true }; }
  async createStudyProgram(programData: any) { return { id: Date.now(), ...programData }; }
  async createStudySession(sessionData: any) {
    try {
      const [created] = await db.insert(studySessions).values(sessionData).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating study session:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create study session'}`);
    }
  }
  async updateStudySession(id: number, updates: any) {
    try {
      const [updated] = await db.update(studySessions).set(updates).where(eq(studySessions.id, id)).returning();
      return updated || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error updating study session ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to update study session'}`);
    }
  }
  async getProgramSchedules(programId: number) { return []; }
  async createProgramSchedule(scheduleData: any) { return { id: Date.now(), ...scheduleData }; }

  // Assessment methods - Stub implementations
  async getLevelAssessment(id: number) { return null; }
  async getAssessmentQuestions(assessmentId: number) { return []; }
  async createLevelAssessment(assessmentData: any) { return { id: Date.now(), ...assessmentData }; }
  async createAssessmentQuestion(questionData: any) { return { id: Date.now(), ...questionData }; }
  async updateAssessmentQuestion(id: number, updates: any) { return { id, ...updates }; }
  async updateLevelAssessment(id: number, updates: any) { return { id, ...updates }; }
  async updateUserSkillLevel(userId: number, skillId: number, level: number) { return { success: true }; }
  async getUserAssessments(userId: number) { return []; }
  async getUserSkillLevels(userId: number) { return []; }

  // TYT methods - Stub implementations (returning empty arrays/objects or null)
  async getTytStudentProfile(userId: number) { return null; }
  async createTytStudentProfile(profileData: any) { return { id: Date.now(), userId: profileData.userId, ...profileData }; }
  async updateTytStudentProfile(userId: number, updates: any) { return { userId, ...updates }; }
  async getTytSubjects() { return []; }
  async getTytTopics(subjectId?: number) { return []; }
  async getUserTopicProgress(userId: number, topicId: number) { return null; }
  async updateUserTopicProgress(userId: number, topicId: number, progress: any) { return { success: true }; }
  async getTytTrialExams(userId: number) { return []; }
  async getTytTrialExam(id: number) { return null; }
  async createTytTrialExam(examData: any) { return { id: Date.now(), ...examData }; }
  async deleteTytTrialExam(id: number) { return { success: true }; }
  async getDailyStudyTask(id: number) { return null; }
  async completeDailyStudyTask(id: number) { return { success: true }; }
  async deleteDailyStudyTask(id: number) { return { success: true }; }
  async updateDailyStudyTask(id: number, updates: any) { return { id, ...updates }; }
  async getTytStudySessions(userId: number) { return []; }
  async createTytStudySession(sessionData: any) { return { id: Date.now(), ...sessionData }; }
  async getTytStudySession(id: number) { return null; }
  async endTytStudySession(id: number) { return { success: true }; }
  async getTytStudyGoals(userId: number) { return []; }
  async createTytStudyGoal(goalData: any) { return { id: Date.now(), ...goalData }; }
  async getTytStudyGoal(id: number) { return null; }
  async updateTytStudyGoal(id: number, updates: any) { return { id, ...updates }; }
  async deleteTytStudyGoal(id: number) { return { success: true }; }
  async getTytStudyStreaks(userId: number) { return []; }
  async getTytStudyStats(userId: number) { return {}; }
  async getDailyStudyGoal(userId: number, date: Date) { return null; }
  async getDailyStudyGoals(userId: number) { return []; }
  async createDailyStudyGoal(goalData: any) { return { id: Date.now(), ...goalData }; }
  async updateDailyStudyGoal(id: number, updates: any) { return { id, ...updates }; }
  async getStudyHabits(userId: number) { return []; }
  async createStudyHabit(habitData: any) { return { id: Date.now(), ...habitData }; }
  async getDailyStudySessions(userId: number) { return []; }
  async createDailyStudySession(sessionData: any) { return { id: Date.now(), ...sessionData }; }
  async getTytResources() { return []; }
  async createTytResource(resourceData: any) { return { id: Date.now(), ...resourceData }; }
  async updateTytResource(id: number, updates: any) { return { id, ...updates }; }
  async deleteTytResource(id: number) { return { success: true }; }
  async getAiDailyPlan(userId: number, date: Date) { return null; }
  async getAiDailyPlans(userId: number) { return []; }
  async createAiDailyPlan(planData: any) { return { id: Date.now(), ...planData }; }
  async updateAiDailyPlanProgress(id: number, progress: any) { return { success: true }; }
  async getCurriculumSkills(curriculumId: number) { return []; }
  async getCurriculumModules(curriculumId: number) { return []; }
  async getCurriculumCheckpoints(curriculumId: number) { return []; }
  async getUserCurriculumTasks(userId: number, curriculumId?: number) { return []; }
  async getUserSkillProgress(userId: number, skillId?: number) { return null; }
  async getUserCurriculumTask(id: number) { return null; }
  async completeUserCurriculumTask(id: number) { return { success: true }; }
  async updateUserCurriculumTask(id: number, updates: any) { return { id, ...updates }; }
  async updateUserCurriculumProgress(userId: number, curriculumId: number, progress: number) { return { success: true }; }
  async updateUserSkillProgress(userId: number, skillId: number, progress: number) { return { success: true }; }
  async getSkillAssessments(skillId?: number) { return []; }
  async createSkillAssessment(assessmentData: any) { return { id: Date.now(), ...assessmentData }; }

  // Upload methods - Stub implementations
  async getUserUploads(userId: number) {
    try {
      return await db.select().from(uploads).where(eq(uploads.userId, userId));
    } catch (error: any) {
      console.error('[STORAGE] Error getting user uploads:', error?.message || error);
      return [];
    }
  }

  async getUpload(id: number) {
    try {
      const [upload] = await db.select().from(uploads).where(eq(uploads.id, id));
      return upload || null;
    } catch (error: any) {
      console.error(`[STORAGE] Error getting upload ${id}:`, error?.message || error);
      return null;
    }
  }

  async createUpload(uploadData: any) {
    try {
      const [created] = await db.insert(uploads).values(uploadData).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating upload:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create upload'}`);
    }
  }

  async deleteUpload(id: number) {
    try {
      await db.delete(uploads).where(eq(uploads.id, id));
      return { success: true };
    } catch (error: any) {
      console.error(`[STORAGE] Error deleting upload ${id}:`, error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to delete upload'}`);
    }
  }

  // Essay methods - Stub implementations
  async getUserEssays(userId: number) { return []; }
  async getEssay(id: number) { return null; }
  async createEssay(essayData: any) { return { id: Date.now(), ...essayData }; }
  async updateEssay(id: number, updates: any) { return { id, ...updates }; }
  async submitEssay(id: number) { return { success: true }; }
  async generateAiFeedback(essayId: number) { return { feedback: '' }; }

  // Weekly Study Plan methods - Stub implementations
  async getUserWeeklyStudyPlans(userId: number) { return []; }
  async getActiveWeeklyPlan(userId: number) { return null; }
  async getWeeklyStudyPlan(id: number) { return null; }
  async createWeeklyStudyPlan(planData: any) { return { id: Date.now(), ...planData }; }
  async generateWeeklyAiRecommendations(userId: number, planId: number) { return []; }
  async updateWeeklyStudyPlan(id: number, updates: any) { return { id, ...updates }; }
  async completeWeeklyPlan(id: number) { return { success: true }; }

  // Forum methods - Stub implementations
  async getForumPosts(filters?: any) { return []; }
  async getForumPost(id: number) { return null; }
  async incrementPostViews(id: number) { return { success: true }; }
  async createForumPost(postData: any) { return { id: Date.now(), ...postData }; }
  async updateForumPost(id: number, updates: any) { return { id, ...updates }; }
  async deleteForumPost(id: number) { return { success: true }; }
  async getPostComments(postId: number) { return []; }
  async createForumComment(commentData: any) { return { id: Date.now(), ...commentData }; }
  async getForumComment(id: number) { return null; }
  async updateForumComment(id: number, updates: any) { return { id, ...updates }; }
  async deleteForumComment(id: number) { return { success: true }; }

  // Certificate methods - Stub implementations
  async getUserCertificates(userId: number) { return []; }
  async getCertificate(id: number) { return null; }
  async verifyCertificate(id: string) { return null; }
  async createCertificate(certificateData: any) { return { id: Date.now(), ...certificateData }; }
  async revokeCertificate(id: number) { return { success: true }; }

  // Design Process methods - createDesignParameters needed here
  async createDesignParameters(data: any) {
    try {
      const [created] = await db.insert(curriculumDesignParameters).values(data as any).returning();
      return created;
    } catch (error: any) {
      console.error('[STORAGE] Error creating design parameters:', error?.message || error);
      throw new Error(`Database error: ${error?.message || 'Failed to create design parameters'}`);
    }
  }

  // AI Generation Session methods - Stub implementations
  async createAiGenerationSession(sessionData: any) { return { id: Date.now(), ...sessionData }; }
  async getGenerationSession(id: number) { return null; }
  async getUserGenerationSessions(userId: number) { return []; }
  async updateGenerationSession(id: number, updates: any) { return { id, ...updates }; }
  async archiveProduction(archiveData: any) { return { id: Date.now(), ...archiveData }; }
  async getProductionArchives(userId: number) { return []; }
  async saveLearningData(data: any) { return { id: Date.now(), ...data }; }
  async getLearningDataBySession(sessionId: number) { return []; }
  async getRecentLearningData(userId: number, limit?: number) { return []; }
  async updateLearningDataFeedback(id: number, feedback: any) { return { id, ...feedback }; }
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
  // Assignment methods
  async createAssignment(_assignmentData: any) { return { id: this.nextId++, ..._assignmentData }; }
  async createUserAssignment(_userAssignmentData: any) { return { success: true }; }
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
  // Challenge methods
  async createChallenge(_challenge: any) { return { id: this.nextId++, ..._challenge }; }
  async getChallenge(_id: number) { return null; }
  async updateChallenge(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async deactivateChallenge(_id: number) { return { id: _id, isActive: false }; }
  async getUserChallenges(_userId: number) { return []; }
  async assignChallengeToUser(_userId: number, _challengeId: number) { return { id: this.nextId++ }; }
  async updateUserChallengeProgress(_userId: number, _challengeId: number, _progress: number) { return { progress: _progress }; }
  async completeUserChallenge(_userId: number, _challengeId: number) { return { isCompleted: true }; }
  async getCourseRelatedChallenges(_courseId: number) { return []; }
  // User Level methods
  async initializeUserLevel(_userId: number) { return { level: 1, totalXp: 0 }; }
  async updateUserStreak(_userId: number) { return { streak: 1 }; }
  async addUserXp(_userId: number, _xp: number) { return { totalXp: _xp }; }
  async getAllUsersWithLevels() { return []; }
  // Achievement methods
  async getAllAchievements() { return []; }
  async unlockUserAchievement(_userId: number, _achievementId: number) { return { id: this.nextId++ }; }
  async checkAndUnlockAchievements(_userId: number) { return []; }
  // Learning Path methods
  async createLearningPath(_pathData: any) { return { id: this.nextId++, ..._pathData }; }
  async getLearningPath(_pathId: number) { return null; }
  async getLearningPaths(_userId?: number) { return []; }
  async getUserLearningPaths(_userId: number) { return []; }
  async updateLearningPath(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async updateLearningPathProgress(_pathId: number, _progress: number) { return { completion: _progress }; }
  async deleteLearningPath(_id: number) { return { success: true }; }
  async createLearningPathStep(_stepData: any) { return { id: this.nextId++, ..._stepData }; }
  async addLearningPathStep(_stepData: any) { return { id: this.nextId++, ..._stepData }; }
  async markStepAsCompleted(_pathId: number, _stepId: number) { return { completed: true }; }
  // Module and Lesson methods
  async createModule(_moduleData: any) { return { id: this.nextId++, ..._moduleData }; }
  async createLesson(_lessonData: any) { return { id: this.nextId++, ..._lessonData }; }
  async updateUserCourseProgress(_userId: number, _courseId: number, _progress: number) { return { progress: _progress }; }
  // Course methods
  async getAllCourses() { return []; }
  async getCoursesInCategory(_categoryId: number) { return []; }
  async getCourseRecommendations(_userId: number) { return []; }
  async saveCourseRecommendations(_userId: number, _recommendations: any[]) { return { success: true }; }
  async updateUserInterests(_userId: number, _interests: string[]) { return { success: true }; }
  async updateUserStripeInfo(_userId: number, _stripeData: { customerId?: string; subscriptionId?: string }) { return; }
  async getAiGeneratedCourses() { return []; }
  async getPopularCourses() { return []; }
  async enrollUserInCourse(_userId: number, _courseId: number) { return { id: this.nextId++ }; }
  async createUserCourse(_data: any) { return { id: this.nextId++, ..._data }; }
  async updateUserCourse(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async createUserLesson(_data: any) { return { id: this.nextId++, ..._data }; }
  // Category methods
  async getCategories() { return []; }
  async getCategoryTree() { return []; }
  async getCategory(_id: number) { return null; }
  async createCategory(_categoryData: any) { return { id: this.nextId++, ..._categoryData }; }
  async updateCategory(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async deleteCategory(_id: number) { return { success: true }; }
  // Activity and Analytics methods
  async logUserActivity(_userId: number, _activity: any) { return { success: true }; }
  async getUserActivities(_userId: number, _limit?: number) { return []; }
  async getUserActivityByTimeframe(_userId: number, _startDate: Date, _endDate: Date) { return []; }
  async getUserActivityLogs(_userId: number, _limit?: number) { return []; }
  async getCourseAnalytics(_courseId: number) { return {}; }
  async updateCourseAnalytics(_courseId: number, _analytics: any) { return { success: true }; }
  async getUserProgressOverTime(_userId: number, _startDate: Date, _endDate: Date) { return []; }
  async createUserProgressSnapshot(_userId: number, _snapshot: any) { return { success: true }; }
  async getPlatformStats() { return {}; }
  // Study Program methods
  async getStudyPrograms() { return []; }
  async getStudyProgram(_id: number) { return null; }
  async enrollUserInProgram(_userId: number, _programId: number) { return { success: true }; }
  async updateUserProgramProgress(_userId: number, _programId: number, _progress: number) { return { success: true }; }
  async createStudyProgram(_programData: any) { return { id: this.nextId++, ..._programData }; }
  async createStudySession(_sessionData: any) { return { id: this.nextId++, ..._sessionData }; }
  async updateStudySession(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async getUserWeeklyStats(_userId: number) { return {}; }
  async getProgramSchedules(_programId: number) { return []; }
  async createProgramSchedule(_scheduleData: any) { return { id: this.nextId++, ..._scheduleData }; }
  // Assessment methods
  async getLevelAssessment(_id: number) { return null; }
  async getAssessmentQuestions(_assessmentId: number) { return []; }
  async createLevelAssessment(_assessmentData: any) { return { id: this.nextId++, ..._assessmentData }; }
  async createAssessmentQuestion(_questionData: any) { return { id: this.nextId++, ..._questionData }; }
  async updateAssessmentQuestion(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async updateLevelAssessment(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async updateUserSkillLevel(_userId: number, _skillId: number, _level: number) { return { success: true }; }
  async getUserAssessments(_userId: number) { return []; }
  async getUserSkillLevels(_userId: number) { return []; }
  // TYT methods
  async getTytStudentProfile(_userId: number) { return null; }
  async createTytStudentProfile(_profileData: any) { return { id: this.nextId++, ..._profileData }; }
  async updateTytStudentProfile(_userId: number, _updates: any) { return { userId: _userId, ..._updates }; }
  async getTytSubjects() { return []; }
  async getTytTopics(_subjectId?: number) { return []; }
  async getUserTopicProgress(_userId: number, _topicId: number) { return null; }
  async updateUserTopicProgress(_userId: number, _topicId: number, _progress: any) { return { success: true }; }
  async getTytTrialExams(_userId: number) { return []; }
  async getTytTrialExam(_id: number) { return null; }
  async createTytTrialExam(_examData: any) { return { id: this.nextId++, ..._examData }; }
  async deleteTytTrialExam(_id: number) { return { success: true }; }
  async getDailyStudyTasks(_userId: number) { return []; }
  async getCurriculumContextForDailyTasks(_userId: number) { return {}; }
  async getDailyStudyTask(_id: number) { return null; }
  async createDailyStudyTask(_taskData: any) { return { id: this.nextId++, ..._taskData }; }
  async completeDailyStudyTask(_id: number) { return { success: true }; }
  async deleteDailyStudyTask(_id: number) { return { success: true }; }
  async updateDailyStudyTask(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async getTytStudySessions(_userId: number) { return []; }
  async createTytStudySession(_sessionData: any) { return { id: this.nextId++, ..._sessionData }; }
  async getTytStudySession(_id: number) { return null; }
  async endTytStudySession(_id: number) { return { success: true }; }
  async getTytStudyGoals(_userId: number) { return []; }
  async createTytStudyGoal(_goalData: any) { return { id: this.nextId++, ..._goalData }; }
  async getTytStudyGoal(_id: number) { return null; }
  async updateTytStudyGoal(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async deleteTytStudyGoal(_id: number) { return { success: true }; }
  async getTytStudyStreaks(_userId: number) { return []; }
  async getTytStudyStats(_userId: number) { return {}; }
  async getDailyStudyGoal(_userId: number, _date: Date) { return null; }
  async getDailyStudyGoals(_userId: number) { return []; }
  async createDailyStudyGoal(_goalData: any) { return { id: this.nextId++, ..._goalData }; }
  async updateDailyStudyGoal(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async getStudyHabits(_userId: number) { return []; }
  async createStudyHabit(_habitData: any) { return { id: this.nextId++, ..._habitData }; }
  async getDailyStudySessions(_userId: number) { return []; }
  async createDailyStudySession(_sessionData: any) { return { id: this.nextId++, ..._sessionData }; }
  async getTytResources() { return []; }
  async createTytResource(_resourceData: any) { return { id: this.nextId++, ..._resourceData }; }
  async updateTytResource(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async deleteTytResource(_id: number) { return { success: true }; }
  async getAiDailyPlan(_userId: number, _date: Date) { return null; }
  async getAiDailyPlans(_userId: number) { return []; }
  async createAiDailyPlan(_planData: any) { return { id: this.nextId++, ..._planData }; }
  async updateAiDailyPlanProgress(_id: number, _progress: any) { return { success: true }; }
  async generateAndSyncCurriculum(_userId: number) { return { success: true }; }
  async getUserCurriculums(_userId: number) { return []; }
  async getCurriculumSkills(_curriculumId: number) { return []; }
  async getCurriculumModules(_curriculumId: number) { return []; }
  async getCurriculumCheckpoints(_curriculumId: number) { return []; }
  async getUserCurriculumTasks(_userId: number, _curriculumId?: number) { return []; }
  async getUserSkillProgress(_userId: number, _skillId?: number) { return null; }
  async getUserCurriculumTask(_id: number) { return null; }
  async completeUserCurriculumTask(_id: number) { return { success: true }; }
  async updateUserCurriculumTask(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async updateUserCurriculumProgress(_userId: number, _curriculumId: number, _progress: number) { return { success: true }; }
  async updateUserSkillProgress(_userId: number, _skillId: number, _progress: number) { return { success: true }; }
  async getSkillAssessments(_skillId?: number) { return []; }
  async createSkillAssessment(_assessmentData: any) { return { id: this.nextId++, ..._assessmentData }; }
  // Upload methods
  async getUserUploads(_userId: number) { return []; }
  async getUpload(_id: number) { return null; }
  async createUpload(_uploadData: any) { return { id: this.nextId++, ..._uploadData }; }
  async deleteUpload(_id: number) { return { success: true }; }
  // Essay methods
  async getUserEssays(_userId: number) { return []; }
  async getEssay(_id: number) { return null; }
  async createEssay(_essayData: any) { return { id: this.nextId++, ..._essayData }; }
  async updateEssay(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async submitEssay(_id: number) { return { success: true }; }
  async generateAiFeedback(_essayId: number) { return { feedback: '' }; }
  // Weekly Study Plan methods
  async getUserWeeklyStudyPlans(_userId: number) { return []; }
  async getActiveWeeklyPlan(_userId: number) { return null; }
  async getWeeklyStudyPlan(_id: number) { return null; }
  async createWeeklyStudyPlan(_planData: any) { return { id: this.nextId++, ..._planData }; }
  async generateWeeklyAiRecommendations(_userId: number, _planId: number) { return []; }
  async updateWeeklyStudyPlan(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async completeWeeklyPlan(_id: number) { return { success: true }; }
  // Forum methods
  async getForumPosts(_filters?: any) { return []; }
  async getForumPost(_id: number) { return null; }
  async incrementPostViews(_id: number) { return { success: true }; }
  async createForumPost(_postData: any) { return { id: this.nextId++, ..._postData }; }
  async updateForumPost(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async deleteForumPost(_id: number) { return { success: true }; }
  async getPostComments(_postId: number) { return []; }
  async createForumComment(_commentData: any) { return { id: this.nextId++, ..._commentData }; }
  async getForumComment(_id: number) { return null; }
  async updateForumComment(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async deleteForumComment(_id: number) { return { success: true }; }
  // Certificate methods
  async getUserCertificates(_userId: number) { return []; }
  async getCertificate(_id: number) { return null; }
  async verifyCertificate(_id: string) { return null; }
  async createCertificate(_certificateData: any) { return { id: this.nextId++, ..._certificateData }; }
  async revokeCertificate(_id: number) { return { success: true }; }
  // Design Process methods
  async getDesignParameters(_designId: number) { return null; }
  async getSuccessMetrics(_designId: number) { return []; }
  async updateDesignParameters(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async updateSuccessMetrics(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async createDesignParameters(_data: any) { return { id: this.nextId++, ..._data }; }
  async getUserDesignProcesses(_userId: number) { return []; }
  // AI Generation Session methods
  async createAiGenerationSession(_sessionData: any) { return { id: this.nextId++, ..._sessionData }; }
  async getGenerationSession(_id: number) { return null; }
  async getUserGenerationSessions(_userId: number) { return []; }
  async updateGenerationSession(_id: number, _updates: any) { return { id: _id, ..._updates }; }
  async archiveProduction(_archiveData: any) { return { id: this.nextId++, ..._archiveData }; }
  async getProductionArchives(_userId: number) { return []; }
  async saveLearningData(_data: any) { return { id: this.nextId++, ..._data }; }
  async getLearningDataBySession(_sessionId: number) { return []; }
  async getRecentLearningData(_userId: number, _limit?: number) { return []; }
  async updateLearningDataFeedback(_id: number, _feedback: any) { return { id: _id, ..._feedback }; }
}

const useDatabase = !!process.env.DATABASE_URL;
export const storage: IStorage = useDatabase ? new DatabaseStorage() : new InMemoryStorage();
