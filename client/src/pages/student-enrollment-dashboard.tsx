import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { Sidebar } from "@/components/layout/sidebar";
import ModernNavigation from "@/components/layout/modern-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { BookOpen, Calendar, CheckCircle, Award, TrendingUp } from "lucide-react";
import { StudentEnrollmentData } from "@/types/dashboard";

export default function StudentEnrollmentDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [, navigate] = useLocation();

  const { data: coursesData, isLoading: coursesLoading } = useQuery<StudentEnrollmentData>({
    queryKey: ["/api/user/courses"],
    enabled: !!user,
  });

  const { data: studyPlanInfo = {} } = useQuery({
    queryKey: ["/api/study-plans"],
    enabled: !!user,
  });

  const { data: assignmentsData } = useQuery<StudentEnrollmentData>({
    queryKey: ["/api/assignments/upcoming"],
    enabled: !!user,
  });

  // Type the data and add guards
  const enrolledCourses = Array.isArray(coursesData?.enrolledCourses) 
    ? coursesData.enrolledCourses 
    : [];

  const upcomingAssignments = Array.isArray(assignmentsData?.upcomingAssignments) 
    ? assignmentsData.upcomingAssignments 
    : [];

  const completedCount = upcomingAssignments.filter((a: any) => a.completed).length;
  const totalAssignments = upcomingAssignments.length;
  const progressPercentage = totalAssignments > 0 ? Math.round((completedCount / totalAssignments) * 100) : 0;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ModernNavigation pageTitle={language === 'tr' ? "Öğrenci Kontrol Paneli" : "Student Dashboard"} currentPage="student" />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="py-8 px-4 sm:px-6 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {language === 'tr' ? "Öğrenme Yolculuğunuz" : "Your Learning Journey"}
                  </h1>
                  <p className="text-slate-600 mt-2">
                    {language === 'tr' ? "Kurslarınız, çalışma planları ve ilerlemenizi yönetin" : "Manage your courses, study plans, and progress"}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/study-plan")}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  {language === 'tr' ? "Çalışma Planı" : "View Study Plan"}
                </Button>
              </div>

              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {language === 'tr' ? "Genel İlerleme" : "Overall Progress"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-sm text-slate-600">{language === 'tr' ? "Kayıtlı Kurslar" : "Enrolled Courses"}</p>
                      <p className="text-3xl font-bold text-slate-900">{enrolledCourses.length}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">{language === 'tr' ? "Tamamlanan Görevler" : "Completed Tasks"}</p>
                      <p className="text-3xl font-bold text-green-600">{completedCount}/{totalAssignments}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">{language === 'tr' ? "Tamamlanma Oranı" : "Completion Rate"}</p>
                      <p className="text-3xl font-bold text-blue-600">{progressPercentage}%</p>
                    </div>
                  </div>
                  <Progress value={progressPercentage} className="h-3" />
                </CardContent>
              </Card>

              {/* Enrolled Courses */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {language === 'tr' ? "Kayıtlı Kurslar" : "Enrolled Courses"}
                  </CardTitle>
                  <CardDescription>
                    {language === 'tr' ? "Kurslarınız ve kişiselleştirilmiş öğrenme yolları" : "Your courses with personalized learning paths"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {coursesLoading ? (
                      <p>{language === 'tr' ? "Yükleniyor..." : "Loading..."}</p>
                    ) : enrolledCourses.length === 0 ? (
                      <p className="text-slate-600 text-center py-8">
                        {language === 'tr' ? "Henüz kurs yok. Kurs kataloguna gidin!" : "No courses yet. Explore the course catalog!"}
                      </p>
                    ) : (
                      enrolledCourses.map((course: any) => (
                        <div key={course.courseId} className="p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">{course.title}</h3>
                              <p className="text-sm text-slate-600 mt-1">{course.description}</p>
                              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  <span>{course.progress || 0}% Complete</span>
                                </div>
                                {course.enrolledAt && (
                                  <div className="flex items-center gap-1">
                                    <Calendar className="w-3 h-3" />
                                    <span>Enrolled {new Date(course.enrolledAt).toLocaleDateString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <Badge>{language === 'tr' ? "Devam Ediyor" : "In Progress"}</Badge>
                          </div>
                          <Progress value={course.progress || 0} className="h-2 mt-4" />
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Upcoming Tasks */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {language === 'tr' ? "Yaklaşan Görevler" : "Upcoming Tasks"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingAssignments.slice(0, 5).map((task: any) => (
                      <div key={task.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-slate-900">{task.title}</p>
                          <p className="text-xs text-slate-600 mt-1">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        </div>
                        {task.completed ? (
                          <Badge className="bg-green-100 text-green-800">{language === 'tr' ? "Tamamlandı" : "Done"}</Badge>
                        ) : (
                          <Badge variant="outline">{task.points || 0} pts</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Achievements */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="w-5 h-5" />
                    {language === 'tr' ? "Başarılar" : "Achievements"}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 text-center py-8">
                    {language === 'tr' ? "Görevler tamamlayarak rozetler kazanın!" : "Complete tasks to earn badges!"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
