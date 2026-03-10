import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { createServer } from "http";
import { registerRoutes } from "./routes.js";
import { setupVite, serveStatic, log } from "./vite.js";
import sitemapRoutes from "./routes-sitemap.js";
import { setupLiveStatsWebsocket } from "./live-stats-ws.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// SEO routes (sitemap, robots.txt)
app.use(sitemapRoutes);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Error handler middleware - register early but don't throw after sending response
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  console.error("[ERROR]", err);
  if (!res.headersSent) {
    res.status(status).json({ message, error: process.env.NODE_ENV === 'development' ? err.stack : undefined });
  }
  // Don't throw after sending response - it causes issues
});

// Create server and open port IMMEDIATELY for deployment health checks
const port = 5000;
const server = createServer(app);
server.listen(port, "0.0.0.0", () => {
  log(`serving on port ${port}`);
});

// Register routes and setup asynchronously AFTER port is open
// This prevents blocking the port opening for Replit's autoscale health checks
(async () => {
  try {
    // Register all routes
    await registerRoutes(app);

    setupLiveStatsWebsocket(server, app);

    // Setup Vite or static file serving
    if (app.get("env") === "development") {
      log("Setting up Vite...");
      await setupVite(app, server);
      log("Vite setup complete");
    } else {
      serveStatic(app);
    }

    log("Application fully initialized");
  } catch (error) {
    log(`FATAL ERROR during initialization: ${error}`);
    process.exit(1);
  }
})();
