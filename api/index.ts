import "dotenv/config";
// ESM path alias resolution for @shared/* imports
// Since tsconfig-paths doesn't work with ESM, we use a custom resolver
import { fileURLToPath } from "url";
import { dirname, resolve as pathResolve } from "path";
import { createRequire } from "module";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = pathResolve(__dirname, "..");

// Patch the import system to resolve @shared/* paths
// This works by intercepting dynamic imports
const originalImport = globalThis.import;
if (typeof originalImport === 'undefined') {
  // Create a custom import function that resolves @shared/* paths
  const require = createRequire(import.meta.url);
  const Module = require('module');
  
  // For ESM, we need to use a different approach
  // Store the resolver function for use in dynamic imports
  (globalThis as any).__sharedPathResolver = (specifier: string) => {
    if (specifier.startsWith('@shared/')) {
      const relativePath = specifier.replace('@shared/', './shared/');
      const fullPath = pathResolve(projectRoot, relativePath);
      return pathToFileURL(fullPath).href;
    }
    return specifier;
  };
}

import { pathToFileURL } from "url";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes.js";
import sitemapRoutes from "../server/routes-sitemap.js";
import { logger } from "../server/utils/logger.js";
import { ErrorHandler } from "../server/middleware/error-handler.js";

// Declare process for TypeScript
declare const process: {
  env?: {
    NODE_ENV?: string;
    [key: string]: string | undefined;
  };
};

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Ensure proper content-type headers
app.use((req: Request, res: Response, next: NextFunction) => {
  // Only set content-type if not already set
  if (!res.getHeader('content-type')) {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
  }
  next();
});

// SEO routes (sitemap, robots.txt)
app.use(sitemapRoutes);

// Logging middleware with request ID tracking
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;
  const requestId = (req as any).requestId || `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  (req as any).requestId = requestId;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      logger.request(req.method, path, res.statusCode, duration, requestId);
    }
  });

  next();
});

// Error handler middleware - must come after routes are registered
app.use(ErrorHandler.handleError);

// Initialize app
let appInitialized = false;
let initializationPromise: Promise<void> | null = null;

async function initializeApp() {
  if (appInitialized) {
    logger.debug("App already initialized, skipping");
    return;
  }
  
  if (initializationPromise) {
    logger.debug("Initialization already in progress, waiting...");
    return initializationPromise;
  }

  initializationPromise = (async () => {
    const initStartTime = Date.now();
    const initId = `init_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    try {
      logger.info("Starting application initialization", { requestId: initId });

      // Step 1: Verify critical modules can be loaded
      logger.debug("Step 1: Verifying module resolution", { requestId: initId });
      try {
        await import("@shared/schema");
        logger.debug("✓ @shared/schema loaded successfully", { requestId: initId });
      } catch (error: any) {
        logger.error("✗ Failed to load @shared/schema", error, { requestId: initId });
        throw new Error(`Module resolution failed: @shared/schema - ${error.message}`);
      }

      try {
        await import("../server/storage.js");
        logger.debug("✓ server/storage.js loaded successfully", { requestId: initId });
      } catch (error: any) {
        logger.error("✗ Failed to load server/storage.js", error, { requestId: initId });
        throw new Error(`Module resolution failed: server/storage.js - ${error.message}`);
      }

      // Step 2: Register routes
      logger.debug("Step 2: Registering routes", { requestId: initId });
      await registerRoutes(app);
      logger.info("✓ Routes registered successfully", { requestId: initId });
      
      // 404 handler - must be AFTER all routes are registered
      app.use((_req: Request, res: Response) => {
        if (!res.headersSent) {
          res.status(404).json({ error: "Not Found" });
        }
      });
      
      appInitialized = true;
      const initDuration = Date.now() - initStartTime;
      logger.info("Application initialized successfully", { 
        requestId: initId,
        duration: `${initDuration}ms`,
      });
    } catch (error: any) {
      const initDuration = Date.now() - initStartTime;
      logger.error("FATAL ERROR during initialization", error, {
        requestId: initId,
        duration: `${initDuration}ms`,
      });
      // Don't set appInitialized to true on error
      throw error;
    }
  })();

  return initializationPromise;
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  try {
    // CRITICAL: Check if this is a static asset request BEFORE any processing
    // This prevents SSL_ERROR_RX_RECORD_TOO_LONG when static assets accidentally reach this handler
    const rawPath = req.url || req.originalUrl || req.path || '';
    const staticAssetExtensions = ['.css', '.js', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf', '.eot', '.json', '.map'];
    const isStaticAsset = staticAssetExtensions.some(ext => rawPath.toLowerCase().includes(ext));
    
    if (isStaticAsset || rawPath.startsWith('/assets/')) {
      // This is a static asset - don't process it, let Vercel handle it
      logger.debug(`Static asset request detected, ignoring: ${rawPath}`);
      // Return undefined to let Vercel's static file handler take over
      return;
    }
    
    // Vercel rewrites /api/* to /api (this handler)
    // Extract the original path from various possible locations
    let apiPath = rawPath;
    
    // Vercel provides the original path in different headers depending on configuration
    // Try x-vercel-rewrite first (common), then x-invoke-path, then x-requested-url
    const rewriteHeader = req.headers['x-vercel-rewrite'] || 
                         req.headers['x-invoke-path'] || 
                         req.headers['x-requested-url'] ||
                         req.headers['x-forwarded-path'];
    
    if (rewriteHeader) {
      apiPath = rewriteHeader;
    }
    
    // If we still don't have a path or it's just '/api', try to get from query string
    if (!apiPath || apiPath === '/api') {
      // Sometimes Vercel passes the path as a query parameter
      const pathFromQuery = req.query?._path || req.query?.path;
      if (pathFromQuery) {
        apiPath = pathFromQuery.startsWith('/') ? pathFromQuery : `/${pathFromQuery}`;
      } else {
        // Fallback: use the request path from headers
        const host = req.headers.host || '';
        const fullUrl = req.headers['x-forwarded-url'] || req.headers['x-forwarded-uri'] || '';
        if (fullUrl) {
          try {
            const url = new URL(fullUrl);
            apiPath = url.pathname;
          } catch {
            // Invalid URL, continue with default
          }
        }
      }
    }

    // Ensure apiPath is valid and starts with /api
    // CRITICAL: If path doesn't start with /api, this handler should not process it
    // Static assets (CSS, JS, images) should never reach this handler
    if (!apiPath || (!apiPath.startsWith('/api') && apiPath !== '/api')) {
      // This should never happen due to vercel.json rewrites, but if it does,
      // we should NOT set JSON headers - let Vercel handle it as a static file
      logger.debug(`Non-API path reached handler, ignoring: ${apiPath}`);
      // Don't send any response - let Vercel's static file handler take over
      // This prevents SSL_ERROR_RX_RECORD_TOO_LONG when static assets accidentally reach here
      return;
    }

    // Set headers for API responses ONLY after confirming it's an API path
    // This prevents SSL errors when static assets accidentally reach the handler
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    }

    // Store the original path with query string for Express
    const fullApiPath = apiPath;
    // Get path without query string for path matching
    const apiPathWithoutQuery = apiPath.split('?')[0];

    // Generate request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    (req as any).requestId = requestId;
    
    logger.debug("Incoming request", {
      requestId,
      method: req.method,
      path: apiPath,
      headers: {
        'user-agent': req.headers['user-agent'],
        'content-type': req.headers['content-type'],
      },
    });

    // Initialize app (only once) - with timeout and error handling
    try {
      await Promise.race([
        initializeApp(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout after 10s')), 10000)
        )
      ]);
      logger.debug("App initialization completed", { requestId });
    } catch (initError: any) {
      logger.error("Initialization error", initError, { requestId });
      // If initialization fails completely, return error immediately
      if (!appInitialized) {
        logger.error("App not initialized - returning 503", { requestId });
        if (!res.headersSent) {
          return res.status(503).json({ 
            error: "Service unavailable", 
            message: initError?.message || "Server initialization failed. Please try again later.",
            details: process.env.NODE_ENV === 'development' ? initError?.stack : undefined,
            requestId,
          });
        }
        return;
      }
      // If app is partially initialized, continue - some routes might work
      logger.warn("App partially initialized - continuing with request", { requestId });
    }

    // Update request for Express - preserve query string
    req.url = fullApiPath;
    req.originalUrl = fullApiPath;
    req.path = apiPathWithoutQuery;

    // Handle request with Express
    return new Promise<void>((resolve) => {
      let finished = false;
      
      const finish = () => {
        if (!finished) {
          finished = true;
          resolve();
        }
      };

      const originalEnd = res.end.bind(res);
      res.end = function(chunk?: any, encoding?: any, cb?: any) {
        originalEnd(chunk, encoding, cb);
        finish();
      };

      // Set timeout to ensure response is always sent
      const timeout = setTimeout(() => {
        if (!finished && !res.headersSent) {
          try {
            res.status(504).json({ error: "Request timeout" });
          } catch (e) {
            logger.error("Error sending timeout response", e, { requestId });
          }
          finish();
        }
      }, 25000); // 25 seconds (before Vercel's 30s limit)

      // Set a maximum processing time for the request
      const processingTimeout = setTimeout(() => {
        if (!res.headersSent && !finished) {
          logger.error('Request processing timeout', undefined, { requestId });
          try {
            res.status(504).json({ error: "Gateway timeout" });
            finish();
          } catch (e) {
            logger.error("Error sending timeout response", e, { requestId });
            finish();
          }
        }
      }, 20000); // 20 seconds

      app(req, res, (err: any) => {
        clearTimeout(timeout);
        clearTimeout(processingTimeout);
        
        if (err) {
          logger.error("Express error", err, { requestId, path: apiPathWithoutQuery });
          if (!res.headersSent && !finished) {
            try {
              res.status(500).json({ error: "Internal server error", message: err.message });
            } catch (e) {
              logger.error("Error sending error response", e, { requestId });
            }
            finish();
          } else {
            finish();
          }
        } else if (!res.headersSent && !finished) {
          // If no response was sent, send 404
          try {
            res.status(404).json({ error: "Not Found", path: apiPathWithoutQuery });
          } catch (e) {
            logger.error("Error sending 404 response", e, { requestId });
          }
          finish();
        } else {
          // Response already sent or finished
          finish();
        }
      });
    });
  } catch (error: any) {
    const requestId = (req as any)?.requestId || 'unknown';
    logger.error("Handler error", error, { requestId });
    if (!res.headersSent) {
      try {
        res.status(500).json({ error: "Internal server error" });
      } catch (e) {
        logger.error("Error sending error response in catch", e, { requestId });
      }
    }
  }
}
