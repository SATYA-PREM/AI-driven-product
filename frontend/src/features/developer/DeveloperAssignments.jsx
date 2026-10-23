import React, { useState, useEffect, useMemo } from 'react';
import {
  Code2,
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  HelpCircle,
  AlertOctagon,
  ExternalLink,
  GitBranch,
  RefreshCw,
  CheckSquare,
  AlertTriangle,
  Play,
  GitPullRequest,
  FileText
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { developerApi } from '../../api/developer';
import { getSessionCache } from '../../api/core';
import { useTheme } from '../../context/ThemeContext';
import SubmitImplementationModal from './components/SubmitImplementationModal';
import ReportBlockerModal from './components/ReportBlockerModal';
import RequestClarificationModal from './components/RequestClarificationModal';

export default function DeveloperAssignments() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/developer/assignments` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [assignments, setAssignments] = useState(() => (Array.isArray(initialCache) ? initialCache : []));
  const [loading, setLoading] = useState(() => !Array.isArray(initialCache));
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);

  const fetchAssignments = async () => {
    if (!workspaceId) return;
    setLoading(true);
    const cached = getSessionCache(cacheKey);
    if (!cached && assignments.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const data = await developerApi.getAssignments(workspaceId);
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.warn('Error fetching assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [workspaceId]);

  const handleStartTask = async (task) => {
    try {
      await developerApi.updateAssignmentStatus(workspaceId, task.assignment_id, {
        status: 'IN_PROGRESS',
        notes: 'Developer started feature implementation.',
      });
      fetchAssignments();
    } catch (err) {
      alert(`Could not start task: ${err.message}`);
    }
  };

  const statusCounts = useMemo(() => {
    return {
      ALL: assignments.length,
      PENDING: assignments.filter((t) => t.status === 'PENDING' || t.status === 'NOT_STARTED').length,
      IN_PROGRESS: assignments.filter((t) => t.status === 'IN_PROGRESS').length,
      IN_REVIEW: assignments.filter((t) => t.status === 'IN_REVIEW' || t.status === 'SUBMITTED_FOR_REVIEW' || t.status === 'IN_RETEST').length,
      REVISION_REQUESTED: assignments.filter((t) => t.status === 'REVISION_REQUESTED' || t.review_status === 'REVISION_REQUESTED').length,
      COMPLETED: assignments.filter((t) => t.status === 'COMPLETED' || t.status === 'APPROVED').length,
      BLOCKED: assignments.filter((t) => t.status === 'BLOCKED').length,
    };
  }, [assignments]);

  const filteredTasks = useMemo(() => {
    const list = assignments.filter((t) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'PENDING') {
          if (t.status !== 'PENDING' && t.status !== 'NOT_STARTED') return false;
        } else if (statusFilter === 'IN_REVIEW') {
          if (t.status !== 'IN_REVIEW' && t.status !== 'SUBMITTED_FOR_REVIEW' && t.status !== 'IN_RETEST') return false;
        } else if (statusFilter === 'COMPLETED') {
          if (t.status !== 'COMPLETED' && t.status !== 'APPROVED') return false;
        } else if (t.status !== statusFilter) {
          return false;
        }
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (t.feature_title || t.title || '').toLowerCase().includes(q);
        const matchId = (t.assignment_id || '').toLowerCase().includes(q);
        const matchReq = (t.requirement_id || '').toLowerCase().includes(q);
        const matchPrd = (t.prd_title || t.prd_id || '').toLowerCase().includes(q);
        const matchNotes = (t.notes || t.implementation_notes || '').toLowerCase().includes(q);
        return matchTitle || matchId || matchReq || matchPrd || matchNotes;
      }
      return true;
    });

    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return [...list].sort((a, b) => {
      const pa = priorityOrder[(a.priority || 'HIGH').toUpperCase()] ?? 4;
      const pb = priorityOrder[(b.priority || 'HIGH').toUpperCase()] ?? 4;
      return pa - pb;
    });
  }, [assignments, statusFilter, searchQuery]);

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'APPROVED') {
      return isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
    }
    if (s === 'IN_PROGRESS') {
      return isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (s === 'IN_REVIEW' || s === 'SUBMITTED_FOR_REVIEW' || s === 'IN_RETEST') {
      return isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (s === 'BLOCKED') {
      return isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200';
    }
    return isDark ? 'bg-slate-500/10 text-slate-400 border-slate-500/30' : 'bg-slate-100 text-slate-700 border-slate-200';
  };

  const getPriorityBadge = (priority) => {
    const p = String(priority || 'MEDIUM').toUpperCase();
    if (p === 'CRITICAL') {
      return isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-50 text-rose-700 border-rose-200';
    }
    if (p === 'HIGH') {
      return isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (p === 'MEDIUM') {
      return isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-200';
    }
    return isDark ? 'bg-slate-500/20 text-slate-300 border-slate-500/40' : 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className={`w-full font-sans space-y-6 pb-12 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${
        isDark ? 'border-white/[0.06]' : 'border-slate-200'
      }`}>
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Code2 className="text-purple-400" size={26} />
            My Engineering Assignments
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Technical tasks and code requirements assigned to you across active product PRDs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
              isDark 
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-200' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl p-4 shadow-sm border ${
        isDark ? 'bg-[#090d1c]/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200'
      }`}>
        {/* Status Tabs with counts */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-hide">
          {[
            { id: 'ALL', label: 'All Tasks' },
            { id: 'PENDING', label: 'Pending' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'IN_REVIEW', label: 'In Review' },
            { id: 'REVISION_REQUESTED', label: 'Revisions' },
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
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : isDark 
                      ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive 
                      ? 'bg-white/20 text-white' 
                      : isDark ? 'bg-white/[0.05] text-slate-400' : 'bg-slate-200 text-slate-700'
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
          <Search size={14} className={`absolute left-3.5 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search engineering tasks, PRDs..."
            className={`w-full border rounded-xl pl-9 pr-3.5 py-2 text-xs transition-colors outline-none ${
              isDark 
                ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-purple-500/50' 
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-600 shadow-xs'
            }`}
          />
        </div>
      </div>

      {/* Main Task List */}
      {loading ? (
        <div className={`p-16 text-center text-xs border rounded-2xl flex flex-col items-center justify-center gap-3 shadow-sm ${
          isDark ? 'text-slate-400 bg-[#090d1c]/80 border-white/[0.08]' : 'text-slate-500 bg-white border-slate-200'
        }`}>
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span>Loading engineering assignments...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className={`p-16 text-center text-xs border rounded-2xl space-y-2 shadow-sm ${
          isDark ? 'text-slate-400 bg-[#090d1c]/80 border-white/[0.08]' : 'text-slate-500 bg-white border-slate-200'
        }`}>
          <CheckSquare size={36} className={`mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>No matching assignments found</p>
          <p className={`max-w-sm mx-auto ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
            {searchQuery
              ? `No items matching "${searchQuery}" under ${statusFilter} filter.`
              : 'You have no assigned tasks matching the selected status.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isBlocked = task.status === 'BLOCKED';
            const isCompleted = task.status === 'COMPLETED' || task.status === 'APPROVED';
            const isRevision = task.status === 'REVISION_REQUESTED' || task.review_status === 'REVISION_REQUESTED';
            const isInReview = task.status === 'SUBMITTED_FOR_REVIEW' || task.status === 'IN_REVIEW' || task.review_status === 'PENDING_REVIEW';
            const pri = (task.priority || 'MEDIUM').toUpperCase();

            return (
              <div
                key={task.assignment_id}
                className={`p-5 rounded-2xl border transition-all shadow-sm ${
                  isDark
                    ? `bg-[#090d1c]/80 backdrop-blur-xl hover:border-purple-500/40 ${
                        isBlocked
                          ? 'border-rose-500/30'
                          : isRevision
                          ? 'border-amber-500/40'
                          : isCompleted
                          ? 'border-emerald-500/20'
                          : 'border-white/[0.08]'
                      }`
                    : `bg-white hover:border-purple-300 ${
                        isBlocked
                          ? 'border-rose-300 bg-rose-50/20'
                          : isRevision
                          ? 'border-amber-300 bg-amber-50/20'
                          : isCompleted
                          ? 'border-emerald-200'
                          : 'border-slate-200'
                      }`
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Context */}
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                        isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'
                      }`}>
                        {task.requirement_id || task.assignment_id || 'TASK'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${getPriorityBadge(pri)}`}>
                        {pri}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(task.status)}`}>
                        {isRevision ? `Revision Requested (#${task.revision_number || 1})` :
                         isInReview ? 'In PM Review' :
                         task.status?.replace('_', ' ') || 'ASSIGNED'}
                      </span>
                      {task.prd_id && (
                        <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          PRD: <span className="text-purple-400 font-medium">{task.prd_title || task.prd_id}</span> {task.prd_version ? `(${task.prd_version})` : ''}
                        </span>
                      )}
                    </div>

                    <h3 className={`text-sm sm:text-base font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {task.feature_title || task.title || 'Technical Requirement Implementation'}
                    </h3>

                    {(task.notes || task.implementation_notes || task.problem_statement) && (
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>Problem Context: </strong>
                        {task.problem_statement || task.notes || task.implementation_notes}
                      </p>
                    )}

                    {/* Metadata tags */}
                    <div className="flex items-center gap-3 text-xs pt-0.5 flex-wrap">
                      {task.branch_name && (
                        <span className={`font-mono text-[11px] flex items-center gap-1 px-2 py-0.5 rounded border ${
                          isDark ? 'bg-white/[0.04] text-purple-300 border-white/[0.08]' : 'bg-purple-50 text-purple-700 border-purple-200'
                        }`}>
                          <GitBranch size={11} className="text-purple-400" />
                          <span>{task.branch_name}</span>
                        </span>
                      )}
                      {task.target_date && (
                        <span className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          Target: <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>{task.target_date}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className={`flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 flex-wrap justify-end ${
                    isDark ? 'border-white/[0.05]' : 'border-slate-100'
                  }`}>
                    {/* View PRD Button */}
                    {(task.prd_id || task.prd_title) && (
                      <Link
                        to={`/workspace/${workspaceId}/prd/view?prdId=${task.prd_id || 'PRD-001'}`}
                        className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                          isDark
                            ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-purple-400 hover:text-purple-300'
                            : 'bg-white hover:bg-purple-50 border-purple-200 text-purple-700 shadow-xs'
                        }`}
                        title="View PRD Document"
                      >
                        <FileText size={13} />
                        <span>View PRD</span>
                      </Link>
                    )}

                    {/* Ask Question / Clarification Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsClarificationModalOpen(true);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isDark 
                          ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                      }`}
                    >
                      Ask Question
                    </button>

                    {/* Report Blocker Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedTask(task);
                        setIsBlockerModalOpen(true);
                      }}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isDark
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-300'
                          : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 shadow-xs'
                      }`}
                    >
                      Blocker
                    </button>

                    {/* Primary Task & Respond Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const id = task.assignment_id || task.id;
                        if (id) {
                          navigate(`/workspace/${workspaceId}/developer/assignments/${id}`);
                          return;
                        }
                        setSelectedTask(task);
                        setIsSubmitModalOpen(true);
                      }}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Task & Respond</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SubmitImplementationModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={fetchAssignments}
      />

      <ReportBlockerModal
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={fetchAssignments}
      />

      <RequestClarificationModal
        isOpen={isClarificationModalOpen}
        onClose={() => setIsClarificationModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={fetchAssignments}
      />
    </div>
  );
}
