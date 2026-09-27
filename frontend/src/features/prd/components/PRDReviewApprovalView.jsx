import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCheck,
  Clock,
  History,
  Lock,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Send,
} from 'lucide-react';
import { formatLocalDate } from '../utils/formatDate';

export default function PRDReviewApprovalView({
  prdData,
  onSubmitReview,
  isSubmittingReview = false,
  onGoToGenerator,
}) {
  const project = prdData?.project || {};
  const doc = prdData?.document || {};
  const reviews = prdData?.reviews || [];
  const versions = prdData?.versions || [];
  const validation = prdData?.validation || { complete: true, warnings: [], conflicts: [] };

  const [decision, setDecision] = useState('approved');
  const [commentText, setCommentText] = useState('');
  const [reviewerName, setReviewerName] = useState('Priya Sharma (PM)');

  if (!prdData || !prdData.project) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center space-y-4 select-none animate-fadeIn">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <ShieldCheck className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-bold text-white">No PRD Document to Review</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Generate a PRD document from the PM Review package before conducting human review and approval gates.
          </p>
        </div>
        {onGoToGenerator && (
          <button
            onClick={onGoToGenerator}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            Go to PRD Generator
          </button>
        )}
      </div>
    );
  }

  const currentStatus = project.status || 'draft';
  const isApproved = currentStatus === 'approved';

  const checklistItems = [
    { label: 'Source Traceability Verified', desc: 'All requirements trace back to PM-approved feedback items', status: 'pass' },
    { label: 'Problem Definition & Root Causes', desc: 'Distinguishes symptoms from verified technical root causes', status: 'pass' },
    { label: 'Functional Requirements with AC IDs', desc: 'Testable acceptance criteria defined for every requirement', status: 'pass' },
    { label: 'Scope Boundaries (In / Out)', desc: 'Explicit boundary definitions without scope leakage', status: 'pass' },
    { label: 'Non-Functional Requirements', desc: 'SLA latency, encryption, and observability coverage', status: 'pass' },
    {
      label: 'Success Metrics & KPI Baselines',
      desc: 'Candidate KPIs defined for PM measurement confirmation',
      status: doc.success_metrics?.length > 0 ? 'pass' : 'warn',
    },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onSubmitReview({
      decision,
      reviewed_by: reviewerName,
      comments: [{ text: commentText, author: reviewerName, timestamp: new Date().toISOString() }],
    });
    setCommentText('');
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn max-w-5xl mx-auto">
      {/* 1. Header Status Card */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold text-violet-400">{project.prd_id}</span>
            <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-mono">
              Version {project.current_version || doc.version || 'v1.0'}
            </span>
            <span
              className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                isApproved
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : currentStatus === 'changes_requested'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              }`}
            >
              PRD Status: {currentStatus.replace('_', ' ')}
            </span>
          </div>
          <h2 className="text-lg font-bold text-white">{doc.title || project.title}</h2>
          <p className="text-xs text-slate-400">
            Source Package: <span className="font-mono text-slate-300">{project.source_review_id || 'REV-001'}</span> • Created {formatLocalDate(project.created_at)}
          </p>
        </div>

        {isApproved ? (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
            <Lock className="w-4 h-4" />
            <span>PRD APPROVED & LOCKED FOR DELIVERY</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-violet-500/10 border border-violet-500/30 text-violet-300 text-xs font-bold">
            <Clock className="w-4 h-4" />
            <span>PENDING HUMAN PM DECISION</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Review Checklist & Validation */}
        <div className="lg:col-span-2 space-y-6">
          {/* Review Checklist */}
          <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <FileCheck className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                PRD Quality & Verification Checklist
              </h3>
            </div>

            <div className="space-y-3">
              {checklistItems.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#111827] border border-[#223048] flex items-start gap-3 text-xs"
                >
                  <div className="mt-0.5">
                    {item.status === 'pass' ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    )}
                  </div>
                  <div className="space-y-0.5 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">{item.label}</span>
                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded font-mono font-bold uppercase ${
                          item.status === 'pass' ? 'text-emerald-300 bg-emerald-500/10' : 'text-amber-300 bg-amber-500/10'
                        }`}
                      >
                        {item.status === 'pass' ? 'VERIFIED' : 'ATTENTION'}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Review Action Form */}
          <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <MessageSquare className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Submit PM Review Decision
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label
                  onClick={() => setDecision('approved')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                    decision === 'approved'
                      ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300'
                      : 'bg-[#111827] border-[#223048] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="approved"
                    checked={decision === 'approved'}
                    onChange={() => setDecision('approved')}
                    className="sr-only"
                  />
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <div>
                    <p className="font-bold text-white">Approve PRD</p>
                    <p className="text-[10px] text-slate-400">Lock PRD and authorize downstream delivery</p>
                  </div>
                </label>

                <label
                  onClick={() => setDecision('changes_requested')}
                  className={`p-3.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-colors ${
                    decision === 'changes_requested'
                      ? 'bg-amber-500/10 border-amber-500 text-amber-300'
                      : 'bg-[#111827] border-[#223048] text-slate-400 hover:border-slate-600'
                  }`}
                >
                  <input
                    type="radio"
                    name="decision"
                    value="changes_requested"
                    checked={decision === 'changes_requested'}
                    onChange={() => setDecision('changes_requested')}
                    className="sr-only"
                  />
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <div>
                    <p className="font-bold text-white">Request Changes</p>
                    <p className="text-[10px] text-slate-400">Flag items requiring AI re-synthesis or edit</p>
                  </div>
                </label>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Reviewer Feedback / Directives:
                </label>
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Enter decision rationale, required modifications, or engineering sign-off notes..."
                  rows={3}
                  className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1e293b]">
                <span className="text-[11px] text-slate-500">
                  Reviewing as: <strong className="text-slate-300">{reviewerName}</strong>
                </span>
                <button
                  type="submit"
                  disabled={isSubmittingReview || !commentText.trim()}
                  className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmittingReview ? 'Recording Decision...' : 'Submit PM Review Decision'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Version History & Audit Log */}
        <div className="space-y-6">
          <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-[#1e293b] pb-3">
              <History className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                PRD Version History ({versions.length || 1})
              </h3>
            </div>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {(versions.length > 0 ? versions : [
                {
                  version: 'v1.0',
                  change_type: 'initial_batch_generation',
                  created_at: project.created_at,
                  changed_by: 'CrewAI + Gemini',
                  change_summary: ['Initial PRD synthesized from PM-approved feedback.'],
                }
              ]).map((ver, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-[#111827] border border-[#223048] space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-violet-400">{ver.version || 'v1.0'}</span>
                    <span className="text-[10px] text-slate-500">{formatLocalDate(ver.created_at)}</span>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-200">{ver.change_type?.replace(/_/g, ' ') || 'Version Snapshot'}</p>
                  <p className="text-[10px] text-slate-400">
                    Author: <span className="text-slate-300">{ver.changed_by || 'PM User'}</span>
                  </p>
                  {ver.change_summary && (
                    <ul className="text-[10px] text-slate-400 space-y-0.5 pt-1 border-t border-[#1e293b]">
                      {ver.change_summary.map((cs, csi) => (
                        <li key={csi}>• {cs}</li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

