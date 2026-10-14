import React, { useState, useEffect } from 'react';
import {
  Play,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  SkipForward,
  Bug,
  Clock,
  History,
  Camera,
  FileText,
  ChevronRight,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { getCurrentUser } from '../../utils/workspaceAccess';
import { qaApi } from '../../api/qa';
import CreateDefectModal from './components/CreateDefectModal';

export default function QATestExecution() {
  const { workspaceId } = useParams();
  const [searchParams] = useSearchParams();
  const currentUser = getCurrentUser();

  const [testCases, setTestCases] = useState([]);
  const [selectedCaseId, setSelectedCaseId] = useState(searchParams.get('test_case_id') || '');
  const [currentTestCase, setCurrentTestCase] = useState(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [outcome, setOutcome] = useState('PASSED');
  const [actualResults, setActualResults] = useState('');
  const [evidenceNotes, setEvidenceNotes] = useState('');
  const [evidenceAttachment, setEvidenceAttachment] = useState('');
  const [environment, setEnvironment] = useState('Staging');
  const [durationSeconds, setDurationSeconds] = useState(45);
  const [stepResults, setStepResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [notification, setNotification] = useState(null);

  // Defect Modal
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectInitialData, setDefectInitialData] = useState({});

  // 1. Fetch available test cases
  useEffect(() => {
    async function loadCases() {
      if (!workspaceId) return;
      try {
        const list = await qaApi.getTestCases(workspaceId);
        setTestCases(list || []);
        if (!selectedCaseId && list && list.length > 0) {
          setSelectedCaseId(list[0].test_case_id);
        }
      } catch (err) {
        console.warn('Failed to load test cases:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCases();
  }, [workspaceId]);

  // 2. Fetch specific test case detail and history when selectedCaseId changes
  useEffect(() => {
    async function loadDetail() {
      if (!workspaceId || !selectedCaseId) return;
      try {
        const detail = await qaApi.getTestCaseDetail(workspaceId, selectedCaseId);
        setCurrentTestCase(detail || null);
        setExecutionHistory(detail?.execution_history || []);
        setEnvironment(detail?.environment || 'Staging');

        if (detail?.steps && Array.isArray(detail.steps)) {
          setStepResults(
            detail.steps.map((st) => ({
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
        setNotification(null);
      } catch (err) {
        console.warn('Failed to load test case detail:', err);
      }
    }
    loadDetail();
  }, [workspaceId, selectedCaseId]);

  const handleStepStatusChange = (idx, newStatus) => {
    const updated = [...stepResults];
    updated[idx].status = newStatus;
    setStepResults(updated);

    if (newStatus === 'FAILED') setOutcome('FAILED');
    else if (newStatus === 'BLOCKED') setOutcome('BLOCKED');
  };

  const handleStepActualResultChange = (idx, text) => {
    const updated = [...stepResults];
    updated[idx].actual_result = text;
    setStepResults(updated);
  };

  const handleExecute = async (e) => {
    e.preventDefault();
    if (!actualResults.trim()) {
      alert('Please enter observed actual result.');
      return;
    }

    setSubmitting(true);
    setNotification(null);

    try {
      const payload = {
        test_case_id: selectedCaseId,
        outcome,
        actual_results: actualResults.trim(),
        environment,
        step_results: stepResults,
        evidence_notes: evidenceNotes.trim() || undefined,
        evidence_attachments: evidenceAttachment.trim() ? [evidenceAttachment.trim()] : [],
        duration_seconds: parseInt(durationSeconds, 10) || 30,
      };

      const res = await qaApi.executeTestCase(workspaceId, selectedCaseId, payload);
      setNotification({
        type: outcome === 'PASSED' ? 'success' : 'warning',
        message: `Execution attempt #${res.attempt_number} recorded as ${outcome}!`,
      });

      // Reload detail & history
      const updatedDetail = await qaApi.getTestCaseDetail(workspaceId, selectedCaseId);
      setCurrentTestCase(updatedDetail);
      setExecutionHistory(updatedDetail?.execution_history || []);

      if (outcome === 'FAILED') {
        setDefectInitialData({
          test_case_id: selectedCaseId,
          execution_id: res.execution_id,
          requirement_id: currentTestCase?.requirement_id,
          criterion_id: currentTestCase?.criterion_id,
          title: `Defect in ${currentTestCase?.title}`,
          expected_result: currentTestCase?.expected_results,
          actual_result: actualResults.trim(),
          supporting_evidence: evidenceNotes.trim() || evidenceAttachment.trim(),
        });
      }
    } catch (err) {
      alert(`Execution record failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const attemptNumber = (executionHistory.length || 0) + 1;

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Link
              to={`/workspace/${workspaceId}/qa/test-cases`}
              className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Play size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Test Execution Workspace
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              Attempt #{attemptNumber}
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Execute step procedures, log actual observed results, record immutable evidence, and file defects
          </p>
        </div>

        {/* Test Case Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCaseId}
            onChange={(e) => setSelectedCaseId(e.target.value)}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500 max-w-xs"
          >
            {testCases.map((tc) => (
              <option key={tc.test_case_id} value={tc.test_case_id}>
                {tc.test_case_id} - {tc.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      {notification && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center justify-between ${
            notification.type === 'success'
              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/15 text-rose-300 border-rose-500/30'
          }`}
        >
          <span>{notification.message}</span>
          {outcome === 'FAILED' && (
            <button
              onClick={() => setIsDefectModalOpen(true)}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Bug size={13} />
              <span>Report Defect Now</span>
            </button>
          )}
        </div>
      )}

      {/* Main Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Execution Form & Interactive Steps */}
        <div className="lg:col-span-2 space-y-4">
          {currentTestCase ? (
            <form onSubmit={handleExecute} className="space-y-4">
              {/* Execution Header Card */}
              <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-white/[0.06]">
                  <div>
                    <span className="font-mono text-xs font-bold text-purple-400">
                      {currentTestCase.test_case_id}
                    </span>
                    <h2 className="text-base font-bold text-white mt-0.5">
                      {currentTestCase.title}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Environment:</span>
                    <input
                      type="text"
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value)}
                      className="px-2.5 py-1 rounded bg-slate-900 border border-white/[0.1] text-xs text-slate-200"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px]">Requirement</span>
                    <span className="font-mono text-purple-300 font-bold">{currentTestCase.requirement_id || 'REQ-01'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Criterion</span>
                    <span className="text-slate-200 font-medium">{currentTestCase.criterion_id || 'AC-01'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Target PRD</span>
                    <span className="text-slate-200 font-medium">{currentTestCase.prd_id || 'PRD-001'} ({currentTestCase.prd_version || 'v1.0'})</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px]">Tester</span>
                    <span className="text-slate-200 font-medium">{currentUser?.name || 'Satya Prem (QA Lead)'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] text-xs space-y-1">
                  <span className="text-slate-400 font-medium block">Authoritative Expected Result:</span>
                  <p className="text-emerald-300">{currentTestCase.expected_results}</p>
                </div>
              </div>

              {/* Step Execution Checklist */}
              {stepResults.length > 0 && (
                <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3.5">
                  <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Interactive Step Procedure
                  </h3>

                  <div className="space-y-3">
                    {stepResults.map((step, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2.5 text-xs"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-start gap-2">
                            <span className="font-mono text-xs font-bold px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                              #{step.step_number}
                            </span>
                            <div>
                              <p className="text-slate-100 font-semibold">{step.action}</p>
                              <p className="text-[11px] text-slate-400 mt-0.5">
                                Expected: <span className="text-slate-300">{step.expected_result}</span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {['PASSED', 'FAILED', 'BLOCKED', 'SKIPPED'].map((st) => (
                              <button
                                key={st}
                                type="button"
                                onClick={() => handleStepStatusChange(idx, st)}
                                className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                                  step.status === st
                                    ? st === 'PASSED'
                                      ? 'bg-emerald-600 text-white shadow-xs'
                                      : st === 'FAILED'
                                      ? 'bg-rose-600 text-white shadow-xs'
                                      : st === 'BLOCKED'
                                      ? 'bg-amber-600 text-white shadow-xs'
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
                          placeholder="Observed actual step behavior (optional)..."
                          value={step.actual_result || ''}
                          onChange={(e) => handleStepActualResultChange(idx, e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg bg-black/40 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Overall Outcome & Evidence Form */}
              <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-4">
                <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Overall Outcome & Evidence
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Execution Outcome <span className="text-rose-400">*</span>
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      type="button"
                      onClick={() => setOutcome('PASSED')}
                      className={`py-2 px-3 rounded-xl border flex items-center justify-center gap-1.5 text-xs font-bold transition-all cursor-pointer ${
                        outcome === 'PASSED'
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
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
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/50 shadow-sm'
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
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
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

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Recorded Actual Result <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Document exact observed behavior during execution. Mention network payloads, UI timings, or error banners..."
                    value={actualResults}
                    onChange={(e) => setActualResults(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Execution Logs / Error Messages
                    </label>
                    <textarea
                      rows={2}
                      placeholder="Paste response payload or console errors..."
                      value={evidenceNotes}
                      onChange={(e) => setEvidenceNotes(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">
                      Screenshot / Attachment Link
                    </label>
                    <input
                      type="url"
                      placeholder="https://images.example.com/evidence.png"
                      value={evidenceAttachment}
                      onChange={(e) => setEvidenceAttachment(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 mb-2"
                    />
                    <div className="flex items-center justify-between text-xs text-slate-400">
                      <span>Execution Duration (sec):</span>
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

                <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    Saves new execution record and preserves all prior attempts
                  </span>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Play size={13} />
                    <span>{submitting ? 'Recording...' : 'Commit Execution'}</span>
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs">
              Select a test case to begin execution.
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Execution History & Audit */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <History size={16} className="text-purple-400" />
                <span>Execution History ({executionHistory.length})</span>
              </h3>
            </div>

            {executionHistory.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                No prior execution records. This test case has not been executed yet.
              </div>
            ) : (
              <div className="space-y-3">
                {executionHistory.map((ex, idx) => (
                  <div
                    key={ex.execution_id || idx}
                    className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-purple-300 font-bold">
                        Attempt #{ex.attempt_number || executionHistory.length - idx}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          ex.outcome === 'PASSED'
                            ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                            : ex.outcome === 'FAILED'
                            ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                            : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                        }`}
                      >
                        {ex.outcome}
                      </span>
                    </div>

                    <p className="text-slate-300 text-[11px] line-clamp-2">
                      {ex.actual_results}
                    </p>

                    <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-white/[0.04]">
                      <span>{ex.executed_by || 'QA Lead'}</span>
                      <span>{ex.executed_at?.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Defect Modal */}
      <CreateDefectModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        workspaceId={workspaceId}
        initialData={defectInitialData}
        onSuccess={() => {}}
      />
    </div>
  );
}

