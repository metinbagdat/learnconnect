# TYT Dashboard Integration Guide

## Components Created

The following components have been created and are ready to be integrated into the TYT dashboard:

1. **CurriculumTree Component**: `client/src/components/curriculum/curriculum-tree.tsx`
2. **AIPlanGenerator Component**: `client/src/components/curriculum/ai-plan-generator.tsx`

## Integration Steps

To integrate these components into your TYT dashboard (`client/src/pages/tyt-dashboard.tsx`), follow these steps:

### 1. Import the Components

Add these imports at the top of your TYT dashboard file:

```typescript
import CurriculumTree from '@/components/curriculum/curriculum-tree';
import AIPlanGenerator from '@/components/curriculum/ai-plan-generator';
```

### 2. Add New Tabs

In your TabsList component, add two new tabs:

```typescript
<TabsList className="grid w-full grid-cols-6 bg-muted/50">  // Changed from 4 to 6
  <TabsTrigger value="overview">...</TabsTrigger>
  <TabsTrigger value="subjects">...</TabsTrigger>
  <TabsTrigger value="trials">...</TabsTrigger>
  <TabsTrigger value="tasks">...</TabsTrigger>
  
  {/* NEW TABS */}
  <TabsTrigger value="curriculum" className="flex items-center gap-2">
    <BookOpen className="h-4 w-4" />
    <BilingualText text="Müfredat – Curriculum" />
  </TabsTrigger>
  <TabsTrigger value="ai-plan" className="flex items-center gap-2">
    <Brain className="h-4 w-4" />
    <BilingualText text="AI Plan – AI Plan" />
  </TabsTrigger>
</TabsList>
```

### 3. Update Active Tab Type

Update the activeTab state type to include the new tabs:

```typescript
const [activeTab, setActiveTab] = useState<'overview' | 'subjects' | 'trials' | 'tasks' | 'curriculum' | 'ai-plan'>('overview');
```

### 4. Add Tab Content

Inside your TabsContent sections, add the new tab contents after the existing ones:

```typescript
{/* Existing tabs... */}

{/* Curriculum Tab */}
<TabsContent value="curriculum" className="space-y-6">
  <CurriculumTree />
</TabsContent>

{/* AI Plan Tab */}
<TabsContent value="ai-plan" className="space-y-6">
  <AIPlanGenerator />
</TabsContent>
```

## Required Imports

Make sure you have these imports if not already present:

```typescript
import { BookOpen, Brain } from "lucide-react";
```

## Files Ready

All necessary files have been created:

- ✅ Firebase config: `client/src/lib/firebase.ts`
- ✅ Curriculum service: `client/src/services/curriculumService.ts`
- ✅ Type definitions: `client/src/types/curriculum.ts`
- ✅ API endpoint: `api/ai-plan.js`
- ✅ CurriculumTree component: `client/src/components/curriculum/curriculum-tree.tsx`
- ✅ AIPlanGenerator component: `client/src/components/curriculum/ai-plan-generator.tsx`

## Environment Variables

Make sure to add Firebase environment variables to `.env`:

```
VITE_FIREBASE_API_KEY=your_key
VITE_FIREBASE_AUTH_DOMAIN=your_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Testing

After integration:

1. Navigate to the TYT dashboard
2. Click on the "Müfredat" tab to see the curriculum tree
3. Click on the "AI Plan" tab to generate an AI study plan
