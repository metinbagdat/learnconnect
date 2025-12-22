import { Express } from "express";
import { permissionController, UserRole, CourseAction } from "./permission-controller.js";

export function registerPermissionEndpoints(app: Express) {
  // Check if user can perform action
  app.post("/api/permissions/check-action", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { module, action } = req.body;
      const canPerform = permissionController.canPerformAction(req.user.id, module, action);

      res.json({
        status: "success",
        canPerform,
        userId: req.user.id,
        role: permissionController.getUserRole(req.user.id),
        module,
        action,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check permission" });
    }
  });

  // Check if user can access data
  app.post("/api/permissions/check-data-access", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { resourceType, resourceOwnerId } = req.body;
      const canAccess = permissionController.canAccessData(req.user.id, resourceType, resourceOwnerId);

      res.json({
        status: "success",
        canAccess,
        userId: req.user.id,
        resourceType,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check data access" });
    }
  });

  // Get user role
  app.get("/api/permissions/user-role", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const role = permissionController.getUserRole(req.user.id);
      const permissions = permissionController.getRolePermissions(role as UserRole);

      res.json({
        status: "success",
        userId: req.user.id,
        role,
        permissions,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get user role" });
    }
  });

  // Set user role (admin only)
  app.post("/api/permissions/set-user-role", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      // Check if user is admin
      const userRole = permissionController.getUserRole(req.user.id);
      if (userRole !== "admin") {
        return res.status(403).json({ message: "Only admins can assign roles" });
      }

      const { targetUserId, role } = req.body;
      const success = permissionController.setUserRole(targetUserId, role as UserRole);

      res.json({
        status: success ? "success" : "failed",
        targetUserId,
        role,
        set: success,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to set user role" });
    }
  });

  // Get all roles and permissions
  app.get("/api/permissions/roles", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const allRoles = permissionController.getAllRoles();

      res.json({
        status: "success",
        roles: allRoles,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get roles" });
    }
  });

  // Get audit log
  app.get("/api/permissions/audit-log", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      // Only admin or the user themselves can see audit log
      const userRole = permissionController.getUserRole(req.user.id);
      const targetUserId = req.query.userId ? parseInt(req.query.userId as string) : req.user.id;

      if (userRole !== "admin" && req.user.id !== targetUserId) {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const limit = parseInt((req.query.limit as string) || "100");
      const auditLog = permissionController.getAuditLog(targetUserId, limit);

      res.json({
        status: "success",
        data: auditLog,
        count: auditLog.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get audit log" });
    }
  });

  // Get denied access log
  app.get("/api/permissions/denied-access-log", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      // Only admin can see denied access log
      const userRole = permissionController.getUserRole(req.user.id);
      if (userRole !== "admin") {
        return res.status(403).json({ message: "Only admins can view denied access logs" });
      }

      const limit = parseInt((req.query.limit as string) || "50");
      const deniedLog = permissionController.getDeniedAccessLog(limit);

      res.json({
        status: "success",
        data: deniedLog,
        count: deniedLog.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get denied access log" });
    }
  });

  // Get permission statistics
  app.get("/api/permissions/stats", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      // Only admin can see stats
      const userRole = permissionController.getUserRole(req.user.id);
      if (userRole !== "admin") {
        return res.status(403).json({ message: "Only admins can view permission stats" });
      }

      const stats = permissionController.getPermissionStats();

      res.json({
        status: "success",
        data: stats,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get permission stats" });
    }
  });

  // Export audit log (admin only)
  app.post("/api/permissions/export-audit-log", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const userRole = permissionController.getUserRole(req.user.id);
      if (userRole !== "admin") {
        return res.status(403).json({ message: "Only admins can export audit logs" });
      }

      const exportData = permissionController.exportAuditLog();

      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="audit-log-${Date.now()}.json"`);
      res.json(exportData);
    } catch (error) {
      res.status(500).json({ message: "Failed to export audit log" });
    }
  });

  // Comprehensive permission report
  app.get("/api/permissions/report", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const userRole = permissionController.getUserRole(req.user.id);
      if (userRole !== "admin") {
        return res.status(403).json({ message: "Only admins can view permission reports" });
      }

      const allRoles = permissionController.getAllRoles();
      const stats = permissionController.getPermissionStats();
      const recentDenials = permissionController.getDeniedAccessLog(20);

      res.json({
        status: "success",
        data: {
          roles: allRoles,
          stats,
          recentDenials,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate permission report" });
    }
  });

  console.log("[Permissions] Endpoints registered successfully");
}
