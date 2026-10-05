'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';

type Mode = 'login' | 'register';
type Role = 'STUDENT' | 'TEACHER';

export default function LoginPage() {
  const router = useRouter();
  const { user, login, register } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [role, setRole] = useState<Role>('STUDENT');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [department, setDepartment] = useState('Computer Science & Engineering');

  useEffect(() => {
    if (user) {
      router.replace(user.role === 'TEACHER' ? '/teacher' : '/dashboard');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register({
          email, password, firstName, lastName, role,
          rollNumber: role === 'STUDENT' ? rollNumber : undefined,
          employeeId: role === 'TEACHER' ? employeeId : undefined,
          department,
        });
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (r: Role) => {
    setRole(r);
    if (r === 'STUDENT') {
      setEmail('alex.rivera@campus.edu');
      setPassword('password123');
    } else {
      setEmail('dr.sharma@campus.edu');
      setPassword('password123');
    }
    setMode('login');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ background: 'var(--bg-base, #0a0f1e)' }}>
      {/* Ambient background blobs */}
      <div style={{
        position: 'fixed', top: '-20%', left: '-10%', width: '500px', height: '500px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />
      <div style={{
        position: 'fixed', bottom: '-20%', right: '-10%', width: '600px', height: '600px',
        borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, transparent 70%)',
        pointerEvents: 'none'
      }} />

      <div style={{ width: '100%', maxWidth: '460px', zIndex: 1 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '12px',
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            borderRadius: '16px', padding: '12px 20px', marginBottom: '1rem'
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px'
            }}>🎓</div>
            <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.5px' }}>
              AcademiQ
            </span>
          </div>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem' }}>
            AI-Powered Academic Operating System
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.85)', backdropFilter: 'blur(20px)',
          border: '1px solid rgba(99,102,241,0.2)', borderRadius: '20px',
          padding: '2rem', boxShadow: '0 25px 50px rgba(0,0,0,0.5)'
        }}>
          {/* Tab switcher */}
          <div style={{
            display: 'flex', background: 'rgba(255,255,255,0.05)', borderRadius: '12px',
            padding: '4px', marginBottom: '1.75rem', gap: '4px'
          }}>
            {(['login', 'register'] as Mode[]).map(m => (
              <button key={m} onClick={() => { setMode(m); setError(''); }}
                style={{
                  flex: 1, padding: '8px', borderRadius: '9px', border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s',
                  background: mode === m ? 'linear-gradient(135deg, #6366f1, #8b5cf6)' : 'transparent',
                  color: mode === m ? '#fff' : '#94a3b8',
                  boxShadow: mode === m ? '0 4px 12px rgba(99,102,241,0.3)' : 'none'
                }}>
                {m === 'login' ? '🔑 Sign In' : '✨ Register'}
              </button>
            ))}
          </div>

          {/* Role selector (always visible) */}
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              I am a
            </label>
            <div style={{ display: 'flex', gap: '10px' }}>
              {(['STUDENT', 'TEACHER'] as Role[]).map(r => (
                <button key={r} type="button" onClick={() => setRole(r)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '10px', cursor: 'pointer',
                    border: `2px solid ${role === r ? '#6366f1' : 'rgba(255,255,255,0.08)'}`,
                    background: role === r ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.03)',
                    color: role === r ? '#a5b4fc' : '#64748b',
                    fontWeight: 600, fontSize: '0.875rem', transition: 'all 0.2s'
                  }}>
                  {r === 'STUDENT' ? '🧑‍🎓 Student' : '👨‍🏫 Teacher'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Register-only fields */}
            {mode === 'register' && (
              <>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>First Name</label>
                    <input value={firstName} onChange={e => setFirstName(e.target.value)}
                      placeholder="Alex" required style={inputStyle} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={labelStyle}>Last Name</label>
                    <input value={lastName} onChange={e => setLastName(e.target.value)}
                      placeholder="Rivera" required style={inputStyle} />
                  </div>
                </div>

                {role === 'STUDENT' && (
                  <div>
                    <label style={labelStyle}>Roll Number <span style={{ color: '#64748b' }}>(optional)</span></label>
                    <input value={rollNumber} onChange={e => setRollNumber(e.target.value)}
                      placeholder="e.g. CS2021001" style={inputStyle} />
                  </div>
                )}

                {role === 'TEACHER' && (
                  <div>
                    <label style={labelStyle}>Employee ID <span style={{ color: '#64748b' }}>(optional)</span></label>
                    <input value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                      placeholder="e.g. EMP-1042" style={inputStyle} />
                  </div>
                )}

                <div>
                  <label style={labelStyle}>Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)} style={{ ...inputStyle, cursor: 'pointer' }}>
                    <option>Computer Science &amp; Engineering</option>
                    <option>Electronics &amp; Communication</option>
                    <option>Mechanical Engineering</option>
                    <option>Civil Engineering</option>
                    <option>Information Technology</option>
                    <option>Data Science &amp; AI</option>
                  </select>
                </div>
              </>
            )}

            {/* Email & Password */}
            <div>
              <label style={labelStyle}>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="you@campus.edu" required style={inputStyle} autoComplete="email" />
            </div>

            <div>
              <label style={labelStyle}>Password</label>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Min. 6 characters' : '••••••••'}
                required style={inputStyle} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: '10px', padding: '10px 14px', color: '#fca5a5',
                fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                ⚠️ {error}
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={loading}
              style={{
                padding: '12px', borderRadius: '12px', border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
                background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                color: '#fff', fontWeight: 700, fontSize: '0.95rem',
                boxShadow: loading ? 'none' : '0 8px 20px rgba(99,102,241,0.35)',
                transition: 'all 0.2s', opacity: loading ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
              }}>
              {loading ? (
                <>
                  <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} />
                  {mode === 'login' ? 'Signing in...' : 'Creating account...'}
                </>
              ) : (
                mode === 'login' ? '🚀 Sign In' : '✨ Create Account'
              )}
            </button>
          </form>

          {/* Demo quick-fill */}
          <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p style={{ textAlign: 'center', fontSize: '0.75rem', color: '#475569', marginBottom: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Quick Demo Access
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => fillDemo('STUDENT')} style={demoBtn}>
                🧑‍🎓 Student Demo
              </button>
              <button onClick={() => fillDemo('TEACHER')} style={demoBtn}>
                👨‍🏫 Teacher Demo
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '0.75rem', color: '#94a3b8',
  marginBottom: '6px', fontWeight: 600
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: '10px',
  border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.05)',
  color: '#e2e8f0', fontSize: '0.9rem', outline: 'none',
  transition: 'border-color 0.2s', boxSizing: 'border-box'
};

const demoBtn: React.CSSProperties = {
  flex: 1, padding: '8px', borderRadius: '9px',
  border: '1px solid rgba(99,102,241,0.25)',
  background: 'rgba(99,102,241,0.08)', color: '#a5b4fc',
  fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600,
  transition: 'all 0.2s'
};
