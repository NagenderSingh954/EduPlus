'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { MessageSquare, ThumbsUp, CheckCircle2, Eye, Plus, Tag, ChevronDown, ChevronUp, Send, X, Trash2, AlertCircle } from 'lucide-react';

const CATEGORIES = ['All', 'Computer Science', 'Mathematics', 'Operating Systems', 'Database Systems', 'Networking', 'Machine Learning', 'General Academic'];

export default function CommunityPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [expandedPost, setExpandedPost] = useState<string | null>(null);
  const [postDetail, setPostDetail] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'Computer Science', tags: '' });
  const [newAnswer, setNewAnswer] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [postError, setPostError] = useState<string | null>(null);
  const [postSuccess, setPostSuccess] = useState<string | null>(null);

  const loadPosts = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category !== 'All') params.set('category', category);
      if (search) params.set('search', search);
      const res = await fetchApi(`/community/posts?${params.toString()}`);
      if (res.success) setPosts(res.data);
    } catch (err: any) {
      console.error('Failed to load posts:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadPosts(); }, [category]);

  const loadPostDetail = async (id: string) => {
    if (expandedPost === id) {
      setExpandedPost(null);
      setPostDetail(null);
      return;
    }
    setExpandedPost(id);
    try {
      const res = await fetchApi(`/community/posts/${id}`);
      if (res.success) setPostDetail(res.data);
    } catch (err) { console.error(err); }
  };

  const createPost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      setPostError('Please provide both a title and description for your doubt.');
      return;
    }
    setSubmitting(true);
    setPostError(null);
    setPostSuccess(null);
    try {
      const tags = newPost.tags.split(',').map(t => t.trim()).filter(Boolean);
      const res = await fetchApi('/community/posts', {
        method: 'POST',
        body: JSON.stringify({ ...newPost, tags })
      });
      if (res.success) {
        setPostSuccess('Your doubt has been posted to the community!');
        setNewPost({ title: '', content: '', category: 'Computer Science', tags: '' });
        setTimeout(() => {
          setShowCreate(false);
          setPostSuccess(null);
        }, 1200);
        await loadPosts();
      } else {
        setPostError(res.message || 'Failed to post doubt.');
      }
    } catch (err: any) {
      console.error('Create post error:', err);
      setPostError(err.message || 'Error posting doubt to server.');
    } finally {
      setSubmitting(false);
    }
  };

  const deletePost = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this question?')) return;
    try {
      await fetchApi(`/community/posts/${id}`, { method: 'DELETE' });
      await loadPosts();
    } catch (err: any) {
      alert(err.message || 'Failed to delete post.');
    }
  };

  const submitAnswer = async (postId: string) => {
    if (!newAnswer.trim()) return;
    try {
      await fetchApi(`/community/posts/${postId}/answers`, {
        method: 'POST',
        body: JSON.stringify({ content: newAnswer })
      });
      setNewAnswer('');
      await loadPostDetail(postId);
      await loadPosts();
    } catch (err) { console.error(err); }
  };

  const vote = async (postId: string) => {
    try {
      await fetchApi(`/community/posts/${postId}/vote`, {
        method: 'POST',
        body: JSON.stringify({ voteType: 'UP' })
      });
      await loadPosts();
      if (expandedPost === postId) {
        await loadPostDetail(postId);
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white">Community Doubts</h1>
          <p className="text-xs text-slate-400 mt-1">Student-powered Q&A · Ask doubts · Help others</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-sm font-semibold transition-all shadow-glow-primary"
        >
          <Plus className="w-4 h-4" /> Ask Question
        </button>
      </div>

      {/* Create Post Modal */}
      {showCreate && (
        <div className="glass-card rounded-2xl p-5 border border-primary/30 animate-fade-in-up">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-white">Post a Question</h2>
            <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-slate-400" /></button>
          </div>
          <div className="space-y-3">
            {postError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{postError}</span>
              </div>
            )}
            {postSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{postSuccess}</span>
              </div>
            )}
            <input
              value={newPost.title}
              onChange={e => setNewPost(p => ({ ...p, title: e.target.value }))}
              placeholder="What's your question or doubt? (e.g. How does 3NF decomposition work?)"
              className="w-full bg-surface-elevated text-white text-sm placeholder-slate-500 rounded-xl px-4 py-3 border border-border/40 focus:border-primary/50 outline-none"
            />
            <textarea
              value={newPost.content}
              onChange={e => setNewPost(p => ({ ...p, content: e.target.value }))}
              placeholder="Describe your question in detail..."
              rows={4}
              className="w-full bg-surface-elevated text-white text-sm placeholder-slate-500 rounded-xl px-4 py-3 border border-border/40 focus:border-primary/50 outline-none resize-none"
            />
            <div className="flex gap-3">
              <select
                value={newPost.category}
                onChange={e => setNewPost(p => ({ ...p, category: e.target.value }))}
                className="flex-1 bg-surface-elevated text-white text-sm rounded-xl px-4 py-3 border border-border/40 focus:border-primary/50 outline-none"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c}>{c}</option>)}
              </select>
              <input
                value={newPost.tags}
                onChange={e => setNewPost(p => ({ ...p, tags: e.target.value }))}
                placeholder="Tags (comma-separated, e.g. SQL, DBMS)"
                className="flex-1 bg-surface-elevated text-white text-sm placeholder-slate-500 rounded-xl px-4 py-3 border border-border/40 focus:border-primary/50 outline-none"
              />
            </div>
            <button
              onClick={createPost}
              disabled={submitting || !newPost.title.trim() || !newPost.content.trim()}
              className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover disabled:opacity-50 transition-all shadow-glow-primary"
            >
              {submitting ? 'Posting Doubt...' : 'Post Question'}
            </button>
          </div>
        </div>
      )}

      {/* Category Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`shrink-0 text-xs px-3 py-1.5 rounded-xl font-medium transition-all ${category === cat ? 'bg-primary text-white' : 'bg-surface-elevated text-slate-400 hover:text-white'}`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && loadPosts()}
          placeholder="Search doubts..."
          className="flex-1 bg-surface-elevated text-white text-sm placeholder-slate-500 rounded-xl px-4 py-3 border border-border/40 focus:border-primary/50 outline-none"
        />
        <button onClick={loadPosts} className="px-4 py-2 rounded-xl bg-primary/20 text-primary-glow text-sm font-semibold hover:bg-primary/30 transition-all">
          Search
        </button>
      </div>

      {/* Posts */}
      {loading ? (
        <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
      ) : posts.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 border border-border/40 text-center">
          <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">No questions found. Be the first to ask!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <div key={post.id} className="glass-card rounded-2xl border border-border/40 overflow-hidden">
              <div
                className="p-4 cursor-pointer hover:bg-surface-elevated/30 transition-colors"
                onClick={() => loadPostDetail(post.id)}
              >
                <div className="flex items-start gap-3">
                  <img src={post.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.firstName}`} alt="" className="w-8 h-8 rounded-full bg-surface-elevated shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-white">{post.title}</h3>
                      {post.hasAcceptedAnswer && <span className="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded-md font-semibold flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5" />Solved</span>}
                      {post.isResolved && !post.hasAcceptedAnswer && <span className="text-[10px] bg-primary/20 text-primary-glow px-1.5 py-0.5 rounded-md">Resolved</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1 truncate">{post.content}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-[11px] text-slate-500 bg-surface-elevated px-2 py-0.5 rounded-lg">{post.category}</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400"><MessageSquare className="w-3 h-3" />{post.answersCount}</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400"><ThumbsUp className="w-3 h-3" />{post.score}</span>
                      <span className="flex items-center gap-1 text-[11px] text-slate-400"><Eye className="w-3 h-3" />{post.views}</span>
                      <span className="text-[11px] text-slate-500 ml-auto">{post.author.firstName} {post.author.lastName}</span>
                    </div>
                    {Array.isArray(post.tags) && post.tags.length > 0 && (
                      <div className="flex gap-1 mt-2 flex-wrap">
                        {post.tags.slice(0, 4).map((t: string) => (
                          <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary-glow">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-center gap-1">
                    <button
                      onClick={e => { e.stopPropagation(); vote(post.id); }}
                      className="p-1.5 rounded-lg hover:bg-primary/20 text-slate-400 hover:text-primary-glow transition-all"
                      title="Upvote"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                    </button>
                    {user?.id === post.author.id && (
                      <button
                        onClick={e => deletePost(post.id, e)}
                        className="p-1.5 rounded-lg hover:bg-danger/20 text-slate-400 hover:text-danger transition-all"
                        title="Delete question"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {expandedPost === post.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>
              </div>

              {/* Expanded Answers */}
              {expandedPost === post.id && postDetail && postDetail.id === post.id && (
                <div className="border-t border-border/30 p-4 space-y-4 animate-fade-in-up">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{postDetail.answers.length} Answers</h4>
                  {postDetail.answers.length === 0 ? (
                    <p className="text-sm text-slate-500">No answers yet. Be the first to help!</p>
                  ) : (
                    postDetail.answers.map((ans: any) => (
                      <div key={ans.id} className={`p-3 rounded-xl border ${ans.isAccepted ? 'border-accent/30 bg-accent/5' : 'border-border/30 bg-surface-elevated/30'}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <img src={ans.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${ans.author.firstName}`} alt="" className="w-6 h-6 rounded-full bg-surface-elevated" />
                          <span className="text-xs font-semibold text-white">{ans.author.firstName} {ans.author.lastName}</span>
                          {ans.isAccepted && <span className="flex items-center gap-1 text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-md"><CheckCircle2 className="w-2.5 h-2.5" />Best Answer</span>}
                          <span className="text-[10px] text-slate-500 ml-auto">+{ans.score}</span>
                        </div>
                        <p className="text-sm text-slate-200 leading-relaxed">{ans.content}</p>
                      </div>
                    ))
                  )}

                  {/* Answer Input */}
                  <div className="flex gap-2 mt-3">
                    <textarea
                      value={newAnswer}
                      onChange={e => setNewAnswer(e.target.value)}
                      placeholder="Write your answer..."
                      rows={2}
                      className="flex-1 bg-surface-elevated text-white text-sm placeholder-slate-500 rounded-xl px-3 py-2 border border-border/40 focus:border-primary/50 outline-none resize-none"
                    />
                    <button
                      onClick={() => submitAnswer(post.id)}
                      disabled={!newAnswer.trim()}
                      className="p-2.5 rounded-xl bg-primary text-white disabled:opacity-50 transition-all self-start shrink-0"
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
