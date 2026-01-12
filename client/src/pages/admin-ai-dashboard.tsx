import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Settings, TrendingUp, Users, Zap, AlertCircle } from "lucide-react";

export function AdminAIDashboard() {
  const { data: managementData } = useQuery<any>({
    queryKey: ["/api/admin/ai/management"],
  });
  const management = managementData as any;

  const { data: usersData } = useQuery<any>({
    queryKey: ["/api/admin/ai/users"],
  });
  const users = usersData as any;

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Settings className="w-8 h-8" />
            Admin AI Management Dashboard
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2">
            Monitor and manage all AI-powered features
          </p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Total Users</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{users?.totalUsers || 0}</p>
            <p className="text-xs text-green-600 mt-1">↑ {users?.newUsersThisWeek || 0} this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">AI Suggestions</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {management?.systemOverview?.totalSuggestions || 0}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {management?.systemOverview?.acceptanceRate || 0}% acceptance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Avg Confidence</p>
            <p className="text-3xl font-bold text-purple-600 mt-2">
              {management?.systemOverview?.averageConfidence || 0}%
            </p>
            <p className="text-xs text-purple-600 mt-1">Model accuracy</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">Active Users</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">{users?.activeUsers || 0}</p>
            <p className="text-xs text-orange-600 mt-1">{users?.retentionRate || 0}% retention</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-600 dark:text-slate-400">System Health</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              {management?.systemHealth?.uptime || 0}%
            </p>
            <p className="text-xs text-green-600 mt-1">Uptime</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="models">Models</TabsTrigger>
          <TabsTrigger value="health">Health</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview">
          <div className="grid gap-4">
            {/* User Engagement */}
            <Card>
              <CardHeader>
                <CardTitle>User Engagement Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={management?.userEngagement?.engagementTrend || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="engagement" stroke="#3b82f6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Suggestions Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Suggestions by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={Object.entries(management?.suggestionAnalytics?.suggestionsByType || {}).map(
                        ([name, value]) => ({ name, value })
                      )}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics">
          <div className="grid gap-4">
            {/* Acceptance Rates */}
            <Card>
              <CardHeader>
                <CardTitle>Acceptance Rates by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={Object.entries(management?.suggestionAnalytics?.acceptanceByType || {}).map(
                      ([type, rate]) => ({ type, rate })
                    )}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="type" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="rate" fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Top Performing */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Suggestions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {management?.suggestionAnalytics?.topPerforming?.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900 rounded">
                      <span className="font-semibold text-slate-900 dark:text-white">{item.suggestion}</span>
                      <span className="text-lg font-bold text-green-600">{item.acceptance}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Improvement Opportunities */}
            <Card className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-yellow-900 dark:text-yellow-300 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Improvement Opportunities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {management?.suggestionAnalytics?.improvementOpportunities?.map((opp: string, idx: number) => (
                    <li key={idx} className="text-sm text-yellow-900 dark:text-yellow-200">
                      • {opp}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Models Tab */}
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle className="flex justify-between">
                AI Model Performance
                <span className="text-sm font-normal text-slate-600 dark:text-slate-400">
                  Accuracy: {management?.modelPerformance?.overallAccuracy}%
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {management?.modelPerformance?.models?.map((model: any, idx: number) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900 rounded border border-slate-200 dark:border-slate-700">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-bold text-slate-900 dark:text-white">{model.name}</h4>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                          Status: <span className="font-semibold text-green-600">{model.status}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-slate-600 dark:text-slate-400">Usage</p>
                        <p className="text-lg font-bold text-blue-600">{model.usage}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Accuracy</p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-2 bg-slate-200 dark:bg-slate-700 rounded">
                            <div
                              className="h-full bg-green-600 rounded"
                              style={{ width: `${model.accuracy}%` }}
                            />
                          </div>
                          <span className="font-semibold">{model.accuracy}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">Response Time</p>
                        <p className="font-semibold mt-1">{model.responseTime}ms</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Health Tab */}
        <TabsContent value="health">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Health Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded border border-green-200 dark:border-green-800">
                  <p className="text-sm text-green-700 dark:text-green-400">Status</p>
                  <p className="text-2xl font-bold text-green-600 mt-2 capitalize">
                    {management?.systemHealth?.status}
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Uptime</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {management?.systemHealth?.uptime}%
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                    <p className="text-xs text-slate-600 dark:text-slate-400">Error Rate</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {management?.systemHealth?.errorRate}%
                    </p>
                  </div>
                  <div className="p-3 bg-slate-50 dark:bg-slate-900 rounded">
                    <p className="text-xs text-slate-600 dark:text-slate-400">System Load</p>
                    <p className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                      {management?.systemHealth?.systemLoad}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
