import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { Sidebar } from "@/components/layout/sidebar";
import ModernNavigation from "@/components/layout/modern-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { Users, BookOpen, CheckCircle, TrendingUp, Activity, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface EnrollmentMetrics {
  totalEnrollments?: number;
  successfulPipelines?: number;
  studyPlansCreated?: number;
  aiOperations?: number;
}

interface PipelineHealth {
  step1?: string;
  step2?: string;
  step3?: string;
  step4?: string;
  step5?: string;
}

interface CourseStat {
  id: number;
  title: string;
  enrollments?: number;
  successRate?: number;
}

export default function AdminEnrollmentDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();

  const { data: enrollmentMetrics } = useQuery<EnrollmentMetrics>({
    queryKey: ["/api/admin/enrollment-metrics"],
    enabled: user?.role === "admin",
  });

  const { data: courseStats } = useQuery<CourseStat[]>({
    queryKey: ["/api/admin/course-stats"],
    enabled: user?.role === "admin",
  });

  const { data: pipelineHealth } = useQuery<PipelineHealth>({
    queryKey: ["/api/admin/pipeline-health"],
    enabled: user?.role === "admin",
  });

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900">Access Denied</h1>
          <p className="text-slate-600 mt-2">Only admins can view this dashboard</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ModernNavigation pageTitle="Admin Enrollment Dashboard" currentPage="admin" />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="py-8 px-4 sm:px-6 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Header */}
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Enrollment Pipeline Analytics</h1>
                <p className="text-slate-600 mt-2">Monitor AI generation, study plans, and assignment creation</p>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Total Enrollments
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{enrollmentMetrics.totalEnrollments || 0}</div>
                    <p className="text-xs text-slate-500 mt-1">+12% from last month</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Successful Pipelines
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{enrollmentMetrics.successfulPipelines || 0}</div>
                    <p className="text-xs text-green-600 mt-1">{Math.round((enrollmentMetrics.successfulPipelines || 0) / (enrollmentMetrics.totalEnrollments || 1) * 100)}% success rate</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      Study Plans Created
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{enrollmentMetrics.studyPlansCreated || 0}</div>
                    <p className="text-xs text-slate-500 mt-1">AI-personalized</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Zap className="w-4 h-4" />
                      AI Operations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{enrollmentMetrics.aiOperations || 0}</div>
                    <p className="text-xs text-slate-500 mt-1">Curriculum + Personalization</p>
                  </CardContent>
                </Card>
              </div>

              {/* Pipeline Health */}
              <Card>
                <CardHeader>
                  <CardTitle>Pipeline Health Status</CardTitle>
                  <CardDescription>5-Step Enrollment Automation Performance</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {[
                    { step: 1, name: "Enrollment Creation", status: pipelineHealth.step1 || "healthy" },
                    { step: 2, name: "Curriculum Generation", status: pipelineHealth.step2 || "healthy" },
                    { step: 3, name: "AI Personalization", status: pipelineHealth.step3 || "healthy" },
                    { step: 4, name: "Study Plan Creation", status: pipelineHealth.step4 || "healthy" },
                    { step: 5, name: "Assignment Generation", status: pipelineHealth.step5 || "healthy" },
                  ].map((item) => (
                    <div key={item.step} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-bold">
                          {item.step}
                        </div>
                        <span className="font-medium text-slate-900">{item.name}</span>
                      </div>
                      <Badge variant={item.status === "healthy" ? "default" : "destructive"}>
                        {item.status}
                      </Badge>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Course Statistics */}
              <Card>
                <CardHeader>
                  <CardTitle>Course Enrollment Statistics</CardTitle>
                  <CardDescription>Enrollments and success rates by course</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(courseStats || []).slice(0, 5).map((course) => (
                      <div key={course.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-slate-900">{course.title}</span>
                          <span className="text-sm text-slate-600">{course.enrollments} enrollments</span>
                        </div>
                        <Progress value={course.successRate || 0} className="h-2" />
                        <div className="text-xs text-slate-500">
                          {Math.round(course.successRate || 0)}% pipeline success rate
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Actions */}
              <div className="flex gap-4">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Activity className="w-4 h-4 mr-2" />
                  View Detailed Logs
                </Button>
                <Button variant="outline">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Export Report
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
