'use client';

import React, { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Users, Brain, Sparkles, Search, Send, CheckCircle2, Clock, Zap, Github, Star } from 'lucide-react';

const PROFICIENCY_COLORS: Record<string, string> = {
  BEGINNER: 'bg-slate-500/20 text-slate-400',
  INTERMEDIATE: 'bg-primary/20 text-primary-glow',
  ADVANCED: 'bg-accent/20 text-accent',
  EXPERT: 'bg-warning/20 text-warning',
};

function StudentCard({ student, onRequest }: { student: any; onRequest: (id: string, name: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="glass-card rounded-2xl border border-border/40 hover:border-primary/30 transition-all p-4">
      <div className="flex items-start gap-3">
        <img
          src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`}
          alt={student.name}
          className="w-10 h-10 rounded-full bg-surface-elevated ring-2 ring-primary/20 shrink-0"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-white">{student.name}</p>
              {student.matchPercentage && (
                <p className="text-xs text-accent font-bold">Match: {student.matchPercentage}%</p>
              )}
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-400">
              <Clock className="w-3 h-3" /> {student.availabilityHoursWeekly}h/wk
            </div>
          </div>
          <p className="text-[11px] text-slate-400">{student.department} · Sem {student.semester}</p>
          {student.bio && <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{student.bio}</p>}
        </div>
      </div>

      {/* Skills */}
      <div className="flex gap-1.5 flex-wrap mt-3">
        {student.skills?.slice(0, 4).map((sk: any) => (
          <span key={sk.name} className={`text-[10px] px-2 py-0.5 rounded-lg font-medium ${PROFICIENCY_COLORS[sk.proficiency] || PROFICIENCY_COLORS.INTERMEDIATE}`}>
            {sk.name}
          </span>
        ))}
        {student.skills?.length > 4 && <span className="text-[10px] text-slate-500">+{student.skills.length - 4}</span>}
      </div>

      {student.matchedSkills && student.matchedSkills.length > 0 && (
        <div className="mt-2 flex items-center gap-1.5 flex-wrap">
          <Zap className="w-3 h-3 text-warning shrink-0" />
          {student.matchedSkills.map((s: string) => (
            <span key={s} className="text-[10px] bg-warning/10 text-warning px-1.5 py-0.5 rounded">{s}</span>
          ))}
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={() => onRequest(student.studentId || student.id, student.name)}
          className="flex-1 text-xs font-semibold py-2 rounded-xl bg-primary/15 hover:bg-primary/25 text-primary-glow border border-primary/20 transition-all"
        >
          Send Request
        </button>
        {student.githubUrl && (
          <a href={student.githubUrl} target="_blank" rel="noreferrer" className="p-2 rounded-xl bg-surface-elevated hover:bg-primary/10 text-slate-400 hover:text-white transition-all">
            <Github className="w-3.5 h-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

export default function CollaborationPage() {
  const { user } = useAuth();
  const [students, setStudents] = useState<any[]>([]);
  const [teamMatches, setTeamMatches] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);
  const [skillFilter, setSkillFilter] = useState('');
  const [concept, setConcept] = useState('');
  const [requestModal, setRequestModal] = useState<{ id: string; name: string } | null>(null);
  const [requestMsg, setRequestMsg] = useState('');
  const [requests, setRequests] = useState<any>(null);

  useEffect(() => {
    loadStudents();
    loadRequests();
  }, []);

  const loadStudents = async (skill = '') => {
    setLoading(true);
    try {
      const params = skill ? `?skill=${encodeURIComponent(skill)}` : '';
      const res = await fetchApi(`/collaboration/students${params}`);
      if (res.success) setStudents(res.data);
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const loadRequests = async () => {
    try {
      const res = await fetchApi('/collaboration/requests');
      if (res.success) setRequests(res.data);
    } catch (err) { console.error(err); }
  };

  const matchTeam = async () => {
    if (!concept.trim()) return;
    setMatching(true);
    try {
      const res = await fetchApi('/ai/match-team', {
        method: 'POST',
        body: JSON.stringify({ concept })
      });
      if (res.success) setTeamMatches(res.data);
    } catch (err) { console.error(err); } finally { setMatching(false); }
  };

  const sendRequest = async () => {
    if (!requestModal || !requestMsg.trim()) return;
    try {
      await fetchApi('/collaboration/request', {
        method: 'POST',
        body: JSON.stringify({ receiverId: requestModal.id, message: requestMsg })
      });
      setRequestModal(null);
      setRequestMsg('');
      await loadRequests();
    } catch (err) { console.error(err); }
  };

  const respondRequest = async (id: string, status: string) => {
    try {
      await fetchApi(`/collaboration/request/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
      await loadRequests();
    } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-white">AI Team Matcher</h1>
        <p className="text-xs text-slate-400 mt-1">Find collaborators with complementary skills · AI-powered matching</p>
      </div>

      {/* AI Team Matcher */}
      <div className="glass-card rounded-2xl p-5 border border-primary/20 bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-primary-glow" />
          <h2 className="text-sm font-bold text-white">AI Project Team Matcher</h2>
          <span className="text-[10px] bg-primary/20 text-primary-glow px-2 py-0.5 rounded-full border border-primary/30">Gemini Powered</span>
        </div>
        <div className="flex gap-3">
          <input
            value={concept}
            onChange={e => setConcept(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && matchTeam()}
            placeholder="Describe your project idea (e.g. AI crop disease detection)"
            className="flex-1 bg-surface-elevated/80 text-white text-sm placeholder-slate-500 rounded-xl px-4 py-3 border border-border/40 focus:border-primary/50 outline-none"
          />
          <button
            onClick={matchTeam}
            disabled={matching || !concept.trim()}
            className="px-5 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-hover disabled:opacity-50 transition-all shadow-glow-primary"
          >
            {matching ? 'Matching...' : 'Find Team'}
          </button>
        </div>

        {/* Match Results */}
        {teamMatches && (
          <div className="mt-4 animate-fade-in-up">
            <p className="text-xs text-slate-400 mb-3">
              Required skills: {teamMatches.derivedSkills.join(' · ')}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {teamMatches.recommendedTeam?.map((student: any, idx: number) => (
                <div key={student.studentId} className="glass-card rounded-xl p-3 border border-primary/20">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <img src={student.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${student.name}`} alt="" className="w-9 h-9 rounded-full bg-surface-elevated" />
                      <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-white">
                        #{idx + 1}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white">{student.name}</p>
                      <p className="text-[11px] text-accent font-bold">{student.matchPercentage}% match</p>
                    </div>
                    <button
                      onClick={() => setRequestModal({ id: student.studentId, name: student.name })}
                      className="text-[10px] bg-primary/20 text-primary-glow px-2 py-1 rounded-lg hover:bg-primary/30 transition-all"
                    >
                      Invite
                    </button>
                  </div>
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {student.matchedSkills.map((s: string) => (
                      <span key={s} className="text-[10px] bg-accent/10 text-accent px-1.5 py-0.5 rounded">{s}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Pending Requests */}
      {requests?.received?.filter((r: any) => r.status === 'PENDING').length > 0 && (
        <div className="glass-card rounded-2xl p-4 border border-warning/20 bg-warning/5">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Users className="w-4 h-4 text-warning" /> Collaboration Requests ({requests.received.filter((r: any) => r.status === 'PENDING').length})
          </h3>
          {requests.received.filter((r: any) => r.status === 'PENDING').map((req: any) => (
            <div key={req.id} className="flex items-center gap-3 p-3 bg-surface-elevated/50 rounded-xl mb-2">
              <img src={req.sender.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.sender.user.firstName}`} alt="" className="w-8 h-8 rounded-full" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white">{req.sender.user.firstName} {req.sender.user.lastName}</p>
                <p className="text-[11px] text-slate-400 truncate">{req.message}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => respondRequest(req.id, 'ACCEPTED')} className="text-[10px] bg-accent/20 text-accent px-2.5 py-1.5 rounded-lg hover:bg-accent/30">Accept</button>
                <button onClick={() => respondRequest(req.id, 'REJECTED')} className="text-[10px] bg-danger/20 text-danger-glow px-2.5 py-1.5 rounded-lg hover:bg-danger/30">Decline</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Browse Students */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-white">Browse Collaborators</h2>
          <div className="flex gap-2">
            <input
              value={skillFilter}
              onChange={e => setSkillFilter(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && loadStudents(skillFilter)}
              placeholder="Filter by skill..."
              className="bg-surface-elevated text-white text-xs placeholder-slate-500 rounded-xl px-3 py-2 border border-border/40 focus:border-primary/50 outline-none w-36"
            />
            <button onClick={() => loadStudents(skillFilter)} className="p-2 rounded-xl bg-surface-elevated hover:bg-primary/20 text-slate-400 hover:text-primary-glow transition-all">
              <Search className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => <div key={i} className="skeleton h-40 rounded-2xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map(s => (
              <StudentCard key={s.id} student={s} onRequest={(id, name) => setRequestModal({ id, name })} />
            ))}
          </div>
        )}
      </div>

      {/* Request Modal */}
      {requestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-panel rounded-2xl p-6 border border-border/60 w-full max-w-md animate-fade-in-up">
            <h3 className="text-sm font-bold text-white mb-1">Collaborate with {requestModal.name}</h3>
            <p className="text-xs text-slate-400 mb-4">Write a message explaining why you want to collaborate</p>
            <textarea
              value={requestMsg}
              onChange={e => setRequestMsg(e.target.value)}
              placeholder="Hi! I'd like to collaborate with you on..."
              rows={4}
              className="w-full bg-surface-elevated text-white text-sm placeholder-slate-500 rounded-xl px-4 py-3 border border-border/40 focus:border-primary/50 outline-none resize-none mb-3"
            />
            <div className="flex gap-2">
              <button onClick={() => setRequestModal(null)} className="flex-1 py-2 rounded-xl text-sm text-slate-400 bg-surface-elevated hover:text-white transition-all">Cancel</button>
              <button onClick={sendRequest} disabled={!requestMsg.trim()} className="flex-1 py-2 rounded-xl bg-primary text-white text-sm font-semibold disabled:opacity-50 transition-all">Send Request</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
