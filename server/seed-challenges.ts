import { db } from "./db.js";
import { challenges, userLevels } from "../shared/schema.js";
import { storage } from "./storage.js";

export async function seedChallenges() {
  try {
    // Check if we already have challenges
    const existingChallenges = await db.select().from(challenges);
    
    if (existingChallenges.length === 0) {
      console.log("Seeding challenges...");
      
      // Create a variety of challenges
      const basicChallenges = [
        {
          title: "Complete Your First Course",
          description: "Enroll and complete your first course with 100% progress",
          type: "course" as const,
          category: "Achievement",
          difficulty: "easy" as const,
          pointsReward: 100,
          xpReward: 50,
          isActive: true,
          requirements: { completedCourses: 1 }
        },
        {
          title: "Learning Streak",
          description: "Log in and study for 7 consecutive days",
          type: "streak" as const,
          category: "Engagement",
          difficulty: "medium" as const,
          pointsReward: 150,
          xpReward: 75,
          isActive: true,
          requirements: { loginDays: 7 }
        },
        {
          title: "Knowledge Explorer",
          description: "Enroll in courses from 3 different categories",
          type: "course" as const,
          category: "Engagement",
          difficulty: "medium" as const,
          pointsReward: 200,
          xpReward: 100,
          isActive: true,
          requirements: { differentCategories: 3 }
        },
        {
          title: "Perfect Assignment",
          description: "Submit an assignment and receive a perfect score",
          type: "assignment" as const,
          category: "Mastery",
          difficulty: "hard" as const,
          pointsReward: 300,
          xpReward: 150,
          isActive: true,
          requirements: { assignmentScore: 100 }
        },
        {
          title: "Rapid Learner",
          description: "Complete a course in less than 2 days",
          type: "course" as const,
          category: "Time",
          difficulty: "hard" as const,
          pointsReward: 250,
          xpReward: 125,
          isActive: true,
          requirements: { completionDays: 2 }
        }
      ];
      
      // Bite-sized skill challenges for popups
      const skillChallenges = [
        {
          title: "Quick Quiz Master",
          description: "Complete 3 module quizzes with a score of 80% or higher",
          type: "skill" as const,
          category: "Knowledge",
          difficulty: "easy" as const,
          pointsReward: 75,
          xpReward: 30,
          isActive: true,
          requirements: { quizScore: 80, quizCount: 3 }
        },
        {
          title: "Fast Learner",
          description: "Complete a lesson in under 10 minutes",
          type: "skill" as const,
          category: "Time",
          difficulty: "easy" as const,
          pointsReward: 50,
          xpReward: 25,
          isActive: true,
          requirements: { lessonTimeMinutes: 10 }
        },
        {
          title: "Note Taker",
          description: "Take notes on 5 different lessons",
          type: "skill" as const,
          category: "Engagement",
          difficulty: "easy" as const,
          pointsReward: 60,
          xpReward: 30,
          isActive: true,
          requirements: { notesCount: 5 }
        },
        {
          title: "Code Snippet Master",
          description: "Complete 3 coding exercises in a programming course",
          type: "skill" as const,
          category: "Mastery",
          difficulty: "medium" as const,
          pointsReward: 120,
          xpReward: 60,
          isActive: true,
          requirements: { codingExercises: 3 }
        },
        {
          title: "Weekend Warrior",
          description: "Study for at least 2 hours during the weekend",
          type: "skill" as const,
          category: "Dedication",
          difficulty: "medium" as const,
          pointsReward: 100,
          xpReward: 50,
          isActive: true,
          requirements: { weekendHours: 2 }
        },
        {
          title: "Morning Learner",
          description: "Complete a lesson before 9 AM",
          type: "skill" as const,
          category: "Timing",
          difficulty: "medium" as const,
          pointsReward: 80,
          xpReward: 40,
          isActive: true,
          requirements: { beforeHour: 9 }
        },
        {
          title: "Visual Learner",
          description: "Watch all video content in a module",
          type: "skill" as const,
          category: "Content",
          difficulty: "easy" as const,
          pointsReward: 70,
          xpReward: 35,
          isActive: true,
          requirements: { videosWatched: "all" }
        }
      ];
      
      // Daily popup challenges
      const dailyChallenges = [
        {
          title: "Daily Focus Session",
          description: "Complete at least one lesson today",
          type: "daily" as const,
          category: "Consistency",
          difficulty: "easy" as const,
          pointsReward: 40,
          xpReward: 20,
          isActive: true,
          requirements: { dailyLessons: 1 }
        },
        {
          title: "Daily Practice",
          description: "Complete at least one exercise today",
          type: "daily" as const,
          category: "Practice",
          difficulty: "easy" as const,
          pointsReward: 45,
          xpReward: 25,
          isActive: true,
          requirements: { dailyExercises: 1 }
        },
        {
          title: "Study Milestone",
          description: "Study for at least 30 minutes today",
          type: "daily" as const,
          category: "Time",
          difficulty: "easy" as const,
          pointsReward: 50,
          xpReward: 25,
          isActive: true,
          requirements: { dailyMinutes: 30 }
        }
      ];
      
      // Combine all challenges
      const challengesToCreate = [...basicChallenges, ...skillChallenges, ...dailyChallenges];
      
      for (const challenge of challengesToCreate) {
        await storage.createChallenge(challenge);
      }
      
      console.log("Successfully seeded challenges!");
    } else {
      console.log("Challenges already exist, skipping seeding.");
    }
    
    // Initialize user level for admin user
    const adminUser = await storage.getUserByUsername('admin');
    
    if (adminUser) {
      const userLevel = await storage.getUserLevel(adminUser.id);
      
      if (!userLevel) {
        console.log(`Initializing level for admin user...`);
        await storage.initializeUserLevel(adminUser.id);
      }
    }
    
    console.log("Challenge system initialization completed!");
    
  } catch (error) {
    console.error("Error seeding challenges:", error);
  }
}