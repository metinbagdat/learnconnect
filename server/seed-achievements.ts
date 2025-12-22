import { db } from "./db.js";
import { achievements, leaderboards } from "../shared/schema.js";
import { eq } from "drizzle-orm";

export async function seedAchievements() {
  try {
    console.log("Checking for existing achievements...");
    
    // Check if achievements already exist
    const existingAchievements = await db.select().from(achievements).limit(1);
    
    if (existingAchievements.length > 0) {
      console.log("Achievements already exist, skipping seeding.");
      return;
    }

    console.log("Seeding achievements...");

    // Seed achievements
    const achievementsData = [
      {
        title: "First Steps",
        description: "Complete your first lesson",
        category: "academic",
        rarity: "common",
        pointsReward: 10,
        xpReward: 25,
        imageUrl: null,
        requirements: JSON.stringify({ lessonsCompleted: 1 })
      },
      {
        title: "Course Starter",
        description: "Enroll in your first course",
        category: "engagement",
        rarity: "common", 
        pointsReward: 15,
        xpReward: 30,
        imageUrl: null,
        requirements: JSON.stringify({ coursesEnrolled: 1 })
      },
      {
        title: "Dedicated Learner",
        description: "Complete 5 lessons in a row",
        category: "academic",
        rarity: "uncommon",
        pointsReward: 25,
        xpReward: 50,
        imageUrl: null,
        requirements: JSON.stringify({ consecutiveLessons: 5 })
      },
      {
        title: "Course Completionist",
        description: "Complete your first course",
        category: "mastery",
        rarity: "uncommon",
        pointsReward: 50,
        xpReward: 100,
        imageUrl: null,
        requirements: JSON.stringify({ coursesCompleted: 1 })
      },
      {
        title: "Knowledge Seeker",
        description: "Complete 10 lessons",
        category: "academic",
        rarity: "uncommon",
        pointsReward: 40,
        xpReward: 75,
        imageUrl: null,
        requirements: JSON.stringify({ lessonsCompleted: 10 })
      },
      {
        title: "Challenge Champion",
        description: "Complete 5 challenges",
        category: "engagement",
        rarity: "rare",
        pointsReward: 75,
        xpReward: 150,
        imageUrl: null,
        requirements: JSON.stringify({ challengesCompleted: 5 })
      },
      {
        title: "Streak Master",
        description: "Maintain a 7-day learning streak",
        category: "engagement",
        rarity: "rare",
        pointsReward: 100,
        xpReward: 200,
        imageUrl: null,
        requirements: JSON.stringify({ streak: 7 })
      },
      {
        title: "Course Explorer",
        description: "Complete 3 different courses",
        category: "mastery",
        rarity: "rare",
        pointsReward: 150,
        xpReward: 300,
        imageUrl: null,
        requirements: JSON.stringify({ coursesCompleted: 3 })
      },
      {
        title: "Academic Excellence",
        description: "Complete 50 lessons with high scores",
        category: "mastery",
        rarity: "epic",
        pointsReward: 200,
        xpReward: 400,
        imageUrl: null,
        requirements: JSON.stringify({ lessonsCompleted: 50, averageScore: 85 })
      },
      {
        title: "Learning Legend",
        description: "Complete 10 courses",
        category: "mastery",
        rarity: "legendary",
        pointsReward: 500,
        xpReward: 1000,
        imageUrl: null,
        requirements: JSON.stringify({ coursesCompleted: 10 })
      },
      {
        title: "Social Learner",
        description: "Share your progress with friends",
        category: "social",
        rarity: "common",
        pointsReward: 20,
        xpReward: 40,
        imageUrl: null,
        requirements: JSON.stringify({ progressShared: 1 })
      },
      {
        title: "Mentor",
        description: "Help 5 fellow students",
        category: "social",
        rarity: "rare",
        pointsReward: 100,
        xpReward: 200,
        imageUrl: null,
        requirements: JSON.stringify({ studentsHelped: 5 })
      }
    ];

    await db.insert(achievements).values(achievementsData);

    console.log("Seeding leaderboards...");

    // Seed leaderboards
    const leaderboardsData = [
      {
        name: "Weekly XP Leaders",
        description: "Top learners by XP earned this week",
        type: "xp",
        timeframe: "weekly",
        isActive: true,
        startDate: new Date(),
        endDate: null
      },
      {
        name: "Monthly Course Completions",
        description: "Most courses completed this month",
        type: "courses",
        timeframe: "monthly", 
        isActive: true,
        startDate: new Date(),
        endDate: null
      },
      {
        name: "All-Time Points Champions",
        description: "Highest point earners of all time",
        type: "points",
        timeframe: "all-time",
        isActive: true,
        startDate: new Date(),
        endDate: null
      },
      {
        name: "Daily Challenge Masters",
        description: "Top performers in daily challenges",
        type: "challenges",
        timeframe: "daily",
        isActive: true,
        startDate: new Date(),
        endDate: null
      }
    ];

    await db.insert(leaderboards).values(leaderboardsData);

    console.log("✅ Achievements and leaderboards seeded successfully!");
    
  } catch (error) {
    console.error("Error seeding achievements:", error);
    throw error;
  }
}