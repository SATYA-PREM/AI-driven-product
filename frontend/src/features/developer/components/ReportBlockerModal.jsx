import React, { useState, useEffect } from 'react';
import {
  X,
  AlertOctagon,
  Send,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert
} from 'lucide-react';
import { developerApi } from '../../../api/developer';

export default function ReportBlockerModal({
  isOpen,
  onClose,
  task,
  workspaceId,
  onSaved
}) {
  const [blockerSummary, setBlockerSummary] = useState('');
  const [impactLevel, setImpactLevel] = useState('HIGH');
  const [category, setCategory] = useState('DESIGN_DEPENDENCY');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setBlockerSummary('');
      setImpactLevel('HIGH');
      setCategory('DESIGN_DEPENDENCY');
      setError(null);
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!blockerSummary.trim()) {
      setError('Please describe what is blocking this task.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        assignment_id: task.assignment_id,
        requirement_id: task.requirement_id || '',
        prd_id: task.prd_id || '',
        blocker_summary: blockerSummary.trim(),
        impact_level: impactLevel,
        category: category,
      };

      await developerApi.reportBlocker(workspaceId, payload);
      setSuccessMsg('Blocker logged and task marked as BLOCKED. PM notified.');
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Report blocker error:', err);
      setError(err.message || 'Failed to log blocker.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1021] border border-rose-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl shadow-rose-950/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertOctagon size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Report Blocker or Dependency
              </h2>
              <p className="text-xs text-slate-400">
                Task <span className="text-rose-400 font-mono">{task.assignment_id}</span>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Blocker Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="DESIGN_DEPENDENCY">Design Specs Incomplete</option>
                <option value="BACKEND_API">Backend / Upstream API</option>
                <option value="THIRD_PARTY_SERVICE">Third-Party Gateway / SDK</option>
                <option value="INFRASTRUCTURE">Environment / Secrets / CI</option>
                <option value="REQUIREMENT_UNCLEAR">Ambiguous Requirement</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Impact Level
              </label>
              <select
                value={impactLevel}
                onChange={(e) => setImpactLevel(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="CRITICAL">Critical (Completely Stalled)</option>
                <option value="HIGH">High (Major Feature Blocked)</option>
                <option value="MEDIUM">Medium (Workaround Available)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Blocker Details & Action Needed <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={blockerSummary}
              onChange={(e) => setBlockerSummary(e.target.value)}
              placeholder="State what is blocking development and what decision or deliverable is needed from the PM, Designer, or External team to resume..."
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 leading-relaxed"
            />
          </div>

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
              className="px-5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-rose-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Logging...</span>
                </>
              ) : (
                <>
                  <AlertOctagon size={14} />
                  <span>Set Task Blocked & Notify PM</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

