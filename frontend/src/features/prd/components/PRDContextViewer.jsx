import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Zap,
} from 'lucide-react';

import PRDGenerationHeader from './PRDGenerationHeader';
import PRDBatchStatusCards from './PRDBatchStatusCards';
import PRDDirectivesPanel from './PRDDirectivesPanel';
import PRDInsightAccordions from './PRDInsightAccordions';
import PRDMultiAgentPipelineViewer from './PRDMultiAgentPipelineViewer';
import PRDTraceabilityViewer from './PRDTraceabilityViewer';
import PRDConflictValidationPanel from './PRDConflictValidationPanel';

export default function PRDContextViewer({
  contextPreview,
  isLoadingContext,
  isGenerating,
  onGeneratePRD,
  pmComments,
  setPmComments,
}) {
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  if (isLoadingContext) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center text-slate-400 space-y-4 select-none">
        <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm font-medium">Assembling Batch PM Review Context from MongoDB...</p>
      </div>
    );
  }

  const approvedIssues = contextPreview?.approved_issues || [];
  const pendingIssues = contextPreview?.pending_issues || [];
  const totalEvidence = contextPreview?.total_evidence_count || 0;
  
  const totalInsights = contextPreview?.total_insights_count ?? (approvedIssues.length + pendingIssues.length);
  const approvedCount = contextPreview?.approved_issues_count ?? approvedIssues.length;
  const pendingCount = contextPreview?.pending_issues_count ?? pendingIssues.length;
  const rejectedCount = contextPreview?.rejected_issues_count ?? 0;
  const datasetName = contextPreview?.dataset_name || 'Active Feedback Batch';

  const isReadyForPRD = approvedCount > 0 && contextPreview?.ready_for_generation;
  const aiRun = contextPreview?.ai_generation_run || null;
  const traceability = contextPreview?.traceability || [];
  const validation = contextPreview?.validation || null;

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* 1. Header Banner & Action Bar */}
      <PRDGenerationHeader
        datasetName={datasetName}
        totalInsights={totalInsights}
        isReadyForPRD={isReadyForPRD}
        approvedCount={approvedCount}
        pendingCount={pendingCount}
        isGenerating={isGenerating}
        onGeneratePRD={onGeneratePRD}
      />

      {/* 2. Batch Review Status KPIs */}
      <PRDBatchStatusCards
        totalInsights={totalInsights}
        approvedCount={approvedCount}
        pendingCount={pendingCount}
        rejectedCount={rejectedCount}
        datasetName={datasetName}
      />

      {/* 3. CrewAI 4-Agent Pipeline Overview */}
      <PRDMultiAgentPipelineViewer aiRun={aiRun} />

      {/* 4. PM Review Gate Directives & Guidance */}
      <PRDDirectivesPanel
        contextPreview={contextPreview}
        isReadyForPRD={isReadyForPRD}
        totalEvidence={totalEvidence}
        pmComments={pmComments}
        setPmComments={setPmComments}
      />

      {/* 5. Dropdown Accordions for Approved vs Pending Insights */}
      <PRDInsightAccordions
        approvedIssues={approvedIssues}
        pendingIssues={pendingIssues}
        approvedCount={approvedCount}
        pendingCount={pendingCount}
      />

      {/* 6. Traceability Matrix (if available post-generation) */}
      {traceability && traceability.length > 0 && (
        <PRDTraceabilityViewer traceability={traceability} />
      )}

      {/* 7. PRD Architect Conflict & Validation Panel */}
      {validation && (
        <PRDConflictValidationPanel validation={validation} />
      )}

      {/* 8. Pre-Analysis Gating Alert if not ready */}
      {totalInsights === 0 ? (
        <div className="bg-[#111827]/90 border border-violet-500/40 rounded-2xl p-6 text-center space-y-3 shadow-xl">
          <div className="w-10 h-10 bg-violet-500/10 border border-violet-500/30 rounded-2xl flex items-center justify-center text-violet-400 mx-auto">
            <Sparkles className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">AI Analysis Required for Batch '{datasetName}'</h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
            No AI-synthesized product insights exist for this batch yet.
            Please execute the 3-Agent AI Processing Pipeline to analyze this batch across all dimensions and generate insights for PM review.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <button
              onClick={() => workspaceId && navigate(`/workspace/${workspaceId}/pipeline`)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-violet-600 to-indigo-600 text-white hover:from-violet-500 hover:to-indigo-500 shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              Launch CrewAI 3-Agent Pipeline
            </button>
          </div>
        </div>
      ) : !isReadyForPRD ? (
        <div className="bg-[#111827]/80 border border-amber-500/40 rounded-2xl p-6 text-center space-y-3 shadow-xl">
          <div className="w-10 h-10 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center justify-center text-amber-400 mx-auto">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">PM Review Sign-off Required</h3>
          <p className="text-xs text-slate-400 max-w-xl mx-auto leading-relaxed">
            0 insights are currently approved for this feedback batch ({pendingCount} pending review).
            Downstream action plans, requirement synthesis, and multi-agent PRD generation are locked until PM sign-off is completed.
          </p>
          <div className="pt-2">
            <button
              onClick={() => workspaceId && navigate(`/workspace/${workspaceId}/pm-review`)}
              className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg transition-all cursor-pointer inline-flex items-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Complete PM Review Gate Sign-off
            </button>
          </div>
        </div>
      ) : (
        /* Action Plan & Next Steps ONLY rendered when PM review analysis is complete */
        contextPreview?.suggested_next_steps && (
          <div className="bg-gradient-to-r from-[#0d1527] to-[#0f172a] border border-violet-500/30 rounded-2xl p-5 space-y-4 shadow-lg">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                    Suggested Next Steps & Action Plan
                  </h2>
                  <p className="text-xs text-slate-400">AI-synthesized recommendations for approved feedback collection</p>
                </div>
              </div>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-semibold border border-emerald-500/30">
                Unlocked Post-Review
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div className="bg-[#111827] border border-[#223048] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-violet-400 font-bold border-b border-[#1e293b] pb-2">
                  <ArrowRight className="w-4 h-4" />
                  <span>What To Do Next (PM Actions)</span>
                </div>
                <ul className="space-y-2 text-slate-300">
                  {contextPreview.suggested_next_steps.pm_actions?.map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{action}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#111827] border border-[#223048] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold border-b border-[#1e293b] pb-2">
                  <Zap className="w-4 h-4" />
                  <span>Suggested Changes & Remediations</span>
                </div>
                <ul className="space-y-2 text-slate-300">
                  {contextPreview.suggested_next_steps.suggested_changes?.slice(0, 4).map((change, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                      <span className="w-1.5 h-1.5 bg-amber-400 rounded-full shrink-0 mt-1.5" />
                      <span>{change}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-[#111827] border border-[#223048] rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-blue-400 font-bold border-b border-[#1e293b] pb-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>Phasing Roadmap</span>
                </div>
                <ul className="space-y-2 text-slate-300">
                  {contextPreview.suggested_next_steps.development_roadmap?.map((phase, i) => (
                    <li key={i} className="flex items-start gap-2 text-[11px] leading-relaxed">
                      <span className="text-[10px] font-mono font-bold bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
                        {`P${i+1}`}
                      </span>
                      <span>{phase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )
      )}
    </div>
  );
}
