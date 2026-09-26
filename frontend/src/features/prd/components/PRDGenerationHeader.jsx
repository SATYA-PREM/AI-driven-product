import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Zap,
} from 'lucide-react';

export default function PRDGenerationHeader({
  datasetName = 'Active Feedback Batch',
  totalInsights = 0,
  isReadyForPRD = false,
  approvedCount = 0,
  pendingCount = 0,
  isGenerating = false,
  onGeneratePRD,
}) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  const isUnanalyzed = totalInsights === 0;

  return (
    <div className="bg-gradient-to-r from-violet-900/40 via-[#0f172a] to-blue-900/30 border border-violet-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <span className="bg-violet-500/20 text-violet-300 border border-violet-500/30 text-xs px-3 py-1 rounded-full font-semibold uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-violet-400 animate-pulse" />
              CrewAI 4-Agent Pipeline
            </span>

            <span className={`text-xs px-3 py-1 rounded-full font-semibold flex items-center gap-1.5 border ${
              isUnanalyzed
                ? 'bg-rose-500/10 text-rose-300 border-rose-500/25'
                : isReadyForPRD
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
            }`}>
              {isUnanalyzed ? (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  AI Analysis Required (0 Insights)
                </>
              ) : isReadyForPRD ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  PM Review Gate Approved ({approvedCount} Approved)
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  PM Review Gate Pending ({pendingCount} Awaiting Review)
                </>
              )}
            </span>

            <span className="bg-[#111827] text-slate-300 border border-[#223048] text-xs px-3 py-1 rounded-full font-mono">
              Dataset: {datasetName}
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight">
            PRD Generator & Development Studio
          </h1>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Consolidates the PM-approved context package as one unified input across 4 specialized AI agents:
            Product Analyst, Requirements Analyst, Product Manager, and PRD Architect.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {isUnanalyzed ? (
            <button
              onClick={() => workspaceId && navigate(`/workspace/${workspaceId}/pipeline`)}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Launch AI Pipeline First
            </button>
          ) : (
            <button
              onClick={() => workspaceId && navigate(`/workspace/${workspaceId}/pm-review`)}
              className="px-4 py-2.5 rounded-xl font-semibold text-xs border border-violet-500/40 bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 flex items-center gap-2 transition-all cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Go to PM Review Page
            </button>
          )}

          <button
            onClick={onGeneratePRD}
            disabled={isGenerating || !isReadyForPRD}
            title={
              isUnanalyzed
                ? 'Run AI analysis on this batch first'
                : !isReadyForPRD
                ? 'Approve at least 1 insight on the PM Review page to generate PRD'
                : ''
            }
            className={`px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2.5 shadow-lg transition-all cursor-pointer ${
              isGenerating
                ? 'bg-violet-800 text-slate-300 cursor-not-allowed opacity-80'
                : isReadyForPRD
                ? 'bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 hover:shadow-violet-500/25 active:scale-95'
                : 'bg-slate-800 text-slate-500 border border-slate-700 cursor-not-allowed'
            }`}
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Executing 4-Agent Crew...
              </>
            ) : (
              <>
                <Zap className={`w-4 h-4 ${isReadyForPRD ? 'fill-white' : 'text-slate-500'}`} />
                {isReadyForPRD
                  ? 'Generate PRD (4 Agents)'
                  : isUnanalyzed
                  ? 'AI Analysis Required'
                  : 'Review Gate Pending'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
