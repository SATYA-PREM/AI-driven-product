import React, { useState, useEffect } from 'react';
import {
  X,
  Send,
  GitPullRequest,
  GitBranch,
  FileCode,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { developerApi } from '../../../api/developer';

export default function SubmitImplementationModal({
  isOpen,
  onClose,
  task,
  workspaceId,
  onSaved
}) {
  const [branchName, setBranchName] = useState('');
  const [repositoryUrl, setRepositoryUrl] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [previewUrl, setPreviewUrl] = useState('');
  const [implementationNotes, setImplementationNotes] = useState('');
  const [testNotes, setTestNotes] = useState('');
  const [limitations, setLimitations] = useState('');
  const [flagQaRetest, setFlagQaRetest] = useState(true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && task) {
      setBranchName(task.branch_name || `feature/${(task.requirement_id || 'task').toLowerCase()}`);
      setRepositoryUrl(task.repository_url || '');
      setPrUrl(task.pr_url || '');
      setCommitSha(task.commit_sha || '');
      setPreviewUrl(task.preview_url || '');
      setImplementationNotes(task.implementation_notes || '');
      setTestNotes(task.test_notes || '');
      setLimitations(task.limitations || '');
      setFlagQaRetest(true);
      setError(null);
      setSuccessMsg('');
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!implementationNotes.trim()) {
      setError('Please provide implementation notes summarizing your changes.');
      return;
    }
    if (!branchName.trim() && !prUrl.trim() && !commitSha.trim()) {
      setError('Please provide at least a Git Branch, Pull Request URL, or Commit SHA.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        assignment_id: task.assignment_id,
        requirement_id: task.requirement_id || '',
        prd_id: task.prd_id || '',
        branch_name: branchName.trim() || undefined,
        repository_url: repositoryUrl.trim() || undefined,
        pr_url: prUrl.trim() || undefined,
        commit_sha: commitSha.trim() || undefined,
        preview_url: previewUrl.trim() || undefined,
        implementation_notes: implementationNotes.trim(),
        test_notes: testNotes.trim() || undefined,
        limitations: limitations.trim() || undefined,
        flag_for_qa_retest: flagQaRetest,
      };

      await developerApi.submitImplementation(workspaceId, payload);
      setSuccessMsg('Implementation submitted successfully for review and QA verification!');
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Submit implementation error:', err);
      setError(err.message || 'Failed to submit implementation work.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1021] border border-cyan-500/30 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl shadow-cyan-950/50 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <GitPullRequest size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Submit Implementation for Review & QA
              </h2>
              <p className="text-xs text-slate-400">
                Task <span className="text-cyan-400 font-mono font-medium">{task.assignment_id}</span> • {task.feature_title || task.title || 'Feature Work'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle size={16} className="shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Context Banner */}
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Target PRD:</span>
              <span className="text-slate-200 font-medium">{task.prd_title || task.prd_id || 'Core PRD'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Requirement ID:</span>
              <span className="font-mono text-cyan-300">{task.requirement_id || 'REQ-DEV-01'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Current Status:</span>
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {task.status || 'IN_PROGRESS'}
              </span>
            </div>
          </div>

          {/* Code References */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <GitBranch size={13} className="text-cyan-400" />
                Git Branch Name
              </label>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g. feature/stripe-webhook-handler"
                className="w-full px-3 py-2 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <GitPullRequest size={13} className="text-cyan-400" />
                Pull Request / Review Link
              </label>
              <input
                type="url"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/org/repo/pull/142"
                className="w-full px-3 py-2 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileCode size={13} className="text-slate-400" />
                Repository URL
              </label>
              <input
                type="url"
                value={repositoryUrl}
                onChange={(e) => setRepositoryUrl(e.target.value)}
                placeholder="https://github.com/org/payment-service"
                className="w-full px-3 py-2 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <ExternalLink size={13} className="text-slate-400" />
                Commit SHA or Staging Build URL
              </label>
              <input
                type="text"
                value={commitSha}
                onChange={(e) => setCommitSha(e.target.value)}
                placeholder="e.g. 7f9a2b8 or staging.prodai.app/build/49"
                className="w-full px-3 py-2 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
          </div>

          {/* Implementation Notes */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Technical Implementation Details & Architecture Notes <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={implementationNotes}
              onChange={(e) => setImplementationNotes(e.target.value)}
              placeholder="Describe components modified, API contracts implemented, database migrations applied, and security considerations..."
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          {/* Local Testing Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Verification & Local Testing Summary
            </label>
            <textarea
              rows={2}
              value={testNotes}
              onChange={(e) => setTestNotes(e.target.value)}
              placeholder="Unit test coverage (e.g. 94%), edge cases verified, payload mocks tested..."
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
            />
          </div>

          {/* Known Limitations & Next Steps */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Known Limitations or Follow-up Items
            </label>
            <input
              type="text"
              value={limitations}
              onChange={(e) => setLimitations(e.target.value)}
              placeholder="Optional: Redis cache invalidation planned in subtask #2; requires env secret update"
              className="w-full px-3 py-2 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* QA Flag */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/30">
            <input
              type="checkbox"
              id="flagQa"
              checked={flagQaRetest}
              onChange={(e) => setFlagQaRetest(e.target.checked)}
              className="w-4 h-4 rounded text-cyan-500 focus:ring-0 bg-slate-900 border-white/[0.2] cursor-pointer"
            />
            <label htmlFor="flagQa" className="text-xs text-slate-300 cursor-pointer select-none">
              <span className="font-semibold text-white">Route for QA Verification:</span> Notify QA team to conduct acceptance criteria verification.
            </label>
          </div>

          {/* Footer Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-white/[0.08]">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit Work (Creates Revision)</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

