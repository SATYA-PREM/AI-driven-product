import React, { useState, useEffect } from 'react';
import {
  X,
  Bug,
  Send,
  GitPullRequest,
  CheckCircle2,
  AlertTriangle,
  Code,
  FileCheck2
} from 'lucide-react';
import { developerApi } from '../../../api/developer';

export default function SubmitDefectFixModal({
  isOpen,
  onClose,
  defect,
  workspaceId,
  onSaved
}) {
  const [fixSummary, setFixSummary] = useState('');
  const [prUrl, setPrUrl] = useState('');
  const [commitSha, setCommitSha] = useState('');
  const [retestInstructions, setRetestInstructions] = useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && defect) {
      setFixSummary(defect.fix_summary || '');
      setPrUrl(defect.pr_url || '');
      setCommitSha(defect.commit_sha || '');
      setRetestInstructions(defect.retest_instructions || '');
      setError(null);
      setSuccessMsg('');
    }
  }, [isOpen, defect]);

  if (!isOpen || !defect) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!fixSummary.trim()) {
      setError('Please provide a fix summary explaining the root cause and resolution.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        fix_summary: fixSummary.trim(),
        pr_url: prUrl.trim() || undefined,
        commit_sha: commitSha.trim() || undefined,
        retest_instructions: retestInstructions.trim() || undefined,
      };

      await developerApi.submitDefectFix(workspaceId, defect.defect_id, payload);
      setSuccessMsg('Defect fix submitted successfully! Status updated to IN_RETEST for QA.');
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Submit defect fix error:', err);
      setError(err.message || 'Failed to submit defect fix.');
    } finally {
      setSaving(false);
    }
  };

  const getSeverityBadge = (sev) => {
    const s = String(sev || '').toUpperCase();
    if (s === 'CRITICAL') return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (s === 'HIGH') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (s === 'MEDIUM') return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1021] border border-amber-500/30 rounded-2xl w-full max-w-xl max-h-[90vh] flex flex-col shadow-2xl shadow-amber-950/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Bug size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  Submit Defect Fix
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(defect.severity)}`}>
                  {defect.severity || 'HIGH'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Defect <span className="text-amber-400 font-mono">{defect.defect_id}</span> • {defect.title}
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

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
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

          {/* QA Defect Summary */}
          <div className="p-4 rounded-xl bg-slate-900/70 border border-white/[0.06] text-xs space-y-2">
            <div className="font-semibold text-slate-200">Defect Details:</div>
            <p className="text-slate-300 leading-relaxed">{defect.description || defect.title}</p>
            {defect.reproduction_steps && (
              <div className="pt-2 border-t border-white/[0.05]">
                <div className="text-[11px] font-semibold text-slate-400 mb-1">Steps to Reproduce:</div>
                <div className="p-2 rounded bg-slate-950/70 text-slate-300 font-mono text-[11px] whitespace-pre-wrap">
                  {defect.reproduction_steps}
                </div>
              </div>
            )}
          </div>

          {/* Fix Summary */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Fix Summary & Root Cause Explanation <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={3}
              value={fixSummary}
              onChange={(e) => setFixSummary(e.target.value)}
              placeholder="Explain how the bug was resolved (e.g. Added mutex lock around transaction retry queue)..."
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Code References */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <GitPullRequest size={13} className="text-amber-400" />
                Pull Request URL
              </label>
              <input
                type="url"
                value={prUrl}
                onChange={(e) => setPrUrl(e.target.value)}
                placeholder="https://github.com/org/repo/pull/143"
                className="w-full px-3 py-2 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Code size={13} className="text-slate-400" />
                Commit SHA
              </label>
              <input
                type="text"
                value={commitSha}
                onChange={(e) => setCommitSha(e.target.value)}
                placeholder="e.g. b8f3a1c"
                className="w-full px-3 py-2 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>
          </div>

          {/* Retest Instructions */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <FileCheck2 size={13} className="text-emerald-400" />
              Retest Instructions for QA
            </label>
            <textarea
              rows={2}
              value={retestInstructions}
              onChange={(e) => setRetestInstructions(e.target.value)}
              placeholder="e.g. Trigger rapid double clicks on checkout submit in staging sandbox; verify only 1 charge transaction is processed."
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 leading-relaxed"
            />
          </div>

          {/* Footer */}
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
              className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-amber-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting Fix...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Submit Fix for QA Retest</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

