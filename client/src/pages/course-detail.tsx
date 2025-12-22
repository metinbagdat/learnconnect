import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import { ModuleTree } from "@/components/modules/module-tree";
import { EnhancedAIAssistant } from "@/components/ui/enhanced-ai-assistant";
import { SkillChallengeManager } from "@/components/challenges/skill-challenge-manager";
import { Course, Module, Lesson } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { useSkillChallenge } from "@/hooks/use-skill-challenge";
import { Book, CheckCircle, Clock, FileText, LucideIcon, Play, User, Brain, TreePine, Globe, DollarSign, Calendar, Target, ChevronRight, ChevronLeft, Bookmark } from "lucide-react";
import { Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { LanguageSwitcher } from "@/components/ui/language-switcher";
import { getLocalizedField } from "@/lib/language-utils";

export default function CourseDetail() {
  const { courseId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { t, language } = useLanguage();
  const { triggerSkillChallenge } = useSkillChallenge();
  const [selectedLessonId, setSelectedLessonId] = useState<number | null>(null);
  const [lessonContent, setLessonContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState<boolean>(false);
  const [lessonMetadata, setLessonMetadata] = useState<any>(null);
  const [contentCache, setContentCache] = useState<Record<number, { content: string; metadata: any }>>({});
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  
  // Fetch course details
  const { data: course, isLoading: courseLoading } = useQuery<Course>({
    queryKey: [`/api/courses/${courseId}`],
  });
  
  // Fetch course modules
  const { data: modules = [], isLoading: modulesLoading } = useQuery<Module[]>({
    queryKey: [`/api/courses/${courseId}/modules`],
    enabled: !!courseId,
  });
  
  // State to store lessons for each module
  const [moduleIdToLessons, setModuleIdToLessons] = useState<Record<number, Lesson[]>>({});
  
  // Load lessons for a module when it's expanded
  const loadLessonsForModule = async (moduleId: number) => {
    if (moduleIdToLessons[moduleId]) {
      return; // Lessons already loaded
    }
    
    try {
      const lessons = await apiRequest("GET", `/api/modules/${moduleId}/lessons`);
      const lessonsData = await lessons.json();
      setModuleIdToLessons(prev => ({
        ...prev,
        [moduleId]: lessonsData
      }));
    } catch (error) {
      console.error("Failed to fetch lessons:", error);
      toast({
        title: "Error",
        description: "Failed to load lessons. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Generate lesson content when a lesson is clicked with caching
  const generateLessonContent = async (lessonId: number, lessonTitle: string, moduleTitle: string) => {
    // Check cache first
    if (contentCache[lessonId]) {
      setSelectedLessonId(lessonId);
      setLessonContent(contentCache[lessonId].content);
      setLessonMetadata(contentCache[lessonId].metadata);
      return;
    }
    
    if (selectedLessonId === lessonId && lessonContent) {
      return; // Content already loaded
    }
    
    setSelectedLessonId(lessonId);
    setLoadingContent(true);
    setLessonContent(null);
    setLessonMetadata(null);
    
    try {
      const response = await apiRequest("POST", "/api/ai/generate-lesson-content", {
        lessonId,
        lessonTitle,
        moduleTitle,
        courseTitle: course?.title,
        language // Pass current language
      });
      
      const data = await response.json();
      setLessonContent(data.content);
      setLessonMetadata(data.metadata);
      
      // Cache the content
      setContentCache(prev => ({
        ...prev,
        [lessonId]: { content: data.content, metadata: data.metadata }
      }));
    } catch (error) {
      console.error("Failed to generate lesson content:", error);
      toast({
        title: language === 'tr' ? "Hata" : "Error",
        description: language === 'tr' ? "Ders içeriği oluşturulamadı. Lütfen tekrar deneyin." : "Failed to generate lesson content. Please try again.",
        variant: "destructive",
      });
      const errorContent = language === 'tr' 
        ? "# İçerik Oluşturma Başarısız\n\nBu dersin içeriğini oluşturmakta sorun yaşanıyor. Lütfen daha sonra tekrar deneyin."
        : "# Content Generation Failed\n\nWe're having trouble generating the content for this lesson. Please try again later.";
      setLessonContent(errorContent);
    } finally {
      setLoadingContent(false);
    }
  };
  
  // Update progress when a lesson is completed
  const markLessonAsCompleted = async () => {
    if (!user || !course || !selectedLessonId) return;
    
    try {
      // Update lesson progress (simplified implementation)
      // In a real implementation, call the API to update lesson progress
      // await apiRequest("POST", `/api/user/lessons/${selectedLessonId}/progress`, { progress: 100 });
      
      // Show success toast
      toast({
        title: "Progress updated",
        description: "Your progress has been saved.",
      });
      
      // 30% chance to trigger a skill challenge after completing a lesson
      const triggerChance = Math.random();
      if (triggerChance < 0.3) {
        // Small delay to show the challenge after the progress toast
        setTimeout(() => {
          triggerSkillChallenge("skill");
        }, 1500);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update progress. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  // Auto-load first module's lessons on mount
  useEffect(() => {
    if (modules.length > 0 && !expandedModule) {
      const firstModule = modules[0];
      setExpandedModule(`module-${firstModule.id}`);
      loadLessonsForModule(firstModule.id);
    }
  }, [modules.length, expandedModule, loadLessonsForModule]);
  
  if (courseLoading || modulesLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!course) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">{t('courseNotFound')}</h1>
          <p className="mt-2 text-muted-foreground">{t('courseNotFoundDescription')}</p>
          <Button className="mt-4" onClick={() => window.history.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  // Get localized course content
  const courseTitle = getLocalizedField(course, 'title', language);
  const courseDescription = getLocalizedField(course, 'description', language);

  // Calculate daily time recommendations based on course duration
  const getDailyTimeRecommendation = (totalHours: number) => {
    if (totalHours <= 10) return { days: 14, hoursPerDay: 1 };
    if (totalHours <= 30) return { days: 30, hoursPerDay: 1 };
    if (totalHours <= 60) return { days: 30, hoursPerDay: 2 };
    return { days: 60, hoursPerDay: 2 };
  };

  const recommendation = course.durationHours ? getDailyTimeRecommendation(course.durationHours) : null;
  
  return (
    <div className="flex h-screen overflow-hidden bg-neutral-50">
      {/* Sidebar - Desktop */}
      <div className="hidden md:flex md:flex-shrink-0">
        <Sidebar />
      </div>
      
      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Mobile Header */}
        <div className="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-white border-b border-neutral-100 flex items-center justify-between px-4">
          <div className="flex items-center">
            <svg className="w-8 h-8 text-primary" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838l-2.727 1.17 5.727 2.45a1 1 0 00.788 0l7-3a1 1 0 000-1.841l-7-3z"></path>
              <path d="M2.492 8.825l-.787.335c-.483.207-.795.712-.551 1.168.192.357.667.511 1.033.351l1.298-.558-.992-1.296zm10.665 2.31l-7.673 3.291c-.481.206-.796.71-.551 1.168.192.357.667.511 1.033.351l8.235-3.529c.392-.168.446-.707.098-.99-.27-.22-.67-.235-.968-.106l-.174.075v-.26z"></path>
            </svg>
            <span className="ml-2 text-xl font-semibold text-neutral-900">EduLearn</span>
          </div>
        </div>
        
        {/* Main Content */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none pb-16 md:pb-0">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {/* Course Header */}
              <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
                <div className="relative h-64 bg-gradient-to-r from-primary to-primary-600">
                  {course.imageUrl && (
                    <img 
                      src={course.imageUrl} 
                      alt={courseTitle}
                      className="absolute inset-0 w-full h-full object-cover opacity-30"
                    />
                  )}
                  <div className="absolute inset-0 flex items-center px-6 py-4 bg-gradient-to-r from-black/40 to-transparent">
                    <div className="max-w-4xl">
                      <h1 className="text-3xl md:text-4xl font-bold text-white mb-3" data-testid="course-title">{courseTitle}</h1>
                      <p className="text-white/90 text-base md:text-lg max-w-2xl" data-testid="course-description">{courseDescription}</p>
                      
                      <div className="flex flex-wrap gap-4 mt-4">
                        <div className="flex items-center text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                          <Clock className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">{course.durationHours} {language === 'tr' ? 'saat' : 'hours'}</span>
                        </div>
                        <div className="flex items-center text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                          <Book className="h-4 w-4 mr-1" />
                          <span className="text-sm font-medium">{course.moduleCount} {language === 'tr' ? 'modül' : 'modules'}</span>
                        </div>
                        {course.price && parseFloat(course.price.toString()) > 0 && (
                          <div className="flex items-center text-white bg-white/20 px-3 py-1 rounded-full backdrop-blur-sm">
                            <DollarSign className="h-4 w-4 mr-1" />
                            <span className="text-sm font-medium">${course.price}</span>
                          </div>
                        )}
                        {course.level && (
                          <Badge className="bg-white/20 text-white border-white/30" data-testid="course-level">
                            {course.level}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Study Planning Section */}
                {recommendation && (
                  <div className="px-6 py-4 bg-blue-50 border-t border-blue-100">
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0 mt-1">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-semibold text-blue-900 mb-1">
                          {language === 'tr' ? 'Önerilen Çalışma Planı' : 'Recommended Study Plan'}
                        </h3>
                        <p className="text-sm text-blue-700">
                          {language === 'tr' 
                            ? `Bu kursu ${recommendation.days} gün içinde tamamlamak için günde ${recommendation.hoursPerDay} saat çalışmanız önerilir.`
                            : `We recommend studying ${recommendation.hoursPerDay} ${recommendation.hoursPerDay === 1 ? 'hour' : 'hours'} per day to complete this course in ${recommendation.days} days.`
                          }
                        </p>
                        <div className="mt-2 flex items-center gap-4 text-xs text-blue-600">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{recommendation.days} {language === 'tr' ? 'gün' : 'days'}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            <span>{recommendation.hoursPerDay} {language === 'tr' ? 'saat/gün' : 'hours/day'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* AI-Enhanced Module Tree with Personalized Content */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <TreePine className="h-6 w-6 text-green-600" />
                    <h2 className="text-2xl font-bold">{t('course.learningPath') || 'Course Learning Path'}</h2>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                      <Brain className="h-3 w-3 mr-1" />
                      {t('course.aiPersonalized') || 'AI-Personalized'}
                    </Badge>
                  </div>
                  <LanguageSwitcher />
                </div>
                
                {user && courseId && (
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    <div className="lg:col-span-3">
                      <ModuleTree 
                        courseId={parseInt(courseId!)} 
                        userId={user.id}
                        onLessonSelect={(lesson: any) => {
                          // Find the module for this lesson to get module title
                          const module = modules.find(m => 
                            m.id && moduleIdToLessons[m.id]?.some((l: Lesson) => l.id === lesson.id)
                          );
                          generateLessonContent(lesson.id, lesson.title, module?.title || '');
                        }}
                      />
                    </div>
                    <div className="lg:col-span-1 space-y-6">
                      <SkillChallengeManager
                        courseId={parseInt(courseId!)}
                        category={course?.category}
                        onChallengeComplete={(points: number, xp: number) => {
                          toast({
                            title: "Challenge completed!",
                            description: `Earned ${points} points and ${xp} XP`,
                          });
                          queryClient.invalidateQueries({ queryKey: ['/api/user/level'] });
                        }}
                      />
                      
                      {/* AI Study Companion for this course */}
                      <EnhancedAIAssistant 
                        courseId={parseInt(courseId!)}
                        className="h-96"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Traditional Module View - Always visible alongside AI modules */}
              <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left side - Traditional Module List */}
                <div className="lg:col-span-1">
                  <div className="bg-white rounded-lg shadow-sm">
                    <div className="p-4 border-b border-neutral-100">
                      <h2 className="text-lg font-semibold">
                        {language === 'tr' ? 'Geleneksel Modül Listesi' : 'Traditional Module View'}
                      </h2>
                      <p className="text-sm text-gray-600 mt-1">
                        {language === 'tr' ? 'Standart kurs yapısı - AI kişiselleştirme olmadan' : 'Standard course structure without AI personalization'}
                      </p>
                    </div>
                    <div className="p-2">
                      <Accordion 
                        type="single" 
                        collapsible
                        value={expandedModule || ''}
                        onValueChange={(value: string) => {
                          setExpandedModule(value);
                          // Extract module ID from the value and load lessons
                          const moduleId = parseInt(value?.replace('module-', '') || '0');
                          if (moduleId > 0) loadLessonsForModule(moduleId);
                        }}
                      >
                        {modules.map((module) => (
                          <AccordionItem key={module.id} value={`module-${module.id}`}>
                            <AccordionTrigger className="px-3 py-2 hover:bg-neutral-50 rounded-md">
                              <div className="flex items-start">
                                <div className="flex-1 text-left">
                                  <span className="font-medium text-neutral-900">{module.title}</span>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-3">
                              {moduleIdToLessons[module.id] ? (
                                <ul className="space-y-1 py-1">
                                  {moduleIdToLessons[module.id].map((lesson) => (
                                    <li key={lesson.id}>
                                      <button
                                        onClick={() => generateLessonContent(lesson.id, lesson.title, module.title)}
                                        className={`flex items-center w-full px-3 py-2 text-sm rounded-md ${
                                          selectedLessonId === lesson.id
                                            ? "bg-primary/10 text-primary font-medium"
                                            : "text-neutral-700 hover:bg-neutral-100"
                                        }`}
                                      >
                                        <FileText className="h-4 w-4 mr-2 flex-shrink-0" />
                                        <span className="text-left">{lesson.title}</span>
                                      </button>
                                    </li>
                                  ))}
                                </ul>
                              ) : (
                                <div className="py-2 px-3 text-center">
                                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-neutral-400" />
                                  <span className="text-sm text-neutral-500 mt-1">Loading lessons...</span>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  </div>
                </div>
                
                {/* Right side - Lesson Content */}
                <div className="lg:col-span-2">
                  <div className="bg-white rounded-lg shadow-sm h-full">
                    <div className="p-6">
                      {selectedLessonId ? (
                        loadingContent ? (
                          <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                              <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary mb-4" />
                              <h3 className="text-lg font-medium text-neutral-900">Generating content...</h3>
                              <p className="text-neutral-500 mt-1">Please wait while we prepare the lesson content.</p>
                            </div>
                          </div>
                        ) : lessonContent ? (
                          <div className="space-y-6">
                            {/* Lesson Metadata */}
                            {lessonMetadata && (
                              <div className="flex flex-wrap gap-4 pb-4 border-b border-neutral-200">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4 text-neutral-500" />
                                  <span className="text-sm text-neutral-600">
                                    {lessonMetadata.estimatedReadingTime} {language === 'tr' ? 'dk' : 'min'} {language === 'tr' ? 'okuma' : 'read'}
                                  </span>
                                </div>
                                <div className="flex items-center gap-2">
                                  <FileText className="h-4 w-4 text-neutral-500" />
                                  <span className="text-sm text-neutral-600">
                                    {lessonMetadata.wordCount} {language === 'tr' ? 'kelime' : 'words'}
                                  </span>
                                </div>
                              </div>
                            )}
                            
                            {/* Lesson Content */}
                            <div className="prose prose-neutral max-w-none dark:prose-invert">
                              <ReactMarkdown>
                                {lessonContent}
                              </ReactMarkdown>
                            </div>
                            
                            {/* Action Buttons */}
                            <div className="mt-8 pt-6 border-t border-neutral-200 flex flex-wrap gap-3">
                              <Button onClick={markLessonAsCompleted} className="flex items-center">
                                <CheckCircle className="mr-2 h-4 w-4" />
                                {language === 'tr' ? 'Tamamlandı İşaretle' : 'Mark as Completed'}
                              </Button>
                              <Button variant="outline" className="flex items-center">
                                <Bookmark className="mr-2 h-4 w-4" />
                                {language === 'tr' ? 'Kaydet' : 'Bookmark'}
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center h-64">
                            <div className="text-center">
                              <FileText className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                              <h3 className="text-lg font-medium text-neutral-900">
                                {language === 'tr' ? 'İçerik yükleniyor...' : 'Loading content...'}
                              </h3>
                              <p className="text-neutral-500 mt-1">
                                {language === 'tr' ? 'Lütfen biraz bekleyin.' : 'Please wait a moment.'}
                              </p>
                            </div>
                          </div>
                        )
                      ) : (
                        <div className="flex items-center justify-center h-64">
                          <div className="text-center">
                            <FileText className="h-12 w-12 mx-auto text-neutral-300 mb-4" />
                            <h3 className="text-lg font-medium text-neutral-900">
                              {language === 'tr' ? 'Ders seçilmedi' : 'No lesson selected'}
                            </h3>
                            <p className="text-neutral-500 mt-1">
                              {language === 'tr' ? 'Öğrenmeye başlamak için listeden bir ders seçin.' : 'Select a lesson from the list to start learning.'}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden">
        <MobileNav />
      </div>
    </div>
  );
}