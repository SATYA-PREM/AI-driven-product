import React, { useState, useEffect } from 'react';
import {
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  ArrowRight,
  Filter,
  Search,
  FileText,
  User,
  Calendar,
  Sparkles,
  ShieldAlert,
  MessageSquare,
  RefreshCw,
  X
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { stakeholderApi } from '../../api/stakeholder';
import { useTheme } from '../../context/ThemeContext';
import DecisionModal from './components/DecisionModal';
import StakeholderFeedbackModal from './components/StakeholderFeedbackModal';

export default function PendingApprovals() {
  const { workspaceId } = useParams();
  const { isDark } = useTheme();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Decision Modal
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const [feedbackTarget, setFeedbackTarget] = useState(null);

  const fetchApprovals = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await stakeholderApi.listApprovalRequests(
        workspaceId,
        statusFilter === 'ALL' ? undefined : statusFilter
      );
      setApprovals(Array.isArray(res) ? res : []);
    } catch (err) {
      console.error('Failed to load approval requests:', err);
      setError(err.message || 'Failed to fetch approval requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, [workspaceId, statusFilter]);

  const handleOpenDecision = (req) => {
    setSelectedApproval(req);
    setIsDecisionModalOpen(true);
  };

  const handleDecisionRecorded = () => {
    setIsDecisionModalOpen(false);
    setSelectedApproval(null);
    fetchApprovals();
  };

  const handleOpenFeedback = (req) => {
    setFeedbackTarget(req);
    setIsFeedbackOpen(true);
  };

  const filteredApprovals = approvals.filter((req) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.business_impact_summary && req.business_impact_summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.requested_by_name && req.requested_by_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
      !q ||
      req.title.toLowerCase().includes(q) ||
      (req.business_impact_summary && req.business_impact_summary.toLowerCase().includes(q)) ||
      (req.requested_by_name && req.requested_by_name.toLowerCase().includes(q)) ||
      (req.target_id && req.target_id.toLowerCase().includes(q));

    let matchesPriority = true;
    if (priorityFilter !== 'ALL') {
      const urg = (req.decision_urgency || 'MEDIUM').toUpperCase();
      matchesPriority = urg === priorityFilter;
    }

    return matchesSearch && matchesPriority;
  });

  return (
    <div className={`w-full font-sans space-y-6 pb-16 animate-fade-in ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Header */}
      <div className={`flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b ${
        isDark ? 'border-white/[0.08]' : 'border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
              isDark ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' : 'bg-amber-50 border-amber-200 text-amber-600'
            }`}>
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold tracking-tight">Pending Approvals Queue</h1>
                <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                  isDark ? 'bg-amber-500/15 text-amber-300 border-amber-500/30' : 'bg-amber-50 text-amber-800 border-amber-200'
                }`}>
                  Executive Governance
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Review business proposals, sign off on PRDs or go-to-market milestones, and record authorized decisions
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchApprovals}
            title="Refresh Approvals"
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark ? 'bg-slate-900 border-white/[0.08] hover:bg-slate-800 text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-purple-400' : ''} />
          </button>
          <Link
            to={`/workspace/${workspaceId}/stakeholder/decisions`}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-colors ${
              isDark ? 'bg-slate-800 hover:bg-slate-700/80 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <CheckCircle2 size={14} className="text-emerald-400" />
            <span>View Decision History</span>
          </Link>
        </div>
      </div>

      <div className={`flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl border shadow-sm ${
        isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
      }`}>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
          {[
            { id: 'PENDING', label: 'Pending' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'CHANGES_REQUESTED', label: 'Changes Req.' },
            { id: 'REJECTED', label: 'Rejected' },
            { id: 'ALL', label: 'All' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs outline-none transition-colors ${
              isDark ? 'bg-slate-900 border-white/[0.08] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <option value="ALL">All Urgencies</option>
            <option value="CRITICAL">Critical</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search approvals, PM, PRD..."
              className={`w-full pl-9 pr-3.5 py-2 rounded-xl text-xs border outline-none ${
                isDark
                  ? 'bg-slate-900/60 border-slate-700/80 text-slate-100 placeholder-slate-500 focus:border-purple-500'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-600'
              }`}
            />
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Approvals List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-amber-500"></div>
          </div>
        ) : filteredApprovals.length === 0 ? (
          <div className={`p-10 rounded-2xl border text-center space-y-2 ${
            isDark ? 'bg-slate-900/40 border-white/[0.06]' : 'bg-white border-slate-200'
          }`}>
            <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
            <div className="text-sm font-semibold">No approval requests in this queue</div>
            <p className={`text-xs max-w-sm mx-auto ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              There are no {statusFilter.toLowerCase()} approval items requiring action right now.
            </p>
          </div>
        ) : (
          filteredApprovals.map((req) => (
            <div
              key={req.request_id}
              className={`p-5 rounded-2xl border transition-all space-y-3 shadow-lg ${
                isDark
                  ? 'bg-slate-900/60 border-white/[0.08] hover:border-amber-500/40 shadow-black/20'
                  : 'bg-white border-slate-200 hover:border-amber-400 shadow-slate-100'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {req.request_id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {req.request_type?.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      req.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' :
                      req.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-300 border-rose-500/30' :
                      req.status === 'CHANGES_REQUESTED' ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30' :
                      'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                    }`}>
                      {req.status}
                    </span>
                    {req.decision_urgency && (
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        req.decision_urgency === 'URGENT' || req.decision_urgency === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {req.decision_urgency} URGENCY
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold leading-snug">{req.title}</h3>
                  <p className={`text-xs leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                    {req.business_impact_summary || 'Review requested for strategic alignment and business value commitment.'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {/* View PRD Button */}
                  {(req.target_type === 'PRD' || req.target_id) && (
                    <Link
                      to={`/workspace/${workspaceId}/prd/view?prdId=${req.target_id || 'PRD-01'}`}
                      className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                        isDark
                          ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-purple-400 hover:text-purple-300'
                          : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                      }`}
                      title="Inspect PRD Specifications"
                    >
                      <FileText size={13} />
                      <span>View PRD</span>
                    </Link>
                  )}

                  {/* Ask Question / Feedback Button */}
                  <button
                    type="button"
                    onClick={() => handleOpenFeedback(req)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                      isDark
                        ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300'
                        : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                    }`}
                  >
                    <MessageSquare size={13} />
                    <span>Feedback</span>
                  </button>

                  {/* Record Decision Button */}
                  {req.status === 'PENDING' ? (
                    <button
                      onClick={() => handleOpenDecision(req)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <span>Record Decision</span>
                      <ArrowRight size={13} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenDecision(req)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700' : 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-200'
                      }`}
                    >
                      <span>View Record</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Meta details footer */}
              <div className={`grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t text-[11px] ${
                isDark ? 'border-white/[0.06] text-slate-400' : 'border-slate-100 text-slate-500'
              }`}>
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-purple-400" />
                  <span>Requested By: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{req.requested_by_name || 'PM'}</strong></span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Calendar size={13} className="text-slate-400" />
                  <span>Submitted: {req.submitted_at || req.created_at?.slice(0, 10)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Clock size={13} className="text-amber-400" />
                  <span>Due Date: <strong className="text-amber-300">{req.due_date || 'Standard SLA'}</strong></span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Decision Modal */}
      {selectedApproval && (
        <DecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          approvalRequest={selectedApproval}
          workspaceId={workspaceId}
          onSuccess={handleDecisionRecorded}
        />
      )}

      {/* Strategic Feedback Modal */}
      <StakeholderFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => {
          setIsFeedbackModalOpen(false);
          setFeedbackTarget(null);
        }}
        workspaceId={workspaceId}
        initialTarget={feedbackTarget}
        onSuccess={() => fetchApprovals()}
      />
    </div>
  );
}

