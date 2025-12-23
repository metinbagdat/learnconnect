import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Star, Flame, TrendingUp } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";

interface UserLevelCardProps {
  hideTitle?: boolean;
}

export function UserLevelCard({ hideTitle = false }: UserLevelCardProps) {
  const { toast } = useToast();
  const [errorShown, setErrorShown] = React.useState(false);
  
  const { data: userLevel, isLoading, error } = useQuery({
    queryKey: ["/api/user/level"],
    queryFn: async ({ queryKey }) => {
      const response = await apiRequest("GET", queryKey[0] as string);
      return await response.json();
    },
  });

  React.useEffect(() => {
    if (error && !errorShown) {
      toast({
        title: "Error loading user level",
        description: (error as Error).message,
        variant: "destructive",
      });
      setErrorShown(true);
    }
  }, [error, errorShown, toast]);

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return null;
  }

  if (!userLevel) {
    return (
      <div className="flex justify-center p-4 text-muted-foreground">
        <p>No level data available</p>
      </div>
    );
  }

  // Calculate XP required for next level
  const baseXpRequired = 100; // Base XP for level 1
  const multiplier = 1.5; // Increase factor for each level
  
  const currentLevel = userLevel.level || 1;
  const nextLevelXp = Math.floor(baseXpRequired * Math.pow(multiplier, currentLevel - 1));
  
  // Calculate progress to next level
  const levelProgress = userLevel.currentXp ? Math.min(Math.floor((userLevel.currentXp / nextLevelXp) * 100), 100) : 0;

  return (
    <div className="space-y-4">
      {!hideTitle && (
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Your Level</CardTitle>
        </CardHeader>
      )}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <TrendingUp className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-xl font-bold">Level {userLevel.level}</p>
            <p className="text-xs text-muted-foreground">
              {userLevel.currentXp}/{nextLevelXp} XP to Level {currentLevel + 1}
            </p>
          </div>
        </div>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {userLevel.totalXp} XP
        </Badge>
      </div>
      
      <Progress value={levelProgress} className="h-2" />
      
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-muted/50 rounded-md p-3 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Points</p>
            <p className="text-xl font-bold">{userLevel.totalPoints || 0}</p>
          </div>
          <Star className="h-5 w-5 text-yellow-500" />
        </div>
        
        <div className="bg-muted/50 rounded-md p-3 flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">Streak</p>
            <p className="text-xl font-bold">{userLevel.streak || 0} days</p>
          </div>
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
      </div>
    </div>
  );
}