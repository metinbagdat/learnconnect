# Firestore Index Requirements

## Required Composite Indexes

The following composite indexes need to be created in Firebase Console for the new features to work properly.

### 1. Notes Collection

#### Index: notes_by_user_updatedAt
- Collection: `notes`
- Fields:
  - `userId` (Ascending)
  - `updatedAt` (Descending)

**Purpose**: Fetch user's notes sorted by most recently updated

#### Index: notes_by_user_tags_updatedAt (if needed for tag filtering)
- Collection: `notes`
- Fields:
  - `userId` (Ascending)
  - `tags` (Array Contains)
  - `updatedAt` (Descending)

**Purpose**: Filter notes by tags for a specific user

### 2. Study Stats Collection

#### Index: studyStats_by_user_date
- Collection: `studyStats`
- Fields:
  - `userId` (Ascending)
  - `date` (Ascending)

**Purpose**: Fetch today's study stats for a user

### 3. Learning Paths (Phase 2)

#### Index: learningPaths_by_category_createdAt
- Collection: `learningPaths`
- Fields:
  - `category` (Ascending)
  - `createdAt` (Descending)

**Purpose**: List learning paths by category

**Note**: If you only query by `createdAt`, a single-field index is sufficient (auto-created).

### 4. User Path Progress (Phase 2)

#### Index: userPathProgress_by_user_pathId
- Collection: `userPathProgress`
- Fields:
  - `userId` (Ascending)
  - `pathId` (Ascending)

**Purpose**: Fetch specific path progress for a user

#### Index: userPathProgress_by_user_updatedAt
- Collection: `userPathProgress`
- Fields:
  - `userId` (Ascending)
  - `updatedAt` (Descending)

**Purpose**: Fetch user's active learning paths sorted by recent activity

### 5. Community Posts (Phase 3)

#### Index: communityPosts_by_createdAt
- Collection: `communityPosts`
- Fields:
  - `createdAt` (Descending)

**Purpose**: List community posts in chronological order

**Note**: Single-field index, usually auto-created by Firestore.

### 6. Comments (Phase 3)

#### Index: comments_by_post_createdAt
- Collection: `comments`
- Fields:
  - `postId` (Ascending)
  - `createdAt` (Ascending)

**Purpose**: Fetch comments for a specific post in chronological order

## How to Create Indexes

1. Go to Firebase Console → Firestore Database → Indexes
2. Click "Create Index"
3. Select the collection name
4. Add fields in the order specified above
5. Set field order (Ascending/Descending) as specified
6. Click "Create"

## Alternative: Auto-create via Error Messages

When you run queries that require indexes, Firebase will show an error with a direct link to create the required index. You can click that link to auto-create the index.

## Notes

- Indexes are created asynchronously and may take a few minutes
- You can continue development while indexes are being created
- Queries will fail until indexes are ready, but the app won't crash
