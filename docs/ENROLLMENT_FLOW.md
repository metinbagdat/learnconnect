# LearnConnect AI-Powered Enrollment Flow

## Complete Enrollment Process (AI-Aligned)

This document outlines the exact flow when a user enrolls in a course, with all AI alignment points.

---

## Step-by-Step Flow

### **Step 1: User Enrolls in Course** 🎓
**Trigger:** User clicks "Enroll" button on course page  
**Endpoint:** `POST /api/pipeline/enroll-and-generate`  
**Action:** Create enrollment record

```
Database Write: user_courses
├── user_id: 24
├── course_id: 78
├── progress: 0
├── current_module: 1
├── completed: false
├── enrolled_at: NOW()
└── last_accessed_at: NULL

Console Output:
✅ [ENROLLMENT EVENT TRIGGERED] User 24 enrolling in Course 78
```

---

### **Step 2: Get or Generate Curriculum** 📚
**Trigger:** Enrollment created (automatic)  
**Process:** Check if curriculum exists for course, else generate via AI  
**AI Model:** Claude 3.5 Sonnet

#### 2a. Check for Existing Curriculum
```sql
SELECT * FROM curriculums WHERE course_id = 78
```

#### 2b. If Not Found - Generate via AI
**Claude Prompt:** 
```
Generate a comprehensive curriculum for [COURSE_TITLE]
- Create 3-5 modules with progressive difficulty
- Each module has 2-3 lessons
- Include estimated duration for each lesson (in minutes)
- Structure: { modules: [{ title, lessons: [{ title, content, duration }] }] }
```

**Database Write: curriculums**
```
├── id: AUTO
├── course_id: 78
├── title: "Curriculum for Course 78"
├── structure_json: { 
│   modules: [
│     { 
│       title: "Module 1: Basics",
│       lessons: [
│         { title: "Lesson 1.1", duration: 30, content: "..." },
│         { title: "Lesson 1.2", duration: 45, content: "..." }
│       ]
│     },
│     ...
│   ]
│ }
├── ai_generated: true
├── version: "1.0"
├── created_at: NOW()
└── updated_at: NOW()

Console Output:
📚 [STEP 2 COMPLETE] Curriculum obtained: 1
```

---

### **Step 3: AI Personalization** 🤖
**Trigger:** Curriculum obtained (automatic)  
**Process:** Adapt curriculum based on user's learning pace  
**AI Model:** Claude 3.5 Sonnet

**Claude Prompt:**
```
Personalize this curriculum for a [LEARNING_PACE] learner:
- Adjust module complexity
- Suggest 3-5 personalized modules
- Include additional resources if needed
- Keep total duration reasonable for [LEARNING_PACE] pace
```

**Output:** Personalized modules with adapted content

```
Console Output:
🤖 [STEP 2.5 STARTING] Generating AI-powered personalization...
   [AI-Personalization] User learning pace: moderate
   [AI-Personalization] Generating AI-powered modules based on curriculum...
   [AI-Personalization] ✨ Generated 4 AI-powered modules
   [AI-Personalization] ✓ Module "Module 1" content generated
   [AI-Personalization] ✓ Module "Module 2" content generated
🎯 [STEP 2.5 COMPLETE - AI PERSONALIZATION EVENT] Generated 4 AI-powered modules
```

---

### **Step 4: Create Study Plan** 📋
**Trigger:** AI personalization complete (automatic)  
**Process:** Create personalized 30-day study plan  
**Duration Calculation:** Based on lesson estimates

**Database Write: study_plans**
```sql
INSERT INTO study_plans (
  user_id,
  course_id,
  curriculum_id,
  title,
  start_date,
  end_date,
  status,
  created_at
) VALUES (
  24,
  78,
  125,
  'Study Plan - Course 78',
  '2025-11-29 20:03:02',  -- NOW()
  '2025-12-29 20:03:02',  -- NOW() + 30 days
  'active',
  NOW()
)
RETURNING *;

Console Output:
📋 [STEP 3 COMPLETE] Study plan created: 156
```

---

### **Step 5: Generate Assignments with Cumulative Due Dates** ✏️
**Trigger:** Study plan created (automatic)  
**Process:** Create assignment for each lesson, with cumulative due dates  
**Key Logic:** `due_date = start_date + cumulative_duration_of_all_previous_lessons`

#### Algorithm:
```javascript
cumulativeDuration = 0
startDate = study_plan.start_date

for each module in curriculum.modules:
  for each lesson in module.lessons:
    cumulativeDuration += lesson.durationMinutes
    dueDate = startDate + (cumulativeDuration * 60 seconds)
    
    CREATE assignment:
    {
      title: "{module.title} - {lesson.title}",
      description: lesson.content,
      course_id: 78,
      study_plan_id: 156,
      lesson_id: lesson.id,
      due_date: dueDate,
      points: 10,
      status: "pending"
    }
```

#### Example Timeline:
```
Module 1:
  Lesson 1: 30 min  → Cumulative: 30 min  → Due: NOW + 30 min
  Lesson 2: 45 min  → Cumulative: 75 min  → Due: NOW + 75 min

Module 2:
  Lesson 1: 40 min  → Cumulative: 115 min → Due: NOW + 115 min
  Lesson 2: 35 min  → Cumulative: 150 min → Due: NOW + 150 min

Module 3:
  Lesson 1: 30 min  → Cumulative: 180 min → Due: NOW + 180 min
  Lesson 2: 25 min  → Cumulative: 205 min → Due: NOW + 205 min
```

**Database Writes: assignments (one per lesson)**
```sql
INSERT INTO assignments (...) VALUES (...)  -- 6-10 records
RETURNING *;

-- Also create initial progress records
INSERT INTO user_progress (user_id, assignment_id, status)
VALUES (24, [each_assignment_id], 'pending')
RETURNING *;

Console Output:
✏️  [STEP 4 COMPLETE] Assignments generated: 6 assignments
```

---

### **Step 6: Send Welcome Package** 📧
**Trigger:** Assignments generated (automatic)  
**Process:** Create welcome notifications

**Database Writes: notifications (3 records)**
```sql
-- Welcome notification
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  data
) VALUES (
  24,
  'due_assignment',
  'Welcome to Course 78!',
  'Your personalized study plan is ready. Start learning today!',
  { courseId: 78, studyPlanId: 156 }
);

-- Study plan overview
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  data
) VALUES (
  24,
  'due_assignment',
  'Your Study Plan is Ready',
  'Your 30-day personalized study plan has been created. View assignments and due dates.',
  { studyPlanId: 156 }
);

-- First assignment reminder
INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  data
) VALUES (
  24,
  'due_assignment',
  'First Assignment Ready',
  'Begin with the foundational concepts.',
  { courseId: 78 }
);

Console Output:
📧 [STEP 5 COMPLETE] Welcome notifications sent: 3 notifications
```

---

### **Final Output: Pipeline Complete** ✨
```
Console Output:
✨ [ENROLLMENT PIPELINE COMPLETE] All 5 steps finished successfully!
📊 Summary: 
   Enrollment(1), 
   StudyPlan(156), 
   Assignments(6), 
   AIModules(4)
```

---

## Student Dashboard Flow

### What Student Sees:
1. **Study Plan Dashboard** (`/study-plan`)
   - Overview: Progress bar (0/6 completed)
   - Learning Path: 3 modules with milestones
   - Assignments List: 6 assignments sorted by due date
   - AI Chat Tutor: Ask questions about study plan

### Student Actions:
1. View assignments by due date
2. Click assignment to open lesson content
3. Mark assignment as completed
4. See progress update automatically
5. Ask AI Tutor for help

### Progress Update Flow:
```
Student marks assignment as completed
    ↓
PATCH /api/assignments/{id}/complete
    ↓
UPDATE user_progress SET status = 'completed' WHERE assignment_id = {id}
    ↓
UPDATE assignments SET status = 'completed' WHERE id = {id}
    ↓
Recalculate overall progress percentage
    ↓
Dashboard refreshes automatically (via React Query invalidation)
```

---

## Admin Dashboard Flow

### What Admin Sees:
1. **Enrollment Analytics** (`/admin/enrollment`)
   - Total Enrollments: Count
   - Successful Pipelines: Count
   - Study Plans Created: Count
   - AI Operations: Count

2. **Pipeline Health Status:**
   - Step 1: Enrollment Creation ✅ healthy
   - Step 2: Curriculum Generation ✅ healthy
   - Step 3: AI Personalization ✅ healthy
   - Step 4: Study Plan Creation ✅ healthy
   - Step 5: Assignment Generation ✅ healthy

3. **Course Statistics:**
   - Enrollments per course
   - Success rate per course
   - Progress bars for each course

---

## Key Data Relationships

```
users (1) ─── (N) user_courses
                    ├─→ courses
                    └─→ (1) study_plans (new records created at enrollment)
                            ├─→ (1) curriculums
                            │       └─→ modules + lessons
                            └─→ (N) assignments (one per lesson)
                                    └─→ (N) user_progress (one per user per assignment)
```

---

## Error Handling & Rollback

If any step fails:
1. Log error with step number
2. Rollback all changes in that step
3. Notify admin
4. User can retry enrollment

```
Try:
  Step 1 ✅
  Step 2 ✅
  Step 3 ❌ Failed
  → Rollback curriculum & notify
  → User can try enrollment again
Catch:
  Log error: "[EnrollmentPipeline] Error during enrollment: ..."
```

---

## Performance Notes

- **Curriculum Generation:** ~5-10 seconds (AI call)
- **Personalization:** ~5-10 seconds (AI call)
- **Study Plan Creation:** <1 second (DB insert)
- **Assignment Generation:** 1-2 seconds (multiple DB inserts)
- **Total Pipeline:** ~15-25 seconds end-to-end
- **Async Handling:** Frontend shows loading state during pipeline execution

---

## Summary: The Complete Flow

```
User clicks "Enroll"
    ↓ [1. Create Enrollment]
    ↓ [2. Get/Generate Curriculum (AI)]
    ↓ [3. Personalize Curriculum (AI)]
    ↓ [4. Create Study Plan with Start Date]
    ↓ [5. Generate Assignments (Cumulative Dates)]
    ↓ [6. Send Welcome Notifications]
✨ Complete!
    ↓
Student sees Study Plan Dashboard
    ├─ Timeline with due dates
    ├─ Assignments list
    ├─ Progress bar (0%)
    └─ AI Tutor available

Student marks assignments complete
    ↓
Progress updates automatically
    ↓
Dashboard shows progress %
    ↓
Repeat until course complete (100%)
```

All AI interactions are logged and aligned with user learning objectives.
