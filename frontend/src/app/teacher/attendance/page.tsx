'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  HelpCircle,
  Save,
  Users,
  Calendar,
  Sparkles,
  BookOpen,
  ArrowLeft
} from 'lucide-react';
import Link from 'next/link';

function AttendanceContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialCourseId = searchParams.get('courseId') || '';

  const [courses, setCourses] = useState<any[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState(initialCourseId);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [topicCovered, setTopicCovered] = useState('');
  const [classId, setClassId] = useState('');
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load teacher courses
  useEffect(() => {
    if (user?.role === 'TEACHER') {
      fetchApi('/teachers/dashboard')
        .then((res) => {
          if (res.success && res.data?.courses) {
            setCourses(res.data.courses);
            if (!selectedCourseId && res.data.courses.length > 0) {
              setSelectedCourseId(res.data.courses[0].id);
            }
          }
        })
        .catch(console.error);
    }
  }, [user]);

  // Load sheet whenever course or date changes
  useEffect(() => {
    if (!selectedCourseId) return;
    setLoading(true);
    setSavedSuccess(false);

    fetchApi(`/attendance/sheet?courseId=${selectedCourseId}&date=${date}`)
      .then((res) => {
        if (res.success && res.data) {
          setClassId(res.data.classId || '');
          setTopicCovered(res.data.topicCovered || '');
          setStudents(res.data.students || []);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedCourseId, date]);

  const setStatusForStudent = (studentId: string, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED') => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, status } : s))
    );
    setSavedSuccess(false);
  };

  const setRemarksForStudent = (studentId: string, remarks: string) => {
    setStudents((prev) =>
      prev.map((s) => (s.studentId === studentId ? { ...s, remarks } : s))
    );
    setSavedSuccess(false);
  };

  const markAll = (status: 'PRESENT' | 'ABSENT') => {
    setStudents((prev) => prev.map((s) => ({ ...s, status })));
    setSavedSuccess(false);
  };

  const saveAttendance = async () => {
    if (!selectedCourseId || students.length === 0) return;
    setSaving(true);
    setSavedSuccess(false);

    try {
      const records = students.map((s) => ({
        studentId: s.studentId,
        status: s.status,
        remarks: s.remarks || undefined
      }));

      const res = await fetchApi('/attendance/mark', {
        method: 'POST',
        body: JSON.stringify({
          courseId: selectedCourseId,
          classId: classId || undefined,
          date,
          topicCovered,
          records
        })
      });

      if (res.success) {
        setSavedSuccess(true);
      }
    } catch (err) {
      console.error('Failed to mark attendance:', err);
    } finally {
      setSaving(false);
    }
  };

  const presentCount = students.filter((s) => s.status === 'PRESENT').length;
  const absentCount = students.filter((s) => s.status === 'ABSENT').length;
  const lateCount = students.filter((s) => s.status === 'LATE').length;
  const excusedCount = students.filter((s) => s.status === 'EXCUSED').length;
  const attendanceRate =
    students.length > 0 ? Math.round(((presentCount + lateCount) / students.length) * 100) : 100;

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
              <ClipboardList className="w-5 h-5 text-emerald-400" />
              Mark Classroom Attendance
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Synchronize student attendance in real time into persistent academic state
            </p>
          </div>

          <button
            onClick={saveAttendance}
            disabled={saving || loading || students.length === 0}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-glow-emerald disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save & Sync Records'}
          </button>
        </div>
      </div>

      {/* Controls Bar: Course Selector + Date + Topic */}
      <div className="glass-card rounded-2xl p-5 border border-border/40 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Course Dropdown */}
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1.5">
              Course / Class
            </label>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
              className="w-full bg-surface-elevated text-white text-xs rounded-xl px-3.5 py-2.5 border border-border/50 focus:border-emerald-500/50 outline-none"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.code} — {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Picker */}
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1.5">
              Lecture Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-surface-elevated text-white text-xs rounded-xl px-3.5 py-2.5 border border-border/50 focus:border-emerald-500/50 outline-none"
            />
          </div>

          {/* Topic Covered */}
          <div>
            <label className="text-[11px] uppercase tracking-wider font-semibold text-slate-400 block mb-1.5">
              Lecture Topic (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. 3NF & BCNF Decomposition"
              value={topicCovered}
              onChange={(e) => setTopicCovered(e.target.value)}
              className="w-full bg-surface-elevated text-white text-xs rounded-xl px-3.5 py-2.5 border border-border/50 focus:border-emerald-500/50 outline-none"
            />
          </div>
        </div>

        {/* Live Metrics & Quick Actions */}
        <div className="pt-3 border-t border-border/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 text-xs">
            <span className="text-slate-400 font-medium">Session Rate:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded-lg ${
                attendanceRate >= 75
                  ? 'bg-accent/15 text-accent'
                  : 'bg-danger/15 text-danger-glow'
              }`}
            >
              {attendanceRate}%
            </span>
            <span className="text-slate-500">|</span>
            <span className="text-emerald-400 font-semibold">{presentCount} Present</span>
            <span className="text-danger-glow font-semibold">{absentCount} Absent</span>
            <span className="text-warning font-semibold">{lateCount} Late</span>
            <span className="text-primary-glow font-semibold">{excusedCount} Excused</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => markAll('PRESENT')}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 text-xs font-semibold transition-all"
            >
              ✓ Mark All Present
            </button>
            <button
              onClick={() => markAll('ABSENT')}
              className="px-3 py-1.5 rounded-lg bg-danger/20 hover:bg-danger/30 text-danger-glow border border-danger/30 text-xs font-semibold transition-all"
            >
              ✕ Mark All Absent
            </button>
          </div>
        </div>
      </div>

      {/* Success Banner */}
      {savedSuccess && (
        <div className="glass-card rounded-2xl p-4 border border-accent/40 bg-accent/10 flex items-center justify-between animate-fade-in-up">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
            <div>
              <p className="text-xs font-bold text-white">Attendance Synchronized Successfully!</p>
              <p className="text-[11px] text-slate-300 mt-0.5">
                All records have been saved into PostgreSQL. Student dashboards and deficit calculators are updated immediately.
              </p>
            </div>
          </div>
          <span className="text-xs text-accent font-semibold px-2 py-1 rounded bg-accent/20">
            Persistent State Updated
          </span>
        </div>
      )}

      {/* Student Roster Table */}
      <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
        <div className="p-4 border-b border-border/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-emerald-400" />
            <span className="text-sm font-bold text-white">Student Attendance Roster</span>
            <span className="text-xs text-slate-400">({students.length} students)</span>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Loading student roster...
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-500">
            No students enrolled in this course section.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface-elevated/80 text-slate-400 border-b border-border/40 text-[11px] uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Roll No</th>
                  <th className="py-3 px-4">Student Name</th>
                  <th className="py-3 px-4 text-center">Attendance Status</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30 text-slate-300">
                {students.map((student) => (
                  <tr
                    key={student.studentId}
                    className="hover:bg-surface-elevated/40 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-slate-400">
                      {student.rollNumber || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-semibold text-white">{student.name}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setStatusForStudent(student.studentId, 'PRESENT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            student.status === 'PRESENT'
                              ? 'bg-emerald-600 text-white shadow-glow-emerald font-bold'
                              : 'bg-surface-elevated text-slate-400 hover:text-emerald-300'
                          }`}
                        >
                          Present
                        </button>
                        <button
                          onClick={() => setStatusForStudent(student.studentId, 'ABSENT')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            student.status === 'ABSENT'
                              ? 'bg-danger text-white shadow-glow-danger font-bold'
                              : 'bg-surface-elevated text-slate-400 hover:text-danger-glow'
                          }`}
                        >
                          Absent
                        </button>
                        <button
                          onClick={() => setStatusForStudent(student.studentId, 'LATE')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            student.status === 'LATE'
                              ? 'bg-warning text-black font-bold'
                              : 'bg-surface-elevated text-slate-400 hover:text-warning'
                          }`}
                        >
                          Late
                        </button>
                        <button
                          onClick={() => setStatusForStudent(student.studentId, 'EXCUSED')}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                            student.status === 'EXCUSED'
                              ? 'bg-primary text-white font-bold'
                              : 'bg-surface-elevated text-slate-400 hover:text-primary-glow'
                          }`}
                        >
                          Excused
                        </button>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <input
                        type="text"
                        placeholder="Optional remarks..."
                        value={student.remarks || ''}
                        onChange={(e) =>
                          setRemarksForStudent(student.studentId, e.target.value)
                        }
                        className="w-full bg-surface-elevated/60 text-white text-xs rounded-lg px-2.5 py-1.5 border border-border/30 focus:border-emerald-500/40 outline-none"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function TeacherAttendancePage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-400">Loading attendance portal...</div>}>
      <AttendanceContent />
    </Suspense>
  );
}
