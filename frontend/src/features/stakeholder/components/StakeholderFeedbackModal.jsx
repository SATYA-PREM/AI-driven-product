import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  AlertTriangle,
  Send,
  HelpCircle,
  TrendingUp,
  ShieldAlert,
  Target,
  Clock,
  Sparkles
} from 'lucide-react';
import { stakeholderApi } from '../../../api/stakeholder';

const CATEGORIES = [
  { value: 'STRATEGIC_ALIGNMENT', label: 'Strategic Alignment', icon: Target, desc: 'Misalignment with corporate goals or strategy' },
  { value: 'BUSINESS_VALUE', label: 'Expected Value & ROI', icon: TrendingUp, desc: 'Questions on business case, revenue, or savings' },
  { value: 'MARKET_FIT', label: 'Customer / Market Fit', icon: Sparkles, desc: 'Customer evidence, adoption risk, or positioning' },
  { value: 'RISK_CONCERN', label: 'Business Risk & Compliance', icon: ShieldAlert, desc: 'Regulatory, legal, operational, or brand risk' },
  { value: 'METRIC_VALIDATION', label: 'Success Metric Validation', icon: HelpCircle, desc: 'Baseline accuracy or KPI measurement definition' },
  { value: 'TIMELINE_PRIORITY', label: 'Timeline & Priority', icon: Clock, desc: 'Strategic urgency, dependency impact, or phasing' },
  { value: 'OTHER', label: 'General Clarification', icon: MessageSquare, desc: 'Other business questions or suggestions' },
];

export default function StakeholderFeedbackModal({
  isOpen,
  onClose,
  workspaceId,
  initialTargetType = 'GENERAL',
  initialTargetId = '',
  initialTargetTitle = '',
  onSuccess
}) {
  const [category, setCategory] = useState('STRATEGIC_ALIGNMENT');
  const [title, setTitle] = useState('');
  const [rationale, setRationale] = useState('');
  const [businessImpact, setBusinessImpact] = useState('');
  const [suggestedAction, setSuggestedAction] = useState('');
  const [targetType, setTargetType] = useState(initialTargetType);
  const [targetId, setTargetId] = useState(initialTargetId);
  const [targetTitle, setTargetTitle] = useState(initialTargetTitle);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Feedback summary title is required.');
      return;
    }
    if (!rationale.trim() || rationale.trim().length < 10) {
      setError('Please provide a substantive business rationale (at least 10 characters).');
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        category,
        title: title.trim(),
        rationale: rationale.trim(),
        business_impact: businessImpact.trim() || undefined,
        suggested_action: suggestedAction.trim() || undefined,
        target_type: targetType,
        target_id: targetId.trim() || undefined,
        target_title: targetTitle.trim() || undefined,
      };

      await stakeholderApi.submitBusinessFeedback(workspaceId, payload);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to submit stakeholder feedback:', err);
      setError(err.message || 'Failed to submit feedback. Please check backend connection.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <MessageSquare size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Submit Structured Business Feedback</h2>
              <p className="text-xs text-slate-400">
                Share business rationale and strategic recommendations with the Product Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs text-slate-300">
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 flex items-start gap-2.5">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Feedback Category */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Feedback Category <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isSelected = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`text-left p-2.5 rounded-xl border transition-all flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-purple-600/20 border-purple-500/60 text-white shadow-sm'
                        : 'bg-slate-800/50 border-slate-700/60 text-slate-300 hover:bg-slate-800 hover:border-slate-600'
                    }`}
                  >
                    <Icon size={16} className={`mt-0.5 shrink-0 ${isSelected ? 'text-purple-400' : 'text-slate-400'}`} />
                    <div className="min-w-0">
                      <div className="font-semibold text-xs leading-tight">{cat.label}</div>
                      <div className="text-[11px] text-slate-400 truncate mt-0.5">{cat.desc}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Feedback Summary Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Feedback Summary Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Target enterprise market requires SOC2 compliance prior to Q3 rollout"
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Target Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Target Scope</label>
              <select
                value={targetType}
                onChange={(e) => setTargetType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 text-xs focus:outline-none focus:border-purple-500"
              >
                <option value="GENERAL">General Workspace</option>
                <option value="PRD">PRD Proposal</option>
                <option value="INITIATIVE">Product Initiative</option>
                <option value="OBJECTIVE">Strategic Objective</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1">Item Title / ID</label>
              <input
                type="text"
                value={targetTitle}
                onChange={(e) => setTargetTitle(e.target.value)}
                placeholder="e.g., Enterprise Governance Suite / PRD-01"
                className="w-full px-3 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Business Rationale & Evidence */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-200">
                Business Rationale & Customer Evidence <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-400">Min 10 chars</span>
            </div>
            <textarea
              rows={3}
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="Explain the business context, customer signals, or market dynamics motivating this feedback..."
              className="w-full px-3.5 py-2.5 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
            />
          </div>

          {/* Expected Business Impact */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Expected Business Impact or Risk (Optional)
            </label>
            <textarea
              rows={2}
              value={businessImpact}
              onChange={(e) => setBusinessImpact(e.target.value)}
              placeholder="e.g., Potential delay of \$450k ARR if Fortune 500 security sign-off cannot be achieved"
              className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none"
            />
          </div>

          {/* Suggested Action / Alternative */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-200">
              Suggested Action / Alternative Proposal (Optional)
            </label>
            <input
              type="text"
              value={suggestedAction}
              onChange={(e) => setSuggestedAction(e.target.value)}
              placeholder="e.g., Split delivery: release base audit export in Milestone 1, SOC2 type II audit in Milestone 2"
              className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-700 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"
            />
          </div>

          {/* Footer Controls */}
          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">
              Recorded in workspace feedback history for PM review.
            </p>
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                disabled={submitting}
                className="px-3.5 py-2 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/30 flex items-center gap-2 transition-all disabled:opacity-50"
              >
                <Send size={14} />
                <span>{submitting ? 'Submitting...' : 'Submit Feedback'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

