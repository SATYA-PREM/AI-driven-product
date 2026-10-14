import React, { useState } from 'react';
import { X, Layers, Plus } from 'lucide-react';
import { qaApi } from '../../../api/qa';

export default function CreateTestSuiteModal({
  isOpen,
  onClose,
  workspaceId,
  testPlans = [],
  testCases = [],
  onSuccess,
}) {
  if (!isOpen) return null;

  const [suiteName, setSuiteName] = useState('');
  const [description, setDescription] = useState('');
  const [planId, setPlanId] = useState(testPlans[0]?.plan_id || '');
  const [relatedFeature, setRelatedFeature] = useState('Interactive Payment Failure & Zero-Latency Retry');
  const [selectedCaseIds, setSelectedCaseIds] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const toggleCase = (cid) => {
    if (selectedCaseIds.includes(cid)) {
      setSelectedCaseIds(selectedCaseIds.filter((id) => id !== cid));
    } else {
      setSelectedCaseIds([...selectedCaseIds, cid]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!suiteName.trim()) {
      setError('Suite name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        suite_name: suiteName.trim(),
        description: description.trim() || undefined,
        plan_id: planId || undefined,
        related_feature: relatedFeature,
        test_case_ids: selectedCaseIds,
      };

      const res = await qaApi.createTestSuite(workspaceId, payload);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create test suite');
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
              <Layers size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Test Suite</h2>
              <p className="text-xs text-slate-400">
                Group related test cases for targeted execution runs
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
              Suite Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Checkout & Payment Idempotency Suite"
              value={suiteName}
              onChange={(e) => setSuiteName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Associated Test Plan</label>
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">(None / Standalone)</option>
                {testPlans.map((p) => (
                  <option key={p.plan_id} value={p.plan_id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Related Feature</label>
              <input
                type="text"
                value={relatedFeature}
                onChange={(e) => setRelatedFeature(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
            <textarea
              rows={2}
              placeholder="Describe scope and test purpose for this group..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Select Test Cases */}
          {testCases.length > 0 && (
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Include Test Cases ({selectedCaseIds.length} selected)
              </label>
              <div className="max-h-40 overflow-y-auto space-y-1.5 p-2 rounded-xl bg-slate-900/60 border border-white/[0.06]">
                {testCases.map((tc) => (
                  <label
                    key={tc.test_case_id}
                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/[0.03] transition-colors cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCaseIds.includes(tc.test_case_id)}
                      onChange={() => toggleCase(tc.test_case_id)}
                      className="rounded bg-black/40 border-white/[0.2] text-purple-600 focus:ring-0"
                    />
                    <span className="font-mono text-purple-400 font-bold">{tc.test_case_id}</span>
                    <span className="text-slate-200 truncate">{tc.title}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

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
              {submitting ? 'Creating...' : 'Create Suite'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

