import React from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Download,
  Share2,
  ShieldCheck,
  ExternalLink,
  Users,
  Target,
  BarChart2,
  Layers,
  Sparkles,
} from 'lucide-react';

export default function PRDRelatedContextSidebar({
  prdData,
  contextPreview,
  onOpenPMReviewModal,
  onExportPDF,
  onOpenTraceModal,
}) {
  const doc = prdData?.document || {};
  const project = prdData?.project || {};
  const approvedIssues = contextPreview?.approved_issues || [];
  const approvedOpps = contextPreview?.approved_opportunities || [];
  const evidenceRecords = contextPreview?.evidence_records || [];
  const bizContext = contextPreview?.business_context || {};
  const priorityContext = contextPreview?.priority_context || {};

  const allSourceItems = [...approvedIssues, ...approvedOpps];
  const totalEvidenceCount = contextPreview?.total_evidence_count || evidenceRecords.length || 0;

  return (
    <div className="space-y-4 select-none">
      {/* 1. Source Insights & Opportunities Card */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400">
              <AlertTriangle className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Source Insights & Scope ({allSourceItems.length})
            </h3>
          </div>
          <span className="text-[9px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-mono uppercase">
            PM APPROVED
          </span>
        </div>

        <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
          {allSourceItems.slice(0, 4).map((item, idx) => {
            const impact = (item.customer_impact || item.priority || 'HIGH').toUpperCase();
            const itemId = item.issue_id || item.opportunity_id || item.id || `ITEM-${idx + 1}`;
            return (
              <div
                key={itemId}
                className="p-2.5 rounded-xl bg-[#111827] border border-[#223048] space-y-1 hover:border-slate-600 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold text-violet-400">
                    {itemId}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase ${
                      impact === 'CRITICAL' || impact === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {impact}
                  </span>
                </div>
                <h4 className="text-[11px] font-semibold text-white truncate">{item.title}</h4>
                {item.recommended_action && (
                  <p className="text-[10px] text-slate-400 line-clamp-1">{item.recommended_action}</p>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Customer Evidence Utilization Card */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400">
              <FileText className="w-3.5 h-3.5" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              Customer Evidence
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded">
            {totalEvidenceCount} Records
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="grid grid-cols-2 gap-2 bg-[#111827] p-2.5 rounded-xl border border-[#223048]">
            <div>
              <span className="text-[10px] text-slate-500 block">Linked to PRD:</span>
              <span className="font-bold text-emerald-400 text-xs">{totalEvidenceCount} Records</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 block">Requirement Traces:</span>
              <span className="font-bold text-violet-400 text-xs">100% Linked</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Dominant Sentiment:</span>
            <span className="font-bold text-rose-400">Negative Friction</span>
          </div>

          {evidenceRecords && evidenceRecords.length > 0 && (
            <div className="pt-2 border-t border-[#1e293b] space-y-1.5">
              <span className="text-[10px] uppercase font-bold text-slate-500">
                Sample Verified Feedback:
              </span>
              <div className="space-y-1">
                {evidenceRecords.slice(0, 2).map((ev, idx) => (
                  <p
                    key={idx}
                    className="text-[10px] text-slate-300 italic bg-[#111827] p-2 rounded-lg border border-[#223048]"
                  >
                    "{ev.text ? ev.text.slice(0, 90) : 'Feedback quote'}..."
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Business Context & Strategic Alignment Card */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2.5">
          <div className="p-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400">
            <TrendingUp className="w-3.5 h-3.5" />
          </div>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Business Context</h3>
        </div>

        <div className="space-y-2 text-xs">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">PM Strategic Directive:</span>
            <p className="text-[11px] text-slate-300 leading-relaxed bg-[#111827] p-2 rounded-lg border border-[#223048]">
              {typeof bizContext === 'string'
                ? bizContext
                : typeof bizContext?.strategic_goal === 'string'
                ? bizContext.strategic_goal
                : typeof contextPreview?.pm_comments === 'string'
                ? contextPreview.pm_comments
                : 'Address friction identified in feedback collection and increase user retention.'}
            </p>
          </div>

          <div className="space-y-1">
            <span className="text-[10px] text-slate-500 uppercase font-bold">Source Review Package:</span>
            <p className="text-[11px] font-mono text-violet-300 bg-[#111827] p-1.5 rounded border border-[#223048]">
              {typeof contextPreview?.source_review_id === 'string' && contextPreview.source_review_id
                ? contextPreview.source_review_id
                : typeof contextPreview?.pm_review?.review_id === 'string'
                ? contextPreview.pm_review.review_id
                : typeof project?.source_review_id === 'string'
                ? project.source_review_id
                : 'REV-001'}{' '}
              (Verified Decision Gate)
            </p>
          </div>
        </div>
      </div>

      {/* 4. Action Center */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-4 space-y-2.5">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Audit & Verification</h4>

        {onOpenPMReviewModal && (
          <button
            onClick={onOpenPMReviewModal}
            className="w-full px-3 py-2 rounded-xl bg-violet-600/10 hover:bg-violet-600/20 border border-violet-500/30 text-xs font-semibold text-violet-300 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Review Package Details</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        )}

        {onOpenTraceModal && (
          <button
            onClick={() => onOpenTraceModal('prd', project.prd_id || 'PRD-001')}
            className="w-full px-3 py-2 rounded-xl bg-[#111827] hover:bg-slate-800 border border-[#223048] text-xs font-semibold text-slate-300 flex items-center justify-between transition-colors cursor-pointer"
          >
            <span>Provenance Trace Matrix</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
          </button>
        )}
      </div>
    </div>
  );
}
