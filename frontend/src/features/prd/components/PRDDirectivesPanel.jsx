import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';

export default function PRDDirectivesPanel({
  contextPreview,
  isReadyForPRD = false,
  totalEvidence = 0,
  pmComments = '',
  setPmComments,
}) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const isUnanalyzed = contextPreview?.total_insights_count === 0;

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">PM Review Gate Directives</h2>
            <p className="text-xs text-slate-400">Strategic notes and PM guidance passed to the 4-agent crew</p>
          </div>
        </div>
        <button
          onClick={() => workspaceId && navigate(`/workspace/${workspaceId}/pm-review`)}
          className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Review Gate Controls</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
        <div className="bg-[#111827] border border-[#223048] rounded-xl p-3.5 space-y-1">
          <span className="text-slate-500 font-medium">Reviewed By</span>
          <p className="text-slate-200 font-semibold">{contextPreview?.reviewed_by || 'PM Reviewer'}</p>
        </div>
        <div className="bg-[#111827] border border-[#223048] rounded-xl p-3.5 space-y-1">
          <span className="text-slate-500 font-medium">Review Gate Status</span>
          <p className={`font-semibold uppercase flex items-center gap-1 ${
            isUnanalyzed
              ? 'text-slate-400'
              : isReadyForPRD
              ? 'text-emerald-400'
              : 'text-amber-400'
          }`}>
            {isUnanalyzed ? (
              <>
                <AlertTriangle className="w-3.5 h-3.5 text-slate-500" /> AWAITING AI ANALYSIS
              </>
            ) : isReadyForPRD ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" /> APPROVED
              </>
            ) : (
              <>
                <AlertTriangle className="w-3.5 h-3.5" /> PENDING REVIEW
              </>
            )}
          </p>
        </div>
        <div className="bg-[#111827] border border-[#223048] rounded-xl p-3.5 space-y-1">
          <span className="text-slate-500 font-medium">Customer Evidence Count</span>
          <p className="text-violet-400 font-semibold">{totalEvidence} customer records</p>
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
          <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
          PM Strategic Guidance / Directive Comments:
        </label>
        <textarea
          value={pmComments}
          onChange={(e) => setPmComments && setPmComments(e.target.value)}
          placeholder="E.g., Focus on enterprise customer friction, authentication attribution, and login performance."
          rows={2}
          className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500 transition-colors"
        />
      </div>
    </div>
  );
}
