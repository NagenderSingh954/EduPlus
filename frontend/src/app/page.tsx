'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, CalendarDays, ChartNoAxesColumnIncreasing, FileText, MessageSquareText, Check } from 'lucide-react';

export default function Home() {
  const { user } = useAuth();
  const workspaceHref = user?.role === 'TEACHER' ? '/teacher' : user ? '/dashboard' : '/login';

  return (
    <main className="min-h-screen bg-[#f7f8f5] text-[#171918]">
      <nav className="mx-auto flex h-[72px] max-w-[1180px] items-center justify-between px-5 md:px-8">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#1d5a43] text-[11px] font-bold text-white">EP</div>
          <span className="text-[16px] font-bold tracking-[-0.02em]">EduPlus</span>
        </Link>
        <div className="hidden items-center gap-7 text-[13px] text-[#686d66] md:flex">
          <a href="#features" className="hover:text-[#171918]">Product</a>
          <a href="#workflow" className="hover:text-[#171918]">For campus</a>
          <a href="#contact" className="hover:text-[#171918]">Support</a>
        </div>
        <Link href={workspaceHref} className="flex h-10 items-center gap-2 rounded-[8px] border border-[#d6ddd6] bg-white px-4 text-[13px] font-semibold shadow-sm hover:border-[#bcc8be]">
          {user ? 'Open workspace' : 'Sign in'}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </nav>

      <section className="mx-auto grid max-w-[1180px] items-center gap-12 px-5 py-16 md:px-8 lg:grid-cols-[1.05fr_.95fr] lg:py-24">
        <div>
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#dce4dc] bg-white px-3 py-1.5 text-[11px] font-semibold text-[#4f7657]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#1d5a43]" />
            One workspace for every academic need
          </div>
          <h1 className="max-w-[620px] text-[48px] font-semibold leading-[1.02] tracking-[-0.055em] md:text-[68px]">
            Work through university, clearly.
          </h1>
          <p className="mt-6 max-w-[520px] text-[16px] leading-7 text-[#6d736b]">
            Plan classes, track progress, collaborate with peers, and keep every academic task in one focused workspace.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link href={workspaceHref} className="flex h-12 items-center gap-2 rounded-[9px] bg-[#1d5a43] px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_rgba(29,90,67,.16)] hover:bg-[#174936]">
              {user ? 'Go to workspace' : 'Start with EduPlus'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#features" className="flex h-12 items-center rounded-[9px] border border-[#d8ded7] bg-white px-5 text-[14px] font-semibold text-[#4d554e]">
              Explore features
            </a>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[14px] border border-[#dde4dc] bg-white p-3 shadow-[0_24px_70px_rgba(23,25,24,.08)]">
          <div className="flex items-center justify-between border-b border-[#edf0eb] px-3 pb-3">
            <div>
              <p className="text-[10px] text-[#8d938b]">Monday, 21 November</p>
              <p className="mt-1 text-[13px] font-semibold">Semester overview</p>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#e3e6df]" />
              <span className="h-2 w-2 rounded-full bg-[#d0d6ce]" />
              <span className="h-2 w-2 rounded-full bg-[#1d5a43]" />
            </div>
          </div>
          <div className="grid grid-cols-[1fr_130px] gap-3 p-3">
            <div className="rounded-[9px] border border-[#edf0eb] p-4">
              <div className="mb-5 flex items-center justify-between">
                <p className="text-[11px] font-semibold text-[#4d554e]">Today</p>
                <p className="text-[10px] text-[#8d938b]">3 sessions</p>
              </div>
              {[
                ['09:00', 'Database Systems', 'Hall 204'],
                ['11:30', 'Design Engineering', 'Studio 3'],
                ['14:00', 'Independent Study', 'Library'],
              ].map(([time, title, place]) => (
                <div key={title} className="grid grid-cols-[44px_1fr] border-t border-[#edf0eb] py-3">
                  <span className="text-[10px] text-[#8d938b]">{time}</span>
                  <div>
                    <p className="text-[12px] font-semibold">{title}</p>
                    <p className="mt-0.5 text-[10px] text-[#8d938b]">{place}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="rounded-[9px] border border-[#edf0eb] p-4">
                <p className="text-[10px] text-[#8d938b]">Attendance</p>
                <p className="mt-3 text-[28px] font-semibold tracking-[-0.05em]">83%</p>
                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#edf0eb]"><div className="h-full w-[83%] rounded-full bg-[#1d5a43]" /></div>
              </div>
              <div className="rounded-[9px] border border-[#edf0eb] p-4">
                <p className="text-[10px] text-[#8d938b]">Assignments</p>
                <p className="mt-3 text-[28px] font-semibold tracking-[-0.05em]">2</p>
                <p className="mt-2 text-[10px] text-[#8d938b]">Due this week</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="border-y border-[#e4e7e1] bg-white">
        <div className="mx-auto grid max-w-[1180px] gap-px px-5 md:grid-cols-2 md:px-8 lg:grid-cols-4">
          {[
            [CalendarDays, 'Plan', 'Keep classes and deadlines in one schedule.'],
            [ChartNoAxesColumnIncreasing, 'Measure', 'Understand progress with clear academic insights.'],
            [FileText, 'Learn', 'Organize documents and course material.'],
            [MessageSquareText, 'Collaborate', 'Ask questions and work with classmates.'],
          ].map(([Icon, title, copy]: any) => (
            <div key={title} className="border-b border-[#edf0eb] px-2 py-8 md:border-r md:border-b-0 md:px-5">
              <Icon className="h-[18px] w-[18px] text-[#1d5a43]" />
              <p className="mt-5 text-[14px] font-semibold">{title}</p>
              <p className="mt-2 max-w-[220px] text-[12px] leading-5 text-[#858b82]">{copy}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="workflow" className="mx-auto max-w-[1180px] px-5 py-16 md:px-8">
        <div className="grid items-start gap-10 lg:grid-cols-[.7fr_1.3fr]">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#1d5a43]">Built for daily work</p>
            <h2 className="mt-3 text-[34px] font-semibold leading-[1.1] tracking-[-0.04em]">A calmer way to stay on top.</h2>
          </div>
          <div className="divide-y divide-[#e4e7e1] border-y border-[#e4e7e1]">
            {[
              ['01', 'Know what matters today', 'See classes, deadlines and priorities in one place.'],
              ['02', 'Stay ahead of risk', 'Attendance and academic signals show when action is needed.'],
              ['03', 'Move together', 'Find collaborators and manage project work without switching tools.'],
            ].map(([number, title, copy]) => (
              <div key={number} className="grid grid-cols-[44px_1fr] gap-3 py-5">
                <span className="text-[11px] font-semibold text-[#1d5a43]">{number}</span>
                <div>
                  <p className="text-[14px] font-semibold">{title}</p>
                  <p className="mt-1 text-[12px] text-[#858b82]">{copy}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer id="contact" className="border-t border-[#e4e7e1]">
        <div className="mx-auto flex max-w-[1180px] items-center justify-between px-5 py-6 text-[11px] text-[#858b82] md:px-8">
          <span>EduPlus Academic Workspace</span>
          <span className="flex items-center gap-1.5"><Check className="h-3 w-3 text-[#1d5a43]" /> Built for focused study</span>
        </div>
      </footer>
    </main>
  );
}
