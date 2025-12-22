import { Router, type Express } from 'express';
import { curriculumAIEngine } from '../ai-curriculum-generation.js';
import { db } from '../db.js';
import { userCurriculums, courses } from '../../shared/schema.js';
import { eq } from 'drizzle-orm';

export const curriculumGenerationRouter = Router();

/**
 * Generate personalized curriculum
 * POST /api/curriculum/generate
 */
curriculumGenerationRouter.post('/generate', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userId = (req.user as any).id;
    const { preferences } = req.body;

    const result = await curriculumAIEngine.generatePersonalizedCurriculum(userId, preferences);

    if (result.success) {
      res.json({
        success: true,
        data: {
          curriculum: result.curriculum,
          generationId: result.generationId,
          message: result.message
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('[CurriculumGeneration] Generate failed:', error);
    res.status(500).json({ error: 'Failed to generate curriculum' });
  }
});

/**
 * Get all user's generated curricula
 * GET /api/curriculum/list
 */
curriculumGenerationRouter.get('/list', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userId = (req.user as any).id;
    const productions = curriculumAIEngine.getProductions(userId);

    const curriculaData = productions.map(genId => {
      const production = curriculumAIEngine.getProductionData(genId);
      return {
        generationId: genId,
        curriculum: production?.selectedCurriculum,
        createdAt: production?.createdAt,
        confidence: production?.aiInsights.confidenceScore
      };
    });

    res.json({
      success: true,
      data: curriculaData,
      count: curriculaData.length
    });
  } catch (error) {
    console.error('[CurriculumGeneration] List failed:', error);
    res.status(500).json({ error: 'Failed to fetch curricula' });
  }
});

/**
 * Get specific curriculum production details
 * GET /api/curriculum/production/:generationId
 */
curriculumGenerationRouter.get('/production/:generationId', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { generationId } = req.params;
    const production = curriculumAIEngine.getProductionData(generationId);

    if (!production) {
      return res.status(404).json({ error: 'Production not found' });
    }

    // Verify ownership
    if (production.userContext.userId !== (req.user as any).id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({
      success: true,
      data: production
    });
  } catch (error) {
    console.error('[CurriculumGeneration] Get production failed:', error);
    res.status(500).json({ error: 'Failed to fetch production' });
  }
});

/**
 * Get generation session status
 * GET /api/curriculum/session/:generationId
 */
curriculumGenerationRouter.get('/session/:generationId', async (req, res) => {
  if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
  try {
    const { generationId } = req.params;
    const session = curriculumAIEngine.getGenerationSession(generationId);

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({
      success: true,
      data: {
        id: session.id,
        userId: session.userId,
        status: session.status,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        productionId: session.productionId
      }
    });
  } catch (error) {
    console.error('[CurriculumGeneration] Get session failed:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

/**
 * Export curriculum to JSON
 * GET /api/curriculum/:generationId/export
 */
curriculumGenerationRouter.get('/:generationId/export', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { generationId } = req.params;
    const production = curriculumAIEngine.getProductionData(generationId);

    if (!production) {
      return res.status(404).json({ error: 'Production not found' });
    }

    if (production.userContext.userId !== (req.user as any).id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const exportData = {
      generationId,
      curriculum: production.selectedCurriculum,
      metadata: {
        createdAt: production.createdAt,
        aiConfidence: production.aiInsights.confidenceScore,
        generatedFor: `User ${production.userContext.userId}`,
        totalCourses: production.selectedCurriculum.courses.length,
        estimatedDuration: production.selectedCurriculum.estimatedDuration
      },
      aiInsights: production.aiInsights,
      courses: production.selectedCurriculum.courses.map(c => ({
        id: c.id,
        title: c.titleEn || c.title,
        duration: c.durationHours || 40,
        level: c.level,
        description: c.descriptionEn || c.description
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="curriculum_${generationId}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('[CurriculumGeneration] Export failed:', error);
    res.status(500).json({ error: 'Failed to export curriculum' });
  }
});

/**
 * Get curriculum analytics
 * GET /api/curriculum/analytics/:generationId
 */
curriculumGenerationRouter.get('/analytics/:generationId', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { generationId } = req.params;
    const production = curriculumAIEngine.getProductionData(generationId);

    if (!production) {
      return res.status(404).json({ error: 'Production not found' });
    }

    if (production.userContext.userId !== (req.user as any).id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const analytics = {
      totalCourses: production.selectedCurriculum.courses.length,
      totalDuration: production.selectedCurriculum.estimatedDuration,
      totalSkills: production.selectedCurriculum.skills.length,
      milestones: production.selectedCurriculum.milestones.length,
      aiConfidence: production.aiInsights.confidenceScore,
      generationMethod: production.selectedCurriculum.generationMethod,
      interactionLogSize: production.interactionLog.length,
      timeToGenerate: production.savedAt.getTime() - production.createdAt.getTime(),
      curriculumType: production.selectedCurriculum.difficulty || 'mixed'
    };

    res.json({
      success: true,
      data: analytics
    });
  } catch (error) {
    console.error('[CurriculumGeneration] Analytics failed:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * Get interaction log for curriculum generation
 * GET /api/curriculum/interactions
 */
curriculumGenerationRouter.get('/interactions', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const interactions = curriculumAIEngine.exportInteractionLog();
    
    // Filter to user's interactions if needed
    const userInteractions = interactions.filter(i => i.userId === (req.user as any).id);

    res.json({
      success: true,
      data: userInteractions,
      count: userInteractions.length
    });
  } catch (error) {
    console.error('[CurriculumGeneration] Get interactions failed:', error);
    res.status(500).json({ error: 'Failed to fetch interactions' });
  }
});

/**
 * Regenerate curriculum with new preferences
 * POST /api/curriculum/:generationId/regenerate
 */
curriculumGenerationRouter.post('/:generationId/regenerate', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { preferences } = req.body;
    const userId = (req.user as any).id;

    // Get original production
    const originalProduction = curriculumAIEngine.getProductionData(req.params.generationId);
    if (originalProduction && originalProduction.userContext.userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Generate new curriculum with updated preferences
    const result = await curriculumAIEngine.generatePersonalizedCurriculum(userId, preferences);

    if (result.success) {
      res.json({
        success: true,
        data: {
          curriculum: result.curriculum,
          generationId: result.generationId,
          previousGenerationId: req.params.generationId,
          message: 'Curriculum regenerated with new preferences'
        }
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.message
      });
    }
  } catch (error) {
    console.error('[CurriculumGeneration] Regenerate failed:', error);
    res.status(500).json({ error: 'Failed to regenerate curriculum' });
  }
});

console.log('[CurriculumGeneration] Endpoints registered successfully');
export default curriculumGenerationRouter;
