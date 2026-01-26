import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { BookOpen, Clock, Users, Star, PlayCircle, ArrowRight } from 'lucide-react';
import MainNavbar from '@/components/layout/MainNavbar';
import AuthGuard from '@/components/auth/AuthGuard';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  instructor: string;
  duration: number; // in minutes
  rating: number;
  enrolledCount: number;
  thumbnail?: string;
  level: 'beginner' | 'intermediate' | 'advanced';
}

export default function Courses() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock categories - replace with actual categories from your data
  const categories = ['all', 'matematik', 'fizik', 'kimya', 'biyoloji', 'tarih', 'coğrafya'];

  useEffect(() => {
    // TODO: Replace with actual API call to fetch courses
    // For now, using mock data
    const fetchCourses = async () => {
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock courses data
        const mockCourses: Course[] = [
          {
            id: '1',
            title: 'TYT Matematik Temel Kavramlar',
            description: 'TYT matematik için temel kavramları öğrenin ve pratik yapın',
            category: 'matematik',
            instructor: 'Prof. Ahmet Yılmaz',
            duration: 120,
            rating: 4.8,
            enrolledCount: 1250,
            level: 'beginner'
          },
          {
            id: '2',
            title: 'AYT Fizik - Mekanik',
            description: 'AYT fizik mekanik konularını detaylı şekilde öğrenin',
            category: 'fizik',
            instructor: 'Dr. Zeynep Kaya',
            duration: 180,
            rating: 4.9,
            enrolledCount: 890,
            level: 'intermediate'
          },
          {
            id: '3',
            title: 'TYT Türkçe - Dil Bilgisi',
            description: 'TYT Türkçe dil bilgisi konularını kapsamlı şekilde öğrenin',
            category: 'turkce',
            instructor: 'Öğr. Gör. Mehmet Demir',
            duration: 90,
            rating: 4.7,
            enrolledCount: 2100,
            level: 'beginner'
          }
        ];

        setCourses(mockCourses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        setCourses([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  const filteredCourses = selectedCategory === 'all' 
    ? courses 
    : courses.filter(course => course.category === selectedCategory);

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
          <MainNavbar />
          <div className="flex items-center justify-center h-screen">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="mt-4 text-gray-600">Kurslar yükleniyor...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <MainNavbar />
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Kurslar</h1>
            <p className="text-gray-600">
              İstediğiniz konuda uzman eğitmenlerden öğrenin
            </p>
          </div>

          {/* Category Filter */}
          <div className="mb-6 flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                }`}
              >
                {category === 'all' ? 'Tümü' : category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>

          {/* Courses Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <div
                  key={course.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => setLocation(`/courses/${course.id}`)}
                >
                  <div className="mb-4">
                    <div className="w-full h-40 bg-gradient-to-br from-blue-400 to-purple-500 rounded-lg mb-4 flex items-center justify-center">
                      <BookOpen className="h-16 w-16 text-white opacity-80" />
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        course.level === 'beginner' 
                          ? 'bg-green-100 text-green-700'
                          : course.level === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {course.level === 'beginner' ? 'Başlangıç' : course.level === 'intermediate' ? 'Orta' : 'İleri'}
                      </span>
                      <span className="px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        {course.category}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{course.title}</h3>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{course.description}</p>
                  </div>

                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Users className="h-4 w-4 mr-2" />
                      <span>{course.instructor}</span>
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-2" />
                      <span>{course.duration} dakika</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-1 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{course.rating}</span>
                      </div>
                      <span className="text-sm text-gray-500">{course.enrolledCount} öğrenci</span>
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setLocation(`/courses/${course.id}`);
                    }}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <PlayCircle className="h-4 w-4" />
                    <span>Kursa Git</span>
                  </button>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Henüz kurs yok</h3>
                <p className="text-gray-600">
                  Bu kategoride henüz kurs bulunmamaktadır.
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
