import { useState, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import ModernNavigation from "@/components/layout/modern-navigation";
import { CourseTree } from "@/components/ui/course-tree";
import { ExamCategoryTree } from "@/components/ui/exam-category-tree";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ApiError } from "@/components/error-states/api-error";
import { EmptyState } from "@/components/error-states/empty-state";
import { CourseCardSkeleton } from "@/components/loading-states/enhanced-skeleton";
import { Search, Compass } from "lucide-react";
import { useLocation } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Courses() {
  try {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [, navigate] = useLocation();
    const { toast } = useToast();
    const [searchQuery, setSearchQuery] = useState("");
    const tabsRef = useRef<any>(null);
  
  const [activeTab, setActiveTab] = useState("enrolled");

  const { data: userCoursesTree = [], isLoading: userCoursesLoading, error: userCoursesError, refetch: refetchUserCourses } = useQuery<any[]>({
    queryKey: ["/api/user/courses/tree"],
  });
  
  const { data: allCoursesTree = [], isLoading: allCoursesLoading, error: allCoursesError, refetch: refetchAllCourses } = useQuery<any[]>({
    queryKey: ["/api/courses"],
  });

  const { data: examCategoryData = [], isLoading: examCategoryLoading, error: examCategoryError, refetch: refetchExamCategories } = useQuery<any[]>({
    queryKey: ["/api/courses/by-exam-category"],
  });
  
  const filterCourseTree = (courses: any[], query: string): any[] => {
    if (!query || !courses) return courses || [];
    
    return courses.reduce((acc: any[], course: any) => {
      if (!course) return acc;
      
      const courseTitle = course.title || course.titleEn || course.titleTr || "";
      const courseCategory = course.category || "";
      
      const matchesSearch = 
        String(courseTitle).toLowerCase().includes(query.toLowerCase()) || 
        String(courseCategory).toLowerCase().includes(query.toLowerCase());
      
      const filteredChildren = course.children ? filterCourseTree(course.children, query) : [];
      
      if (matchesSearch || filteredChildren.length > 0) {
        acc.push({
          ...course,
          children: filteredChildren.length > 0 ? filteredChildren : course.children
        });
      }
      
      return acc;
    }, []);
  };
  
  const removeEnrolledCourses = (courses: any[], enrolledTree: any[]): any[] => {
    if (!courses) return [];
    
    const enrolledIds = new Set<number>();
    const collectEnrolledIds = (courses: any[]) => {
      if (!courses) return;
      courses.forEach(course => {
        if (course && course.isEnrolled) {
          enrolledIds.add(course.id);
        }
        if (course && course.children) {
          collectEnrolledIds(course.children);
        }
      });
    };
    collectEnrolledIds(enrolledTree);
    
    return courses.reduce((acc: any[], course: any) => {
      if (!course) return acc;
      
      if (enrolledIds.has(course.id)) {
        return acc;
      }
      
      const filteredChildren = course.children ? removeEnrolledCourses(course.children, enrolledTree) : [];
      
      acc.push({
        ...course,
        children: filteredChildren.length > 0 ? filteredChildren : course.children
      });
      
      return acc;
    }, []);
  };
  
  const filteredUserCourses = filterCourseTree(userCoursesTree, searchQuery);
  const availableCoursesFiltered = removeEnrolledCourses(allCoursesTree, userCoursesTree);
  const filteredAvailableCourses = filterCourseTree(availableCoursesFiltered, searchQuery);
  
  const enrollInCourse = async (courseId: number) => {
    if (!user) return;
    
    try {
      console.log(`[UI] Triggering enrollment pipeline for course ${courseId}`);
      await apiRequest("POST", "/api/pipeline/enroll-and-generate", { courseId });
      toast({
        title: t('enrollmentSuccessful'),
        description: "Study plan and assignments are being generated for you!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/user/courses/tree"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/tree"] });
      queryClient.invalidateQueries({ queryKey: ["/api/courses/by-exam-category"] });
    } catch (error) {
      toast({
        title: t('enrollmentFailed'),
        description: t('enrollmentFailedDescription'),
        variant: "destructive",
      });
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <ModernNavigation pageTitle={t('myCourses')} currentPage="courses" />
      
      <div className="flex flex-1 overflow-hidden bg-neutral-50">
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar />
        </div>
        
        <div className="flex flex-col flex-1 w-0 overflow-hidden">
          <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-neutral-100 flex items-center justify-between px-4">
            <div className="flex items-center">
              <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 5.727 2.45a1 1 0 00.788 0l7-3a1 1 0 000-1.841l-7-3z" />
                <path d="M2.492 8.825l-.787.335c-.483.207-.795.712-.551 1.168.192.357.667.511 1.033.351l1.298-.558-.992-1.296zm10.665 2.31l-7.673 3.291c-.481.206-.796.71-.551 1.168.192.357.667.511 1.033.351l8.235-3.529c.392-.168.446-.707.098-.99-.27-.22-.67-.235-.968-.106l-.174.075v-.26z" />
              </svg>
              <span className="ml-2 text-xl font-semibold text-neutral-900">EduLearn</span>
            </div>
          </div>
          
          <main className="flex-1 relative overflow-y-auto focus:outline-none pb-16 md:pb-0">
            <div className="py-6">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                  <div>
                    <h1 className="text-2xl font-bold text-neutral-900">{t('myCourses')}</h1>
                    <p className="mt-1 text-sm text-neutral-600">
                      Hey {user?.displayName?.split(' ')[0]}! Here are your courses - continue learning, explore new topics, or track your progress.
                    </p>
                  </div>
                  
                  <div className="mt-4 md:mt-0 md:ml-4 flex flex-col sm:flex-row gap-3">
                    <Button 
                      onClick={() => setActiveTab("available")}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-lg px-4 py-2 flex items-center gap-2 whitespace-nowrap"
                      data-testid="button-explore-courses"
                    >
                      <Compass className="h-4 w-4" />
                      {t('exploreCourses')}
                    </Button>
                    <div className="flex items-center relative">
                      <Input 
                        className="md:w-64 pl-10" 
                        placeholder={t('searchPlaceholder')} 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-neutral-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8 mt-8">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList>
                    <TabsTrigger value="enrolled">{t('myCourses')}</TabsTrigger>
                    <TabsTrigger value="available">
                      {t('availableCourses')}
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="enrolled" className="mt-6">
                    {userCoursesError ? (
                      <ApiError 
                        error={userCoursesError}
                        onRetry={refetchUserCourses}
                        type="network"
                        title={t('failedToLoadCourses', 'Failed to load your courses')}
                        description={t('coursesErrorDesc', 'Unable to load your enrolled courses. Please check your connection and try again.')}
                      />
                    ) : userCoursesLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <CourseCardSkeleton key={i} />
                        ))}
                      </div>
                    ) : filteredUserCourses && filteredUserCourses.length === 0 ? (
                      <EmptyState 
                        type={searchQuery ? "search" : "courses"}
                        onAction={() => searchQuery ? setSearchQuery("") : navigate('/courses')}
                      />
                    ) : filteredUserCourses && filteredUserCourses.length > 0 ? (
                      <div className="space-y-6">
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            Your courses are organized in a hierarchical structure. Click to expand and explore sub-courses.
                          </p>
                        </div>
                        <CourseTree courses={filteredUserCourses} />
                      </div>
                    ) : null}
                  </TabsContent>
                  
                  <TabsContent value="available" className="mt-6">
                    {examCategoryError ? (
                      <ApiError 
                        error={examCategoryError}
                        onRetry={refetchExamCategories}
                        type="server"
                        title={t('failedToLoadCourses', 'Failed to load available courses')}
                        description={t('coursesErrorDesc', 'Unable to load available courses. Please try again.')}
                      />
                    ) : examCategoryLoading ? (
                      <div className="space-y-4">
                        {[...Array(3)].map((_, i) => (
                          <CourseCardSkeleton key={i} />
                        ))}
                      </div>
                    ) : examCategoryData && examCategoryData.length > 0 ? (
                      <div className="space-y-6">
                        <div className="mb-4">
                          <p className="text-sm text-muted-foreground">
                            Browse courses organized by exam category (TYT/AYT/LGS) with full curriculum structure. Enroll in any course to begin learning.
                          </p>
                        </div>
                        <ExamCategoryTree 
                          data={examCategoryData} 
                          showEnrollButton
                          onEnroll={enrollInCourse}
                        />
                      </div>
                    ) : (
                      <EmptyState 
                        type={searchQuery ? "search" : "courses"}
                        onAction={() => searchQuery ? setSearchQuery("") : navigate('/courses')}
                      />
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </main>
        </div>
        
        <MobileNav />
      </div>
    </div>
  );
  } catch (error) {
    console.error('Error in Courses page:', error);
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-neutral-900 mb-4">Something went wrong</h1>
          <p className="text-neutral-600">Unable to load courses. Please refresh the page.</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Refresh Page
          </button>
        </div>
      </div>
    );
  }
}
