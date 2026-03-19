import type { Express } from "express";
import type { Server } from "http";
import { WebSocketServer } from "ws";
import { systemHealthCheck } from "./smart-suggestions/system-health-check.js";
import { storage } from "./storage.js";

const MIN_INTERVAL = 10000;
const MAX_INTERVAL = 60000;
const DEFAULT_INTERVAL = 20000;

const SYSTEM_METRICS_TTL_MS = 15000;

let cachedSystemMetrics: unknown | null = null;
let cachedSystemMetricsAt = 0;
let inFlightSystemMetricsPromise: Promise<unknown> | null = null;

async function getCachedSystemMetrics() {
  const now = Date.now();

  if (cachedSystemMetrics !== null && now - cachedSystemMetricsAt < SYSTEM_METRICS_TTL_MS) {
    return cachedSystemMetrics;
  }

  if (inFlightSystemMetricsPromise) {
    return inFlightSystemMetricsPromise;
  }

  const promise = systemHealthCheck.getSuccessMetrics();
  inFlightSystemMetricsPromise = promise
    .then((metrics) => {
      cachedSystemMetrics = metrics;
      cachedSystemMetricsAt = Date.now();
      return metrics;
    })
    .finally(() => {
      inFlightSystemMetricsPromise = null;
    });

  return inFlightSystemMetricsPromise;
}

type LiveStatsPayload = {
  type: "live_stats";
  data: {
    systemMetrics: any | null;
    trialStats: {
      count: number;
      avgNet: number;
      latestNet: number;
      netSeries: number[];
    } | null;
    trialStatus: "ready" | "unauthorized" | "error";
    updatedAt: string;
  };
};

export function setupLiveStatsWebsocket(server: Server, app: Express) {
  const sessionMiddleware = app.get("sessionMiddleware") as
    | ((req: any, res: any, next: (err?: any) => void) => void)
    | undefined;

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    if (!req.url || !req.url.startsWith("/ws/live-stats")) {
      return;
    }

    if (!sessionMiddleware) {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
      return;
    }

    sessionMiddleware(req, {} as any, () => {
      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    });
  });

  wss.on("connection", (ws, req) => {
    const url = req.url ? new URL(req.url, "http://localhost") : null;
    const interval = Math.min(
      MAX_INTERVAL,
      Math.max(MIN_INTERVAL, Number(url?.searchParams.get("interval")) || DEFAULT_INTERVAL)
    );
    const scope = (url?.searchParams.get("scope") || "all").toLowerCase();
    const includeSystem = scope === "all" || scope === "system";
    const includeTrials = scope === "all" || scope === "trials";

    const rawUserId = (req as any)?.session?.passport?.user;
    const userId = Number(rawUserId);

    let inFlight = false;
    const sendSnapshot = async () => {
      if (inFlight || ws.readyState !== ws.OPEN) return;
      inFlight = true;

      try {
        const systemMetrics = includeSystem ? await getCachedSystemMetrics() : null;
        let trialStatus: "ready" | "unauthorized" | "error" = "unauthorized";
        let trialStats: LiveStatsPayload["data"]["trialStats"] = null;

        if (includeTrials && Number.isFinite(userId) && userId > 0) {
          try {
            const trials = await storage.getTytTrialExams(userId);
            const list = Array.isArray(trials) ? trials : [];
            const count = list.length;
            const latestNet = count > 0 ? Number(list[0]?.netScore || 0) : 0;
            const avgNet = count > 0
              ? Math.round(list.reduce((sum: number, t: any) => sum + Number(t?.netScore || 0), 0) / count)
              : 0;
            const netSeries = list
              .map((trial: any) => Number(trial?.netScore || 0))
              .filter((value: number) => Number.isFinite(value))
              .slice(0, 6)
              .reverse();

            trialStats = { count, avgNet, latestNet, netSeries };
            trialStatus = "ready";
          } catch (error) {
            console.error("[LiveStatsWS] Trial stats error:", error);
            trialStatus = "error";
          }
        }

        const payload: LiveStatsPayload = {
          type: "live_stats",
          data: {
            systemMetrics,
            trialStats,
            trialStatus,
            updatedAt: new Date().toISOString()
          }
        };

        ws.send(JSON.stringify(payload));
      } catch (error) {
        console.error("[LiveStatsWS] Snapshot error:", error);
      } finally {
        inFlight = false;
      }
    };

    sendSnapshot();
    const timer = setInterval(sendSnapshot, interval);

    ws.on("close", () => {
      clearInterval(timer);
    });
  });
}
