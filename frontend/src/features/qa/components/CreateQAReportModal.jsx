import React, { useState } from 'react';
import { X, BarChart2, CheckCircle2, ShieldAlert } from 'lucide-react';
import { qaApi } from '../../../api/qa';

export default function CreateQAReportModal({
  isOpen,
  onClose,
  workspaceId,
  onSuccess,
}) {
  if (!isOpen) return null;

  const [title, setTitle] = useState(`QA Sign-off Report - Sprint 14 (${new Date().toLocaleDateString()})`);
  const [featureId, setFeatureId] = useState('FEAT-PAYMENT-RECOVERY');
  const [prdVersion, setPrdVersion] = useState('v1.2');
  const [qaRecommendation, setQaRecommendation] = useState('READY_FOR_REVIEW');
  const [knownLimitations, setKnownLimitations] = useState('Redis failover clustering in split-brain defaults to local in-memory lock.');
  const [outstandingRisks, setOutstandingRisks] = useState('Critical defect DEF-01 requires verification after deployment to Staging.');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Report title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        feature_id: featureId,
        prd_version: prdVersion,
        qa_recommendation: qaRecommendation,
        known_limitations: knownLimitations.trim() || undefined,
        outstanding_risks: outstandingRisks.trim() || undefined,
      };

      const res = await qaApi.createReport(workspaceId, payload);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to submit QA report');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#090d1c] border border-white/[0.1] rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <BarChart2 size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Generate QA Report</h2>
              <p className="text-xs text-slate-400">
                Compile authoritative execution metrics, defect status, and quality recommendation
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

        <form onSubmit={handleSubmit} className="mt-4 space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Report Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Feature Scope</label>
              <input
                type="text"
                value={featureId}
                onChange={(e) => setFeatureId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">PRD Version</label>
              <input
                type="text"
                value={prdVersion}
                onChange={(e) => setPrdVersion(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              QA Recommendation Status <span className="text-rose-400">*</span>
            </label>
            <select
              value={qaRecommendation}
              onChange={(e) => setQaRecommendation(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="READY_FOR_REVIEW">Ready for Review (Passing with non-blockers)</option>
              <option value="QA_PASSED">QA Passed (100% criteria met, 0 blockers)</option>
              <option value="QA_FAILED">QA Failed (Unresolved critical criteria)</option>
              <option value="BLOCKED">Blocked (Environment or external dependency issue)</option>
              <option value="TESTING_IN_PROGRESS">Testing In Progress</option>
            </select>
            <p className="text-[11px] text-slate-500 mt-1">
              Note: QA approval does not automatically mean release approval without PM sign-off.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Known Limitations</label>
            <textarea
              rows={2}
              value={knownLimitations}
              onChange={(e) => setKnownLimitations(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Outstanding Quality Risks</label>
            <textarea
              rows={2}
              value={outstandingRisks}
              onChange={(e) => setOutstandingRisks(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
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
              {submitting ? 'Generating...' : 'Submit QA Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

