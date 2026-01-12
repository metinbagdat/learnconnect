import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, Clock, Zap } from "lucide-react";
import { progressSocket } from "@/lib/progress-socket";

interface RealTimeTrackerProps {
  userId: number;
  assignmentId?: number;
}

export function RealTimeTracker({ userId, assignmentId }: RealTimeTrackerProps) {
  const [recentScore, setRecentScore] = useState<number | null>(null);
  const [timeSpent, setTimeSpent] = useState<number>(0);
  const [status, setStatus] = useState<"idle" | "tracking" | "completed">("idle");

  // Fetch intervention alerts
  const { data: alertsData } = useQuery<any>({
    queryKey: [`/api/progress/alerts/${userId}`],
    refetchInterval: 5000, // Refetch every 5 seconds
  });
  const alerts: any[] = Array.isArray(alertsData) ? alertsData : [];

  useEffect(() => {
    // Subscribe to real-time updates
    progressSocket.subscribeToProgress(userId);

    // Listen for progress updates
    const handleProgressUpdate = (data: any) => {
      if (data.metrics) {
        setRecentScore(data.metrics.score);
        setTimeSpent(data.metrics.timeSpent);
        setStatus("tracking");
      }
    };

    progressSocket.on("progress_tracked", handleProgressUpdate);

    return () => {
      progressSocket.off("progress_tracked", handleProgressUpdate);
    };
  }, [userId]);

  // Simulate progress tracking for demo
  useEffect(() => {
    const interval = setInterval(() => {
      if (status === "tracking") {
        setTimeSpent((prev) => prev + 1);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  return (
    <div className="space-y-4" data-testid="real-time-tracker">
      {/* Live Score Display */}
      {recentScore !== null && (
        <Card data-testid="score-card" className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                Current Score
              </span>
              <span
                className={`text-2xl font-bold ${
                  recentScore >= 80
                    ? "text-green-600"
                    : recentScore >= 60
                      ? "text-yellow-600"
                      : "text-red-600"
                }`}
                data-testid="score-value"
              >
                {recentScore}%
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={recentScore} className="h-3" data-testid="score-progress" />
            <div className="flex items-center gap-2 mt-3 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span data-testid="time-spent">{timeSpent} minutes</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Intervention Alerts */}
      {alerts.length > 0 && (
        <Card data-testid="alerts-card" className="border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-orange-600" />
              Real-time Alerts
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {alerts.slice(0, 3).map((alert: any, idx: number) => (
              <div
                key={idx}
                className="p-3 bg-white dark:bg-slate-800 rounded border border-orange-200 dark:border-orange-800"
                data-testid={`alert-${idx}`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-sm" data-testid={`alert-title-${idx}`}>
                    {alert.message}
                  </p>
                  <Badge
                    variant={alert.severity === "high" ? "destructive" : "secondary"}
                    className="text-xs"
                    data-testid={`alert-severity-${idx}`}
                  >
                    {alert.severity}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground" data-testid={`alert-action-${idx}`}>
                  📝 {alert.recommendedAction}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Status Badge */}
      <div className="flex items-center gap-2" data-testid="status-section">
        <Zap className="w-4 h-4" />
        <Badge
          variant={status === "completed" ? "default" : status === "tracking" ? "secondary" : "outline"}
          data-testid="status-badge"
        >
          {status === "idle" ? "Waiting for activity" : status === "tracking" ? "Tracking progress" : "Assignment complete"}
        </Badge>
      </div>
    </div>
  );
}
