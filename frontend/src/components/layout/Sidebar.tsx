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
  GraduationCap,
  ClipboardList,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (pathname === '/login' || pathname === '/') return null;

  const isTeacher = user?.role === 'TEACHER';

  const studentLinks: Array<{ href: string; label: string; icon: typeof LayoutDashboard; badge?: string; alert?: boolean }> = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/ai-assistant', label: 'AI assistant', icon: Bot },
    { href: '/documents', label: 'Documents', icon: FileText },
    { href: '/attendance', label: 'Attendance', icon: UserCheck, alert: true },
    { href: '/timetable', label: 'Timetable', icon: Calendar },
    { href: '/community', label: 'Community', icon: MessageSquare },
    { href: '/collaboration', label: 'Find collaborators', icon: Users },
    { href: '/projects', label: 'Projects', icon: FolderGit2 }
  ];

  const teacherLinks: Array<{ href: string; label: string; icon: typeof LayoutDashboard; badge?: string; alert?: boolean }> = [
    { href: '/teacher', label: 'Overview', icon: LayoutDashboard },
    { href: '/teacher/attendance', label: 'Mark Attendance', icon: ClipboardList, badge: 'Active' },
    { href: '/teacher/courses', label: 'Course Rosters', icon: GraduationCap }
  ];

  const links = isTeacher ? teacherLinks : studentLinks;

  return (
    <aside
      className="sticky top-[64px] flex h-[calc(100vh-64px)] w-[224px] shrink-0 flex-col justify-between border-r border-[#dfe4df] bg-[#f8faf7] px-3 py-4 max-md:hidden"
    >
      <div>
        <div className="mb-3 px-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#989d95]">
            {isTeacher ? 'Faculty workspace' : 'My workspace'}
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
                className={`edu-nav-link relative flex items-center justify-between rounded-[7px] px-3 py-2.5 text-[13px] font-medium ${
                  isActive
                    ? 'edu-nav-active bg-[#edf3ee] text-[#1d5a43]'
                    : 'text-[#686d66] hover:bg-[#f2f4f0] hover:text-[#171918]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-primary' : 'text-slate-400'}`} />
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
      <div className="mb-1 rounded-[9px] border border-[#e4e7e1] bg-white p-3.5">
        <div className="flex items-center gap-2 mb-1.5">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] font-semibold text-slate-800">Workspace status</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {isTeacher
            ? 'Attendance is synced to student academic profiles.'
            : 'Academic insights grounded in your current records.'}
        </p>
      </div>
    </aside>
  );
};
