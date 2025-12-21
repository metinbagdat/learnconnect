import "dotenv/config";
import { storage } from "./server/storage.ts";

/**
 * Comprehensive system test script
 * Tests database connection, storage operations, and API endpoints
 */

async function testSystem() {
  console.log("=".repeat(60));
  console.log("LearnConnect System Test");
  console.log("=".repeat(60));
  
  const results = {
    database: false,
    storage: false,
    courses: false,
    users: false,
    errors: []
  };
  
  // Test 1: Check DATABASE_URL
  console.log("\n[Test 1] Checking DATABASE_URL...");
  if (process.env.DATABASE_URL) {
    console.log("✅ DATABASE_URL is set");
    console.log("   Connection string:", process.env.DATABASE_URL.substring(0, 50) + "...");
    results.database = true;
  } else {
    console.log("❌ DATABASE_URL is not set");
    results.errors.push("DATABASE_URL not found in environment");
  }
  
  // Test 2: Test database connection via storage
  console.log("\n[Test 2] Testing database connection...");
  try {
    const courses = await storage.getCourses();
    console.log(`✅ Database connection successful`);
    console.log(`   Found ${courses.length} courses in database`);
    results.database = true;
    results.courses = true;
  } catch (error) {
    console.log("❌ Database connection failed");
    console.log("   Error:", error.message || error);
    results.errors.push(`Database connection: ${error.message || error}`);
  }
  
  // Test 3: Test user operations
  console.log("\n[Test 3] Testing user operations...");
  try {
    const users = await storage.getUsers();
    console.log(`✅ User operations working`);
    console.log(`   Found ${users.length} users in database`);
    results.users = true;
  } catch (error) {
    console.log("❌ User operations failed");
    console.log("   Error:", error.message || error);
    results.errors.push(`User operations: ${error.message || error}`);
  }
  
  // Test 4: Test course tree endpoint logic
  console.log("\n[Test 4] Testing course tree logic...");
  try {
    const courses = await storage.getCourses();
    const userCourses = await storage.getUserCourses(1); // Test with user ID 1
    
    console.log(`✅ Course tree logic test`);
    console.log(`   Total courses: ${courses.length}`);
    console.log(`   User courses (for user 1): ${userCourses.length}`);
    
    // Test invalid enrollment detection
    const courseMap = new Map(courses.map(c => [c.id, c]));
    const invalidEnrollments = userCourses.filter(uc => !courseMap.has(uc.courseId));
    
    if (invalidEnrollments.length > 0) {
      console.log(`   ⚠️  Found ${invalidEnrollments.length} invalid enrollment(s)`);
      console.log(`   Invalid course IDs:`, invalidEnrollments.map(uc => uc.courseId));
    } else {
      console.log(`   ✅ No invalid enrollments found`);
    }
    
    results.storage = true;
  } catch (error) {
    console.log("❌ Course tree logic test failed");
    console.log("   Error:", error.message || error);
    results.errors.push(`Course tree logic: ${error.message || error}`);
  }
  
  // Summary
  console.log("\n" + "=".repeat(60));
  console.log("TEST SUMMARY");
  console.log("=".repeat(60));
  console.log(`Database Connection: ${results.database ? '✅' : '❌'}`);
  console.log(`Storage Operations: ${results.storage ? '✅' : '❌'}`);
  console.log(`Courses Access: ${results.courses ? '✅' : '❌'}`);
  console.log(`Users Access: ${results.users ? '✅' : '❌'}`);
  
  if (results.errors.length > 0) {
    console.log("\n❌ ERRORS FOUND:");
    results.errors.forEach((error, i) => {
      console.log(`   ${i + 1}. ${error}`);
    });
  } else {
    console.log("\n✅ All tests passed!");
  }
  
  console.log("=".repeat(60));
  
  process.exit(results.errors.length > 0 ? 1 : 0);
}

testSystem().catch((error) => {
  console.error("Fatal error during testing:", error);
  process.exit(1);
});

