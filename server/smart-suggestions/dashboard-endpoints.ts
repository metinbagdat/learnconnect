// Step 4: Dashboard Endpoints - Student and Admin

import { Express } from "express";
import { db } from "../db.js";
import { eq } from "drizzle-orm";
import { userCourses, courses, users, assignments, userAssignments, memoryEnhancedCurricula } from "../../shared/schema.js";

export function registerDashboardEndpoints(app: Express) {
  // Student Dashboard
  app.get("/api/dashboard/student", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user) return res.status(401).json({ message: "Unauthorized" });

      const userEnrollments = await db
        .select()
        .from(userCourses)
        .where(eq(userCourses.userId, req.user.id));

      const enrolledCourses = [];
      for (const uc of userEnrollments) {
        const [course] = await db.select().from(courses).where(eq(courses.id, uc.courseId));
        if (course) {
          enrolledCourses.push({
            ...course,
            progress: uc.progress,
            completed: uc.completed,
            enrolledAt: uc.enrolledAt
          });
        }
      }

      // Get assignments
      const userAssignmentsList = await db
        .select()
        .from(userAssignments)
        .where(eq(userAssignments.userId, req.user.id));

      const assignmentsList = [];
      for (const ua of userAssignmentsList) {
        const [assignment] = await db.select().from(assignments as any).where(eq((assignments as any).id, ua.assignmentId));
        if (assignment) {
          assignmentsList.push({
            ...assignment,
            status: ua.status,
            submittedAt: ua.submittedAt,
            grade: ua.grade
          });
        }
      }

      // Get curriculum
      const curriculum = await db
        .select()
        .from(memoryEnhancedCurricula)
        .where(eq(memoryEnhancedCurricula.userId, req.user.id));

      res.json({
        success: true,
        user: { id: req.user.id, name: req.user.displayName, role: req.user.role },
        enrolledCourses,
        curriculum: curriculum.length > 0 ? curriculum[0] : null,
        assignments: assignmentsList,
        stats: {
          totalCourses: enrolledCourses.length,
          totalAssignments: assignmentsList.length,
          completedAssignments: assignmentsList.filter((a: any) => a.status === "graded").length,
          averageProgress: Math.round(
            enrolledCourses.reduce((sum: number, c: any) => sum + c.progress, 0) / (enrolledCourses.length || 1)
          )
        }
      });
    } catch (error: any) {
      res.status(500).json({ message: "Dashboard fetch failed", error: error.message });
    }
  });

  // Admin Dashboard
  app.get("/api/dashboard/admin", (app as any).ensureAuthenticated, async (req, res) => {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      // Get system statistics
      const allUsers = await db.select().from(users);
      const allCourses = await db.select().from(courses);
      const allEnrollments = await db.select().from(userCourses);
      const allAssignments = await db.select().from(assignments as any);
      const allCurricula = await db.select().from(memoryEnhancedCurricula);

      const completedEnrollments = allEnrollments.filter((e: any) => e.completed).length;
      const completedAssignments = await db
        .select()
        .from(userAssignments)
        .then((list: any[]) => list.filter((ua: any) => ua.status === "graded").length);

      res.json({
        success: true,
        statistics: {
          totalUsers: allUsers.length,
          totalCourses: allCourses.length,
          totalEnrollments: allEnrollments.length,
          completionRate: Math.round((completedEnrollments / (allEnrollments.length || 1)) * 100),
          totalAssignments: allAssignments.length,
          completedAssignments,
          generatedCurricula: allCurricula.length
        },
        courseStats: {
          mostPopular: allEnrollments.reduce((acc: any, e: any) => {
            acc[e.courseId] = (acc[e.courseId] || 0) + 1;
            return acc;
          }, {}),
          averageProgress: Math.round(
            allEnrollments.reduce((sum: number, e: any) => sum + e.progress, 0) / (allEnrollments.length || 1)
          )
        },
        insights: [
          `${allUsers.length} active users`,
          `${allCourses.length} total courses available`,
          `${completedEnrollments} courses completed`,
          `${allCurricula.length} personalized curricula generated`
        ]
      });
    } catch (error: any) {
      res.status(500).json({ message: "Admin dashboard fetch failed", error: error.message });
    }
  });

  console.log("[Dashboard] Student and admin dashboard endpoints registered");
}
