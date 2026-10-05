import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Sparkles,
  Send,
  AlertTriangle,
  FileText,
  ExternalLink,
  Layers,
  Palette,
  CheckSquare,
  Link as LinkIcon
} from 'lucide-react';
import { designerApi } from '../../../api/designer';

export default function DesignResponseModal({
  isOpen,
  onClose,
  task,
  workspaceId,
  onSaved
}) {
  const [status, setStatus] = useState('IN_PROGRESS');
  const [response, setResponse] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [prototypeUrl, setPrototypeUrl] = useState('');
  const [blockerComment, setBlockerComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && task) {
      setStatus(task.status || 'IN_PROGRESS');
      setResponse(task.response || '');
      setFigmaUrl(task.figma_url || '');
      setPrototypeUrl(task.prototype_url || '');
      setBlockerComment(task.blocker_comment || '');
      setError(null);
      setSuccessMsg('');
    }
  }, [isOpen, task]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!response.trim()) {
      setError('Please provide design specifications, interaction rationale, or review notes.');
      return;
    }
    if (status === 'BLOCKED' && !blockerComment.trim()) {
      setError('Please specify the blocker reason preventing UX progress.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg('');

    try {
      const payload = {
        status,
        response: response.trim(),
        figma_url: figmaUrl.trim() || null,
        prototype_url: prototypeUrl.trim() || null,
        blocker_comment: status === 'BLOCKED' ? blockerComment.trim() : null,
      };

      const updated = await designerApi.submitResponse(
        workspaceId,
        task.assignment_id || task.id,
        payload
      );

      setSuccessMsg('Design response and assets submitted successfully!');
      if (onSaved) {
        onSaved(updated);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to submit design response. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0e1b] border border-[#1d253b] w-full max-w-3xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#182034] bg-[#0e1222] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#5b3df5]/20 border border-[#5b3df5]/40 flex items-center justify-center text-[#a78bfa] shrink-0">
              <Palette size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                  {task.requirement_id || 'REQ'}
                </span>
                <span className="text-xs text-purple-300 font-medium">
                  {task.prd_title || 'PRD'}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white truncate mt-0.5">
                {task.requirement_title || 'UX Task Specification'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Problem Statement Snippet */}
          {task.problem_statement && (
            <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Customer Problem / UX Focus
              </span>
              <p className="text-slate-300 leading-relaxed">{task.problem_statement}</p>
            </div>
          )}

          {/* Status Selection */}
          <div className="flex items-center justify-between p-4 rounded-xl bg-[#101527] border border-[#1e2744]">
            <div>
              <label className="text-xs font-bold text-white block">Design Execution Status</label>
              <span className="text-[11px] text-slate-400">Update current stage of UX & wireframe delivery</span>
            </div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="bg-[#151c33] border border-[#2a375e] rounded-xl px-3.5 py-2 text-xs font-bold text-white focus:outline-none focus:border-[#5b3df5] cursor-pointer"
            >
              <option value="NOT_STARTED">Not Started</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>

          {/* Figma Link Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <LinkIcon size={14} className="text-purple-400" />
              <span>Figma Design / Component File URL</span>
            </label>
            <input
              type="url"
              value={figmaUrl}
              onChange={(e) => setFigmaUrl(e.target.value)}
              placeholder="https://figma.com/file/..."
              className="w-full bg-[#101527] border border-[#212b45] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] transition-colors"
            />
          </div>

          {/* Prototype Link Input */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
              <ExternalLink size={14} className="text-blue-400" />
              <span>Interactive Prototype URL (Optional)</span>
            </label>
            <input
              type="url"
              value={prototypeUrl}
              onChange={(e) => setPrototypeUrl(e.target.value)}
              placeholder="https://figma.com/proto/... or https://..."
              className="w-full bg-[#101527] border border-[#212b45] rounded-xl px-3.5 py-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] transition-colors"
            />
          </div>

          {/* Design Response Notes Textarea */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
              <span>Design Specifications, Wireframe Notes & Rationale <span className="text-rose-400">*</span></span>
              <span className="text-[10px] text-slate-500 font-mono">Markdown supported</span>
            </label>
            <textarea
              rows={5}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Detail your interaction flow, mobile breakpoints, accessibility considerations, empty/error state layouts, and design tokens..."
              className="w-full bg-[#101527] border border-[#212b45] rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] transition-colors leading-relaxed font-sans"
            />
          </div>

          {/* Blocker Input if BLOCKED */}
          {status === 'BLOCKED' && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 animate-in fade-in duration-150">
              <label className="block text-xs font-bold text-rose-300 flex items-center gap-1.5">
                <AlertOctagon size={14} />
                <span>Blocker Explanation <span className="text-rose-400">*</span></span>
              </label>
              <textarea
                rows={2}
                value={blockerComment}
                onChange={(e) => setBlockerComment(e.target.value)}
                placeholder="What is blocking design completion? (e.g. Missing copy, pending API contract, brand palette ambiguity)..."
                className="w-full bg-[#151221] border border-rose-500/30 rounded-lg p-2.5 text-xs text-rose-200 placeholder-rose-300/40 focus:outline-none focus:border-rose-500"
              />
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#5b3df5] to-[#7c3aed] text-white text-xs font-bold shadow-lg shadow-[#5b3df5]/30 hover:opacity-95 disabled:opacity-50 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Save & Submit Design Response</span>
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}

