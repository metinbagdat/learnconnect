import { realTimeMonitor } from "./real-time-monitor.js";
import { alertSystem } from "./alert-system.js";

interface PredictiveMetric {
  timestamp: string;
  prediction: string;
  confidence: number;
  recommendedAction: string;
  estimatedTimeToFailure?: number;
}

export class PredictiveMaintenanceEngine {
  private metricsBuffer: any[] = [];
  private maxBufferSize: number = 50;

  predict(): PredictiveMetric[] {
    const predictions: PredictiveMetric[] = [];
    const currentMetrics = realTimeMonitor.getMetrics();
    const history = realTimeMonitor.getMetricsHistory();

    if (!currentMetrics) return predictions;

    // High CPU load trend prediction
    const cpuTrend = this.calculateTrend(history, "systemHealth.cpuLoad");
    if (cpuTrend > 5) {
      predictions.push({
        timestamp: new Date().toISOString(),
        prediction: "CPU load trending high - risk of performance degradation",
        confidence: 0.85,
        recommendedAction: "Clear cache and optimize CPU usage proactively",
        estimatedTimeToFailure: 15,
      });
    }

    // Memory pressure prediction
    const memoryTrend = this.calculateTrend(history, "systemHealth.memoryUsage");
    if (memoryTrend > 3) {
      predictions.push({
        timestamp: new Date().toISOString(),
        prediction: "Memory usage increasing - potential memory leak detected",
        confidence: 0.78,
        recommendedAction: "Schedule memory optimization and cache clearing",
        estimatedTimeToFailure: 20,
      });
    }

    // Error rate escalation
    const errorTrend = this.calculateTrend(history, "systemHealth.errorRate");
    if (errorTrend > 2) {
      predictions.push({
        timestamp: new Date().toISOString(),
        prediction: "Error rate escalating - system becoming unstable",
        confidence: 0.92,
        recommendedAction: "Initiate emergency diagnostic and restart affected modules",
        estimatedTimeToFailure: 5,
      });
    }

    // Response time degradation
    const responseTrend = this.calculateTrend(history, "planGeneration.avgTime");
    if (responseTrend > 3) {
      predictions.push({
        timestamp: new Date().toISOString(),
        prediction: "Response times degrading - database optimization needed",
        confidence: 0.80,
        recommendedAction: "Optimize database queries and clear query cache",
      });
    }

    // User engagement drop
    const engagementTrend = this.calculateTrend(history, "userEngagement.completionRate");
    if (engagementTrend < -3) {
      predictions.push({
        timestamp: new Date().toISOString(),
        prediction: "User engagement declining - motivation engine needs refresh",
        confidence: 0.75,
        recommendedAction: "Update motivational messages and send re-engagement notifications",
      });
    }

    return predictions;
  }

  private calculateTrend(history: any[], metric: string): number {
    if (history.length < 3) return 0;

    const values = history.slice(-10).map((h) => {
      const parts = metric.split(".");
      let value: any = h;
      for (const part of parts) {
        value = value?.[part];
      }
      return typeof value === "number" ? value : 0;
    });

    if (values.length < 2) return 0;

    const firstHalf = values.slice(0, Math.floor(values.length / 2)).reduce((a, b) => a + b) / Math.floor(values.length / 2);
    const secondHalf = values.slice(Math.floor(values.length / 2)).reduce((a, b) => a + b) / Math.ceil(values.length / 2);

    return ((secondHalf - firstHalf) / firstHalf) * 100;
  }

  getSelfHealingActions(): string[] {
    const actions: string[] = [];
    const predictions = this.predict();

    for (const pred of predictions) {
      if (pred.confidence > 0.8 && pred.estimatedTimeToFailure && pred.estimatedTimeToFailure < 10) {
        actions.push(pred.recommendedAction);
      }
    }

    return actions;
  }
}

export const predictiveMaintenanceEngine = new PredictiveMaintenanceEngine();
