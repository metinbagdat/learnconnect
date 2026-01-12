import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNav } from "@/components/layout/mobile-nav";
import {
  AlertCircle,
  TrendingUp,
  Zap,
  BookOpen,
  Clock,
  Target,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

export default function AdaptiveLearningPage() {
  const { t } = useLanguage();

  // Fetch adaptive adjustments
  const { data: adjustmentsData, isLoading: adjLoading } = useQuery<any>({
    queryKey: ["/api/adaptive/adjustments"],
  });
  const adjustments = adjustmentsData as any;

  // Fetch recommended resources
  const { data: resourcesData, isLoading: resLoading } = useQuery<any>({
    queryKey: ["/api/adaptive/resources"],
  });
  const resources: any[] = Array.isArray(resourcesData) ? resourcesData : [];

  // Fetch intervention detection
  const { data: interventionData, isLoading: intLoading } = useQuery<any>({
    queryKey: ["/api/adaptive/intervention"],
  });
  const intervention = interventionData as any;

  const isLoading = adjLoading || resLoading || intLoading;

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 overflow-auto">
        <MobileNav />
        <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-100 dark:from-slate-900 dark:to-slate-800 p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
                {t("adaptiveLearning", "Adaptive Learning")}
              </h1>
              <p className="text-lg text-slate-600 dark:text-slate-300">
                {t("personalizedAdjustments", "Personalized adjustments based on your progress")}
              </p>
            </div>

            {/* Intervention Alert */}
            {intervention && intervention.needsIntervention && (
              <Alert
                className={`border-2 ${
                  intervention.severity === "high"
                    ? "border-red-500 bg-red-50 dark:bg-red-950"
                    : "border-yellow-500 bg-yellow-50 dark:bg-yellow-950"
                }`}
              >
                <AlertCircle
                  className={`h-4 w-4 ${
                    intervention.severity === "high"
                      ? "text-red-600"
                      : "text-yellow-600"
                  }`}
                />
                <AlertTitle
                  className={
                    intervention.severity === "high"
                      ? "text-red-800 dark:text-red-200"
                      : "text-yellow-800 dark:text-yellow-200"
                  }
                >
                  {intervention.interventionType === "motivational"
                    ? "Let's Get Back on Track"
                    : "We Can Help"}
                </AlertTitle>
                <AlertDescription
                  className={
                    intervention.severity === "high"
                      ? "text-red-700 dark:text-red-100"
                      : "text-yellow-700 dark:text-yellow-100"
                  }
                >
                  {intervention.message}
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Pace Adjustment */}
              <Card className="border-2 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Clock className="w-5 h-5 text-blue-600" />
                    {t("paceAdjustment", "Pace Adjustment")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {adjustments ? (
                    <>
                      <Badge
                        className={`w-full justify-center text-base py-2 ${
                          adjustments.paceAdjustment === "accelerate"
                            ? "bg-green-500 hover:bg-green-600"
                            : adjustments.paceAdjustment === "slow_down"
                            ? "bg-orange-500 hover:bg-orange-600"
                            : "bg-blue-500 hover:bg-blue-600"
                        }`}
                      >
                        {adjustments.paceAdjustment === "accelerate"
                          ? "⚡ Accelerate"
                          : adjustments.paceAdjustment === "slow_down"
                          ? "🐢 Slow Down"
                          : "➡️ Maintain"}
                      </Badge>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        {adjustments.paceAdjustment === "accelerate"
                          ? t("greatProgress", "You're progressing well! Time to level up.")
                          : adjustments.paceAdjustment === "slow_down"
                          ? t(
                            "takeTime",
                            "Take more time to master concepts before moving forward."
                          )
                          : t("stayOnTrack", "Keep your current momentum going.")}
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Loading...</p>
                  )}
                </CardContent>
              </Card>

              {/* Difficulty Adjustment */}
              <Card className="border-2 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Zap className="w-5 h-5 text-purple-600" />
                    {t("difficultyLevel", "Difficulty Level")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {adjustments ? (
                    <>
                      <Badge
                        className={`w-full justify-center text-base py-2 ${
                          adjustments.difficultyAdjustment === "increase"
                            ? "bg-red-500 hover:bg-red-600"
                            : adjustments.difficultyAdjustment === "decrease"
                            ? "bg-blue-500 hover:bg-blue-600"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {adjustments.difficultyAdjustment === "increase"
                          ? "📈 Increase"
                          : adjustments.difficultyAdjustment === "decrease"
                          ? "📉 Decrease"
                          : "➡️ Perfect"}
                      </Badge>
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        Current level is{" "}
                        {adjustments.difficultyAdjustment === "decrease"
                          ? "too challenging"
                          : adjustments.difficultyAdjustment === "increase"
                          ? "too easy"
                          : "just right"}{" "}
                        for your progress.
                      </p>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Loading...</p>
                  )}
                </CardContent>
              </Card>

              {/* Next Milestone */}
              <Card className="border-2 border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Target className="w-5 h-5 text-green-600" />
                    {t("nextMilestone", "Next Milestone")}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {adjustments ? (
                    <>
                      <div className="bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                        <p className="font-semibold text-slate-900 dark:text-white">
                          {adjustments.nextMilestone.title}
                        </p>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                          {adjustments.nextMilestone.description}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                          Target: {adjustments.nextMilestone.targetDate}
                        </p>
                      </div>
                    </>
                  ) : (
                    <p className="text-sm text-slate-500">Loading...</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Focus Areas */}
            {adjustments && adjustments.focusAreas.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {t("focusAreas", "Focus Areas")}
                  </CardTitle>
                  <CardDescription>
                    {t("prioritizeTopics", "Areas to prioritize in your next study sessions")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {adjustments.focusAreas.map((area: string, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-start gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                      >
                        <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="font-medium text-slate-900 dark:text-white">{area}</p>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                            Recommended for this week
                          </p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Recommendations */}
            {adjustments && adjustments.recommendations.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    {t("recommendations", "Personalized Recommendations")}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {adjustments.recommendations.map((rec: string, idx: number) => (
                      <li key={idx} className="flex items-start gap-3 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                        <p className="text-slate-700 dark:text-slate-200">{rec}</p>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Recommended Resources */}
            {resources && resources.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>{t("recommendedResources", "Recommended Resources")}</CardTitle>
                  <CardDescription>
                    {t("personalized", "Tailored materials to support your learning")}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {resources.slice(0, 6).map((resource: any) => (
                      <div
                        key={resource.id}
                        className="border rounded-lg p-4 hover:shadow-lg transition-shadow cursor-pointer"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <Badge variant="outline">{resource.type}</Badge>
                          <span className="text-sm text-slate-500">
                            {resource.estimatedTime} min
                          </span>
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">
                          {resource.title}
                        </h3>
                        <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                          {resource.description}
                        </p>
                        <p className="text-xs text-slate-500 italic mb-3">
                          Why: {resource.reason}
                        </p>
                        <Button size="sm" className="w-full" data-testid={`button-resource-${resource.id}`}>
                          View Resource
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
