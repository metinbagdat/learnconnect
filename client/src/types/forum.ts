/**
 * Forum type definitions
 */

export interface ForumPost {
  id: string | number;
  title: string;
  content: string;
  authorId?: number | string;
  authorName?: string;
  courseId?: string | number;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  voteCount?: number;
  replyCount?: number;
  [key: string]: any;
}

export interface ForumReply {
  id: string | number;
  postId: string | number;
  content: string;
  authorId?: number | string;
  authorName?: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  voteCount?: number;
  [key: string]: any;
}

export interface ForumVote {
  postId: string | number;
  type: 'up' | 'down';
  [key: string]: any;
}
