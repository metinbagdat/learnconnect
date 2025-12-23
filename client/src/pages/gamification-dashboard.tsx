import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Trophy,
  Medal,
  Award,
  Star,
  Users,
  Calendar,
  Sparkles,
  Flame,
  ArrowUpCircle,
  BookOpen,
  Clock,
  Loader2,
  Crown,
  Target,
  TrendingUp,
  Activity
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useGamificationTracker } from "@/hooks/use-gamification-tracker";
import { apiRequest } from "@/lib/queryClient";
import { LeaderboardTable } from "@/components/gamification/leaderboard-table";
import { AchievementCard } from "@/components/gamification/achievement-card";
import { AchievementUnlockModal } from "@/components/gamification/achievement-unlock-modal";
import { UserLevelCard } from "@/components/challenges/user-level-card";
import { InteractiveProgressBar } from "@/components/gamification/interactive-progress-bar";
import { formatDistanceToNow } from "date-fns";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";

export default function GamificationDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showXpGain, checkAndUnlockAchievements, celebrateLevelUp } = useGamificationTracker();
  const [achievementFilter, setAchievementFilter] = useState<string>("all");
  const [selectedLeaderboard, setSelectedLeaderboard] = useState<string>("overall");
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  
  // Fetch user level
  const { data: userLevel, isLoading: levelLoading } = useQuery({
    queryKey: ["/api/user/level"],
    enabled: !!user,
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest("GET", queryKey[0] as string);
      return await response.json();
    },
  });
  
  // Fetch all leaderboards
  const { data: leaderboards, isLoading: leaderboardsLoading } = useQuery({
    queryKey: ["/api/leaderboards"],
    enabled: !!user,
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest("GET", queryKey[0] as string);
      return await response.json();
    },
  });
  
  // Fetch user's achievements
  const { data: achievements, isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/user/achievements"],
    enabled: !!user,
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest("GET", queryKey[0] as string);
      return await response.json();
    },
  });
  
  // Fetch all available achievements
  const { data: allAchievements, isLoading: allAchievementsLoading } = useQuery({
    queryKey: ["/api/achievements"],
    enabled: !!user,
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest("GET", queryKey[0] as string);
      return await response.json();
    },
  });
  
  // Determine user ranks
  const { data: userRankings, isLoading: rankingsLoading } = useQuery({
    queryKey: ["/api/user/rankings"],
    enabled: !!user,
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest("GET", queryKey[0] as string);
      return await response.json();
    },
  });
  
  // Fetch recent activities
  const { data: recentActivities, isLoading: activitiesLoading } = useQuery({
    queryKey: ["/api/user/activities", { limit: 5 }],
    enabled: !!user,
    queryFn: async ({ queryKey }) => {
      const [url, params] = queryKey;
      const limit = typeof params === 'object' && 'limit' in params ? params.limit : 5;
      const response = await apiRequest("GET", `${url}?limit=${limit}`);
      return await response.json();
    },
  });
  
  const isLoading = levelLoading || leaderboardsLoading || achievementsLoading || 
                    allAchievementsLoading || rankingsLoading || activitiesLoading;
                    
  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }
  
  // Filter achievements based on selected filter
  const filteredAchievements = allAchievements?.filter((achievement: any) => {
    if (achievementFilter === "all") return true;
    if (achievementFilter === "unlocked") {
      return achievements?.some((userAchievement: any) => 
        userAchievement.achievement.id === achievement.id
      );
    }
    if (achievementFilter === "locked") {
      return !achievements?.some((userAchievement: any) => 
        userAchievement.achievement.id === achievement.id
      );
    }
    return achievement.category === achievementFilter || 
           achievement.rarity === achievementFilter;
  });
  
  // Get user achievements map for easy lookup
  const userAchievementsMap = new Map();
  achievements?.forEach((userAchievement: any) => {
    userAchievementsMap.set(userAchievement.achievement.id, userAchievement);
  });
  
  // Calculate achievement progress
  const totalAchievements = allAchievements?.length || 0;
  const unlockedAchievements = achievements?.length || 0;
  const achievementProgress = totalAchievements > 0 
    ? Math.round((unlockedAchievements / totalAchievements) * 100) 
    : 0;
    
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gamification Dashboard</h1>
          <p className="text-lg text-muted-foreground mb-2">
            Hey {user?.displayName?.split(' ')[0]}! Unlock achievements, climb leaderboards, and level up your learning journey!
          </p>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* User Level Card */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Level</CardTitle>
          </CardHeader>
          <CardContent>
            <UserLevelCard hideTitle={true} />
          </CardContent>
        </Card>
        
        {/* Achievement Progress */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Achievements</CardTitle>
            <CardDescription>Your collection progress</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Progress</span>
              <Badge variant="outline">
                {unlockedAchievements}/{totalAchievements}
              </Badge>
            </div>
            <Progress value={achievementProgress} className="h-2 mb-4" />
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-1">
                <Award className="h-4 w-4 text-primary" />
                <span>{unlockedAchievements} Unlocked</span>
              </div>
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{userLevel?.totalPoints || 0} Points</span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Rankings Summary */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Your Rankings</CardTitle>
            <CardDescription>Current standings across leaderboards</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {userRankings && userRankings.length > 0 ? (
                userRankings.slice(0, 3).map((ranking: any) => (
                  <div key={ranking.id} className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div className="bg-primary/10 rounded-full p-1">
                        <Trophy className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm">{ranking.leaderboard.name}</span>
                    </div>
                    <Badge variant={ranking.rank <= 3 ? "default" : "outline"}>
                      Rank #{ranking.rank}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <p>No leaderboard rankings yet</p>
                  <p className="text-xs mt-2">Complete challenges to join leaderboards</p>
                </div>
              )}
              
              {userRankings && userRankings.length > 3 && (
                <Button variant="ghost" size="sm" className="w-full">
                  View all rankings
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="leaderboards" className="space-y-6">
        <TabsList className="grid grid-cols-2 w-full md:w-[400px]">
          <TabsTrigger value="leaderboards">
            <Trophy className="mr-2 h-4 w-4" />
            Leaderboards
          </TabsTrigger>
          <TabsTrigger value="achievements">
            <Award className="mr-2 h-4 w-4" />
            Achievements
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="leaderboards" className="space-y-8">
          <div className="grid gap-6">
            {leaderboards ? (
              <>
                {/* Featured Leaderboards - Main ones in larger format */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <LeaderboardTable
                    entries={leaderboards.xp?.entries || []}
                    type="xp"
                    title={leaderboards.xp?.name || "XP Champions"}
                    description={leaderboards.xp?.description}
                    currentUserId={user?.id}
                    timeframe="all_time"
                    isLoading={leaderboardsLoading}
                  />
                  <LeaderboardTable
                    entries={leaderboards.weekly?.entries || []}
                    type="weekly"
                    title={leaderboards.weekly?.name || "Weekly Champions"}
                    description={leaderboards.weekly?.description}
                    currentUserId={user?.id}
                    timeframe="weekly"
                    isLoading={leaderboardsLoading}
                  />
                </div>
                
                {/* Additional Leaderboards - Secondary ones */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <LeaderboardTable
                    entries={leaderboards.points?.entries || []}
                    type="points"
                    title={leaderboards.points?.name || "Point Masters"}
                    description={leaderboards.points?.description}
                    currentUserId={user?.id}
                    timeframe="all_time"
                    isLoading={leaderboardsLoading}
                  />
                  <LeaderboardTable
                    entries={leaderboards.streaks?.entries || []}
                    type="streaks"
                    title={leaderboards.streaks?.name || "Streak Legends"}
                    description={leaderboards.streaks?.description}
                    currentUserId={user?.id}
                    timeframe="all_time"
                    isLoading={leaderboardsLoading}
                  />
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Loading Leaderboards...</h3>
                <p className="text-muted-foreground">
                  Fetching the latest rankings and competition data
                </p>
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="achievements" className="space-y-6">
          <div className="flex flex-wrap gap-2">
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "all" ? "default" : "outline"}
              onClick={() => setAchievementFilter("all")}
            >
              All
            </Badge>
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "unlocked" ? "default" : "outline"}
              onClick={() => setAchievementFilter("unlocked")}
            >
              Unlocked
            </Badge>
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "locked" ? "default" : "outline"}
              onClick={() => setAchievementFilter("locked")}
            >
              Locked
            </Badge>
            <Separator className="my-2 w-full" />
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "academic" ? "default" : "outline"}
              onClick={() => setAchievementFilter("academic")}
            >
              Academic
            </Badge>
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "engagement" ? "default" : "outline"}
              onClick={() => setAchievementFilter("engagement")}
            >
              Engagement
            </Badge>
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "mastery" ? "default" : "outline"}
              onClick={() => setAchievementFilter("mastery")}
            >
              Mastery
            </Badge>
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "social" ? "default" : "outline"}
              onClick={() => setAchievementFilter("social")}
            >
              Social
            </Badge>
            <Separator className="my-2 w-full" />
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "legendary" ? "default" : "outline"}
              onClick={() => setAchievementFilter("legendary")}
            >
              Legendary
            </Badge>
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "epic" ? "default" : "outline"}
              onClick={() => setAchievementFilter("epic")}
            >
              Epic
            </Badge>
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "rare" ? "default" : "outline"}
              onClick={() => setAchievementFilter("rare")}
            >
              Rare
            </Badge>
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "uncommon" ? "default" : "outline"}
              onClick={() => setAchievementFilter("uncommon")}
            >
              Uncommon
            </Badge>
            <Badge 
              className="cursor-pointer" 
              variant={achievementFilter === "common" ? "default" : "outline"}
              onClick={() => setAchievementFilter("common")}
            >
              Common
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAchievements && filteredAchievements.length > 0 ? (
              filteredAchievements.map((achievement: any) => {
                const userAchievement = userAchievementsMap.get(achievement.id);
                return (
                  <AchievementCard 
                    key={achievement.id} 
                    achievement={achievement}
                    userAchievement={userAchievement}
                    isUnlocked={!!userAchievement}
                    onClick={() => {
                      if (userAchievement) {
                        // Show details for unlocked achievements
                        toast({
                          title: "Achievement Details",
                          description: `${achievement.title}: ${achievement.description}`,
                        });
                      } else {
                        // Show unlock demo for locked achievements
                        setSelectedAchievement(achievement);
                        setShowUnlockModal(true);
                      }
                    }}
                  />
                );
              })
            ) : (
              <div className="col-span-full text-center py-12">
                <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">No Achievements Found</h3>
                <p className="text-muted-foreground">
                  No achievements match your current filter
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Achievement Unlock Modal Demo */}
      <AchievementUnlockModal
        achievement={selectedAchievement}
        isOpen={showUnlockModal}
        onClose={() => {
          setShowUnlockModal(false);
          setSelectedAchievement(null);
        }}
      />
      
      {/* Recent Activity */}
      <div className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
        <Card>
          <CardContent className="pt-6">
            {recentActivities && recentActivities.length > 0 ? (
              <div className="space-y-4">
                {recentActivities.map((activity: any) => {
                  let icon;
                  switch (activity.action) {
                    case 'complete_course':
                      icon = <BookOpen className="h-4 w-4 text-green-500" />;
                      break;
                    case 'complete_lesson':
                      icon = <BookOpen className="h-4 w-4 text-blue-500" />;
                      break;
                    case 'earn_achievement':
                      icon = <Award className="h-4 w-4 text-amber-500" />;
                      break;
                    case 'level_up':
                      icon = <ArrowUpCircle className="h-4 w-4 text-purple-500" />;
                      break;
                    case 'maintain_streak':
                      icon = <Flame className="h-4 w-4 text-red-500" />;
                      break;
                    default:
                      icon = <Star className="h-4 w-4 text-gray-500" />;
                  }
                  
                  return (
                    <div key={activity.id} className="flex items-start gap-3 pb-4 border-b border-border last:border-0 last:pb-0">
                      <div className="bg-muted rounded-full p-2">
                        {icon}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action.replace('_', ' ')}</p>
                        <p className="text-xs text-muted-foreground">
                          {activity.metadata && JSON.stringify(activity.metadata)}
                        </p>
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <p>No recent activity to display</p>
                <p className="text-xs mt-2">Complete challenges and courses to see your activity</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}