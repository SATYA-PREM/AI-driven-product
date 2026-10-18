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
import { useTheme } from '../../context/ThemeContext';

export default function DesignerDashboard() {
  const { isDark } = useTheme();
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
    <div className={`w-full font-sans space-y-6 pb-12 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Top Banner / Welcome */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b ${
        isDark ? 'border-white/[0.06]' : 'border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
              isDark 
                ? 'bg-purple-500/20 border border-purple-500/40 text-purple-400' 
                : 'bg-purple-50 border border-purple-200 text-purple-600 shadow-xs'
            }`}>
              <Palette size={20} />
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Designer Dashboard
            </h1>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
              isDark 
                ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' 
                : 'bg-purple-50 text-purple-700 border-purple-200'
            }`}>
              Product Designer
            </span>
          </div>
          <p className={`text-xs pl-11 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            UX and UI requirement workspace for <span className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{workspace?.name || 'Customer Intelligence'}</span>
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
            className={`px-4 py-2 rounded-xl border text-xs font-medium transition-all flex items-center gap-2 ${
              isDark 
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-200' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <Sparkles size={14} className="text-purple-500" />
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
          className={`text-left border backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all cursor-pointer ${
            isDark 
              ? `bg-[#090d1c]/80 ${statusFilter === 'ALL' ? 'border-purple-500 shadow-purple-500/20 ring-1 ring-purple-500' : 'border-white/[0.08] hover:border-white/20'}`
              : `bg-white ${statusFilter === 'ALL' ? 'border-purple-500 shadow-purple-500/15 ring-2 ring-purple-500/40' : 'border-slate-200 hover:border-purple-300 shadow-sm'}`
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Assigned Tasks</span>
            <FileText size={16} className="text-purple-500" />
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalAssigned}</span>
            <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Across active PRDs</span>
          </div>
        </button>

        {/* Pending */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'NOT_STARTED' ? 'ALL' : 'NOT_STARTED')}
          className={`text-left border backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all cursor-pointer ${
            isDark 
              ? `bg-[#090d1c]/80 ${statusFilter === 'NOT_STARTED' ? 'border-slate-400 shadow-slate-400/20 ring-1 ring-slate-400' : 'border-white/[0.08] hover:border-white/20'}`
              : `bg-white ${statusFilter === 'NOT_STARTED' ? 'border-slate-500 ring-2 ring-slate-400/40' : 'border-slate-200 hover:border-slate-300 shadow-sm'}`
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Pending</span>
            <Clock size={16} className={isDark ? "text-slate-400" : "text-slate-500"} />
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-black ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>{pendingCount}</span>
            <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>Needs UX review</span>
          </div>
        </button>

        {/* In Progress */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'IN_PROGRESS' ? 'ALL' : 'IN_PROGRESS')}
          className={`text-left border backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all cursor-pointer ${
            isDark 
              ? `bg-[#090d1c]/80 ${statusFilter === 'IN_PROGRESS' ? 'border-amber-500 shadow-amber-500/20 ring-1 ring-amber-500' : 'border-white/[0.08] hover:border-amber-500/40'}`
              : `bg-white ${statusFilter === 'IN_PROGRESS' ? 'border-amber-500 ring-2 ring-amber-400/40' : 'border-slate-200 hover:border-amber-300 shadow-sm'}`
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>In Progress</span>
            <Clock size={16} className="text-amber-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-500">{inProgCount}</span>
            <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-amber-400/80' : 'text-amber-700 font-medium'}`}>Wireframes & design</span>
          </div>
        </button>

        {/* Completed */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'COMPLETED' ? 'ALL' : 'COMPLETED')}
          className={`text-left border backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg transition-all cursor-pointer ${
            isDark 
              ? `bg-[#090d1c]/80 ${statusFilter === 'COMPLETED' ? 'border-emerald-500 shadow-emerald-500/20 ring-1 ring-emerald-500' : 'border-white/[0.08] hover:border-emerald-500/40'}`
              : `bg-white ${statusFilter === 'COMPLETED' ? 'border-emerald-500 ring-2 ring-emerald-400/40' : 'border-slate-200 hover:border-emerald-300 shadow-sm'}`
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Completed</span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-500">{completedCount}</span>
            <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-emerald-400/80' : 'text-emerald-700 font-medium'}`}>Design handoff ready</span>
          </div>
        </button>

        {/* Blocked */}
        <button
          type="button"
          onClick={() => setStatusFilter(statusFilter === 'BLOCKED' ? 'ALL' : 'BLOCKED')}
          className={`text-left border backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1 shadow-lg transition-all cursor-pointer ${
            isDark 
              ? `bg-[#090d1c]/80 ${statusFilter === 'BLOCKED' ? 'border-rose-500 shadow-rose-500/20 ring-1 ring-rose-500' : 'border-white/[0.08] hover:border-rose-500/40'}`
              : `bg-white ${statusFilter === 'BLOCKED' ? 'border-rose-500 ring-2 ring-rose-400/40' : 'border-slate-200 hover:border-rose-300 shadow-sm'}`
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-[11px] font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Blocked</span>
            <AlertOctagon size={16} className="text-rose-500" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-500">{blockedCount}</span>
            <span className={`text-[10px] block mt-0.5 ${isDark ? 'text-rose-400/80' : 'text-rose-700 font-medium'}`}>Needs PM clarification</span>
          </div>
        </button>
      </div>

      {/* Designer Objectives Guidance Card */}
      <div className={`border backdrop-blur-xl rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg ${
        isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200 shadow-sm'
      }`}>
        <div className="flex items-center gap-3.5">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDark ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400' : 'bg-purple-50 border border-purple-200 text-purple-600'
          }`}>
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <span>UX & Interaction Objectives</span>
            </h3>
            <p className={`text-xs mt-0.5 leading-relaxed max-w-4xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              {dashboardData?.role_guidance || 'Design high-fidelity user journeys, wireframes, and responsive states grounded on customer evidence and PRD acceptance criteria.'}
            </p>
          </div>
        </div>
      </div>

      {/* UX Tasks Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className={`text-base font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Assigned UX Tasks & Requirements</h2>
            <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Review assigned items, submit Figma assets, ask PM clarifications, and resolve blockers.</p>
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
                    : isDark 
                      ? 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className={`p-12 text-center text-xs border backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg ${
            isDark ? 'text-slate-400 bg-[#090d1c]/80 border-white/[0.08]' : 'text-slate-500 bg-white border-slate-200'
          }`}>
            <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <span>Loading UX tasks...</span>
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className={`p-12 text-center text-xs border backdrop-blur-xl rounded-2xl space-y-2 shadow-lg ${
            isDark ? 'text-slate-400 bg-[#090d1c]/80 border-white/[0.08]' : 'text-slate-500 bg-white border-slate-200'
          }`}>
            <CheckSquare size={32} className={`mx-auto mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
            <p className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>No UX Tasks Found</p>
            <p className={`max-w-md mx-auto ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
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
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between backdrop-blur-xl shadow-lg ${
                    isDark 
                      ? `bg-[#090d1c]/80 hover:border-purple-500/40 ${
                          isBlocked
                            ? 'border-rose-500/30'
                            : isRevision
                            ? 'border-amber-500/40'
                            : isCompleted
                            ? 'border-emerald-500/20'
                            : 'border-white/[0.08]'
                        }`
                      : `bg-white hover:border-purple-400 shadow-sm ${
                          isBlocked
                            ? 'border-rose-300 bg-rose-50/20'
                            : isRevision
                            ? 'border-amber-300 bg-amber-50/20'
                            : isCompleted
                            ? 'border-emerald-300 bg-emerald-50/20'
                            : 'border-slate-200'
                        }`
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs px-2 py-0.5 rounded font-bold ${
                          isDark ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-800 border border-slate-200'
                        }`}>
                          {task.requirement_id || 'REQ'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                          (task.priority || 'HIGH').toUpperCase() === 'CRITICAL'
                            ? isDark ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : 'bg-rose-50 text-rose-700 border-rose-200'
                            : (task.priority || 'HIGH').toUpperCase() === 'HIGH'
                            ? isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-200'
                            : (task.priority || 'HIGH').toUpperCase() === 'MEDIUM'
                            ? isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-200'
                            : isDark ? 'bg-slate-500/20 text-slate-300 border-slate-500/40' : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                          {task.priority || 'HIGH'} Priority
                        </span>
                        <span className={`text-[11px] font-medium truncate max-w-[140px] ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                          {task.prd_title || 'PRD'} ({task.prd_version || 'v1.0'})
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-wrap">
                        {isRevision ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isDark ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}>
                            Revision Requested {task.revision_count ? `(#${task.revision_count})` : ''}
                          </span>
                        ) : isInReview ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isDark ? 'bg-blue-500/20 text-blue-300 border-blue-500/40' : 'bg-blue-50 text-blue-700 border-blue-300'
                          }`}>
                            Awaiting PM Review
                          </span>
                        ) : isCompleted ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isDark ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-emerald-50 text-emerald-700 border-emerald-300'
                          }`}>
                            Completed & Handed Off
                          </span>
                        ) : isBlocked ? (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isDark ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 'bg-rose-50 text-rose-700 border-rose-300'
                          }`}>
                            Blocked
                          </span>
                        ) : (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isDark ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 'bg-amber-50 text-amber-700 border-amber-300'
                          }`}>
                            {task.status?.replace('_', ' ')}
                          </span>
                        )}

                        {task.is_draft && (
                          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            isDark ? 'bg-white/[0.06] text-slate-300' : 'bg-slate-100 text-slate-600'
                          }`}>
                            Draft
                          </span>
                        )}
                      </div>
                    </div>

                    <h3 className={`text-sm font-bold leading-snug ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {task.requirement_title}
                    </h3>

                    {task.problem_statement && (
                      <p className={`text-xs line-clamp-2 leading-relaxed ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {task.problem_statement}
                      </p>
                    )}

                    {/* Revision Feedback Alert if revision was requested */}
                    {isRevision && task.review_comments && (
                      <div className={`p-2.5 rounded-xl border text-xs space-y-1 ${
                        isDark ? 'bg-amber-500/10 border-amber-500/30 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}>
                        <div className="flex items-center gap-1.5 font-bold text-[11px]">
                          <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                          <span>PM Critique:</span>
                        </div>
                        <p className={`line-clamp-2 italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{task.review_comments}</p>
                      </div>
                    )}

                    {/* Figma URL preview if submitted */}
                    {task.figma_url && (
                      <a
                        href={task.figma_url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 text-xs text-purple-600 dark:text-purple-400 hover:underline font-mono"
                      >
                        <LinkIcon size={12} />
                        <span>Figma Design Attached</span>
                      </a>
                    )}

                    {/* Blocker alert if blocked */}
                    {isBlocked && task.blocker_comment && (
                      <div className={`p-2.5 rounded-xl border text-xs flex items-start gap-2 ${
                        isDark ? 'bg-rose-500/10 border-rose-500/20 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800'
                      }`}>
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-500" />
                        <span className="line-clamp-2">{task.blocker_comment}</span>
                      </div>
                    )}

                    {/* Design response snippet */}
                    {task.response && !isRevision && (
                      <div className={`p-2.5 rounded-xl border text-xs ${
                        isDark ? 'bg-white/[0.03] border-white/[0.06] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                      }`}>
                        <span className="text-[10px] font-bold text-purple-600 dark:text-purple-400 block mb-0.5">Design Specification:</span>
                        <p className={`line-clamp-2 italic ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>"{task.response}"</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer Actions */}
                  <div className={`pt-4 mt-3 border-t flex items-center justify-between gap-2 flex-wrap ${
                    isDark ? 'border-white/[0.05]' : 'border-slate-200'
                  }`}>
                    <span className={`text-[10px] ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
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
                            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition-all cursor-pointer border ${
                              isDark 
                                ? 'bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border-white/[0.08]' 
                                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                            }`}
                          >
                            Ask Question
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenTask(task, 'submission')}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer border ${
                              isDark 
                                ? 'bg-purple-500/15 hover:bg-purple-500/30 border-purple-500/30 text-purple-300 hover:text-white' 
                                : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                            }`}
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
