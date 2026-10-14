import React, { useState, useEffect } from 'react';
import { X, Play, CheckCircle2, XCircle, AlertOctagon, SkipForward, Camera, FileText, Bug } from 'lucide-react';
import { qaApi } from '../../../api/qa';

export default function ExecuteTestModal({
  isOpen,
  onClose,
  testCase,
  workspaceId,
  onSuccess,
  onReportDefect,
}) {
  if (!isOpen || !testCase) return null;

  const [outcome, setOutcome] = useState('PASSED');
  const [actualResults, setActualResults] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [evidenceAttachment, setEvidenceAttachment] = useState('');
  const [durationSeconds, setDurationSeconds] = useState(30);
  const [environment, setEnvironment] = useState(testCase.environment || 'Staging');
  const [stepResults, setStepResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (testCase.steps && Array.isArray(testCase.steps)) {
      setStepResults(
        testCase.steps.map((st) => ({
          step_number: st.step_number,
          action: st.action,
          expected_result: st.expected_result,
          actual_result: '',
          status: 'PASSED',
        }))
      );
    } else {
      setStepResults([]);
    }
    setActualResults('');
    setEvidenceNotes('');
    setEvidenceAttachment('');
    setOutcome('PASSED');
    setError(null);
  }, [testCase]);

  const handleStepStatusChange = (stepIdx, newStatus) => {
    const updated = [...stepResults];
    updated[stepIdx].status = newStatus;
    setStepResults(updated);

    // If any step failed, auto-suggest outcome as FAILED
    if (newStatus === 'FAILED') {
      setOutcome('FAILED');
    } else if (newStatus === 'BLOCKED') {
      setOutcome('BLOCKED');
    }
  };

  const handleStepActualResultChange = (stepIdx, text) => {
    const updated = [...stepResults];
    updated[stepIdx].actual_result = text;
    setStepResults(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!actualResults.trim()) {
      setError('Please provide the observed actual result.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const payload = {
        test_case_id: testCase.test_case_id,
        outcome,
        actual_results: actualResults.trim(),
        environment,
        step_results: stepResults,
        evidence_notes: evidenceNotes.trim() || undefined,
        evidence_attachments: evidenceAttachment.trim() ? [evidenceAttachment.trim()] : [],
        duration_seconds: parseInt(durationSeconds, 10) || 30,
      };

      const res = await qaApi.executeTestCase(workspaceId, testCase.test_case_id, payload);

      if (outcome === 'FAILED' && onReportDefect) {
        onReportDefect({
          test_case_id: testCase.test_case_id,
          execution_id: res.execution_id,
          requirement_id: testCase.requirement_id,
          criterion_id: testCase.criterion_id,
          title: `Defect in ${testCase.title}`,
          expected_result: testCase.expected_results,
          actual_result: actualResults.trim(),
          supporting_evidence: evidenceNotes.trim() || evidenceAttachment.trim(),
        });
      }

      if (onSuccess) onSuccess(res);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to record test execution');
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
              <Play size={18} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Execute Test Case</h2>
              <p className="text-xs text-slate-400">
                {testCase.test_case_id} &bull; <span className="text-slate-300">{testCase.title}</span>
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
          {/* Requirement Context */}
          <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target Environment:</span>
              <input
                type="text"
                value={environment}
                onChange={(e) => setEnvironment(e.target.value)}
                className="px-2 py-1 rounded bg-black/40 border border-white/[0.1] text-xs text-slate-200"
              />
            </div>
            <div>
              <span className="text-slate-400 font-medium">Expected Result: </span>
              <span className="text-emerald-300">{testCase.expected_results}</span>
            </div>
            {testCase.preconditions && (
              <div>
                <span className="text-slate-400 font-medium">Preconditions: </span>
                <span className="text-slate-300">{testCase.preconditions}</span>
              </div>
            )}
          </div>

          {/* Test Steps Execution Table */}
          {stepResults.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">Test Procedure Steps</label>
              <div className="space-y-2">
                {stepResults.map((step, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.06] space-y-2 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <span className="font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-300 font-bold">
                          #{step.step_number}
                        </span>
                        <div>
                          <p className="text-slate-200 font-medium">{step.action}</p>
                          <p className="text-slate-400 text-[11px] mt-0.5">Expected: {step.expected_result}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {['PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'].map((st) => (
                          <button
                            key={st}
                            type="button"
                            onClick={() => handleStepStatusChange(idx, st)}
                            className={`px-2 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                              step.status === st
                                ? st === 'PASSED'
                                  ? 'bg-emerald-600 text-white'
                                  : st === 'FAILED'
                                  ? 'bg-rose-600 text-white'
                                  : st === 'BLOCKED'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-slate-700 text-white'
                                : 'bg-white/[0.04] text-slate-400 hover:text-white'
                            }`}
                          >
                            {st}
                          </button>
                        ))}
                      </div>
                    </div>
                    <input
                      type="text"
                      placeholder="Actual step result notes (optional)..."
                      value={step.actual_result || ''}
                      onChange={(e) => handleStepActualResultChange(idx, e.target.value)}
                      className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall Execution Outcome */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Overall Test Outcome <span className="text-rose-400">*</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => setOutcome('PASSED')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  outcome === 'PASSED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm shadow-emerald-500/20'
                    : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <CheckCircle2 size={15} />
                <span>Passed</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('FAILED')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  outcome === 'FAILED'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm shadow-rose-500/20'
                    : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <XCircle size={15} />
                <span>Failed</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('BLOCKED')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  outcome === 'BLOCKED'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm shadow-amber-500/20'
                    : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <AlertOctagon size={15} />
                <span>Blocked</span>
              </button>

              <button
                type="button"
                onClick={() => setOutcome('SKIPPED')}
                className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                  outcome === 'SKIPPED'
                    ? 'bg-slate-500/20 text-slate-300 border-slate-500/50'
                    : 'bg-slate-900 border-white/[0.08] text-slate-400 hover:text-white'
                }`}
              >
                <SkipForward size={15} />
                <span>Skipped</span>
              </button>
            </div>
          </div>

          {/* Actual Results */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Recorded Actual Result <span className="text-rose-400">*</span>
            </label>
            <textarea
              required
              rows={3}
              placeholder="Describe observed behavior during testing. Detail any discrepancies against expected criteria..."
              value={actualResults}
              onChange={(e) => setActualResults(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Evidence and Logs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Execution Logs or Telemetry
              </label>
              <textarea
                rows={2}
                placeholder="Paste response code, network status, or console errors..."
                value={evidenceNotes}
                onChange={(e) => setEvidenceNotes(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Evidence URL / Screenshot Link
              </label>
              <input
                type="url"
                placeholder="https://images.example.com/evidence.png"
                value={evidenceAttachment}
                onChange={(e) => setEvidenceAttachment(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 mb-2"
              />
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Duration (seconds):</span>
                <input
                  type="number"
                  min="1"
                  value={durationSeconds}
                  onChange={(e) => setDurationSeconds(e.target.value)}
                  className="w-20 px-2 py-1 rounded bg-black/40 border border-white/[0.1] text-xs text-slate-200 text-right"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
            <div className="text-[11px] text-slate-400">
              {outcome === 'FAILED' ? (
                <span className="text-rose-400 font-medium flex items-center gap-1">
                  <Bug size={13} /> Failure will prompt defect reporting
                </span>
              ) : (
                'Execution history will be preserved immutably'
              )}
            </div>

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
                className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Recording...' : 'Record Test Result'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

