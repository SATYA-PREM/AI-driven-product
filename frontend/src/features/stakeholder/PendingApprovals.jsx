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
  ShieldAlert
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { stakeholderApi } from '../../api/stakeholder';
import DecisionModal from './components/DecisionModal';

export default function PendingApprovals() {
  const { workspaceId } = useParams();
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('PENDING');
  const [searchQuery, setSearchQuery] = useState('');

  // Decision Modal
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);

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

  const filteredApprovals = approvals.filter((req) => {
    const matchesSearch =
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (req.business_impact_summary && req.business_impact_summary.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (req.requested_by_name && req.requested_by_name.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Clock size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Pending Approvals Queue</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Authorized Decisions
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Review business proposals, sign off on PRDs or go-to-market milestones, and record authorized decisions
              </p>
            </div>
          </div>
        </div>

        {/* Traceability Link to Decision History */}
        <Link
          to={`/workspace/${workspaceId}/stakeholder/decisions`}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-2 transition-colors"
        >
          <CheckCircle2 size={14} className="text-emerald-400" />
          <span>View Decision History</span>
        </Link>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search approvals by title, PM, impact..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
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
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
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
          <div className="p-10 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center space-y-2">
            <CheckCircle2 size={36} className="mx-auto text-emerald-400" />
            <div className="text-sm font-semibold text-white">No approval requests in this queue</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              There are no {statusFilter.toLowerCase()} approval items requiring action right now.
            </p>
          </div>
        ) : (
          filteredApprovals.map((req) => (
            <div
              key={req.request_id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-amber-500/40 transition-all space-y-3 shadow-lg shadow-black/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {req.request_id}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      {req.request_type?.replace(/_/g, ' ')}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      req.status === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                      req.status === 'REJECTED' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
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

                  <h3 className="text-base font-bold text-white leading-snug">{req.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    {req.business_impact_summary || 'Review requested for strategic alignment and business value commitment.'}
                  </p>
                </div>

                <div className="shrink-0">
                  {req.status === 'PENDING' ? (
                    <button
                      onClick={() => handleOpenDecision(req)}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/25 flex items-center gap-2 transition-all"
                    >
                      <span>Record Decision</span>
                      <ArrowRight size={14} />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleOpenDecision(req)}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-slate-700 transition-colors"
                    >
                      <span>View Decision Record</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Meta details footer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-3 border-t border-white/[0.06] text-[11px] text-slate-400">
                <div className="flex items-center gap-1.5">
                  <User size={13} className="text-purple-400" />
                  <span>Requested By: <strong className="text-slate-300">{req.requested_by_name || 'PM'}</strong></span>
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
    </div>
  );
}

