# LearnConnect Features Summary

## 1. AI Suggestions for Courses

### Two Recommendation Algorithms:

#### 1a. Content-Based Filtering (Collaborative)
**Endpoint:** `GET /api/suggestions/courses/content-based`

Matches user interests with course categories, titles, and descriptions:
- User interests stored in `users.interests` array
- Scoring algorithm:
  - Category match: +30 points
  - Title match: +20 points
  - Description match: +10 points
  - Beginner-level bonus: +5 points
- Returns top 5 courses with relevance scores (0-100)
- Non-AI based, deterministic, fast

**Example Response:**
```json
{
  "success": true,
  "type": "content-based",
  "suggestions": [
    {
      "courseId": 5,
      "title": "Advanced Python Programming",
      "category": "Programming",
      "reason": "Matches your interests: Python, Programming, Web Development",
      "relevanceScore": 95,
      "suggestedStartDate": "2025-11-29"
    }
  ]
}
```

#### 1b. AI-Powered Suggestions
**Endpoint:** `GET /api/ai/course-suggestions`

Uses Claude 3.5 Sonnet to analyze user profile:
- Considers learning pace
- Analyzes past enrollment history
- Reviews course descriptions in context
- Provides detailed reasoning for each recommendation
- More nuanced, AI-driven recommendations

### Related Courses Feature
**Endpoint:** `GET /api/courses/:courseId/related?limit=5`

Get courses similar to a given course:
- Matches by category
- Similar difficulty level
- Keyword overlap in descriptions
- Returns similarity score for each

---

## 2. AI-Generated Curriculum

### Admin Feature for Curriculum Generation
**Endpoint:** `POST /api/curriculum/generate` or `POST /api/curriculum/generate-from-description`

**Requirements:**
- User must be admin or instructor
- Input: `{ courseId, description }`

**Process:**
1. Takes course description from request body (or fetches from course if exists)
2. Uses Claude 3.5 Sonnet to generate structured curriculum
3. AI generates:
   - 3-5 modules with progressive difficulty
   - 2-3 lessons per module
   - Learning objectives for each lesson
   - Estimated duration (in minutes)
   - Key concepts
   - Activities
   - Assessment types
4. Saves curriculum structure to database
5. Creates modules and lessons in respective tables

**Example Request:**
```bash
POST /api/curriculum/generate
Authorization: Bearer <admin-token>
Content-Type: application/json

{
  "courseId": 78,
  "description": "This course teaches advanced Python programming including async/await, decorators, design patterns, and performance optimization. Students will build real-world applications and understand best practices."
}
```

**Example Response:**
```json
{
  "success": true,
  "message": "Curriculum generated successfully",
  "data": {
    "success": true,
    "curriculumId": 125,
    "curriculum": {
      "title": "Advanced Python Programming Curriculum",
      "description": "Comprehensive curriculum for advanced Python development",
      "modules": [
        {
          "id": "module_1",
          "title": "Asynchronous Programming",
          "description": "Learn async/await patterns",
          "lessons": [
            {
              "id": "lesson_1",
              "title": "Introduction to Async/Await",
              "description": "Understand async/await fundamentals",
              "duration": 45,
              "objectives": [
                "Understand event loops",
                "Learn async/await syntax",
                "Write concurrent code"
              ],
              "content": "...",
              "activities": ["Write async function", "Handle errors"],
              "assessment": "quiz"
            }
          ]
        }
      ],
      "estimatedTotalDuration": 420,
      "difficulty": "advanced"
    }
  }
}
```

**Database Impact:**
- Saves to `curriculums` table with AI-generated structure
- Creates `modules` for each generated module
- Creates `lessons` for each generated lesson
- All marked as `aiGenerated: true`

---

## 3. Complete Enrollment Automation

**Endpoint:** `POST /api/pipeline/enroll-and-generate`

Full 6-step pipeline:
1. Create enrollment record
2. Get or generate curriculum (using AI if needed)
3. Personalize curriculum based on learning pace
4. Create study plan (30-day timeline)
5. Generate assignments with cumulative due dates
6. Send welcome notifications

---

## 4. Dynamic Study Plan Adjustment

**Endpoint:** `PATCH /api/study-plans/:id/adjust`

Automatically adapts study plans based on student progress:
- Detects if student is ahead/behind
- Extends deadlines if falling behind (25% extension)
- Suggests priority adjustments
- Provides motivational messages

---

## 5. Student Dashboard

**Endpoint:** `GET /api/dashboard` (authenticated) or `GET /api/dashboard/:userId` (admin)

Comprehensive dashboard data:
- All enrolled courses
- Current assignments with due dates
- Progress metrics (overall and per-course)
- Upcoming assignments (top 10)
- Summary statistics:
  - Total assignments
  - Completed assignments
  - Pending assignments
  - Overdue assignments

**Example Response:**
```json
{
  "success": true,
  "data": {
    "userId": 24,
    "enrolledCourses": [...],
    "currentAssignments": [...],
    "overallProgress": 45,
    "totalEnrolled": 3,
    "completedCourses": 1,
    "upcomingAssignments": [...],
    "summary": {
      "totalAssignments": 15,
      "completedAssignments": 7,
      "pendingAssignments": 6,
      "overdueAssignments": 2
    }
  }
}
```

---

## Database Schema

### Key Tables:

**Users**
- `interests` (text array) - User interests for recommendations

**Courses**
- `category` - Course category for filtering
- `level` - Difficulty level (beginner/intermediate/advanced)

**Curriculums**
- `courseId` - Reference to course
- `structureJson` - Full AI-generated curriculum structure
- `aiGenerated` - Boolean flag for AI-generated curricula

**Modules**
- `courseId` - Reference to course
- `title` - Module title
- `order` - Module order in course

**Lessons**
- `moduleId` - Reference to module
- `title` - Lesson title
- `durationMinutes` - Estimated duration (for cumulative due dates)
- `content` - Lesson content

**StudyPlans**
- `userId` - Student
- `courseId` - Course
- `curriculumId` - Curriculum
- `startDate` - Study plan start
- `endDate` - Study plan end (30 days)
- `status` - active/completed/paused

**Assignments**
- `studyPlanId` - Reference to study plan
- `lessonId` - Reference to lesson
- `dueDate` - Cumulative due date
- `status` - pending/in_progress/completed

---

## API Endpoints Summary

| Feature | Method | Endpoint | Auth | Role |
|---------|--------|----------|------|------|
| Content-based suggestions | GET | `/api/suggestions/courses/content-based` | Yes | Student |
| AI suggestions | GET | `/api/ai/course-suggestions` | Yes | Student |
| Related courses | GET | `/api/courses/:courseId/related` | No | Any |
| Generate curriculum | POST | `/api/curriculum/generate` | Yes | Admin/Instructor |
| Enroll & generate | POST | `/api/pipeline/enroll-and-generate` | Yes | Student |
| Adjust study plan | PATCH | `/api/study-plans/:id/adjust` | Yes | Student |
| Dashboard | GET | `/api/dashboard` | Yes | Student |
| Dashboard (user) | GET | `/api/dashboard/:userId` | Yes | Admin/Self |

---

## Implementation Status

✅ **Complete:**
- Content-based course suggestions (deterministic)
- AI-powered course suggestions (Claude)
- Related courses discovery
- AI curriculum generation from description
- Full enrollment pipeline with automation
- Dynamic study plan adjustment
- Student dashboard with progress tracking

All features tested and production-ready!
