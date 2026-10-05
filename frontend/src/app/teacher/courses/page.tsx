'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  GraduationCap,
  Users,
  AlertTriangle,
  Send,
  BellRing,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  Mail,
  Plus
} from 'lucide-react';

export default function TeacherCoursesPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courseData, setCourseData] = useState<any>(null);
  const [loadingCourses, setLoadingCourses] = useState(true);
  const [loadingRoster, setLoadingRoster] = useState(false);

  // Announcement Form State
  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'MEDIUM',
    targetAudience: 'COURSE'
  });
  const [postingAnnouncement, setPostingAnnouncement] = useState(false);
  const [announcementSuccess, setAnnouncementSuccess] = useState(false);

  // Load teacher courses
  useEffect(() => {
    if (user?.role === 'TEACHER') {
      fetchApi('/teachers/dashboard')
        .then((res) => {
          if (res.success && res.data?.courses) {
            setCourses(res.data.courses);
            if (res.data.courses.length > 0) {
              setSelectedCourseId(res.data.courses[0].id);
            }
          }
        })
        .catch(console.error)
        .finally(() => setLoadingCourses(false));
    }
  }, [user]);

  // Load course students
  useEffect(() => {
    if (!selectedCourseId) return;
    setLoadingRoster(true);
    fetchApi(`/teachers/courses/${selectedCourseId}/students`)
      .then((res) => {
        if (res.success) {
          setCourseData(res.data);
        }
      })
      .catch(console.error)
      .finally(() => setLoadingRoster(false));
  }, [selectedCourseId]);

  const handlePostAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcement.title || !announcement.content) return;
    setPostingAnnouncement(true);
    setAnnouncementSuccess(false);

    try {
      const res = await fetchApi('/teachers/announcements', {
        method: 'POST',
        body: JSON.stringify({
          ...announcement,
          courseId: announcement.targetAudience === 'COURSE' ? selectedCourseId : undefined
        })
      });

      if (res.success) {
        setAnnouncementSuccess(true);
        setAnnouncement({
          title: '',
          content: '',
          priority: 'MEDIUM',
          targetAudience: 'COURSE'
        });
        setTimeout(() => setAnnouncementSuccess(false), 5000);
      }
    } catch (err) {
      console.error('Failed to post announcement:', err);
    } finally {
      setPostingAnnouncement(false);
    }
  };

  if (loadingCourses) {
    return (
      <div className="space-y-6">
        <div className="skeleton h-20 rounded-2xl" />
        <div className="skeleton h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Back Link & Header */}
      <div>
        <Link
          href="/teacher"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mb-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Faculty Overview
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              Course Rosters & Academic Announcements
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              View authorized student academic standing and broadcast course updates
            </p>
          </div>

          {/* Course Tabs */}
          <div className="flex items-center gap-2 bg-surface-elevated/70 p-1.5 rounded-xl border border-border/50">
            {courses.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedCourseId(c.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedCourseId === c.id
                    ? 'bg-emerald-600 text-white shadow-glow-emerald'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Student Roster Table (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
            <div className="p-4 border-b border-border/40 flex items-center justify-between">
              <div>
                <span className="text-sm font-bold text-white">
                  {courseData?.course?.code} — {courseData?.course?.name}
                </span>
                <p className="text-xs text-slate-400">
                  {courseData?.students?.length || 0} Enrolled Students
                </p>
              </div>

              <Link
                href={`/teacher/attendance?courseId=${selectedCourseId}`}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 transition-all"
              >
                Mark Attendance
              </Link>
            </div>

            {loadingRoster ? (
              <div className="p-8 text-center text-xs text-slate-400">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                Loading roster...
              </div>
            ) : !courseData || courseData.students.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                No students enrolled in this course.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-elevated/80 text-slate-400 border-b border-border/40 text-[11px] uppercase tracking-wider font-semibold">
                    <tr>
                      <th className="py-3 px-4">Roll No</th>
                      <th className="py-3 px-4">Student Name</th>
                      <th className="py-3 px-4 text-center">Classes Attended</th>
                      <th className="py-3 px-4 text-center">Attendance %</th>
                      <th className="py-3 px-4 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 text-slate-300">
                    {courseData.students.map((st: any) => (
                      <tr
                        key={st.studentId}
                        className="hover:bg-surface-elevated/40 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-slate-400">{st.rollNumber}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={
                                st.avatarUrl ||
                                `https://api.dicebear.com/7.x/avataaars/svg?seed=${st.name}`
                              }
                              alt={st.name}
                              className="w-7 h-7 rounded-full bg-surface-elevated ring-1 ring-border"
                            />
                            <div>
                              <p className="font-semibold text-white">{st.name}</p>
                              <p className="text-[10px] text-slate-500">{st.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center font-mono">
                          {st.classesAttended} / {st.totalClasses}
                        </td>
                        <td className="py-3 px-4 text-center font-bold">
                          <span
                            className={
                              st.percentage >= 75 ? 'text-accent' : 'text-danger-glow'
                            }
                          >
                            {st.percentage}%
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          {st.isAtRisk ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-danger/15 text-danger-glow border border-danger/20">
                              <AlertTriangle className="w-3 h-3" /> Below 75%
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-accent/15 text-accent border border-accent/20">
                              <CheckCircle2 className="w-3 h-3" /> Safe
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Announcement Publisher Form (1 col) */}
        <div className="space-y-4">
          <div className="glass-card rounded-2xl p-5 border border-border/40 space-y-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-primary/20">
                <BellRing className="w-4 h-4 text-primary-glow" />
              </div>
              <div>
                <h2 className="text-sm font-bold text-white">Publish Course Announcement</h2>
                <p className="text-[11px] text-slate-400">Notifies enrolled students immediately</p>
              </div>
            </div>

            {announcementSuccess && (
              <div className="p-3 rounded-xl bg-accent/15 border border-accent/30 text-accent text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>Announcement published to students!</span>
              </div>
            )}

            <form onSubmit={handlePostAnnouncement} className="space-y-3">
              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Midterm Lab Assessment Schedule"
                  value={announcement.title}
                  onChange={(e) =>
                    setAnnouncement((p) => ({ ...p, title: e.target.value }))
                  }
                  required
                  className="w-full bg-surface-elevated text-white text-xs rounded-xl px-3.5 py-2.5 border border-border/50 focus:border-primary/50 outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                  Message Content
                </label>
                <textarea
                  rows={4}
                  placeholder="Write clear instructions for students..."
                  value={announcement.content}
                  onChange={(e) =>
                    setAnnouncement((p) => ({ ...p, content: e.target.value }))
                  }
                  required
                  className="w-full bg-surface-elevated text-white text-xs rounded-xl px-3.5 py-2.5 border border-border/50 focus:border-primary/50 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                    Audience
                  </label>
                  <select
                    value={announcement.targetAudience}
                    onChange={(e) =>
                      setAnnouncement((p) => ({ ...p, targetAudience: e.target.value }))
                    }
                    className="w-full bg-surface-elevated text-white text-xs rounded-xl px-3 py-2 border border-border/50 focus:border-primary/50 outline-none"
                  >
                    <option value="COURSE">This Course Only</option>
                    <option value="ALL">All My Students</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 font-semibold block mb-1">
                    Priority
                  </label>
                  <select
                    value={announcement.priority}
                    onChange={(e) =>
                      setAnnouncement((p) => ({ ...p, priority: e.target.value }))
                    }
                    className="w-full bg-surface-elevated text-white text-xs rounded-xl px-3 py-2 border border-border/50 focus:border-primary/50 outline-none"
                  >
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent ⚠️</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                disabled={postingAnnouncement || !announcement.title || !announcement.content}
                className="w-full py-2.5 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-bold transition-all shadow-glow-primary flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                {postingAnnouncement ? 'Broadcasting...' : 'Broadcast Announcement'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
