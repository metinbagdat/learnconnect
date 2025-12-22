import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, BookOpen, Brain, Clock, Star, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/consolidated-language-context";

interface ModuleTreeProps {
  courseId: number;
  userId: number;
  onLessonSelect?: (lesson: AIEnhancedLesson) => void;
}

interface AIEnhancedLesson {
  id: number;
  title: string;
  description: string;
  content: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number;
  progress: number;
  aiContext: {
    personalizedIntro: string;
    learningObjectives: string[];
    adaptedContent: string;
    practiceExercises: string[];
    nextSteps: string[];
    difficultyReason: string;
  };
  tags: string[];
}

interface AIEnhancedModule {
  id: number;
  title: string;
  description: string;
  progress: number;
  lessons: AIEnhancedLesson[];
  aiContext: {
    moduleOverview: string;
    learningPath: string;
    personalizedTips: string[];
    prerequisiteCheck: string;
  };
}

export function ModuleTree({ courseId, userId, onLessonSelect }: ModuleTreeProps) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set());
  const [selectedLesson, setSelectedLesson] = useState<AIEnhancedLesson | null>(null);
  const [, navigate] = useLocation();
  const { t, language } = useLanguage();

  const { data: modules, isLoading } = useQuery<AIEnhancedModule[]>({
    queryKey: ['/api/courses', courseId, 'ai-modules', userId, language],
    queryFn: async () => {
      const response = await fetch(`/api/courses/${courseId}/ai-modules/${userId}?lang=${language}`);
      if (!response.ok) throw new Error('Failed to fetch AI modules');
      return response.json();
    },
    enabled: !!courseId && !!userId,
  });

  const toggleModule = (moduleId: number) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Module Tree */}
      <div className="lg:col-span-2 space-y-4">
        <div className="flex items-center gap-2 mb-6">
          <Brain className="h-6 w-6 text-blue-600" />
          <h2 className="text-2xl font-bold">{t('aiPoweredModules') || 'AI-Powered Modules'}</h2>
          <Badge variant="secondary" className="bg-blue-100 text-blue-800">
            {t('personalizedContent') || 'Personalized Content'}
          </Badge>
        </div>

        {modules && modules.length > 0 ? modules.map((module) => (
          <Card key={module.id} className="border-l-4 border-l-blue-500">
            <Collapsible
              open={expandedModules.has(module.id)}
              onOpenChange={() => toggleModule(module.id)}
            >
              <CollapsibleTrigger asChild>
                <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedModules.has(module.id) ? (
                        <ChevronDown className="h-5 w-5 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-gray-500" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{module.title}</CardTitle>
                        <CardDescription>{module.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">{module.progress}% {t('complete')}</div>
                        <Progress value={module.progress} className="w-20 h-2" />
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <CardContent className="pt-0">
                  {/* AI Module Context */}
                  {module.aiContext && (
                    <div className="mb-4 p-4 bg-blue-50 rounded-lg border-l-4 border-l-blue-400">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">AI Learning Assistant</span>
                      </div>
                      <p className="text-sm text-blue-700 mb-2">
                        {module.aiContext.moduleOverview || "This module provides comprehensive learning content tailored to your progress."}
                      </p>
                      <p className="text-sm text-blue-600 italic">
                        {module.aiContext.learningPath || "Follow the structured lessons to master the concepts progressively."}
                      </p>
                      
                      {module.aiContext.prerequisiteCheck && (
                        <div className="mt-3 p-2 bg-yellow-50 rounded border-l-2 border-yellow-400">
                          <div className="flex items-center gap-1">
                            <Target className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs font-medium text-yellow-800">Prerequisites Check</span>
                          </div>
                          <p className="text-xs text-yellow-700">{module.aiContext.prerequisiteCheck}</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Lessons */}
                  <div className="space-y-3">
                    {module.lessons && module.lessons.length > 0 ? module.lessons.map((lesson, index) => (
                      <div
                        key={lesson.id}
                        className={cn(
                          "p-4 rounded-lg border-2 border-gray-200 hover:border-blue-300 transition-all cursor-pointer",
                          selectedLesson?.id === lesson.id && "border-blue-500 bg-blue-50"
                        )}
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setSelectedLesson(lesson);
                          // Call callback for in-page viewing if provided
                          if (onLessonSelect) {
                            onLessonSelect(lesson);
                          }
                          // Still allow navigation to separate page
                          // User can choose by clicking the "View Lesson" button in the detail panel
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600">
                              {index + 1}
                            </div>
                            <div>
                              <h4 className="font-medium">{lesson.title}</h4>
                              <p className="text-sm text-gray-600">{lesson.description}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getDifficultyColor(lesson.difficulty)}>
                              {lesson.difficulty}
                            </Badge>
                            <div className="flex items-center gap-1 text-sm text-gray-500">
                              <Clock className="h-3 w-3" />
                              {lesson.estimatedTime}m
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between">
                          <Progress 
                            value={lesson.progress} 
                            className="flex-1 mr-4 h-2"
                          />
                          <span className="text-sm font-medium">{lesson.progress}%</span>
                        </div>

                        {/* AI Context Preview */}
                        {lesson.aiContext && (
                          <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                            <div className="flex items-center gap-1 mb-1">
                              <Zap className="h-3 w-3 text-purple-500" />
                              <span className="font-medium">{t('aiPersonalization')}</span>
                            </div>
                            <p className="truncate">{lesson.aiContext.personalizedIntro || t('personalizedContentAvailable')}</p>
                          </div>
                        )}
                      </div>
                    )) : (
                      <div className="text-center py-8 text-gray-500">
                        <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-sm">No lessons available for this module yet.</p>
                        <p className="text-xs mt-1">Content will be generated automatically.</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </Card>
        )) : (
          <div className="text-center py-12">
            <Brain className="h-16 w-16 mx-auto text-gray-300 mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('noAIModulesAvailable') || 'No AI Modules Available'}</h3>
            <p className="text-gray-600 mb-4">
              {t('noAIModulesDescription') || 'This course doesn\'t have AI-enhanced modules yet. Content will be generated automatically as you progress.'}
            </p>
            <Button 
              variant="outline" 
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                window.location.reload();
              }}
            >
              {t('refreshContent') || 'Refresh Content'}
            </Button>
          </div>
        )}
      </div>

      {/* AI-Enhanced Lesson Detail Panel */}
      <div className="lg:col-span-1">
        {selectedLesson ? (
          <Card className="sticky top-4">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                <CardTitle className="text-lg">{selectedLesson.title}</CardTitle>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getDifficultyColor(selectedLesson.difficulty)}>
                  {selectedLesson.difficulty}
                </Badge>
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-3 w-3" />
                  {selectedLesson.estimatedTime} minutes
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* AI Personalized Introduction */}
              {selectedLesson.aiContext && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">{t('personalizedForYou')}</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    {selectedLesson.aiContext.personalizedIntro || "This lesson has been customized for your learning level."}
                  </p>
                  <p className="text-xs text-gray-600 mt-2 italic">
                    {selectedLesson.aiContext.difficultyReason || "Content difficulty adjusted to match your progress."}
                  </p>
                </div>
              )}

              {/* Learning Objectives */}
              <div>
                <h4 className="font-medium mb-2 flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-600" />
{t('learningObjectives')}
                </h4>
                <ul className="space-y-1">
                  {selectedLesson.aiContext?.learningObjectives?.map((objective, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <Star className="h-3 w-3 text-yellow-500 mt-0.5 flex-shrink-0" />
                      {objective}
                    </li>
                  )) || (
                    <li className="text-sm text-gray-500">Learning objectives will be generated automatically.</li>
                  )}
                </ul>
              </div>

              {/* Adapted Content Preview */}
              <div>
                <h4 className="font-medium mb-2">{t('aiAdaptedContent')}</h4>
                <div className="p-3 bg-gray-50 rounded text-sm text-gray-700">
                  {selectedLesson.aiContext?.adaptedContent 
                    ? `${selectedLesson.aiContext.adaptedContent.substring(0, 200)}...`
                    : "Content will be adapted to your learning style and level."}
                </div>
              </div>

              {/* Practice Exercises */}
              <div>
                <h4 className="font-medium mb-2">Recommended Practice</h4>
                <ul className="space-y-1">
                  {selectedLesson.aiContext?.practiceExercises?.slice(0, 3).map((exercise, index) => (
                    <li key={index} className="text-sm text-gray-600">• {exercise}</li>
                  )) || (
                    <li className="text-sm text-gray-500">• Practice exercises will be generated based on your progress</li>
                  )}
                </ul>
              </div>

              {/* Action Button */}
              <Button className="w-full" onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                e.stopPropagation();
                navigate(`/lessons/${selectedLesson.id}`);
              }}>
                Start Learning
              </Button>

              {/* Next Steps */}
              <div className="text-xs text-gray-500">
                <p className="font-medium mb-1">Next recommended steps:</p>
                {selectedLesson.aiContext?.nextSteps?.slice(0, 2).map((step, index) => (
                  <p key={index}>• {step}</p>
                )) || (
                  <p>• Complete this lesson to unlock next steps</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="sticky top-4">
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">{t('selectLessonForContent')}</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}