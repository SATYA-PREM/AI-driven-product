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
  AlertTriangle,
  FileText
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import { getSessionCache } from '../../api/core';
import { useTheme } from '../../context/ThemeContext';
import DesignResponseModal from './components/DesignResponseModal';

export default function DesignerAssignments() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

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
      return isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (st === 'SUBMITTED_FOR_REVIEW' || reviewStatus === 'PENDING_REVIEW') {
      return isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-200';
    }
    switch (st) {
      case 'COMPLETED':
        return isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'IN_PROGRESS':
        return isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-200';
      case 'BLOCKED':
        return isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200';
      default:
        return isDark ? 'bg-slate-500/10 text-slate-400 border-slate-500/30' : 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className={`w-full font-sans space-y-6 pb-12 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${
        isDark ? 'border-white/[0.06]' : 'border-slate-200'
      }`}>
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <ListTodo className="text-purple-500" size={26} />
            My UX Assignments
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Requirements and user flow tasks assigned to you across active product PRDs.
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
            <Sparkles size={14} className="text-purple-500" />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className={`flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 rounded-2xl p-4 shadow-sm border ${
        isDark ? 'bg-[#090d1c]/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200'
      }`}>
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
            placeholder="Search UX requirements, PRDs..."
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
          <span>Loading assignments...</span>
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
            const pri = (item.priority || 'HIGH').toUpperCase();

            return (
              <div
                key={item.assignment_id}
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
                        {item.requirement_id || 'REQ'}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                        pri === 'CRITICAL'
                          ? isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-50 text-rose-700 border-rose-200'
                          : pri === 'HIGH'
                          ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200'
                          : pri === 'MEDIUM'
                          ? isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                          : isDark ? 'bg-slate-500/20 text-slate-300 border-slate-500/40' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {pri}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${getStatusBadge(item.status, item.review_status)}`}>
                        {isRevision ? `Revision Requested (#${item.revision_count || 1})` :
                         isInReview ? 'Awaiting PM Review' :
                         item.status?.replace('_', ' ')}
                      </span>
                      {item.is_draft && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                          isDark ? 'bg-white/[0.06] text-slate-300 border-white/[0.08]' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          Draft
                        </span>
                      )}
                      <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        PRD: <span className="text-purple-400 font-medium">{item.prd_title}</span> ({item.prd_version || 'v1.0'})
                      </span>
                    </div>

                    <h3 className={`text-sm sm:text-base font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {item.requirement_title}
                    </h3>

                    {item.problem_statement && (
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        <strong className={isDark ? 'text-slate-300' : 'text-slate-700'}>Problem Context: </strong>
                        {item.problem_statement}
                      </p>
                    )}

                    {/* PM Revision Critique Alert */}
                    {isRevision && item.review_comments && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-400 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[11px]">
                          <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                          <span>PM Revision Critique:</span>
                        </div>
                        <p className={`italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{item.review_comments}</p>
                      </div>
                    )}

                    {/* Figma URL */}
                    {item.figma_url && (
                      <div className="flex items-center gap-2 pt-0.5">
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
                  </div>

                  {/* Right Actions */}
                  <div className={`flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 flex-wrap justify-end ${
                    isDark ? 'border-white/[0.05]' : 'border-slate-100'
                  }`}>
                    {/* View PRD Button */}
                    {item.prd_id && (
                      <Link
                        to={`/workspace/${workspaceId}/prd/view?prdId=${item.prd_id}`}
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

                    {/* Ask Question */}
                    <button
                      type="button"
                      onClick={() => handleOpenTask(item, 'clarification')}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        isDark 
                          ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300' 
                          : 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700 shadow-xs'
                      }`}
                    >
                      Ask Question
                    </button>

                    {/* Blocker */}
                    {!isBlocked && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleOpenTask(item, 'blocker')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isDark
                            ? 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/20 text-rose-300'
                            : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700 shadow-xs'
                        }`}
                      >
                        Blocker
                      </button>
                    )}

                    {/* Primary Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenTask(item, isRevision ? 'feedback' : 'submission')}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>
                        {isRevision ? 'Review Critique & Revise' : item.response ? 'Edit Deliverables' : 'Open Task & Respond'}
                      </span>
                      <ArrowRight size={13} />
                    </button>
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
