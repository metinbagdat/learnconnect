import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SkillChallengePopup, type SkillChallenge } from "./skill-challenge-popup";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Zap, Trophy, Star, Timer, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";

interface SkillChallengeManagerProps {
  courseId?: number;
  moduleId?: number;
  lessonId?: number;
  category?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  onChallengeComplete?: (pointsEarned: number, xpEarned: number) => void;
}

interface ChallengeAttempt {
  challengeId: number;
  answer: string;
  timeSpent: number;
  isCorrect: boolean;
  timedOut?: boolean;
  hintUsed?: boolean;
}

export function SkillChallengeManager({
  courseId,
  moduleId,
  lessonId,
  category,
  difficulty,
  onChallengeComplete
}: SkillChallengeManagerProps) {
  const [currentChallenge, setCurrentChallenge] = useState<SkillChallenge | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [sessionStats, setSessionStats] = useState({
    completed: 0,
    correct: 0,
    totalPoints: 0,
    totalXp: 0,
    streak: 0
  });
  const { toast } = useToast();

  // Fetch available challenges
  const { data: challenges, isLoading } = useQuery({
    queryKey: ['/api/skill-challenges', { courseId, moduleId, lessonId, category, difficulty }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (courseId) params.append('courseId', courseId.toString());
      if (moduleId) params.append('moduleId', moduleId.toString());
      if (lessonId) params.append('lessonId', lessonId.toString());
      if (category) params.append('category', category);
      if (difficulty) params.append('difficulty', difficulty);
      
      const response = await fetch(`/api/skill-challenges?${params}`);
      if (!response.ok) throw new Error('Failed to fetch challenges');
      return response.json() as Promise<SkillChallenge[]>;
    }
  });

  // Get random challenge
  const getRandomChallengeMutation = useMutation({
    mutationFn: async () => {
      const params = new URLSearchParams();
      if (difficulty) params.append('difficulty', difficulty);
      if (category) params.append('category', category);
      
      const response = await apiRequest('GET', `/api/skill-challenges/random?${params}`);
      return response.json() as Promise<SkillChallenge>;
    },
    onSuccess: (challenge) => {
      setCurrentChallenge(challenge);
      setIsPopupOpen(true);
    },
    onError: (error: any) => {
      toast({
        title: "No challenges available",
        description: error.message || "Try again later",
        variant: "destructive"
      });
    }
  });

  // Submit challenge attempt
  const submitChallengeMutation = useMutation({
    mutationFn: async (attempt: ChallengeAttempt) => {
      const response = await apiRequest('POST', '/api/skill-challenges/submit', attempt);
      return response.json();
    },
    onSuccess: (result) => {
      setSessionStats(prev => ({
        completed: prev.completed + 1,
        correct: prev.correct + (result.isCorrect ? 1 : 0),
        totalPoints: prev.totalPoints + result.pointsEarned,
        totalXp: prev.totalXp + result.xpEarned,
        streak: result.isCorrect ? prev.streak + 1 : 0
      }));

      if (result.isCorrect) {
        toast({
          title: "Correct! 🎉",
          description: `+${result.pointsEarned} points, +${result.xpEarned} XP`,
        });
      } else {
        toast({
          title: "Keep trying!",
          description: "Review the explanation and try similar challenges",
          variant: "destructive"
        });
      }

      onChallengeComplete?.(result.pointsEarned, result.xpEarned);
      
      // Invalidate user level cache to refresh XP/points
      queryClient.invalidateQueries({ queryKey: ['/api/user/level'] });
    },
    onError: (error: any) => {
      toast({
        title: "Submission failed",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const handleChallengeComplete = (success: boolean, points: number, xp: number) => {
    if (currentChallenge) {
      // This will be called from the popup component with the actual attempt data
      setIsPopupOpen(false);
      setCurrentChallenge(null);
    }
  };

  const handleChallengeSubmit = (attempt: ChallengeAttempt) => {
    submitChallengeMutation.mutate(attempt);
  };

  const startRandomChallenge = () => {
    getRandomChallengeMutation.mutate();
  };

  const getDifficultyColor = (diff: string) => {
    switch (diff) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  if (isLoading) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="w-full max-w-md bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Zap className="h-5 w-5 text-purple-600" />
            Skill Challenges
          </CardTitle>
          <CardDescription>
            Test your knowledge with bite-sized challenges
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Session Stats */}
          {sessionStats.completed > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Session Progress</span>
                <span>{sessionStats.correct}/{sessionStats.completed}</span>
              </div>
              <Progress 
                value={sessionStats.completed > 0 ? (sessionStats.correct / sessionStats.completed) * 100 : 0} 
                className="h-2"
              />
              
              <div className="flex gap-4 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Trophy className="h-3 w-3" />
                  {sessionStats.totalPoints} pts
                </div>
                <div className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {sessionStats.totalXp} XP
                </div>
                <div className="flex items-center gap-1">
                  <Target className="h-3 w-3" />
                  {sessionStats.streak} streak
                </div>
              </div>
            </div>
          )}

          {/* Available Challenges Info */}
          {challenges && challenges.length > 0 && (
            <div className="space-y-2">
              <div className="text-sm font-medium">Available Challenges</div>
              <div className="flex flex-wrap gap-1">
                {Array.from(new Set(challenges.map(c => c.difficulty))).map(diff => (
                  <Badge 
                    key={diff} 
                    variant="secondary" 
                    className={`text-xs ${getDifficultyColor(diff)} text-white`}
                  >
                    {diff}
                  </Badge>
                ))}
              </div>
              <div className="text-xs text-gray-600">
                {challenges.length} challenge{challenges.length !== 1 ? 's' : ''} available
              </div>
            </div>
          )}

          {/* Action Button */}
          <Button 
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              startRandomChallenge();
            }}
            disabled={getRandomChallengeMutation.isPending || !challenges?.length}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {getRandomChallengeMutation.isPending ? (
              <div className="flex items-center gap-2">
                <Timer className="h-4 w-4 animate-spin" />
                Loading Challenge...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Start Challenge
              </div>
            )}
          </Button>

          {!challenges?.length && (
            <div className="text-center text-sm text-gray-500 py-4">
              No challenges available for this content
            </div>
          )}
        </CardContent>
      </Card>

      {/* Challenge Popup */}
      <SkillChallengePopup
        isOpen={isPopupOpen}
        onClose={() => {
          setIsPopupOpen(false);
          setCurrentChallenge(null);
        }}
        challenge={currentChallenge}
        onComplete={handleChallengeComplete}
        onSubmit={handleChallengeSubmit}
      />
    </>
  );
}