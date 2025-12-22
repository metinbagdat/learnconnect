import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../utils/logger.js';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  isOperational?: boolean;
  details?: any;
}

export class ErrorHandler {
  static createError(message: string, statusCode: number = 500, code?: string, details?: any): AppError {
    const error: AppError = new Error(message);
    error.statusCode = statusCode;
    error.code = code;
    error.isOperational = true;
    error.details = details;
    return error;
  }

  static handleError(error: AppError | Error, req: Request, res: Response, next: NextFunction): void {
    const requestId = (req as any).requestId || 'unknown';
    
    // If headers already sent, delegate to Express default error handler
    if (res.headersSent) {
      logger.warn('Headers already sent, delegating to Express error handler', {
        requestId,
        path: req.path,
        method: req.method,
      });
      return next(error);
    }

    // Determine error type and status code
    let statusCode = 500;
    let message = 'Internal server error';
    let errorCode: string | undefined;
    let details: any = undefined;

    if ('statusCode' in error && error.statusCode) {
      statusCode = error.statusCode;
      message = error.message;
      errorCode = error.code;
      details = error.details;
    } else if (error instanceof ZodError || error.name === 'ValidationError' || error.name === 'ZodError') {
      statusCode = 400;
      message = 'Validation error';
      errorCode = 'VALIDATION_ERROR';
      if (error instanceof ZodError) {
        details = error.errors.map(e => ({
          path: e.path.join('.'),
          message: e.message,
        }));
      }
    } else if (error.name === 'UnauthorizedError') {
      statusCode = 401;
      message = error.message || 'Unauthorized';
      errorCode = 'UNAUTHORIZED';
    } else if (error.message?.includes('ECONNREFUSED') || error.message?.includes('database')) {
      statusCode = 503;
      message = 'Database connection failed';
      errorCode = 'DATABASE_ERROR';
    } else if (error.message?.includes('MODULE_NOT_FOUND') || error.message?.includes('Cannot find module')) {
      statusCode = 500;
      message = 'Module resolution error';
      errorCode = 'MODULE_ERROR';
    }

    // Log the error
    const errorContext = {
      requestId,
      path: req.path,
      method: req.method,
      statusCode,
      errorCode,
      userId: (req as any).user?.id,
    };

    if (statusCode >= 500) {
      logger.error('Server error occurred', error, errorContext);
    } else {
      logger.warn('Client error occurred', {
        ...errorContext,
        message: error.message,
      });
    }

    // Send error response
    const isDevelopment = typeof process !== 'undefined' && process.env?.NODE_ENV === 'development';
    
    res.status(statusCode).json({
      success: false,
      error: message,
      code: errorCode,
      ...(details && { details }),
      ...(isDevelopment && { 
        stack: error.stack,
        originalError: error.message,
      }),
    });
  }

  static asyncHandler(fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) {
    return (req: Request, res: Response, next: NextFunction) => {
      Promise.resolve(fn(req, res, next)).catch(next);
    };
  }
}

// Error classification helpers
export function isOperationalError(error: any): boolean {
  if (error instanceof Error) {
    return 'isOperational' in error && error.isOperational === true;
  }
  return false;
}

export function classifyError(error: any): { type: string; severity: 'low' | 'medium' | 'high' } {
  const message = error?.message || String(error);
  const code = error?.code;

  // Database errors
  if (message.includes('database') || message.includes('ECONNREFUSED') || code === 'DATABASE_ERROR') {
    return { type: 'database', severity: 'high' };
  }

  // Module resolution errors
  if (message.includes('MODULE_NOT_FOUND') || message.includes('Cannot find module')) {
    return { type: 'module', severity: 'high' };
  }

  // Validation errors
  if (code === 'VALIDATION_ERROR' || error.name === 'ValidationError') {
    return { type: 'validation', severity: 'low' };
  }

  // Authentication errors
  if (code === 'UNAUTHORIZED' || error.name === 'UnauthorizedError') {
    return { type: 'auth', severity: 'medium' };
  }

  // Default to unknown
  return { type: 'unknown', severity: 'medium' };
}

