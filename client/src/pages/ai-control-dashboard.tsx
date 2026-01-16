import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  Settings,
  RefreshCw,
  Activity,
  TrendingUp,
  Zap,
  Sliders,
} from "lucide-react";

// Type definitions for API responses
interface ControlPanel {
  overallPerformance?: {
    avgConfidence?: number;
    totalSuggestions?: number;
    acceptanceRate?: number;
    performanceScore?: number;
  };
  goalRecommendationsControl?: {
    status?: string;
    threshold?: number;
    enabled?: boolean;
    confidenceLevel?: number;
    suggestionsCount?: number;
    acceptanceRate?: number;
    customization?: any;
  };
  courseSuggestionsControl?: {
    status?: string;
    threshold?: number;
    enabled?: boolean;
    confidenceLevel?: number;
    suggestionsCount?: number;
    acceptanceRate?: number;
    customization?: any;
  };
  studyPlanControl?: {
    status?: string;
    threshold?: number;
    enabled?: boolean;
    confidenceLevel?: number;
    suggestionsCount?: number;
    acceptanceRate?: number;
    customization?: any;
  };
  suggestionsByType?: {
    [key: string]: number;
  };
  timeSeriesData?: Array<{
    date: string;
    value: number;
    acceptanceRate?: number;
  }>;
  aiSettings?: {
    personalizationLevel?: string;
    updateFrequency?: string;
    feedbackIncorporation?: boolean;
    confidenceThreshold?: number;
    [key: string]: any;
  };
}

interface Analytics {
  suggestionsByType?: {
    goal?: number;
    course?: number;
    study_plan?: number;
    [key: string]: number | undefined;
  };
  timeSeriesData?: Array<{
    date: string;
    value: number;
    acceptanceRate?: number;
  }>;
  [key: string]: any;
}

export function AIControlDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch control panel with proper typing
  const { data: controlPanelRaw, isLoading: panelLoading } = useQuery<ControlPanel | undefined>({
    queryKey: ["/api/ai/control-panel"],
    queryFn: async ({ queryKey }): Promise<ControlPanel> => {
      const response = await apiRequest("GET", queryKey[0] as string);
      const json: unknown = await response.json();
      // Handle both wrapped and unwrapped responses
      if (json && typeof json === 'object' && json !== null && 'data' in json) {
        const wrappedResponse = json as { data?: ControlPanel; status?: string };
        if (wrappedResponse.data) {
          return wrappedResponse.data;
        }
      }
      return json as ControlPanel;
    },
  });

  // Fetch analytics with proper typing
  const { data: analyticsRaw, isLoading: analyticsLoading } = useQuery<Analytics | undefined>({
    queryKey: ["/api/ai/performance-analytics"],
    queryFn: async ({ queryKey }): Promise<Analytics> => {
      const response = await apiRequest("GET", queryKey[0] as string);
      const json: unknown = await response.json();
      // Handle both wrapped and unwrapped responses
      if (json && typeof json === 'object' && json !== null && 'data' in json) {
        const wrappedResponse = json as { data?: Analytics; status?: string };
        if (wrappedResponse.data) {
          return wrappedResponse.data;
        }
      }
      return json as Analytics;
    },
  });

  // Type the data explicitly with proper type guards
  const panel: ControlPanel | undefined = controlPanelRaw ?? undefined;
  const analyticsData: Analytics | undefined = analyticsRaw ?? undefined;

  // Refresh suggestions
  const refreshSuggestions = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/ai/refresh-suggestions", {});
      return response.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/control-panel"] });
      toast({
        title: "Refreshed",
        description: `${data?.refreshedCount || data?.data?.refreshedCount || 0} suggestions updated`,
      });
    },
  });

  // Adjust personalization
  const adjustPersonalization = useMutation({
    mutationFn: (level: string) =>
      apiRequest("POST", "/api/ai/personalization-level", { level }),
    onSuccess: () => {
      toast({ title: "Updated", description: "Personalization level changed" });
    },
  });

  if (panelLoading || analyticsLoading) {
    return <div className="p-6 text-center">Loading AI control panel...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-8 h-8" />
            AI Control Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Manage and optimize your AI-powered features
          </p>
        </div>
        <Button
          onClick={() => refreshSuggestions.mutate()}
          disabled={refreshSuggestions.isPending}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </Button>
      </div>

      {/* Performance Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Avg Confidence
                </p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {panel?.overallPerformance?.avgConfidence || 0}%
                </p>
              </div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Total Suggestions
                </p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {panel?.overallPerformance?.totalSuggestions || 0}
                </p>
              </div>
              <Activity className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Acceptance Rate
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {panel?.overallPerformance?.acceptanceRate || 0}%
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Performance Score
                </p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {panel?.overallPerformance?.performanceScore || 0}/100
                </p>
              </div>
              <Sliders className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="modules">Modules</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>AI System Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Goal Recommendations Control */}
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Goal Recommendations
                  </h3>
                  <span
                    className={`px-2 py-1 rounded text-xs font-semibold ${
                      panel?.goalRecommendationsControl?.status === "active"
                        ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                    }`}
                  >
                    {panel?.goalRecommendationsControl?.status}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Confidence
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {panel?.goalRecommendationsControl?.confidenceLevel}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Suggestions
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {panel?.goalRecommendationsControl?.suggestionsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Acceptance
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {panel?.goalRecommendationsControl?.acceptanceRate}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Course Suggestions Control */}
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Course Suggestions
                  </h3>
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Confidence
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {panel?.courseSuggestionsControl?.confidenceLevel}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Suggestions
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {panel?.courseSuggestionsControl?.suggestionsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Acceptance
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {panel?.courseSuggestionsControl?.acceptanceRate}%
                    </p>
                  </div>
                </div>
              </div>

              {/* Study Plan Control */}
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-slate-900 dark:text-white">
                    Study Plan AI
                  </h3>
                  <span className="px-2 py-1 rounded text-xs font-semibold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                    active
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Confidence
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {panel?.studyPlanControl?.confidenceLevel}%
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Suggestions
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {panel?.studyPlanControl?.suggestionsCount}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-600 dark:text-slate-400">
                      Acceptance
                    </p>
                    <p className="text-lg font-bold text-slate-900 dark:text-white">
                      {panel?.studyPlanControl?.acceptanceRate}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Suggestions by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={[
                      {
                        name: "Goals",
                        count: analyticsData?.suggestionsByType?.goal || 0,
                      },
                      {
                        name: "Courses",
                        count: analyticsData?.suggestionsByType?.course || 0,
                      },
                      {
                        name: "Study Plans",
                        count: analyticsData?.suggestionsByType?.study_plan || 0,
                      },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Time Series Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData?.timeSeriesData || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="acceptanceRate"
                      stroke="#8b5cf6"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>AI Control Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Personalization Level */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-900 dark:text-white">
                  Personalization Level
                </label>
                <div className="flex gap-2">
                  {(["low", "medium", "high"] as const).map((level) => (
                    <Button
                      key={level}
                      variant={
                        panel?.aiSettings?.personalizationLevel === level
                          ? "default"
                          : "outline"
                      }
                      onClick={() =>
                        adjustPersonalization.mutate(level)
                      }
                      disabled={adjustPersonalization.isPending}
                      className="capitalize"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Update Frequency */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-900 dark:text-white">
                  Update Frequency
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Current: {panel?.aiSettings?.updateFrequency}
                </p>
              </div>

              {/* Feedback Incorporation */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-900 dark:text-white">
                  Feedback Incorporation
                </label>
                <div
                  className={`px-3 py-2 rounded ${
                    panel?.aiSettings?.feedbackIncorporation
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                      : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                  }`}
                >
                  {panel?.aiSettings?.feedbackIncorporation
                    ? "Enabled"
                    : "Disabled"}
                </div>
              </div>

              {/* Confidence Threshold */}
              <div className="space-y-2">
                <label className="font-semibold text-slate-900 dark:text-white">
                  Confidence Threshold
                </label>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  {panel?.aiSettings?.confidenceThreshold}% minimum
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
