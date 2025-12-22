import { studyPlannerControl } from "./study-planner-control.js";
import { moduleControllers } from "./module-controllers.js";

export interface AlertRule {
  name: string;
  condition: (metrics: any) => boolean;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  action: string;
  resolveCondition?: (metrics: any) => boolean;
}

export interface Alert {
  id: string;
  rule: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  metrics: any;
  actionTaken?: string;
}

export class AlertSystem {
  private alertRules: Map<string, AlertRule> = new Map();
  private activeAlerts: Map<string, Alert> = new Map();
  private alertHistory: Alert[] = [];
  private maxHistorySize: number = 500;

  constructor() {
    this.loadAlertRules();
    console.log("[AlertSystem] Initialized with", this.alertRules.size, "rules");
  }

  private loadAlertRules(): void {
    const rules: AlertRule[] = [
      // Error Rate Alerts
      {
        name: "high_error_rate",
        condition: (m: any) => (m.systemHealth?.errorRate || 0) > 5,
        message: "⚠️ High error rate detected - System errors exceeding 5%",
        severity: "high",
        action: "restart_affected_module",
        resolveCondition: (m: any) => (m.systemHealth?.errorRate || 0) <= 2,
      },
      {
        name: "critical_error_spike",
        condition: (m: any) => (m.systemHealth?.errorRate || 0) > 10,
        message: "🚨 Critical error spike - System requires immediate attention",
        severity: "critical",
        action: "emergency_restart",
        resolveCondition: (m: any) => (m.systemHealth?.errorRate || 0) <= 5,
      },

      // Performance Alerts
      {
        name: "slow_response_time",
        condition: (m: any) => (m.planGeneration?.avgTime || 0) > 2000,
        message: "⏱️ Slow response time - Plan generation taking >2000ms",
        severity: "medium",
        action: "optimize_queries",
        resolveCondition: (m: any) => (m.planGeneration?.avgTime || 0) <= 1500,
      },
      {
        name: "schedule_optimization_low",
        condition: (m: any) => (m.scheduleManagement?.optimizationScore || 0) < 50,
        message: "📅 Schedule optimization score low - Consider reoptimizing schedules",
        severity: "medium",
        action: "optimize_schedules",
        resolveCondition: (m: any) => (m.scheduleManagement?.optimizationScore || 0) >= 70,
      },

      // Resource Alerts
      {
        name: "high_cpu_load",
        condition: (m: any) => (m.systemHealth?.cpuLoad || 0) > 80,
        message: "💻 High CPU load detected - System CPU above 80%",
        severity: "high",
        action: "optimize_cpu_usage",
        resolveCondition: (m: any) => (m.systemHealth?.cpuLoad || 0) <= 60,
      },
      {
        name: "high_memory_usage",
        condition: (m: any) => (m.systemHealth?.memoryUsage || 0) > 85,
        message: "🧠 High memory usage - System memory above 85%",
        severity: "high",
        action: "clear_cache",
        resolveCondition: (m: any) => (m.systemHealth?.memoryUsage || 0) <= 70,
      },

      // Engagement Alerts
      {
        name: "low_user_engagement",
        condition: (m: any) => (m.userEngagement?.completionRate || 0) < 30,
        message: "👥 Low user engagement - Completion rate below 30%",
        severity: "low",
        action: "send_motivation",
        resolveCondition: (m: any) => (m.userEngagement?.completionRate || 0) >= 50,
      },
      {
        name: "low_active_users",
        condition: (m: any) => (m.userEngagement?.activeUsers || 0) < 10,
        message: "👤 Low active users - Only a few users currently active",
        severity: "low",
        action: "send_motivation",
        resolveCondition: (m: any) => (m.userEngagement?.activeUsers || 0) >= 20,
      },

      // Schedule Conflicts
      {
        name: "schedule_conflicts_high",
        condition: (m: any) => (m.scheduleManagement?.conflicts || 0) > 5,
        message: "⚡ High schedule conflicts - Multiple scheduling conflicts detected",
        severity: "medium",
        action: "resolve_conflicts",
        resolveCondition: (m: any) => (m.scheduleManagement?.conflicts || 0) <= 2,
      },

      // Plan Generation Issues
      {
        name: "low_plan_success_rate",
        condition: (m: any) => (m.planGeneration?.successRate || 0) < 80,
        message: "📋 Low plan generation success rate - Below 80%",
        severity: "medium",
        action: "troubleshoot_plan_generation",
        resolveCondition: (m: any) => (m.planGeneration?.successRate || 0) >= 95,
      },
    ];

    rules.forEach((rule) => {
      this.alertRules.set(rule.name, rule);
    });
  }

  checkMetrics(metrics: any): Alert[] {
    const newAlerts: Alert[] = [];
    const now = new Date().toISOString();

    // Check all rules
    this.alertRules.forEach((rule, ruleName) => {
      const shouldAlert = rule.condition(metrics);
      const alertKey = ruleName;
      const existingAlert = this.activeAlerts.get(alertKey);

      if (shouldAlert) {
        if (!existingAlert) {
          // New alert
          const alert: Alert = {
            id: `${ruleName}_${Date.now()}`,
            rule: ruleName,
            message: rule.message,
            severity: rule.severity,
            timestamp: now,
            resolved: false,
            metrics,
          };

          this.activeAlerts.set(alertKey, alert);
          this.triggerAlertAction(rule.action, alert);
          newAlerts.push(alert);

          console.log(`[AlertSystem] NEW ALERT: ${rule.message}`);
        }
      } else if (existingAlert && rule.resolveCondition && rule.resolveCondition(metrics)) {
        // Resolve alert
        existingAlert.resolved = true;
        existingAlert.resolvedAt = now;
        this.activeAlerts.delete(alertKey);
        this.alertHistory.push(existingAlert);

        console.log(`[AlertSystem] RESOLVED: ${rule.message}`);
      }
    });

    // Maintain history size
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory = this.alertHistory.slice(-this.maxHistorySize);
    }

    return newAlerts;
  }

  private async triggerAlertAction(action: string, alert: Alert): Promise<void> {
    try {
      console.log(`[AlertSystem] Triggering action: ${action}`);

      switch (action) {
        case "restart_affected_module":
          // Log but don't auto-execute in production
          console.log("[AlertSystem] Would restart affected module");
          alert.actionTaken = "logged_for_manual_review";
          break;

        case "emergency_restart":
          console.log("[AlertSystem] Emergency restart triggered");
          alert.actionTaken = "emergency_restart_logged";
          break;

        case "optimize_queries":
          console.log("[AlertSystem] Optimization recommended");
          alert.actionTaken = "optimization_queued";
          break;

        case "optimize_schedules":
          console.log("[AlertSystem] Schedule optimization triggered");
          alert.actionTaken = "optimization_queued";
          break;

        case "clear_cache":
          console.log("[AlertSystem] Cache clear recommended");
          alert.actionTaken = "cache_clear_queued";
          break;

        case "optimize_cpu_usage":
          console.log("[AlertSystem] CPU optimization recommended");
          alert.actionTaken = "optimization_queued";
          break;

        case "send_motivation":
          console.log("[AlertSystem] Motivational message queued");
          alert.actionTaken = "motivation_queued";
          break;

        case "resolve_conflicts":
          console.log("[AlertSystem] Conflict resolution initiated");
          alert.actionTaken = "conflict_resolution_queued";
          break;

        case "troubleshoot_plan_generation":
          console.log("[AlertSystem] Plan generation troubleshooting initiated");
          alert.actionTaken = "troubleshooting_queued";
          break;

        default:
          console.log("[AlertSystem] Unknown action:", action);
          alert.actionTaken = "unknown_action";
      }
    } catch (error) {
      console.error("[AlertSystem] Error triggering action:", error);
      alert.actionTaken = "action_failed";
    }
  }

  getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values());
  }

  getAlertsByModule(module: string): Alert[] {
    return Array.from(this.activeAlerts.values()).filter(
      (alert) => alert.message.includes(module)
    );
  }

  getAlertHistory(): Alert[] {
    return this.alertHistory;
  }

  getAlertsByToday(): Alert[] {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return [
      ...Array.from(this.activeAlerts.values()),
      ...this.alertHistory,
    ].filter((alert) => {
      const alertDate = new Date(alert.timestamp);
      return alertDate >= today;
    });
  }

  dismissAlert(alertId: string): boolean {
    for (const [key, alert] of this.activeAlerts.entries()) {
      if (alert.id === alertId) {
        alert.resolved = true;
        alert.resolvedAt = new Date().toISOString();
        this.activeAlerts.delete(key);
        this.alertHistory.push(alert);
        return true;
      }
    }
    return false;
  }

  clearAllAlerts(): number {
    const count = this.activeAlerts.size;
    for (const alert of this.activeAlerts.values()) {
      alert.resolved = true;
      alert.resolvedAt = new Date().toISOString();
      this.alertHistory.push(alert);
    }
    this.activeAlerts.clear();
    return count;
  }

  getAlertStats(): {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    unresolved: number;
  } {
    const alerts = this.getActiveAlerts();
    return {
      total: alerts.length,
      critical: alerts.filter((a) => a.severity === "critical").length,
      high: alerts.filter((a) => a.severity === "high").length,
      medium: alerts.filter((a) => a.severity === "medium").length,
      low: alerts.filter((a) => a.severity === "low").length,
      unresolved: alerts.filter((a) => !a.resolved).length,
    };
  }
}

// Export singleton instance
export const alertSystem = new AlertSystem();
