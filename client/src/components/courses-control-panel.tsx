import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useInteractionTracker } from "@/hooks/use-interaction-tracker";

interface Module {
  id: string;
  name: string;
  actions: string[];
  status: "active" | "inactive" | "warning";
}

export function CoursesControlPanel() {
  const [systemStatus, setSystemStatus] = useState("active");
  const [recentInteractions, setRecentInteractions] = useState<any[]>([]);
  const tracker = useInteractionTracker();

  const { data: statusData } = useQuery<any>({
    queryKey: ["/api/course-control/status"],
    refetchInterval: 5000,
  });

  const { data: interactionsData } = useQuery<any>({
    queryKey: ["/api/course-control/interactions/recent"],
    refetchInterval: 3000,
  });

  const { data: statsData } = useQuery<any>({
    queryKey: ["/api/course-control/interactions/stats"],
    refetchInterval: 5000,
  });

  const { data: dependencyMapData } = useQuery<any>({
    queryKey: ["/api/course-control/dependency-map"],
  });

  const { data: flowDiagramData } = useQuery<any>({
    queryKey: ["/api/course-control/interactions/flow-diagram"],
    refetchInterval: 5000,
  });

  const { data: performanceData } = useQuery<any>({
    queryKey: ["/api/course-control/interactions/performance-report"],
    refetchInterval: 10000,
  });

  useEffect(() => {
    const interactions = (interactionsData as any)?.interactions;
    if (Array.isArray(interactions)) {
      setRecentInteractions(interactions);
    }
  }, [interactionsData]);

  const modules: Record<string, Module> = {
    course_management: {
      id: "course_management",
      name: "📚 Course Management",
      actions: ["refresh_catalog", "update_metadata", "sync_enrollments", "validate_courses"],
      status: "active",
    },
    content_delivery: {
      id: "content_delivery",
      name: "🎥 Content Delivery",
      actions: ["optimize_delivery", "clear_cache", "test_streaming", "update_cdn"],
      status: "active",
    },
    progress_tracking: {
      id: "progress_tracking",
      name: "📈 Progress Tracking",
      actions: ["recalculate_progress", "sync_achievements", "fix_stuck_progress", "export_data"],
      status: "active",
    },
    user_engagement: {
      id: "user_engagement",
      name: "💬 User Engagement",
      actions: ["send_motivation", "update_recommendations", "analyze_behavior", "trigger_reminders"],
      status: "active",
    },
    analytics_engine: {
      id: "analytics_engine",
      name: "📊 Analytics Engine",
      actions: ["generate_reports", "update_metrics", "clear_analytics", "export_insights"],
      status: "active",
    },
  };

  const formatActionName = (action: string): string => {
    return action
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleModuleAction = async (moduleId: string, action: string) => {
    try {
      const response = await fetch("/api/course-control/interaction-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceModule: "control_panel",
          targetModule: moduleId,
          action,
          data: { timestamp: new Date().toISOString() },
        }),
      });
      if (response.ok) {
        console.log(`Action ${action} executed on ${moduleId}`);
      }
    } catch (error) {
      console.error("Error executing action:", error);
    }
  };

  const handleSystemAction = async (action: string) => {
    try {
      await fetch("/api/course-control/interaction-log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceModule: "control_panel",
          targetModule: "system",
          action,
          data: { timestamp: new Date().toISOString() },
        }),
      });
    } catch (error) {
      console.error("Error executing system action:", error);
    }
  };

  return (
    <div className="w-full space-y-6 p-6 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white">📚 Courses Control Center</h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">Manage courses module operations</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-700 rounded-lg">
          <div className={`w-3 h-3 rounded-full ${systemStatus === "active" ? "bg-green-500" : "bg-red-500"}`}></div>
          <span className="text-sm font-medium text-slate-900 dark:text-white">
            {systemStatus === "active" ? "System Active" : "System Inactive"}
          </span>
        </div>
      </div>

      {/* Control Tabs */}
      <Tabs defaultValue="modules" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="interactions">Interactions</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="system">System</TabsTrigger>
        </TabsList>

        {/* Modules Tab */}
        <TabsContent value="modules">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.values(modules).map((module) => (
              <Card key={module.id} className="bg-white dark:bg-slate-700">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{module.name}</CardTitle>
                      <CardDescription className="mt-1">Module Controls</CardDescription>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        module.status === "active"
                          ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                          : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                      }`}
                    >
                      {module.status}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    {module.actions.map((action) => (
                      <Button
                        key={action}
                        size="sm"
                        variant="outline"
                        className="text-xs"
                        onClick={() => handleModuleAction(module.id, action)}
                      >
                        {formatActionName(action)}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Interactions Tab */}
        <TabsContent value="interactions">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Interaction Stats */}
            <Card className="lg:col-span-1 bg-white dark:bg-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">📊 Interaction Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Total Interactions</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {(statsData as any)?.data?.totalInteractions || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Validated</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                    {(statsData as any)?.data?.validatedCount || 0}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">Unique Users</p>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                    {(statsData as any)?.data?.uniqueUsers || 0}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Interactions */}
            <Card className="lg:col-span-2 bg-white dark:bg-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">🔄 Recent Interactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {recentInteractions.length > 0 ? (
                    recentInteractions.map((interaction, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-slate-900 dark:text-white">
                              {interaction.source} → {interaction.target}
                            </p>
                            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                              {interaction.action}
                            </p>
                          </div>
                          <div
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              interaction.validated
                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                                : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            }`}
                          >
                            {interaction.validated ? "✓" : "✗"}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-8">No interactions yet</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-4">
            <Card className="bg-white dark:bg-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">📈 Module Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {(statsData as any)?.data?.interactionsBySource &&
                    Object.entries((statsData as any).data.interactionsBySource).map(([module, count]) => (
                      <div key={module} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-600">
                        <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">From {module}</p>
                        <p className="text-2xl font-bold text-slate-900 dark:text-white">{count as number}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-500 mt-2">interactions initiated</p>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            {/* Flow Diagram */}
            <Card className="bg-white dark:bg-slate-700">
              <CardHeader>
                <CardTitle className="text-lg">🔄 Module Flow Diagram</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {(flowDiagramData as any)?.data?.flows && (flowDiagramData as any).data.flows.length > 0 ? (
                    ((flowDiagramData as any).data.flows as any[]).map((flow: any, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 bg-slate-50 dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-600 flex items-center justify-between"
                      >
                        <span className="text-sm font-medium text-slate-900 dark:text-white">
                          {flow.source} → {flow.target}
                        </span>
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded text-sm font-semibold">
                          {flow.count}
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-slate-600 dark:text-slate-400 text-center py-4">No flows detected</p>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Performance Report */}
            {(performanceData as any)?.data && (
              <Card className="bg-white dark:bg-slate-700">
                <CardHeader>
                  <CardTitle className="text-lg">⚡ Performance Report</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-slate-900 dark:text-white mb-2">Slowest API Calls</h4>
                    <div className="space-y-1">
                      {((performanceData as any).data.slowestApis as any[])?.slice(0, 5).map((api: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-sm p-2 bg-slate-50 dark:bg-slate-800 rounded">
                          <span className="text-slate-600 dark:text-slate-400">{api.action}</span>
                          <span className="font-medium text-red-600 dark:text-red-400">{api.duration.toFixed(2)}ms</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <Card className="bg-white dark:bg-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">📑 Content Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button onClick={() => handleSystemAction("sync_content")}>Sync All Content</Button>
                <Button onClick={() => handleSystemAction("validate_content")}>Validate Content</Button>
                <Button onClick={() => handleSystemAction("update_metadata")}>Update Metadata</Button>
                <Button onClick={() => handleSystemAction("rebuild_cache")}>Rebuild Cache</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system">
          <Card className="bg-white dark:bg-slate-700">
            <CardHeader>
              <CardTitle className="text-lg">⚙️ System-wide Controls</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="default" onClick={() => handleSystemAction("sync_all_modules")}>
                  Sync All Modules
                </Button>
                <Button variant="default" onClick={() => handleSystemAction("clear_all_cache")}>
                  Clear All Cache
                </Button>
                <Button variant="outline" onClick={() => handleSystemAction("export_system_logs")}>
                  Export System Logs
                </Button>
                <Button variant="destructive" onClick={() => handleSystemAction("emergency_stop")}>
                  Emergency Stop
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
