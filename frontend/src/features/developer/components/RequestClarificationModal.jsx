import React, { useState, useEffect } from 'react';
import {
  X,
  HelpCircle,
  Send,
  AlertTriangle,
  CheckCircle2,
  MessageSquare
} from 'lucide-react';
import { developerApi } from '../../../api/developer';

export default function RequestClarificationModal({
  isOpen,
  onClose,
  task,
  workspaceId,
  onSaved
}) {
  const [subject, setSubject] = useState('');
  const [question, setQuestion] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSubject('');
      setQuestion('');
      setUrgency('MEDIUM');
      setError(null);
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim() || !question.trim()) {
      setError('Please provide both a subject and your question for the PM.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        assignment_id: task.assignment_id,
        requirement_id: task.requirement_id || '',
        prd_id: task.prd_id || '',
        subject: subject.trim(),
        question: question.trim(),
        urgency: urgency,
      };

      await developerApi.requestClarification(workspaceId, payload);
      setSuccessMsg('Clarification request logged for PM review!');
      setTimeout(() => {
        if (onSaved) onSaved();
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Request clarification error:', err);
      setError(err.message || 'Failed to submit clarification request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b1021] border border-indigo-500/30 rounded-2xl w-full max-w-lg max-h-[90vh] flex flex-col shadow-2xl shadow-indigo-950/40 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <HelpCircle size={18} />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">
                Request Clarification from PM
              </h2>
              <p className="text-xs text-slate-400">
                Task <span className="text-indigo-400 font-mono">{task.assignment_id}</span>
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

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Topic / Subject <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. Edge case handling on expired payment session"
                className="w-full px-3 py-2 bg-slate-900 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Urgency
              </label>
              <select
                value={urgency}
                onChange={(e) => setUrgency(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-white/[0.08] rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Specific Question for PM / Acceptance Criteria Query <span className="text-rose-400">*</span>
            </label>
            <textarea
              rows={4}
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Explain the requirement ambiguity, scenario not covered in the PRD, or conflicting criteria..."
              className="w-full px-3.5 py-2.5 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 leading-relaxed"
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
              className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-bold text-white shadow-lg shadow-indigo-600/25 transition-all flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send size={14} />
                  <span>Send Question to PM</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

