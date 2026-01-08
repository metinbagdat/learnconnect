---
name: Fix TypeScript Build Errors - Systematic Approach
overview: ""
todos: []
---

# Fix TypeScript Build Errors - Systematic Approach

## Overview

Fix TypeScript errors systematically by category, starting with client-side pages, then server-side services. Each phase includes specific file paths and code examples.

## Phase 1: Missing Component Imports (5 minutes)

### Step 1.1: Fix PageWrapper Import in tyt-dashboard.tsx

**File**: `client/src/pages/tyt-dashboard.tsx`

**Error**: `TS2304: Cannot find name 'PageWrapper'` at lines 158, 237

**Fix**: Add import at top of file:

```typescript
import PageWrapper from "@/components/layout/page-wrapper";
```

**Note**: PageWrapper exists as default export at `client/src/components/layout/page-wrapper.tsx`, so this import should work.

---

## Phase 2: Client-Side Type Definitions (45 minutes)

### Step 2.1: Create Type Definitions File

**File**: `client/src/types/dashboard.ts` (create new)

**Content**:

```typescript
export interface StudentAIDashboardData {
  goals?: Array<{
    id: string | number;
    text: string;
    completed?: boolean;
    [key: string]: any;
  }>;
  courseRecommendations?: any[];
  studyPlanSuggestions?: any[];
  goalSuggestions?: any[];
  weeklyProgress?: {
    [key: string]: any;
  };
  topStrengths?: Array<{
    label: string;
    value: number;
    [key: string]: any;
  }>;
  areasForImprovement?: Array<{
    label: string;
    value: number;
    [key: string]: any;
  }>;
  [key: string]: any;
}

export interface StudentControlPanelData {
  assignments?: any[];
  achievements?: any[];
  [key: string]: any;
}

export interface StudentEnrollmentData {
  enrolledCourses?: any[];
  upcomingAssignments?: any[];
  [key: string]: any;
}

export interface StudyPlanDashboardData {
  assignments?: any[];
  modules?: any[];
  [key: string]: any;
}

export interface SystemHealthData {
  status?: string;
  aiAccuracy?: number;
  systemReliability?: number;
  totalEndpoints?: number;
  completionPercentage?: number;
  components?: any[];
  performanceTargets?: any;
  alerts?: any[];
  [key: string]: any;
}

export interface WaitlistManagementData {
  filter?: any;
  length?: number;
  map?: any;
  [key: string]: any;
}
```

### Step 2.2: Fix student-ai-dashboard.tsx

**File**: `client/src/pages/student-ai-dashboard.tsx`

**Errors to fix**:

- Line 240: `Property 'goals' does not exist on type '{}'`
- Line 309: `Property 'courseRecommendations' does not exist on type '{}'`
- Line 341: `Property 'studyPlanSuggestions' does not exist on type '{}'`
- Line 368: `Property 'goalSuggestions' does not exist on type '{}'`
- Line 403: `Property 'weeklyProgress' does not exist on type '{}'`
- Line 422: `Parameter 'strength' implicitly has an 'any' type`
- Line 440: `Parameter 'area' implicitly has an 'any' type`

**Fix**:

1. Add import at top:
```typescript
import { StudentAIDashboardData } from "@/types/dashboard";
```

2. Type the query results (around line 40-50):
```typescript
const { data: overview } = useQuery<StudentAIDashboardData>({
  queryKey: ["/api/ai/dashboard/overview"],
});

const { data: goals } = useQuery<StudentAIDashboardData>({
  queryKey: ["/api/ai/dashboard/goals"],
});

const { data: suggestions } = useQuery<StudentAIDashboardData>({
  queryKey: ["/api/ai/dashboard/suggestions"],
});
```

3. Fix implicit any in map functions (line 422, 440):
```typescript
// Line 422 - Change from:
{topStrengths.map((strength, idx) => ...)}

// To:
{(topStrengths || []).map((strength: any, idx: number) => ...)}

// Line 440 - Change from:
{areasForImprovement.map((area, idx) => ...)}

// To:
{(areasForImprovement || []).map((area: any, idx: number) => ...)}
```

4. Add optional chaining for property access:
```typescript
// Line 240 - Change from:
{goals?.goals && goals.goals.length > 0 ? (

// To:
{goals?.goals && Array.isArray(goals.goals) && goals.goals.length > 0 ? (
```


### Step 2.3: Fix student-control-panel.tsx

**File**: `client/src/pages/student-control-panel.tsx`

**Errors**: Lines 324, 330, 367, 376 - `'assignments' is of type 'unknown'`, `'achievements' is of type 'unknown'`

**Fix**:

1. Add import:
```typescript
import { StudentControlPanelData } from "@/types/dashboard";
```

2. Type the data and add type guards:
```typescript
// Where assignments is used (line 324):
const assignmentList = Array.isArray(assignments) ? assignments : [];
assignmentList.map((assignment: any) => ...)

// Where achievements is used (line 367):
const achievementList = Array.isArray(achievements) ? achievements : [];
achievementList.map((achievement: any) => ...)
```


### Step 2.4: Fix student-enrollment-dashboard.tsx

**File**: `client/src/pages/student-enrollment-dashboard.tsx`

**Errors**: Lines 33, 34, 80, 110, 115, 154 - `'upcomingAssignments' is of type 'unknown'`, `'enrolledCourses' is of type 'unknown'`

**Fix**:

1. Add import:
```typescript
import { StudentEnrollmentData } from "@/types/dashboard";
```

2. Add type guards:
```typescript
const enrolledCoursesList = Array.isArray(enrolledCourses) ? enrolledCourses : [];
const upcomingAssignmentsList = Array.isArray(upcomingAssignments) ? upcomingAssignments : [];
```


### Step 2.5: Fix study-plan-dashboard.tsx

**File**: `client/src/pages/study-plan-dashboard.tsx`

**Errors**:

- Lines 36, 37, 98, 163, 168 - `'assignments' is of type 'unknown'`
- Line 89 - `Type 'unknown' is not assignable to type 'ReactNode'`
- Line 193 - `Type '"warning"' is not assignable to type '"default" | "secondary" | "destructive" | "outline"'`

**Fix**:

1. Add import:
```typescript
import { StudyPlanDashboardData } from "@/types/dashboard";
```

2. Fix assignments usage:
```typescript
const assignmentList = Array.isArray(assignments) ? assignments : [];
```

3. Fix button variant (line 193):
```typescript
// Change from:
variant="warning"

// To:
variant="destructive" // or "default"
```


### Step 2.6: Fix system-health.tsx

**File**: `client/src/pages/system-health.tsx`

**Errors**: Multiple `Property 'X' does not exist on type '{}'` errors

**Fix**:

1. Add import:
```typescript
import { SystemHealthData } from "@/types/dashboard";
```

2. Type the data state:
```typescript
const [healthData, setHealthData] = useState<SystemHealthData>({});
```

3. Add optional chaining and defaults:
```typescript
const status = healthData?.status || 'unknown';
const aiAccuracy = healthData?.aiAccuracy ?? 0;
```


### Step 2.7: Fix waitlist-management.tsx

**File**: `client/src/pages/waitlist-management.tsx`

**Errors**: Lines 77, 91, 106, 107, 146 - `Property 'filter' does not exist on type '{}'`

**Fix**:

1. Add import:
```typescript
import { WaitlistManagementData } from "@/types/dashboard";
```

2. Ensure waitlist is an array:
```typescript
const waitlistArray = Array.isArray(waitlist) ? waitlist : [];
```


### Step 2.8: Fix tyt-dashboard.tsx

**File**: `client/src/pages/tyt-dashboard.tsx`

**Errors**: Multiple property access errors on incomplete types

**Fix**:

1. Add PageWrapper import (already covered in Phase 1)
2. Create type for TYT profile data:
```typescript
interface TYTProfile {
  id: number;
  userId: number;
  isCompleted?: boolean;
  netScore?: number;
  targetTytScore?: number;
  examType?: string;
  examDate?: Date;
  correctAnswers?: number;
  wrongAnswers?: number;
  emptyAnswers?: number;
  completedAt?: Date;
  title?: string;
  description?: string;
  estimatedDuration?: number;
  taskType?: string;
  scheduledTime?: Date;
  priority?: string;
  [key: string]: any;
}
```

3. Type assertions where needed:
```typescript
const profile = tytProfile as TYTProfile;
```


---

## Phase 3: Server-Side Database Type Fixes (60 minutes)

### Step 3.1: Create Server Type Definitions

**File**: `server/types/database.ts` (create new)

**Content**:

```typescript
export interface UserProgressRow {
  id: number;
  userId: number;
  lessonsCompleted?: number;
  hoursStudied?: number;
  performanceScore?: number;
  createdAt?: Date;
  [key: string]: any;
}

export interface StudyGoalRow {
  id: number;
  userId: number;
  goal: string;
  goalText?: string | null;
  title?: string | null;
  examType?: string | null;
  subjects?: string[] | null;
  targetDate?: Date | null;
  dueDate?: string | null;
  isCompleted?: boolean | null;
  completed?: boolean | null;
  progress?: number | null;
  createdAt: Date;
  targetExam?: string;
  studyHoursPerWeek?: number;
  currentProgress?: number;
  status?: string;
  [key: string]: any;
}

export interface UserProfileRow {
  id: number;
  userId: number;
  studentClass?: string;
  examYear?: number;
  targetNetScore?: number;
  dailyStudyHoursTarget?: number;
  selectedSubjects?: string[];
  weakSubjects?: string[];
  strongSubjects?: string[];
  motivationLevel?: string;
  progressPercent?: number;
  masteryLevel?: string;
  lastStudiedAt?: Date;
  [key: string]: any;
}

export interface ExamCategoryRow {
  id: number;
  title: string;
  displayName?: string;
  name?: string;
  totalQuestions?: number;
  code?: string;
  questionCount?: number;
  [key: string]: any;
}
```

### Step 3.2: Fix adaptive-adjustment-service.ts

**File**: `server/adaptive-adjustment-service.ts`

**Errors**:

- Line 42: `Property 'lessonsCompleted' does not exist on type '{ id: number; userId: nu