'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useTheme } from '@/lib/theme-context';
import { Bell, Sparkles, CheckCircle2, AlertCircle, LogOut, Sun, Moon } from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { usePathname } from 'next/navigation';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const loadNotifications = async () => {
    try {
      const res = await fetchApi('/notifications');
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (user) loadNotifications();
  }, [user]);

  // Hide navbar on login page — MUST be after all hooks
  if (pathname === '/login') return null;

  const markAllAsRead = async () => {
    try {
      await fetchApi('/notifications/read-all', { method: 'PATCH' });
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch { /* ignore */ }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-border/50 px-6 py-3 flex items-center justify-between">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-glow-primary">
          <Sparkles className="w-5 h-5 text-white animate-pulse-subtle" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight text-white">
              Edu<span className="text-primary-glow">Plus</span>
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/20 text-primary-glow border border-primary/30">
              EduPlus
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block">AI-Powered Academic Intelligence &amp; Collaboration</p>
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-3">
        {/* Role badge */}
        {user && (
          <span className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border ${user.role === 'TEACHER'
              ? 'bg-emerald-600/15 border-emerald-500/30 text-emerald-400'
              : 'bg-primary/15 border-primary/30 text-primary-glow'
            }`}>
            {user.role === 'TEACHER' ? '👨‍🏫' : '🧑‍🎓'} {user.role}
          </span>
        )}

        {/* Theme Toggle Button (Light / Dark Mode) */}
        <button
          onClick={toggleTheme}
          className="relative p-2 rounded-xl bg-surface-elevated/60 border border-border/50 text-slate-300 hover:text-white hover:border-primary/40 transition-all flex items-center justify-center group shadow-sm"
          title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          aria-label={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {theme === 'dark' ? (
            <Sun className="w-4 h-4 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
          ) : (
            <Moon className="w-4 h-4 text-indigo-500 group-hover:-rotate-12 transition-transform duration-300" />
          )}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); }}
            className="relative p-2 rounded-xl bg-surface-elevated/60 border border-border/50 text-slate-300 hover:text-white hover:border-primary/40 transition-all"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-danger text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-bounce">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 glass-panel rounded-2xl shadow-2xl border border-border/70 p-4 z-50">
              <div className="flex items-center justify-between pb-3 border-b border-border/40 mb-3">
                <span className="text-sm font-semibold text-white">Notifications</span>
                {unreadCount > 0 && (
                  <button onClick={markAllAsRead} className="text-xs text-primary-glow hover:underline">
                    Mark all as read
                  </button>
                )}
              </div>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">No new notifications</div>
                ) : (
                  notifications.map((notif: any) => (
                    <div key={notif.id} className={`p-3 rounded-xl border text-left transition-all ${notif.read ? 'bg-surface/40 border-border/30 text-slate-400' : 'bg-primary/10 border-primary/30 text-slate-200'
                      }`}>
                      <div className="flex items-center gap-2 mb-1">
                        {notif.type === 'ATTENDANCE_ALERT'
                          ? <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0" />
                          : <CheckCircle2 className="w-3.5 h-3.5 text-accent shrink-0" />}
                        <span className="text-xs font-semibold text-white truncate">{notif.title}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 leading-relaxed">{notif.message}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User avatar + dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); }}
            className="flex items-center gap-2 pl-2 border-l border-border/40 hover:opacity-80 transition-opacity"
          >
            <img
              src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.firstName || 'User'}`}
              alt="Avatar"
              className="w-8 h-8 rounded-full ring-2 ring-primary/40 bg-surface-elevated"
            />
            <div className="hidden md:block text-left">
              <p className="text-xs font-semibold text-white leading-none">
                {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
              </p>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {user?.role === 'STUDENT'
                  ? `Sem ${user.studentProfile?.semester ?? 5} • ${user.studentProfile?.department?.split(' ')[0] ?? 'CSE'}`
                  : `${user?.teacherProfile?.designation ?? 'Teacher'}`}
              </p>
            </div>
          </button>

          {showUserMenu && (
            <div className="absolute right-0 mt-2 w-52 glass-panel rounded-2xl shadow-2xl border border-border/70 p-2 z-50">
              <div className="px-3 py-2 border-b border-border/40 mb-1">
                <p className="text-xs font-semibold text-white">{user?.firstName} {user?.lastName}</p>
                <p className="text-[11px] text-slate-400 truncate">{user?.email}</p>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); logout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
