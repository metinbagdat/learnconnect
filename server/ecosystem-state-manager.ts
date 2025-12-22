/**
 * Step 6.1: Learning Ecosystem State Manager
 * Tracks and manages the complete state of a user's learning ecosystem
 * including all active integrations, dependencies, and AI decisions
 */

import { db } from './db.js';
import {
  learningEcosystemState,
  moduleDependencyGraph,
  aiIntegrationLog,
  courseIntegrationState,
  userCourses,
} from '../shared/schema.js';
import { eq, and } from 'drizzle-orm';

interface EcosystemStateSnapshot {
  userId: number;
  activeCourses: any[];
  currentCurriculum: any;
  activeStudyPlan: any;
  pendingAssignments: any[];
  activeTargets: any[];
  aiRecommendations: any[];
  synchronizationStatus: Record<string, boolean>;
}

interface ModuleDependency {
  sourceModule: string;
  targetModule: string;
  type: 'data' | 'trigger' | 'sequence';
  strength: number;
  required: boolean;
}

interface AIIntegrationDecision {
  trigger: string;
  model: string;
  inputData: any;
  decision: any;
  confidence: number;
  result: any;
}

export class EcosystemStateManager {
  /**
   * Initialize or get learning ecosystem state for a user
   */
  async initializeEcosystemState(userId: number): Promise<any> {
    try {
      // Check if ecosystem state exists
      const [existing] = await db
        .select()
        .from(learningEcosystemState)
        .where(eq(learningEcosystemState.userId, userId));

      if (existing) {
        return existing;
      }

      // Get user's enrolled courses
      const enrolledCourses = await db
        .select()
        .from(userCourses)
        .where(eq(userCourses.userId, userId));

      // Create new ecosystem state
      const newState = await db
        .insert(learningEcosystemState)
        .values({
          userId,
          activeCourses: enrolledCourses.map((uc: any) => ({
            courseId: uc.courseId,
            progress: uc.progress,
            enrolled: true,
          })),
          currentCurriculum: {},
          activeStudyPlan: {},
          pendingAssignments: [],
          activeTargets: [],
          aiRecommendations: [],
          ecosystemVersion: '1.0.0',
          synchronizationStatus: {
            curriculum: false,
            studyPlan: false,
            assignments: false,
            targets: false,
            aiRecommendations: false,
          },
        })
        .returning();

      return newState[0];
    } catch (error) {
      console.error('[EcosystemStateManager] Error initializing ecosystem state:', error);
      throw error;
    }
  }

  /**
   * Update ecosystem state with new integration data
   */
  async updateEcosystemState(
    userId: number,
    updates: Partial<EcosystemStateSnapshot>
  ): Promise<any> {
    try {
      const [updated] = await db
        .update(learningEcosystemState)
        .set({
          activeCourses: updates.activeCourses,
          currentCurriculum: updates.currentCurriculum,
          activeStudyPlan: updates.activeStudyPlan,
          pendingAssignments: updates.pendingAssignments,
          activeTargets: updates.activeTargets,
          aiRecommendations: updates.aiRecommendations,
          synchronizationStatus: updates.synchronizationStatus,
          updatedAt: new Date(),
        })
        .where(eq(learningEcosystemState.userId, userId))
        .returning();

      return updated;
    } catch (error) {
      console.error('[EcosystemStateManager] Error updating ecosystem state:', error);
      throw error;
    }
  }

  /**
   * Get current ecosystem state
   */
  async getEcosystemState(userId: number): Promise<any> {
    try {
      const [state] = await db
        .select()
        .from(learningEcosystemState)
        .where(eq(learningEcosystemState.userId, userId));

      return state || null;
    } catch (error) {
      console.error('[EcosystemStateManager] Error getting ecosystem state:', error);
      return null;
    }
  }

  /**
   * Register module dependency
   */
  async registerModuleDependency(
    sourceModule: string,
    targetModule: string,
    dependency: ModuleDependency
  ): Promise<any> {
    try {
      const [existing] = await db
        .select()
        .from(moduleDependencyGraph)
        .where(
          and(
            eq(moduleDependencyGraph.sourceModule, sourceModule),
            eq(moduleDependencyGraph.targetModule, targetModule)
          )
        );

      if (existing) {
        return existing;
      }

      const [created] = await db
        .insert(moduleDependencyGraph)
        .values({
          sourceModule,
          targetModule,
          dependencyType: dependency.type,
          dependencyStrength: dependency.strength,
          required: dependency.required,
        })
        .returning();

      return created;
    } catch (error) {
      console.error('[EcosystemStateManager] Error registering dependency:', error);
      throw error;
    }
  }

  /**
   * Get module dependencies
   */
  async getModuleDependencies(sourceModule: string): Promise<any[]> {
    try {
      return await db
        .select()
        .from(moduleDependencyGraph)
        .where(eq(moduleDependencyGraph.sourceModule, sourceModule));
    } catch (error) {
      console.error('[EcosystemStateManager] Error getting dependencies:', error);
      return [];
    }
  }

  /**
   * Log AI integration decision
   */
  async logAIIntegrationDecision(
    userId: number,
    decision: AIIntegrationDecision
  ): Promise<any> {
    try {
      const [logged] = await db
        .insert(aiIntegrationLog)
        .values({
          userId,
          integrationTrigger: decision.trigger,
          aiModelUsed: decision.model,
          inputData: decision.inputData,
          aiDecision: decision.decision,
          confidenceScore: decision.confidence,
          executionResult: decision.result,
        })
        .returning();

      return logged;
    } catch (error) {
      console.error('[EcosystemStateManager] Error logging AI decision:', error);
      throw error;
    }
  }

  /**
   * Get AI integration history
   */
  async getAIIntegrationHistory(userId: number, limit: number = 50): Promise<any[]> {
    try {
      return await db
        .select()
        .from(aiIntegrationLog)
        .where(eq(aiIntegrationLog.userId, userId))
        .orderBy((t) => t.createdAt)
        .limit(limit);
    } catch (error) {
      console.error('[EcosystemStateManager] Error getting AI history:', error);
      return [];
    }
  }

  /**
   * Synchronize ecosystem state across all modules
   */
  async synchronizeEcosystem(userId: number): Promise<boolean> {
    try {
      const state = await this.getEcosystemState(userId);
      if (!state) {
        return false;
      }

      // Get integration state
      const [integrationState] = await db
        .select()
        .from(courseIntegrationState)
        .where(eq(courseIntegrationState.userId, userId));

      // Update synchronization status
      const syncStatus = {
        curriculum: integrationState?.curriculumIntegrated || false,
        studyPlan: integrationState?.studyPlanGenerated || false,
        assignments: integrationState?.assignmentsCreated || false,
        targets: integrationState?.targetsUpdated || false,
        aiRecommendations: integrationState?.aiRecommendationsGenerated || false,
      };

      await this.updateEcosystemState(userId, {
        userId,
        synchronizationStatus: syncStatus,
      });

      return true;
    } catch (error) {
      console.error('[EcosystemStateManager] Error synchronizing ecosystem:', error);
      return false;
    }
  }

  /**
   * Get ecosystem health metrics
   */
  async getEcosystemHealth(userId: number): Promise<any> {
    try {
      const state = await this.getEcosystemState(userId);
      const integrationHistory = await this.getAIIntegrationHistory(userId, 100);

      if (!state) {
        return null;
      }

      const syncStatus = state.synchronizationStatus || {};
      const syncedModules = Object.values(syncStatus).filter((v) => v).length;
      const totalModules = Object.keys(syncStatus).length;
      const syncRate = totalModules > 0 ? (syncedModules / totalModules) * 100 : 0;

      const avgConfidence =
        integrationHistory.length > 0
          ? integrationHistory.reduce((sum: number, log: any) => sum + (log.confidenceScore || 0), 0) /
            integrationHistory.length
          : 0;

      return {
        synchronizationRate: syncRate,
        syncedModules,
        totalModules,
        aiDecisionCount: integrationHistory.length,
        averageAIConfidence: avgConfidence,
        lastUpdate: state.updatedAt,
        ecosystemVersion: state.ecosystemVersion,
      };
    } catch (error) {
      console.error('[EcosystemStateManager] Error getting health:', error);
      return null;
    }
  }
}

export const ecosystemStateManager = new EcosystemStateManager();
