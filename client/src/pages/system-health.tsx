import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, CheckCircle2, AlertCircle, TrendingUp } from "lucide-react";
import { SystemHealthData } from "@/types/dashboard";

export function SystemHealth() {
  const [healthData, setHealthData] = useState<SystemHealthData>({});
  
  const { data: health } = useQuery<SystemHealthData>({
    queryKey: ["/api/system/health"],
  });
  
  // Update state when data changes
  useEffect(() => {
    if (health) setHealthData(health);
  }, [health]);

  const { data: checklist } = useQuery({
    queryKey: ["/api/system/checklist"],
  });

  const { data: metrics } = useQuery({
    queryKey: ["/api/system/metrics"],
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "healthy":
        return "text-green-600";
      case "degraded":
        return "text-yellow-600";
      case "critical":
        return "text-red-600";
      default:
        return "text-slate-600";
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Activity className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">System Health</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Status: <span className={`font-bold ${getStatusColor(healthData?.status || "unknown")}`}>
              {(healthData?.status || "unknown").toUpperCase()}
            </span>
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">AI Accuracy</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{metrics?.aiAccuracy || 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Reliability</p>
            <p className="text-3xl font-bold text-green-600 mt-2">{metrics?.systemReliability || 0}%</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Endpoints</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {checklist?.totalEndpoints || 0}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Completion</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              {checklist?.completionPercentage || 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="components">Components</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
        </TabsList>

        {/* Overview */}
        <TabsContent value="overview">
          <div className="space-y-4">
            {/* System Status */}
            <Card>
              <CardHeader>
                <CardTitle>System Components</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {(() => {
                  const components = Array.isArray(healthData?.components) 
                    ? healthData.components 
                    : (healthData?.components && typeof healthData.components === 'object')
                    ? Object.entries(healthData.components)
                    : [];
                  
                  if (Array.isArray(components)) {
                    return components.map((comp: any, idx: number) => {
                      const key = comp.id || comp.name || idx.toString();
                      const component = comp;
                      return (
                        <div key={key} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                          <div>
                            <p className="font-semibold capitalize text-slate-900 dark:text-white">
                              {component.title || component.name || key}
                            </p>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                              Status: <span className="font-bold">{component.status || 'unknown'}</span>
                            </p>
                          </div>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                        </div>
                      );
                    });
                  } else if (typeof components === 'object' && components !== null && !Array.isArray(components)) {
                    return Object.entries(components).map(([key, component]: [string, any]) => (
                      <div key={key} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                        <div>
                          <p className="font-semibold capitalize text-slate-900 dark:text-white">
                            {key.replace(/([A-Z])/g, " $1")}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400">
                            Status: <span className="font-bold">{component.status}</span>
                          </p>
                        </div>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                      </div>
                    ));
                  }
                  return null;
                })()}
              </CardContent>
            </Card>

            {/* Performance Targets */}
            <Card>
              <CardHeader>
                <CardTitle>Performance Targets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Response Time Target</span>
                    <span className="font-semibold">
                      {health?.performanceTargets?.currentResponseTime || 0}ms / {health?.performanceTargets?.targetResponseTime || 200}ms
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded">
                    <div
                      className="h-full bg-blue-600 rounded"
                      style={{
                        width: `${Math.min(
                          ((health?.performanceTargets?.currentResponseTime || 0) /
                            (health?.performanceTargets?.targetResponseTime || 200)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-600 dark:text-slate-400">Success Rate Target</span>
                    <span className="font-semibold">
                      {health?.performanceTargets?.currentSuccessRate || 0}% / {health?.performanceTargets?.targetSuccessRate || 99}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded">
                    <div
                      className="h-full bg-green-600 rounded"
                      style={{
                        width: `${Math.min(
                          ((health?.performanceTargets?.currentSuccessRate || 0) /
                            (health?.performanceTargets?.targetSuccessRate || 99)) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Alerts */}
            {(() => {
              const alerts = Array.isArray(healthData?.alerts) ? healthData.alerts : [];
              return alerts.length > 0 && (
                <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-900 dark:text-yellow-300">
                      <AlertCircle className="w-5 h-5" />
                      Alerts
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {alerts.map((alert: any, idx: number) => (
                        <li key={idx} className="text-sm text-yellow-900 dark:text-yellow-200">
                          {alert.message || alert}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })()}
          </div>
        </TabsContent>

        {/* Components */}
        <TabsContent value="components">
          <div className="space-y-4">
            {[
              {
                title: "Core AI System",
                count: "5 Models",
                items: ["Goal Recommendation", "Course Suggestion", "Progress Prediction", "Engagement Optimizer", "Personalization"],
              },
              {
                title: "User Journey AI",
                count: "5 Components",
                items: ["Registration Processor", "Pre-Course Guidance", "Onboarding", "Enhanced Profiles", "Interaction Logs"],
              },
              {
                title: "Control System",
                count: "5 Components",
                items: ["AI Dashboard", "Analytics", "Tracker", "Monitor", "Feedback"],
              },
              {
                title: "Student Dashboard",
                count: "5 Widgets",
                items: ["Goal Tracking", "Course Recommendations", "Study Plans", "Performance", "Controls"],
              },
            ].map((component) => (
              <Card key={component.title}>
                <CardHeader>
                  <CardTitle className="flex justify-between">
                    {component.title}
                    <span className="text-sm text-slate-600 dark:text-slate-400">{component.count}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {component.items.map((item) => (
                      <li key={item} className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="text-slate-700 dark:text-slate-300">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Checklist */}
        <TabsContent value="checklist">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                Implementation Checklist
                <span className="text-2xl font-bold text-green-600">
                  {checklist?.completionPercentage || 0}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { title: "Step 1: Core AI System", data: checklist?.step1CoreAISystem },
                { title: "Step 2: User Journey AI", data: checklist?.step2UserJourneyAI },
                { title: "Step 3: Control System", data: checklist?.step3ControlSystem },
                { title: "Step 4: Student Dashboard", data: checklist?.step4Dashboard },
              ].map((step) => (
                <div key={step.title} className="p-4 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">{step.title}</h3>
                    {step.data?.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-yellow-600" />
                    )}
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {step.data?.endpoints} endpoints • {step.data?.components?.length} components
                  </p>
                  <div className="space-y-1">
                    {step.data?.components?.map((comp) => (
                      <p key={comp} className="text-xs text-slate-600 dark:text-slate-400">
                        ✓ {comp}
                      </p>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Metrics */}
        <TabsContent value="metrics">
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Success Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "AI Accuracy", value: `${metrics?.aiAccuracy}%` },
                  { label: "User Engagement", value: `${metrics?.userEngagement}%` },
                  { label: "Goal Completion", value: `${metrics?.goalCompletionRate}%` },
                  { label: "System Reliability", value: `${metrics?.systemReliability}%` },
                  { label: "User Satisfaction", value: `${metrics?.userSatisfaction}/5.0` },
                ].map((metric) => (
                  <div key={metric.label} className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                    <span className="text-slate-700 dark:text-slate-300">{metric.label}</span>
                    <span className="font-bold text-blue-600">{metric.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Deployment Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Time to Value", value: metrics?.timeToValue },
                  { label: "Scalability", value: metrics?.scalability },
                  { label: "Total Endpoints", value: `${checklist?.totalEndpoints} active` },
                  { label: "Total Components", value: `${checklist?.totalComponents} deployed` },
                ].map((metric) => (
                  <div key={metric.label} className="flex justify-between p-2 bg-slate-50 dark:bg-slate-900 rounded">
                    <span className="text-slate-700 dark:text-slate-300">{metric.label}</span>
                    <span className="font-bold text-green-600 text-sm">{metric.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
