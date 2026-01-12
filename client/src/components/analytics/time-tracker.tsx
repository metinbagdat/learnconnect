import React, { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { Clock, Play, Square, TrendingUp } from 'lucide-react';
import { Loader2 } from 'lucide-react';

interface StudySession {
  id: number;
  subject: string;
  task: string;
  startTime: string;
  endTime?: string;
  duration?: number;
  difficulty?: number;
  satisfaction?: number;
}

export function TimeTracker() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isTracking, setIsTracking] = useState(false);
  const [currentSession, setCurrentSession] = useState<StudySession | null>(null);
  const [subject, setSubject] = useState('');
  const [task, setTask] = useState('');
  const [difficulty, setDifficulty] = useState('3');
  const [satisfaction, setSatisfaction] = useState('3');

  const subjects = ['Mathematics', 'Turkish', 'Science', 'Social Studies', 'Literature'];

  // Track session mutation
  const trackMutation = useMutation({
    mutationFn: async (sessionData: Partial<StudySession>) => {
      return apiRequest('POST', '/api/adaptive/track-performance', {
        taskId: currentSession?.id || 0,
        score: 0,
        timeSpent: sessionData.duration,
        difficulty: String(parseInt(String(sessionData.difficulty || '3'))),
        satisfaction: String(parseInt(String(sessionData.satisfaction || '3'))),
        notes: `${sessionData.subject}: ${sessionData.task}`
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Study session recorded successfully',
        duration: 3000
      });
      queryClient.invalidateQueries({ queryKey: ['/api/adaptive/analytics'] });
    }
  });

  const startTracking = () => {
    if (!subject || !task) {
      toast({
        title: 'Error',
        description: 'Please select a subject and enter a task',
        variant: 'destructive'
      });
      return;
    }

    const session: StudySession = {
      id: Date.now(),
      subject,
      task,
      startTime: new Date().toISOString(),
      difficulty: parseInt(difficulty),
      satisfaction: parseInt(satisfaction)
    };

    setCurrentSession(session);
    setIsTracking(true);
    toast({
      title: 'Started',
      description: `Tracking ${subject}: ${task}`,
      duration: 2000
    });
  };

  const stopTracking = async () => {
    if (!currentSession) return;

    const endTime = new Date();
    const startTime = new Date(currentSession.startTime);
    const duration = Math.round((endTime.getTime() - startTime.getTime()) / 60000);

    const sessionData = {
      ...currentSession,
      endTime: endTime.toISOString(),
      duration
    };

    trackMutation.mutate(sessionData);
    setIsTracking(false);
    setCurrentSession(null);
    setSubject('');
    setTask('');
  };

  // Calculate elapsed time
  const [elapsedTime, setElapsedTime] = useState(0);
  useEffect(() => {
    if (!isTracking) return;

    const interval = setInterval(() => {
      if (currentSession) {
        const elapsed = Math.round((new Date().getTime() - new Date(currentSession.startTime).getTime()) / 1000);
        setElapsedTime(elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isTracking, currentSession]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Study Time Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!isTracking ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <Select value={subject} onValueChange={setSubject}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">What are you working on?</label>
              <Input
                placeholder="e.g., Chapter 3 - Quadratic Equations"
                value={task}
                onChange={(e) => setTask(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Difficulty</label>
                <Select value={difficulty} onValueChange={setDifficulty}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Satisfaction</label>
                <Select value={satisfaction} onValueChange={setSatisfaction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => (
                      <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button onClick={startTracking} className="w-full" size="lg">
              <Play className="h-4 w-4 mr-2" />
              Start Studying
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-primary/10 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">Elapsed Time</p>
              <p className="text-4xl font-bold text-primary font-mono">{formatTime(elapsedTime)}</p>
            </div>

            <div className="space-y-2">
              <Badge className="w-full justify-center py-2 text-base" variant="secondary">
                {currentSession?.subject} - {currentSession?.task}
              </Badge>
            </div>

            <Button 
              onClick={stopTracking} 
              className="w-full" 
              variant="destructive" 
              size="lg"
              disabled={trackMutation.isPending}
            >
              {trackMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Square className="h-4 w-4 mr-2" />
                  Stop & Save
                </>
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
