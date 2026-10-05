'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LayoutDashboard,
  Bot,
  FileText,
  UserCheck,
  Calendar,
  MessageSquare,
  Users,
  FolderGit2,
  CheckSquare,
  GraduationCap,
  ClipboardList
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  // Hide sidebar on login page
  if (pathname === '/login') return null;

  const isTeacher = user?.role === 'TEACHER';

  const studentLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/ai-assistant', label: 'AI Academic OS', icon: Bot, badge: 'Gemini' },
    { href: '/documents', label: 'Doc Intelligence', icon: FileText },
    { href: '/attendance', label: 'Attendance', icon: UserCheck, alert: true },
    { href: '/timetable', label: 'Timetable', icon: Calendar },
    { href: '/community', label: 'Community Doubts', icon: MessageSquare },
    { href: '/collaboration', label: 'AI Team Matcher', icon: Users, badge: 'AI' },
    { href: '/projects', label: 'Project Workspace', icon: FolderGit2 }
  ];

  const teacherLinks = [
    { href: '/teacher', label: 'Overview', icon: LayoutDashboard },
    { href: '/teacher/attendance', label: 'Mark Attendance', icon: ClipboardList, badge: 'Active' },
    { href: '/teacher/courses', label: 'Course Rosters', icon: GraduationCap }
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  return (
    <aside className="w-64 shrink-0 glass-panel border-r border-border/40 flex flex-col justify-between py-6 px-4 hidden md:flex min-h-[calc(100vh-61px)]">
      <div className="space-y-6">
        <div className="px-2">
          <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
            {isTeacher ? 'Faculty Portal' : 'Student Operating System'}
          </p>
        </div>

        <nav className="space-y-1.5">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-white shadow-glow-primary'
                    : 'text-slate-300 hover:text-white hover:bg-surface-elevated/70'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </div>
                {link.badge && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold ${
                    isActive ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary-glow'
                  }`}>
                    {link.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Persistent Academic OS Footer Card */}
      <div className="glass-card rounded-2xl p-3.5 border border-border/40">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] font-semibold text-white">Continuous State</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isTeacher
            ? 'Real-time attendance syncing directly into student academic profiles.'
            : 'Gemini reasoning grounded in your persistent database state.'}
        </p>
      </div>
    </aside>
  );
};
