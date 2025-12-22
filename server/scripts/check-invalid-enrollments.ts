import "dotenv/config";
import { storage } from "../storage.js";
import { db } from "../db.js";
import { userCourses, courses } from "../../shared/schema.js";
import { eq, inArray } from "drizzle-orm";

/**
 * Script to identify and clean up invalid course enrollments
 * Run with: npx tsx server/scripts/check-invalid-enrollments.ts
 */

async function checkInvalidEnrollments() {
  console.log("=".repeat(60));
  console.log("Checking for invalid course enrollments...");
  console.log("=".repeat(60));
  
  try {
    // Get all user courses
    const allUserCourses = await db.select().from(userCourses);
    console.log(`\nTotal user course enrollments: ${allUserCourses.length}`);
    
    // Get all valid course IDs
    const allCourses = await storage.getCourses();
    const validCourseIds = new Set(allCourses.map(c => c.id));
    console.log(`Total valid courses in database: ${allCourses.length}`);
    
    // Find invalid enrollments
    const invalidEnrollments = allUserCourses.filter(
      uc => !validCourseIds.has(uc.courseId)
    );
    
    if (invalidEnrollments.length === 0) {
      console.log("\n✅ No invalid enrollments found! All enrollments are valid.");
      return;
    }
    
    console.log(`\n⚠️  Found ${invalidEnrollments.length} invalid enrollment(s):`);
    console.log("-".repeat(60));
    
    // Group by user for better reporting
    const byUser = new Map<number, typeof invalidEnrollments>();
    invalidEnrollments.forEach(enrollment => {
      if (!byUser.has(enrollment.userId)) {
        byUser.set(enrollment.userId, []);
      }
      byUser.get(enrollment.userId)!.push(enrollment);
    });
    
    // Report details
    for (const [userId, enrollments] of byUser.entries()) {
      console.log(`\nUser ID: ${userId}`);
      console.log(`  Invalid enrollments: ${enrollments.length}`);
      enrollments.forEach(uc => {
        console.log(`    - UserCourse ID: ${uc.id}, Course ID: ${uc.courseId} (does not exist)`);
        console.log(`      Enrolled: ${uc.enrolledAt}, Progress: ${uc.progress}%, Completed: ${uc.completed}`);
      });
    }
    
    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("SUMMARY:");
    console.log("=".repeat(60));
    console.log(`Total invalid enrollments: ${invalidEnrollments.length}`);
    console.log(`Affected users: ${byUser.size}`);
    console.log(`Invalid course IDs: ${[...new Set(invalidEnrollments.map(uc => uc.courseId))].join(", ")}`);
    
    // Generate cleanup SQL
    const invalidUserCourseIds = invalidEnrollments.map(uc => uc.id);
    console.log("\n" + "=".repeat(60));
    console.log("CLEANUP SQL (to remove invalid enrollments):");
    console.log("=".repeat(60));
    console.log(`DELETE FROM user_courses WHERE id IN (${invalidUserCourseIds.join(", ")});`);
    
    // Option to auto-cleanup (uncomment to enable)
    // console.log("\nCleaning up invalid enrollments...");
    // await db.delete(userCourses).where(inArray(userCourses.id, invalidUserCourseIds));
    // console.log(`✅ Removed ${invalidUserCourseIds.length} invalid enrollment(s)`);
    
  } catch (error) {
    console.error("Error checking enrollments:", error);
    process.exit(1);
  }
}

// Run the check
checkInvalidEnrollments()
  .then(() => {
    console.log("\n✅ Check complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

