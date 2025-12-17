import "dotenv/config";
import express from "express";
import type { Request, Response, NextFunction } from "express";
import { registerRoutes } from "../server/routes.js";
import sitemapRoutes from "../server/routes-sitemap.js";

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

// Logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  const path = req.path;

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      console.log(`${req.method} ${path} ${res.statusCode} in ${duration}ms`);
    }
  });

  next();
});

// Error handler middleware - must come after routes are registered
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("[ERROR]", {
    message: err.message,
    stack: err.stack,
    code: err.code,
    status: status,
    path: _req.path,
    method: _req.method
  });
  if (!res.headersSent) {
    res.status(status).json({ 
      message: "A server error has occurred",
      error: message,
      ...(typeof process !== "undefined" && process?.env?.NODE_ENV === 'development' && { stack: err.stack })
    });
  }
});

// Initialize app
let appInitialized = false;
let initializationPromise: Promise<void> | null = null;

async function initializeApp() {
  if (appInitialized) return;
  
  if (initializationPromise) {
    return initializationPromise;
  }

  initializationPromise = (async () => {
    try {
      await registerRoutes(app);
      
      // 404 handler - must be AFTER all routes are registered
      app.use((_req: Request, res: Response) => {
        if (!res.headersSent) {
          res.status(404).json({ error: "Not Found" });
        }
      });
      
      appInitialized = true;
      console.log("Application initialized for Vercel");
    } catch (error) {
      console.error(`FATAL ERROR during initialization: ${error}`);
      throw error;
    }
  })();

  return initializationPromise;
}

// Vercel serverless function handler
export default async function handler(req: any, res: any) {
  try {
    // Vercel rewrites /api/* to /api (this handler)
    // req.url contains the original path (e.g., /api/health, /api/courses)
    const originalUrl = req.url || req.originalUrl || req.path || '/';
    let apiPath = originalUrl;

    // Vercel may also provide the original path in headers
    const vercelRewrittenPath = req.headers['x-vercel-rewrite'] || req.headers['x-invoke-path'];
    if (vercelRewrittenPath && vercelRewrittenPath.startsWith('/api')) {
      apiPath = vercelRewrittenPath;
    }

    // CRITICAL: Only handle API paths - this prevents SSL errors
    // If it's not an API path, return immediately (Vercel will serve static files)
    if (!apiPath || (!apiPath.startsWith('/api') && apiPath !== '/api')) {
      // This should never happen due to vercel.json rewrites, but guard against it
      console.log(`[API] Non-API path reached handler: ${apiPath}`);
      if (!res.headersSent) {
        res.status(404).json({ error: "Not Found", path: apiPath });
      }
      return;
    }

    // Set headers for API responses
    if (!res.headersSent) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }

    // Initialize app (only once) - with timeout and error handling
    try {
      await Promise.race([
        initializeApp(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Initialization timeout')), 5000)
        )
      ]);
    } catch (initError: any) {
      console.error('[API] Initialization error:', initError);
      // Continue anyway - some routes might work without full initialization
      // Don't block the request completely
    }

    // Update request for Express
    req.url = apiPath;
    req.originalUrl = apiPath;
    req.path = apiPath.split('?')[0];

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
            console.error("Error sending timeout response:", e);
          }
          finish();
        }
      }, 25000); // 25 seconds (before Vercel's 30s limit)

      // Set a maximum processing time for the request
      const processingTimeout = setTimeout(() => {
        if (!res.headersSent && !finished) {
          console.error('[API] Request processing timeout');
          try {
            res.status(504).json({ error: "Gateway timeout" });
            finish();
          } catch (e) {
            console.error("Error sending timeout response:", e);
            finish();
          }
        }
      }, 20000); // 20 seconds

      app(req, res, (err: any) => {
        clearTimeout(timeout);
        clearTimeout(processingTimeout);
        
        if (err) {
          console.error("[API] Express error:", err);
          if (!res.headersSent && !finished) {
            try {
              res.status(500).json({ error: "Internal server error", message: err.message });
            } catch (e) {
              console.error("Error sending error response:", e);
            }
            finish();
          } else {
            finish();
          }
        } else if (!res.headersSent && !finished) {
          // If no response was sent, send 404
          try {
            res.status(404).json({ error: "Not Found", path: apiPath });
          } catch (e) {
            console.error("Error sending 404 response:", e);
          }
          finish();
        } else if (res.finished && !finished) {
          finish();
        } else {
          finish();
        }
      });
    });
  } catch (error: any) {
    console.error("Handler error:", error);
    if (!res.headersSent) {
      try {
        res.status(500).json({ error: "Internal server error" });
      } catch (e) {
        console.error("Error sending error response in catch:", e);
      }
    }
  }
}
