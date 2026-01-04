import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { aiReasoningEngine } from "../ai/ai-reasoning.engine.js";
import { logger } from "../utils/logger.js";
import { requireAuthenticatedUser, validateRequest } from "../middleware/auth-validation.js";
import { aiRateLimiter } from "../middleware/rate-limiter.js";

const router = Router();

// Apply rate limiting to all AI routes
router.use(aiRateLimiter);

// Zod schema for adaptive plan request
const adaptivePlanSchema = z.object({
  studentId: z.number().int().positive("Student ID must be a positive integer"),
  studentData: z.object({
    studySettings: z.object({
      dailyStudyHours: z.number().min(0.5).max(12).optional(),
    }).optional(),
    examPreferences: z.object({
      tytTargetScore: z.number().int().min(0).max(600).optional(),
    }).optional(),
  }).optional(),
  progressData: z.object({
    weak_topics: z.array(z.string()).optional(),
  }).optional(),
});

// Apply authentication middleware to all AI routes
router.use(requireAuthenticatedUser);

// Request timeout middleware for AI endpoints
const createTimeout = (timeoutMs: number) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        logger.warn('Request timeout', {
          module: 'ai-routes',
          path: req.path,
          timeoutMs,
        });
        res.status(504).json({
          error: 'Request timeout',
          message: 'The AI service took too long to respond. Please try again.',
        });
      }
    }, timeoutMs);

    // Clear timeout when response is sent
    const originalEnd = res.end;
    res.end = function(...args: any[]) {
      clearTimeout(timeout);
      return originalEnd.apply(this, args);
    };

    next();
  };
};

// Request size limit middleware (100KB for AI endpoints)
const requestSizeLimit = (req: Request, res: Response, next: NextFunction) => {
  const contentLength = req.get('content-length');
  const maxSize = 100 * 1024; // 100KB

  if (contentLength && parseInt(contentLength) > maxSize) {
    logger.warn('Request size limit exceeded', {
      module: 'ai-routes',
      path: req.path,
      size: contentLength,
      maxSize,
    });
    return res.status(413).json({
      error: 'Request too large',
      message: `Request body must be smaller than ${maxSize / 1024}KB`,
    });
  }

  next();
};

router.post("/adaptive-plan", 
  requestSizeLimit, // 100KB limit
  createTimeout(30000), // 30 second timeout
  validateRequest(adaptivePlanSchema), 
  async (req, res) => {
  const requestId = req.headers['x-request-id'] as string || `req_${Date.now()}`;
  let validatedData: any;
  
  try {
    validatedData = (req as any).validatedData;
    const { studentId, studentData, progressData } = validatedData;

    // Student ID ownership check - user can only request plans for themselves
    const userId = (req as any).user?.id;
    if (!userId) {
      logger.warn('User ID not found in session', {
        module: 'ai-routes',
        action: 'adaptive-plan',
        requestId
      });
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Enforce that user can only request plans for their own student ID
    if (studentId !== userId) {
      logger.warn('Student ID ownership violation', {
        module: 'ai-routes',
        action: 'adaptive-plan',
        requestId,
        userId,
        requestedStudentId: studentId
      });
      return res.status(403).json({ 
        error: 'Access denied: You can only request plans for your own account' 
      });
    }

    logger.info('Generating adaptive plan via API', {
      module: 'ai-routes',
      action: 'adaptive-plan',
      requestId,
      studentId
    });

    const plan = await aiReasoningEngine.generateAdaptiveDailyPlan(
      studentId,
      studentData,
      progressData
    );

    logger.info('Adaptive plan generated via API', {
      module: 'ai-routes',
      action: 'adaptive-plan',
      requestId,
      studentId,
      planDate: plan.date
    });

    res.json(plan);
  } catch (error) {
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage = error instanceof Error ? error.message : String(error);
    
    logger.error('Error generating adaptive plan via API', 
      error instanceof Error ? error : new Error(errorMessage), 
      {
        module: 'ai-routes',
        action: 'adaptive-plan',
        requestId,
        studentId: validatedData?.studentId
      }
    );
    
    // Sanitize error messages in production
    res.status(500).json({ 
      error: 'Failed to generate adaptive plan',
      ...(isDevelopment && { message: errorMessage, stack: error instanceof Error ? error.stack : undefined })
    });
  }
});

export default router;

