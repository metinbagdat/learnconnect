import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ThumbsUp, MessageCircle, Plus } from 'lucide-react';
import { apiRequest, queryClient } from '@/lib/queryClient';
import type { ForumPost, ForumReply } from '@/types/forum';

interface ForumProps {
  courseId?: string;
}

export default function ForumComponent({ courseId }: ForumProps) {
  const [showNewPostDialog, setShowNewPostDialog] = useState(false);
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [newReply, setNewReply] = useState('');

  const { data: postsData } = useQuery<any>({
    queryKey: ['/api/forum/posts', courseId],
  });

  const { data: repliesData } = useQuery<any>({
    queryKey: ['/api/forum/replies', selectedPost],
    enabled: !!selectedPost,
  });
  
  const posts: ForumPost[] = Array.isArray(postsData) ? postsData : [];
  const replies: ForumReply[] = Array.isArray(repliesData) ? repliesData : [];

  const createPostMutation = useMutation({
    mutationFn: (data: { title: string; content: string }) => {
      const payload: any = { ...data };
      if (courseId) payload.courseId = courseId;
      return apiRequest('POST', '/api/forum/posts', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
      setNewPost({ title: '', content: '' });
      setShowNewPostDialog(false);
    },
  });

  const createReplyMutation = useMutation({
    mutationFn: (data: { content: string }) =>
      apiRequest('POST', `/api/forum/posts/${selectedPost}/replies`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/replies', selectedPost] });
      setNewReply('');
    },
  });

  const voteMutation = useMutation({
    mutationFn: ({ postId, type }: { postId: string; type: string }) =>
      apiRequest('POST', `/api/forum/posts/${postId}/vote`, { type }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
    },
  });

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Forum</h2>
        <Button
          onClick={() => setShowNewPostDialog(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" /> Yeni Başlık
        </Button>
      </div>

      {/* New Post Dialog */}
      {showNewPostDialog && (
        <Card className="p-6 bg-blue-50 dark:bg-blue-950">
          <h3 className="font-bold mb-4">Yeni Başlık Oluştur</h3>
          <Input
            placeholder="Başlık"
            value={newPost.title}
            onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
            className="mb-4"
          />
          <Textarea
            placeholder="İçerik..."
            value={newPost.content}
            onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
            className="mb-4"
          />
          <div className="flex gap-2">
            <Button
              onClick={() => {
                createPostMutation.mutate({ title: newPost.title, content: newPost.content });
              }}
              disabled={createPostMutation.isPending}
            >
              Oluştur
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowNewPostDialog(false)}
            >
              İptal
            </Button>
          </div>
        </Card>
      )}

      {/* Posts List */}
      {!selectedPost ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => setSelectedPost(String(post.id))}
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-lg">{post.title}</h3>
                <Badge>{post.category || 'Genel'}</Badge>
              </div>
              <p className="text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">
                {post.content}
              </p>
              <div className="flex gap-4 text-sm text-slate-500">
                <button className="flex items-center gap-1 hover:text-blue-600">
                  <ThumbsUp className="w-4 h-4" /> {post.upvotes || 0}
                </button>
                <button className="flex items-center gap-1 hover:text-blue-600">
                  <MessageCircle className="w-4 h-4" /> {post.answerCount || 0}
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* Post Detail */}
          {posts.find((p) => String(p.id) === String(selectedPost)) && (
            <Card className="p-6">
              <button
                onClick={() => setSelectedPost(null)}
                className="text-blue-600 hover:underline mb-4"
              >
                ← Geri Dön
              </button>
              <h2 className="text-2xl font-bold mb-4">
                {posts.find((p) => String(p.id) === String(selectedPost))?.title}
              </h2>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                {posts.find((p) => String(p.id) === String(selectedPost))?.content}
              </p>

              {/* Replies */}
              <div className="space-y-4 mb-6 border-t pt-6">
                <h3 className="font-bold">Yanıtlar ({replies.length})</h3>
                {replies.map((reply) => (
                  <Card key={reply.id} className="p-4 bg-slate-50 dark:bg-slate-800">
                    <p className="mb-2">{reply.content}</p>
                    <p className="text-xs text-slate-500">
                      {reply.authorName || 'Kullanıcı'}
                    </p>
                  </Card>
                ))}
              </div>

              {/* Add Reply */}
              <Textarea
                placeholder="Yanıt yazın..."
                value={newReply}
                onChange={(e) => setNewReply(e.target.value)}
                className="mb-4"
              />
              <Button
                onClick={() => {
                  createReplyMutation.mutate({ content: newReply } as any);
                }}
                disabled={createReplyMutation.isPending}
              >
                Gönder
              </Button>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
