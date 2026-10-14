import React, { useState, useEffect } from 'react';
import {
  FileText,
  Target,
  TrendingUp,
  ShieldAlert,
  HelpCircle,
  CheckCircle2,
  Lock,
  MessageSquare,
  Sparkles,
  Layers,
  ArrowRight,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useParams, useSearchParams } from 'react-router-dom';
import { stakeholderApi } from '../../api/stakeholder';
import DecisionModal from './components/DecisionModal';
import StakeholderFeedbackModal from './components/StakeholderFeedbackModal';

export default function PRDBusinessReview() {
  const { workspaceId } = useParams();
  const [searchParams] = useSearchParams();
  const prdIdParam = searchParams.get('prdId') || 'PRD-01';

  const [reviewData, setReviewData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [isDecisionOpen, setIsDecisionOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);

  const fetchPRDReview = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await stakeholderApi.getPRDBusinessReview(workspaceId, prdIdParam);
      setReviewData(res);
    } catch (err) {
      console.error('Failed to load PRD business review:', err);
      setError(err.message || 'Failed to load PRD review data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPRDReview();
  }, [workspaceId, prdIdParam]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error || !reviewData) {
    return (
      <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
        Failed to load PRD Business Review: {error || 'No review data found.'}
      </div>
    );
  }

  const {
    prd_id,
    title,
    version,
    status,
    author_pm,
    strategic_relevance,
    customer_and_business_value,
    feasibility_and_risk,
    outcome_measurement,
    approval_scope
  } = reviewData;

  // Build dummy approval request object for DecisionModal if user has approval authority
  const mockApprovalRequest = {
    request_id: `REQ-${prd_id}`,
    title: `PRD Approval: ${title}`,
    request_type: 'PRD_APPROVAL',
    target_id: prd_id,
    target_type: 'PRD',
    requested_by_name: author_pm || 'Lead PM',
    business_impact_summary: customer_and_business_value,
  };

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <FileText size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">PRD Business Review</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  v{version} • {status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Executive business review mode for evaluating strategic relevance, value, feasibility, and KPI alignment
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <MessageSquare size={14} />
            <span>Submit Feedback</span>
          </button>

          {approval_scope?.can_approve ? (
            <button
              onClick={() => setIsDecisionOpen(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all"
            >
              <CheckCircle2 size={14} />
              <span>Record Decision</span>
            </button>
          ) : (
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs flex items-center gap-1.5">
              <Lock size={12} className="text-amber-400" />
              <span>Review Only (PM Approval Workflow)</span>
            </div>
          )}
        </div>
      </div>

      {/* Read-Only Governance Protection Notice */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] flex items-center gap-3 text-xs text-slate-300">
        <Lock size={16} className="text-amber-400 shrink-0" />
        <div>
          <span className="font-semibold text-white">Authoritative PRD Boundary: </span>
          PRD requirements and acceptance criteria are authored and managed by the Product Manager ({author_pm}). Stakeholders evaluate business impact, provide structured feedback, and record authorized sign-offs without modifying operational requirements directly.
        </div>
      </div>

      {/* PRD Title Card */}
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-purple-300 border border-purple-500/30">
            {prd_id}
          </span>
          <span className="text-xs text-slate-400">Author: <strong className="text-slate-200">{author_pm}</strong></span>
        </div>
        <h2 className="text-xl font-bold text-white">{title}</h2>
      </div>

      {/* 4-Part Executive Review Framework */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Strategic Relevance */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-purple-500/15 text-purple-400 flex items-center justify-center">
              <Target size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">1. Strategic Relevance</h3>
              <p className="text-[11px] text-slate-400">Does this initiative directly support agreed corporate objectives?</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {strategic_relevance || 'Aligned with corporate OKR to scale enterprise governance and multi-tenant security.'}
          </div>
        </div>

        {/* 2. Customer and Business Value */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">2. Customer & Business Value</h3>
              <p className="text-[11px] text-slate-400">Is the expected business return clear, credible, and quantified?</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {customer_and_business_value || 'Projected to unlock \$450k ARR in enterprise pipeline and reduce compliance cycle time by 40%.'}
          </div>
        </div>

        {/* 3. Feasibility and Risk */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <ShieldAlert size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">3. Feasibility & Risk Oversight</h3>
              <p className="text-[11px] text-slate-400">Are key technical risks, external dependencies, and assumptions surfaced?</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {feasibility_and_risk || 'Primary dependency on third-party security auditor availability. Fallback mitigation in place.'}
          </div>
        </div>

        {/* 4. Outcome Measurement */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <HelpCircle size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">4. Outcome Measurement</h3>
              <p className="text-[11px] text-slate-400">How will leadership determine whether the project achieved its intended ROI?</p>
            </div>
          </div>
          <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {outcome_measurement || 'Target KPI: 99.9% audit pass rate and positive business sponsor sign-off at post-launch.'}
          </div>
        </div>
      </div>

      {/* Decision Modal */}
      {isDecisionOpen && (
        <DecisionModal
          isOpen={isDecisionOpen}
          onClose={() => setIsDecisionOpen(false)}
          approvalRequest={mockApprovalRequest}
          workspaceId={workspaceId}
          onSuccess={() => {
            fetchPRDReview();
          }}
        />
      )}

      {/* Feedback Modal */}
      <StakeholderFeedbackModal
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        workspaceId={workspaceId}
        initialTargetType="PRD"
        initialTargetId={prd_id}
        initialTargetTitle={title}
        onSuccess={() => {
          fetchPRDReview();
        }}
      />
    </div>
  );
}

