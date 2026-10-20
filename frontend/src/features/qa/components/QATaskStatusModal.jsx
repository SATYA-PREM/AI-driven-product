import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  XCircle,
  AlertTriangle,
  Send,
  FileText,
  User,
  ShieldCheck,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { qaApi } from '../../../api/qa';
import { useTheme } from '../../../context/ThemeContext';

export default function QATaskStatusModal({
  isOpen,
  onClose,
  assignment,
  workspaceId,
  onSuccess,
  onClarify
}) {
  if (!isOpen || !assignment) return null;

  const { isDark } = useTheme();
  const currentStatus = (assignment.testing_status || assignment.status || 'ASSIGNED').toUpperCase();

  const [selectedStatus, setSelectedStatus] = useState(
    currentStatus === 'ASSIGNED' ? 'IN_PROGRESS' : currentStatus
  );
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const STATUS_OPTIONS = [
    {
      id: 'IN_PROGRESS',
      label: 'In Progress',
      desc: 'Active testing, test verification, or scenario execution currently running.',
      icon: Clock,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
    },
    {
      id: 'COMPLETED',
      label: 'Completed / QA Passed',
      desc: 'All acceptance criteria and test cases validated with zero blocking issues.',
      icon: CheckCircle2,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
    },
    {
      id: 'REJECTED',
      label: 'Rejected / Blocked',
      desc: 'Test failed, acceptance criteria unmet, or major defects blocking completion.',
      icon: XCircle,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30'
    }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (selectedStatus === 'REJECTED' && !rejectionReason.trim()) {
      setError('Please provide a reason or rejection defect summary.');
      return;
    }

    setSubmitting(true);
    try {
      const combinedNotes = selectedStatus === 'REJECTED'
        ? `[REJECTED/BLOCKED]: ${rejectionReason.trim()} ${notes ? `| Details: ${notes.trim()}` : ''}`
        : notes.trim() || undefined;

      await qaApi.updateAssignmentStatus(workspaceId, assignment.assignment_id, {
        status: selectedStatus,
        notes: combinedNotes
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error('Failed to update QA task status:', err);
      setError(err.message || 'Failed to update status');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className={`w-full max-w-lg rounded-2xl border p-6 shadow-2xl space-y-5 ${
          isDark ? 'bg-[#0f1422] border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <ShieldCheck size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">Manage QA Task Status</h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Update testing progress or reject/block assignment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-all`}
          >
            <X size={18} />
          </button>
        </div>

        {/* Task summary */}
        <div
          className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
            isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-slate-50 border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="font-mono text-purple-400 font-bold">{assignment.assignment_id}</span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                assignment.priority === 'P1' || assignment.priority === 'CRITICAL'
                  ? 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                  : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
              }`}
            >
              {assignment.priority || 'P1'}
            </span>
          </div>
          <h4 className="font-bold text-sm">{assignment.task_title || assignment.requirement_title}</h4>
          <p className={`line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {assignment.description || assignment.scope}
          </p>

          <div className="flex items-center justify-between pt-2 border-t border-slate-700/30 text-[11px]">
            {assignment.prd_id && (
              <Link
                to={`/workspace/${workspaceId}/prd/view?prdId=${assignment.prd_id}`}
                className="text-purple-400 hover:underline flex items-center gap-1"
              >
                <FileText size={12} />
                <span>{assignment.prd_title || assignment.prd_id}</span>
              </Link>
            )}
            {onClarify && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onClarify(assignment.requirement_id);
                }}
                className={`text-slate-400 hover:text-purple-300 flex items-center gap-1`}
              >
                <HelpCircle size={12} />
                <span>Ask PM Question</span>
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Status Selection */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400">Choose Testing Status *</label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {STATUS_OPTIONS.map((opt) => {
                const isSelected = selectedStatus === opt.id;
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedStatus(opt.id)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                      isSelected
                        ? isDark
                          ? 'border-purple-500 bg-purple-500/15 text-white'
                          : 'border-purple-600 bg-purple-50 text-slate-900 shadow-sm'
                        : isDark
                        ? 'border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <Icon size={14} className={isSelected ? 'text-purple-400' : 'opacity-70'} />
                      <span className="text-xs font-bold">{opt.label}</span>
                    </div>
                    <span className="text-[10px] leading-tight opacity-80">{opt.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rejection / Block Reason (Visible only when REJECTED is selected) */}
          {selectedStatus === 'REJECTED' && (
            <div className="space-y-1.5 animate-fade-in">
              <label className="block text-xs font-bold text-rose-400 flex items-center gap-1">
                <AlertTriangle size={13} />
                <span>Reason for Rejection / Failure *</span>
              </label>
              <textarea
                required
                rows={2}
                placeholder="Describe why acceptance criteria failed, defects discovered, or what blocked completion..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className={`w-full px-3 py-2 rounded-xl text-xs border ${
                  isDark
                    ? 'bg-slate-900 border-rose-500/40 text-white placeholder-slate-500'
                    : 'bg-rose-50/40 border-rose-300 text-slate-900 placeholder-slate-400'
                } outline-none focus:border-rose-500`}
              />
            </div>
          )}

          {/* Progress Notes */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400">
              Progress & Validation Notes (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Summary of executed test cases, observed latency, edge cases verified..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={`w-full px-3 py-2 rounded-xl text-xs border ${
                isDark
                  ? 'bg-slate-900 border-slate-700 text-white placeholder-slate-500'
                  : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'
              } outline-none focus:border-purple-500`}
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700/50">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs font-medium border ${
                isDark ? 'border-slate-800 hover:bg-slate-800 text-slate-400' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 transition-all cursor-pointer ${
                selectedStatus === 'REJECTED'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                  : 'bg-[#5b3df5] hover:bg-[#4a2ee3] shadow-purple-600/30'
              }`}
            >
              <Send size={13} />
              <span>{submitting ? 'Updating...' : `Set as ${selectedStatus.replace('_', ' ')}`}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

