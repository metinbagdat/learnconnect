import { useState } from 'react';
import { ChevronRight, ChevronDown, BookOpen, GraduationCap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/consolidated-language-context';
import { getLocalizedField } from '@/lib/language-utils';

interface Lesson {
  id: number;
  title: string;
  titleEn?: string;
  titleTr?: string;
  order: number;
}

interface Unit {
  id: number;
  title: string;
  titleEn?: string;
  titleTr?: string;
  order: number;
  lessons?: Lesson[];
}

interface Course {
  id: number;
  title: string;
  titleEn?: string;
  titleTr?: string;
  description?: string;
  descriptionEn?: string;
  descriptionTr?: string;
  order: number;
  units?: Unit[];
}

interface ExamCategory {
  id: number;
  code: string;
  name: string;
  nameEn?: string;
  nameTr?: string;
  courses?: Course[];
}

interface ExamCategoryTreeProps {
  data: ExamCategory[];
  showEnrollButton?: boolean;
  onEnroll?: (courseId: number) => void;
}

function CourseNode({ course, showEnrollButton = false, onEnroll }: { course: Course; showEnrollButton?: boolean; onEnroll?: (courseId: number) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useLanguage();
  
  const title = getLocalizedField(course, 'title', language) || 'Untitled Course';
  const description = getLocalizedField(course, 'description', language) || '';
  const hasUnits = course.units && course.units.length > 0;

  return (
    <div className="space-y-2 ml-4">
      <Card className="bg-white border border-gray-200 hover:shadow-md transition-shadow">
        <div className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                {hasUnits && (
                  <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="text-gray-600 hover:text-gray-900"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                )}
                <BookOpen className="h-4 w-4 text-blue-500" />
                <h4 className="font-semibold text-gray-900">{title}</h4>
              </div>
              {description && (
                <p className="text-sm text-gray-600 mt-1 ml-6">{description}</p>
              )}
            </div>
            {showEnrollButton && onEnroll && (
              <Button
                onClick={() => onEnroll(course.id)}
                size="sm"
                className="ml-4 bg-blue-600 hover:bg-blue-700"
              >
                Enroll
              </Button>
            )}
          </div>
        </div>
      </Card>
      
      {isExpanded && hasUnits && (
        <div className="ml-4 space-y-2">
          {course.units!.map((unit) => (
            <UnitNode key={unit.id} unit={unit} />
          ))}
        </div>
      )}
    </div>
  );
}

function UnitNode({ unit }: { unit: Unit }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { language } = useLanguage();
  
  const title = getLocalizedField(unit, 'title', language) || 'Untitled Unit';
  const hasLessons = unit.lessons && unit.lessons.length > 0;

  return (
    <div className="space-y-1 ml-4">
      <Card className="bg-gray-50 border border-gray-200">
        <div className="p-3">
          <div className="flex items-center gap-2">
            {hasLessons && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-gray-600 hover:text-gray-900"
              >
                {isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </button>
            )}
            <span className="text-sm font-medium text-gray-700">{title}</span>
          </div>
        </div>
      </Card>
      
      {isExpanded && hasLessons && (
        <div className="ml-4 space-y-1">
          {unit.lessons!.map((lesson) => (
            <div
              key={lesson.id}
              className="text-xs text-gray-600 pl-4 py-1 border-l-2 border-gray-200"
            >
              {getLocalizedField(lesson, 'title', language) || 'Untitled Lesson'}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function ExamCategoryTree({ data, showEnrollButton = false, onEnroll }: ExamCategoryTreeProps) {
  const { language } = useLanguage();

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No exam categories available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {data.map((category) => {
        const categoryName = getLocalizedField(category as any, 'name', language) || (category as any).code || 'Unknown Category';
        const courses = category.courses || [];

        return (
          <div key={category.id} className="space-y-3">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-300">
              <GraduationCap className="h-5 w-5 text-purple-600" />
              <h3 className="text-lg font-bold text-gray-900">{categoryName}</h3>
              <span className="text-sm text-gray-500">({courses.length} courses)</span>
            </div>

            {courses.length > 0 ? (
              <div className="space-y-2">
                {courses.map((course) => (
                  <CourseNode
                    key={course.id}
                    course={course}
                    showEnrollButton={showEnrollButton}
                    onEnroll={onEnroll}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 ml-6">No courses available in this category.</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

