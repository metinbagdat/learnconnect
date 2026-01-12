import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Users, Zap } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Recommendation {
  courseId: number;
  score: number;
  reason: string;
  matchedTags: string[];
}

export function CourseRecommendations() {
  const { toast } = useToast();
  const [newInterest, setNewInterest] = useState("");

  // Fetch recommendations
  const { data: recommendations = [], isLoading } = useQuery<Recommendation[]>({
    queryKey: ["/api/recommendations/courses"],
  });

  // Fetch user interests
  const { data: userInterestsData } = useQuery<any>({
    queryKey: ["/api/user/interests"],
  });
  const userInterests: any[] = Array.isArray(userInterestsData) ? userInterestsData : [];

  // Save interest mutation
  const saveInterestMutation = useMutation({
    mutationFn: async (interest: string) => {
      const res = await apiRequest("POST", "/api/user/interests", { interest });
      if (!res.ok) throw new Error("Failed to save interest");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "✓ Interest saved!" });
      setNewInterest("");
      queryClient.invalidateQueries({ queryKey: ["/api/user/interests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/recommendations/courses"] });
    },
    onError: () => {
      toast({ title: "Failed to save interest", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-6" data-testid="course-recommendations">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
          <Zap className="w-5 h-5" />
          Recommended For You
        </h2>
        <p className="text-muted-foreground">Personalized courses based on your interests</p>
      </div>

      {/* User Interests Section */}
      <Card data-testid="interests-card">
        <CardHeader>
          <CardTitle className="text-lg">Your Interests</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2 mb-4" data-testid="interests-list">
            {userInterests.map((interest: any, idx: number) => (
              <Badge key={idx} variant="secondary" data-testid={`interest-${idx}`}>
                {interest.interest}
              </Badge>
            ))}
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-interest">Add Interest</Label>
            <div className="flex gap-2">
              <Input
                id="new-interest"
                placeholder="e.g., Web Development, AI, Data Science"
                value={newInterest}
                onChange={(e) => setNewInterest(e.target.value)}
                data-testid="input-interest"
              />
              <Button
                onClick={() => newInterest && saveInterestMutation.mutate(newInterest)}
                disabled={!newInterest || saveInterestMutation.isPending}
                data-testid="button-save-interest"
              >
                {saveInterestMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Add"
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recommendations */}
      {isLoading ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Loader2 className="w-6 h-6 animate-spin mx-auto" />
          </CardContent>
        </Card>
      ) : recommendations.length === 0 ? (
        <Card data-testid="no-recommendations">
          <CardContent className="pt-6 text-center text-muted-foreground">
            No recommendations yet. Add interests to see personalized courses.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4" data-testid="recommendations-grid">
          {recommendations.map((rec, idx) => (
            <Card
              key={idx}
              data-testid={`recommendation-${idx}`}
              className="hover:shadow-lg transition-shadow border-blue-200 dark:border-blue-800"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg" data-testid={`rec-title-${idx}`}>
                      Course #{rec.courseId}
                    </CardTitle>
                    <CardDescription data-testid={`rec-reason-${idx}`}>{rec.reason}</CardDescription>
                  </div>
                  <Badge
                    variant="default"
                    className="bg-gradient-to-r from-blue-500 to-purple-500"
                    data-testid={`rec-score-${idx}`}
                  >
                    {Math.round(rec.score)}% match
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Matched Interests</p>
                  <div className="flex flex-wrap gap-2" data-testid={`rec-tags-${idx}`}>
                    {rec.matchedTags.map((tag, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button className="w-full" data-testid={`button-enroll-${idx}`}>
                  Explore Course
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
