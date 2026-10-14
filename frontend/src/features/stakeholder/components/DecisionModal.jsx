import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  XCircle,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Send,
  Loader2
} from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export default function DecisionModal({
  isOpen,
  onClose,
  request,
  initialDecision = 'APPROVED',
  onSubmit,
}) {
  const { isDark } = useTheme();
  const [decision, setDecision] = useState(initialDecision);
  const [rationale, setRationale] = useState('');
  const [comments, setComments] = useState('');
  const [followUpAction, setFollowUpAction] = useState('');
  const [followUpActions, setFollowUpActions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !request) return null;

  const handleAddAction = (e) => {
    e.preventDefault();
    if (!followUpAction.trim()) return;
    setFollowUpActions([...followUpActions, followUpAction.trim()]);
    setFollowUpAction('');
  };

  const handleRemoveAction = (index) => {
    setFollowUpActions(followUpActions.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rationale.trim() || rationale.trim().length < 10) {
      setError('Please provide a supporting business rationale of at least 10 characters.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        decision,
        rationale: rationale.trim(),
        comments: comments.trim() || null,
        follow_up_actions: followUpActions,
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit decision.');
    } finally {
      setSubmitting(false);
    }
  };

  const decisionOptions = [
    {
      id: 'APPROVED',
      label: 'Approve',
      icon: CheckCircle2,
      desc: 'Authorized to proceed into implementation or release.',
      color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20',
      activeColor: 'border-emerald-500 bg-emerald-500/20 text-emerald-300 ring-2 ring-emerald-500/30',
    },
    {
      id: 'CHANGES_REQUESTED',
      label: 'Request Changes',
      icon: AlertCircle,
      desc: 'Scope, cost, or target metrics need adjustment by PM.',
      color: 'border-amber-500/40 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20',
      activeColor: 'border-amber-500 bg-amber-500/20 text-amber-300 ring-2 ring-amber-500/30',
    },
    {
      id: 'CLARIFICATION_REQUESTED',
      label: 'Request Clarification',
      icon: HelpCircle,
      desc: 'Need further evidence or technical details before sign-off.',
      color: 'border-cyan-500/40 text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20',
      activeColor: 'border-cyan-500 bg-cyan-500/20 text-cyan-300 ring-2 ring-cyan-500/30',
    },
    {
      id: 'REJECTED',
      label: 'Reject',
      icon: XCircle,
      desc: 'Does not align with current business priorities or unit economics.',
      color: 'border-rose-500/40 text-rose-400 bg-rose-500/10 hover:bg-rose-500/20',
      activeColor: 'border-rose-500 bg-rose-500/20 text-rose-300 ring-2 ring-rose-500/30',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className={`w-full max-w-2xl rounded-2xl border shadow-2xl overflow-hidden transition-all duration-200 ${
        isDark ? 'bg-slate-900 border-white/[0.08] text-slate-100' : 'bg-white border-slate-200 text-slate-900'
      }`}>
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between ${
          isDark ? 'border-white/[0.08] bg-slate-900/50' : 'border-slate-100 bg-slate-50'
        }`}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">Record Business Decision</h2>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {request.title}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-100 text-slate-500 hover:text-slate-900'
            }`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Decision Type Buttons */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wider block ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Select Decision
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {decisionOptions.map((opt) => {
                const Icon = opt.icon;
                const isSelected = decision === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setDecision(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between ${
                      isSelected ? opt.activeColor : `${opt.color} ${isDark ? 'border-white/[0.08]' : 'border-slate-200'}`
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold">{opt.label}</span>
                      <Icon size={16} />
                    </div>
                    <p className={`text-[11px] leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                      {opt.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rationale (Mandatory) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className={`text-xs font-semibold uppercase tracking-wider ${
                isDark ? 'text-slate-400' : 'text-slate-600'
              }`}>
                Supporting Business Rationale <span className="text-rose-400">*</span>
              </label>
              <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                Min 10 characters (Required)
              </span>
            </div>
            <textarea
              rows={3}
              required
              value={rationale}
              onChange={(e) => setRationale(e.target.value)}
              placeholder="State the commercial justification, strategic alignment, or rationale behind this decision..."
              className={`w-full rounded-xl p-3 text-xs border focus:outline-hidden focus:ring-2 focus:ring-purple-500/40 transition-all ${
                isDark ? 'bg-slate-800/80 border-white/[0.1] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Additional Comments (Optional) */}
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold uppercase tracking-wider block ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Guidance / Conditions (Optional)
            </label>
            <textarea
              rows={2}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="Any operational conditions, dependencies to watch, or milestones to enforce..."
              className={`w-full rounded-xl p-3 text-xs border focus:outline-hidden focus:ring-2 focus:ring-purple-500/40 transition-all ${
                isDark ? 'bg-slate-800/80 border-white/[0.1] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
              }`}
            />
          </div>

          {/* Follow-up Action Items */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wider block ${
              isDark ? 'text-slate-400' : 'text-slate-600'
            }`}>
              Follow-Up Action Items
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={followUpAction}
                onChange={(e) => setFollowUpAction(e.target.value)}
                placeholder="e.g. Schedule pen-test review with security officer"
                className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-hidden focus:ring-2 focus:ring-purple-500/40 ${
                  isDark ? 'bg-slate-800/80 border-white/[0.1] text-white placeholder-slate-500' : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400'
                }`}
              />
              <button
                type="button"
                onClick={handleAddAction}
                className="px-3 py-2 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition-colors"
              >
                Add
              </button>
            </div>
            {followUpActions.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {followUpActions.map((action, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-2 rounded-lg text-xs border ${
                      isDark ? 'bg-slate-800/50 border-white/[0.06] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <span>• {action}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveAction(idx)}
                      className="text-slate-400 hover:text-rose-400 ml-2"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t flex items-center justify-end gap-3" style={{ borderColor: isDark ? 'rgba(255,255,255,0.08)' : '#e2e8f0' }}>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className={`px-4 py-2 rounded-xl text-xs font-medium transition-colors ${
                isDark ? 'hover:bg-slate-800 text-slate-300' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-600/25 flex items-center gap-2 transition-all disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Recording...
                </>
              ) : (
                <>
                  <Send size={14} />
                  Confirm & Record Decision
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

