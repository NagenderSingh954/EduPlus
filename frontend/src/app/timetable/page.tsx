'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  Calendar, Clock, MapPin, BookOpen, Plus, Minus, RefreshCw,
  CheckCircle2, Users, Award, Filter, X, Trash2, AlertCircle, Sparkles
} from 'lucide-react';

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'];
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed', THURSDAY: 'Thu', FRIDAY: 'Fri'
};

const COLORS = [
  'border-l-primary bg-primary/5',
  'border-l-accent bg-accent/5',
  'border-l-warning bg-warning/5',
  'border-l-[#ec4899] bg-pink-500/5',
  'border-l-[#8b5cf6] bg-violet-500/5',
  'border-l-[#14b8a6] bg-teal-500/5',
];

type Tab = 'timetable' | 'courses';

export default function TimetablePage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('timetable');
  const [data, setData] = useState<any>(null);
  const [courses, setCourses] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [filterSem, setFilterSem] = useState<number | null>(null);

  // Modals
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // New Slot Form
  const [slotForm, setSlotForm] = useState({
    courseId: '',
    dayOfWeek: 'MONDAY',
    startTime: '09:00',
    endTime: '10:00',
    room: 'Lab 402'
  });

  // New Course/Subject Form
  const [courseForm, setCourseForm] = useState({
    code: '',
    name: '',
    description: '',
    department: 'Computer Science & Engineering',
    semester: 5,
    credits: 4,
    teacherId: ''
  });

  const loadTimetable = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchApi('/timetable');
      if (res.success) setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadCourses = useCallback(async () => {
    setCoursesLoading(true);
    try {
      const res = await fetchApi('/timetable/courses');
      if (res.success && res.data) {
        setCourses(res.data);
        if (res.data.length > 0 && !slotForm.courseId) {
          setSlotForm(prev => ({ ...prev, courseId: res.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setCoursesLoading(false);
    }
  }, [slotForm.courseId]);

  const loadTeachers = useCallback(async () => {
    try {
      const res = await fetchApi('/timetable/teachers');
      if (res.success && res.data) {
        setTeachers(res.data);
        if (res.data.length > 0 && !courseForm.teacherId) {
          setCourseForm(prev => ({ ...prev, teacherId: res.data[0].id }));
        }
      }
    } catch (err) {
      console.error(err);
    }
  }, [courseForm.teacherId]);

  useEffect(() => {
    if (!user) return;
    loadTimetable();
    loadCourses();
    loadTeachers();
  }, [user, loadTimetable, loadCourses, loadTeachers]);

  const handleEnroll = async (courseId: string, isEnrolled: boolean) => {
    setEnrollingId(courseId);
    try {
      if (isEnrolled) {
        await fetchApi(`/timetable/enroll/${courseId}`, { method: 'DELETE' });
      } else {
        await fetchApi(`/timetable/enroll/${courseId}`, { method: 'POST' });
      }
      await Promise.all([loadCourses(), loadTimetable()]);
    } catch (err) {
      console.error(err);
    } finally {
      setEnrollingId(null);
    }
  };

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slotForm.courseId) {
      setModalError('Please select a subject for this slot.');
      return;
    }
    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);
    try {
      const res = await fetchApi('/timetable/slot', {
        method: 'POST',
        body: JSON.stringify(slotForm)
      });
      if (res.success) {
        setModalSuccess('Timetable slot added successfully!');
        setTimeout(() => {
          setShowAddSlot(false);
          setModalSuccess(null);
        }, 1000);
        await loadTimetable();
      } else {
        setModalError(res.message || 'Failed to add timetable slot.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Error adding slot to timetable.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleDeleteSlot = async (id: string) => {
    if (!confirm('Remove this class slot from the timetable?')) return;
    try {
      await fetchApi(`/timetable/slot/${id}`, { method: 'DELETE' });
      await loadTimetable();
    } catch (err: any) {
      alert(err.message || 'Failed to remove slot.');
    }
  };

  const handleAddCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseForm.code.trim() || !courseForm.name.trim()) {
      setModalError('Course Code and Name are required.');
      return;
    }
    setModalSubmitting(true);
    setModalError(null);
    setModalSuccess(null);
    try {
      const res = await fetchApi('/timetable/courses', {
        method: 'POST',
        body: JSON.stringify(courseForm)
      });
      if (res.success) {
        setModalSuccess(`Subject "${courseForm.name}" created and enrolled!`);
        setCourseForm({
          code: '',
          name: '',
          description: '',
          department: 'Computer Science & Engineering',
          semester: 5,
          credits: 4,
          teacherId: teachers[0]?.id || ''
        });
        setTimeout(() => {
          setShowAddCourse(false);
          setModalSuccess(null);
        }, 1200);
        await Promise.all([loadCourses(), loadTimetable()]);
      } else {
        setModalError(res.message || 'Failed to add subject.');
      }
    } catch (err: any) {
      setModalError(err.message || 'Error adding subject.');
    } finally {
      setModalSubmitting(false);
    }
  };

  const semesters = Array.from(new Set(courses.map(c => c.semester))).sort();
  const filteredCourses = filterSem ? courses.filter(c => c.semester === filterSem) : courses;
  const enrolledCourses = courses.filter(c => c.isEnrolled);
  const enrolledCount = enrolledCourses.length;

  return (
    <div className="space-y-5 pb-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Timetable & Subjects</h1>
          <p className="text-xs text-slate-400 mt-1">Manage your weekly class schedule and enrolled subjects</p>
        </div>
        <div className="flex items-center gap-2">
          {tab === 'timetable' && (
            <button
              onClick={() => {
                setModalError(null);
                setModalSuccess(null);
                setShowAddSlot(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-glow-primary"
            >
              <Plus className="w-3.5 h-3.5" /> Add Class Slot
            </button>
          )}
          {tab === 'courses' && (
            <button
              onClick={() => {
                setModalError(null);
                setModalSuccess(null);
                setShowAddCourse(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-primary hover:bg-primary-hover text-white text-xs font-semibold transition-all shadow-glow-primary"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Subject
            </button>
          )}
          <button
            onClick={() => { loadTimetable(); loadCourses(); }}
            className="p-2 rounded-xl bg-surface-elevated/60 border border-border/40 text-slate-400 hover:text-white transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 glass-panel rounded-2xl p-1 border border-border/40 w-fit">
        {[
          { key: 'timetable', label: 'Weekly Schedule', icon: <Calendar className="w-3.5 h-3.5" /> },
          { key: 'courses', label: `My Subjects (${enrolledCount})`, icon: <BookOpen className="w-3.5 h-3.5" /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key as Tab)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === t.key
                ? 'bg-primary text-white shadow-glow-primary'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* TIMETABLE TAB */}
      {tab === 'timetable' && (
        <>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
              {[...Array(5)].map((_, i) => <div key={i} className="skeleton h-64 rounded-2xl" />)}
            </div>
          ) : !data ? (
            <div className="text-center py-16 text-slate-400 text-sm">Could not load timetable.</div>
          ) : (
            <>
              {/* Today's summary */}
              {data.todayLectures?.length > 0 && (
                <div className="glass-card rounded-2xl p-4 border border-accent/20 bg-accent/5">
                  <p className="text-xs font-semibold text-accent mb-2 uppercase tracking-wider">Today's Classes — {data.currentDay}</p>
                  <div className="flex gap-3 flex-wrap">
                    {data.todayLectures.map((e: any) => (
                      <div key={e.id} className="flex items-center gap-2 bg-surface-elevated/80 rounded-xl px-3 py-2">
                        <Clock className="w-3 h-3 text-accent" />
                        <span className="text-xs font-semibold text-white">{e.startTime} – {e.endTime}</span>
                        <span className="text-xs text-slate-300 font-bold">{e.course?.code || ''}</span>
                        <span className="text-xs text-slate-400">({e.room})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {data.todayLectures?.length === 0 && (
                <div className="glass-card rounded-2xl p-4 border border-border/30 text-center">
                  <p className="text-xs text-slate-400">No classes today ({data.currentDay}). Click "+ Add Class Slot" to customize your schedule! 🎉</p>
                </div>
              )}

              {/* Weekly Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
                {DAYS.map((day) => {
                  const entries = data.weeklyTimetable?.[day] || [];
                  const isToday = day === data.currentDay;
                  return (
                    <div key={day} className={`rounded-2xl border transition-all ${isToday ? 'border-primary/40 bg-primary/5' : 'border-border/40 glass-card'}`}>
                      <div className={`p-3 border-b flex items-center justify-between ${isToday ? 'border-primary/30' : 'border-border/30'}`}>
                        <p className={`text-xs font-bold uppercase tracking-wider ${isToday ? 'text-primary-glow' : 'text-slate-400'}`}>
                          {DAY_SHORT[day]}
                        </p>
                        {isToday && <span className="text-[10px] font-semibold text-primary px-1.5 py-0.5 rounded-full bg-primary/10">Today</span>}
                      </div>
                      <div className="p-2 space-y-2 min-h-[220px]">
                        {entries.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-28 text-[11px] text-slate-600">
                            <span>No classes</span>
                          </div>
                        ) : (
                          entries.map((e: any, i: number) => {
                            const colorClass = COLORS[i % COLORS.length];
                            return (
                              <div key={e.id} className={`group relative p-2.5 rounded-xl border-l-2 ${colorClass} hover:brightness-110 transition-all`}>
                                <div className="flex items-start justify-between">
                                  <p className="text-[10px] font-mono text-slate-400">{e.startTime} – {e.endTime}</p>
                                  <button
                                    onClick={() => handleDeleteSlot(e.id)}
                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-danger rounded transition-all"
                                    title="Delete slot"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="text-xs font-semibold text-white mt-0.5 leading-tight">{e.course?.code}</p>
                                <p className="text-[10px] text-slate-400 truncate">{e.course?.name}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <MapPin className="w-2.5 h-2.5 text-slate-500" />
                                  <p className="text-[10px] text-slate-500">{e.room}</p>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}

      {/* COURSES / ENROLLMENT TAB */}
      {tab === 'courses' && (
        <>
          {/* Filter bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">
                <Filter className="w-3.5 h-3.5" /> Semester:
              </div>
              <button
                onClick={() => setFilterSem(null)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterSem === null ? 'bg-primary text-white' : 'bg-surface-elevated/60 text-slate-400 hover:text-white'}`}
              >
                All
              </button>
              {semesters.map(sem => (
                <button
                  key={sem}
                  onClick={() => setFilterSem(sem)}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all ${filterSem === sem ? 'bg-primary text-white' : 'bg-surface-elevated/60 text-slate-400 hover:text-white'}`}
                >
                  Sem {sem}
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                setModalError(null);
                setModalSuccess(null);
                setShowAddCourse(true);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-surface-elevated border border-primary/30 text-primary-glow text-xs font-semibold hover:bg-primary/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" /> Add New Subject
            </button>
          </div>

          {/* Enrolled summary */}
          <div className="glass-card rounded-2xl p-4 border border-accent/20 bg-accent/5">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              <div>
                <p className="text-sm font-bold text-white">Enrolled in {enrolledCount} {enrolledCount === 1 ? 'subject' : 'subjects'}</p>
                <p className="text-xs text-slate-400">Teachers can mark attendance for your enrolled subjects. You can also add custom subjects anytime.</p>
              </div>
            </div>
          </div>

          {coursesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-28 rounded-2xl" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredCourses.map((course: any, idx: number) => {
                const colorClass = COLORS[idx % COLORS.length];
                const isEnrolled = course.isEnrolled;
                const isLoading = enrollingId === course.id;
                return (
                  <div
                    key={course.id}
                    className={`glass-card rounded-2xl p-4 border-l-2 ${colorClass} ${isEnrolled ? 'ring-1 ring-accent/30' : ''} hover:-translate-y-0.5 transition-all`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-mono font-bold text-primary-glow bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">{course.code}</span>
                          <span className="text-[10px] text-slate-500">Sem {course.semester} · {course.credits} credits</span>
                          {isEnrolled && (
                            <span className="text-[10px] font-semibold text-accent bg-accent/10 px-2 py-0.5 rounded-lg border border-accent/20 flex items-center gap-1">
                              <CheckCircle2 className="w-2.5 h-2.5" /> Enrolled
                            </span>
                          )}
                        </div>
                        <p className="text-sm font-semibold text-white leading-tight truncate">{course.name}</p>
                        {course.description && (
                          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{course.description}</p>
                        )}
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Award className="w-3 h-3 text-primary-glow" /> {course.teacher}
                          </div>
                          <div className="flex items-center gap-1 text-[10px] text-slate-400">
                            <Users className="w-3 h-3" /> {course.enrolledCount} students
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleEnroll(course.id, isEnrolled)}
                        disabled={isLoading}
                        className={`shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all disabled:opacity-50 ${
                          isEnrolled
                            ? 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20'
                            : 'bg-accent/10 text-accent border border-accent/20 hover:bg-accent/20'
                        }`}
                      >
                        {isLoading ? (
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        ) : isEnrolled ? (
                          <><Minus className="w-3.5 h-3.5" /> Drop</>
                        ) : (
                          <><Plus className="w-3.5 h-3.5" /> Enroll</>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {filteredCourses.length === 0 && !coursesLoading && (
            <div className="text-center py-16 text-slate-400 text-sm">
              No subjects found in this filter. Click "+ Add New Subject" to create one!
            </div>
          )}
        </>
      )}

      {/* MODAL: ADD TIMETABLE SLOT */}
      {showAddSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-2xl p-6 border border-primary/30 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary-glow" />
                <h2 className="text-sm font-bold text-white">Add Timetable Slot</h2>
              </div>
              <button onClick={() => setShowAddSlot(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}
            {modalSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddSlot} className="space-y-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subject</label>
                <select
                  value={slotForm.courseId}
                  onChange={e => setSlotForm(p => ({ ...p, courseId: e.target.value }))}
                  className="w-full bg-surface-elevated text-white text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-primary/50 outline-none"
                  required
                >
                  <option value="" disabled>Select course/subject</option>
                  {(enrolledCourses.length > 0 ? enrolledCourses : courses).map(c => (
                    <option key={c.id} value={c.id}>{c.code} - {c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Day of Week</label>
                <select
                  value={slotForm.dayOfWeek}
                  onChange={e => setSlotForm(p => ({ ...p, dayOfWeek: e.target.value }))}
                  className="w-full bg-surface-elevated text-white text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-primary/50 outline-none"
                >
                  {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={slotForm.startTime}
                    onChange={e => setSlotForm(p => ({ ...p, startTime: e.target.value }))}
                    className="w-full bg-surface-elevated text-white text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-primary/50 outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={slotForm.endTime}
                    onChange={e => setSlotForm(p => ({ ...p, endTime: e.target.value }))}
                    className="w-full bg-surface-elevated text-white text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-primary/50 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Room / Location</label>
                <input
                  type="text"
                  value={slotForm.room}
                  onChange={e => setSlotForm(p => ({ ...p, room: e.target.value }))}
                  placeholder="e.g. Lab 402, Hall A"
                  className="w-full bg-surface-elevated text-white text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-primary/50 outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={modalSubmitting}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover disabled:opacity-50 transition-all shadow-glow-primary mt-2"
              >
                {modalSubmitting ? 'Saving Slot...' : 'Add Slot to Timetable'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD NEW SUBJECT */}
      {showAddCourse && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="glass-card rounded-2xl p-6 border border-primary/30 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary-glow" />
                <h2 className="text-sm font-bold text-white">Add New Subject</h2>
              </div>
              <button onClick={() => setShowAddCourse(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Create a subject for your semester. Teachers will be able to view and mark your attendance for this subject!
            </p>

            {modalError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-danger/10 border border-danger/30 text-danger text-xs">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}
            {modalSuccess && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-accent/10 border border-accent/30 text-accent text-xs">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{modalSuccess}</span>
              </div>
            )}

            <form onSubmit={handleAddCourse} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Course Code</label>
                  <input
                    type="text"
                    value={courseForm.code}
                    onChange={e => setCourseForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                    placeholder="e.g. CS504"
                    className="w-full bg-surface-elevated text-white text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-primary/50 outline-none uppercase font-mono"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Credits</label>
                  <input
                    type="number"
                    min={1}
                    max={8}
                    value={courseForm.credits}
                    onChange={e => setCourseForm(p => ({ ...p, credits: Number(e.target.value) }))}
                    className="w-full bg-surface-elevated text-white text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-primary/50 outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Subject Name</label>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={e => setCourseForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Software Engineering & Architecture"
                  className="w-full bg-surface-elevated text-white text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-primary/50 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-400 mb-1">Assigned Faculty / Teacher</label>
                <select
                  value={courseForm.teacherId}
                  onChange={e => setCourseForm(p => ({ ...p, teacherId: e.target.value }))}
                  className="w-full bg-surface-elevated text-white text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-primary/50 outline-none"
                >
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.department})</option>
                  ))}
                  {teachers.length === 0 && <option value="">Default Faculty</option>}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Semester</label>
                  <select
                    value={courseForm.semester}
                    onChange={e => setCourseForm(p => ({ ...p, semester: Number(e.target.value) }))}
                    className="w-full bg-surface-elevated text-white text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-primary/50 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8].map(s => <option key={s} value={s}>Semester {s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">Department</label>
                  <input
                    type="text"
                    value={courseForm.department}
                    onChange={e => setCourseForm(p => ({ ...p, department: e.target.value }))}
                    className="w-full bg-surface-elevated text-white text-sm rounded-xl px-4 py-2.5 border border-border/40 focus:border-primary/50 outline-none text-xs"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={modalSubmitting}
                className="w-full py-2.5 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary-hover disabled:opacity-50 transition-all shadow-glow-primary mt-2"
              >
                {modalSubmitting ? 'Creating Subject...' : 'Create Subject & Enroll'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
