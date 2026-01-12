import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { TrendingUp, Users, BookOpen } from "lucide-react";

interface EnrollmentTrend {
  month: string;
  enrollments: number;
}

interface CoursePerformance {
  name: string;
  students: number;
  completion: number;
}

interface DashboardStats {
  totalStudents?: number;
  totalCourses?: number;
  avgCompletion?: number;
  [key: string]: any;
}

export function PlatformAnalytics() {
  const { data: enrollmentTrends } = useQuery<EnrollmentTrend[]>({
    queryKey: ["/api/admin/enrollment-trends"],
  });

  const { data: coursePerformance } = useQuery<CoursePerformance[]>({
    queryKey: ["/api/admin/course-performance"],
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/admin/dashboard"],
  });

  const mockEnrollmentTrend = enrollmentTrends.length > 0 ? enrollmentTrends : [
    { month: "Jan", enrollments: 120 },
    { month: "Feb", enrollments: 145 },
    { month: "Mar", enrollments: 168 },
    { month: "Apr", enrollments: 195 },
  ];

  const mockCourseStats = coursePerformance.length > 0 ? coursePerformance : [
    { name: "Course 1", students: 45, completion: 85 },
    { name: "Course 2", students: 38, completion: 72 },
    { name: "Course 3", students: 52, completion: 91 },
  ];

  return (
    <div className="space-y-6" data-testid="platform-analytics">
      {/* Quick Stats */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card data-testid="stat-students">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Students
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalStudents || 0}</p>
            <p className="text-xs text-green-600 mt-1">+12% this month</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-courses">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Active Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{stats.totalCourses || 0}</p>
            <p className="text-xs text-muted-foreground mt-1">platform-wide</p>
          </CardContent>
        </Card>

        <Card data-testid="stat-completion">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Avg Completion
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{Math.round(stats.avgCompletion || 0)}%</p>
            <p className="text-xs text-muted-foreground mt-1">across all users</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Enrollment Trends */}
        <Card data-testid="chart-enrollment">
          <CardHeader>
            <CardTitle>Enrollment Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={mockEnrollmentTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="enrollments" stroke="#8b5cf6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Course Performance */}
        <Card data-testid="chart-performance">
          <CardHeader>
            <CardTitle>Course Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockCourseStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="completion" fill="#3b82f6" />
                <Bar dataKey="students" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
