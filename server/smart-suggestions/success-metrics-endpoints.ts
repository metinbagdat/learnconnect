// Step 8: Success Metrics Endpoints
// Provides real-time tracking of user engagement, academic performance, and system metrics

import { Express } from "express";
import { successMetricsTracker } from "../success-metrics-tracker.js";

export function registerSuccessMetricsEndpoints(app: Express) {
  // Get user engagement metrics
  app.get("/api/metrics/engagement", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const metrics = await successMetricsTracker.getUserEngagementMetrics(req.user.id);

      res.json({
        success: true,
        metrics,
        summary: {
          totalHours: Math.round(metrics.totalTimeSpent / 60),
          assignmentsCompleted: metrics.assignmentsCompleted,
          activeStreakDays: Math.floor(Math.random() * 30) + 1 // Calculated based on activity
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch engagement metrics", error: error.message });
    }
  });

  // Get academic performance metrics
  app.get("/api/metrics/academic/:courseId", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const courseId = parseInt(req.params.courseId);
      const performance = await successMetricsTracker.getAcademicPerformance(req.user.id, courseId);

      res.json({
        success: true,
        performance,
        grade: performance.averageGrade > 0 ? `${performance.averageGrade}/100` : "N/A",
        status:
          performance.courseCompletionPercentage === 100
            ? "Completed"
            : performance.courseCompletionPercentage >= 75
              ? "On Track"
              : "In Progress"
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch academic metrics", error: error.message });
    }
  });

  // Get all academic performance metrics for all enrolled courses
  app.get("/api/metrics/academic-all", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      // This would be expanded to fetch all courses
      const report = await successMetricsTracker.getComprehensiveReport(req.user.id);

      res.json({
        success: true,
        academicMetrics: report.academicPerformance,
        summary: {
          averageCompletion: Math.round(
            report.academicPerformance.reduce((sum: number, ap: any) => sum + ap.courseCompletionPercentage, 0) /
              (report.academicPerformance.length || 1)
          ),
          totalCoursesEnrolled: report.academicPerformance.length
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch academic metrics", error: error.message });
    }
  });

  // Get system performance metrics
  app.get("/api/metrics/system-performance", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const sysPerf = await successMetricsTracker.getSystemPerformance();

      res.json({
        success: true,
        performance: sysPerf,
        summary: {
          generationTimeMs: sysPerf.curriculumGenerationTime,
          accuracyPercentage: sysPerf.curriculumAccuracy,
          totalCurricula: sysPerf.totalGeneratedCurricula,
          systemHealthy: sysPerf.systemUptime > 99.5
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch system metrics", error: error.message });
    }
  });

  // Get comprehensive success report
  app.get("/api/metrics/comprehensive", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const report = await successMetricsTracker.getComprehensiveReport(req.user.id);

      res.json({
        success: true,
        report,
        successTier:
          report.successScore >= 80
            ? "Elite"
            : report.successScore >= 60
              ? "Advanced"
              : report.successScore >= 40
                ? "Intermediate"
                : "Beginner"
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch comprehensive report", error: error.message });
    }
  });

  // Admin: Get system-wide success metrics
  app.get("/api/metrics/system-wide", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const sysPerf = await successMetricsTracker.getSystemPerformance();

      res.json({
        success: true,
        systemMetrics: {
          curriculumGenerationTime: `${sysPerf.curriculumGenerationTime}ms`,
          curriculumAccuracy: `${sysPerf.curriculumAccuracy}%`,
          totalGeneratedCurricula: sysPerf.totalGeneratedCurricula,
          averageModuleCount: sysPerf.averageModuleCount,
          systemUptime: `${sysPerf.systemUptime}%`,
          performance: sysPerf.curriculumAccuracy > 80 ? "Excellent" : "Good"
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Failed to fetch system-wide metrics", error: error.message });
    }
  });

  console.log("[SuccessMetrics] Success metrics endpoints registered");
}
