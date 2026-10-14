import React, { useState, useEffect } from 'react';
import {
  Palette,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileText,
  Sparkles,
  ArrowRight,
  Link as LinkIcon,
  ListTodo,
  CheckSquare,
  AlertTriangle
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { designerApi } from '../../api/designer';
import { getSessionCache } from '../../api/core';
import DesignResponseModal from './components/DesignResponseModal';

export default function DesignerDashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/designer/dashboard` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [dashboardData, setDashboardData] = useState(() => initialCache);
  const [loading, setLoading] = useState(() => !initialCache);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('submission');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchDashboard = async () => {
    if (!workspaceId) return;
    setLoading(true);
    const cached = getSessionCache(cacheKey);
    if (!cached && !dashboardData) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await designerApi.getDashboard(workspaceId);
      setDashboardData(res || null);
      if (res) setDashboardData(res);
    } catch (err) {
      console.warn('Error fetching designer dashboard:', err);
      setError(err.message || 'Failed to load designer dashboard');
      if (!dashboardData) setError(err.message || 'Failed to load designer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    // Listen for background cache updates from preloader / SWR
    const onCacheUpdate = (e) => {
      if (e.detail?.endpoint === cacheKey && e.detail?.data) {
        setDashboardData(e.detail.data);
      }
    };
    window.addEventListener('cache_updated', onCacheUpdate);
    return () => window.removeEventListener('cache_updated', onCacheUpdate);
  }, [workspaceId]);

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
    fetchDashboard();
  };

  const totalAssigned = dashboardData?.total_assigned ?? 0;
  const pendingCount = dashboardData?.pending_count ?? 0;
  const inProgCount = dashboardData?.in_progress_count ?? 0;
  const completedCount = dashboardData?.completed_count ?? 0;
  const blockedCount = dashboardData?.blocked_count ?? 0;
  const recentTasks = dashboardData?.recent_tasks || [];

  const filteredTasks = recentTasks.filter((task) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'REVISION_REQUESTED') {
      return task.status === 'REVISION_REQUESTED' || task.review_status === 'REVISION_REQUESTED';
    }
    return task.status === statusFilter;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Palette size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Designer Dashboard
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Product Designer
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            UX and UI requirement workspace for <span className="text-slate-200 font-semibold">{workspace?.name || 'Customer Intelligence'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/workspace/${workspaceId}/designer/assignments`}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ListTodo size={14} />
            <span>My UX Assignments</span>
          </Link>
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Tasks */}
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`text-left bg-[#090d1c]/80 border backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'border-purple-500 shadow-purple-500/20 ring-1 ring-purple-500'
              : 'border-white/[0.08] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Assigned Tasks</span>
            <FileText size={16} className="text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{totalAssigned}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Across active PRDs</span>
          </div>
        </button>

        {/* Pending */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'NOT_STARTED' ? 'ALL' : 'NOT_STARTED')}
          className={`text-left bg-[#090d1c]/80 border backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all cursor-pointer ${
            statusFilter === 'NOT_STARTED'
              ? 'border-slate-400 shadow-slate-400/20 ring-1 ring-slate-400'
              : 'border-white/[0.08] hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
            <Clock size={16} className="text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-200">{pendingCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Needs UX review</span>
          </div>
        </button>

        {/* In Progress */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`text-left bg-[#090d1c]/80 border backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all cursor-pointer ${
            statusFilter === 'IN_PROGRESS'
              ? 'border-amber-500 shadow-amber-500/20 ring-1 ring-amber-500'
              : 'border-white/[0.08] hover:border-amber-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-400">{inProgCount}</span>
            <span className="text-[10px] text-amber-500/80 block mt-0.5">Wireframes & design</span>
          </div>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`text-left bg-[#090d1c]/80 border backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all cursor-pointer ${
            statusFilter === 'COMPLETED'
              ? 'border-emerald-500 shadow-emerald-500/20 ring-1 ring-emerald-500'
              : 'border-white/[0.08] hover:border-emerald-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-400">{completedCount}</span>
            <span className="text-[10px] text-emerald-500/80 block mt-0.5">Design handoff ready</span>
          </div>
        </button>

        {/* Blocked */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'BLOCKED' ? 'ALL' : 'BLOCKED')}
          className={`text-left bg-[#090d1c]/80 border backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1 shadow-lg transition-all cursor-pointer ${
            statusFilter === 'BLOCKED'
              ? 'border-rose-500 shadow-rose-500/20 ring-1 ring-rose-500'
              : 'border-white/[0.08] hover:border-rose-500/40'
          }`}
        >
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Blocked</span>
            <AlertOctagon size={16} className="text-rose-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-400">{blockedCount}</span>
            <span className="text-[10px] text-rose-500/80 block mt-0.5">Needs PM clarification</span>
          </div>
        </button>
      </div>

      {/* Designer Objectives Guidance Card */}
      <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>UX & Interaction Objectives</span>
            </h3>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed max-w-4xl">
              {dashboardData?.role_guidance || 'Design high-fidelity user journeys, wireframes, and responsive states grounded on customer evidence and PRD acceptance criteria.'}
            </p>
          </div>
        </div>
      </div>

      {/* UX Tasks Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Assigned UX Tasks & Requirements</h2>
            <p className="text-xs text-slate-400">Review assigned items, submit Figma assets, ask PM clarifications, and resolve blockers.</p>
          </div>
          
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'NOT_STARTED', label: 'Pending' },
              { id: 'IN_PROGRESS', label: 'In Progress' },
              { id: 'REVISION_REQUESTED', label: 'Revisions' },
              { id: 'COMPLETED', label: 'Completed' },
              { id: 'BLOCKED', label: 'Blocked' },
            ].map(tab => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  statusFilter === tab.id
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg">
            <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <span>Loading UX tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl space-y-2 shadow-lg">
            <CheckSquare size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-300">No UX Tasks Found</p>
            <p className="text-slate-500 max-w-md mx-auto">
              {statusFilter !== 'ALL'
                ? `No tasks currently matching the "${statusFilter.replace('_', ' ')}" filter.`
                : 'You do not have any UX requirements assigned under your role in this workspace yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTasks.map((task) => {
              const isBlocked = task.status === 'BLOCKED';
              const isCompleted = task.status === 'COMPLETED';
              const isInProg = task.status === 'IN_PROGRESS';
              const isRevision = task.status === 'REVISION_REQUESTED' || task.review_status === 'REVISION_REQUESTED';
              const isInReview = task.status === 'SUBMITTED_FOR_REVIEW' || task.review_status === 'PENDING_REVIEW';

              return (
                <div
                  key={task.assignment_id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between bg-[#090d1c]/80 backdrop-blur-xl hover:border-purple-500/40 shadow-lg ${
                    isBlocked
                      ? 'border-rose-500/30'
                      : isRevision
                      ? 'border-amber-500/40'
                      : isCompleted
                      ? 'border-emerald-500/20'
                      : 'border-white/[0.08]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                          {task.requirement_id || 'REQ'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          (task.priority || 'HIGH').toUpperCase() === 'CRITICAL'
                            ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                            : (task.priority || 'HIGH').toUpperCase() === 'HIGH'
                            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                            : (task.priority || 'HIGH').toUpperCase() === 'MEDIUM'
                            ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                            : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
                        }`}>
                          {task.priority || 'HIGH'} Priority
                        </span>
                        <span className="text-[11px] text-purple-300 font-medium truncate max-w-[140px]">
                          {task.prd_title || 'PRD'} ({task.prd_version || 'v1.0'})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isRevision ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            Revision Requested {task.revision_count ? `(#${task.revision_count})` : ''}
                          </span>
                        ) : isInReview ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40">
                            Awaiting PM Review
                          </span>
                        ) : isCompleted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                            Completed & Handed Off
                          </span>
                        ) : isBlocked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            Blocked
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30">
                            {task.status?.replace('_', ' ')}
                          </span>
                        )}

                        {task.is_draft && (
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.06] text-slate-300">
                            Draft
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">
                      {task.requirement_title}
                    </h3>

                    {task.problem_statement && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {task.problem_statement}
                      </p>
                    )}

                    {/* Revision Feedback Alert if revision was requested */}
                    {isRevision && task.review_comments && (
                      <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300 space-y-1">
                        <div className="flex items-center gap-1.5 font-bold text-[11px]">
                          <AlertTriangle size={13} className="text-amber-400 shrink-0" />
                          <span>PM Critique:</span>
                        </div>
                        <p className="line-clamp-2 text-slate-300 italic">{task.review_comments}</p>
                      </div>
                    )}

                    {/* Figma URL preview if submitted */}
                    {task.figma_url && (
                      <a
                        href={task.figma_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-mono underline"
                      >
                        <LinkIcon size={12} />
                        <span>Figma Design Attached</span>
                      </a>
                    )}

                    {/* Blocker alert if blocked */}
                    {isBlocked && task.blocker_comment && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                        <span className="line-clamp-2">{task.blocker_comment}</span>
                      </div>
                    )}

                    {/* Design response snippet */}
                    {task.response && !isRevision && (
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
                        <span className="text-[10px] font-bold text-purple-400 block mb-0.5">Design Specification:</span>
                        <p className="line-clamp-2 italic text-slate-300">"{task.response}"</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-4 mt-3 border-t border-white/[0.05] flex items-center justify-between gap-2 flex-wrap">
                    <span className="text-[10px] text-slate-500">
                      Assigned by {task.assigned_by || 'PM'}
                    </span>

                    <div className="flex items-center gap-2">
                      {isRevision ? (
                        <button
                          type="button"
                          onClick={() => handleOpenTask(task, 'feedback')}
                          className="px-3.5 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-600/30"
                        >
                          <span>Review Critique & Revise</span>
                          <ArrowRight size={13} />
                        </button>
                      ) : (
                        <>
                          <button
                            type="button"
                            onClick={() => handleOpenTask(task, 'clarification')}
                            className="px-2.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-[11px] font-semibold text-slate-300 transition-all cursor-pointer"
                          >
                            Ask Question
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenTask(task, 'submission')}
                            className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold text-purple-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                          >
                            <span>Open Task</span>
                            <ArrowRight size={13} />
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
      </div>

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
