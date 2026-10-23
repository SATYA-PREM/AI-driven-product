import React, { useState, useEffect, useMemo } from 'react';
import {
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Link as LinkIcon,
  Palette,
  CheckSquare,
  Search,
  Filter,
  ChevronDown,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import { getSessionCache } from '../../api/core';
import DesignResponseModal from './components/DesignResponseModal';
import { useTheme } from '../../context/ThemeContext';

export default function DesignerAssignedPRDs() {
  const { isDark } = useTheme();
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/designer/assignments` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [tasks, setTasks] = useState(() => (Array.isArray(initialCache) ? initialCache : []));
  const [loading, setLoading] = useState(() => !Array.isArray(initialCache));
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('submission');

  // Filters
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchTasks = async () => {
    if (!workspaceId) return;
    const cached = getSessionCache(cacheKey);
    if (!cached && tasks.length === 0) {
      setLoading(true);
    }
    try {
      const res = await designerApi.getAssignments(workspaceId);
      if (Array.isArray(res)) setTasks(res);
    } catch (err) {
      console.warn('Error loading designer PRDs:', err);
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

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Priority filter
      if (priorityFilter !== 'ALL') {
        const itemPri = (t.priority || 'HIGH').toUpperCase();
        if (itemPri !== priorityFilter.toUpperCase()) return false;
      }

      // Status filter
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'REVISION_REQUESTED') {
          if (t.status !== 'REVISION_REQUESTED' && t.review_status !== 'REVISION_REQUESTED') return false;
        } else if (statusFilter === 'SUBMITTED_FOR_REVIEW') {
          if (t.status !== 'SUBMITTED_FOR_REVIEW' && t.review_status !== 'PENDING_REVIEW') return false;
        } else if (t.status !== statusFilter) {
          return false;
        }
      }

      // Search by task name, PRD name, ID, or description
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const reqTitle = (t.requirement_title || '').toLowerCase();
        const reqId = (t.requirement_id || '').toLowerCase();
        const prdTitle = (t.prd_title || '').toLowerCase();
        const prdId = (t.prd_id || '').toLowerCase();
        const prob = (t.problem_statement || '').toLowerCase();
        return (
          reqTitle.includes(q) ||
          reqId.includes(q) ||
          prdTitle.includes(q) ||
          prdId.includes(q) ||
          prob.includes(q)
        );
      }

      return true;
    });
  }, [tasks, priorityFilter, statusFilter, searchQuery]);

  // Group filtered tasks by PRD
  const prdGroups = useMemo(() => {
    const map = new Map();
    filteredTasks.forEach((t) => {
      const prdId = t.prd_id || 'general_prd';
      if (!map.has(prdId)) {
        map.set(prdId, {
          prd_id: prdId,
          prd_title: t.prd_title || 'PRD Document',
          prd_version: t.prd_version || 'v1.0',
          items: [],
        });
      }
      map.get(prdId).items.push(t);
    });

    const priorityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

    return Array.from(map.values()).map((group) => {
      // Sort tasks within each PRD group by priority
      const sortedItems = [...group.items].sort((a, b) => {
        const pa = priorityOrder[(a.priority || 'HIGH').toUpperCase()] ?? 4;
        const pb = priorityOrder[(b.priority || 'HIGH').toUpperCase()] ?? 4;
        return pa - pb;
      });
      return { ...group, items: sortedItems };
    });
  }, [filteredTasks]);

  // Priority count stats
  const priorityCounts = useMemo(() => {
    const counts = { ALL: tasks.length, CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    tasks.forEach((t) => {
      const p = (t.priority || 'HIGH').toUpperCase();
      if (counts[p] !== undefined) counts[p]++;
    });
    return counts;
  }, [tasks]);

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

  return (
    <div className={`w-full font-sans space-y-6 pb-12 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* Header */}
      <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b ${
        isDark ? 'border-white/[0.06]' : 'border-slate-200'
      }`}>
        <div>
          <h1 className={`text-2xl font-bold tracking-tight flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <FileText className="text-purple-500" size={26} />
            Assigned PRDs
          </h1>
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Product Requirements Documents containing UX specifications and wireframe requirements.
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

      {/* Filter and Search Bar */}
      <div className={`p-4 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs ${
        isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        {/* Left Side: Priority Dropdown + Status Dropdown */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Priority Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold flex items-center gap-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              <Filter size={13} className="text-purple-500" />
              <span>Priority:</span>
            </span>
            <div className="relative">
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className={`appearance-none text-xs font-bold pl-3 pr-8 py-1.5 rounded-xl border transition-colors cursor-pointer outline-none ${
                  isDark
                    ? 'bg-[#12172b] border-white/[0.12] text-white hover:border-purple-400 focus:border-purple-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-purple-300 focus:border-purple-600 shadow-xs'
                }`}
              >
                <option value="ALL">All Priorities ({priorityCounts.ALL})</option>
                <option value="CRITICAL">Critical ({priorityCounts.CRITICAL})</option>
                <option value="HIGH">High ({priorityCounts.HIGH})</option>
                <option value="MEDIUM">Medium ({priorityCounts.MEDIUM})</option>
                <option value="LOW">Low ({priorityCounts.LOW})</option>
              </select>
              <ChevronDown size={13} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
          </div>

          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className={`text-xs font-semibold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
              Status:
            </span>
            <div className="relative">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`appearance-none text-xs font-bold pl-3 pr-8 py-1.5 rounded-xl border transition-colors cursor-pointer outline-none ${
                  isDark
                    ? 'bg-[#12172b] border-white/[0.12] text-white hover:border-purple-400 focus:border-purple-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 hover:border-purple-300 focus:border-purple-600 shadow-xs'
                }`}
              >
                <option value="ALL">All Statuses</option>
                <option value="NOT_STARTED">Pending / Not Started</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="SUBMITTED_FOR_REVIEW">In PM Review</option>
                <option value="REVISION_REQUESTED">Revision Requested</option>
                <option value="COMPLETED">Completed</option>
                <option value="BLOCKED">Blocked</option>
              </select>
              <ChevronDown size={13} className={`absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            </div>
          </div>
        </div>

        {/* Right Side: Search by task or PRD name */}
        <div className="relative min-w-[260px] flex-1 sm:flex-initial">
          <Search size={13} className={`absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by task or PRD name..."
            className={`w-full rounded-xl pl-8 pr-3 py-1.5 text-xs transition-colors outline-none border ${
              isDark
                ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-purple-500/50'
                : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-500 shadow-xs'
            }`}
          />
        </div>
      </div>

      {loading ? (
        <div className={`p-16 text-center text-xs border backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg ${
          isDark ? 'text-slate-400 bg-[#090d1c]/80 border-white/[0.08]' : 'text-slate-500 bg-white border-slate-200'
        }`}>
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span>Loading assigned PRDs...</span>
        </div>
      ) : prdGroups.length === 0 ? (
        <div className={`p-16 text-center text-xs border backdrop-blur-xl rounded-2xl space-y-2 shadow-lg ${
          isDark ? 'text-slate-400 bg-[#090d1c]/80 border-white/[0.08]' : 'text-slate-500 bg-white border-slate-200'
        }`}>
          <FileText size={36} className={`mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
          <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>No Assigned PRDs Found</p>
          <p className={`max-w-sm mx-auto ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
            {searchQuery || priorityFilter !== 'ALL' || statusFilter !== 'ALL'
              ? 'No assigned PRDs match your search and filter criteria.'
              : 'You do not have any PRDs assigned for UX review or wireframe delivery in this workspace yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {prdGroups.map((group) => {
            const completedCount = group.items.filter((i) => i.status === 'COMPLETED').length;
            const total = group.items.length;
            const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

            return (
              <div
                key={group.prd_id}
                className={`border rounded-2xl p-6 space-y-4 shadow-sm transition-all ${
                  isDark ? 'bg-[#090d1c]/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                {/* PRD Header */}
                <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b ${
                  isDark ? 'border-white/[0.05]' : 'border-slate-100'
                }`}>
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className={`text-base font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{group.prd_title}</h2>
                      <span className={`text-xs font-mono px-2 py-0.5 rounded border ${
                        isDark ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {group.prd_version}
                      </span>

                      {/* View full PRD document link */}
                      {group.prd_id && (
                        <Link
                          to={`/workspace/${workspaceId}/prd/view?prdId=${group.prd_id}`}
                          className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-lg border transition-colors ${
                            isDark
                              ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-purple-400 hover:text-purple-300'
                              : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                          }`}
                          title={`View full document for ${group.prd_id}`}
                        >
                          <span>View Full PRD</span>
                          <ExternalLink size={11} />
                        </Link>
                      )}
                    </div>
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {total} UX requirement{total > 1 ? 's' : ''} assigned to you
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full sm:w-48 space-y-1.5 shrink-0">
                    <div className="flex justify-between text-[11px]">
                      <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>UX Completion</span>
                      <span className="text-emerald-500 font-bold">{progress}%</span>
                    </div>
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${isDark ? 'bg-white/[0.08]' : 'bg-slate-100'}`}>
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Requirements list */}
                <div className="space-y-3 pt-1">
                  {group.items.map((item) => {
                    const pri = (item.priority || 'HIGH').toUpperCase();

                    return (
                      <div
                        key={item.assignment_id}
                        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
                          isDark
                            ? 'bg-white/[0.03] border-white/[0.06] hover:border-purple-500/40'
                            : 'bg-slate-50/80 border-slate-200/80 hover:border-purple-300 hover:bg-white shadow-xs'
                        }`}
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                              isDark ? 'bg-white/10 text-white' : 'bg-slate-200 text-slate-800'
                            }`}>
                              {item.requirement_id || 'REQ'}
                            </span>

                            {/* Priority Badge */}
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

                            <span className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                              {item.requirement_title}
                            </span>
                          </div>
                          {item.problem_statement && (
                            <p className={`text-xs line-clamp-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{item.problem_statement}</p>
                          )}
                          {item.figma_url && (
                            <a
                              href={item.figma_url}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-1 text-[11px] font-mono underline ${
                                isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-800'
                              }`}
                            >
                              <LinkIcon size={11} />
                              <span>Figma File Linked</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                              item.status === 'COMPLETED'
                                ? isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : (item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED')
                                ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200'
                                : (item.status === 'SUBMITTED_FOR_REVIEW' || item.review_status === 'PENDING_REVIEW')
                                ? isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                                : item.status === 'BLOCKED'
                                ? isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-200'
                                : isDark ? 'bg-slate-500/10 text-slate-400 border-slate-500/30' : 'bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            {item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED'
                              ? `Revision Requested (#${item.revision_count || 1})`
                              : item.status === 'SUBMITTED_FOR_REVIEW' || item.review_status === 'PENDING_REVIEW'
                              ? 'In PM Review'
                              : item.status?.replace('_', ' ')}
                          </span>

                          {/* Show PRD of specific task button */}
                          {(item.prd_id || group.prd_id) && (
                            <Link
                              to={`/workspace/${workspaceId}/development/prd?prdId=${item.prd_id || group.prd_id}`}
                              to={`/workspace/${workspaceId}/prd/view?prdId=${item.prd_id || group.prd_id}`}
                              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 transition-all ${
                                isDark
                                  ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-purple-400 hover:text-purple-300'
                                  : 'bg-white hover:bg-purple-50 border-purple-200 text-purple-700 shadow-xs'
                              }`}
                              title={`Open PRD document: ${item.prd_id || group.prd_id}`}
                            >
                              <FileText size={12} />
                              <span className="hidden sm:inline">View PRD</span>
                            </Link>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenTask(item, 'clarification')}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                              isDark
                                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300'
                                : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
                            }`}
                          >
                            Ask Question
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenTask(item, item.status === 'REVISION_REQUESTED' ? 'feedback' : 'submission')}
                            className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-xs transition-all flex items-center gap-1 cursor-pointer"
                          >
                            <span>{item.status === 'REVISION_REQUESTED' ? 'Revise' : 'Open Task'}</span>
                            <ArrowRight size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
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
