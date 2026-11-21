'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { CheckCircle2, TrendingUp, AlertTriangle, Award, BookOpen, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';

export default function AttendancePage() {
  const { user } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.studentProfile) return;
    try {
      const res = await fetchApi('/students/dashboard');
      if (res.success) setData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-24 rounded-2xl" />
      <div className="grid grid-cols-3 gap-4">{[...Array(3)].map((_, i) => <div key={i} className="skeleton h-20 rounded-2xl" />)}</div>
      <div className="skeleton h-64 rounded-2xl" />
    </div>
  );

  if (!data) return null;

  const { overview, subjectAttendance } = data;

  const chartData = subjectAttendance.map((s: any) => ({
    name: s.code,
    fullName: s.name,
    attendance: s.percentage,
    missed: 100 - s.percentage,
    isAtRisk: s.isAtRisk
  }));

  const atRiskSubjects = subjectAttendance.filter((s: any) => s.isAtRisk);
  const safeSubjects = subjectAttendance.filter((s: any) => !s.isAtRisk);

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="edu-section-head">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1d5a43]">Academic record</p>
        <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.035em] text-[#171918]">Attendance analytics</h1>
        <p className="mt-1 text-[12px] text-[#858b82]">Real-time tracking across all enrolled subjects</p>
      </div>

      {/* Overall attendance as an editorial summary */}
      <section className="grid overflow-hidden rounded-[12px] border border-[#e4e7e1] bg-white lg:grid-cols-[1.35fr_.65fr]">
        <div className="flex items-end justify-between px-5 py-6 md:px-7">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#858b82]">Overall attendance</p>
            <p className={`mt-3 text-[52px] font-semibold leading-none tracking-[-0.06em] ${overview.overallAttendance >= 75 ? 'text-[#1d5a43]' : 'text-[#b42318]'}`}>
              {overview.overallAttendance}<span className="text-[22px]">%</span>
            </p>
            <p className="mt-3 text-[12px] text-[#858b82]">
              {overview.overallAttendance >= 75 ? 'Meeting the required threshold' : 'Attendance is below the required threshold'}
            </p>
          </div>
          <div className="relative mb-1 hidden h-24 w-24 sm:block">
            <svg className="-rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="38" fill="none" stroke="#eef0ec" strokeWidth="8" />
              <circle cx="50" cy="50" r="38" fill="none" stroke={overview.overallAttendance >= 75 ? '#1d5a43' : '#b42318'} strokeWidth="8" strokeLinecap="round" strokeDasharray={`${overview.overallAttendance * 2.39} 239`} />
            </svg>
          </div>
        </div>
        <div className="grid grid-cols-3 border-t border-[#e4e7e1] lg:grid-cols-1 lg:border-l lg:border-t-0">
          <div className="px-4 py-5 lg:flex lg:items-center lg:justify-between lg:px-6">
            <p className="text-[11px] text-[#858b82]">On track</p>
            <p className="mt-1 text-[22px] font-semibold text-[#1d5a43] lg:mt-0">{safeSubjects.length}</p>
          </div>
          <div className="border-l border-[#e4e7e1] px-4 py-5 lg:flex lg:items-center lg:justify-between lg:border-l-0 lg:border-t lg:px-6">
            <p className="text-[11px] text-[#858b82]">At risk</p>
            <p className="mt-1 text-[22px] font-semibold text-[#b42318] lg:mt-0">{atRiskSubjects.length}</p>
          </div>
          <div className="border-l border-[#e4e7e1] px-4 py-5 lg:flex lg:items-center lg:justify-between lg:border-l-0 lg:border-t lg:px-6">
            <p className="text-[11px] text-[#858b82]">Subjects</p>
            <p className="mt-1 text-[22px] font-semibold text-[#171918] lg:mt-0">{subjectAttendance.length}</p>
          </div>
        </div>
      </section>

      {/* At-Risk Alerts */}
      {atRiskSubjects.length > 0 && (
        <section className="overflow-hidden rounded-[12px] border border-[#f0d2ce] bg-[#fffafa]">
          <div className="flex items-center justify-between border-b border-[#f0d2ce] px-5 py-3">
            <h2 className="flex items-center gap-2 text-[12px] font-semibold text-[#9f2d24]">
              <AlertTriangle className="h-4 w-4" /> Attention required
            </h2>
            <span className="text-[11px] text-[#a97570]">{atRiskSubjects.length} subject{atRiskSubjects.length === 1 ? '' : 's'} below 75%</span>
          </div>
          {atRiskSubjects.map((s: any) => (
            <div key={s.code} className="px-5 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-semibold text-[#171918]">{s.name}</p>
                  <p className="mt-1 text-[11px] text-[#858b82]">{s.code} · {s.attended}/{s.total} classes attended</p>
                </div>
                <div className="text-right">
                  <p className="text-[20px] font-semibold text-[#b42318]">{s.percentage}%</p>
                  <p className="mt-0.5 text-[10px] text-[#858b82]">
                    {s.classesNeededFor75 > 0 ? `${s.classesNeededFor75} classes to reach 75%` : 'Target reached'}
                  </p>
                </div>
              </div>
              <div className="mt-3">
                <div className="w-full bg-surface-elevated rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-danger transition-all duration-1000"
                    style={{ width: `${s.percentage}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>0%</span>
                  <span className="text-warning">75% threshold</span>
                  <span>100%</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Analysis and subject ledger */}
      <section className="grid gap-5 xl:grid-cols-[1fr_360px]">
      <div className="rounded-[12px] border border-[#e4e7e1] bg-white p-5">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#858b82]">Subject view</p>
            <h2 className="mt-1 text-[16px] font-semibold text-[#171918]">Attendance comparison</h2>
          </div>
          <span className="rounded-md border border-[#e4e7e1] px-2 py-1 text-[10px] text-[#858b82]">Current semester</span>
        </div>
        {subjectAttendance.length === 0 ? (
          <div className="flex h-[220px] items-center justify-center border-t border-[#e4e7e1] text-[12px] text-[#858b82]">No attendance records yet</div>
        ) : (
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e4e7e1" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#858b82', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#858b82', fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#ffffff', border: '1px solid #e4e7e1', borderRadius: 8, fontSize: 12, color: '#171918', boxShadow: '0 8px 24px rgba(23,25,24,.08)' }}
              formatter={(v: any, name: string) => [`${v}%`, name === 'attendance' ? 'Attended' : 'Missed']}
              labelFormatter={(label: string, payload: any) => payload?.[0]?.payload?.fullName || label}
            />
            <Bar dataKey="attendance" name="attendance" radius={[6, 6, 0, 0]}>
              {chartData.map((entry: any, idx: number) => (
                <Cell key={idx} fill={entry.isAtRisk ? '#ef4444' : '#1d5a43'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        )}
      </div>

      <div className="overflow-hidden rounded-[12px] border border-[#e4e7e1] bg-white">
        <div className="flex items-center justify-between border-b border-[#e4e7e1] px-5 py-4">
          <h2 className="text-[13px] font-semibold text-[#171918]">Subject ledger</h2>
          <span className="text-[10px] text-[#858b82]">{subjectAttendance.length} subjects</span>
        </div>
        <div>
          {subjectAttendance.map((s: any) => (
            <div key={s.code} className="flex items-center gap-3 border-b border-[#f0f1ed] px-5 py-3.5 last:border-b-0">
              <div className={`h-8 w-1 rounded-full shrink-0 ${s.isAtRisk ? 'bg-[#b42318]' : 'bg-[#1d5a43]'}`} />
              <div className="flex-1 min-w-0">
                <p className="truncate text-[12px] font-semibold text-[#171918]">{s.name}</p>
                <p className="mt-0.5 text-[10px] text-[#858b82]">{s.code} · {s.attended}/{s.total} classes</p>
              </div>
              <p className={`w-12 text-right text-[13px] font-semibold ${s.isAtRisk ? 'text-[#b42318]' : 'text-[#1d5a43]'}`}>{s.percentage}%</p>
            </div>
          ))}
        </div>
      </div>
      </section>
    </div>
  );
}
