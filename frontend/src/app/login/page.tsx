'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, Eye, EyeOff, LockKeyhole, Mail } from 'lucide-react';

type Mode = 'login' | 'register';
type Role = 'STUDENT' | 'TEACHER';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');

  useEffect(() => {
    if (user) router.replace(user.role === 'TEACHER' ? '/teacher' : '/dashboard');
  }, [user, router]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') await login(email, password);
      else await register({
        email,
        password,
        firstName,
        lastName,
        role,
        rollNumber: role === 'STUDENT' ? rollNumber : undefined,
        employeeId: role === 'TEACHER' ? employeeId : undefined,
        department,
      });
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (demoRole: Role) => {
    setRole(demoRole);
    setMode('login');
    setEmail(demoRole === 'STUDENT' ? 'alex.rivera@campus.edu' : 'dr.sharma@campus.edu');
    setPassword('password123');
  };

  return (
    <main className="min-h-screen bg-[#f4f5f0] p-3 sm:p-5">
      <div className="mx-auto min-h-[calc(100vh-24px)] max-w-[1440px] overflow-hidden rounded-[18px] border border-[#dde2d9] bg-white shadow-[0_24px_70px_rgba(27,42,31,0.10)] lg:grid lg:grid-cols-[52%_48%]">
        <section className="relative hidden min-h-[calc(100vh-40px)] flex-col justify-between overflow-hidden bg-[#182019] p-10 text-white lg:flex xl:p-14">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-[9px] bg-[#b8ef73] text-sm font-bold text-[#182019]">EP</div>
            <span className="text-[15px] font-semibold tracking-[-0.02em]">EduPlus</span>
          </div>

          <div className="relative z-10 max-w-[520px]">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#aeb8ad]">Academic workspace</p>
            <h1 className="max-w-[500px] text-[52px] font-semibold leading-[1.04] tracking-[-0.055em] xl:text-[58px]">
              A clearer way to move through university.
            </h1>

            <div className="mt-10 grid max-w-[470px] grid-cols-[1fr_132px] gap-3">
              <div className="rounded-[12px] border border-white/10 bg-white/[0.06] p-5">
                <div className="mb-8 flex items-center justify-between">
                  <span className="text-xs font-medium text-white/65">Today</span>
                  <span className="text-xs font-semibold text-[#b8ef73]">3 classes</span>
                </div>
                <div className="space-y-2.5">
                  {[
                    ['09:00', 'Database Systems', 'Hall 204'],
                    ['11:30', 'Design Engineering', 'Studio 3'],
                    ['14:00', 'Independent Study', 'Library'],
                  ].map(([time, title, place]) => (
                    <div key={title} className="grid grid-cols-[48px_1fr] gap-3 border-t border-white/[0.08] pt-2.5">
                      <span className="text-[10px] text-white/45">{time}</span>
                      <div>
                        <p className="text-xs font-medium">{title}</p>
                        <p className="mt-0.5 text-[10px] text-white/45">{place}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-[12px] border border-white/10 bg-[#b8ef73] p-5 text-[#182019]">
                <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">Progress</p>
                <p className="mt-5 text-[38px] font-semibold tracking-[-0.05em]">78%</p>
                <p className="mt-1 text-[11px] text-[#4f6048]">Semester on track</p>
                <div className="mt-8 h-1.5 overflow-hidden rounded-full bg-[#182019]/10">
                  <div className="h-full w-[78%] rounded-full bg-[#182019]" />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[11px] text-white/35">Designed for focused academic work.</p>
        </section>

        <section className="flex min-h-[calc(100vh-24px)] items-center justify-center px-5 py-10 sm:px-10 lg:min-h-[calc(100vh-40px)]">
          <div className="w-full max-w-[390px]">
            <div className="mb-9 flex items-center gap-3 lg:hidden">
              <div className="grid h-9 w-9 place-items-center rounded-[8px] bg-[#182019] text-xs font-bold text-[#b8ef73]">EP</div>
              <span className="text-sm font-semibold">EduPlus</span>
            </div>

            <p className="mb-2 text-[12px] font-semibold text-[#4f7657]">{mode === 'login' ? 'Welcome back' : 'Start here'}</p>
            <h2 className="text-[32px] font-semibold tracking-[-0.04em] text-[#171917]">
              {mode === 'login' ? 'Sign in to EduPlus' : 'Create your account'}
            </h2>
            <p className="mt-2 text-[13px] text-[#777c74]">
              {mode === 'login' ? 'Use your campus account to continue.' : 'Set up your academic workspace.'}
            </p>

            <div className="mt-7 grid grid-cols-2 rounded-[9px] bg-[#eff1ec] p-1">
              {(['login', 'register'] as Mode[]).map((item) => (
                <button
                  key={item}
                  type="button"
                  onClick={() => { setMode(item); setError(''); }}
                  className={`h-9 rounded-[7px] text-[13px] font-semibold transition ${mode === item ? 'bg-white text-[#171917] shadow-sm' : 'text-[#777c74]'}`}
                >
                  {item === 'login' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {mode === 'register' && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="First name"><input value={firstName} onChange={(e) => setFirstName(e.target.value)} required className="auth-input" placeholder="Alex" /></Field>
                  <Field label="Last name"><input value={lastName} onChange={(e) => setLastName(e.target.value)} required className="auth-input" placeholder="Rivera" /></Field>
                </div>
              )}

              <div>
                <p className="mb-2 text-[12px] font-semibold text-[#4d514a]">Account type</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['STUDENT', 'TEACHER'] as Role[]).map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setRole(item)}
                      className={`h-10 rounded-[8px] border text-[13px] font-semibold transition ${role === item ? 'border-[#2f6c40] bg-[#edf6ee] text-[#225932]' : 'border-[#dfe3dc] bg-white text-[#777c74] hover:border-[#bfc7bb]'}`}
                    >
                      {item === 'STUDENT' ? 'Student' : 'Teacher'}
                    </button>
                  ))}
                </div>
              </div>

              {mode === 'register' && role === 'STUDENT' && (
                <Field label="Roll number"><input value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} className="auth-input" placeholder="CS2021001" /></Field>
              )}
              {mode === 'register' && role === 'TEACHER' && (
                <Field label="Employee ID"><input value={employeeId} onChange={(e) => setEmployeeId(e.target.value)} className="auth-input" placeholder="EMP-1042" /></Field>
              )}
              {mode === 'register' && (
                <Field label="Department">
                  <select value={department} onChange={(e) => setDepartment(e.target.value)} className="auth-input">
                    <option>Computer Science &amp; Engineering</option>
                    <option>Electronics &amp; Communication</option>
                    <option>Mechanical Engineering</option>
                    <option>Civil Engineering</option>
                    <option>Information Technology</option>
                    <option>Data Science &amp; AI</option>
                  </select>
                </Field>
              )}

              <Field label="Email address">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9f96]" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" className="auth-input pl-10" placeholder="you@campus.edu" />
                </div>
              </Field>

              <Field label="Password">
                <div className="relative">
                  <LockKeyhole className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9f96]" />
                  <input type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete={mode === 'login' ? 'current-password' : 'new-password'} className="auth-input px-10" placeholder={mode === 'register' ? 'Minimum 6 characters' : 'Enter your password'} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#8d9289] hover:text-[#171917]" aria-label="Toggle password visibility">
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </Field>

              {error && <div className="rounded-[8px] border border-[#efcaca] bg-[#fff7f7] px-3 py-2.5 text-[12px] text-[#9f3030]">{error}</div>}

              <button type="submit" disabled={loading} className="flex h-11 w-full items-center justify-center gap-2 rounded-[8px] bg-[#1f6a38] text-[13px] font-semibold text-white transition hover:bg-[#19552e] disabled:opacity-60">
                {loading ? 'Signing in' : mode === 'login' ? 'Sign in' : 'Create account'}
                {!loading && <ArrowRight className="h-4 w-4" />}
              </button>
            </form>

            {mode === 'login' && (
              <div className="mt-6 flex items-center gap-3">
                <span className="h-px flex-1 bg-[#e7e9e3]" />
                <button onClick={() => fillDemo('STUDENT')} className="text-[11px] font-semibold text-[#667066] hover:text-[#1f6a38]">Student demo</button>
                <span className="text-[#ccd1c8]">/</span>
                <button onClick={() => fillDemo('TEACHER')} className="text-[11px] font-semibold text-[#667066] hover:text-[#1f6a38]">Teacher demo</button>
                <span className="h-px flex-1 bg-[#e7e9e3]" />
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block text-[12px] font-semibold text-[#4d514a]">{label}<div className="mt-2">{children}</div></label>;
}
