'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Users,
  CalendarCheck,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  ClipboardList,
  ChevronRight,
  TrendingUp,
  Award,
  BellRing,
  Sparkles
} from 'lucide-react';

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role === 'TEACHER') {
      fetchApi('/teachers/dashboard')
        .then((res) => {
          if (res.success) setData(res.data);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [user]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-24 w-full rounded-2xl" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-28 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="skeleton h-72 rounded-2xl" />
          <div className="skeleton h-72 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { teacher, stats, courses } = data;

  return (
    <div className="space-y-6 pb-8">
      {/* Header Banner */}
      <div className="glass-card rounded-2xl p-6 border border-emerald-500/20 bg-gradient-to-r from-emerald-500/10 via-transparent to-primary/10 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Faculty Portal
              </span>
              <span className="text-xs text-slate-400">ID: {teacher.employeeId}</span>
            </div>
            <h1 className="text-2xl font-bold text-white mt-1.5">Welcome back, {teacher.name} 👋</h1>
            <p className="text-xs text-slate-400 mt-1">
              {teacher.designation} · {teacher.department}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/teacher/attendance"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-glow-emerald"
            >
              <ClipboardList className="w-4 h-4" />
              Mark Attendance
            </Link>
            <Link
              href="/teacher/courses"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-surface-elevated hover:bg-surface border border-border/50 text-slate-200 text-xs font-semibold transition-all"
            >
              <GraduationCap className="w-4 h-4" />
              View Rosters
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-border/40 hover:border-emerald-500/30 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Assigned Courses</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalCourses}</p>
              <p className="text-xs text-slate-400 mt-1">Active sections</p>
            </div>
            <div className="p-2.5 rounded-xl bg-primary/10">
              <BookOpen className="w-5 h-5 text-primary-glow" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-border/40 hover:border-emerald-500/30 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Total Students</p>
              <p className="text-3xl font-bold text-white mt-1">{stats.totalStudents}</p>
              <p className="text-xs text-slate-400 mt-1">Enrolled across courses</p>
            </div>
            <div className="p-2.5 rounded-xl bg-emerald-500/10">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-border/40 hover:border-emerald-500/30 transition-all">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">Avg Attendance</p>
              <p className="text-3xl font-bold text-accent mt-1">{stats.overallAverageAttendance}%</p>
              <p className="text-xs text-slate-400 mt-1">Target ≥75%</p>
            </div>
            <div className="p-2.5 rounded-xl bg-accent/10">
              <TrendingUp className="w-5 h-5 text-accent" />
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-danger/30 bg-danger/5">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-wider text-danger font-semibold">At Risk Students</p>
              <p className="text-3xl font-bold text-danger-glow mt-1">{stats.atRiskStudentsCount}</p>
              <p className="text-xs text-slate-400 mt-1">&lt;75% attendance</p>
            </div>
            <div className="p-2.5 rounded-xl bg-danger/20">
              <AlertTriangle className="w-5 h-5 text-danger-glow animate-pulse" />
            </div>
          </div>
        </div>
      </div>

      {/* Courses Overview & Quick Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Course Cards (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-emerald-400" />
              My Teaching Courses
            </h2>
            <span className="text-xs text-slate-400">Spring 2026 Semester</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {courses.map((c: any) => (
              <div
                key={c.id}
                className="glass-card rounded-2xl p-5 border border-border/40 hover:border-emerald-500/40 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-primary/20 text-primary-glow">
                      {c.code}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      {c.classesHeld} sessions held
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white leading-snug">{c.name}</h3>
                  <p className="text-xs text-slate-400 mt-1">Class Section A · Department of CSE</p>

                  <div className="mt-4 grid grid-cols-2 gap-2 pt-3 border-t border-border/30 text-center">
                    <div className="bg-surface-elevated/40 rounded-xl p-2">
                      <p className="text-[10px] text-slate-400 uppercase">Enrolled</p>
                      <p className="text-lg font-bold text-white mt-0.5">{c.enrolledCount}</p>
                    </div>
                    <div className="bg-surface-elevated/40 rounded-xl p-2">
                      <p className="text-[10px] text-slate-400 uppercase">Avg Attendance</p>
                      <p
                        className={`text-lg font-bold mt-0.5 ${
                          c.averageAttendance >= 75 ? 'text-accent' : 'text-danger-glow'
                        }`}
                      >
                        {c.averageAttendance}%
                      </p>
                    </div>
                  </div>

                  {c.atRiskCount > 0 && (
                    <div className="mt-3 flex items-center gap-2 p-2 rounded-xl bg-danger/10 border border-danger/20 text-danger-glow text-xs">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{c.atRiskCount} student(s) below mandatory 75%</span>
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 flex gap-2">
                  <Link
                    href={`/teacher/attendance?courseId=${c.id}`}
                    className="flex-1 text-center py-2 rounded-xl bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
                  >
                    Mark Today's Sheet
                  </Link>
                  <Link
                    href={`/teacher/courses`}
                    className="p-2 rounded-xl bg-surface-elevated hover:bg-surface border border-border/40 text-slate-300 hover:text-white transition-all"
                    title="View Course Roster"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Real-time State & Announcements widget (1 col) */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary-glow" />
            Continuous State Engine
          </h2>

          <div className="glass-card rounded-2xl p-5 border border-border/40 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0">
                <CalendarCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <p className="text-xs font-bold text-white">Live Attendance Synchronization</p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                  When you save an attendance sheet, records immediately update student academic profiles, recalculate deficit formulas, and alert students below 75%.
                </p>
              </div>
            </div>

            <div className="p-3 bg-surface-elevated/60 rounded-xl border border-border/30">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-400">PostgreSQL Status:</span>
                <span className="text-accent font-semibold flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
                  Connected on 5433
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Role Authorization:</span>
                <span className="text-emerald-400 font-semibold">Faculty Restricted</span>
              </div>
            </div>

            <div className="pt-2">
              <Link
                href="/teacher/courses"
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-glow-primary"
              >
                <BellRing className="w-3.5 h-3.5" />
                Broadcast Announcement
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
