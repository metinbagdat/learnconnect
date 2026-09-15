# LearnConnect Database Schema Outline

## Current Implementation Status

### 1. Users Table ✅
**Purpose:** Store user account information
**Location:** `shared/schema.ts` - Line 10

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  email TEXT,
  password TEXT NOT NULL,
  password_hash TEXT,
  display_name TEXT,
  role TEXT DEFAULT 'student' -- student, instructor, admin
  interests TEXT[],
  learning_pace TEXT DEFAULT 'moderate' -- slow, moderate, fast
  profile_complete BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

---

### 2. Courses Table ✅
**Purpose:** Store course information
**Location:** `shared/schema.ts` - Line 25

```sql
CREATE TABLE courses (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  title_en TEXT,
  title_tr TEXT,
  description_en TEXT,
  description_tr TEXT,
  category TEXT NOT NULL,
  category_id INTEGER,
  image_url TEXT,
  module_count INTEGER,
  duration_hours INTEGER,
  instructor_id INTEGER NOT NULL,  -- Foreign key to users(id)
  rating INTEGER,
  level TEXT,
  is_ai_generated BOOLEAN DEFAULT false,
  price NUMERIC(10,2) DEFAULT 0.00,
  is_premium BOOLEAN DEFAULT false,
  stripe_price_id TEXT,
  parent_course_id INTEGER,  -- For nested courses
  depth INTEGER DEFAULT 0,
  order_position INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 3. Enrollments (UserCourses) Table ✅
**Purpose:** Track which users are enrolled in which courses
**Location:** `shared/schema.ts` - Line 77

```sql
CREATE TABLE user_courses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,  -- Foreign key to users(id)
  course_id INTEGER NOT NULL,  -- Foreign key to courses(id)
  progress INTEGER DEFAULT 0,  -- 0-100%
  current_module INTEGER DEFAULT 1,
  completed BOOLEAN DEFAULT false,
  enrolled_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP
);
```

---

### 4. Curricula Structure (Multi-Table) ✅
**Purpose:** Define course structure with modules and lessons

#### 4a. Curriculums Table
**Location:** `shared/schema.ts` - Line 863

```sql
CREATE TABLE curriculums (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,  -- Foreign key to courses(id)
  title TEXT NOT NULL,
  structure_json JSONB,  -- AI-generated curriculum structure
  ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 4b. Modules Table ✅
**Purpose:** Subdivide courses into modules
**Location:** `shared/schema.ts` - Line 51

```sql
CREATE TABLE modules (
  id SERIAL PRIMARY KEY,
  course_id INTEGER NOT NULL,  -- Foreign key to courses(id)
  title TEXT NOT NULL,
  title_en TEXT,
  title_tr TEXT,
  description_en TEXT,
  description_tr TEXT,
  order_position INTEGER NOT NULL  -- Module number within course
);
```

#### 4c. Lessons Table ✅
**Purpose:** Subdivide modules into lessons
**Location:** `shared/schema.ts` - Line 62

```sql
CREATE TABLE lessons (
  id SERIAL PRIMARY KEY,
  module_id INTEGER NOT NULL,  -- Foreign key to modules(id)
  title TEXT NOT NULL,
  content TEXT,
  title_en TEXT,
  title_tr TEXT,
  content_en TEXT,
  content_tr TEXT,
  description_en TEXT,
  description_tr TEXT,
  order_position INTEGER NOT NULL,  -- Lesson number within module
  duration_minutes INTEGER DEFAULT 30  -- Estimated duration
);
```

---

### 5. Study Plans Table ✅
**Purpose:** Store personalized study plans created when users enroll
**Location:** `shared/schema.ts` - Line 494

```sql
CREATE TABLE study_plans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,  -- Foreign key to users(id)
  course_id INTEGER,  -- Foreign key to courses(id)
  curriculum_id INTEGER,  -- Foreign key to curriculums(id)
  title TEXT NOT NULL,  -- e.g., "Study Plan - Course X"
  start_date TIMESTAMP,
  end_date TIMESTAMP,  -- Calculated: 30 days from start
  status TEXT DEFAULT 'active',  -- active, completed, paused
  ai_personalized BOOLEAN DEFAULT false,  -- Generated with AI personalization
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 6. Assignments (Tasks) Table ✅
**Purpose:** Store assignments/tasks generated from study plans
**Location:** `shared/schema.ts` - Line 97

```sql
CREATE TABLE assignments (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,  -- e.g., "Module 1 - Lesson 1"
  description TEXT,
  course_id INTEGER NOT NULL,  -- Foreign key to courses(id)
  study_plan_id INTEGER,  -- Optional FK to study_plans(id)
  lesson_id INTEGER,  -- Optional FK to lessons(id) for reference
  points INTEGER DEFAULT 0,
  due_date TIMESTAMP,  -- Cumulative due date based on study plan start + duration
  status TEXT DEFAULT 'pending',  -- pending, in_progress, completed
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

### 7. Progress (User Progress) Table ✅
**Purpose:** Track user completion and performance on assignments
**Location:** `shared/schema.ts` - Line 874

```sql
CREATE TABLE user_progress (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,  -- Foreign key to users(id)
  assignment_id INTEGER,  -- Foreign key to assignments(id)
  status TEXT DEFAULT 'pending',  -- pending, in_progress, completed
  score INTEGER,
  completed_at TIMESTAMP,
  time_spent_minutes INTEGER,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Enrollment Pipeline Workflow

### Step 1: User Enrolls in Course
- **Trigger:** User clicks "Enroll" button on course
- **Action:** Creates record in `user_courses` table
- **Record:** `{ user_id, course_id, enrolled_at, progress: 0, completed: false }`

### Step 2: Curriculum Generation
- **Trigger:** Enrollment created
- **Action:** AI generates course structure (via Claude 3.5 Sonnet)
- **Records Created:**
  - `curriculums` - Main curriculum record
  - `modules` - 3-5 AI-personalized modules
  - `lessons` - 2-3 lessons per module

### Step 3: AI Personalization
- **Trigger:** Curriculum generated
- **Action:** Claude AI adapts curriculum based on user's learning pace
- **Output:** Personalized modules with adjusted content

### Step 4: Study Plan Creation
- **Trigger:** Personalization complete
- **Action:** Create personalized 30-day study plan
- **Record:** `study_plans { user_id, course_id, curriculum_id, start_date, end_date, status: 'active' }`

### Step 5: Assignment Generation
- **Trigger:** Study plan created
- **Action:** Generate assignments with cumulative due dates
- **Record:** One assignment per lesson, with due_date calculated as:
  - `start_date + cumulative_lesson_durations`
- **Total Records:** ~6-15 assignments per enrollment

### Step 6: Notifications
- **Trigger:** Assignments generated
- **Actions:**
  - Welcome notification
  - Study plan overview
  - First assignment reminder

---

## Key Features

### Cumulative Due Dates
Assignments are scheduled with cumulative durations to prevent task clustering:
```
Module 1:
  - Lesson 1: Start + 30min = Due Date 1
  - Lesson 2: Start + 60min = Due Date 2

Module 2:
  - Lesson 1: Start + 90min = Due Date 3
  - Lesson 2: Start + 120min = Due Date 4
```

### Bilingual Support (English/Turkish)
- `title_en`, `title_tr` for titles
- `description_en`, `description_tr` for descriptions
- `content_en`, `content_tr` for lesson content

### AI Integration Points
1. **Curriculum Generation** - Claude AI creates course structure
2. **Personalization** - Claude adapts curriculum to learning pace
3. **Study Plan Tutor** - Claude answers student questions
4. **Assignment Generation** - Claude creates tailored assignments

### Progress Tracking
- `user_progress` table tracks:
  - Assignment completion status
  - Score/performance
  - Time spent
  - Number of attempts
  - Completion timestamp

---

## Related Tables for Full System

### Study Sessions
- Tracks study activity
- Fields: `id, user_id, course_id, duration, completed_at`

### Study Goals
- User-defined learning goals
- Fields: `id, user_id, goal, due_date, is_completed`

### Learning Paths
- Personalized multi-course paths
- Fields: `id, user_id, title, description, courses[]`

### Analytics Tables
- `course_analytics` - Course performance metrics
- `user_progress_snapshots` - Historical progress data
- `user_activity_logs` - User behavior tracking

---

## Database Design Principles

1. **Normalization:** Each entity in separate table, proper foreign keys
2. **Type Safety:** Drizzle ORM with TypeScript for compile-time type checking
3. **Temporal Data:** All tables include `created_at` timestamps
4. **Soft Deletes:** Status fields (`completed`, `active`) instead of hard deletes
5. **JSON Support:** Complex data (AI outputs) stored in JSONB columns
6. **Indexing:** Primary keys on all tables, foreign keys properly indexed

---

## Summary: Mapping Your Requirements to Implementation

| Your Requirement | Our Implementation | Status |
|---|---|---|
| Users (id, name, email, role) | `users` table | ✅ Complete |
| Courses (id, title, description, created_by) | `courses` table (instructorId = created_by) | ✅ Complete |
| Enrollments (user_id, course_id, enrolled_at) | `user_courses` table | ✅ Complete |
| Curricula (modules, lessons, duration) | `curriculums` + `modules` + `lessons` | ✅ Complete |
| StudyPlans (user_id, course_id, curriculum_id, dates, status) | `study_plans` table | ✅ Complete |
| Assignments (study_plan_id, due_date, status) | `assignments` table | ✅ Complete |
| Progress (assignment_id, user_id, completed_at) | `user_progress` table | ✅ Complete |

**All core entities are implemented and operational!**
