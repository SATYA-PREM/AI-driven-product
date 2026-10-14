import React, { useState } from 'react';
import { X, Plus, Trash2, CheckSquare, Layers } from 'lucide-react';
import { qaApi } from '../../../api/qa';

export default function CreateTestCaseModal({
  isOpen,
  onClose,
  workspaceId,
  suites = [],
  requirements = [],
  onSuccess,
}) {
  if (!isOpen) return null;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [requirementId, setRequirementId] = useState(requirements[0]?.requirement_id || 'REQ-PAYMENT-RECOVERY');
  const [criterionId, setCriterionId] = useState('');
  const [preconditions, setPreconditions] = useState('');
  const [testType, setTestType] = useState('FUNCTIONAL');
  const [priority, setPriority] = useState('P2');
  const [environment, setEnvironment] = useState('Staging');
  const [suiteId, setSuiteId] = useState(suites[0]?.suite_id || '');
  const [expectedResults, setExpectedResults] = useState('');
  const [steps, setSteps] = useState([
    { step_number: 1, action: '', expected_result: '' },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleAddStep = () => {
    setSteps([
      ...steps,
      { step_number: steps.length + 1, action: '', expected_result: '' },
    ]);
  };

  const handleRemoveStep = (idx) => {
    if (steps.length <= 1) return;
    const updated = steps.filter((_, i) => i !== idx).map((s, i) => ({ ...s, step_number: i + 1 }));
    setSteps(updated);
  };

  const handleStepChange = (idx, field, val) => {
    const updated = [...steps];
    updated[idx][field] = val;
    setSteps(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !expectedResults.trim()) {
      setError('Title and Expected Results are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        requirement_id: requirementId || undefined,
        criterion_id: criterionId || undefined,
        preconditions: preconditions.trim() || undefined,
        steps: steps.filter((s) => s.action.trim()),
        expected_results: expectedResults.trim(),
        test_type: testType,
        priority: priority,
        environment: environment,
        suite_id: suiteId || undefined,
      };

      const res = await qaApi.createTestCase(workspaceId, payload);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create test case');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#090d1c] border border-white/[0.1] rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400">
              <CheckSquare size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Author New Test Case</h2>
              <p className="text-xs text-slate-400">
                Define test conditions, preconditions, and step procedure against requirements
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
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Test Case Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Verify payment retry idempotency token handling under 3G latency"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Grid Settings */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Test Type</label>
              <select
                value={testType}
                onChange={(e) => setTestType(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="FUNCTIONAL">Functional</option>
                <option value="INTEGRATION">Integration</option>
                <option value="REGRESSION">Regression</option>
                <option value="SECURITY">Security</option>
                <option value="ACCESSIBILITY">Accessibility</option>
                <option value="PERFORMANCE">Performance</option>
                <option value="API_VALIDATION">API Validation</option>
                <option value="USABILITY">Usability</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="P1">P1 - Critical Path</option>
                <option value="P2">P2 - Core Requirement</option>
                <option value="P3">P3 - Edge Case</option>
                <option value="P4">P4 - Low / Cosmetic</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Test Suite</label>
              <select
                value={suiteId}
                onChange={(e) => setSuiteId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="">(No specific suite)</option>
                {suites.map((s) => (
                  <option key={s.suite_id} value={s.suite_id}>
                    {s.suite_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Requirement Link */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Linked Requirement</label>
              <input
                type="text"
                placeholder="REQ-PAYMENT-RECOVERY"
                value={requirementId}
                onChange={(e) => setRequirementId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Acceptance Criterion ID</label>
              <input
                type="text"
                placeholder="AC-PAYMENT-01"
                value={criterionId}
                onChange={(e) => setCriterionId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Preconditions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Preconditions</label>
            <input
              type="text"
              placeholder="e.g. Customer has logged in and has two valid credit cards on file in Staging environment"
              value={preconditions}
              onChange={(e) => setPreconditions(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Dynamic Test Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Test Procedure Steps</label>
              <button
                type="button"
                onClick={handleAddStep}
                className="px-2.5 py-1 rounded-lg bg-purple-500/15 text-purple-300 hover:bg-purple-500/25 border border-purple-500/30 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Plus size={13} />
                <span>Add Step</span>
              </button>
            </div>

            <div className="space-y-2">
              {steps.map((st, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-purple-300">Step #{st.step_number}</span>
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveStep(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    required
                    placeholder="Action to perform (e.g. Click 'Retry with Secondary Card')"
                    value={st.action}
                    onChange={(e) => handleStepChange(idx, 'action', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Expected step outcome (e.g. Card decline banner vanishes, spinner loads in < 150ms)"
                    value={st.expected_result}
                    onChange={(e) => handleStepChange(idx, 'expected_result', e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Expected Results */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Overall Authoritative Expected Result <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={2}
              placeholder="State the final verifiable product behavior according to approved acceptance criteria..."
              value={expectedResults}
              onChange={(e) => setExpectedResults(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Footer Actions */}
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
              {submitting ? 'Creating...' : 'Create Test Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

