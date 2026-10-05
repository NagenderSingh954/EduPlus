'use client';

import React, { useEffect, useState, useRef } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  BarChart, Bar, Cell
} from 'recharts';
import {
  AlertTriangle, TrendingUp, CheckCircle2, Clock, BookOpen,
  Brain, Target, Award, Zap, Calendar, FileText, ChevronRight, Sparkles,
  Play, Pause, RotateCcw, Check, X
} from 'lucide-react';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
};

const StatCard = ({ label, value, sub, icon: Icon, color = 'primary', pulse = false }: any) => (
  <div className="glass-card rounded-2xl p-5 border border-border/40 hover:border-primary/30 transition-all duration-300 hover:-translate-y-0.5 animate-fade-in-up">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">{label}</p>
        <p className={`text-3xl font-bold mt-1 ${color === 'warning' ? 'text-warning' : color === 'accent' ? 'text-accent' : color === 'danger' ? 'text-danger-glow' : 'text-white'}`}>{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`p-2.5 rounded-xl ${color === 'warning' ? 'bg-warning/10' : color === 'accent' ? 'bg-accent/10' : color === 'danger' ? 'bg-danger/10' : 'bg-primary/10'}`}>
        <Icon className={`w-5 h-5 ${color === 'warning' ? 'text-warning' : color === 'accent' ? 'text-accent' : color === 'danger' ? 'text-danger-glow' : 'text-primary-glow'} ${pulse ? 'animate-pulse' : ''}`} />
      </div>
    </div>
  </div>
);

const HealthBar = ({ label, score, weight }: { label: string; score: number; weight: string }) => {
  const color = score >= 80 ? '#10b981' : score >= 65 ? '#f59e0b' : '#ef4444';
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 text-[11px] text-slate-400 shrink-0">{label}</div>
      <div className="flex-1 bg-surface-elevated rounded-full h-2 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-1000"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <div className="w-10 text-right text-xs font-semibold" style={{ color }}>{score}</div>
      <div className="w-8 text-[10px] text-slate-500 text-right">{weight}</div>
    </div>
  );
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // "I Have 1 Hour" State
  const [freeMinutes, setFreeMinutes] = useState(60);
  const [oneHourResult, setOneHourResult] = useState<any>(null);
  const [generatingSession, setGeneratingSession] = useState(false);

  // Active Focus Session Live Tracker
  const [activeSession, setActiveSession] = useState<any>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [sessionSuccessToast, setSessionSuccessToast] = useState(false);

  const loadDashboardData = () => {
    setLoading(true);
    setError(null);
    fetchApi('/students/dashboard')
      .then(res => {
        if (res.success && res.data) {
          setData(res.data);
        } else {
          setError(res.message || 'Unable to load academic dashboard.');
        }
      })
      .catch(err => {
        console.error('Failed to load dashboard:', err);
        setError(err.message || 'Failed to connect to academic server.');
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.role === 'STUDENT') {
      loadDashboardData();
    } else if (user) {
      // Teacher or other role — stop loading
      setLoading(false);
    }
  }, [user]);

  // Timer countdown
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && secondsRemaining > 0) {
      interval = setInterval(() => {
        setSecondsRemaining(prev => prev - 1);
      }, 1000);
    } else if (secondsRemaining === 0 && isTimerRunning) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, secondsRemaining]);

  // Generate 1-hour session
  const handleGenerateSession = async () => {
    setGeneratingSession(true);
    try {
      const res = await fetchApi('/ai/one-hour', {
        method: 'POST',
        body: JSON.stringify({ minutes: freeMinutes })
      });
      if (res.success && res.data) {
        setOneHourResult(res.data);
      }
    } catch (err) {
      console.error('Failed to generate session:', err);
    } finally {
      setGeneratingSession(false);
    }
  };

  // Start Focus Session
  const handleStartSession = async () => {
    if (!oneHourResult) return;
    try {
      const res = await fetchApi('/tasks/study-session/start', {
        method: 'POST',
        body: JSON.stringify({
          title: oneHourResult.sessionTitle,
          targetMinutes: oneHourResult.targetMinutes,
          subject: oneHourResult.subject,
          topics: [oneHourResult.focusTopic]
        })
      });

      if (res.success && res.data) {
        setActiveSession({
          ...res.data,
          breakdown: oneHourResult.breakdown
        });
        setSecondsRemaining(oneHourResult.targetMinutes * 60);
        setIsTimerRunning(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Complete Focus Session
  const handleCompleteSession = async () => {
    if (!activeSession) return;
    try {
      await fetchApi(`/tasks/study-session/${activeSession.id}/complete`, {
        method: 'POST',
        body: JSON.stringify({
          actualMinutes: Math.round((activeSession.targetMinutes * 60 - secondsRemaining) / 60) || 1,
          completedTasks: [oneHourResult?.focusTopic || 'Focus Session']
        })
      });

      setActiveSession(null);
      setIsTimerRunning(false);
      setSessionSuccessToast(true);
      setTimeout(() => setSessionSuccessToast(false), 5000);
      loadDashboardData();
    } catch (err) {
      console.error(err);
    }
  };

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-20 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="skeleton h-72 rounded-2xl lg:col-span-2" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center text-center p-8 glass-card rounded-2xl border border-border/40 space-y-4 animate-fade-in-up">
        <div className="p-4 rounded-2xl bg-warning/10 text-warning border border-warning/20">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Dashboard Unavailable</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-md">
            {error || 'Unable to load your academic metrics at this moment.'}
          </p>
        </div>
        <button
          onClick={loadDashboardData}
          className="px-5 py-2.5 rounded-xl bg-primary hover:bg-primary-glow text-white text-xs font-semibold transition-all shadow-glow-primary flex items-center gap-2"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Retry Loading
        </button>
      </div>
    );
  }

  const { student, overview, healthBreakdown, subjectAttendance, pendingAssignments, upcomingExams, tasks, todayClasses } = data;

  const barData = subjectAttendance.map((s: any) => ({
    name: s.code,
    value: s.percentage,
    isAtRisk: s.isAtRisk
  }));

  return (
    <div className="space-y-6 pb-12">
      {/* Session Success Banner */}
      {sessionSuccessToast && (
        <div className="glass-card rounded-2xl p-4 border border-accent/40 bg-accent/10 flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Study Session Completed & Logged!</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Targeted revision saved to database. Your Consistency & Health scores have been boosted.
              </p>
            </div>
          </div>
          <span className="text-xs text-accent font-semibold px-2 py-1 rounded bg-accent/20">
            State Saved
          </span>
        </div>
      )}

      {/* Header */}
      <div className="glass-card rounded-2xl p-6 border border-border/40 bg-gradient-to-r from-primary/5 via-transparent to-accent/5 animate-fade-in-up">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm">{getGreeting()}, <span className="text-white font-semibold">{student.name.split(' ')[0]}</span> 👋</p>
            <h1 className="text-2xl font-bold text-white mt-0.5">Your Academic Operating System</h1>
            <p className="text-xs text-slate-400 mt-1">{student.department} · Semester {student.semester} · Roll {student.rollNumber}</p>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-4xl font-black text-white">{overview.academicHealthScore}<span className="text-lg text-slate-400">/100</span></div>
            <p className="text-xs text-slate-400 mt-1">Academic Health Score</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatCard label="Attendance" value={`${overview.overallAttendance}%`} sub="Overall" icon={CheckCircle2} color={overview.overallAttendance >= 75 ? 'accent' : 'danger'} />
        <StatCard label="Performance" value={`${overview.averageExamScore}%`} sub="Avg exam score" icon={TrendingUp} color="primary" />
        <StatCard label="GPA" value={overview.gpa?.toFixed(2) || '—'} sub="Current" icon={Award} color="accent" />
        <StatCard label="Assignments" value={overview.pendingAssignmentsCount} sub="Pending" icon={FileText} color={overview.pendingAssignmentsCount > 2 ? 'warning' : 'primary'} />
        <StatCard label="Next Exam" value={overview.upcomingExamsCount > 0 ? `${overview.upcomingExamsCount}` : '—'} sub="Upcoming" icon={Calendar} color="warning" />
      </div>

      {/* FEATURE 10: "I HAVE 1 HOUR" / WHAT CAN I DO RIGHT NOW? PROMINENT INTERACTIVE WIDGET */}
      <div className="glass-card rounded-2xl p-6 border border-warning/30 bg-gradient-to-r from-warning/10 via-surface/40 to-primary/10 animate-fade-in-up space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-warning/20 text-warning">
              <Zap className="w-6 h-6 animate-pulse-subtle" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                ⏱ What can I do right now?
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-warning/20 text-warning border border-warning/30">
                  AI Sprint Planner
                </span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Gemini analyzes your weakest exam subjects, upcoming deadlines, and timetable to curate a high-impact study sprint.
              </p>
            </div>
          </div>

          {/* Time Picker Buttons */}
          <div className="flex items-center gap-1.5 bg-surface-elevated/80 p-1.5 rounded-xl border border-border/50 shrink-0">
            {[30, 45, 60, 90].map(m => (
              <button
                key={m}
                onClick={() => {
                  setFreeMinutes(m);
                  setOneHourResult(null);
                }}
                className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-all ${
                  freeMinutes === m
                    ? 'bg-warning text-black shadow-glow-warning'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m}m
              </button>
            ))}
          </div>
        </div>

        {/* Generate / Action Area */}
        {!oneHourResult ? (
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleGenerateSession}
              disabled={generatingSession}
              className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-warning hover:bg-warning-glow text-black text-xs font-bold transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {generatingSession ? 'Gemini is Synthesizing Priorities...' : `I have ${freeMinutes} minutes — Plan My Focus Session`}
            </button>
            <span className="text-[11px] text-slate-500">
              {subjectAttendance?.length > 0
                ? 'Synthesized from your verified course attendance, deadlines, and syllabus.'
                : 'Personalized study sprint tailored to your academic profile and curriculum.'}
            </span>
          </div>
        ) : (
          <div className="space-y-4 pt-2 border-t border-border/30 animate-fade-in-up">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-sm font-bold text-white">{oneHourResult.sessionTitle}</p>
                <p className="text-xs text-slate-400 mt-0.5">{oneHourResult.rationale}</p>
              </div>
              <button
                onClick={handleStartSession}
                className="flex items-center justify-center gap-2 px-5 py-2 rounded-xl bg-accent hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-glow-emerald shrink-0"
              >
                <Play className="w-3.5 h-3.5 fill-current" /> Start Session Now
              </button>
            </div>

            {/* Timed Blocks */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {oneHourResult.breakdown?.map((b: any, idx: number) => (
                <div key={idx} className="bg-surface-elevated/70 rounded-xl p-3 border border-border/40 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-mono font-bold text-warning">{b.durationMinutes} min</span>
                    <span className="text-[10px] text-slate-500 uppercase">Block {idx + 1}</span>
                  </div>
                  <p className="text-xs font-semibold text-white">{b.title}</p>
                  <p className="text-[11px] text-slate-400 leading-snug">{b.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main content: Charts + Health */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance by Subject */}
        <div className="lg:col-span-2 glass-card rounded-2xl p-5 border border-border/40">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary-glow" /> Subject Attendance
          </h2>
          {barData.length === 0 ? (
            <div className="h-[200px] flex flex-col items-center justify-center text-center p-4 border border-dashed border-border/50 rounded-xl">
              <p className="text-xs font-medium text-slate-300">No attendance records logged yet</p>
              <p className="text-[11px] text-slate-500 mt-1 max-w-xs">
                Attendance percentages will appear here once your professors record lecture sessions.
              </p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={barData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
                    formatter={(v: any) => [`${v}%`, 'Attendance']}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {barData.map((entry: any, idx: number) => (
                      <Cell key={idx} fill={entry.isAtRisk ? '#ef4444' : '#6366f1'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-3">
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400"><span className="w-2 h-2 rounded-full bg-primary inline-block" /> ≥75% (Safe)</span>
                <span className="flex items-center gap-1.5 text-[11px] text-slate-400"><span className="w-2 h-2 rounded-full bg-danger inline-block" /> &lt;75% (At Risk)</span>
              </div>
            </>
          )}
        </div>

        {/* Academic Health Breakdown */}
        <div className="glass-card rounded-2xl p-5 border border-border/40">
          <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent" /> Academic Health
          </h2>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-24 h-24">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#1e293b" strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={healthBreakdown.overall >= 80 ? '#10b981' : healthBreakdown.overall >= 65 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10"
                  strokeDasharray={`${(healthBreakdown.overall / 100) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{healthBreakdown.overall}</span>
              </div>
            </div>
          </div>
          <div className="space-y-2.5">
            <HealthBar label="Performance" score={healthBreakdown.performance.score} weight="30%" />
            <HealthBar label="Attendance" score={healthBreakdown.attendance.score} weight="25%" />
            <HealthBar label="Assignments" score={healthBreakdown.assignmentCompletion.score} weight="20%" />
            <HealthBar label="Exam Ready" score={healthBreakdown.examReadiness.score} weight="15%" />
            <HealthBar label="Consistency" score={healthBreakdown.consistency.score} weight="10%" />
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Classes */}
        <div className="glass-card rounded-2xl p-5 border border-border/40">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-primary-glow" /> Today's Classes
          </h2>
          {todayClasses.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No classes today 🎉</div>
          ) : (
            <div className="space-y-2">
              {todayClasses.map((cls: any) => (
                <div key={cls.id} className="flex items-center gap-3 p-2.5 bg-surface-elevated/50 rounded-xl">
                  <div className="text-[10px] text-primary-glow font-mono font-semibold w-16 shrink-0">{cls.startTime}</div>
                  <div>
                    <p className="text-xs font-semibold text-white">{cls.course?.name || cls.courseId}</p>
                    <p className="text-[10px] text-slate-400">{cls.room}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Pending Assignments */}
        <div className="glass-card rounded-2xl p-5 border border-border/40">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-warning" /> Pending Assignments
          </h2>
          {pendingAssignments.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">All caught up! ✅</div>
          ) : (
            <div className="space-y-2">
              {pendingAssignments.slice(0, 4).map((a: any) => {
                const daysLeft = Math.ceil((new Date(a.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={a.id} className="flex items-center justify-between p-2.5 bg-surface-elevated/50 rounded-xl">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{a.title}</p>
                      <p className="text-[10px] text-slate-400">{a.course?.code}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md shrink-0 ml-2 ${daysLeft <= 2 ? 'bg-danger/20 text-danger-glow' : 'bg-warning/20 text-warning'}`}>
                      {daysLeft}d left
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Tasks */}
        <div className="glass-card rounded-2xl p-5 border border-border/40">
          <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-accent" /> Today's Priorities
          </h2>
          {tasks.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">No tasks yet. Ask AI to generate a plan!</div>
          ) : (
            <div className="space-y-2">
              {tasks.slice(0, 5).map((task: any) => (
                <div key={task.id} className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-elevated/50 transition-colors">
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${task.completed ? 'bg-accent' : task.priority === 'URGENT' ? 'bg-danger' : task.priority === 'HIGH' ? 'bg-warning' : 'bg-primary-glow'}`} />
                  <p className={`text-xs flex-1 truncate ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>{task.title}</p>
                  <span className="text-[10px] text-slate-500 shrink-0">{task.estimatedMinutes}m</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant Quick Link */}
      <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-primary/5">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/20">
            <Sparkles className="w-5 h-5 text-primary-glow animate-pulse-subtle" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white">Ask your Academic AI Assistant</p>
            <p className="text-xs text-slate-400">Try: &quot;Why am I struggling in DBMS?&quot; or &quot;What should I revise before tomorrow?&quot;</p>
          </div>
          <a href="/ai-assistant" className="flex items-center gap-1.5 text-xs font-semibold text-primary-glow hover:text-white bg-primary/20 hover:bg-primary/30 px-3 py-2 rounded-xl transition-all shrink-0">
            Open AI <ChevronRight className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* LIVE FOCUS SESSION MODAL / OVERLAY */}
      {activeSession && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel rounded-3xl max-w-lg w-full p-8 border border-warning/40 shadow-2xl space-y-6 text-center animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-border/30">
              <span className="text-xs font-bold uppercase tracking-wider text-warning flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> Live Focused Sprint
              </span>
              <button
                onClick={() => setActiveSession(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Current Objective</p>
              <h3 className="text-xl font-bold text-white mt-1">{activeSession.title}</h3>
              <p className="text-xs text-slate-400 mt-1">Topic: {activeSession.topics?.join(', ')}</p>
            </div>

            {/* Big Countdown Timer */}
            <div className="py-4">
              <div className="text-6xl font-black font-mono tracking-tight text-white bg-surface-elevated/80 py-4 px-6 rounded-2xl border border-border/50 inline-block shadow-inner">
                {formatTime(secondsRemaining)}
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setIsTimerRunning(!isTimerRunning)}
                className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-bold transition-all ${
                  isTimerRunning
                    ? 'bg-warning text-black hover:bg-warning-glow'
                    : 'bg-emerald-500 text-black hover:bg-emerald-400'
                }`}
              >
                {isTimerRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
                {isTimerRunning ? 'Pause Sprint' : 'Resume Sprint'}
              </button>
              <button
                onClick={handleCompleteSession}
                className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-accent hover:bg-emerald-400 text-black text-xs font-bold transition-all shadow-glow-emerald"
              >
                <Check className="w-4 h-4" /> Complete Session & Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
