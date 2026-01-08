import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/contexts/consolidated-language-context";
import { Sidebar } from "@/components/layout/sidebar";
import ModernNavigation from "@/components/layout/modern-navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, CheckCircle, AlertCircle, Brain, Clock, Target } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { StudyPlanDashboardData } from "@/types/dashboard";

export default function StudyPlanDashboard() {
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { toast } = useToast();
  const [showTutor, setShowTutor] = useState(false);

  const { data: studyPlans = [], isLoading: plansLoading } = useQuery({
    queryKey: ["/api/study-plans"],
    enabled: !!user,
  });

  const { data: data } = useQuery<StudyPlanDashboardData>({
    queryKey: ["/api/assignments/upcoming"],
    enabled: !!user,
  });

  // Fix assignments usage
  const assignments = Array.isArray(data?.assignments) ? data.assignments : [];
  const assignmentsLoading = false;
  
  // Fix modules property access
  const modules = data?.modules || [];

  const { data: learningPath, isLoading: pathLoading } = useQuery({
    queryKey: ["/api/learning-path"],
    enabled: !!user,
  });

  const completedCount = assignments.filter((a: any) => a.completed).length;
  const completionPercentage = assignments.length > 0 ? Math.round((completedCount / assignments.length) * 100) : 0;

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getDaysUntilDue = (dueDate: string | Date) => {
    const days = Math.ceil((new Date(dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getUrgencyColor = (daysLeft: number) => {
    if (daysLeft <= 3) return "destructive";
    if (daysLeft <= 7) return "warning";
    return "default";
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50">
      <ModernNavigation pageTitle={language === 'tr' ? "Çalışma Planı" : "Study Plan"} currentPage="study-plan" />
      
      <div className="flex flex-1 overflow-hidden">
        <div className="hidden md:flex md:flex-shrink-0">
          <Sidebar />
        </div>

        <main className="flex-1 overflow-y-auto">
          <div className="py-8 px-4 sm:px-6 md:px-8">
            <div className="max-w-6xl mx-auto space-y-8">
              {/* Header */}
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">
                    {language === 'tr' ? "Kişiselleştirilmiş Çalışma Planınız" : "Your Personalized Study Plan"}
                  </h1>
                  <p className="text-slate-600 mt-2">
                    {language === 'tr' ? "Kurs kaydınıza dayalı olarak oluşturulmuş yapılandırılmış öğrenme yolunuz" : "Your structured learning path created based on your course enrollment"}
                  </p>
                </div>
                <Button 
                  onClick={() => setShowTutor(!showTutor)}
                  className="bg-gradient-to-r from-blue-500 to-purple-600"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {language === 'tr' ? "AI Koç" : "AI Tutor"}
                </Button>
              </div>

              {/* Progress Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>{language === 'tr' ? "Genel İlerleme" : "Overall Progress"}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-600">{language === 'tr' ? "Tamamlanan Görevler" : "Completed Tasks"}</p>
                      <p className="text-2xl font-bold text-slate-900">{completedCount}/{assignments.length}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-slate-600">{language === 'tr' ? "Tamamlanma Yüzdesi" : "Completion Rate"}</p>
                      <p className="text-2xl font-bold text-blue-600">{completionPercentage}%</p>
                    </div>
                  </div>
                  <Progress value={completionPercentage} className="h-3" />
                </CardContent>
              </Card>

              {/* Learning Path Timeline */}
              {learningPath && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="w-5 h-5" />
                      {language === 'tr' ? "Öğrenme Yolunuz" : "Learning Path"}
                    </CardTitle>
                    <CardDescription>
                      {language === 'tr' ? "Kişiselleştirilmiş modüller ve dersler" : "Personalized modules and lessons"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {learningPath.modules?.map((module: any, index: number) => (
                        <div key={module.id} className="flex gap-4">
                          <div className="flex flex-col items-center">
                            <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold">
                              {index + 1}
                            </div>
                            {index < (learningPath.modules?.length || 0) - 1 && (
                              <div className="w-0.5 h-12 bg-blue-200 mt-2" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <h3 className="font-semibold text-slate-900">{module.title}</h3>
                            <p className="text-sm text-slate-600 mt-1">{module.description}</p>
                            <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                              <Clock className="w-3 h-3" />
                              <span>{module.duration || 30} minutes</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Assignments Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    {language === 'tr' ? "Yapılacaklar (Cumulative Due Dates)" : "Assignments (Cumulative Timeline)"}
                  </CardTitle>
                  <CardDescription>
                    {language === 'tr' ? "Zamanlanmış görevler ve son teslim tarihleri" : "Scheduled assignments with cumulative due dates"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {assignmentsLoading ? (
                      <p className="text-slate-600">{language === 'tr' ? "Yükleniyor..." : "Loading..."}</p>
                    ) : assignments.length === 0 ? (
                      <p className="text-slate-600 text-center py-8">
                        {language === 'tr' ? "Henüz görev yok" : "No assignments yet"}
                      </p>
                    ) : (
                      assignments.map((assignment: any, index: number) => {
                        const daysLeft = getDaysUntilDue(assignment.dueDate);
                        const isOverdue = daysLeft < 0;
                        const isCompleted = assignment.completed;

                        return (
                          <div 
                            key={assignment.id}
                            className="flex gap-4 p-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                          >
                            <div className="flex-shrink-0">
                              {isCompleted ? (
                                <CheckCircle className="w-6 h-6 text-green-600" />
                              ) : isOverdue ? (
                                <AlertCircle className="w-6 h-6 text-red-600" />
                              ) : (
                                <div className="w-6 h-6 rounded-full border-2 border-blue-400" />
                              )}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h4 className="font-semibold text-slate-900">{assignment.title}</h4>
                                  <p className="text-sm text-slate-600 mt-1">{assignment.description}</p>
                                </div>
                                <Badge variant={getUrgencyColor(daysLeft)}>
                                  {isOverdue 
                                    ? (language === 'tr' ? "Gecikmiş" : "Overdue")
                                    : isCompleted
                                    ? (language === 'tr' ? "Tamamlandı" : "Completed")
                                    : `${daysLeft} ${language === 'tr' ? 'gün' : 'days'}`
                                  }
                                </Badge>
                              </div>
                              <div className="mt-3 flex items-center gap-4 text-xs text-slate-500">
                                <div className="flex items-center gap-1">
                                  <Calendar className="w-3 h-3" />
                                  <span>{formatDate(assignment.dueDate)}</span>
                                </div>
                                {assignment.points && (
                                  <div className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    <span>{assignment.points} pts</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* AI Tutor Chat */}
              {showTutor && (
                <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-purple-50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-900">
                      <Brain className="w-5 h-5" />
                      {language === 'tr' ? "AI Kişisel Koçunuz" : "Your AI Personal Tutor"}
                    </CardTitle>
                    <CardDescription className="text-blue-800">
                      {language === 'tr' ? "Çalışma planınız hakkında soru sorun" : "Ask questions about your study plan"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <AIChatTutor studyPlans={studyPlans} assignments={assignments} />
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

function AIChatTutor({ studyPlans, assignments }: any) {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { language } = useLanguage();
  const { toast } = useToast();

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await apiRequest("POST", "/api/ai/study-plan-tutor", {
        message: input,
        studyPlans,
        assignments,
        context: { language }
      });
      const data = await response.json();
      setMessages(prev => [...prev, { role: "assistant", content: data.response }]);
    } catch (error) {
      toast({
        title: language === 'tr' ? "Hata" : "Error",
        description: language === 'tr' ? "Koç ile iletişim kurulamadı" : "Failed to reach tutor",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 max-h-96 overflow-y-auto">
      {messages.length === 0 && (
        <p className="text-center text-slate-600 py-8">
          {language === 'tr' ? "Merhaba! Çalışma planınız hakkında nasıl yardımcı olabilirim?" : "Hi! How can I help you with your study plan?"}
        </p>
      )}
      {messages.map((msg, idx) => (
        <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
          <div className={`max-w-xs px-4 py-2 rounded-lg ${
            msg.role === 'user' 
              ? 'bg-blue-600 text-white' 
              : 'bg-white text-slate-900 border border-slate-200'
          }`}>
            {msg.content}
          </div>
        </div>
      ))}
      {loading && <div className="text-center text-sm text-slate-500">Düşünüyorum...</div>}
      
      <div className="flex gap-2 pt-4 border-t border-slate-200">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder={language === 'tr' ? "Sorunuzu yazın..." : "Ask your question..."}
          className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={loading}
        />
        <Button onClick={sendMessage} disabled={loading} size="sm">
          {language === 'tr' ? "Gönder" : "Send"}
        </Button>
      </div>
    </div>
  );
}
