import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  ListTodo,
  CheckSquare
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { prdAssignmentApi } from '../../api/prdAssignment';
import AssignmentDetailModal from './components/AssignmentDetailModal';

export default function MyAssignmentsPage() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAssignments = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await prdAssignmentApi.getMyAssignments(workspaceId);
      setAssignments(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Error fetching my assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [workspaceId]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const reqTitle = (item.requirement_title || '').toLowerCase();
        const reqId = (item.requirement_id || '').toLowerCase();
        const prdTitle = (item.prd_title || '').toLowerCase();
        const desc = (item.requirement_description || '').toLowerCase();
        const prob = (item.problem_statement || '').toLowerCase();
        return (
          reqTitle.includes(q) ||
          reqId.includes(q) ||
          prdTitle.includes(q) ||
          desc.includes(q) ||
          prob.includes(q)
        );
      }
      return true;
    });
  }, [assignments, statusFilter, searchQuery]);

  const handleOpenModal = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleSaved = (updated) => {
    setAssignments((prev) =>
      prev.map((item) =>
        item.assignment_id === updated.assignment_id ? { ...item, ...updated } : item
      )
    );
  };

  const statusCounts = {
    ALL: assignments.length,
    NOT_STARTED: assignments.filter((a) => a.status === 'NOT_STARTED').length,
    IN_PROGRESS: assignments.filter((a) => a.status === 'IN_PROGRESS').length,
    COMPLETED: assignments.filter((a) => a.status === 'COMPLETED').length,
    BLOCKED: assignments.filter((a) => a.status === 'BLOCKED').length,
  };

  const getStatusBadge = (st) => {
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
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <ListTodo className="text-purple-400" size={26} />
            My Assigned Requirements
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Review requirement specifications, check supporting customer insights, and submit your team response.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 shadow-lg">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          {[
            { id: 'ALL', label: 'All Tasks' },
            { id: 'NOT_STARTED', label: 'Pending' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'BLOCKED', label: 'Blocked' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            const count = statusCounts[tab.id] || 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-[#5b3df5] text-white shadow-md shadow-[#5b3df5]/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white/[0.05] text-slate-400'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Box */}
        <div className="relative min-w-[260px]">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search requirements, PRDs..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Main List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg">
          <div className="w-6 h-6 rounded-full border-2 border-[#5b3df5] border-t-transparent animate-spin" />
          <span>Loading assignments...</span>
        </div>
      ) : filteredAssignments.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl space-y-2 shadow-lg">
          <CheckSquare size={36} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-300">No matching assignments found</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            {searchQuery
              ? `No items matching "${searchQuery}" under ${statusFilter} filter.`
              : 'You have no assigned items matching the selected status.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredAssignments.map((item) => {
            const isBlocked = item.status === 'BLOCKED';
            const isCompleted = item.status === 'COMPLETED';
            const isInProg = item.status === 'IN_PROGRESS';

            return (
              <div
                key={item.assignment_id}
                className={`p-5 rounded-2xl border transition-all bg-[#090d1c]/80 backdrop-blur-xl hover:border-purple-500/40 shadow-lg ${
                  isBlocked
                    ? 'border-rose-500/30'
                    : isCompleted
                    ? 'border-emerald-500/20'
                    : 'border-white/[0.08]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Context & Info */}
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                        {item.requirement_id || 'REQ'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${getStatusBadge(item.status)}`}>
                        {item.status?.replace('_', ' ')}
                      </span>
                      <span className="text-xs text-slate-400">
                        PRD: <span className="text-purple-300 font-medium">{item.prd_title || 'PRD Document'}</span> ({item.prd_version || 'v1.0'})
                      </span>
                      <span className="text-xs text-slate-500">•</span>
                      <span className="text-xs text-slate-400 capitalize">
                        Role: <span className="text-slate-300">{item.team_role?.replace('_', ' ')}</span>
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">
                      {item.requirement_title || 'Requirement Title'}
                    </h3>

                    {item.problem_statement && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        <strong className="text-slate-300">Problem Context: </strong>
                        {item.problem_statement}
                      </p>
                    )}

                    {isBlocked && item.blocker_comment && (
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                        <span><strong>Blocker:</strong> {item.blocker_comment}</span>
                      </div>
                    )}

                    {item.response && (
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
                        <span className="text-[10px] font-bold text-emerald-400 block mb-0.5">Your Response / Submission:</span>
                        <p className="italic text-slate-300 line-clamp-2 leading-relaxed">"{item.response}"</p>
                      </div>
                    )}
                  </div>

                  {/* Right Action buttons */}
                  <div className="flex items-center gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.05]">
                    <button
                      type="button"
                      onClick={() => handleOpenModal(item)}
                      className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#5b3df5] to-[#7c3aed] text-white text-xs font-bold shadow-lg shadow-[#5b3df5]/25 hover:opacity-95 transition-all flex items-center gap-2 cursor-pointer"
                    >
                      <span>{item.response ? 'Edit Response' : 'Open Task & Respond'}</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Detail Modal */}
      <AssignmentDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={selectedAssignment}
        workspaceId={workspaceId}
        onSaved={handleSaved}
      />
    </div>
  );
}
