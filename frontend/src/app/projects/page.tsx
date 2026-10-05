'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  FolderGit2,
  Plus,
  Sparkles,
  CheckCircle2,
  Clock,
  Users,
  Kanban,
  Flag,
  Bot,
  Send,
  AlertCircle,
  ChevronRight,
  Github,
  Layers,
  ArrowRight,
  TrendingUp,
  X
} from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-accent/15 text-accent border-accent/30',
  PLANNING: 'bg-primary/15 text-primary-glow border-primary/30',
  COMPLETED: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
};

const PRIORITY_BADGES: Record<string, string> = {
  LOW: 'bg-slate-500/15 text-slate-400',
  MEDIUM: 'bg-primary/15 text-primary-glow',
  HIGH: 'bg-warning/15 text-warning',
  URGENT: 'bg-danger/15 text-danger-glow'
};

export default function ProjectsPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetail, setProjectDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);

  // AI Project Generator Modal
  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTitle, setAiTitle] = useState('');
  const [aiDescription, setAiDescription] = useState('');
  const [generating, setGenerating] = useState(false);

  // New Task Modal
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    description: '',
    priority: 'MEDIUM',
    milestoneId: '',
    status: 'TODO'
  });
  const [creatingTask, setCreatingTask] = useState(false);

  // AI Project Assistant
  const [aiQuestion, setAiQuestion] = useState('');
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [askingAi, setAskingAi] = useState(false);

  // Load Projects List
  const loadProjects = useCallback(async () => {
    try {
      const res = await fetchApi('/projects');
      if (res.success && res.data) {
        setProjects(res.data);
        if (!selectedProjectId && res.data.length > 0) {
          setSelectedProjectId(res.data[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [selectedProjectId]);

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      loadProjects();
    }
  }, [user, loadProjects]);

  // Load Project Detail when selected
  const loadProjectDetail = useCallback(async (id: string) => {
    setDetailLoading(true);
    setAiAnswer(null);
    try {
      const res = await fetchApi(`/projects/${id}`);
      if (res.success) {
        setProjectDetail(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedProjectId) {
      loadProjectDetail(selectedProjectId);
    }
  }, [selectedProjectId, loadProjectDetail]);

  // Generate Project with AI
  const handleGenerateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTitle.trim() || !aiDescription.trim()) return;
    setGenerating(true);

    try {
      const res = await fetchApi('/ai/generate-project', {
        method: 'POST',
        body: JSON.stringify({ title: aiTitle, description: aiDescription })
      });

      if (res.success && res.data) {
        setShowAiModal(false);
        setAiTitle('');
        setAiDescription('');
        await loadProjects();
        setSelectedProjectId(res.data.id);
      }
    } catch (err) {
      console.error('Failed to generate project:', err);
    } finally {
      setGenerating(false);
    }
  };

  // Move Task Status in Kanban
  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const res = await fetchApi(`/projects/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus })
      });
      if (res.success && selectedProjectId) {
        await loadProjectDetail(selectedProjectId);
        await loadProjects();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Task to Project
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newTask.title.trim()) return;
    setCreatingTask(true);

    try {
      const res = await fetchApi(`/projects/${selectedProjectId}/tasks`, {
        method: 'POST',
        body: JSON.stringify(newTask)
      });
      if (res.success) {
        setShowTaskModal(false);
        setNewTask({
          title: '',
          description: '',
          priority: 'MEDIUM',
          milestoneId: '',
          status: 'TODO'
        });
        await loadProjectDetail(selectedProjectId);
        await loadProjects();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCreatingTask(false);
    }
  };

  // Ask AI Project Assistant
  const handleAskProjectAi = async (q?: string) => {
    const question = q || aiQuestion;
    if (!selectedProjectId || !question.trim()) return;
    setAskingAi(true);

    try {
      const res = await fetchApi(`/projects/${selectedProjectId}/ai-assist`, {
        method: 'POST',
        body: JSON.stringify({ question })
      });
      if (res.success && res.data) {
        setAiAnswer(res.data.advice);
        setAiQuestion('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAskingAi(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <FolderGit2 className="w-5 h-5 text-primary-glow" />
            Project Collaboration Workspace
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            AI-driven milestone architecture, real-time Kanban board, and project intelligence
          </p>
        </div>

        <button
          onClick={() => setShowAiModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent hover:opacity-95 text-white text-xs font-bold transition-all shadow-glow-primary"
        >
          <Sparkles className="w-4 h-4 animate-pulse-subtle" />
          Create Project with AI
        </button>
      </div>

      {/* Project Selector Horizontal Tabs */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
        {projects.map((p) => {
          const isSelected = p.id === selectedProjectId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedProjectId(p.id)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-2xl border transition-all shrink-0 text-left ${
                isSelected
                  ? 'bg-primary/20 border-primary text-white shadow-glow-primary'
                  : 'glass-card border-border/40 text-slate-300 hover:text-white hover:border-primary/30'
              }`}
            >
              <div className="w-2 h-2 rounded-full bg-accent" />
              <div>
                <p className="text-xs font-bold truncate max-w-[180px]">{p.title}</p>
                <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                  <span>{p.progress}% done</span>
                  <span>·</span>
                  <span>{p.membersCount} members</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Main Project Dashboard */}
      {detailLoading ? (
        <div className="p-12 text-center text-xs text-slate-400">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          Loading project workspace...
        </div>
      ) : !projectDetail ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <FolderGit2 className="w-10 h-10 text-slate-500 mx-auto mb-3" />
          <p className="text-sm font-bold text-white">No Project Selected</p>
          <p className="text-xs text-slate-400 mt-1">
            Create an AI project or select one from the tabs above.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Project Summary Banner */}
          <div className="glass-card rounded-2xl p-6 border border-border/40 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      STATUS_COLORS[projectDetail.status] || STATUS_COLORS.ACTIVE
                    }`}
                  >
                    {projectDetail.status}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    {projectDetail.doneTasks} / {projectDetail.totalTasks} Tasks Completed
                  </span>
                </div>
                <h2 className="text-xl font-bold text-white">{projectDetail.title}</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  {projectDetail.description}
                </p>
              </div>

              {/* Progress & Team */}
              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                  <p className="text-2xl font-black text-white">{projectDetail.progress}%</p>
                  <p className="text-[11px] text-slate-400">Overall Progress</p>
                  <div className="w-28 bg-surface-elevated rounded-full h-1.5 overflow-hidden mt-1.5">
                    <div
                      className="h-full bg-accent rounded-full transition-all duration-700"
                      style={{ width: `${projectDetail.progress}%` }}
                    />
                  </div>
                </div>

                {/* Team Avatars */}
                <div className="flex -space-x-2">
                  {projectDetail.members?.map((m: any) => (
                    <img
                      key={m.id}
                      src={
                        m.student?.user?.avatarUrl ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.student?.user?.firstName}`
                      }
                      alt={m.student?.user?.firstName}
                      title={`${m.student?.user?.firstName} ${m.student?.user?.lastName} (${m.role})`}
                      className="w-8 h-8 rounded-full ring-2 ring-background bg-surface-elevated"
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* Milestones Roadmap Bar */}
            <div className="pt-3 border-t border-border/30">
              <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
                <Flag className="w-3 h-3 text-accent" /> Milestone Roadmap
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {projectDetail.milestones?.map((m: any) => {
                  const mDone = m.tasks?.filter((t: any) => t.status === 'DONE').length || 0;
                  const mTotal = m.tasks?.length || 0;
                  const mPct = mTotal > 0 ? Math.round((mDone / mTotal) * 100) : 0;
                  return (
                    <div
                      key={m.id}
                      className="bg-surface-elevated/40 rounded-xl p-3 border border-border/30"
                    >
                      <div className="flex items-center justify-between text-xs font-semibold mb-1">
                        <span className="text-white truncate">{m.title}</span>
                        <span className="text-accent text-[10px]">{mPct}%</span>
                      </div>
                      <div className="w-full bg-surface rounded-full h-1 overflow-hidden mb-1.5">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${mPct}%` }}
                        />
                      </div>
                      <p className="text-[10px] text-slate-500 truncate">{m.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* AI Project Assistant Embedded Section */}
          <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-primary/20">
                  <Bot className="w-4 h-4 text-primary-glow animate-pulse-subtle" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white">AI Project Intelligence</h3>
                  <p className="text-[10px] text-slate-400">
                    Grounded in actual milestone tasks & velocity
                  </p>
                </div>
              </div>

              {/* Quick Prompt Chips */}
              <div className="flex items-center gap-1.5 flex-wrap hidden md:flex">
                <button
                  onClick={() => handleAskProjectAi('What should I work on next?')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary-glow border border-primary/30 transition-all"
                >
                  ⚡ Next Task?
                </button>
                <button
                  onClick={() => handleAskProjectAi('What is blocking our project?')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-warning/20 hover:bg-warning/30 text-warning border border-warning/30 transition-all"
                >
                  ⚠️ Bottlenecks?
                </button>
              </div>
            </div>

            {/* AI Output Bubble */}
            {aiAnswer && (
              <div className="p-3 rounded-xl bg-surface-elevated border border-border/40 text-xs text-slate-200 leading-relaxed animate-fade-in-up">
                <p className="font-semibold text-primary-glow mb-1">🤖 Gemini Project Assistant:</p>
                <div dangerouslySetInnerHTML={{ __html: aiAnswer.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }} />
              </div>
            )}

            {/* Question Input */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about project tasks, blockers, or milestone breakdown..."
                value={aiQuestion}
                onChange={(e) => setAiQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAskProjectAi();
                }}
                className="flex-1 bg-surface-elevated text-xs text-white placeholder-slate-500 rounded-xl px-3.5 py-2.5 border border-border/40 focus:border-primary/50 outline-none"
              />
              <button
                onClick={() => handleAskProjectAi()}
                disabled={askingAi || !aiQuestion.trim()}
                className="px-4 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all disabled:opacity-50"
              >
                {askingAi ? 'Thinking...' : 'Ask AI'}
              </button>
            </div>
          </div>

          {/* Kanban Board Header & Actions */}
          <div className="flex items-center justify-between pt-2">
            <div className="flex items-center gap-2">
              <Kanban className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Sprint Kanban Board</h3>
            </div>
            <button
              onClick={() => setShowTaskModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated hover:bg-surface border border-border/50 text-white text-xs font-semibold transition-all"
            >
              <Plus className="w-3.5 h-3.5 text-accent" /> Add Task
            </button>
          </div>

          {/* Kanban Columns (4 Columns) */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { key: 'TODO', label: 'To Do', color: 'border-slate-500', count: projectDetail.kanban?.TODO?.length || 0 },
              { key: 'IN_PROGRESS', label: 'In Progress', color: 'border-primary', count: projectDetail.kanban?.IN_PROGRESS?.length || 0 },
              { key: 'IN_REVIEW', label: 'In Review', color: 'border-warning', count: projectDetail.kanban?.IN_REVIEW?.length || 0 },
              { key: 'DONE', label: 'Done', color: 'border-emerald-500', count: projectDetail.kanban?.DONE?.length || 0 }
            ].map((col) => {
              const tasks = projectDetail.kanban?.[col.key] || [];
              return (
                <div
                  key={col.key}
                  className="glass-card rounded-2xl p-4 border border-border/40 flex flex-col min-h-[360px]"
                >
                  <div className="flex items-center justify-between pb-3 border-b border-border/30 mb-3">
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full border-2 ${col.color}`} />
                      {col.label}
                    </span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-surface-elevated text-slate-400">
                      {col.count}
                    </span>
                  </div>

                  <div className="space-y-2.5 flex-1 overflow-y-auto">
                    {tasks.length === 0 ? (
                      <div className="h-24 flex items-center justify-center text-[11px] text-slate-600 border border-dashed border-border/30 rounded-xl">
                        No tasks
                      </div>
                    ) : (
                      tasks.map((task: any) => (
                        <div
                          key={task.id}
                          className="bg-surface-elevated/70 hover:bg-surface-elevated rounded-xl p-3 border border-border/40 transition-all space-y-2 group"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-xs font-semibold text-white leading-snug">
                              {task.title}
                            </p>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.MEDIUM
                              }`}
                            >
                              {task.priority}
                            </span>
                          </div>

                          {task.description && (
                            <p className="text-[11px] text-slate-400 line-clamp-2">
                              {task.description}
                            </p>
                          )}

                          <div className="flex items-center justify-between pt-2 border-t border-border/20 text-[10px]">
                            {task.assignedTo ? (
                              <div className="flex items-center gap-1.5 text-slate-300">
                                <img
                                  src={
                                    task.assignedTo.user?.avatarUrl ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${task.assignedTo.user?.firstName}`
                                  }
                                  alt="Assignee"
                                  className="w-4 h-4 rounded-full"
                                />
                                <span>{task.assignedTo.user?.firstName}</span>
                              </div>
                            ) : (
                              <span className="text-slate-500">Unassigned</span>
                            )}

                            {/* Move Status Buttons */}
                            <div className="flex items-center gap-1">
                              {col.key !== 'TODO' && (
                                <button
                                  onClick={() =>
                                    updateTaskStatus(
                                      task.id,
                                      col.key === 'DONE'
                                        ? 'IN_REVIEW'
                                        : col.key === 'IN_REVIEW'
                                        ? 'IN_PROGRESS'
                                        : 'TODO'
                                    )
                                  }
                                  className="text-[9px] text-slate-400 hover:text-white px-1 rounded bg-surface hover:bg-surface-elevated"
                                  title="Move Left"
                                >
                                  ←
                                </button>
                              )}
                              {col.key !== 'DONE' && (
                                <button
                                  onClick={() =>
                                    updateTaskStatus(
                                      task.id,
                                      col.key === 'TODO'
                                        ? 'IN_PROGRESS'
                                        : col.key === 'IN_PROGRESS'
                                        ? 'IN_REVIEW'
                                        : 'DONE'
                                    )
                                  }
                                  className="text-[9px] text-accent hover:text-white px-1 rounded bg-surface hover:bg-accent/20"
                                  title="Move Right"
                                >
                                  →
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* AI Project Generator Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-lg w-full p-6 border border-primary/40 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary-glow" />
                <h2 className="text-base font-bold text-white">Create Project with AI</h2>
              </div>
              <button onClick={() => setShowAiModal(false)}>
                <X className="w-5 h-5 text-slate-400 hover:text-white" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Describe your project concept. Gemini will architect the milestone roadmap, derive role suggestions, and populate actionable tasks directly into your PostgreSQL database.
            </p>

            <form onSubmit={handleGenerateProject} className="space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. AI Crop Disease Detection System"
                  value={aiTitle}
                  onChange={(e) => setAiTitle(e.target.value)}
                  required
                  className="w-full bg-surface-elevated text-xs text-white rounded-xl px-3.5 py-2.5 border border-border/50 focus:border-primary/50 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Concept & Objectives
                </label>
                <textarea
                  rows={4}
                  placeholder="e.g. Mobile-first computer vision model that identifies crop leaf blight using camera images and recommends organic treatments."
                  value={aiDescription}
                  onChange={(e) => setAiDescription(e.target.value)}
                  required
                  className="w-full bg-surface-elevated text-xs text-white rounded-xl px-3.5 py-2.5 border border-border/50 focus:border-primary/50 outline-none resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || !aiTitle || !aiDescription}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-primary to-accent text-white text-xs font-bold transition-all shadow-glow-primary flex items-center gap-2 disabled:opacity-50"
                >
                  <Sparkles className="w-4 h-4 animate-pulse-subtle" />
                  {generating ? 'Gemini is Architecting...' : 'Generate Project & Tasks'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl max-w-md w-full p-6 border border-border/50 space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Add Task to Project</h2>
              <button onClick={() => setShowTaskModal(false)}>
                <X className="w-4 h-4 text-slate-400 hover:text-white" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">Task Title</label>
                <input
                  type="text"
                  placeholder="e.g. Implement JWT refresh token rotation"
                  value={newTask.title}
                  onChange={(e) => setNewTask((p) => ({ ...p, title: e.target.value }))}
                  required
                  className="w-full bg-surface-elevated text-xs text-white rounded-xl px-3.5 py-2.5 border border-border/50 focus:border-primary/50 outline-none"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-semibold block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Details or acceptance criteria..."
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask((p) => ({ ...p, description: e.target.value }))
                  }
                  className="w-full bg-surface-elevated text-xs text-white rounded-xl px-3.5 py-2.5 border border-border/50 focus:border-primary/50 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Priority</label>
                  <select
                    value={newTask.priority}
                    onChange={(e) =>
                      setNewTask((p) => ({ ...p, priority: e.target.value }))
                    }
                    className="w-full bg-surface-elevated text-xs text-white rounded-xl px-3 py-2 border border-border/50 focus:border-primary/50 outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-slate-400 font-semibold block mb-1">Status</label>
                  <select
                    value={newTask.status}
                    onChange={(e) =>
                      setNewTask((p) => ({ ...p, status: e.target.value }))
                    }
                    className="w-full bg-surface-elevated text-xs text-white rounded-xl px-3 py-2 border border-border/50 focus:border-primary/50 outline-none"
                  >
                    <option value="TODO">To Do</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="IN_REVIEW">In Review</option>
                    <option value="DONE">Done</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingTask || !newTask.title}
                  className="px-4 py-2 rounded-xl bg-primary text-white text-xs font-bold hover:bg-primary-hover disabled:opacity-50 transition-all"
                >
                  {creatingTask ? 'Adding...' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
