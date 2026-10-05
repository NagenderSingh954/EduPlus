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
      <div>
        <h1 className="text-xl font-bold text-white">Attendance Analytics</h1>
        <p className="text-xs text-slate-400 mt-1">Real-time attendance tracking across all enrolled subjects</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-border/40">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">Overall</p>
          <p className={`text-3xl font-bold mt-1 ${overview.overallAttendance >= 75 ? 'text-accent' : 'text-danger-glow'}`}>
            {overview.overallAttendance}%
          </p>
          <p className="text-[11px] text-slate-500 mt-1">{overview.overallAttendance >= 75 ? 'Above threshold' : 'Below 75% threshold!'}</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-border/40">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">Safe Subjects</p>
          <p className="text-3xl font-bold mt-1 text-accent">{safeSubjects.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">≥75% attendance</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-border/40">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">At Risk</p>
          <p className={`text-3xl font-bold mt-1 ${atRiskSubjects.length > 0 ? 'text-danger-glow' : 'text-accent'}`}>{atRiskSubjects.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Below 75%</p>
        </div>
        <div className="glass-card rounded-2xl p-4 border border-border/40">
          <p className="text-[11px] text-slate-400 uppercase tracking-wider">Subjects</p>
          <p className="text-3xl font-bold mt-1 text-white">{subjectAttendance.length}</p>
          <p className="text-[11px] text-slate-500 mt-1">Enrolled</p>
        </div>
      </div>

      {/* At-Risk Alerts */}
      {atRiskSubjects.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-sm font-semibold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger-glow animate-pulse" /> Attendance Alerts
          </h2>
          {atRiskSubjects.map((s: any) => (
            <div key={s.code} className="glass-card rounded-2xl p-4 border border-danger/30 bg-danger/5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">{s.name}</p>
                  <p className="text-xs text-slate-400">{s.code} · {s.attended}/{s.total} classes attended</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-danger-glow">{s.percentage}%</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {s.classesNeededFor75 > 0 ? `Need ${s.classesNeededFor75} more to reach 75%` : 'Safe'}
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
        </div>
      )}

      {/* Chart */}
      <div className="glass-card rounded-2xl p-5 border border-border/40">
        <h2 className="text-sm font-semibold text-white mb-4">Subject-wise Attendance</h2>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={chartData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} domain={[0, 100]} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 12, fontSize: 12 }}
              formatter={(v: any, name: string) => [`${v}%`, name === 'attendance' ? 'Attended' : 'Missed']}
              labelFormatter={(label: string, payload: any) => payload?.[0]?.payload?.fullName || label}
            />
            <Bar dataKey="attendance" name="attendance" radius={[6, 6, 0, 0]}>
              {chartData.map((entry: any, idx: number) => (
                <Cell key={idx} fill={entry.isAtRisk ? '#ef4444' : '#6366f1'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        {/* Threshold line label */}
        <p className="text-[11px] text-slate-500 text-center mt-2">Red bars = below 75% threshold. Consecutive attendance required.</p>
      </div>

      {/* Subject Breakdown Table */}
      <div className="glass-card rounded-2xl border border-border/40 overflow-hidden">
        <div className="p-4 border-b border-border/40">
          <h2 className="text-sm font-semibold text-white">Detailed Breakdown</h2>
        </div>
        <div className="divide-y divide-border/30">
          {subjectAttendance.map((s: any) => (
            <div key={s.code} className="flex items-center gap-4 p-4 hover:bg-surface-elevated/30 transition-colors">
              <div className={`w-2 h-8 rounded-full shrink-0 ${s.isAtRisk ? 'bg-danger' : 'bg-accent'}`} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{s.name}</p>
                <p className="text-[11px] text-slate-400">{s.code}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-400">{s.attended}/{s.total}</p>
                <p className="text-[10px] text-slate-500">classes</p>
              </div>
              <div className="w-24 hidden sm:block">
                <div className="w-full bg-surface-elevated rounded-full h-1.5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${s.percentage}%`, backgroundColor: s.isAtRisk ? '#ef4444' : '#10b981' }}
                  />
                </div>
              </div>
              <div className="text-right w-16">
                <p className={`text-sm font-bold ${s.isAtRisk ? 'text-danger-glow' : 'text-accent'}`}>{s.percentage}%</p>
                {s.isAtRisk && <p className="text-[10px] text-warning">+{s.classesNeededFor75} to 75%</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
