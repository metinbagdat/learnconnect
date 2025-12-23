import type { UserGoal, UserInterest, StudyPlan, CourseSuggestion, GoalSuggestion } from "../../shared/schema.js";

// Pre-defined goal suggestions based on career paths
const CAREER_GOAL_MAPPINGS: Record<string, string[]> = {
  "web_developer": ["Learn HTML/CSS", "Master JavaScript", "Learn React", "Learn Backend Development", "Build Portfolio"],
  "data_scientist": ["Python Fundamentals", "Statistics & Probability", "Machine Learning", "Data Visualization", "Deep Learning"],
  "mobile_developer": ["Learn Swift", "Learn Kotlin", "Mobile UI Design", "API Integration", "App Publishing"],
  "devops_engineer": ["Linux Fundamentals", "Docker & Containers", "Kubernetes", "CI/CD Pipelines", "Cloud Platforms"],
};

const INTEREST_COURSE_MAPPING: Record<string, string[]> = {
  programming: ["Python 101", "JavaScript Basics", "Web Development", "Advanced OOP"],
  mathematics: ["Algebra", "Calculus", "Statistics", "Linear Algebra"],
  science: ["Physics 101", "Chemistry Basics", "Biology", "Biochemistry"],
  design: ["UI Design", "UX Design", "Graphic Design", "Web Design"],
};

export class AISuggestionEngine {
  // Generate personalized goal suggestions based on user profile
  generateGoalSuggestions(
    userId: number,
    educationalBackground: string,
    careerGoal: string,
    interests: string[]
  ): { goal: string; type: string; confidence: number; relatedCourses: string[] }[] {
    const suggestions: Array<{ goal: string; type: string; confidence: number; relatedCourses: string[] }> = [];

    // Get career-based goals
    if (careerGoal && CAREER_GOAL_MAPPINGS[careerGoal.toLowerCase()]) {
      const careerGoals = CAREER_GOAL_MAPPINGS[careerGoal.toLowerCase()];
      careerGoals.forEach((goal, index) => {
        suggestions.push({
          goal,
          type: "career",
          confidence: 0.9 - index * 0.1, // Decreasing confidence
          relatedCourses: INTEREST_COURSE_MAPPING[interests[index % interests.length]] || [],
        });
      });
    }

    // Add interest-based goals
    interests.forEach((interest) => {
      suggestions.push({
        goal: `Master ${interest}`,
        type: "skill",
        confidence: 0.7,
        relatedCourses: INTEREST_COURSE_MAPPING[interest.toLowerCase()] || [],
      });
    });

    return suggestions.slice(0, 5); // Top 5 suggestions
  }

  // Generate course recommendations based on goals and interests
  generateCourseSuggestions(
    userId: number,
    goals: UserGoal[],
    interests: UserInterest[],
    allCourses: any[]
  ): { courseId: number; reason: string; confidence: number }[] {
    const suggestions: Array<{ courseId: number; reason: string; confidence: number }> = [];
    const matchedCourses = new Set<number>();

    // Goal-based suggestions
    goals.forEach((goal) => {
      allCourses.forEach((course) => {
        const courseTagsStr = (course.tags || "").toLowerCase();
        const goalStr = goal.goalText.toLowerCase();

        if (courseTagsStr.includes(goalStr) || goalStr.includes(courseTagsStr)) {
          if (!matchedCourses.has(course.id)) {
            suggestions.push({
              courseId: course.id,
              reason: `Aligns with your goal: "${goal.goalText}"`,
              confidence: 0.85,
            });
            matchedCourses.add(course.id);
          }
        }
      });
    });

    // Interest-based suggestions
    interests.forEach((interest) => {
      allCourses.forEach((course) => {
        const courseTagsStr = (course.tags || "").toLowerCase();
        const interestStr = interest.interest.toLowerCase();

        if (courseTagsStr.includes(interestStr)) {
          if (!matchedCourses.has(course.id)) {
            suggestions.push({
              courseId: course.id,
              reason: `Matches your interest in ${interest.interest}`,
              confidence: 0.75, // Default confidence since relevanceScore not in schema
            });
            matchedCourses.add(course.id);
          }
        }
      });
    });

    return suggestions.sort((a, b) => b.confidence - a.confidence).slice(0, 10);
  }

  // Generate personalized study plan
  generateStudyPlan(
    courseId: number,
    courseDurationHours: number,
    weeklyAvailableHours: number,
    goalDeadline?: Date
  ): { endDate: Date; weeklyHours: number; milestoneDates: Date[] } {
    const weeksNeeded = courseDurationHours / weeklyAvailableHours;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + weeksNeeded * 7 * 24 * 60 * 60 * 1000);

    // Adjust if goal deadline exists
    if (goalDeadline && endDate > goalDeadline) {
      const adjustedWeeklyHours = courseDurationHours / ((goalDeadline.getTime() - startDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
      return {
        endDate: goalDeadline,
        weeklyHours: Math.ceil(adjustedWeeklyHours),
        milestoneDates: this.generateMilestoneDates(startDate, goalDeadline, 4),
      };
    }

    return {
      endDate,
      weeklyHours: weeklyAvailableHours,
      milestoneDates: this.generateMilestoneDates(startDate, endDate, 4),
    };
  }

  private generateMilestoneDates(start: Date, end: Date, count: number): Date[] {
    const milestones = [];
    const interval = (end.getTime() - start.getTime()) / (count + 1);

    for (let i = 1; i <= count; i++) {
      milestones.push(new Date(start.getTime() + interval * i));
    }

    return milestones;
  }

  // Calculate goal progress
  calculateGoalProgress(goal: UserGoal, userCourses: any[]): number {
    const goalWithExtras = goal as UserGoal & { courseIds?: number[] };
    if (!goalWithExtras.courseIds || goalWithExtras.courseIds.length === 0) return 0;

    const completedCourses = userCourses.filter(
      (uc) => goalWithExtras.courseIds!.includes(uc.courseId) && uc.completed
    ).length;

    return Math.round((completedCourses / goalWithExtras.courseIds.length) * 100);
  }

  // Generate recommendations based on user behavior
  generateNextStepRecommendation(
    userId: number,
    userGoals: UserGoal[],
    enrolledCourses: any[],
    completedCourses: any[]
  ): { type: string; recommendation: string; urgency: "low" | "medium" | "high" }[] {
    const recommendations: Array<{ type: string; recommendation: string; urgency: "low" | "medium" | "high" }> = [];

    // Check for stalled courses
    enrolledCourses.forEach((course) => {
      if (course.progress < 50 && (!course.lastAccessedAt || Date.now() - new Date(course.lastAccessedAt).getTime() > 7 * 24 * 60 * 60 * 1000)) {
        recommendations.push({
          type: "resume_course",
          recommendation: `Resume "${course.courseTitle}" - you're ${course.progress}% through`,
          urgency: "high" as const,
        });
      }
    });

    // Check for goals without courses
    userGoals.forEach((goal) => {
      const goalWithExtras = goal as UserGoal & { status?: string; courseIds?: number[] };
      if (goalWithExtras.status === "active" && (!goalWithExtras.courseIds || goalWithExtras.courseIds.length === 0)) {
        recommendations.push({
          type: "enroll_course",
          recommendation: `Enroll in a course to progress on your goal: "${goal.goalText}"`,
          urgency: "medium" as const,
        });
      }
    });

    // Suggest new course after completion
    if (completedCourses.length > 0 && enrolledCourses.length < 3) {
      recommendations.push({
        type: "new_course",
        recommendation: "Great progress! Consider enrolling in a new course",
        urgency: "low" as const,
      });
    }

    return recommendations;
  }
}

export const aiSuggestionEngine = new AISuggestionEngine();
