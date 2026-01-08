import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StudentControlPanelData } from "@/types/dashboard";
import { 
  BookOpen, 
  Target, 
  Clock, 
  Trophy, 
  TrendingUp, 
  Calendar,
  User,
  Settings,
  BarChart3,
  CheckCircle
} from "lucide-react";

interface LearningPath {
  id: number;
  title: string;
  description: string;
  goal: string;
  field: string;
  topic: string;
  timeframe: string;
  difficulty: string;
  progress?: number;
  createdAt: string;
}

interface StudyStats {
  totalHours: number;
  coursesCompleted: number;
  currentStreak: number;
  averageGrade: number;
  weeklyProgress: number[];
}

export default function StudentControlPanel() {
  const [activeTab, setActiveTab] = useState("overview");
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch student's learning paths
  const { data: learningPaths = [], isLoading: pathsLoading } = useQuery<LearningPath[]>({
    queryKey: ['/api/learning-paths'],
  });

  // Fetch student's study statistics
  const { data: studyStats, isLoading: statsLoading } = useQuery<StudyStats>({
    queryKey: ['/api/student/stats'],
  });

  // Fetch student's achievements (using data from above)
  const achievementsLoading = false;

  // Fetch upcoming assignments
  const { data: data } = useQuery<StudentControlPanelData>({
    queryKey: ['/api/assignments/upcoming'],
  });

  // Add type guards for unknown arrays
  const assignments = Array.isArray(data?.assignments) 
    ? (data.assignments as any[]) 
    : [];

  const achievements = Array.isArray(data?.achievements) 
    ? (data.achievements as any[]) 
    : [];

  const assignmentsLoading = false;

  const deleteLearningPathMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/learning-paths/${id}`);
    },
    onSuccess: () => {
      toast({
        title: t('learningPathDeleted', 'Learning Path Deleted'),
        description: t('learningPathDeletedDesc', 'Your learning path has been deleted successfully.'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/learning-paths'] });
    },
    onError: () => {
      toast({
        title: t('error', 'Error'),
        description: t('learningPathDeleteError', 'Failed to delete learning path.'),
        variant: "destructive"
      });
    }
  });

  const handleDeletePath = (id: number) => {
    if (confirm(t('confirmDelete', 'Are you sure you want to delete this learning path?'))) {
      deleteLearningPathMutation.mutate(id);
    }
  };

  return (
    <div className="container py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold mb-2">{t('studentControlPanel', 'Student Control Panel')}</h1>
          <p className="text-muted-foreground">
            {t('manageYourLearningJourney', 'Manage your learning journey and track your progress')}
          </p>
        </div>
        <Badge variant="secondary" className="px-3 py-1">
          <User className="h-4 w-4 mr-2" />
          {t('student', 'Student')}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            {t('overview', 'Overview')}
          </TabsTrigger>
          <TabsTrigger value="paths" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            {t('learningPaths', 'Learning Paths')}
          </TabsTrigger>
          <TabsTrigger value="progress" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            {t('progress', 'Progress')}
          </TabsTrigger>
          <TabsTrigger value="assignments" className="flex items-center gap-2">
            <BookOpen className="h-4 w-4" />
            {t('assignments', 'Assignments')}
          </TabsTrigger>
          <TabsTrigger value="achievements" className="flex items-center gap-2">
            <Trophy className="h-4 w-4" />
            {t('achievements', 'Achievements')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('totalStudyHours', 'Total Study Hours')}
                    </p>
                    <p className="text-2xl font-bold">{studyStats?.totalHours || 0}</p>
                  </div>
                  <Clock className="h-8 w-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('coursesCompleted', 'Courses Completed')}
                    </p>
                    <p className="text-2xl font-bold">{studyStats?.coursesCompleted || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('currentStreak', 'Current Streak')}
                    </p>
                    <p className="text-2xl font-bold">{studyStats?.currentStreak || 0} {t('days', 'days')}</p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {t('averageGrade', 'Average Grade')}
                    </p>
                    <p className="text-2xl font-bold">{studyStats?.averageGrade || 0}%</p>
                  </div>
                  <Trophy className="h-8 w-8 text-yellow-600" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="paths" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">{t('myLearningPaths', 'My Learning Paths')}</h2>
            <Button onClick={() => window.location.href = '/suggestions'}>
              {t('createNewPath', 'Create New Path')}
            </Button>
          </div>

          {pathsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <div className="animate-pulse space-y-4">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : learningPaths.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">{t('noLearningPaths', 'No Learning Paths Yet')}</h3>
                <p className="text-muted-foreground mb-4">
                  {t('createFirstPath', 'Create your first learning path to get started with personalized learning.')}
                </p>
                <Button onClick={() => window.location.href = '/suggestions'}>
                  {t('createLearningPath', 'Create Learning Path')}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {learningPaths.map((path) => (
                <Card key={path.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{path.title}</CardTitle>
                    <CardDescription>{path.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline">{path.field}</Badge>
                        <Badge variant="outline">{path.difficulty}</Badge>
                        <Badge variant="outline">{path.timeframe}</Badge>
                      </div>
                      
                      {path.progress !== undefined && (
                        <div>
                          <div className="flex justify-between text-sm mb-2">
                            <span>{t('progress', 'Progress')}</span>
                            <span>{path.progress}%</span>
                          </div>
                          <Progress value={path.progress} className="w-full" />
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <Button variant="outline" size="sm">
                          {t('viewDetails', 'View Details')}
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm"
                          onClick={() => handleDeletePath(path.id)}
                          disabled={deleteLearningPathMutation.isPending}
                        >
                          {t('delete', 'Delete')}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('weeklyProgress', 'Weekly Progress')}</CardTitle>
              <CardDescription>
                {t('yourStudyActivityOverTime', 'Your study activity over the past week')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end justify-between space-x-2">
                {studyStats?.weeklyProgress?.map((hours, index) => (
                  <div key={index} className="flex flex-col items-center">
                    <div 
                      className="bg-primary rounded-t w-8" 
                      style={{ height: `${(hours / Math.max(...(studyStats.weeklyProgress || [1]))) * 200}px` }}
                    ></div>
                    <span className="text-xs mt-2">
                      {new Date(Date.now() - (6 - index) * 24 * 60 * 60 * 1000).toLocaleDateString('en', { weekday: 'short' })}
                    </span>
                  </div>
                )) || []}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="assignments" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('upcomingAssignments', 'Upcoming Assignments')}</CardTitle>
              <CardDescription>
                {t('assignmentsDueSoon', 'Your assignments and their due dates')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {assignmentsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse flex items-center space-x-4">
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                    </div>
                  ))}
                </div>
              ) : assignments.length === 0 ? (
                <p className="text-center text-muted-foreground">
                  {t('noUpcomingAssignments', 'No upcoming assignments')}
                </p>
              ) : (
                <div className="space-y-4">
                  {assignments.map((assignment: any) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground">{assignment.description}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant={assignment.priority === 'high' ? 'destructive' : 'secondary'}>
                          {assignment.dueDate}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('myAchievements', 'My Achievements')}</CardTitle>
              <CardDescription>
                {t('recentAchievementsAndBadges', 'Recent achievements and badges you\'ve earned')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {achievementsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="animate-pulse p-4 border rounded-lg">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                    </div>
                  ))}
                </div>
              ) : achievements.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {t('noAchievementsYet', 'No achievements yet. Keep learning to earn your first badge!')}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement: any) => (
                    <div key={achievement.id} className="p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Trophy className="h-8 w-8 text-yellow-600" />
                        <div>
                          <h4 className="font-medium">{achievement.title}</h4>
                          <p className="text-sm text-muted-foreground">{achievement.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}