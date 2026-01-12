import React, { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  Target, 
  Clock, 
  BookOpen, 
  CheckCircle, 
  ArrowRight, 
  TrendingUp, 
  Lightbulb,
  Route,
  Star,
  Activity,
  Zap,
  Award,
  BarChart3,
  MapPin,
  ChevronRight,
  PlayCircle,
  PauseCircle,
  RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";

interface AdaptiveLearningPath {
  id: number;
  title: string;
  description: string;
  goal: string;
  progress: number;
  estimatedDuration: number;
  difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
  currentStep: number;
  totalSteps: number;
  adaptiveRecommendations: {
    nextBestCourse: {
      id: number;
      title: string;
      reason: string;
      confidence: number;
    };
    skillGaps: string[];
    optimizedPath: {
      courseId: number;
      title: string;
      estimatedTime: number;
      priority: 'high' | 'medium' | 'low';
      adaptiveReason: string;
    }[];
    learningStyle: string;
    preferredPace: 'slow' | 'medium' | 'fast';
  };
  steps: {
    id: number;
    courseId: number;
    courseTitle: string;
    order: number;
    completed: boolean;
    progress: number;
    estimatedTime: number;
    adaptiveInsights: {
      difficultyMatch: number;
      prerequisitesMet: boolean;
      timeToComplete: number;
      successProbability: number;
    };
  }[];
  analytics: {
    timeSpent: number;
    averageScores: number;
    completionRate: number;
    learningVelocity: number;
    strongAreas: string[];
    improvementAreas: string[];
  };
}

interface AdaptivePathVisualizationProps {
  pathId: number;
  compact?: boolean;
}

export function AdaptivePathVisualization({ pathId, compact = false }: AdaptivePathVisualizationProps) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'path' | 'analytics' | 'recommendations'>('path');

  // Fetch adaptive learning path data
  const { data: adaptivePath, isLoading } = useQuery<AdaptiveLearningPath>({
    queryKey: ['/api/learning-paths', pathId, 'adaptive', user?.id],
    queryFn: async () => {
      const response = await apiRequest('GET', `/api/learning-paths/${pathId}/adaptive?userId=${user?.id}`);
      return response.json();
    },
    enabled: !!pathId && !!user?.id,
  });

  // Update learning path progress
  const updateProgressMutation = useMutation({
    mutationFn: async ({ stepId, progress }: { stepId: number; progress: number }) => {
      const response = await apiRequest('POST', `/api/learning-paths/${pathId}/steps/${stepId}/progress`, { progress });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-paths', pathId, 'adaptive'] });
      toast({
        title: t('progressUpdated'),
        description: t('learningPathProgressSaved'),
      });
    },
  });

  // Generate adaptive recommendations
  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/learning-paths/${pathId}/generate-recommendations`, {
        userId: user?.id
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/learning-paths', pathId, 'adaptive'] });
      toast({
        title: t('recommendationsUpdated'),
        description: t('adaptiveRecommendationsGenerated'),
      });
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!adaptivePath) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <Route className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">{t('pathNotFound')}</h3>
          <p className="text-gray-500">{t('pathNotFoundDescription')}</p>
        </CardContent>
      </Card>
    );
  }

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-200 bg-red-50';
      case 'medium': return 'border-yellow-200 bg-yellow-50';
      case 'low': return 'border-green-200 bg-green-50';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const renderPathVisualization = () => (
    <div className="space-y-6">
      {/* Path Overview */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                {adaptivePath.title}
              </CardTitle>
              <p className="text-gray-600 mt-1">{adaptivePath.description}</p>
            </div>
            <div className="text-right">
              <Badge className={getDifficultyColor(adaptivePath.difficultyLevel)}>
                {t(adaptivePath.difficultyLevel)}
              </Badge>
              <div className="text-sm text-gray-500 mt-1">
                {adaptivePath.currentStep} / {adaptivePath.totalSteps} {t('steps')}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>{t('overallProgress')}</span>
                <span>{adaptivePath.progress}%</span>
              </div>
              <Progress value={adaptivePath.progress} className="h-2" />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{adaptivePath.estimatedDuration} {t('hours')}</span>
              </div>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{adaptivePath.goal}</span>
              </div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-sm">{adaptivePath.analytics.learningVelocity}x {t('pace')}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Interactive Path Steps */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Route className="h-5 w-5" />
          {t('learningPathSteps')}
        </h3>
        
        <div className="space-y-3">
          {adaptivePath.steps.map((step, index) => (
            <Card 
              key={step.id}
              className={cn(
                "cursor-pointer transition-all hover:shadow-md",
                step.completed ? "border-green-200 bg-green-50" : "border-gray-200",
                selectedStep === step.id ? "ring-2 ring-blue-500" : ""
              )}
              onClick={() => setSelectedStep(selectedStep === step.id ? null : step.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                      step.completed 
                        ? "bg-green-500 text-white" 
                        : index === adaptivePath.currentStep - 1
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    )}>
                      {step.completed ? <CheckCircle className="h-4 w-4" /> : step.order}
                    </div>
                    
                    <div>
                      <h4 className="font-medium">{step.courseTitle}</h4>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>{step.estimatedTime} {t('minutes')}</span>
                        <span>{step.progress}% {t('complete')}</span>
                        <Badge variant="outline" className="text-xs">
                          {Math.round(step.adaptiveInsights.successProbability * 100)}% {t('successRate')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {!step.completed && (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          // Navigate to course
                          window.location.href = `/courses/${step.courseId}`;
                        }}
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        {t('start')}
                      </Button>
                    )}
                    <ChevronRight className={cn(
                      "h-4 w-4 transition-transform",
                      selectedStep === step.id ? "rotate-90" : ""
                    )} />
                  </div>
                </div>
                
                {/* Expanded Step Details */}
                {selectedStep === step.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">{t('difficultyMatch')}:</span>
                        <div className="flex items-center gap-2">
                          <Progress value={step.adaptiveInsights.difficultyMatch * 100} className="h-2 flex-1" />
                          <span>{Math.round(step.adaptiveInsights.difficultyMatch * 100)}%</span>
                        </div>
                      </div>
                      <div>
                        <span className="font-medium">{t('timeEstimate')}:</span>
                        <span className="ml-2">{step.adaptiveInsights.timeToComplete} {t('hours')}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle className={cn(
                        "h-4 w-4",
                        step.adaptiveInsights.prerequisitesMet ? "text-green-500" : "text-red-500"
                      )} />
                      <span>
                        {step.adaptiveInsights.prerequisitesMet 
                          ? t('prerequisitesCompleted') 
                          : t('prerequisitesIncomplete')
                        }
                      </span>
                    </div>
                    
                    {!step.completed && (
                      <div className="flex items-center gap-2">
                        <Button 
                          size="sm"
                          onClick={() => updateProgressMutation.mutate({ stepId: step.id, progress: 100 })}
                          disabled={updateProgressMutation.isPending}
                        >
                          {updateProgressMutation.isPending ? (
                            <RefreshCw className="h-4 w-4 animate-spin mr-1" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-1" />
                          )}
                          {t('markComplete')}
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );

  const renderAnalytics = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            {t('learningAnalytics')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{adaptivePath.analytics.timeSpent}h</div>
              <p className="text-sm text-gray-500">{t('timeSpent')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{adaptivePath.analytics.averageScores}%</div>
              <p className="text-sm text-gray-500">{t('averageScore')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{adaptivePath.analytics.completionRate}%</div>
              <p className="text-sm text-gray-500">{t('completionRate')}</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{adaptivePath.analytics.learningVelocity}x</div>
              <p className="text-sm text-gray-500">{t('learningVelocity')}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-600">
              <Star className="h-5 w-5" />
              {t('strongAreas')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adaptivePath.analytics.strongAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <Target className="h-5 w-5" />
              {t('improvementAreas')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {adaptivePath.analytics.improvementAreas.map((area, index) => (
                <div key={index} className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <span className="text-sm">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderRecommendations = () => (
    <div className="space-y-6">
      {/* Next Best Course */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-green-600" />
            {t('recommendedNextCourse')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium">{adaptivePath.adaptiveRecommendations.nextBestCourse.title}</h4>
              <p className="text-sm text-gray-600 mt-1">
                {adaptivePath.adaptiveRecommendations.nextBestCourse.reason}
              </p>
              <Badge variant="outline" className="mt-2">
                {Math.round(adaptivePath.adaptiveRecommendations.nextBestCourse.confidence * 100)}% {t('confidence')}
              </Badge>
            </div>
            <Button onClick={() => window.location.href = `/courses/${adaptivePath.adaptiveRecommendations.nextBestCourse.id}`}>
              <ArrowRight className="h-4 w-4 mr-1" />
              {t('startCourse')}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Skill Gaps */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {t('identifiedSkillGaps')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {adaptivePath.adaptiveRecommendations.skillGaps.map((gap, index) => (
              <Badge key={index} variant="secondary" className="bg-red-100 text-red-800">
                {gap}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Optimized Path Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Route className="h-5 w-5" />
              {t('optimizedPathSuggestions')}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => generateRecommendationsMutation.mutate()}
              disabled={generateRecommendationsMutation.isPending}
            >
              {generateRecommendationsMutation.isPending ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Zap className="h-4 w-4 mr-1" />
              )}
              {t('refreshRecommendations')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {adaptivePath.adaptiveRecommendations.optimizedPath.map((suggestion, index) => (
              <Card key={index} className={getPriorityColor(suggestion.priority)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-medium">{suggestion.title}</h5>
                      <p className="text-sm text-gray-600 mt-1">{suggestion.adaptiveReason}</p>
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                        <span>{suggestion.estimatedTime} {t('hours')}</span>
                        <Badge variant="outline">
                          {t(suggestion.priority)} {t('priority')}
                        </Badge>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      {t('addToPath')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Learning Style Insights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('detectedLearningStyle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Brain className="h-8 w-8 text-purple-500 mx-auto mb-2" />
              <p className="font-medium">{adaptivePath.adaptiveRecommendations.learningStyle}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('optimalLearningPace')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Activity className="h-8 w-8 text-blue-500 mx-auto mb-2" />
              <p className="font-medium capitalize">{adaptivePath.adaptiveRecommendations.preferredPace} {t('pace')}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  if (compact) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            {adaptivePath.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Progress value={adaptivePath.progress} className="h-2" />
            <div className="flex justify-between text-sm text-gray-500">
              <span>{adaptivePath.currentStep} / {adaptivePath.totalSteps} {t('steps')}</span>
              <span>{adaptivePath.progress}% {t('complete')}</span>
            </div>
            <Button size="sm" className="w-full">
              {t('viewFullPath')}
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs value={viewMode} onValueChange={(value: any) => setViewMode(value)}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="path" className="flex items-center gap-2">
            <Route className="h-4 w-4" />
            {t('pathView')}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('analytics')}
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            {t('recommendations')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="path">
          {renderPathVisualization()}
        </TabsContent>

        <TabsContent value="analytics">
          {renderAnalytics()}
        </TabsContent>

        <TabsContent value="recommendations">
          {renderRecommendations()}
        </TabsContent>
      </Tabs>
    </div>
  );
}