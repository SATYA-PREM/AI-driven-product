import React, { useState } from 'react';
import { X, HelpCircle, Send } from 'lucide-react';
import { qaApi } from '../../../api/qa';

export default function QARequestClarificationModal({
  isOpen,
  onClose,
  workspaceId,
  requirementId = 'REQ-PAYMENT-RECOVERY',
  onSuccess,
}) {
  if (!isOpen) return null;

  const [question, setQuestion] = useState('');
  const [ambiguityReason, setAmbiguityReason] = useState('');
  const [expectedDecision, setExpectedDecision] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) {
      setError('Clarification question is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        requirement_id: requirementId,
        question: question.trim(),
        reason_for_ambiguity: ambiguityReason.trim() || undefined,
        expected_decision: expectedDecision.trim() || undefined,
      };

      const res = await qaApi.requestClarification(workspaceId, payload);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit clarification request');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#090d1c] border border-white/[0.1] rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Request PM Clarification</h2>
              <p className="text-xs text-slate-400">
                Submit requirement question for {requirementId} to Product Manager
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Clarification Question <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="e.g. Does AC-PAYMENT-02 require debouncing for 1000ms or 2000ms? Should concurrent attempts return HTTP 429 or HTTP 200 with duplicate flag?"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Reason for Ambiguity
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Acceptance criteria mentions 'immediate feedback' but edge cases under 3G latency produce duplicate clicks."
              value={ambiguityReason}
              onChange={(e) => setAmbiguityReason(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Recommended or Expected Decision
            </label>
            <input
              type="text"
              placeholder="e.g. Recommend client-side 1500ms button disable plus Redis idempotency key."
              value={expectedDecision}
              onChange={(e) => setExpectedDecision(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send size={13} />
              <span>{submitting ? 'Sending...' : 'Send to PM'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

