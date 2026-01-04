import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger.js";

/**
 * Simple in-memory rate limiter for AI endpoints
 * For production, consider using Redis-based rate limiting (e.g., express-rate-limit with Redis store)
 */

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

const store: RateLimitStore = {};

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const key in store) {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  }
}, 5 * 60 * 1000);

/**
 * Rate limiting middleware for AI endpoints
 * Limits requests per IP address
 */
export function createRateLimiter(options: {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
}) {
  const { windowMs, maxRequests, message = "Too many requests, please try again later" } = options;

  return (req: Request, res: Response, next: NextFunction) => {
    // Use IP address as the key
    const key = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();

    // Get or create rate limit entry
    let entry = store[key];

    if (!entry || entry.resetTime < now) {
      // Create new entry or reset expired one
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      store[key] = entry;
      return next();
    }

    // Increment count
    entry.count++;

    // Check if limit exceeded
    if (entry.count > maxRequests) {
      logger.warn('Rate limit exceeded', {
        module: 'rate-limiter',
        ip: key,
        count: entry.count,
        maxRequests,
        path: req.path,
      });

      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      res.status(429).json({
        error: message,
        retryAfter: `${retryAfter} seconds`,
      });
      return;
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequests.toString());
    res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequests - entry.count).toString());
    res.setHeader('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    next();
  };
}

/**
 * Default rate limiter for AI endpoints
 * 10 requests per minute per IP
 */
export const aiRateLimiter = createRateLimiter({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10,
  message: "Too many AI requests. Please wait a moment before trying again.",
});

