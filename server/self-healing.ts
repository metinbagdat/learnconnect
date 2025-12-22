import { alertSystem } from "./alert-system.js";
import { controlHandlers } from "./study-planner-control-handlers.js";
import { predictiveMaintenanceEngine } from "./predictive-maintenance.js";

export class SelfHealingEngine {
  private healingInProgress: boolean = false;
  private lastHealingTime: number = 0;
  private healingCooldown: number = 60000; // 1 minute

  async checkAndHeal(): Promise<{ healed: boolean; actions: string[] }> {
    if (this.healingInProgress) {
      return { healed: false, actions: [] };
    }

    const timeSinceLastHealing = Date.now() - this.lastHealingTime;
    if (timeSinceLastHealing < this.healingCooldown) {
      return { healed: false, actions: [] };
    }

    this.healingInProgress = true;
    const actions: string[] = [];

    try {
      const alerts = alertSystem.getActiveAlerts();
      const criticalAlerts = alerts.filter((a) => a.severity === "critical");

      // Auto-heal critical errors
      if (criticalAlerts.length > 0) {
        console.log("[SelfHealing] Detected critical alerts, initiating healing...");

        for (const alert of criticalAlerts) {
          if (alert.rule.includes("error_rate") || alert.rule.includes("cpu")) {
            try {
              await controlHandlers.handleClearAllCache();
              actions.push("Cleared system cache");
            } catch (error) {
              console.error("[SelfHealing] Cache clear failed:", error);
            }
          }

          if (alert.rule.includes("memory")) {
            try {
              await controlHandlers.handleClearAllCache();
              actions.push("Optimized memory usage");
            } catch (error) {
              console.error("[SelfHealing] Memory optimization failed:", error);
            }
          }
        }
      }

      // Predictive maintenance
      const predictedIssues = predictiveMaintenanceEngine.predict();
      for (const issue of predictedIssues) {
        if (issue.confidence > 0.85 && issue.estimatedTimeToFailure && issue.estimatedTimeToFailure < 15) {
          console.log(`[SelfHealing] Predicted issue: ${issue.prediction}`);
          actions.push(issue.recommendedAction);
        }
      }

      this.lastHealingTime = Date.now();
      return { healed: true, actions };
    } catch (error) {
      console.error("[SelfHealing] Healing process error:", error);
      return { healed: false, actions };
    } finally {
      this.healingInProgress = false;
    }
  }

  getHealingStatus(): {
    isActive: boolean;
    lastHealing: string;
    cooldownRemaining: number;
  } {
    const cooldownRemaining = Math.max(
      0,
      this.healingCooldown - (Date.now() - this.lastHealingTime)
    );

    return {
      isActive: this.healingInProgress,
      lastHealing: new Date(this.lastHealingTime).toISOString(),
      cooldownRemaining: Math.round(cooldownRemaining / 1000),
    };
  }
}

export const selfHealingEngine = new SelfHealingEngine();
