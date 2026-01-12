import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, AlertOctagon, Info, X, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Alert {
  id: string;
  rule: string;
  message: string;
  severity: "critical" | "high" | "medium" | "low";
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  actionTaken?: string;
  metrics?: Record<string, any>;
}

export function AlertManagement() {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  const { data: alertsData } = useQuery({
    queryKey: ["/api/study-planner/alerts"],
    refetchInterval: 5000,
  });

  const alerts = (alertsData as any)?.alerts as Alert[] | undefined;
  const stats = (alertsData as any)?.stats;

  const dismissMutation = useMutation({
    mutationFn: (alertId: string) =>
      apiRequest("POST", "/api/study-planner/alerts/dismiss", { alertId }),
  });

  const clearAllMutation = useMutation({
    mutationFn: () => apiRequest("POST", "/api/study-planner/alerts/clear-all"),
  });

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertOctagon className="w-5 h-5 text-red-600" />;
      case "high":
        return <AlertTriangle className="w-5 h-5 text-orange-600" />;
      case "medium":
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Info className="w-5 h-5 text-blue-600" />;
    }
  };

  const getSeverityBg = (severity: string) => {
    switch (severity) {
      case "critical":
        return "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      case "high":
        return "bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800";
      case "medium":
        return "bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      default:
        return "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800";
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-5 gap-2">
        <div className="bg-white dark:bg-slate-700 rounded p-3 shadow text-center">
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {stats?.total || 0}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Total</div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded p-3 shadow text-center border border-red-200 dark:border-red-800">
          <div className="text-2xl font-bold text-red-600">{stats?.critical || 0}</div>
          <div className="text-xs text-red-600">Critical</div>
        </div>
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded p-3 shadow text-center border border-orange-200 dark:border-orange-800">
          <div className="text-2xl font-bold text-orange-600">{stats?.high || 0}</div>
          <div className="text-xs text-orange-600">High</div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded p-3 shadow text-center border border-yellow-200 dark:border-yellow-800">
          <div className="text-2xl font-bold text-yellow-600">{stats?.medium || 0}</div>
          <div className="text-xs text-yellow-600">Medium</div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 shadow text-center border border-blue-200 dark:border-blue-800">
          <div className="text-2xl font-bold text-blue-600">{stats?.low || 0}</div>
          <div className="text-xs text-blue-600">Low</div>
        </div>
      </div>

      {/* Alerts List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {alerts && alerts.length > 0 ? (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className={`border rounded-lg p-4 transition-all ${getSeverityBg(alert.severity)}`}
            >
              <div className="flex items-start gap-3">
                {getSeverityIcon(alert.severity)}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-white">
                        {alert.message}
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                        {new Date(alert.timestamp).toLocaleTimeString()} • {alert.rule}
                        {alert.actionTaken && (
                          <span className="ml-2 italic">
                            Action: {alert.actionTaken}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        expandedAlert === alert.id
                          ? setExpandedAlert(null)
                          : setExpandedAlert(alert.id)
                      }
                      className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                    >
                      ▼
                    </button>
                  </div>

                  {/* Expanded Details */}
                  {expandedAlert === alert.id && (
                    <div className="mt-3 pt-3 border-t border-slate-300 dark:border-slate-600 space-y-2">
                      <details className="text-xs">
                        <summary className="cursor-pointer font-semibold">Metrics Data</summary>
                        <pre className="mt-1 bg-black bg-opacity-10 dark:bg-white dark:bg-opacity-10 rounded p-2 overflow-x-auto text-xs">
                          {JSON.stringify((alert as any).metrics || {}, null, 2)}
                        </pre>
                      </details>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => dismissMutation.mutate(alert.id)}
                      disabled={dismissMutation.isPending}
                      data-testid="button-dismiss-alert"
                    >
                      <X className="w-3 h-3 mr-1" />
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-slate-600 dark:text-slate-400">
            <div className="text-3xl mb-2">✅</div>
            <div>No active alerts - System running smoothly!</div>
          </div>
        )}
      </div>

      {/* Clear All Button */}
      {alerts && alerts.length > 0 && (
        <Button
          onClick={() => clearAllMutation.mutate()}
          disabled={clearAllMutation.isPending}
          variant="destructive"
          className="w-full"
          data-testid="button-clear-all-alerts"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Clear All Alerts
        </Button>
      )}
    </div>
  );
}
