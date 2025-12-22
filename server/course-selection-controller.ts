import { db } from "./db.js";
import { courses, userCourses } from "../shared/schema.js";
import { eq, inArray } from "drizzle-orm";

interface CourseAnalysis {
  totalCourses: number;
  totalDuration: number;
  averageDifficulty: string;
  categories: Record<string, number>;
  prerequisites: Record<string, string[]>;
  skillsRequired: string[];
}

interface PrerequisiteMap {
  courseId: number;
  prerequisites: number[];
  dependents: number[];
  order: number;
}

interface LearningSequence {
  courses: Array<{ id: number; order: number }>;
  phases: string[];
  estimatedDuration: number;
  difficulty: string;
}

interface CurriculumStructure {
  phases: any[];
  milestones: any[];
  assessmentPoints: any[];
  resourceAllocation: any[];
  timeline: any[];
}

/**
 * Smart Course Selection & Control System
 * AI-powered intelligent course selection and arrangement
 */
export class CourseSelectionController {
  /**
   * Analyze selected courses for coherence and coverage
   */
  async analyzeCourseSelection(courseIds: number[]): Promise<CourseAnalysis> {
    try {
      const selectedCourses = await db
        .select()
        .from(courses)
        .where(inArray(courses.id, courseIds));

      if (selectedCourses.length === 0) {
        return {
          totalCourses: 0,
          totalDuration: 0,
          averageDifficulty: 'none',
          categories: {},
          prerequisites: {},
          skillsRequired: []
        };
      }

      // Analyze course structure
      const analysis: CourseAnalysis = {
        totalCourses: selectedCourses.length,
        totalDuration: selectedCourses.reduce((sum, c) => sum + (c.durationHours || 40), 0),
        averageDifficulty: this._calculateAverageDifficulty(selectedCourses),
        categories: this._groupByCategory(selectedCourses),
        prerequisites: this._extractPrerequisites(selectedCourses),
        skillsRequired: this._extractSkills(selectedCourses)
      };

      return analysis;
    } catch (error) {
      console.error('Course analysis failed:', error);
      return {
        totalCourses: 0,
        totalDuration: 0,
        averageDifficulty: 'unknown',
        categories: {},
        prerequisites: {},
        skillsRequired: []
      };
    }
  }

  /**
   * Build prerequisite dependency tree
   */
  buildPrerequisiteTree(courseIds: number[]): PrerequisiteMap[] {
    const prerequisiteMap: PrerequisiteMap[] = [];
    const courseIdSet = new Set(courseIds);

    // Create mapping with order
    courseIds.forEach((courseId, index) => {
      prerequisiteMap.push({
        courseId,
        prerequisites: [], // In a real system, fetch from DB
        dependents: courseIds.filter((id, i) => i > index),
        order: index + 1
      });
    });

    // Sort by prerequisites (courses with no deps first)
    return prerequisiteMap.sort((a, b) => {
      if (a.prerequisites.length !== b.prerequisites.length) {
        return a.prerequisites.length - b.prerequisites.length;
      }
      return a.order - b.order;
    });
  }

  /**
   * Build optimal learning sequence based on prerequisites and constraints
   */
  buildOptimalSequence(courseIds: number[], constraints?: any): LearningSequence {
    const sorted = this.buildPrerequisiteTree(courseIds);
    const phases = this._createPhases(sorted.length);

    return {
      courses: sorted.map(p => ({ id: p.courseId, order: p.order })),
      phases,
      estimatedDuration: sorted.length * 40,
      difficulty: this._determineDifficulty(sorted.length)
    };
  }

  /**
   * Build comprehensive curriculum structure
   */
  buildCurriculumStructure(sequence: LearningSequence, constraints?: any): CurriculumStructure {
    const numCourses = sequence.courses.length;
    const weeksPerCourse = 4;

    return {
      phases: this._createLearningPhases(numCourses),
      milestones: this._setLearningMilestones(numCourses),
      assessmentPoints: this._placeAssessmentPoints(numCourses),
      resourceAllocation: this._allocateResources(numCourses),
      timeline: this._createLearningTimeline(numCourses, weeksPerCourse)
    };
  }

  /**
   * Estimate total completion time
   */
  estimateCompletionTime(sequence: LearningSequence): {
    totalHours: number;
    weeksAtNormalPace: number;
    weeksAtAcceleratedPace: number;
    weeksAtSlowPace: number;
  } {
    const totalHours = sequence.estimatedDuration;
    const weeklyHourNormal = 20;
    const weeklyHourAccelerated = 30;
    const weeklyHourSlow = 10;

    return {
      totalHours,
      weeksAtNormalPace: Math.ceil(totalHours / weeklyHourNormal),
      weeksAtAcceleratedPace: Math.ceil(totalHours / weeklyHourAccelerated),
      weeksAtSlowPace: Math.ceil(totalHours / weeklyHourSlow)
    };
  }

  /**
   * Calculate difficulty curve across courses
   */
  calculateDifficultyCurve(sequence: LearningSequence): Array<{ course: number; difficulty: number }> {
    const baseDifficulty = this._difficultyToScore(sequence.difficulty);
    
    return sequence.courses.map((course, index) => {
      // Gradually increase difficulty
      const progression = (index / Math.max(sequence.courses.length - 1, 1)) * 0.5;
      return {
        course: course.id,
        difficulty: Math.min(baseDifficulty + progression, 1.0)
      };
    });
  }

  // Private helper methods
  private _calculateAverageDifficulty(courses: any[]): string {
    const levels = courses.map(c => c.level || 'intermediate');
    const avg = levels.filter(l => l === 'advanced').length > levels.length / 2 ? 'advanced' : 
                levels.filter(l => l === 'beginner').length > levels.length / 2 ? 'beginner' :
                'intermediate';
    return avg;
  }

  private _groupByCategory(courses: any[]): Record<string, number> {
    const categories: Record<string, number> = {};
    courses.forEach(c => {
      const cat = c.category || 'other';
      categories[cat] = (categories[cat] || 0) + 1;
    });
    return categories;
  }

  private _extractPrerequisites(courses: any[]): Record<string, string[]> {
    const prqs: Record<string, string[]> = {};
    courses.forEach(c => {
      prqs[c.id] = []; // In real system, extract actual prerequisites
    });
    return prqs;
  }

  private _extractSkills(courses: any[]): string[] {
    const skills = new Set<string>();
    const skillMappings: Record<string, string[]> = {
      'mathematics': ['Algebra', 'Calculus', 'Statistics'],
      'programming': ['Coding', 'Algorithms', 'Data Structures'],
      'science': ['Physics', 'Chemistry', 'Biology'],
      'language': ['Communication', 'Writing', 'Reading']
    };

    courses.forEach(c => {
      Object.entries(skillMappings).forEach(([key, vals]) => {
        if ((c.titleEn || '').toLowerCase().includes(key)) {
          vals.forEach(s => skills.add(s));
        }
      });
    });
    return Array.from(skills);
  }

  private _createPhases(courseCount: number): string[] {
    const phases = [];
    const phasesNum = Math.ceil(courseCount / 3);
    for (let i = 1; i <= phasesNum; i++) {
      phases.push(`Phase ${i}`);
    }
    return phases;
  }

  private _determineDifficulty(courseCount: number): string {
    if (courseCount <= 3) return 'beginner';
    if (courseCount <= 6) return 'intermediate';
    return 'advanced';
  }

  private _createLearningPhases(courseCount: number): any[] {
    const phases = [];
    const coursesPerPhase = Math.max(1, Math.ceil(courseCount / 3));
    for (let i = 0; i < courseCount; i += coursesPerPhase) {
      phases.push({
        phase: Math.floor(i / coursesPerPhase) + 1,
        courses: Math.min(coursesPerPhase, courseCount - i),
        startWeek: i * 4 + 1,
        endWeek: Math.min((i + coursesPerPhase) * 4, courseCount * 4)
      });
    }
    return phases;
  }

  private _setLearningMilestones(courseCount: number): any[] {
    return [
      { id: 1, title: 'Start Learning', week: 1 },
      { id: 2, title: 'Midway Review', week: Math.ceil((courseCount * 4) / 2) },
      { id: 3, title: 'Final Assessment', week: courseCount * 4 }
    ];
  }

  private _placeAssessmentPoints(courseCount: number): any[] {
    const points = [];
    for (let i = 1; i <= courseCount; i++) {
      points.push({
        id: i,
        week: i * 4,
        type: 'course_completion',
        weight: 100 / courseCount
      });
    }
    return points;
  }

  private _allocateResources(courseCount: number): any[] {
    return [
      { type: 'videos', allocation: 40 },
      { type: 'readings', allocation: 30 },
      { type: 'exercises', allocation: 20 },
      { type: 'assessments', allocation: 10 }
    ];
  }

  private _createLearningTimeline(courseCount: number, weeksPerCourse: number): any[] {
    const timeline = [];
    for (let i = 1; i <= courseCount; i++) {
      const startWeek = (i - 1) * weeksPerCourse + 1;
      timeline.push({
        course: i,
        startWeek,
        endWeek: i * weeksPerCourse,
        duration: weeksPerCourse
      });
    }
    return timeline;
  }

  private _difficultyToScore(difficulty: string): number {
    switch (difficulty) {
      case 'beginner': return 0.3;
      case 'intermediate': return 0.6;
      case 'advanced': return 0.8;
      default: return 0.5;
    }
  }
}

// Singleton instance
export const courseSelectionController = new CourseSelectionController();
