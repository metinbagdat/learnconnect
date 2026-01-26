import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs,
  addDoc,
  Timestamp,
  doc,
  updateDoc,
  increment,
} from 'firebase/firestore';
import {
  MessageSquare,
  Heart,
  Share2,
  Hash,
  Send,
  Plus,
  X,
} from 'lucide-react';
import MainNavbar from '@/components/layout/MainNavbar';
import AuthGuard from '@/components/auth/AuthGuard';

interface CommunityPost {
  id: string;
  userId: string;
  userName: string;
  title?: string;
  content: string;
  tags: string[];
  likes: number;
  comments: number;
  createdAt: any;
  likedBy?: string[];
}

interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: any;
}

export default function Community() {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<{ [postId: string]: Comment[] }>({});
  const [newComment, setNewComment] = useState('');
  const [isCreatingPost, setIsCreatingPost] = useState(false);
  
  // Post creation form
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postTags, setPostTags] = useState('');

  // Check URL for pre-filled content (from notebook share)
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const shareContent = params.get('share');
    const shareTags = params.get('tags');
    
    if (shareContent) {
      // Parse markdown-style title if present
      const titleMatch = shareContent.match(/^\*\*(.+?)\*\*\n\n(.+)/s);
      if (titleMatch) {
        setPostTitle(titleMatch[1]);
        setPostContent(titleMatch[2]);
      } else {
        setPostContent(shareContent);
      }
      if (shareTags) {
        setPostTags(shareTags);
      }
      setIsCreatingPost(true);
      // Clean URL
      setLocation('/community');
    }
  }, [location, setLocation]);

  // Fetch posts
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const postsRef = collection(db, 'communityPosts');
        const q = query(
          postsRef,
          orderBy('createdAt', 'desc'),
          limit(50)
        );
        const snapshot = await getDocs(q);
        const fetchedPosts = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as CommunityPost[];
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPosts();
  }, []);

  // Fetch comments for selected post
  useEffect(() => {
    if (!selectedPost) return;

    const fetchComments = async () => {
      try {
        const commentsRef = collection(db, 'communityPosts', selectedPost.id, 'comments');
        const q = query(
          commentsRef,
          orderBy('createdAt', 'asc')
        );
        const snapshot = await getDocs(q);
        const fetchedComments = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as Comment[];
        setComments(prev => ({
          ...prev,
          [selectedPost.id]: fetchedComments,
        }));
      } catch (error) {
        console.error('Error fetching comments:', error);
      }
    };

    fetchComments();
  }, [selectedPost]);

  const handleCreatePost = async () => {
    if (!postContent.trim() || !user?.id) return;

    try {
      const tags = postTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => t.startsWith('#') ? t.slice(1) : t);

      await addDoc(collection(db, 'communityPosts'), {
        userId: String(user.id),
        userName: user.displayName || user.username || 'Anonim',
        title: postTitle.trim() || undefined,
        content: postContent,
        tags,
        likes: 0,
        comments: 0,
        likedBy: [],
        createdAt: Timestamp.now(),
      });

      // Refresh posts
      const postsRef = collection(db, 'communityPosts');
      const q = query(
        postsRef,
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CommunityPost[];
      setPosts(fetchedPosts);

      // Reset form
      setPostTitle('');
      setPostContent('');
      setPostTags('');
      setIsCreatingPost(false);
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Gönderi oluşturulurken hata oluştu');
    }
  };

  const handleLike = async (post: CommunityPost) => {
    if (!user?.id) return;

    try {
      const userId = String(user.id);
      const isLiked = post.likedBy?.includes(userId) || false;
      const postRef = doc(db, 'communityPosts', post.id);

      if (isLiked) {
        // Unlike
        await updateDoc(postRef, {
          likes: increment(-1),
          likedBy: post.likedBy?.filter(id => id !== userId) || [],
        });
      } else {
        // Like
        await updateDoc(postRef, {
          likes: increment(1),
          likedBy: [...(post.likedBy || []), userId],
        });
      }

      // Refresh posts
      const postsRef = collection(db, 'communityPosts');
      const q = query(
        postsRef,
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot = await getDocs(q);
      const fetchedPosts = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CommunityPost[];
      setPosts(fetchedPosts);
    } catch (error) {
      console.error('Error liking post:', error);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost || !user?.id) return;

    try {
      await addDoc(
        collection(db, 'communityPosts', selectedPost.id, 'comments'),
        {
          userId: String(user.id),
          userName: user.displayName || user.username || 'Anonim',
          content: newComment,
          createdAt: Timestamp.now(),
        }
      );

      // Update comment count
      const postRef = doc(db, 'communityPosts', selectedPost.id);
      await updateDoc(postRef, {
        comments: increment(1),
      });

      // Refresh comments
      const commentsRef = collection(db, 'communityPosts', selectedPost.id, 'comments');
      const q = query(
        commentsRef,
        orderBy('createdAt', 'asc')
      );
      const snapshot = await getDocs(q);
      const fetchedComments = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as Comment[];
      setComments(prev => ({
        ...prev,
        [selectedPost.id]: fetchedComments,
      }));

      // Refresh posts to update comment count
      const postsRef = collection(db, 'communityPosts');
      const q2 = query(
        postsRef,
        orderBy('createdAt', 'desc'),
        limit(50)
      );
      const snapshot2 = await getDocs(q2);
      const fetchedPosts = snapshot2.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as CommunityPost[];
      setPosts(fetchedPosts);

      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      alert('Yorum eklenirken hata oluştu');
    }
  };

  const isLiked = (post: CommunityPost) => {
    if (!user?.id) return false;
    return post.likedBy?.includes(String(user.id)) || false;
  };

  if (loading) {
    return (
      <AuthGuard children={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-4 text-gray-600">Yükleniyor...</p>
          </div>
        </div>
      } />
    );
  }

  return (
    <AuthGuard children={
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <MainNavbar />
        
        <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24 md:pb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Topluluk</h1>
            <button
              onClick={() => setIsCreatingPost(!isCreatingPost)}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Yeni Gönderi</span>
            </button>
          </div>

          {/* Create Post Form */}
          {isCreatingPost && (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Yeni Gönderi</h2>
                <button
                  onClick={() => {
                    setIsCreatingPost(false);
                    setPostTitle('');
                    setPostContent('');
                    setPostTags('');
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Başlık (İsteğe bağlı)
                  </label>
                  <input
                    type="text"
                    value={postTitle}
                    onChange={(e) => setPostTitle(e.target.value)}
                    placeholder="Gönderi başlığı..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İçerik
                  </label>
                  <textarea
                    value={postContent}
                    onChange={(e) => setPostContent(e.target.value)}
                    placeholder="Ne paylaşmak istiyorsun?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    rows={6}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Etiketler (virgülle ayırın)
                  </label>
                  <div className="flex items-center space-x-2">
                    <Hash className="h-5 w-5 text-gray-400" />
                    <input
                      type="text"
                      value={postTags}
                      onChange={(e) => setPostTags(e.target.value)}
                      placeholder="tyt, matematik, soru"
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
                <button
                  onClick={handleCreatePost}
                  disabled={!postContent.trim()}
                  className="w-full px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  Paylaş
                </button>
              </div>
            </div>
          )}

          {/* Posts Feed */}
          <div className="space-y-4">
            {posts.length > 0 ? (
              posts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                        {post.userName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{post.userName}</p>
                        <p className="text-sm text-gray-500">
                          {post.createdAt?.toDate?.().toLocaleDateString('tr-TR', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          }) ||
                            new Date(post.createdAt?.seconds * 1000).toLocaleDateString('tr-TR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                        </p>
                      </div>
                    </div>
                  </div>

                  {post.title && (
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
                  )}
                  <p className="text-gray-700 whitespace-pre-wrap mb-4">{post.content}</p>

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-4">
                      {post.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-1 bg-blue-50 text-blue-600 text-xs rounded"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-6 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => handleLike(post)}
                      className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg transition-colors ${
                        isLiked(post)
                          ? 'bg-red-50 text-red-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <Heart className={`h-5 w-5 ${isLiked(post) ? 'fill-current' : ''}`} />
                      <span>{post.likes || 0}</span>
                    </button>
                    <button
                      onClick={() => setSelectedPost(selectedPost?.id === post.id ? null : post)}
                      className="flex items-center space-x-2 px-3 py-1.5 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                    >
                      <MessageSquare className="h-5 w-5" />
                      <span>{post.comments || 0}</span>
                    </button>
                  </div>

                  {/* Comments Section */}
                  {selectedPost?.id === post.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                        {comments[post.id]?.length > 0 ? (
                          comments[post.id].map((comment) => (
                            <div key={comment.id} className="flex items-start space-x-3">
                              <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                {comment.userName.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-gray-900">
                                  {comment.userName}
                                </p>
                                <p className="text-sm text-gray-700">{comment.content}</p>
                                <p className="text-xs text-gray-400 mt-1">
                                  {comment.createdAt?.toDate?.().toLocaleDateString('tr-TR', {
                                    day: 'numeric',
                                    month: 'short',
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  }) ||
                                    new Date(comment.createdAt?.seconds * 1000).toLocaleDateString('tr-TR', {
                                      day: 'numeric',
                                      month: 'short',
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    })}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500 text-center py-4">
                            Henüz yorum yok. İlk yorumu sen yap!
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment();
                            }
                          }}
                          placeholder="Yorum yaz..."
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                        <button
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                        >
                          <Send className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
                <MessageSquare className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Henüz gönderi yok
                </h3>
                <p className="text-gray-600 mb-6">
                  İlk gönderiyi sen oluştur ve topluluğa katıl!
                </p>
                <button
                  onClick={() => setIsCreatingPost(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  İlk Gönderiyi Oluştur
                </button>
              </div>
            )}
          </div>
        </main>
      </div>
    } />
  );
}
