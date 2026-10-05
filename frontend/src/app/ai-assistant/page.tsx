'use client';

import React, { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Sparkles, Send, Clock, Zap, Bot, User, Plus, Brain, AlertCircle, CheckCircle2, FileText, Layers, RefreshCw, Trash2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  executedAction?: any;
  contextUsed?: any;
  timestamp: Date;
}

const BASE_SUGGESTED_PROMPTS = [
  { icon: '📄', text: 'Analyze my uploaded notes', prompt: 'Analyze my uploaded document and summarize the core concepts, formulas, and key takeaways.' },
  { icon: '📊', text: 'Analyze my latest exam result', prompt: "Analyze my latest exam results and tell me where I'm struggling." },
  { icon: '📅', text: 'Make a comprehensive study plan', prompt: 'Based on my exam results, upcoming deadlines, and uploaded documents, create a detailed study plan for this week.' },
  { icon: '⏱️', text: 'I have 1 hour free', prompt: 'I have 1 hour free right now. What should I study based on my vulnerabilities?' },
  { icon: '🎯', text: 'What to focus on this week', prompt: 'What should I prioritize and focus on this week based on my academic state?' },
  { icon: '⚠️', text: 'Explain my weakest subject', prompt: 'Why am I struggling in my weakest subject and how can I improve?' },
];

function parseMarkdown(text: string) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/###\s*(.*)/g, '<h3 class="text-base font-bold text-white mt-3 mb-1">$1</h3>')
    .replace(/##\s*(.*)/g, '<h2 class="text-lg font-bold text-white mt-4 mb-2">$1</h2>')
    .replace(/^- (.*)/gm, '<li class="ml-4 list-disc text-slate-300 text-sm leading-relaxed">$1</li>')
    .replace(/\n/g, '<br />');
}

function AiAssistantContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const initialDocId = searchParams.get('docId') || '';

  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDocId, setSelectedDocId] = useState<string>(initialDocId);
  const [docsLoading, setDocsLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  const welcomeMsg: Message = {
    id: 'welcome',
    role: 'model',
    content: `Hello ${user?.firstName || 'there'}! 👋 I'm your **Academic Operating System AI**, powered by Gemini.\n\nI have real-time access to your academic state: attendance records, exam results, assignments, timetables, and **all your uploaded notes & documents**.\n\nAsk me questions directly about your uploaded files, syllabus, or academic goals!`,
    timestamp: new Date()
  };

  const [messages, setMessages] = useState<Message[]>([welcomeMsg]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [minutes, setMinutes] = useState(60);
  const [showOneHour, setShowOneHour] = useState(false);
  const [oneHourResult, setOneHourResult] = useState<any>(null);
  const [oneHourLoading, setOneHourLoading] = useState(false);
  const [clearingHistory, setClearingHistory] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load student documents to populate context selector
  const loadDocuments = async () => {
    try {
      setDocsLoading(true);
      const res = await fetchApi('/documents');
      if (res.success && res.data) {
        setDocuments(res.data);
        if (initialDocId && res.data.some((d: any) => d.id === initialDocId)) {
          setSelectedDocId(initialDocId);
        }
      }
    } catch (err) {
      console.error('Failed to load documents for AI context:', err);
    } finally {
      setDocsLoading(false);
    }
  };

  // Load persisted chat history from backend
  const loadHistory = async () => {
    try {
      setHistoryLoading(true);
      const res = await fetchApi('/ai/history');
      if (res.success && res.data && res.data.length > 0) {
        const historicMsgs: Message[] = res.data.map((m: any) => ({
          id: m.id,
          role: m.role as 'user' | 'model',
          content: m.content,
          executedAction: m.executedAction,
          contextUsed: m.contextUsed,
          timestamp: new Date(m.createdAt)
        }));
        setMessages([welcomeMsg, ...historicMsgs]);
      }
    } catch (err) {
      console.error('Failed to load chat history:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Clear your entire chat history?')) return;
    try {
      setClearingHistory(true);
      await fetchApi('/ai/history', { method: 'DELETE' });
      setMessages([welcomeMsg]);
    } catch (err) {
      console.error('Failed to clear history:', err);
    } finally {
      setClearingHistory(false);
    }
  };

  useEffect(() => {
    loadDocuments();
    loadHistory();
  }, []);

  useEffect(() => {
    if (initialDocId) {
      setSelectedDocId(initialDocId);
    }
  }, [initialDocId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const focusedDoc = documents.find(d => d.id === selectedDocId);


  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages
        .filter(m => m.id !== 'welcome')
        .map(m => ({ role: m.role, parts: m.content }));

      const res = await fetchApi('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: text,
          history,
          documentId: selectedDocId || undefined
        })
      });

      if (res.success) {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: res.data.reply,
          executedAction: res.data.executedAction,
          contextUsed: res.data.contextUsed,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: 'Sorry, I encountered an error while consulting Gemini. Please try again.',
        timestamp: new Date()
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleOneHour = async () => {
    setOneHourLoading(true);
    try {
      const res = await fetchApi('/ai/one-hour', {
        method: 'POST',
        body: JSON.stringify({ minutes })
      });
      if (res.success) setOneHourResult(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setOneHourLoading(false);
    }
  };

  const createQuickTask = async (title: string) => {
    try {
      const res = await fetchApi('/tasks', {
        method: 'POST',
        body: JSON.stringify({
          title,
          category: 'STUDY',
          priority: 'HIGH',
          estimatedMinutes: 45
        })
      });
      if (res.success) {
        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            role: 'model',
            content: `✅ Task **"${title}"** has been added directly to your Academic Priorities planner.`,
            timestamp: new Date()
          }
        ]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-120px)] max-h-[850px]">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 border border-border/40 mb-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary to-accent flex items-center justify-center shadow-glow-primary">
            <Sparkles className="w-5 h-5 text-white animate-pulse-subtle" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white">Academic AI Assistant</h1>
            <p className="text-[11px] text-slate-400">Gemini 3.6 Flash · Grounded in persistent academic memory</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={clearHistory}
            disabled={clearingHistory || messages.length <= 1}
            title="Clear chat history"
            className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-surface-elevated/60 hover:bg-danger/10 hover:text-danger border border-border/40 hover:border-danger/30 px-3 py-2 rounded-xl transition-all disabled:opacity-40"
          >
            <Trash2 className="w-3.5 h-3.5" /> Clear History
          </button>
          <button
            onClick={() => setShowOneHour(!showOneHour)}
            className="flex items-center gap-1.5 text-xs font-semibold text-warning bg-warning/10 hover:bg-warning/20 border border-warning/20 px-3 py-2 rounded-xl transition-all"
          >
            <Clock className="w-3.5 h-3.5" /> I Have Free Time
          </button>
        </div>
      </div>

      {/* Active Document & Academic Memory Selector Bar */}
      <div className="glass-panel rounded-2xl px-4 py-2.5 border border-border/50 mb-3 flex items-center justify-between gap-3 text-xs shrink-0 flex-wrap shadow-sm">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-primary-glow shrink-0" />
          <span className="font-semibold text-white">Active Gemini Context:</span>
          <span className="text-slate-400 hidden md:inline">Live Profile +</span>
        </div>

        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedDocId}
            onChange={e => setSelectedDocId(e.target.value)}
            className="bg-surface-elevated text-slate-200 border border-border/50 rounded-xl px-3 py-1.5 text-xs outline-none focus:border-primary/50 cursor-pointer max-w-[240px] sm:max-w-xs truncate"
          >
            <option value="">All Uploaded Documents ({documents.length})</option>
            {documents.map(d => (
              <option key={d.id} value={d.id}>
                Focus: {d.title} ({d.fileType.toUpperCase()})
              </option>
            ))}
          </select>
          {selectedDocId && (
            <button
              onClick={() => setSelectedDocId('')}
              className="text-[11px] text-primary-glow hover:underline ml-1 font-medium"
            >
              Reset to All
            </button>
          )}
        </div>
      </div>

      {/* Focused Document Notification Banner */}
      {focusedDoc && (
        <div className="glass-card rounded-xl px-4 py-2 border border-primary/30 bg-primary/5 mb-3 flex items-center justify-between text-xs animate-fade-in-up shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-base">📄</span>
            <div>
              <span className="font-semibold text-white">Primary Document Focus:</span>{' '}
              <span className="text-primary-glow font-medium">{focusedDoc.title}</span>
              {focusedDoc.analysis?.summary && (
                <span className="text-slate-400 hidden lg:inline"> — {focusedDoc.analysis.summary.slice(0, 90)}...</span>
              )}
            </div>
          </div>
          <button
            onClick={() => sendMessage(`What are the key concepts and action points in "${focusedDoc.title}"?`)}
            className="text-[11px] font-semibold text-primary-glow hover:underline shrink-0"
          >
            Ask summary ➔
          </button>
        </div>
      )}

      {/* One Hour Panel */}
      {showOneHour && (
        <div className="glass-card rounded-2xl p-5 border border-warning/20 bg-warning/5 mb-4 shrink-0 animate-fade-in-up">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2"><Zap className="w-4 h-4 text-warning" /> ⏱ What can I do right now?</h3>
          <div className="flex items-center gap-3 mb-4">
            <label className="text-xs text-slate-400">Available time:</label>
            {[30, 45, 60, 90, 120].map(m => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={`text-xs px-2.5 py-1 rounded-lg font-semibold transition-all ${minutes === m ? 'bg-warning text-black' : 'bg-surface-elevated text-slate-300 hover:text-white'}`}
              >
                {m}m
              </button>
            ))}
          </div>
          <button
            onClick={handleOneHour}
            disabled={oneHourLoading}
            className="w-full py-2 rounded-xl bg-warning text-black text-sm font-bold hover:bg-warning-glow transition-all disabled:opacity-50"
          >
            {oneHourLoading ? 'AI is planning your session...' : 'Generate Optimal Study Session'}
          </button>

          {oneHourResult && (
            <div className="mt-4 space-y-3">
              <h4 className="text-sm font-semibold text-white">{oneHourResult.sessionTitle}</h4>
              <p className="text-xs text-slate-400">{oneHourResult.rationale}</p>
              <div className="space-y-2">
                {oneHourResult.breakdown?.map((b: any, i: number) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-surface-elevated/60 rounded-xl">
                    <span className="text-xs font-bold text-warning w-10 shrink-0">{b.durationMinutes}m</span>
                    <div>
                      <p className="text-xs font-semibold text-white">{b.title}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">{b.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              {oneHourResult.createdTaskId && (
                <div className="flex items-center gap-2 text-xs text-accent">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Task created and added to your planner!
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Suggested Prompts */}
      {messages.length <= 1 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-3 shrink-0">
          {BASE_SUGGESTED_PROMPTS.map((p, i) => (
            <button
              key={i}
              onClick={() => sendMessage(p.prompt)}
              className="glass-card rounded-xl p-3 border border-border/40 hover:border-primary/30 text-left transition-all hover:-translate-y-0.5"
            >
              <span className="text-base">{p.icon}</span>
              <p className="text-[11px] text-slate-300 mt-1 font-medium">{p.text}</p>
            </button>
          ))}
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 pr-1 mb-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-3 animate-fade-in-up ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-primary/20 border border-primary/30' : 'bg-gradient-to-tr from-primary to-accent shadow-glow-primary'}`}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-primary-glow" /> : <Bot className="w-4 h-4 text-white" />}
            </div>
            <div className={`max-w-[80%] rounded-2xl p-4 ${msg.role === 'user' ? 'bg-primary/15 border border-primary/20 rounded-tr-sm' : 'glass-card border border-border/40 rounded-tl-sm'}`}>
              <div
                className="text-sm text-slate-200 leading-relaxed prose-custom"
                dangerouslySetInnerHTML={{ __html: parseMarkdown(msg.content) }}
              />
              {msg.executedAction && (
                <div className="mt-3 flex items-center gap-2 text-[11px] text-accent bg-accent/10 rounded-lg px-3 py-2 border border-accent/20">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  Action executed: {msg.executedAction.title || JSON.stringify(msg.executedAction)}
                </div>
              )}
              {msg.contextUsed && (
                <div className="mt-2.5 pt-2 border-t border-border/20 flex items-center gap-3 text-[10px] text-slate-500 flex-wrap">
                  <span>Attendance: <strong>{msg.contextUsed.overallAttendance}%</strong></span>
                  {msg.contextUsed.atRiskCourses?.length > 0 && (
                    <span className="text-warning font-medium">⚠ At-risk: {msg.contextUsed.atRiskCourses.join(', ')}</span>
                  )}
                  {msg.contextUsed.focusedDocument && (
                    <span className="text-accent flex items-center gap-1 font-semibold">
                      <FileText className="w-3 h-3" /> Grounded on: {msg.contextUsed.focusedDocument.title}
                    </span>
                  )}
                  {msg.contextUsed.documentsCount > 0 && !msg.contextUsed.focusedDocument && (
                    <span className="text-slate-400">
                      📄 {msg.contextUsed.documentsCount} documents in context
                    </span>
                  )}
                </div>
              )}

              {msg.role === 'model' && msg.id !== 'welcome' && (
                <div className="mt-3 pt-2.5 border-t border-border/30 flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => createQuickTask('Practice DBMS Normalization (3NF & BCNF)')}
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary-glow border border-primary/30 transition-all flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Task to Planner
                  </button>
                  <a
                    href="/dashboard"
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-warning/20 hover:bg-warning/30 text-warning border border-warning/30 transition-all flex items-center gap-1"
                  >
                    <Clock className="w-3 h-3" /> Start Sprint
                  </a>
                  <a
                    href="/collaboration"
                    className="text-[10px] font-semibold px-2.5 py-1 rounded-lg bg-accent/20 hover:bg-accent/30 text-accent border border-accent/30 transition-all flex items-center gap-1"
                  >
                    <Zap className="w-3 h-3" /> Team Matcher
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-accent flex items-center justify-center shrink-0 shadow-glow-primary">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="glass-card rounded-2xl rounded-tl-sm border border-border/40 p-4">
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-2 h-2 rounded-full bg-primary-glow animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
                  ))}
                </div>
                <span className="text-xs text-slate-400 ml-2">Gemini is reasoning over your academic context and documents...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="glass-card rounded-2xl border border-border/40 p-2 flex items-end gap-2 shrink-0 shadow-lg">
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
          placeholder={selectedDocId ? `Ask Gemini anything about "${focusedDoc?.title || 'focused document'}"...` : "Ask anything about your academics, courses, or uploaded documents..."}
          rows={2}
          className="flex-1 bg-transparent resize-none text-sm text-slate-200 placeholder-slate-500 outline-none p-2 max-h-32"
        />
        <button
          onClick={() => sendMessage(input)}
          disabled={!input.trim() || loading}
          className="p-3 rounded-xl bg-primary hover:bg-primary-hover text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-glow-primary shrink-0"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function AiAssistantPage() {
  return (
    <Suspense fallback={
      <div className="space-y-4">
        <div className="skeleton h-16 rounded-2xl" />
        <div className="skeleton h-96 rounded-2xl" />
      </div>
    }>
      <AiAssistantContent />
    </Suspense>
  );
}
