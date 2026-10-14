import React, { useState } from 'react';
import { X, Target, Calendar, CheckCircle2 } from 'lucide-react';
import { qaApi } from '../../../api/qa';

export default function CreateTestPlanModal({
  isOpen,
  onClose,
  workspaceId,
  onSuccess,
}) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [featureScope, setFeatureScope] = useState('Interactive Payment Failure & Zero-Latency Retry');
  const [prdVersion, setPrdVersion] = useState('v1.2');
  const [testObjectives, setTestObjectives] = useState('Validate sub-200ms recovery, zero double-charge risk, and WCAG AA accessibility compliance.');
  const [testEnvironment, setTestEnvironment] = useState('Staging (Node.js 20, Postgres, Redis)');
  const [entryCriteria, setEntryCriteria] = useState('Developer pull requests merged; Staging build deployed successfully.');
  const [exitCriteria, setExitCriteria] = useState('100% P1 test cases passed; zero open Critical/High defects.');
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [completionDate, setCompletionDate] = useState(new Date(Date.now() + 14 * 86400000).toISOString().slice(0, 10));
  const [status, setStatus] = useState('READY');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Test plan name is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        feature_scope: featureScope,
        prd_version: prdVersion,
        test_objectives: testObjectives,
        test_environment: testEnvironment,
        entry_criteria: entryCriteria,
        exit_criteria: exitCriteria,
        planned_start_date: startDate,
        planned_completion_date: completionDate,
        status,
      };

      const res = await qaApi.createTestPlan(workspaceId, payload);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create test plan');
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
              <Target size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Create Test Plan</h2>
              <p className="text-xs text-slate-400">
                Establish quality objectives, scope, and entry/exit criteria
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
              Plan Name <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Sprint 14 Core Functional & Payment Flow Test Plan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Feature Scope</label>
              <input
                type="text"
                value={featureScope}
                onChange={(e) => setFeatureScope(e.target.value)}
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
            <label className="block text-xs font-semibold text-slate-300 mb-1">Test Objectives</label>
            <textarea
              rows={2}
              value={testObjectives}
              onChange={(e) => setTestObjectives(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Entry Criteria</label>
              <textarea
                rows={2}
                value={entryCriteria}
                onChange={(e) => setEntryCriteria(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Exit Criteria</label>
              <textarea
                rows={2}
                value={exitCriteria}
                onChange={(e) => setExitCriteria(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Planned Start</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Planned Completion</label>
              <input
                type="date"
                value={completionDate}
                onChange={(e) => setCompletionDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Initial Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="DRAFT">Draft</option>
                <option value="READY">Ready</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="COMPLETED">Completed</option>
              </select>
            </div>
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
              {submitting ? 'Creating...' : 'Create Test Plan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

