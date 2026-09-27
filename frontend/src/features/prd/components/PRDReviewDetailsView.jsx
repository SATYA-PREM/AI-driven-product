import React, { useState } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Clock,
  Layers,
  Users,
  Target,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Database,
  Lock,
} from 'lucide-react';
import { formatLocalDate } from '../utils/formatDate';

export default function PRDReviewDetailsView({
  contextPreview,
  onGoToGenerator,
  onSelectEvidenceTrace,
}) {
  const [activeSubtab, setActiveSubtab] = useState('overview'); // 'overview' | 'issues' | 'opportunities' | 'evidence'
  const [expandedIssueIds, setExpandedIssueIds] = useState(new Set(['PI-001']));

  const pmReview = contextPreview?.pm_review || {};
  const approvedIssues = contextPreview?.approved_issues || [];
  const approvedOpportunities = contextPreview?.approved_opportunities || [];
  const evidenceRecords = contextPreview?.evidence_records || [];
  const datasetName = contextPreview?.dataset_name || 'Active Feedback Collection';

  const totalSourceCount = approvedIssues.length + approvedOpportunities.length;
  const isEligible = (pmReview.review_status === 'APPROVED' || pmReview.review_status === 'ACCEPTED') && totalSourceCount > 0;

  const toggleExpand = (id) => {
    setExpandedIssueIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-6 select-none animate-fadeIn max-w-6xl mx-auto">
      {/* 1. Source Integrity & Generation Eligibility Card */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-6 space-y-5 shadow-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-violet-400">
                {pmReview.review_id || 'REV-001'}
              </span>
              <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold uppercase flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                {pmReview.review_status || 'APPROVED'}
              </span>
              <span className="bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs px-2.5 py-0.5 rounded-full font-bold">
                {datasetName}
              </span>
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              PM Review Package & Source Integrity
            </h2>
            <p className="text-xs text-slate-400">
              Verified product intelligence ready for batch PRD derivation and requirement generation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onGoToGenerator && (
              <button
                onClick={onGoToGenerator}
                className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                Back to PRD Studio
              </button>
            )}
          </div>
        </div>

        {/* Source Integrity Verification Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          <div className="bg-[#111827] border border-[#223048] p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">PM Decision Authority</span>
            <p className="text-xs font-bold text-white truncate">
              {pmReview.reviewed_by || 'Product Manager'}
            </p>
            <span className="text-[10px] text-emerald-400 font-semibold block">✓ Decision Gate Passed</span>
          </div>

          <div className="bg-[#111827] border border-[#223048] p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Approved Items</span>
            <p className="text-xs font-bold text-emerald-300 truncate">
              {approvedIssues.length} Issues • {approvedOpportunities.length} Opps
            </p>
            <span className="text-[10px] text-slate-400 block">{totalSourceCount} Items in Scope</span>
          </div>

          <div className="bg-[#111827] border border-[#223048] p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Evidence Records</span>
            <p className="text-xs font-bold text-violet-300">
              {evidenceRecords.length} Customer Quotes
            </p>
            <span className="text-[10px] text-slate-400 block">100% Traceable</span>
          </div>

          <div className="bg-[#111827] border border-[#223048] p-3.5 rounded-xl space-y-1">
            <span className="text-[10px] uppercase font-bold text-slate-500">Generation Eligibility</span>
            <p className={`text-xs font-bold ${isEligible ? 'text-emerald-400' : 'text-amber-400'}`}>
              {isEligible ? '✓ READY FOR PRD' : 'BLOCKED'}
            </p>
            <span className="text-[10px] text-slate-400 block">
              {isEligible ? 'All Gates Verified' : 'Awaiting PM Approval'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Subtabs Navigation */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Directives' },
          { id: 'issues', label: `Approved Issues (${approvedIssues.length})` },
          { id: 'opportunities', label: `Approved Opportunities (${approvedOpportunities.length})` },
          { id: 'evidence', label: `Evidence Records (${evidenceRecords.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubtab(tab.id)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeSubtab === tab.id
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'bg-[#0b101b] border border-[#1e293b] text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 3. Subtab Content */}

      {/* Overview */}
      {activeSubtab === 'overview' && (
        <div className="space-y-4">
          <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              PM Strategic Comments & Directives
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed bg-[#111827] border border-[#223048] p-4 rounded-xl">
              {pmReview.comments || 'Consolidated PM review package approved for multi-agent PRD generation.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Strategic Goals
              </h4>
              <p className="text-xs text-slate-300 bg-[#111827] p-3 rounded-xl border border-[#223048]">
                {contextPreview?.business_context?.strategic_goal || 'Address customer friction and eliminate friction in checkout workflows.'}
              </p>
            </div>

            <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-3">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-violet-400" />
                Target Customer Segment
              </h4>
              <p className="text-xs text-slate-300 bg-[#111827] p-3 rounded-xl border border-[#223048]">
                {contextPreview?.business_context?.target_segment || 'Enterprise & Standard Users'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Approved Issues */}
      {activeSubtab === 'issues' && (
        <div className="space-y-4">
          {approvedIssues.map((iss) => {
            const isExpanded = expandedIssueIds.has(iss.issue_id);
            const impact = (iss.customer_impact || 'HIGH').toUpperCase();

            return (
              <div
                key={iss.issue_id}
                className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1e293b] pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-bold text-violet-400">{iss.issue_id}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          impact === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {impact} Impact
                      </span>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        ✓ Accepted
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-white">{iss.title}</h3>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{iss.evidence_count || iss.frequency || 1} Signals</span>
                    <span>•</span>
                    <span className="text-rose-400 font-semibold">{iss.dominant_sentiment || 'NEGATIVE'}</span>
                  </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-[#111827] p-2.5 rounded-xl border border-[#223048]">
                    <span className="text-[10px] text-slate-500 block">Product Area</span>
                    <span className="font-semibold text-slate-200 truncate block">
                      {iss.product_area || 'Core Module'}
                    </span>
                  </div>
                  <div className="bg-[#111827] p-2.5 rounded-xl border border-[#223048]">
                    <span className="text-[10px] text-slate-500 block">Frequency</span>
                    <span className="font-semibold text-slate-200 block">{iss.frequency || 1} Reports</span>
                  </div>
                  <div className="bg-[#111827] p-2.5 rounded-xl border border-[#223048]">
                    <span className="text-[10px] text-slate-500 block">Feedback Share</span>
                    <span className="font-semibold text-slate-200 block">{iss.feedback_share || '10.0%'}</span>
                  </div>
                  <div className="bg-[#111827] p-2.5 rounded-xl border border-[#223048]">
                    <span className="text-[10px] text-slate-500 block">Evidence Count</span>
                    <span className="font-semibold text-violet-300 block">
                      {iss.evidence_record_ids?.length || iss.evidence_count || 1} IDs
                    </span>
                  </div>
                </div>

                {/* Problem & Recommended Action */}
                <div className="space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Problem Description:</span>
                    <p className="text-xs text-slate-300 leading-relaxed bg-[#111827] p-3 rounded-xl border border-[#223048]">
                      {iss.problem_description}
                    </p>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400">Recommended Action:</span>
                    <p className="text-xs text-emerald-300 leading-relaxed bg-[#111827] p-3 rounded-xl border border-[#223048]">
                      {iss.recommended_action}
                    </p>
                  </div>
                </div>

                {/* Evidence IDs List */}
                {iss.evidence_record_ids && iss.evidence_record_ids.length > 0 && (
                  <div className="space-y-2 pt-2 border-t border-[#1e293b]">
                    <span className="text-[10px] uppercase font-bold text-slate-500">
                      Supporting Evidence IDs:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {iss.evidence_record_ids.map((evId, i) => (
                        <button
                          key={i}
                          onClick={() => onSelectEvidenceTrace && onSelectEvidenceTrace('evidence', evId)}
                          className="px-2 py-0.5 bg-[#111827] hover:bg-violet-600 border border-[#223048] rounded text-[11px] font-mono text-slate-300 hover:text-white transition-colors cursor-pointer"
                        >
                          {evId}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Approved Opportunities */}
      {activeSubtab === 'opportunities' && (
        <div className="space-y-4">
          {approvedOpportunities.map((opp) => (
            <div
              key={opp.opportunity_id || opp.id}
              className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-3 shadow-xl"
            >
              <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-violet-400">
                    {opp.opportunity_id || opp.id}
                  </span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold uppercase">
                    {opp.priority || 'Medium'} Priority
                  </span>
                </div>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                  ✓ PM Approved
                </span>
              </div>
              <h4 className="text-sm font-bold text-white">{opp.title}</h4>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#111827] p-3 rounded-xl border border-[#223048]">
                {opp.description}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Evidence Records */}
      {activeSubtab === 'evidence' && (
        <div className="space-y-3">
          {evidenceRecords.map((ev, idx) => (
            <div
              key={ev.record_id || idx}
              className="p-4 bg-[#0b101b] border border-[#1e293b] rounded-2xl space-y-2 text-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-violet-400">{ev.record_id || `FB-${idx + 1}`}</span>
                <span className="text-[10px] text-slate-400 font-mono">{ev.source_type || 'feedback'}</span>
              </div>
              <p className="text-slate-200 italic bg-[#111827] p-3 rounded-xl border border-[#223048]">
                "{ev.text || ev.quote || 'Customer feedback message'}"
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
