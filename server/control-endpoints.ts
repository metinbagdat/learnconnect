import { Express } from "express";
import { studyPlannerControl } from "./study-planner-control.js";
import { controlHandlers } from "./study-planner-control-handlers.js";
import { permissions } from "./permissions.js";

const logger = {
  info: (msg: string) => console.log(`[INFO] ${new Date().toISOString()} ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${new Date().toISOString()} ${msg}`),
  warn: (msg: string) => console.warn(`[WARN] ${new Date().toISOString()} ${msg}`),
};

interface ControlRequest {
  user: { id: number; role: string; isPremium?: boolean; isAdmin?: boolean };
  module: string;
  action: string;
  data?: any;
}

export function registerControlEndpoints(app: Express) {
  // ==========================================
  // Module Control Endpoints
  // ==========================================

  /**
   * Execute a control action on a module
   * POST /api/study-planner/control/:module/:action
   */
  app.post(
    "/api/study-planner/control/:module/:action",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const { module, action } = req.params;
        const userId = req.user.id;

        // Permission check using unified permissions system
        if (!permissions.hasPermission(req.user, module, action)) {
          const userRole = permissions.getUserRole(req.user);
          logger.warn(
            `Permission denied for user ${userId} (${userRole}): ${action} on ${module}`
          );
          return res.status(403).json({
            status: "error",
            message: "Permission denied",
            details: `Your role does not have permission to perform '${action}' on '${module}' module`,
            userRole,
          });
        }

        // Log the action attempt
        const userRole = permissions.getUserRole(req.user);
        logger.info(
          `User ${userId} (${userRole}) executing ${action} on ${module}`
        );

        // Execute the action
        const result = await controlHandlers.handleModuleAction(
          module,
          action,
          userId
        );

        // Log success
        logger.info(
          `Action completed: ${action} on ${module} for user ${userId}`
        );

        return res.json({
          status: "success",
          action,
          module,
          result,
          timestamp: new Date().toISOString(),
          userId,
        });
      } catch (error) {
        logger.error(`Control action failed: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
          timestamp: new Date().toISOString(),
        });
      }
    }
  );

  /**
   * Get status of a specific module or all modules
   * GET /api/study-planner/status/:module?
   */
  app.get(
    "/api/study-planner/status/:module?",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const { module } = req.params;

        if (module) {
          // Get specific module status
          const health = studyPlannerControl.getHealthMonitorStatus();
          const moduleStatus = (health as any).status[module];

          if (!moduleStatus) {
            return res.status(404).json({
              status: "error",
              message: `Module ${module} not found`,
            });
          }

          return res.json({
            status: "success",
            module,
            data: moduleStatus,
            timestamp: new Date().toISOString(),
          });
        } else {
          // Get all modules status
          const health = studyPlannerControl.getHealthMonitorStatus();
          logger.info(`Status check for all modules by user ${req.user.id}`);

          return res.json({
            status: "success",
            data: health,
            timestamp: new Date().toISOString(),
          });
        }
      } catch (error) {
        logger.error(`Failed to fetch status: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  /**
   * Get detailed module metrics
   * GET /api/study-planner/metrics
   */
  app.get(
    "/api/study-planner/metrics",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const metrics = studyPlannerControl.getHealthMonitorMetrics();
        logger.info(`Metrics retrieved for user ${req.user.id}`);

        return res.json({
          status: "success",
          data: metrics,
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error(`Failed to fetch metrics: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  /**
   * Get system alerts
   * GET /api/study-planner/alerts?type=warning|critical
   */
  app.get(
    "/api/study-planner/alerts",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const type = req.query.type as "warning" | "critical" | undefined;
        const alerts = studyPlannerControl.getHealthMonitorAlerts(type);

        return res.json({
          status: "success",
          alerts,
          count: alerts.length,
          filtered: type ? true : false,
          filter: type || "all",
          timestamp: new Date().toISOString(),
        });
      } catch (error) {
        logger.error(`Failed to fetch alerts: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  /**
   * System-level control actions
   * POST /api/study-planner/system/:action
   */
  app.post(
    "/api/study-planner/system/:action",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        const { action } = req.params;
        const userId = req.user.id;

        // Permission check - only admins and support staff can perform system actions
        if (!permissions.canAccessSystemControls(req.user)) {
          const userRole = permissions.getUserRole(req.user);
          logger.warn(
            `Unauthorized system action attempt by user ${userId} (${userRole}): ${action}`
          );
          return res.status(403).json({
            status: "error",
            message: "Permission denied - only administrators and support staff can perform system actions",
            userRole,
          });
        }

        const userRole = permissions.getUserRole(req.user);
        logger.info(`User ${userId} (${userRole}) executing system action: ${action}`);

        let result;
        switch (action) {
          case "Restart":
            result = await controlHandlers.handleRestartPlanner();
            break;
          case "ClearCache":
            result = await controlHandlers.handleClearAllCache();
            break;
          case "ExportLogs":
            result = await controlHandlers.handleExportLogs();
            break;
          case "EmergencyReset":
            result = await controlHandlers.handleSystemReset();
            break;
          default:
            return res.status(400).json({
              status: "error",
              message: `Unknown system action: ${action}`,
            });
        }

        logger.info(`System action completed: ${action} by user ${userId}`);

        return res.json({
          status: "success",
          action,
          result,
          timestamp: new Date().toISOString(),
          executedBy: userId,
        });
      } catch (error) {
        logger.error(`System action failed: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  /**
   * Get audit log of recent control actions
   * GET /api/study-planner/audit-log?limit=50
   */
  app.get(
    "/api/study-planner/audit-log",
    (app as any).ensureAuthenticated,
    async (req, res) => {
      try {
        if (!req.user) return res.status(401).json({ message: "Unauthorized" });

        // Only admins can view audit logs
        if (!permissions.canManageSystem(req.user)) {
          const userRole = permissions.getUserRole(req.user);
          logger.warn(`Unauthorized audit log access by user ${req.user.id} (${userRole})`);
          return res.status(403).json({
            status: "error",
            message: "Permission denied - only administrators can access audit logs",
            userRole,
          });
        }

        const limit = Math.min(parseInt(req.query.limit as string) || 50, 1000);

        // This would typically fetch from a database
        // For now, return a placeholder structure
        const auditLog = {
          entries: [],
          total: 0,
          limit,
          timestamp: new Date().toISOString(),
        };

        return res.json({
          status: "success",
          data: auditLog,
        });
      } catch (error) {
        logger.error(`Failed to fetch audit log: ${error instanceof Error ? error.message : String(error)}`);
        return res.status(500).json({
          status: "error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  );

  logger.info("Control endpoints registered successfully");
}
