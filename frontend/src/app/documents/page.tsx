'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { fetchApi } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Upload, FileText, Brain, CheckCircle2, Clock, AlertCircle, Sparkles, File, Bot, MessageSquare } from 'lucide-react';

const statusColors: Record<string, string> = {
  PENDING: 'text-slate-400 bg-slate-400/10',
  ANALYZING: 'text-warning bg-warning/10 animate-pulse',
  ANALYZED: 'text-accent bg-accent/10',
  FAILED: 'text-danger-glow bg-danger/10',
};

const categoryIcons: Record<string, string> = {
  EXAM_RESULT: '📊',
  TIMETABLE: '📅',
  ASSIGNMENT: '📝',
  SYLLABUS: '📚',
  ANNOUNCEMENT: '📢',
  NOTES: '📋',
  OTHER: '📄',
};

export default function DocumentsPage() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [uploadResult, setUploadResult] = useState<any>(null);

  const loadDocs = useCallback(async () => {
    if (!user?.studentProfile) return;
    try {
      const res = await fetchApi('/documents');
      if (res.success) setDocuments(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadDocs(); }, [loadDocs]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setUploadResult(null);
    try {
      const formData = new FormData();
      formData.append('document', file);
      formData.append('title', file.name);

      const token = localStorage.getItem('academiq_token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/documents/upload`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const data = await res.json();

      if (data.success) {
        setUploadResult(data.data);
        await loadDocs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUpload(file);
  };

  if (loading) return (
    <div className="space-y-4">
      <div className="skeleton h-40 rounded-2xl" />
      <div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)}</div>
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-xl font-bold text-white">Document Intelligence</h1>
        <p className="text-xs text-slate-400 mt-1">Upload academic documents · Gemini analyzes and updates your academic memory</p>
      </div>

      {/* Upload Zone */}
      <div
        className={`rounded-2xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          dragOver ? 'border-primary bg-primary/10' : 'border-border/50 hover:border-primary/40 hover:bg-primary/5'
        }`}
        onDragOver={e => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={onDrop}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <input
          id="file-input"
          type="file"
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx"
          onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); }}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <Brain className="w-6 h-6 text-primary-glow animate-pulse" />
            </div>
            <p className="text-sm font-semibold text-white">Gemini is analyzing your document...</p>
            <p className="text-xs text-slate-400">Extracting structured academic information</p>
            <div className="w-48 h-1 bg-surface-elevated rounded-full overflow-hidden mt-2">
              <div className="h-full bg-primary rounded-full animate-pulse" style={{ width: '70%' }} />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
              <Upload className="w-6 h-6 text-primary-glow" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Drop your document here</p>
              <p className="text-xs text-slate-400 mt-1">or click to browse · PDF, PNG, JPG, DOCX up to 25MB</p>
            </div>
            <div className="flex gap-2 mt-1">
              {['Exam Result', 'Timetable', 'Assignment', 'Syllabus', 'Notes'].map(t => (
                <span key={t} className="text-[10px] px-2 py-1 rounded-lg bg-surface-elevated text-slate-400">{t}</span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Upload Result */}
      {uploadResult && (
        <div className="glass-card rounded-2xl p-5 border border-accent/30 bg-accent/5 animate-fade-in-up">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="w-5 h-5 text-accent" />
            <p className="text-sm font-bold text-white">Document Analyzed & Stored to Academic Memory</p>
          </div>
          {uploadResult.analysis && (
            <div className="space-y-2">
              <div className="flex gap-4 text-xs text-slate-400">
                <span>Category: <strong className="text-white">{uploadResult.analysis.extractedData?.category}</strong></span>
                <span>Confidence: <strong className="text-accent">{(uploadResult.analysis.confidenceScore * 100).toFixed(0)}%</strong></span>
              </div>
              <p className="text-sm text-slate-300">{uploadResult.analysis.summary}</p>
              {uploadResult.analysis.extractedData?.strengths?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mt-2">Strengths identified:</p>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {uploadResult.analysis.extractedData.strengths.map((s: string) => (
                      <span key={s} className="text-[11px] px-2 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              {uploadResult.analysis.extractedData?.weaknesses?.length > 0 && (
                <div>
                  <p className="text-xs text-slate-500 mt-2">Weaknesses found:</p>
                  <div className="flex gap-2 flex-wrap mt-1">
                    {uploadResult.analysis.extractedData.weaknesses.map((s: string) => (
                      <span key={s} className="text-[11px] px-2 py-1 rounded-lg bg-danger/10 text-danger-glow border border-danger/20">{s}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {uploadResult.document?.id && (
            <div className="mt-4 pt-3 border-t border-accent/20 flex items-center gap-3">
              <Link
                href={`/ai-assistant?docId=${uploadResult.document.id}`}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-primary hover:bg-primary-hover text-white transition-all shadow-glow-primary"
              >
                <Bot className="w-3.5 h-3.5" /> Ask Gemini About This Document
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Document List */}
      <div>
        <h2 className="text-sm font-semibold text-white mb-3">Your Documents ({documents.length})</h2>
        {documents.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 border border-border/40 text-center">
            <FileText className="w-10 h-10 text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-400">No documents yet. Upload your first document to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {documents.map(doc => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(selectedDoc?.id === doc.id ? null : doc)}
                className="glass-card rounded-2xl p-4 border border-border/40 hover:border-primary/30 cursor-pointer transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3">
                    <div className="text-2xl shrink-0">{categoryIcons[doc.documentCategory] || '📄'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-white truncate">{doc.title}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${statusColors[doc.status]}`}>
                          {doc.status}
                        </span>
                        <span className="text-[10px] text-slate-500">{doc.fileType.toUpperCase()}</span>
                        <span className="text-[10px] text-slate-500">{(doc.fileSize / 1024).toFixed(0)}KB</span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">{new Date(doc.createdAt).toLocaleDateString()}</p>
                    </div>
                    <Sparkles className="w-4 h-4 text-primary-glow shrink-0 opacity-50" />
                  </div>

                  {/* Expanded Analysis */}
                  {selectedDoc?.id === doc.id && doc.analysis && (
                    <div className="mt-3 pt-3 border-t border-border/30 space-y-2.5 animate-fade-in-up">
                      <p className="text-xs font-semibold text-white">AI Analysis &amp; Extracted Concepts</p>
                      <p className="text-xs text-slate-300 leading-relaxed">{doc.analysis.summary}</p>
                      {doc.analysis.extractedData?.keyTopics?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold mb-1">Key Topics:</p>
                          <div className="flex gap-1 flex-wrap">
                            {doc.analysis.extractedData.keyTopics.map((t: string) => (
                              <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary-glow border border-primary/20">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                      {doc.analysis.extractedData?.strengths?.length > 0 && (
                        <div className="flex gap-1 flex-wrap">
                          {doc.analysis.extractedData.strengths.slice(0, 3).map((s: string) => (
                            <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-accent/10 text-accent">{s}</span>
                          ))}
                        </div>
                      )}
                      {doc.analysis.extractedData?.actionItems?.length > 0 && (
                        <div>
                          <p className="text-[10px] text-slate-400 font-semibold mb-1">Action Items:</p>
                          <ul className="list-disc list-inside text-[11px] text-slate-300">
                            {doc.analysis.extractedData.actionItems.map((a: string, idx: number) => (
                              <li key={idx}>{a}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      <p className="text-[10px] text-slate-500 pt-1">Confidence: {(doc.analysis.confidenceScore * 100).toFixed(0)}% · Applied to profile: {doc.analysis.appliedToProfile ? 'Yes' : 'No'}</p>
                    </div>
                  )}
                </div>

                {/* Card footer with Chat button */}
                <div className="mt-3.5 pt-2.5 border-t border-border/30 flex items-center justify-between">
                  <Link
                    href={`/ai-assistant?docId=${doc.id}`}
                    onClick={e => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-primary/15 hover:bg-primary/25 text-primary-glow border border-primary/30 transition-all hover:shadow-glow-primary"
                  >
                    <Bot className="w-3.5 h-3.5" /> Chat with Doc
                  </Link>
                  <span className="text-[10px] text-slate-400">
                    {selectedDoc?.id === doc.id ? '▲ Less details' : '▼ Details'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
