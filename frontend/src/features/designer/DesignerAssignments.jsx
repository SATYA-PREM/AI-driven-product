import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  Link as LinkIcon,
  ListTodo,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import { getSessionCache } from '../../api/core';
import DesignResponseModal from './components/DesignResponseModal';

export default function DesignerAssignments() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/designer/assignments` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [tasks, setTasks] = useState(() => (Array.isArray(initialCache) ? initialCache : []));
  const [loading, setLoading] = useState(() => !Array.isArray(initialCache));
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('submission');

  const fetchTasks = async () => {
    if (!workspaceId) return;
    setLoading(true);
    const cached = getSessionCache(cacheKey);
    if (!cached && tasks.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await designerApi.getAssignments(workspaceId);
      setTasks(Array.isArray(res) ? res : []);
      if (Array.isArray(res)) setTasks(res);
    } catch (err) {
      console.warn('Error fetching designer assignments:', err);
      setError(err.message || 'Failed to load assignments');
      if (tasks.length === 0) setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const onCacheUpdate = (e) => {
      if (e.detail?.endpoint === cacheKey && Array.isArray(e.detail?.data)) {
        setTasks(e.detail.data);
      }
    };
    window.addEventListener('cache_updated', onCacheUpdate);
    return () => window.removeEventListener('cache_updated', onCacheUpdate);
  }, [workspaceId]);

  const filteredTasks = useMemo(() => {
    const list = tasks.filter((item) => {
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'REVISION_REQUESTED') {
          if (item.status !== 'REVISION_REQUESTED' && item.review_status !== 'REVISION_REQUESTED') return false;
        } else if (statusFilter === 'SUBMITTED_FOR_REVIEW') {
          if (item.status !== 'SUBMITTED_FOR_REVIEW' && item.review_status !== 'PENDING_REVIEW') return false;
        } else if (item.status !== statusFilter) {
          return false;
        }
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

    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
    return [...list].sort((a, b) => {
      const pa = priorityOrder[(a.priority || 'HIGH').toUpperCase()] ?? 4;
      const pb = priorityOrder[(b.priority || 'HIGH').toUpperCase()] ?? 4;
      return pa - pb;
    });
  }, [tasks, statusFilter, searchQuery]);

  const handleOpenTask = (task, tab = 'submission') => {
    const id = task.assignment_id || task.id || task.requirement_id;
    if (id) {
      navigate(`/workspace/${workspaceId}/designer/assignments/${id}?tab=${tab}`);
      return;
    }
    setSelectedTask(task);
    setModalInitialTab(tab);
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    fetchTasks();
  };

  const statusCounts = {
    ALL: tasks.length,
    NOT_STARTED: tasks.filter((a) => a.status === 'NOT_STARTED').length,
    IN_PROGRESS: tasks.filter((a) => a.status === 'IN_PROGRESS').length,
    SUBMITTED_FOR_REVIEW: tasks.filter((a) => a.status === 'SUBMITTED_FOR_REVIEW' || a.review_status === 'PENDING_REVIEW').length,
    REVISION_REQUESTED: tasks.filter((a) => a.status === 'REVISION_REQUESTED' || a.review_status === 'REVISION_REQUESTED').length,
    COMPLETED: tasks.filter((a) => a.status === 'COMPLETED').length,
    BLOCKED: tasks.filter((a) => a.status === 'BLOCKED').length,
  };

  const getStatusBadge = (st, reviewStatus) => {
    if (st === 'REVISION_REQUESTED' || reviewStatus === 'REVISION_REQUESTED') {
      return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
    }
    if (st === 'SUBMITTED_FOR_REVIEW' || reviewStatus === 'PENDING_REVIEW') {
      return 'bg-blue-500/20 text-blue-300 border-blue-500/40';
    }
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <ListTodo className="text-purple-400" size={26} />
            My UX Assignments
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Requirements and user flow tasks assigned to you across active product PRDs.
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
            { id: 'SUBMITTED_FOR_REVIEW', label: 'In Review' },
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
            placeholder="Search UX requirements, PRDs..."
            className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 transition-colors"
          />
        </div>
      </div>

      {/* Main Task List */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg">
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span>Loading assignments...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
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
          {filteredTasks.map((item) => {
            const isBlocked = item.status === 'BLOCKED';
            const isCompleted = item.status === 'COMPLETED';
            const isRevision = item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED';
            const isInReview = item.status === 'SUBMITTED_FOR_REVIEW' || item.review_status === 'PENDING_REVIEW';

            return (
              <div
                key={item.assignment_id}
                className={`p-5 rounded-2xl border transition-all bg-[#090d1c]/80 backdrop-blur-xl hover:border-purple-500/40 shadow-lg ${
                  isBlocked
                    ? 'border-rose-500/30'
                    : isRevision
                    ? 'border-amber-500/40'
                    : isCompleted
                    ? 'border-emerald-500/20'
                    : 'border-white/[0.08]'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left Context */}
                  <div className="space-y-2 max-w-3xl">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                        {item.requirement_id || 'REQ'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        (item.priority || 'HIGH').toUpperCase() === 'CRITICAL'
                          ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                          : (item.priority || 'HIGH').toUpperCase() === 'HIGH'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                          : (item.priority || 'HIGH').toUpperCase() === 'MEDIUM'
                          ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                          : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                      }`}>
                        {item.priority || 'HIGH'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${getStatusBadge(item.status, item.review_status)}`}>
                        {isRevision ? `Revision Requested (#${item.revision_count || 1})` :
                         isInReview ? 'Awaiting PM Review' :
                         item.status?.replace('_', ' ')}
                      </span>
                      {item.is_draft && (
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">
                          Draft
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        PRD: <span className="text-purple-300 font-medium">{item.prd_title}</span> ({item.prd_version})
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">
                      {item.requirement_title}
                    </h3>

                    {item.problem_statement && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        <strong className="text-slate-300">Problem Context: </strong>
                        {item.problem_statement}
                      </p>
                    )}

                    {/* PM Revision Critique Alert */}
                    {isRevision && item.review_comments && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[11px]">
                          <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                          <span>PM Revision Critique:</span>
                        </div>
                        <p className="text-slate-300 italic">{item.review_comments}</p>
                      </div>
                    )}

                    {/* Figma URL / Deliverables preview */}
                    {item.figma_url && (
                      <div className="flex items-center gap-2 pt-1">
                        <a
                          href={item.figma_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 font-mono underline"
                        >
                          <LinkIcon size={12} />
                          <span>Figma File</span>
                        </a>
                      </div>
                    )}

                    {item.deliverables && item.deliverables.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-0.5">
                        {item.deliverables.map((d, dIdx) => (
                          <span key={dIdx} className="text-[10px] px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20 text-purple-300 font-mono">
                            {d.title || d.deliverable_type}
                          </span>
                        ))}
                      </div>
                    )}

                    {isBlocked && item.blocker_comment && (
                      <div className="p-2 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                        <span><strong>Blocker:</strong> {item.blocker_comment}</span>
                      </div>
                    )}

                    {item.response && !isRevision && (
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
                        <span className="text-[10px] font-bold text-purple-400 block mb-0.5">Design Specification:</span>
                        <p className="italic text-slate-300 line-clamp-2 leading-relaxed">"{item.response}"</p>
                      </div>
                    )}
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-white/[0.05] flex-wrap justify-end">
                    {isRevision ? (
                      <button
                        type="button"
                        onClick={() => handleOpenTask(item, 'feedback')}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/25 transition-all flex items-center gap-2 cursor-pointer"
                      >
                        <span>Review Critique & Revise</span>
                        <ArrowRight size={14} />
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenTask(item, 'clarification')}
                          className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                        >
                          Ask Question
                        </button>
                        {!isBlocked && !isCompleted && (
                          <button
                            type="button"
                            onClick={() => handleOpenTask(item, 'blocker')}
                            className="px-3 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-semibold text-rose-300 transition-all cursor-pointer"
                          >
                            Blocker
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleOpenTask(item, 'submission')}
                          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer"
                        >
                          <span>{item.response ? 'Edit Deliverables' : 'Open Task & Respond'}</span>
                          <ArrowRight size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Response Modal */}
      <DesignResponseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={handleSaved}
        initialTab={modalInitialTab}
      />
    </div>
  );
}
