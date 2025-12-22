import { Router } from 'express';
import { productionManager } from '../production-manager.js';

export const productionRouter = Router();

/**
 * Save curriculum production - POST /api/production/save
 */
productionRouter.post('/save', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const productionData = req.body;
    productionData.userId = (req.user as any).id;

    const result = await productionManager.saveProduction(productionData);
    res.json(result);
  } catch (error) {
    console.error('[Production] Save failed:', error);
    res.status(500).json({ error: 'Failed to save production' });
  }
});

/**
 * Retrieve similar productions - POST /api/production/similar
 */
productionRouter.post('/similar', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { userContext, maxResults = 5 } = req.body;

    if (!userContext) {
      return res.status(400).json({ error: 'userContext is required' });
    }

    const results = await productionManager.retrieveSimilarProductions(userContext, maxResults);
    res.json({ success: true, data: results });
  } catch (error) {
    console.error('[Production] Similar retrieval failed:', error);
    res.status(500).json({ error: 'Failed to retrieve similar productions' });
  }
});

/**
 * Get production by ID - GET /api/production/:productionId
 */
productionRouter.get('/:productionId', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { productionId } = req.params;

    const production = productionManager.getProduction(productionId);
    if (!production) {
      return res.status(404).json({ error: 'Production not found' });
    }

    // Verify ownership
    if (production.userId !== (req.user as any).id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    res.json({ success: true, data: production });
  } catch (error) {
    console.error('[Production] Get failed:', error);
    res.status(500).json({ error: 'Failed to retrieve production' });
  }
});

/**
 * List user's productions - GET /api/production/list
 */
productionRouter.get('/list', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const userId = (req.user as any).id;

    const productions = await productionManager.listUserProductions(userId);
    res.json({ success: true, data: productions });
  } catch (error) {
    console.error('[Production] List failed:', error);
    res.status(500).json({ error: 'Failed to list productions' });
  }
});

/**
 * Export production - GET /api/production/:productionId/export
 */
productionRouter.get('/:productionId/export', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { productionId } = req.params;

    const production = productionManager.getProduction(productionId);
    if (!production) {
      return res.status(404).json({ error: 'Production not found' });
    }

    // Verify ownership
    if (production.userId !== (req.user as any).id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const exported = productionManager.exportProduction(productionId);
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="production_${productionId}.json"`);
    res.send(exported);
  } catch (error) {
    console.error('[Production] Export failed:', error);
    res.status(500).json({ error: 'Failed to export production' });
  }
});

/**
 * Import production - POST /api/production/import
 */
productionRouter.post('/import', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { jsonData } = req.body;

    if (!jsonData) {
      return res.status(400).json({ error: 'jsonData is required' });
    }

    const result = await productionManager.importProduction(jsonData);
    if (result.success) {
      // Update user ownership
      const production = productionManager.getProduction(result.productionId!);
      if (production) {
        production.userId = (req.user as any).id;
      }
    }
    res.json(result);
  } catch (error) {
    console.error('[Production] Import failed:', error);
    res.status(500).json({ error: 'Failed to import production' });
  }
});

/**
 * Get production statistics - GET /api/production/:productionId/stats
 */
productionRouter.get('/:productionId/stats', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { productionId } = req.params;

    const production = productionManager.getProduction(productionId);
    if (!production) {
      return res.status(404).json({ error: 'Production not found' });
    }

    // Verify ownership
    if (production.userId !== (req.user as any).id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const stats = {
      totalCourses: production.curriculumOptions.length,
      selectedCourses: production.selectedCurriculum?.courses?.length || 0,
      aiConfidence: production.aiConfidenceScore,
      generationTime: production.generationDuration,
      coursesDuration: production.enrolledCourses.reduce((sum: number, c: any) => sum + (c.durationHours || 0), 0),
      createdAt: production.createdAt
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('[Production] Stats failed:', error);
    res.status(500).json({ error: 'Failed to retrieve statistics' });
  }
});

console.log('[Production] Endpoints registered successfully');
export default productionRouter;
