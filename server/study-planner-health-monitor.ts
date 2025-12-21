import { StudyPlannerControl } from "./study-planner-control.js";

export interface ModuleHealth {
  status: "healthy" | "degraded" | "failed";
  responseTime: number;
  lastCheck: number;
  error?: string;
}

export interface HealthMetrics {
  responseTime: { [key: string]: number[] };
  errorRates: { [key: string]: number };
  userEngagement: { [key: string]: number };
  systemLoad: number;
}

export interface HealthAlert {
  type: "warning" | "critical";
  module: string;
  message: string;
  timestamp: number;
}

export class HealthMonitor {
  private metrics: HealthMetrics = {
    responseTime: {},
    errorRates: {},
    userEngagement: {},
    systemLoad: 0,
  };
  private healthStatus: Map<string, ModuleHealth> = new Map();
  private alerts: HealthAlert[] = [];
  private monitorInterval: NodeJS.Timeout | null = null;
  private controlSystem: StudyPlannerControl;
  private operationCounts: { [key: string]: number } = {};
  private errorCounts: { [key: string]: number } = {};

  constructor(controlSystem: StudyPlannerControl) {
    this.controlSystem = controlSystem;
  }

  startMonitoring() {
    console.log("[HealthMonitor] Starting continuous health monitoring");

    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
    }

    // Initial health check
    this._checkModuleHealth();

    // Repeat every minute
    this.monitorInterval = setInterval(() => {
      this._checkModuleHealth();
      this._logPerformanceMetrics();
      this._alertOnAnomalies();
    }, 60000);
  }

  stopMonitoring() {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    console.log("[HealthMonitor] Health monitoring stopped");
  }

  recordOperation(moduleName: string, responseTime: number, success: boolean) {
    // Track response time
    if (!this.metrics.responseTime[moduleName]) {
      this.metrics.responseTime[moduleName] = [];
    }
    this.metrics.responseTime[moduleName].push(responseTime);

    // Keep only last 100 entries
    if (this.metrics.responseTime[moduleName].length > 100) {
      this.metrics.responseTime[moduleName].shift();
    }

    // Track operation count
    this.operationCounts[moduleName] = (this.operationCounts[moduleName] || 0) + 1;

    // Track errors
    if (!success) {
      this.errorCounts[moduleName] = (this.errorCounts[moduleName] || 0) + 1;
      this.metrics.errorRates[moduleName] =
        (this.errorCounts[moduleName] / this.operationCounts[moduleName]) * 100;
    }
  }

  recordEngagement(moduleName: string, engagementScore: number) {
    this.metrics.userEngagement[moduleName] = engagementScore;
  }

  private _checkModuleHealth() {
    const modules = (this.controlSystem as any).modules || {};

    for (const [moduleName, module] of Object.entries(modules)) {
      const startTime = Date.now();

      try {
        // Get average response time
        const responseTimesForModule =
          this.metrics.responseTime[moduleName as string] || [];
        const avgResponseTime =
          responseTimesForModule.length > 0
            ? responseTimesForModule.reduce((a: number, b: number) => a + b, 0) /
              responseTimesForModule.length
            : 0;

        // Determine health status
        let status: "healthy" | "degraded" | "failed" = "healthy";

        if (this.metrics.errorRates[moduleName as string] > 10) {
          status = "degraded";
        }

        if (avgResponseTime > 5000) {
          status = "degraded";
        }

        if (this.metrics.errorRates[moduleName as string] > 50) {
          status = "failed";
        }

        const responseTime = Date.now() - startTime;

        this.healthStatus.set(moduleName as string, {
          status,
          responseTime,
          lastCheck: Date.now(),
        });
      } catch (error) {
        this.healthStatus.set(moduleName as string, {
          status: "failed",
          responseTime: Date.now() - startTime,
          lastCheck: Date.now(),
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  private _logPerformanceMetrics() {
    console.log("\n[HealthMonitor] Performance Metrics:");
    console.log("=====================================");

    for (const [moduleName, responseTimes] of Object.entries(
      this.metrics.responseTime
    )) {
      if (responseTimes.length === 0) continue;

      const avgTime =
        responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxTime = Math.max(...responseTimes);
      const minTime = Math.min(...responseTimes);
      const errorRate = this.metrics.errorRates[moduleName] || 0;

      console.log(`\n${moduleName}:`);
      console.log(`  Avg Response Time: ${avgTime.toFixed(2)}ms`);
      console.log(`  Min/Max: ${minTime.toFixed(2)}ms / ${maxTime.toFixed(2)}ms`);
      console.log(`  Error Rate: ${errorRate.toFixed(2)}%`);
      console.log(
        `  Operations: ${this.operationCounts[moduleName] || 0}`
      );
    }

    // Calculate system load
    const totalOperations = Object.values(this.operationCounts).reduce(
      (a, b) => a + b,
      0
    );
    const avgErrorRate =
      Object.values(this.metrics.errorRates).reduce((a, b) => a + b, 0) /
      (Object.keys(this.metrics.errorRates).length || 1);

    this.metrics.systemLoad = Math.min(100, (totalOperations / 100) * (1 + avgErrorRate / 100));

    console.log(`\nSystem Load: ${this.metrics.systemLoad.toFixed(2)}%`);
    console.log("=====================================\n");
  }

  private _alertOnAnomalies() {
    const newAlerts: HealthAlert[] = [];

    for (const [moduleName, health] of this.healthStatus) {
      // Alert on failed modules
      if (health.status === "failed") {
        newAlerts.push({
          type: "critical",
          module: moduleName,
          message: `Module ${moduleName} is in failed state: ${health.error || "Unknown error"}`,
          timestamp: Date.now(),
        });
      }

      // Alert on degraded modules
      if (health.status === "degraded") {
        const avgResponseTime =
          this.metrics.responseTime[moduleName]?.reduce((a, b) => a + b, 0) /
            (this.metrics.responseTime[moduleName]?.length || 1) || 0;

        if (avgResponseTime > 5000) {
          newAlerts.push({
            type: "warning",
            module: moduleName,
            message: `Module ${moduleName} response time is high: ${avgResponseTime.toFixed(2)}ms`,
            timestamp: Date.now(),
          });
        }

        if ((this.metrics.errorRates[moduleName] || 0) > 10) {
          newAlerts.push({
            type: "warning",
            module: moduleName,
            message: `Module ${moduleName} error rate is elevated: ${(this.metrics.errorRates[moduleName] || 0).toFixed(2)}%`,
            timestamp: Date.now(),
          });
        }
      }
    }

    // Only log new alerts
    for (const alert of newAlerts) {
      const isDuplicate = this.alerts.some(
        (a) =>
          a.module === alert.module &&
          a.type === alert.type &&
          Date.now() - a.timestamp < 300000 // 5 minutes
      );

      if (!isDuplicate) {
        this.alerts.push(alert);
        console.log(
          `[${alert.type.toUpperCase()}] ${alert.module}: ${alert.message}`
        );
      }
    }

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  getHealthStatus() {
    const status: { [key: string]: ModuleHealth | undefined } = {};

    for (const [moduleName, health] of this.healthStatus) {
      status[moduleName] = health;
    }

    return {
      status,
      metrics: this.metrics,
      systemLoad: this.metrics.systemLoad,
      timestamp: Date.now(),
    };
  }

  getAlerts(type?: "warning" | "critical") {
    return type
      ? this.alerts.filter((a) => a.type === type)
      : this.alerts;
  }

  clearAlerts() {
    this.alerts = [];
  }

  getMetrics() {
    return {
      responseTime: this.metrics.responseTime,
      errorRates: this.metrics.errorRates,
      userEngagement: this.metrics.userEngagement,
      systemLoad: this.metrics.systemLoad,
      operationCounts: this.operationCounts,
      errorCounts: this.errorCounts,
      timestamp: Date.now(),
    };
  }
}
