import React, { useState, useEffect } from 'react';
import {
  Code2,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Play,
  GitPullRequest,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Layers,
  ChevronRight,
  GitBranch,
  FileCode
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { developerApi } from '../../api/developer';
import SubmitImplementationModal from './components/SubmitImplementationModal';
import ReportBlockerModal from './components/ReportBlockerModal';
import RequestClarificationModal from './components/RequestClarificationModal';

export default function DeveloperAssignments() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);

  const fetchAssignments = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await developerApi.getAssignments(workspaceId);
      setAssignments(data || []);
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

  const filteredTasks = assignments.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.feature_title || t.title || '').toLowerCase().includes(q);
      const matchId = (t.assignment_id || '').toLowerCase().includes(q);
      const matchReq = (t.requirement_id || '').toLowerCase().includes(q);
      const matchPrd = (t.prd_title || t.prd_id || '').toLowerCase().includes(q);
      return matchTitle || matchId || matchReq || matchPrd;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'APPROVED') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (s === 'IN_PROGRESS') {
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    }
    if (s === 'IN_REVIEW' || s === 'IN_RETEST') {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    if (s === 'BLOCKED') {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
    return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  };

  const getPriorityBadge = (priority) => {
    const p = String(priority || '').toUpperCase();
    if (p === 'CRITICAL') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (p === 'HIGH') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (p === 'MEDIUM') return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  };

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Code2 size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              My Engineering Assignments
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
              {assignments.length} Tasks
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Technical tasks assigned to you across approved PRDs for{' '}
            <span className="text-slate-200 font-semibold">{workspace?.name || 'Customer Intelligence'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAssignments}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
            title="Refresh assignments"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-cyan-400' : ''} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, requirement ID, PRD..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-sans"
          />
        </div>

        {/* Filter Dropdowns */}
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter size={13} />
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Priority:</span>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="bg-slate-900 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 cursor-pointer"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assignment List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading assignments...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-[#090d1c]/80 border border-white/[0.08] rounded-2xl text-slate-400 text-xs">
          No assignments match your search and filter criteria.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => (
            <div
              key={task.assignment_id}
              className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
            >
              <div className="space-y-2 min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs text-cyan-400 font-bold">
                    {task.assignment_id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(task.status)}`}>
                    {task.status || 'PENDING'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityBadge(task.priority)}`}>
                    {task.priority || 'MEDIUM'}
                  </span>
                  {task.revision_number > 0 && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-cyan-300 border border-cyan-500/20">
                      Revision #{task.revision_number}
                    </span>
                  )}
                </div>

                <h3 className="text-base font-semibold text-white">
                  {task.feature_title || task.title || 'Technical Requirement Implementation'}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {task.notes || task.implementation_notes || 'Implement and verify approved technical specifications and acceptance criteria.'}
                </p>

                <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-1">
                  <span>PRD: <span className="text-slate-300 font-medium">{task.prd_title || task.prd_id || 'Core PRD'}</span></span>
                  <span className="font-mono text-cyan-300 text-[11px]">Requirement: {task.requirement_id || 'REQ-01'}</span>
                  {task.branch_name && (
                    <span className="font-mono text-slate-300 text-[11px] flex items-center gap-1">
                      <GitBranch size={12} className="text-cyan-400" />
                      {task.branch_name}
                    </span>
                  )}
                  {task.target_date && (
                    <span className="text-slate-400 text-[11px]">Target: {task.target_date}</span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                {task.status === 'PENDING' && (
                  <button
                    onClick={() => handleStartTask(task)}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Play size={13} />
                    <span>Start Work</span>
                  </button>
                )}

                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setIsSubmitModalOpen(true);
                  }}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <GitPullRequest size={13} />
                  <span>Submit Work</span>
                </button>

                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setIsBlockerModalOpen(true);
                  }}
                  title="Report Blocker"
                  className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors cursor-pointer"
                >
                  <AlertOctagon size={16} />
                </button>

                <button
                  onClick={() => {
                    setSelectedTask(task);
                    setIsClarificationModalOpen(true);
                  }}
                  title="Request PM Clarification"
                  className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-colors cursor-pointer"
                >
                  <HelpCircle size={16} />
                </button>

                <Link
                  to={`/workspace/${workspaceId}/developer/assignments/${task.assignment_id}`}
                  className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.2] transition-colors"
                  title="Open Full Implementation Workspace"
                >
                  <ExternalLink size={16} />
                </Link>
              </div>
            </div>
          ))}
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

