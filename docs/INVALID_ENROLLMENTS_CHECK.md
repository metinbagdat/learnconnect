# Invalid Course Enrollments - Diagnostic Guide

## Overview
This guide helps you identify and clean up invalid course enrollments that may be causing the "Course not found" error.

## What Are Invalid Enrollments?
Invalid enrollments occur when a user is enrolled in a course that no longer exists in the database. This can happen when:
- Courses are deleted but user enrollments remain
- Database inconsistencies occur
- Data migration issues

## How to Check for Invalid Enrollments

### Method 1: Check Server Console Logs

When you access the `/courses` page, the server logs will show detailed information:

**Look for these log messages:**
```
[Courses Tree] WARNING: Found X invalid enrolled course IDs that do not exist in database:
[Courses Tree] Invalid course IDs: [list of IDs]
[Courses Tree] These courses may have been deleted. User enrollments: [...]
```

**To view logs:**
1. Open the terminal where your server is running (`npm run dev`)
2. Navigate to the courses page in your browser
3. Check the terminal output for `[Courses Tree]` messages

### Method 2: Use the Diagnostic Endpoint

**Endpoint:** `GET /api/user/courses/diagnostic`

**Requirements:** Must be authenticated (logged in)

**How to use:**
1. Make sure you're logged in to the application
2. Open browser console (F12)
3. Run this command:
```javascript
fetch('/api/user/courses/diagnostic', {
  credentials: 'include'
})
  .then(r => r.json())
  .then(data => {
    console.log('Diagnostic Results:', data);
    if (data.invalidEnrollments.length > 0) {
      console.log('⚠️ Invalid Enrollments Found:', data.invalidEnrollments);
      console.log('Invalid Course IDs:', data.invalidCourseIds);
    } else {
      console.log('✅ All enrollments are valid!');
    }
  });
```

**Response format:**
```json
{
  "userId": 1,
  "summary": {
    "totalEnrollments": 5,
    "validEnrollments": 4,
    "invalidEnrollments": 1,
    "totalCoursesInDatabase": 100
  },
  "invalidCourseIds": [123],
  "invalidEnrollments": [
    {
      "userCourseId": 456,
      "courseId": 123,
      "enrolledAt": "2024-01-01T00:00:00Z",
      "progress": 50,
      "completed": false
    }
  ],
  "validCourseIds": [1, 2, 3, 4],
  "recommendation": "Found 1 invalid course enrollment(s). These courses may have been deleted. Consider cleaning up these enrollments."
}
```

### Method 3: Run the Diagnostic Script

**Prerequisites:** Database connection must be configured

**Command:**
```bash
# From the LearnConnect directory
npx tsx server/scripts/check-invalid-enrollments.ts
```

**Output:**
The script will show:
- Total enrollments
- Invalid enrollments count
- Details of each invalid enrollment
- SQL command to clean them up

## How to Clean Up Invalid Enrollments

### Option 1: Manual SQL Cleanup

If the diagnostic shows invalid enrollments, you can remove them using SQL:

```sql
-- Replace [INVALID_USER_COURSE_IDS] with the actual IDs from the diagnostic
DELETE FROM user_courses WHERE id IN ([INVALID_USER_COURSE_IDS]);
```

### Option 2: Automated Cleanup Script

Edit `server/scripts/check-invalid-enrollments.ts` and uncomment lines 75-77:

```typescript
console.log("\nCleaning up invalid enrollments...");
await db.delete(userCourses).where(inArray(userCourses.id, invalidUserCourseIds));
console.log(`✅ Removed ${invalidUserCourseIds.length} invalid enrollment(s)`);
```

Then run the script again.

### Option 3: Create a Cleanup Endpoint

You can add an admin endpoint to clean up invalid enrollments:

```typescript
app.post("/api/admin/cleanup-invalid-enrollments", (app as any).ensureAuthenticated, async (req, res) => {
  // Admin only
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin only" });
  }
  
  // Implementation here
});
```

## Current Fix Status

✅ **The application now handles invalid enrollments gracefully:**
- Invalid courses are automatically filtered out
- The courses page will show an empty state if all enrollments are invalid
- No more "Course not found" errors will crash the page
- Detailed logging helps identify which enrollments need cleanup

## Next Steps

1. **Check the server logs** when accessing `/courses` page
2. **Use the diagnostic endpoint** to see detailed information
3. **Clean up invalid enrollments** using one of the methods above
4. **Monitor logs** for any new invalid enrollments

## Example Server Log Output

```
[Courses Tree] User ID: 1
[Courses Tree] User courses count: 5
[Courses Tree] User courses: [{id: 1, courseId: 10}, {id: 2, courseId: 20}, ...]
[Courses Tree] All courses count: 100
[Courses Tree] WARNING: Found 1 invalid enrolled course IDs that do not exist in database:
[Courses Tree] Invalid course IDs: [123]
[Courses Tree] These courses may have been deleted. User enrollments: [{userCourseId: 456, courseId: 123, enrolledAt: ...}]
[Courses Tree] Valid enrolled course IDs: [10, 20, 30, 40]
[Courses Tree] Total enrolled: 5 | Valid: 4 | Invalid: 1
[Courses Tree] Relevant course IDs count: 4
[Courses Tree] Courses with enrollment: 4
[Courses Tree] Final tree result: 2 root courses
[Courses Tree] Successfully built course tree for user 1
```

## Support

If you continue to see issues:
1. Check that the server is running and logs are visible
2. Verify you're logged in when using the diagnostic endpoint
3. Ensure the database connection is working
4. Review the enhanced error logs for more details

