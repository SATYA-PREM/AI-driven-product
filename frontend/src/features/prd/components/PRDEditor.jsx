import React, { useState } from 'react';
import {
  FileText,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Save,
  Check,
  X,
  ShieldCheck,
  Sparkles,
  Users,
  Target,
  Layers,
  ArrowRight,
} from 'lucide-react';

const normalizeText = (val) => {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'object') {
    if (val.primary_problem || val.customer_need || val.business_context) {
      return [
        val.primary_problem && `Primary Problem: ${val.primary_problem}`,
        val.customer_need && `Customer Need: ${val.customer_need}`,
        val.business_context && `Business Context: ${val.business_context}`,
      ].filter(Boolean).join('\n\n');
    }
    if (val.description || val.title) {
      return val.description || val.title;
    }
    return JSON.stringify(val, null, 2);
  }
  return String(val);
};

export default function PRDEditor({
  prdData,
  onSavePRD,
  onSubmitReview,
  isSaving,
  onGoToGenerator,
}) {
  const doc = prdData?.document || {};
  const project = prdData?.project || {};

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(doc.title || project.title || 'PRD Document');
  const [problemStatement, setProblemStatement] = useState(() => normalizeText(doc.problem_statement));
  const [businessObjective, setBusinessObjective] = useState(() => normalizeText(doc.business_objective));
  const [proposedSolution, setProposedSolution] = useState(() => normalizeText(doc.proposed_solution));
  const [customerNeed, setCustomerNeed] = useState(() => normalizeText(doc.customer_need));
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewDecision, setReviewDecision] = useState('approved');
  const [reviewComment, setReviewComment] = useState('');

  // Sync state if prdData changes
  React.useEffect(() => {
    if (doc) {
      if (doc.title || project.title) setTitle(doc.title || project.title);
      if (doc.problem_statement) setProblemStatement(normalizeText(doc.problem_statement));
      if (doc.business_objective) setBusinessObjective(normalizeText(doc.business_objective));
      if (doc.proposed_solution) setProposedSolution(normalizeText(doc.proposed_solution));
      if (doc.customer_need) setCustomerNeed(normalizeText(doc.customer_need));
    }
  }, [prdData]);

  if (!prdData || !prdData.project) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center space-y-4 animate-fadeIn">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <FileText className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-bold text-white">No PRD Document Generated Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            There is no Product Requirements Document generated for this dataset batch yet. Review and approve feedback insights in PM Review, then run the multi-agent generator.
          </p>
        </div>
        {onGoToGenerator && (
          <button
            onClick={onGoToGenerator}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Go to PRD Generator
          </button>
        )}
      </div>
    );
  }

  const handleSave = () => {
    onSavePRD({
      title,
      problem_statement: problemStatement,
      business_objective: businessObjective,
      proposed_solution: proposedSolution,
      customer_need: customerNeed,
    });
    setIsEditing(false);
  };

  const handleReviewSubmit = () => {
    onSubmitReview(reviewDecision, [{ section: 'general', comment: reviewComment }]);
    setShowReviewModal(false);
  };

  const status = project.status || 'draft';

  return (
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Status Bar */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono text-slate-400">{project.prd_id || 'PRD-001'}</span>
              <span className="text-xs bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded">
                Version {project.current_version || doc.version || 'v1.0'}
              </span>
              <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                status === 'approved'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : status === 'changes_requested'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
              }`}>
                {status.replace('_', ' ')}
              </span>
            </div>
            <h1 className="text-lg font-bold text-white mt-0.5">{title}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {isEditing ? (
            <>
              <button
                onClick={() => setIsEditing(false)}
                className="px-3.5 py-1.5 rounded-xl border border-[#223048] text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <Save className="w-3.5 h-3.5" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setIsEditing(true)}
                className="px-3.5 py-1.5 rounded-xl bg-[#111827] border border-[#223048] hover:border-violet-500/50 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Sections
              </button>
              <button
                onClick={() => setShowReviewModal(true)}
                className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                PM Review Gate
              </button>
            </>
          )}
        </div>
      </div>

      {/* PRD Document Sections */}
      <div className="space-y-4">
        {/* Section 1: Problem Statement */}
        <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-violet-400">01</span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Problem Statement</h2>
          </div>
          {isEditing ? (
            <textarea
              value={problemStatement}
              onChange={(e) => setProblemStatement(e.target.value)}
              rows={4}
              className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500"
            />
          ) : (
            <p className="text-xs text-slate-300 leading-relaxed bg-[#111827] border border-[#223048] p-4 rounded-xl">
              {problemStatement || 'No problem statement defined.'}
            </p>
          )}
        </div>

        {/* Section 2: Business Objectives & Customer Need */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-emerald-400">02</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Business Objective</h2>
            </div>
            {isEditing ? (
              <textarea
                value={businessObjective}
                onChange={(e) => setBusinessObjective(e.target.value)}
                rows={3}
                className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500"
              />
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed bg-[#111827] border border-[#223048] p-4 rounded-xl">
                {businessObjective || 'No business objective defined.'}
              </p>
            )}
          </div>

          <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold font-mono text-cyan-400">03</span>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Customer Need</h2>
            </div>
            {isEditing ? (
              <textarea
                value={customerNeed}
                onChange={(e) => setCustomerNeed(e.target.value)}
                rows={3}
                className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500"
              />
            ) : (
              <p className="text-xs text-slate-300 leading-relaxed bg-[#111827] border border-[#223048] p-4 rounded-xl">
                {customerNeed || 'No customer need defined.'}
              </p>
            )}
          </div>
        </div>

        {/* Section 3: Target Users & Solution */}
        <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold font-mono text-purple-400">04</span>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Proposed Solution</h2>
          </div>
          {isEditing ? (
            <textarea
              value={proposedSolution}
              onChange={(e) => setProposedSolution(e.target.value)}
              rows={3}
              className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500"
            />
          ) : (
            <p className="text-xs text-slate-300 leading-relaxed bg-[#111827] border border-[#223048] p-4 rounded-xl">
              {proposedSolution || 'No proposed solution defined.'}
            </p>
          )}

          <div className="pt-2">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Target User Personas:</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {(doc.target_users || ['Enterprise User', 'Product Manager', 'Data Analyst']).map((user, idx) => (
                <span key={idx} className="bg-violet-500/10 text-violet-300 border border-violet-500/20 px-3 py-1 rounded-lg text-xs font-medium">
                  {user}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Section 4: Scope & Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4" /> In Scope
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(doc.scope?.in_scope || ['CSV & PDF Data Exports', 'Custom Date Range Filter', 'Asynchronous Processing']).map((item, idx) => (
                <li key={idx} className="bg-[#111827] border border-[#223048] px-3 py-2 rounded-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> Out of Scope
            </h3>
            <ul className="space-y-1.5 text-xs text-slate-300">
              {(doc.scope?.out_of_scope || ['Third-party BI Tool Integration (Phase 2)', 'Legacy CSV Data Format Migration']).map((item, idx) => (
                <li key={idx} className="bg-[#111827] border border-[#223048] px-3 py-2 rounded-lg flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* PM Review Gate Modal */}
      {showReviewModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-6 max-w-md w-full space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                PM Review Gate Decision
              </h3>
              <button onClick={() => setShowReviewModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300">Decision Outcome:</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReviewDecision('approved')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    reviewDecision === 'approved'
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                      : 'bg-[#111827] text-slate-400 border-[#223048] hover:text-slate-200'
                  }`}
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve PRD
                </button>
                <button
                  type="button"
                  onClick={() => setReviewDecision('changes_requested')}
                  className={`p-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                    reviewDecision === 'changes_requested'
                      ? 'bg-amber-600 text-white border-amber-500 shadow-lg'
                      : 'bg-[#111827] text-slate-400 border-[#223048] hover:text-slate-200'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4" />
                  Request Rework
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-300">PM Review Notes / Rework Feedback:</label>
                <textarea
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  placeholder="E.g., Approved. Proceed with user story generation and phase 1 tasks."
                  rows={3}
                  className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-violet-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowReviewModal(false)}
                className="px-4 py-2 rounded-xl border border-[#223048] text-xs font-semibold text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleReviewSubmit}
                className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow"
              >
                Submit Decision
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
