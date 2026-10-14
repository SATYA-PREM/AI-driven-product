import React, { useState, useEffect } from 'react';
import { X, Bug, AlertTriangle, ShieldAlert } from 'lucide-react';
import { qaApi } from '../../../api/qa';

export default function CreateDefectModal({
  isOpen,
  onClose,
  workspaceId,
  initialData = {},
  onSuccess,
}) {
  if (!isOpen) return null;

  const [title, setTitle] = useState(initialData.title || '');
  const [description, setDescription] = useState(initialData.description || '');
  const [testCaseId, setTestCaseId] = useState(initialData.test_case_id || '');
  const [executionId, setExecutionId] = useState(initialData.execution_id || '');
  const [requirementId, setRequirementId] = useState(initialData.requirement_id || 'REQ-PAYMENT-RECOVERY');
  const [criterionId, setCriterionId] = useState(initialData.criterion_id || 'AC-PAYMENT-02');
  const [severity, setSeverity] = useState('HIGH');
  const [priority, setPriority] = useState('P1');
  const [environment, setEnvironment] = useState('Staging');
  const [preconditions, setPreconditions] = useState(initialData.preconditions || 'User logged in; staging network delay active.');
  const [stepsToReproduce, setStepsToReproduce] = useState(
    Array.isArray(initialData.steps_to_reproduce)
      ? initialData.steps_to_reproduce.join('\n')
      : '1. Open checkout modal with declined card\n2. Rapidly double-click "Retry with Secondary Card"\n3. Observe duplicate charge in telemetry'
  );
  const [expectedResult, setExpectedResult] = useState(initialData.expected_result || '');
  const [actualResult, setActualResult] = useState(initialData.actual_result || '');
  const [supportingEvidence, setSupportingEvidence] = useState(initialData.supporting_evidence || '');
  const [assignedDeveloper, setAssignedDeveloper] = useState('Satya Prem (Lead Developer)');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData.title) setTitle(initialData.title);
    if (initialData.test_case_id) setTestCaseId(initialData.test_case_id);
    if (initialData.execution_id) setExecutionId(initialData.execution_id);
    if (initialData.expected_result) setExpectedResult(initialData.expected_result);
    if (initialData.actual_result) setActualResult(initialData.actual_result);
    if (initialData.supporting_evidence) setSupportingEvidence(initialData.supporting_evidence);
  }, [initialData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !expectedResult.trim() || !actualResult.trim()) {
      setError('Title, expected result, and actual result are required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const stepsList = stepsToReproduce
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean);

      const payload = {
        title: title.trim(),
        description: description.trim() || undefined,
        test_case_id: testCaseId.trim() || undefined,
        execution_id: executionId.trim() || undefined,
        requirement_id: requirementId.trim() || undefined,
        criterion_id: criterionId.trim() || undefined,
        severity,
        priority,
        environment,
        preconditions: preconditions.trim() || undefined,
        steps_to_reproduce: stepsList.length > 0 ? stepsList : [stepsToReproduce],
        expected_result: expectedResult.trim(),
        actual_result: actualResult.trim(),
        supporting_evidence: supportingEvidence.trim() || undefined,
        assigned_developer: assignedDeveloper.trim() || undefined,
      };

      const res = await qaApi.createDefect(workspaceId, payload);
      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to report defect');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-[#090d1c] border border-white/[0.1] rounded-2xl shadow-2xl p-6 text-slate-100 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400">
              <Bug size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Report Quality Defect</h2>
              <p className="text-xs text-slate-400">
                Log detailed bug with reproduction steps, severity, and developer assignment
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
              Defect Title <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Idempotency key collision on rapid payment retry clicks"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Severity vs Priority Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Severity (Impact)</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="CRITICAL">Critical (Blocks Release)</option>
                <option value="HIGH">High (Major Feature Loss)</option>
                <option value="MEDIUM">Medium (Degraded Experience)</option>
                <option value="LOW">Low (Minor / Cosmetic)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Priority (Urgency)</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              >
                <option value="P1">P1 - Immediate Fix</option>
                <option value="P2">P2 - Current Sprint</option>
                <option value="P3">P3 - Next Milestone</option>
                <option value="P4">P4 - Backlog</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Environment</label>
              <input
                type="text"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Assigned Developer</label>
              <input
                type="text"
                value={assignedDeveloper}
                onChange={(e) => setAssignedDeveloper(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Traceability IDs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 rounded-xl bg-slate-900/40 border border-white/[0.06] text-xs">
            <div>
              <span className="text-slate-400">Linked Test Case:</span>
              <input
                type="text"
                placeholder="TC-001"
                value={testCaseId}
                onChange={(e) => setTestCaseId(e.target.value)}
                className="w-full mt-1 px-2 py-1 rounded bg-black/40 border border-white/[0.08] text-xs text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-400">Execution Attempt:</span>
              <input
                type="text"
                placeholder="EXEC-001"
                value={executionId}
                onChange={(e) => setExecutionId(e.target.value)}
                className="w-full mt-1 px-2 py-1 rounded bg-black/40 border border-white/[0.08] text-xs text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-400">Requirement ID:</span>
              <input
                type="text"
                placeholder="REQ-PAYMENT-RECOVERY"
                value={requirementId}
                onChange={(e) => setRequirementId(e.target.value)}
                className="w-full mt-1 px-2 py-1 rounded bg-black/40 border border-white/[0.08] text-xs text-slate-200"
              />
            </div>
          </div>

          {/* Steps to Reproduce */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Steps to Reproduce (one per line) <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="1. Step one&#10;2. Step two&#10;3. Observe bug"
              value={stepsToReproduce}
              onChange={(e) => setStepsToReproduce(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 font-mono"
            />
          </div>

          {/* Expected vs Actual Result */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Authoritative Expected Behavior <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Expected behavior based on approved acceptance criteria..."
                value={expectedResult}
                onChange={(e) => setExpectedResult(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Observed Actual Behavior <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                placeholder="Describe erroneous behavior, duplicate actions, or crashes..."
                value={actualResult}
                onChange={(e) => setActualResult(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Evidence */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Supporting Evidence / Logs / Screenshots
            </label>
            <textarea
              rows={2}
              placeholder="Paste stack traces, error payloads, or screenshot URLs..."
              value={supportingEvidence}
              onChange={(e) => setSupportingEvidence(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
            <span className="text-[11px] text-slate-400">
              Assigned developer will be notified automatically
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
                className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Reporting...' : 'Create Defect'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

