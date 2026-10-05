import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  AlertOctagon,
  HelpCircle,
  FileText,
  User,
  Sparkles,
  Send,
  AlertTriangle,
  Lightbulb,
  Layers,
  ArrowRight,
  ShieldCheck,
  CheckSquare,
  MessageSquare
} from 'lucide-react';
import { prdAssignmentApi } from '../../../api/prdAssignment';

export default function AssignmentDetailModal({
  isOpen,
  onClose,
  assignment,
  workspaceId,
  onSaved
}) {
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('IN_PROGRESS');
  const [response, setResponse] = useState('');
  const [blockerComment, setBlockerComment] = useState('');
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && assignment) {
      setDetail(assignment);
      setStatus(assignment.status || 'NOT_STARTED');
      setResponse(assignment.response || '');
      setBlockerComment(assignment.blocker_comment || '');
      setError(null);
      setSuccessMsg('');

      // Fetch enriched detail if assignment_id exists
      if (assignment.assignment_id && workspaceId) {
        setLoading(true);
        prdAssignmentApi.getAssignmentDetail(workspaceId, assignment.assignment_id)
          .then((res) => {
            if (res) {
              setDetail(res);
              if (res.status) setStatus(res.status);
              if (res.response) setResponse(res.response);
              if (res.blocker_comment) setBlockerComment(res.blocker_comment);
            }
          })
          .catch((err) => {
            console.warn('Could not fetch enriched assignment detail, using fallback:', err);
          })
          .finally(() => setLoading(false));
      }
    }
  }, [isOpen, assignment, workspaceId]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!response.trim()) {
      setError('Please provide response notes, findings, or design/implementation details before saving.');
      return;
    }
    if (status === 'BLOCKED' && !blockerComment.trim()) {
      setError('Please provide a blocker description explaining what is preventing progress.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMsg('');

    try {
      const payload = {
        status,
        response: response.trim(),
        blocker_comment: status === 'BLOCKED' ? blockerComment.trim() : null,
      };

      const updated = await prdAssignmentApi.submitMemberResponse(
        workspaceId,
        assignment.assignment_id,
        payload
      );

      setSuccessMsg('Response and status saved successfully!');
      if (onSaved) {
        onSaved(updated);
      }
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err) {
      setError(err.message || 'Failed to submit response. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (st) => {
    switch (st) {
      case 'COMPLETED':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'IN_PROGRESS':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'BLOCKED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0e1b] border border-[#1d253b] w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#182034] bg-[#0e1222] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#5b3df5]/20 border border-[#5b3df5]/40 flex items-center justify-center text-[#907aff] shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                  {detail?.requirement_id || 'REQ'}
                </span>
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${getStatusColor(detail?.status || status)}`}>
                  {detail?.status || status}
                </span>
                {detail?.team_role && (
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 capitalize">
                    {detail.team_role.replace('_', ' ')}
                  </span>
                )}
              </div>
              <h2 className="text-base font-bold text-white truncate mt-1">
                {detail?.requirement_title || 'Requirement Detail'}
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

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {loading && (
            <div className="py-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
              <div className="w-4 h-4 rounded-full border-2 border-[#5b3df5] border-t-transparent animate-spin" />
              Loading enriched product intelligence context...
            </div>
          )}

          {/* Context & Source Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-[#101526] border border-[#1c243c]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target PRD</span>
              <p className="text-xs font-semibold text-white truncate">{detail?.prd_title || 'PRD Document'}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Version: {detail?.prd_version || 'v1.0'}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#101526] border border-[#1c243c]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Assigned By</span>
              <p className="text-xs font-semibold text-white truncate">{detail?.assigned_by || 'Product Manager'}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Method: {detail?.assignment_method || 'AI Recommended'}</p>
            </div>
            <div className="p-4 rounded-xl bg-[#101526] border border-[#1c243c]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Requirement Type</span>
              <p className="text-xs font-semibold text-purple-300 capitalize">{detail?.requirement_type || 'FUNCTIONAL'}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Category: {detail?.category_id || 'General'}</p>
            </div>
          </div>

          {/* Role Responsibility Guidance Box */}
          {detail?.role_responsibility && (
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#5b3df5]/10 via-[#7c3aed]/5 to-transparent border border-[#5b3df5]/30">
              <div className="flex items-center gap-2 text-xs font-bold text-[#b49aff] mb-1.5">
                <Sparkles size={15} />
                <span>Role Responsibilities & Handoff Objectives</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {detail.role_responsibility}
              </p>
            </div>
          )}

          {/* Problem Statement & Impact */}
          {(detail?.problem_statement || detail?.customer_impact) && (
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={14} className="text-amber-400" />
                Problem Statement & Customer Impact
              </h3>
              <div className="p-4 rounded-xl bg-[#101526] border border-[#1c243c] space-y-2">
                {detail.problem_statement && (
                  <div>
                    <span className="text-[11px] font-bold text-slate-300 block mb-0.5">User Pain Point:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{detail.problem_statement}</p>
                  </div>
                )}
                {detail.customer_impact && (
                  <div className="pt-2 border-t border-white/[0.05]">
                    <span className="text-[11px] font-bold text-amber-300 block mb-0.5">Business & Customer Impact:</span>
                    <p className="text-xs text-slate-300 leading-relaxed">{detail.customer_impact}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Requirement Description */}
          {detail?.requirement_description && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers size={14} className="text-blue-400" />
                Requirement Specification
              </h3>
              <div className="p-4 rounded-xl bg-[#101526] border border-[#1c243c]">
                <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {detail.requirement_description}
                </p>
              </div>
            </div>
          )}

          {/* User Stories & Acceptance Criteria */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Acceptance Criteria */}
            <div className="p-4 rounded-xl bg-[#101526] border border-[#1c243c] space-y-2.5">
              <h4 className="text-xs font-bold text-emerald-400 flex items-center gap-1.5 uppercase tracking-wider">
                <CheckSquare size={14} />
                Acceptance Criteria
              </h4>
              {detail?.acceptance_criteria && detail.acceptance_criteria.length > 0 ? (
                <ul className="space-y-2">
                  {detail.acceptance_criteria.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-emerald-400 font-bold mt-0.5">•</span>
                      <span className="leading-snug">{item}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">No specific acceptance criteria listed for this item.</p>
              )}
            </div>

            {/* Supporting Customer Insights */}
            <div className="p-4 rounded-xl bg-[#101526] border border-[#1c243c] space-y-2.5">
              <h4 className="text-xs font-bold text-indigo-400 flex items-center gap-1.5 uppercase tracking-wider">
                <MessageSquare size={14} />
                Supporting Insights & Customer Feedback
              </h4>
              {detail?.supporting_insights && detail.supporting_insights.length > 0 ? (
                <ul className="space-y-2">
                  {detail.supporting_insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                      <span className="text-indigo-400 font-bold mt-0.5">✦</span>
                      <span className="leading-snug">{insight}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-slate-500 italic">Grounded on workspace feedback clusters and feature requests.</p>
              )}
            </div>
          </div>

          {/* Submission & Action Section */}
          <form onSubmit={handleSubmit} className="pt-4 border-t border-[#1a2237] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Send size={15} className="text-[#8c6eff]" />
                Your Response & Status Update
              </h3>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Status:</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="bg-[#141b30] border border-[#263354] rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-[#5b3df5] cursor-pointer"
                >
                  <option value="NOT_STARTED">Not Started</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="BLOCKED">Blocked</option>
                </select>
              </div>
            </div>

            {/* Response Textarea */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Response, Solution Notes, or Handoff Summary <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={4}
                value={response}
                onChange={(e) => setResponse(e.target.value)}
                placeholder="Provide your technical architecture, design specifications, test scenario results, or recommendation notes here..."
                className="w-full bg-[#101527] border border-[#212b45] rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] transition-colors leading-relaxed"
              />
            </div>

            {/* Blocker comment if BLOCKED */}
            {status === 'BLOCKED' && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-1.5 animate-in fade-in duration-150">
                <label className="block text-xs font-bold text-rose-300 flex items-center gap-1.5">
                  <AlertOctagon size={14} />
                  Blocker Explanation <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={2}
                  value={blockerComment}
                  onChange={(e) => setBlockerComment(e.target.value)}
                  placeholder="Explain why this requirement is blocked (e.g. waiting on API contract, missing UX assets, third-party dependency)..."
                  className="w-full bg-[#151221] border border-rose-500/30 rounded-lg p-2 text-xs text-rose-200 placeholder-rose-300/40 focus:outline-none focus:border-rose-500"
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

            <div className="flex items-center justify-end gap-3 pt-2">
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
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 size={14} />
                    <span>Submit Response & Update Status</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
}

