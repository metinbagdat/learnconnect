import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { Users, BookOpen, TrendingUp, Calendar, CheckCircle2, AlertCircle } from 'lucide-react';
import AuthGuard from '@/components/auth/AuthGuard';
import MainNavbar from '@/components/layout/MainNavbar';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Student {
  id: number;
  username: string;
  displayName: string;
  email?: string;
  progress?: {
    totalTopics: number;
    completedTopics: number;
    completionRate: number;
    lastActivity?: string;
  };
}

interface ClassProgress {
  classId: string;
  className: string;
  studentCount: number;
  averageProgress: number;
  students: Student[];
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const [classes, setClasses] = useState<ClassProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== 'teacher' && user?.role !== 'admin') {
      window.location.href = '/dashboard';
      return;
    }
    loadTeacherData();
  }, [user]);

  async function loadTeacherData() {
    try {
      const res = await fetch('/api/teacher/classes');
      if (!res.ok) throw new Error('Failed to load classes');
      const data = await res.json();
      setClasses(data.classes || []);
    } catch (error) {
      console.error('Error loading teacher data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
          <MainNavbar />
          <div className="max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                <p className="mt-4 text-gray-600">Yükleniyor...</p>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const selectedClassData = classes.find(c => c.classId === selectedClass || (!selectedClass && classes.length > 0));

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <MainNavbar />
        <main className="max-w-7xl mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Öğretmen Paneli</h1>
            <p className="text-gray-600">
              Sınıflarınızı ve öğrencilerinizin ilerlemesini görüntüleyin
            </p>
          </div>

          {classes.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Henüz sınıf atanmamış</h3>
                <p className="text-gray-600 mb-4">
                  Admin tarafından size sınıf atandığında burada görünecektir.
                </p>
                <Link href="/admin">
                  <Button variant="outline">Admin Paneline Git</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Sınıf Listesi */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Sınıflar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {classes.map((cls) => (
                        <button
                          key={cls.classId}
                          onClick={() => setSelectedClass(cls.classId)}
                          className={`w-full text-left p-3 rounded-lg border transition ${
                            selectedClass === cls.classId || (!selectedClass && classes[0]?.classId === cls.classId)
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-gray-300'
                          }`}
                        >
                          <div className="font-medium text-gray-800">{cls.className}</div>
                          <div className="text-sm text-gray-600 mt-1">
                            {cls.studentCount} öğrenci • %{Math.round(cls.averageProgress)} ilerleme
                          </div>
                        </button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Öğrenci Listesi ve İlerleme */}
              <div className="lg:col-span-2">
                {selectedClassData ? (
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>{selectedClassData.className}</CardTitle>
                        <CardDescription>
                          {selectedClassData.studentCount} öğrenci • Ortalama %{Math.round(selectedClassData.averageProgress)} ilerleme
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {selectedClassData.students.map((student) => (
                            <div
                              key={student.id}
                              className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                            >
                              <div className="flex-1">
                                <div className="font-medium text-gray-800">{student.displayName || student.username}</div>
                                {student.progress && (
                                  <div className="mt-2">
                                    <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                                      <span>
                                        {student.progress.completedTopics} / {student.progress.totalTopics} konu
                                      </span>
                                      <span className="font-medium">%{Math.round(student.progress.completionRate)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                      <div
                                        className="bg-blue-600 h-2 rounded-full transition-all"
                                        style={{ width: `${student.progress.completionRate}%` }}
                                      />
                                    </div>
                                    {student.progress.lastActivity && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Son aktivite: {new Date(student.progress.lastActivity).toLocaleDateString('tr-TR')}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                              <div className="ml-4">
                                <Link href={`/teacher/students/${student.id}`}>
                                  <Button variant="outline" size="sm">
                                    Detay
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    {/* İstatistikler */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Toplam Öğrenci</p>
                              <p className="text-2xl font-bold text-gray-800">{selectedClassData.studentCount}</p>
                            </div>
                            <Users className="h-8 w-8 text-blue-600" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Ortalama İlerleme</p>
                              <p className="text-2xl font-bold text-gray-800">
                                %{Math.round(selectedClassData.averageProgress)}
                              </p>
                            </div>
                            <TrendingUp className="h-8 w-8 text-green-600" />
                          </div>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm text-gray-600">Aktif Öğrenci</p>
                              <p className="text-2xl font-bold text-gray-800">
                                {selectedClassData.students.filter(s => s.progress && s.progress.completionRate > 0).length}
                              </p>
                            </div>
                            <CheckCircle2 className="h-8 w-8 text-emerald-600" />
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                ) : (
                  <Card>
                    <CardContent className="p-8 text-center text-gray-600">
                      Sınıf seçin
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </AuthGuard>
  );
}
