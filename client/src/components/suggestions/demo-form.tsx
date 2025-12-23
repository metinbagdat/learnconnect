import { useState, forwardRef, useImperativeHandle } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SuggestionSelect, SuggestionAutocomplete } from "./suggestion-select";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export const SuggestionDemoForm = forwardRef(function SuggestionDemoForm(_props, ref) {
  const [learningGoal, setLearningGoal] = useState("");
  const [careerField, setCareerField] = useState("");
  const [courseTopic, setCourseTopic] = useState("");
  const [timeframe, setTimeframe] = useState("");
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, navigate] = useLocation();

  // Expose setter methods for parent component
  useImperativeHandle(ref, () => ({
    setGoal: (goal: string) => setLearningGoal(goal),
    setField: (field: string) => setCareerField(field),
    setTopic: (topic: string) => setCourseTopic(topic),
  }));

  // Mutation for creating learning path
  const createLearningPathMutation = useMutation({
    mutationFn: async (pathData: any) => {
      const res = await apiRequest("POST", "/api/learning-paths", pathData);
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('learningPathCreated', 'Learning Path Created'),
        description: t('learningPathCreatedDesc', 'Your personalized learning path has been created successfully!'),
      });
      // Clear form
      setLearningGoal("");
      setCareerField("");
      setCourseTopic("");
      setTimeframe("");
      // Refresh any related queries
      queryClient.invalidateQueries({ queryKey: ['/api/learning-paths'] });
      queryClient.invalidateQueries({ queryKey: ['/api/study-goals'] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
      // Navigate to smart planning dashboard to see the new path, then to courses after review
      setTimeout(() => navigate('/smart-planning'), 1000);
    },
    onError: (error) => {
      toast({
        title: t('error', 'Error'),
        description: t('learningPathError', 'Failed to create learning path. Please try again.'),
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Send data in format expected by AI generation endpoint
    const pathData = {
      goal: learningGoal,
      careerField: careerField || '',
      timeframe: timeframe || '6 months'
    };

    createLearningPathMutation.mutate(pathData);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>{t('createYourLearningPath', 'Create Your Learning Path')}</CardTitle>
        <CardDescription>
          {t('createYourLearningPathDesc', 'Select your preferences to generate a personalized learning path')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">{t('learningGoal', 'Learning Goal')}</label>
            <SuggestionSelect
              type="goals"
              label={t('selectALearningGoal', 'Select a learning goal')}
              placeholder={t('whatDoYouWantToAchieve', 'What do you want to achieve?')}
              value={learningGoal}
              onChange={setLearningGoal}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('careerField', 'Career Field')}</label>
            <SuggestionAutocomplete
              type="fields"
              label={t('selectOrEnterACareerField', 'Select or enter a career field')}
              placeholder={t('yourFieldOfInterest', 'Your field of interest')}
              value={careerField}
              onChange={setCareerField}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('courseTopic', 'Course Topic')}</label>
            <SuggestionSelect
              type="courseTopics"
              label={t('selectATopic', 'Select a topic')}
              placeholder={t('whatWouldYouLikeToLearn', 'What would you like to learn?')}
              value={courseTopic}
              onChange={setCourseTopic}
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">{t('timeframe', 'Timeframe')}</label>
            <SuggestionSelect
              type="timeframes"
              label={t('selectATimeframe', 'Select a timeframe')}
              placeholder={t('howLongDoYouWantToSpend', 'How long do you want to spend?')}
              value={timeframe}
              onChange={setTimeframe}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={createLearningPathMutation.isPending}>
            {createLearningPathMutation.isPending ? t('creating', 'Creating...') : t('generateLearningPath', 'Generate Learning Path')}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
});