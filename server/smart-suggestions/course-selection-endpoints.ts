import { Router } from 'express';
import { courseSelectionController } from '../course-selection-controller.js';

export const courseSelectionRouter = Router();

/**
 * Analyze selected courses - POST /api/course-selection/analyze
 */
courseSelectionRouter.post('/analyze', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { courseIds } = req.body;

    if (!courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ error: 'courseIds must be an array' });
    }

    const analysis = await courseSelectionController.analyzeCourseSelection(courseIds);
    res.json({ success: true, data: analysis });
  } catch (error) {
    console.error('[CourseSelection] Analyze failed:', error);
    res.status(500).json({ error: 'Failed to analyze courses' });
  }
});

/**
 * Build prerequisite tree - POST /api/course-selection/prerequisites
 */
courseSelectionRouter.post('/prerequisites', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { courseIds } = req.body;

    if (!courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ error: 'courseIds must be an array' });
    }

    const prerequisites = courseSelectionController.buildPrerequisiteTree(courseIds);
    res.json({ success: true, data: prerequisites });
  } catch (error) {
    console.error('[CourseSelection] Prerequisites failed:', error);
    res.status(500).json({ error: 'Failed to build prerequisite tree' });
  }
});

/**
 * Build optimal learning sequence - POST /api/course-selection/sequence
 */
courseSelectionRouter.post('/sequence', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { courseIds, constraints } = req.body;

    if (!courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ error: 'courseIds must be an array' });
    }

    const sequence = courseSelectionController.buildOptimalSequence(courseIds, constraints);
    res.json({ success: true, data: sequence });
  } catch (error) {
    console.error('[CourseSelection] Sequence failed:', error);
    res.status(500).json({ error: 'Failed to build learning sequence' });
  }
});

/**
 * Build curriculum structure - POST /api/course-selection/structure
 */
courseSelectionRouter.post('/structure', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { courseIds, constraints } = req.body;

    if (!courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ error: 'courseIds must be an array' });
    }

    const sequence = courseSelectionController.buildOptimalSequence(courseIds, constraints);
    const structure = courseSelectionController.buildCurriculumStructure(sequence, constraints);
    res.json({ success: true, data: structure });
  } catch (error) {
    console.error('[CourseSelection] Structure failed:', error);
    res.status(500).json({ error: 'Failed to build curriculum structure' });
  }
});

/**
 * Get completion estimate - POST /api/course-selection/estimate
 */
courseSelectionRouter.post('/estimate', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { courseIds, constraints } = req.body;

    if (!courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ error: 'courseIds must be an array' });
    }

    const sequence = courseSelectionController.buildOptimalSequence(courseIds, constraints);
    const estimate = courseSelectionController.estimateCompletionTime(sequence);
    res.json({ success: true, data: estimate });
  } catch (error) {
    console.error('[CourseSelection] Estimate failed:', error);
    res.status(500).json({ error: 'Failed to estimate completion time' });
  }
});

/**
 * Get difficulty curve - POST /api/course-selection/difficulty-curve
 */
courseSelectionRouter.post('/difficulty-curve', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { courseIds, constraints } = req.body;

    if (!courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ error: 'courseIds must be an array' });
    }

    const sequence = courseSelectionController.buildOptimalSequence(courseIds, constraints);
    const curve = courseSelectionController.calculateDifficultyCurve(sequence);
    res.json({ success: true, data: curve });
  } catch (error) {
    console.error('[CourseSelection] Difficulty curve failed:', error);
    res.status(500).json({ error: 'Failed to calculate difficulty curve' });
  }
});

/**
 * Get complete curriculum plan - POST /api/course-selection/plan
 */
courseSelectionRouter.post('/plan', async (req, res) => {
  try {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    const { courseIds, constraints } = req.body;

    if (!courseIds || !Array.isArray(courseIds)) {
      return res.status(400).json({ error: 'courseIds must be an array' });
    }

    const analysis = await courseSelectionController.analyzeCourseSelection(courseIds);
    const prerequisites = courseSelectionController.buildPrerequisiteTree(courseIds);
    const sequence = courseSelectionController.buildOptimalSequence(courseIds, constraints);
    const structure = courseSelectionController.buildCurriculumStructure(sequence, constraints);
    const estimate = courseSelectionController.estimateCompletionTime(sequence);
    const difficulty = courseSelectionController.calculateDifficultyCurve(sequence);

    res.json({
      success: true,
      data: {
        analysis,
        prerequisites,
        sequence,
        structure,
        estimate,
        difficulty,
        generatedAt: new Date()
      }
    });
  } catch (error) {
    console.error('[CourseSelection] Plan failed:', error);
    res.status(500).json({ error: 'Failed to generate curriculum plan' });
  }
});

console.log('[CourseSelection] Endpoints registered successfully');
export default courseSelectionRouter;
