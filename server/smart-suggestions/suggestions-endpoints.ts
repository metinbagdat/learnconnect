import { Express } from "express";
import { db } from "../db.js";
import { userGoals, userInterests, studyPlans, studyMilestones, courseSuggestions, goalSuggestions, courses, userCourses } from "../../shared/schema.js";
import { aiSuggestionEngine } from "./ai-suggestion-engine.js";
import { eq, and } from "drizzle-orm";

export function registerSuggestionsEndpoints(app: Express) {
  // Get user goals
  app.get("/api/goals", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const goals = await db.select().from(userGoals).where(eq(userGoals.userId, req.user.id));

      res.json({ status: "success", data: goals });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goals" });
    }
  });

  // Create goal
  app.post("/api/goals", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { goalText, goalType, priority, deadline, courseIds } = req.body;
      const goal = await db.insert(userGoals).values({
        userId: req.user.id,
        goalText,
        goalType,
        priority,
        deadline: deadline ? new Date(deadline) : undefined,
        courseIds,
      }).returning();

      res.json({ status: "success", data: goal[0] });
    } catch (error) {
      res.status(500).json({ message: "Failed to create goal" });
    }
  });

  // Get goal suggestions
  app.get("/api/suggestions/goals", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const userRecord = await db.query.users.findFirst({ where: (users) => eq(users.id, req.user.id) });
      if (!userRecord) return res.status(404).json({ message: "User not found" });

      const suggestions = aiSuggestionEngine.generateGoalSuggestions(
        req.user.id,
        userRecord.role || "student",
        "",
        userRecord.interests || []
      );

      res.json({ status: "success", data: suggestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch goal suggestions" });
    }
  });

  // Get course suggestions
  app.get("/api/suggestions/courses", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const goals = await db.select().from(userGoals).where(eq(userGoals.userId, req.user.id));
      const interests = await db.select().from(userInterests).where(eq(userInterests.userId, req.user.id));
      const allCourses = await db.select().from(courses);

      const suggestions = aiSuggestionEngine.generateCourseSuggestions(req.user.id, goals, interests, allCourses);

      // Store suggestions
      for (const suggestion of suggestions) {
        await db.insert(courseSuggestions).values({
          userId: req.user.id,
          courseId: suggestion.courseId,
          reason: suggestion.reason,
          confidenceScore: suggestion.confidence.toString(),
        }).onConflictDoNothing();
      }

      res.json({ status: "success", data: suggestions });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch course suggestions" });
    }
  });

  // Generate study plan
  app.post("/api/study-plans", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { courseId, weeklyHours, goalDeadline } = req.body;
      const course = await db.query.courses.findFirst({ where: (c) => eq(c.id, courseId) });

      if (!course) return res.status(404).json({ message: "Course not found" });

      const plan = aiSuggestionEngine.generateStudyPlan(
        courseId,
        course.durationHours || 40,
        parseInt(weeklyHours) || 10,
        goalDeadline ? new Date(goalDeadline) : undefined
      );

      const studyPlan = await db.insert(studyPlans).values({
        userId: req.user.id,
        courseId,
        startDate: new Date(),
        endDate: plan.endDate,
        weeklyHours: plan.weeklyHours.toString(),
        aiMetadata: { generatedAt: new Date().toISOString() },
      }).returning();

      // Create milestones
      for (let i = 0; i < plan.milestoneDates.length; i++) {
        await db.insert(studyMilestones).values({
          studyPlanId: studyPlan[0].id,
          milestoneText: `Milestone ${i + 1}`,
          dueDate: plan.milestoneDates[i],
          order: i + 1,
        });
      }

      res.json({ status: "success", data: studyPlan[0] });
    } catch (error) {
      res.status(500).json({ message: "Failed to create study plan" });
    }
  });

  // Get user interests
  app.get("/api/interests", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const interests = await db.select().from(userInterests).where(eq(userInterests.userId, req.user.id));

      res.json({ status: "success", data: interests });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch interests" });
    }
  });

  // Add interest
  app.post("/api/interests", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const { interestTag, level, relevanceScore } = req.body;
      const interest = await db.insert(userInterests).values({
        userId: req.user.id,
        interestTag,
        level,
        relevanceScore: relevanceScore?.toString(),
      }).returning();

      res.json({ status: "success", data: interest[0] });
    } catch (error) {
      res.status(500).json({ message: "Failed to add interest" });
    }
  });

  // Get smart recommendations
  app.get("/api/recommendations/next-steps", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const goals = await db.select().from(userGoals).where(eq(userGoals.userId, req.user.id));
      const enrolled = await db.select().from(userCourses).where(eq(userCourses.userId, req.user.id));
      const completed = enrolled.filter((uc) => uc.completed);

      const recommendations = aiSuggestionEngine.generateNextStepRecommendation(
        req.user.id,
        goals,
        enrolled,
        completed
      );

      res.json({ status: "success", data: recommendations });
    } catch (error) {
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  console.log("[Suggestions] Endpoints registered successfully");
}
