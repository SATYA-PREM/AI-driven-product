import React, { useState, useEffect } from 'react';
import {
  Palette,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileText,
  Sparkles,
  ArrowRight,
  Send,
  Link as LinkIcon,
  ExternalLink,
  Layers,
  CheckSquare,
  MessageSquare,
  ListTodo,
  TrendingUp,
  AlertTriangle
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { designerApi } from '../../api/designer';
import DesignResponseModal from './components/DesignResponseModal';

export default function DesignerDashboard() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchDashboard = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await designerApi.getDashboard(workspaceId);
      setDashboardData(res || null);
    } catch (err) {
      console.warn('Error fetching designer dashboard:', err);
      setError(err.message || 'Failed to load designer dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [workspaceId]);

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaved = (updated) => {
    fetchDashboard();
  };

  const totalAssigned = dashboardData?.total_assigned ?? 0;
  const pendingCount = dashboardData?.pending_count ?? 0;
  const inProgCount = dashboardData?.in_progress_count ?? 0;
  const completedCount = dashboardData?.completed_count ?? 0;
  const blockedCount = dashboardData?.blocked_count ?? 0;
  const recentTasks = dashboardData?.recent_tasks || [];

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 p-6 md:p-8 font-sans space-y-8">
      
      {/* Top Banner / Welcome */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#141b2d]">
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
            className="px-4 py-2 rounded-xl bg-[#5b3df5] hover:bg-[#4d30e3] text-xs font-bold text-white shadow-lg shadow-[#5b3df5]/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ListTodo size={14} />
            <span>My UX Assignments</span>
          </Link>
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-4 py-2 rounded-xl bg-[#121729] hover:bg-[#1a223c] border border-[#212c49] text-xs font-medium text-slate-200 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        
        {/* Total Tasks */}
        <div className="bg-[#0e1322] border border-[#1a233b] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Assigned Tasks</span>
            <FileText size={16} className="text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{totalAssigned}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Across active PRDs</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-[#0e1322] border border-[#1a233b] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
            <Clock size={16} className="text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-200">{pendingCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Needs UX review</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-[#0e1322] border border-[#1a233b] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-400">{inProgCount}</span>
            <span className="text-[10px] text-amber-500/80 block mt-0.5">Wireframes & design</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-[#0e1322] border border-[#1a233b] rounded-2xl p-4 flex flex-col justify-between">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-400">{completedCount}</span>
            <span className="text-[10px] text-emerald-500/80 block mt-0.5">Design handoff ready</span>
          </div>
        </div>

        {/* Blocked */}
        <div className="bg-[#0e1322] border border-[#1a233b] rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Blocked</span>
            <AlertOctagon size={16} className="text-rose-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-400">{blockedCount}</span>
            <span className="text-[10px] text-rose-500/80 block mt-0.5">Needs PM clarification</span>
          </div>
        </div>

      </div>

      {/* Designer Objectives Guidance Card */}
      <div className="bg-gradient-to-r from-purple-950/30 via-[#101426] to-[#0d1020] border border-purple-500/25 rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Assigned UX Tasks & Requirements</h2>
            <p className="text-xs text-slate-400">Review assigned items and attach Figma links or design specifications.</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            {recentTasks.length} total tasks
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-[#0e1322] border border-[#1a233b] rounded-2xl flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 rounded-full border-2 border-[#5b3df5] border-t-transparent animate-spin" />
            <span>Loading UX tasks...</span>
          </div>
        ) : recentTasks.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-[#0e1322] border border-[#1a233b] rounded-2xl space-y-2">
            <CheckSquare size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-300">No UX Tasks Assigned</p>
            <p className="text-slate-500 max-w-md mx-auto">
              You do not have any requirements assigned under your role in this workspace yet. When the PM assigns PRD items, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentTasks.map((task) => {
              const isBlocked = task.status === 'BLOCKED';
              const isCompleted = task.status === 'COMPLETED';
              const isInProg = task.status === 'IN_PROGRESS';

              return (
                <div
                  key={task.assignment_id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between bg-[#0e1322] hover:bg-[#11172a] ${
                    isBlocked
                      ? 'border-rose-500/30'
                      : isCompleted
                      ? 'border-emerald-500/20'
                      : 'border-[#1b233b] hover:border-[#2a375e]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                          {task.requirement_id || 'REQ'}
                        </span>
                        <span className="text-[11px] text-purple-300 font-medium truncate">
                          {task.prd_title || 'PRD'} ({task.prd_version || 'v1.0'})
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isInProg
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : isBlocked
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}
                      >
                        {task.status?.replace('_', ' ')}
                      </span>
                    </div>

                    <h3 className="text-sm font-bold text-white leading-snug">
                      {task.requirement_title}
                    </h3>

                    {task.problem_statement && (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {task.problem_statement}
                      </p>
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
                    {task.response && (
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
                        <span className="text-[10px] font-bold text-purple-400 block mb-0.5">Design Specification:</span>
                        <p className="line-clamp-2 italic text-slate-300">"{task.response}"</p>
                      </div>
                    )}
                  </div>

                  {/* Card Footer */}
                  <div className="pt-4 mt-3 border-t border-white/[0.05] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Assigned by {task.assigned_by || 'PM'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenTask(task)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold text-purple-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Task</span>
                      <ArrowRight size={13} />
                    </button>
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
      />

    </div>
  );
}

