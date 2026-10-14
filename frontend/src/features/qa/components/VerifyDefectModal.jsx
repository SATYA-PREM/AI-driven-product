import React, { useState } from 'react';
import { X, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck, GitPullRequest } from 'lucide-react';
import { qaApi } from '../../../api/qa';

export default function VerifyDefectModal({
  isOpen,
  onClose,
  defect,
  workspaceId,
  onSuccess,
}) {
  if (!isOpen || !defect) return null;

  const [passed, setPassed] = useState(true);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!verificationNotes.trim()) {
      setError('Verification notes and evidence are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        passed,
        verification_notes: verificationNotes.trim(),
      };

      const res = await qaApi.verifyDefect(workspaceId, defect.defect_id, payload);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit defect verification');
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
              <ShieldCheck size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Verify Developer Fix</h2>
              <p className="text-xs text-slate-400">
                {defect.defect_id} &bull; <span className="text-slate-300">{defect.title}</span>
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
          {/* Developer Fix Context */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.08] text-xs space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold">
              <GitPullRequest size={14} />
              <span>Developer Fix Submission:</span>
            </div>
            <p className="text-slate-200 font-mono text-[11px] bg-black/40 p-2 rounded border border-white/[0.04]">
              {defect.fix_reference || 'PR / Branch fix submitted'}
            </p>
            {defect.fix_notes && (
              <p className="text-slate-300 text-[11px]">
                <span className="text-slate-400">Notes: </span>
                {defect.fix_notes}
              </p>
            )}
          </div>

          {/* Verification Decision */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Retest Verification Result <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setPassed(true)}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  passed
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 size={16} />
                <span>Fix Verified (Pass)</span>
              </button>

              <button
                type="button"
                onClick={() => setPassed(false)}
                className={`py-2.5 px-3 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all cursor-pointer ${
                  !passed
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20'
                    : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <RotateCcw size={16} />
                <span>Retest Failed (Reopen)</span>
              </button>
            </div>
          </div>

          {/* Verification Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Verification Notes & Test Evidence <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder={
                passed
                  ? 'Confirm reproduction steps executed; verify zero duplicate charge events under 3G latency...'
                  : 'Document why failure persists. Provide logs or telemetry of repeated failure...'
              }
              value={verificationNotes}
              onChange={(e) => setVerificationNotes(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              {passed ? 'Defect transitions to VERIFIED' : 'Defect transitions to REOPENED'}
            </span>
            <div className="flex items-center gap-2">
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
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 ${
                  passed
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                    : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                }`}
              >
                {submitting ? 'Submitting...' : passed ? 'Confirm Verification' : 'Reopen Defect'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

