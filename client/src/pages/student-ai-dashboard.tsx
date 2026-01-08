import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { StudentAIDashboardData } from "@/types/dashboard";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from "recharts";
import {
  TrendingUp,
  Zap,
  BookOpen,
  Target,
  Settings,
  RefreshCw,
  Star,
  Flame,
} from "lucide-react";

export function StudentAIDashboard() {
  const { toast } = useToast();
  const [selectedTab, setSelectedTab] = useState("overview");

  // Fetch all dashboard data
  const { data: overview } = useQuery<StudentAIDashboardData>({
    queryKey: ["/api/ai/dashboard/overview"],
  });

  const { data: goals } = useQuery<StudentAIDashboardData>({
    queryKey: ["/api/ai/dashboard/goals"],
  });

  const { data: suggestions } = useQuery<StudentAIDashboardData>({
    queryKey: ["/api/ai/dashboard/suggestions"],
  });

  const { data: performance } = useQuery<StudentAIDashboardData>({
    queryKey: ["/api/ai/dashboard/performance"],
  });

  // Refresh suggestions
  const refreshSuggestions = useMutation({
    mutationFn: () => apiRequest("POST", "/api/ai/dashboard/refresh", {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai/dashboard/suggestions"] });
      toast({ title: "Refreshed", description: "AI suggestions updated" });
    },
  });

  // Update personalization
  const updatePersonalization = useMutation({
    mutationFn: (level: string) =>
      apiRequest("POST", "/api/ai/dashboard/personalization", { level }),
    onSuccess: () => {
      toast({ title: "Updated", description: "Personalization level changed" });
    },
  });

  // Provide feedback
  const provideFeedback = useMutation({
    mutationFn: (feedback: any) =>
      apiRequest("POST", "/api/ai/dashboard/feedback", feedback),
    onSuccess: () => {
      toast({ title: "Thanks!", description: "Your feedback helps us improve" });
    },
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Zap className="w-8 h-8 text-yellow-500" />
            AI-Powered Learning Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Personalization Level: {Math.round(overview?.personalizationLevel || 0)}%
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => refreshSuggestions.mutate()}
            disabled={refreshSuggestions.isPending}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
          <Button variant="outline" className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Overall Score</p>
                <p className="text-3xl font-bold text-blue-600 mt-2">
                  {performance?.overallScore || 0}
                </p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Active Goals</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {overview?.activeGoals || 0}
                </p>
              </div>
              <Target className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Study Streak</p>
                <p className="text-3xl font-bold text-orange-600 mt-2">
                  {performance?.streak || 0} days
                </p>
              </div>
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">Progress</p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {overview?.avgProgress || 0}%
                </p>
              </div>
              <Star className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4">
            {/* Weekly Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performance?.weeklyProgress || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Predictions */}
            {performance?.predictions && (
              <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle className="text-blue-900 dark:text-blue-300">AI Predictions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-400">Next Milestone</p>
                    <p className="font-semibold text-blue-900 dark:text-blue-200">
                      {performance.predictions.nextMilestone}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-400">Estimated Completion</p>
                    <p className="font-semibold text-blue-900 dark:text-blue-200">
                      {performance.predictions.estimatedCompletionDate}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-blue-700 dark:text-blue-400">Success Probability</p>
                    <div className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded mt-1">
                      <div
                        className="h-full bg-blue-600 rounded"
                        style={{
                          width: `${(performance.predictions.successProbability || 0) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Goals Tab */}
        <TabsContent value="goals">
          <div className="space-y-4">
            {goals?.goals && Array.isArray(goals.goals) && goals.goals.length > 0 ? (
              goals.goals.map((goal: any) => (
                <Card key={goal.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                          {goal.text}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Due: {goal.deadline}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          goal.priority === "high"
                            ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                            : goal.priority === "medium"
                              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
                              : "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
                        }`}
                      >
                        {goal.priority}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          Progress
                        </span>
                        <span className="text-sm font-semibold">{goal.progress}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded">
                        <div
                          className="h-full bg-blue-600 rounded transition-all"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>

                    <p className="text-sm italic text-slate-600 dark:text-slate-400">
                      💡 {goal.aiSuggestion}
                    </p>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="p-6 text-center text-slate-600 dark:text-slate-400">
                  No active goals. Create one to get started!
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations">
          <Tabs defaultValue="courses" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="courses">Courses</TabsTrigger>
              <TabsTrigger value="plans">Study Plans</TabsTrigger>
              <TabsTrigger value="goals">Goals</TabsTrigger>
            </TabsList>

            {/* Course Recommendations */}
            <TabsContent value="courses">
              <div className="space-y-4">
                {suggestions?.courseRecommendations?.map((course: any) => (
                  <Card key={course.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">
                            {course.title}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            {course.description}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-blue-600">
                          {Math.round(course.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                        ⏱️ {course.estimatedTime}
                      </p>
                      <p className="text-sm italic text-slate-500 dark:text-slate-400 mb-4">
                        "{course.reasoning}"
                      </p>
                      <Button className="w-full">Enroll</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Study Plans */}
            <TabsContent value="plans">
              <div className="space-y-4">
                {suggestions?.studyPlanSuggestions?.map((plan: any) => (
                  <Card key={plan.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-3">
                        <h3 className="font-bold text-slate-900 dark:text-white">
                          {plan.title}
                        </h3>
                        <span className="text-lg font-bold text-green-600">
                          {Math.round(plan.confidence * 100)}%
                        </span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                        Schedule: {plan.schedule}
                      </p>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                        Duration: {plan.estimatedDuration}
                      </p>
                      <Button className="w-full">Start Plan</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Goal Suggestions */}
            <TabsContent value="goals">
              <div className="space-y-4">
                {suggestions?.goalSuggestions?.map((goal: any) => (
                  <Card key={goal.id}>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-900 dark:text-white">
                            {goal.goal}
                          </h3>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Timeline: {goal.timeline}
                          </p>
                        </div>
                        <span className="text-lg font-bold text-purple-600">
                          {Math.round(goal.confidence * 100)}%
                        </span>
                      </div>
                      <Button className="w-full mt-4">Add Goal</Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance">
          <div className="space-y-4">
            {/* Activity Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Weekly Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={performance?.weeklyProgress || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="activities" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Strengths & Areas */}
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-green-900 dark:text-green-300">Top Strengths</CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(performance?.topStrengths || []).map((strength: { label: string; value: number } | string, idx: number) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-green-600 dark:text-green-400">✓</span>
                        <span className="text-green-900 dark:text-green-200">
                          {typeof strength === 'string' ? strength : strength.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card className="bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="text-orange-900 dark:text-orange-300">
                    Areas to Improve
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {(performance?.areasForImprovement || []).map((area: { label: string; value: number } | string, idx: number) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-orange-600 dark:text-orange-400">→</span>
                        <span className="text-orange-900 dark:text-orange-200">
                          {typeof area === 'string' ? area : area.label}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
