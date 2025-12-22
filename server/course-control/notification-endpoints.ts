import { Express } from "express";
import { courseAlertNotificationSystem } from "./alert-notification-system.js";
import { interactionTracker } from "./interaction-tracker.js";
import { integrationManager } from "./integration-manager.js";

export function registerNotificationEndpoints(app: Express) {
  // Check metrics and generate alerts
  app.post("/api/notifications/check-metrics", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const metrics = req.body.metrics || {};
      const alerts = courseAlertNotificationSystem.checkMetricsAndAlert(metrics);

      const notifications = [];
      for (const alert of alerts) {
        const notifs = courseAlertNotificationSystem.createNotifications(alert, ["dashboard", "email"]);
        notifications.push(...notifs);
      }

      res.json({
        status: "success",
        newAlerts: alerts.length,
        notifications,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to check metrics" });
    }
  });

  // Get active alerts
  app.get("/api/alerts/active", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const alerts = courseAlertNotificationSystem.getActiveAlerts();
      res.json({
        status: "success",
        data: alerts,
        count: alerts.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get active alerts" });
    }
  });

  // Get alert history
  app.get("/api/alerts/history", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const limit = parseInt((req.query.limit as string) || "50");
      const history = courseAlertNotificationSystem.getAlertHistory(limit);

      res.json({
        status: "success",
        data: history,
        count: history.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get alert history" });
    }
  });

  // Get notifications
  app.get("/api/notifications", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const unreadOnly = req.query.unread === "true";
      const limit = parseInt((req.query.limit as string) || "100");
      const notifications = courseAlertNotificationSystem.getNotifications(unreadOnly, limit);

      res.json({
        status: "success",
        data: notifications,
        count: notifications.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications" });
    }
  });

  // Mark notification as read
  app.post("/api/notifications/:notificationId/read", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const success = courseAlertNotificationSystem.markNotificationRead(req.params.notificationId);
      res.json({
        status: success ? "success" : "failed",
        marked: success,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notification" });
    }
  });

  // Mark all notifications as read
  app.post("/api/notifications/mark-all-read", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const notifications = courseAlertNotificationSystem.getNotifications(true);
      notifications.forEach((n) => courseAlertNotificationSystem.markNotificationRead(n.id));

      res.json({
        status: "success",
        marked: notifications.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark notifications" });
    }
  });

  // Dismiss alert
  app.post("/api/alerts/:alertId/dismiss", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const success = courseAlertNotificationSystem.dismissAlert(req.params.alertId);
      res.json({
        status: success ? "success" : "not_found",
        dismissed: success,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to dismiss alert" });
    }
  });

  // Get alert statistics
  app.get("/api/alerts/stats", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const stats = courseAlertNotificationSystem.getAlertStats();
      res.json({
        status: "success",
        data: stats,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get alert stats" });
    }
  });

  // Get alerts by today
  app.get("/api/alerts/today", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const todayAlerts = courseAlertNotificationSystem.getAlertsByToday();
      res.json({
        status: "success",
        data: todayAlerts,
        count: todayAlerts.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get today's alerts" });
    }
  });

  // Get notifications by channel
  app.get("/api/notifications/channel/:channel", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const channel = req.params.channel;
      const notifications = courseAlertNotificationSystem.getNotificationsByType(channel);

      res.json({
        status: "success",
        data: notifications,
        count: notifications.length,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get notifications by channel" });
    }
  });

  // Get severity distribution
  app.get("/api/alerts/severity-distribution", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const distribution = courseAlertNotificationSystem.getSeverityDistribution();
      res.json({
        status: "success",
        data: distribution,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get severity distribution" });
    }
  });

  // Comprehensive alert and notification report
  app.get("/api/alerts-notifications/report", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const activeAlerts = courseAlertNotificationSystem.getActiveAlerts();
      const stats = courseAlertNotificationSystem.getAlertStats();
      const distribution = courseAlertNotificationSystem.getSeverityDistribution();
      const recentNotifications = courseAlertNotificationSystem.getNotifications(false, 20);

      res.json({
        status: "success",
        data: {
          activeAlerts,
          stats,
          distribution,
          recentNotifications,
          generatedAt: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate report" });
    }
  });

  console.log("[Notifications] Endpoints registered successfully");
}
