import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

export default function PRDInsightAccordions({
  approvedIssues = [],
  pendingIssues = [],
  approvedCount = 0,
  pendingCount = 0,
}) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const [showApprovedDropdown, setShowApprovedDropdown] = useState(false);
  const [showPendingDropdown, setShowPendingDropdown] = useState(false);

  return (
    <div className="space-y-4 select-none">
      {/* Accordion 1: Reviewed & Approved Insights */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowApprovedDropdown(!showApprovedDropdown)}
          className="w-full p-4 bg-[#0d1527] hover:bg-[#111827] flex items-center justify-between text-left transition-colors cursor-pointer border-b border-[#1e293b]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Reviewed & Approved Insights
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs font-bold">
                  {approvedCount}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Insights explicitly approved by PM for inclusion in PRD synthesis</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <span>{showApprovedDropdown ? 'Hide Details' : 'Expand Dropdown'}</span>
            {showApprovedDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showApprovedDropdown && (
          <div className="p-5 space-y-3 bg-[#0b101b] animate-fadeIn">
            {approvedIssues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {approvedIssues.map((issue, idx) => (
                  <div key={issue.issue_id || idx} className="bg-[#111827] border border-[#223048] rounded-xl p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase">{issue.issue_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        APPROVED
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white">{issue.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{issue.problem_description}</p>
                    <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-400">
                      <span>Impact: <strong className="text-rose-400">{issue.customer_impact}</strong></span>
                      <span>Sentiment: <strong className="text-slate-300">{issue.dominant_sentiment}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-slate-400 text-xs space-y-2">
                <AlertCircle className="w-6 h-6 text-amber-400 mx-auto" />
                <p>No insights have been approved yet for this batch.</p>
                <button
                  onClick={() => workspaceId && navigate(`/workspace/${workspaceId}/pm-review`)}
                  className="text-violet-400 hover:underline font-semibold text-xs cursor-pointer"
                >
                  Go to PM Review Page to approve insights &rarr;
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Accordion 2: Pending PM Review Insights */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl overflow-hidden shadow-md">
        <button
          onClick={() => setShowPendingDropdown(!showPendingDropdown)}
          className="w-full p-4 bg-[#0d1527] hover:bg-[#111827] flex items-center justify-between text-left transition-colors cursor-pointer border-b border-[#1e293b]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                Pending PM Review Insights
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 text-xs font-bold">
                  {pendingCount}
                </span>
              </h2>
              <p className="text-xs text-slate-400">Synthesized insights currently awaiting PM evaluation and sign-off</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-xs font-medium">
            <span>{showPendingDropdown ? 'Hide Details' : 'Expand Dropdown'}</span>
            {showPendingDropdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showPendingDropdown && (
          <div className="p-5 space-y-3 bg-[#0b101b] animate-fadeIn">
            {pendingIssues.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {pendingIssues.map((issue, idx) => (
                  <div key={issue.issue_id || idx} className="bg-[#111827] border border-[#223048] rounded-xl p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">{issue.issue_id}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">
                        PENDING REVIEW
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-white">{issue.title}</h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{issue.problem_description}</p>
                    <div className="pt-2 border-t border-[#1e293b] flex items-center justify-between text-[11px] text-slate-400">
                      <span>Impact: <strong className="text-amber-400">{issue.customer_impact}</strong></span>
                      <button
                        onClick={() => workspaceId && navigate(`/workspace/${workspaceId}/pm-review`)}
                        className="text-violet-400 hover:text-violet-300 font-semibold text-[11px] flex items-center gap-1 cursor-pointer"
                      >
                        Review in PM Gate <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-slate-400 text-xs">
                All insights in this batch have been reviewed.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

