# Admin Dashboard Setup Guide

## Overview
The Admin Dashboard allows authorized administrators to manage curriculum data in Firestore, generate curriculum using AI, and manage users.

## Setup Steps

### 1. Create Admin User in Firebase Console

1. Go to Firebase Console → Authentication
2. Click "Add User"
3. Enter admin email and password
4. Note the User UID (you'll need this)

### 2. Add Admin to Firestore

1. Go to Firebase Console → Firestore Database
2. Create a new collection called `admins`
3. Create a document with the User UID as the document ID
4. Add the following fields:
   - `email` (string): Admin email address
   - `role` (string): "super_admin" or "content_admin"
   - `permissions` (array): ["manage_content", "manage_users", "view_analytics"]
   - `createdAt` (timestamp): Current timestamp

### 3. Deploy Firestore Rules

1. Go to Firebase Console → Firestore Database → Rules
2. Copy the content from `firestore.rules` file
3. Paste into the Rules editor
4. Click "Publish"

### 4. Access Admin Dashboard

The admin dashboard can be accessed at `/admin` route. The component will:
- Check if user is authenticated
- Check if user is admin (exists in `admins` collection)
- Show login form if not authenticated or not admin
- Show admin panel if authenticated and admin

### 5. Using the Admin Dashboard

#### Curriculum Management
- Select exam type (TYT/AYT/YKS)
- Add subjects manually
- Add topics and subtopics to subjects
- Delete subjects (and their nested data)

#### AI Curriculum Generator
- Select exam type
- Use predefined prompts or create custom prompt
- Generate curriculum using AI
- Preview generated curriculum
- Save to Firestore

### 6. Environment Variables

For AI curriculum generation, add to `.env`:
```
OPENAI_API_KEY=your_openai_api_key_here
```

If OpenAI API key is not set, the endpoint will return mock data.

## File Structure

```
client/src/
├── components/admin/
│   ├── AdminDashboard.tsx      # Main container
│   ├── AdminLogin.tsx          # Login form
│   ├── AdminPanel.tsx          # Tabbed panel
│   ├── CurriculumManager.tsx   # Curriculum CRUD
│   └── AICurriculumGenerator.tsx # AI generator
├── hooks/
│   └── use-admin-auth.ts       # Admin auth hook
├── services/
│   └── aiCurriculumService.ts  # AI service
└── pages/
    └── admin-page.tsx          # Admin page route

api/
└── generate-curriculum.js      # AI endpoint
```

## Security Notes

1. Admin collection can only be written from Firebase Console (rules prevent client writes)
2. Curriculum write access is restricted to admins only
3. OpenAI API key is stored server-side only
4. All admin operations require authentication and admin status verification

## Testing

1. **Admin Auth Test**: Login with admin credentials, verify access to admin panel
2. **Curriculum CRUD Test**: Add subjects, topics, subtopics, verify in TYT Dashboard
3. **AI Generator Test**: Generate curriculum, save to Firestore, verify in CurriculumTree

## Troubleshooting

- **Cannot access admin panel**: Check if user UID exists in `admins` collection
- **Permission denied**: Verify Firestore rules are published
- **AI generation fails**: Check OpenAI API key in environment variables
- **Data not appearing**: Check Firestore rules allow public read for curriculum
