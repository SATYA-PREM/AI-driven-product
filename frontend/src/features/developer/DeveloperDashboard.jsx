import React, { useState, useEffect } from 'react';
import {
  Code2,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileText,
  Sparkles,
  ArrowRight,
  GitPullRequest,
  Bug,
  HelpCircle,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  AlertTriangle,
  Play,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { developerApi } from '../../api/developer';
import { getSessionCache } from '../../api/core';
import SubmitImplementationModal from './components/SubmitImplementationModal';
import SubmitDefectFixModal from './components/SubmitDefectFixModal';
import ReportBlockerModal from './components/ReportBlockerModal';
import RequestClarificationModal from './components/RequestClarificationModal';

export default function DeveloperDashboard() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/developer/dashboard` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [dashboardData, setDashboardData] = useState(() => initialCache);
  const [loading, setLoading] = useState(() => !initialCache);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);

  // Active sub-tab in dashboard
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'defects' | 'handoffs'

  const fetchDashboard = async (isManual = false) => {
    if (!workspaceId) return;
    if (isManual) setRefreshing(true);
    else setLoading(true);
    const cached = getSessionCache(cacheKey);
    if (isManual) {
      setRefreshing(true);
    } else if (!cached && !dashboardData) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await developerApi.getDashboard(workspaceId);
      setDashboardData(res || null);
      if (res) setDashboardData(res);
    } catch (err) {
      console.warn('Error fetching developer dashboard:', err);
      setError(err.message || 'Failed to load developer dashboard');
      if (!dashboardData) setError(err.message || 'Failed to load developer dashboard');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const onCacheUpdate = (e) => {
      if (e.detail?.endpoint === cacheKey && e.detail?.data) {
        setDashboardData(e.detail.data);
      }
    };
    window.addEventListener('cache_updated', onCacheUpdate);
    return () => window.removeEventListener('cache_updated', onCacheUpdate);
  }, [workspaceId]);

  const handleStartTask = async (task) => {
    try {
      await developerApi.updateAssignmentStatus(workspaceId, task.assignment_id, {
        status: 'IN_PROGRESS',
        notes: 'Developer started technical implementation.',
      });
      fetchDashboard(true);
    } catch (err) {
      alert(`Could not start task: ${err.message}`);
    }
  };

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

  const kpis = dashboardData?.kpis || {};
  const recentTasks = dashboardData?.recent_tasks || [];
  const openDefects = dashboardData?.open_defects || [];
  const approvedHandoffs = dashboardData?.approved_handoffs || [];

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Code2 size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Developer Dashboard
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
              Engineering Workspace
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Review requirements, implement assigned features, and track development and QA progress for{' '}
            <span className="text-slate-200 font-semibold">{workspace?.name || 'Customer Intelligence'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing || loading}
            title="Refresh dashboard metrics"
            className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-cyan-400' : ''} />
          </button>

          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-purple-500/30 text-purple-300 hover:text-purple-200 hover:border-purple-500/50 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>Ask AI</span>
          </Link>

          <Link
            to={`/workspace/${workspaceId}/developer/assignments`}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-lg shadow-cyan-600/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>My Assignments</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Assigned */}
        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Assigned Tasks</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Code2 size={15} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white tracking-tight">
              {kpis.total_assigned ?? 0}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Across approved PRDs</div>
        </div>

        {/* Pending */}
        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-slate-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Pending Kickoff</span>
            <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-400">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-200 tracking-tight">
              {kpis.pending ?? 0}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Ready to start</div>
        </div>

        {/* In Progress */}
        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-cyan-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">In Progress</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <Play size={15} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-cyan-400 tracking-tight">
              {kpis.in_progress ?? 0}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Active coding</div>
        </div>

        {/* Submitted / In Review */}
        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-amber-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">In Review / QA</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <GitPullRequest size={15} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-400 tracking-tight">
              {kpis.submitted_for_review ?? 0}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Awaiting verification</div>
        </div>

        {/* Blocked */}
        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-rose-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Blocked</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <AlertOctagon size={15} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-400 tracking-tight">
              {kpis.blocked ?? 0}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Needs PM / Design</div>
        </div>

        {/* Open Defects */}
        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-amber-500/30 transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Open Defects</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400">
              <Bug size={15} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-400 tracking-tight">
              {kpis.open_defects ?? 0}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Reported by QA</div>
        </div>
      </div>

      {/* Main Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Task Center & Tabs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sub-tab Navigation */}
          <div className="flex items-center justify-between p-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08]">
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setActiveTab('tasks')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'tasks'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code2 size={14} />
                <span>My Active Tasks ({recentTasks.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('defects')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'defects'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bug size={14} />
                <span>QA Defects ({openDefects.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('handoffs')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'handoffs'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers size={14} />
                <span>Approved Design Handoffs ({approvedHandoffs.length})</span>
              </button>
            </div>

            <Link
              to={`/workspace/${workspaceId}/developer/assignments`}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium px-2 py-1 flex items-center gap-1"
            >
              <span>View All</span>
              <ChevronRight size={13} />
            </Link>
          </div>

          {/* TAB 1: Tasks */}
          {activeTab === 'tasks' && (
            <div className="bg-[#090d1c]/80 border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Priority Implementation Queue
                </span>
                <span className="text-xs text-slate-400">
                  Ordered by urgency & status
                </span>
              </div>

              {loading ? (
                <div className="p-8 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading engineering tasks...</span>
                </div>
              ) : recentTasks.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No development assignments found in this workspace.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {recentTasks.map((task) => (
                    <div
                      key={task.assignment_id}
                      className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-xs text-cyan-400 font-semibold">
                            {task.assignment_id}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(task.status)}`}>
                            {task.status || 'PENDING'}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getPriorityBadge(task.priority)}`}>
                            {task.priority || 'MEDIUM'}
                          </span>
                          {task.revision_number > 0 && (
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/[0.06]">
                              Rev #{task.revision_number}
                            </span>
                          )}
                        </div>

                        <h3 className="text-sm font-semibold text-white truncate">
                          {task.feature_title || task.title || 'Technical Requirement Implementation'}
                        </h3>

                        <div className="flex items-center gap-4 text-xs text-slate-400">
                          <span className="truncate">PRD: <span className="text-slate-300">{task.prd_title || task.prd_id || 'Core PRD'}</span></span>
                          {task.branch_name && (
                            <span className="font-mono text-cyan-300 text-[11px] truncate flex items-center gap-1">
                              <GitPullRequest size={12} />
                              {task.branch_name}
                            </span>
                          )}
                          {task.target_date && (
                            <span className="text-slate-400 text-[11px]">Due: {task.target_date}</span>
                          )}
                        </div>
                      </div>

                      {/* Task Action Buttons */}
                      <div className="flex items-center gap-2 shrink-0">
                        {task.status === 'PENDING' && (
                          <button
                            onClick={() => handleStartTask(task)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
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
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
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
                          className="p-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 transition-colors cursor-pointer"
                        >
                          <AlertOctagon size={15} />
                        </button>

                        <button
                          onClick={() => {
                            setSelectedTask(task);
                            setIsClarificationModalOpen(true);
                          }}
                          title="Request PM Clarification"
                          className="p-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-indigo-400 hover:bg-indigo-500/10 hover:border-indigo-500/30 transition-colors cursor-pointer"
                        >
                          <HelpCircle size={15} />
                        </button>

                        <Link
                          to={`/workspace/${workspaceId}/developer/assignments/${task.assignment_id}`}
                          className="p-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.2] transition-colors"
                          title="Open Implementation Workspace"
                        >
                          <ExternalLink size={15} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: QA Defects */}
          {activeTab === 'defects' && (
            <div className="bg-[#090d1c]/80 border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-rose-300">
                  Open Defects & QA Feedback
                </span>
                <Link
                  to={`/workspace/${workspaceId}/developer/defects`}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium"
                >
                  Manage All Defects →
                </Link>
              </div>

              {openDefects.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No active defects reported for your development assignments! 🎉
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {openDefects.map((defect) => (
                    <div
                      key={defect.defect_id}
                      className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-rose-400 font-semibold">
                            {defect.defect_id}
                          </span>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                            defect.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                          }`}>
                            {defect.severity || 'HIGH'}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/[0.08]">
                            {defect.status || 'OPEN'}
                          </span>
                        </div>
                        <h4 className="text-sm font-semibold text-white">
                          {defect.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2">
                          {defect.description}
                        </p>
                      </div>

                      <div className="shrink-0">
                        <button
                          onClick={() => {
                            setSelectedDefect(defect);
                            setIsDefectModalOpen(true);
                          }}
                          className="px-3.5 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Bug size={13} />
                          <span>Submit Fix</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Design Handoffs */}
          {activeTab === 'handoffs' && (
            <div className="bg-[#090d1c]/80 border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl">
              <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                  Approved Design Deliverables & Handoffs
                </span>
                <Link
                  to={`/workspace/${workspaceId}/developer/design-handoff`}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium"
                >
                  View All Handoffs →
                </Link>
              </div>

              {approvedHandoffs.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No approved design deliverables found yet.
                </div>
              ) : (
                <div className="divide-y divide-white/[0.05]">
                  {approvedHandoffs.map((handoff, idx) => (
                    <div key={idx} className="p-4 hover:bg-white/[0.02] transition-colors space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs text-purple-400 font-semibold">
                            {handoff.assignment_id || 'DESIGN-01'}
                          </span>
                          <span className="text-xs font-bold text-white">
                            {handoff.feature_title || handoff.title}
                          </span>
                        </div>
                        {handoff.figma_url && (
                          <a
                            href={handoff.figma_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 text-[11px] font-semibold flex items-center gap-1 transition-all"
                          >
                            <span>Open Figma</span>
                            <ExternalLink size={11} />
                          </a>
                        )}
                      </div>

                      <p className="text-xs text-slate-300 leading-relaxed">
                        {handoff.design_specs || handoff.response}
                      </p>

                      {handoff.prototype_url && (
                        <div className="text-[11px] text-slate-400">
                          Prototype:{' '}
                          <a
                            href={handoff.prototype_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-400 underline"
                          >
                            {handoff.prototype_url}
                          </a>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Quick References & Context */}
        <div className="space-y-4">
          {/* Workflow & Responsibilities Card */}
          <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-500/20 text-cyan-400">
                <CheckSquare size={16} />
              </div>
              <h3 className="text-sm font-bold text-white">
                Developer Workflow
              </h3>
            </div>

            <ol className="text-xs text-slate-400 space-y-2.5 list-decimal pl-4 leading-relaxed">
              <li>
                <span className="text-slate-200 font-medium">Review Requirements:</span> Check assigned PRDs and acceptance criteria.
              </li>
              <li>
                <span className="text-slate-200 font-medium">Inspect Design Handoffs:</span> Verify Figma specs and interaction states.
              </li>
              <li>
                <span className="text-slate-200 font-medium">Implement Feature:</span> Write code, commit, and link PR references.
              </li>
              <li>
                <span className="text-slate-200 font-medium">Submit for Review:</span> Submissions snapshot technical progress and notify QA.
              </li>
              <li>
                <span className="text-slate-200 font-medium">Address Defects:</span> Submit defect fixes with root cause and retest notes.
              </li>
            </ol>
          </div>

          {/* Quick Links Card */}
          <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Technical Resources
            </h3>

            <div className="space-y-2 text-xs">
              <Link
                to={`/workspace/${workspaceId}/developer/technical-requirements`}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-cyan-500/30 text-slate-300 hover:text-white flex items-center justify-between transition-all"
              >
                <span>Technical Requirements</span>
                <ChevronRight size={14} className="text-slate-500" />
              </Link>

              <Link
                to={`/workspace/${workspaceId}/developer/assigned-prds`}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-cyan-500/30 text-slate-300 hover:text-white flex items-center justify-between transition-all"
              >
                <span>Assigned PRDs</span>
                <ChevronRight size={14} className="text-slate-500" />
              </Link>

              <Link
                to={`/workspace/${workspaceId}/developer/design-handoff`}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-cyan-500/30 text-slate-300 hover:text-white flex items-center justify-between transition-all"
              >
                <span>Design Handoffs</span>
                <ChevronRight size={14} className="text-slate-500" />
              </Link>

              <Link
                to={`/workspace/${workspaceId}/developer/blockers`}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-cyan-500/30 text-slate-300 hover:text-white flex items-center justify-between transition-all"
              >
                <span>Blockers & Clarifications</span>
                <ChevronRight size={14} className="text-slate-500" />
              </Link>

              <Link
                to={`/workspace/${workspaceId}/intelligence/insights`}
                className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-cyan-500/30 text-slate-300 hover:text-white flex items-center justify-between transition-all"
              >
                <span>Customer Insights</span>
                <ChevronRight size={14} className="text-slate-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SubmitImplementationModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={() => fetchDashboard(true)}
      />

      <SubmitDefectFixModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        defect={selectedDefect}
        workspaceId={workspaceId}
        onSaved={() => fetchDashboard(true)}
      />

      <ReportBlockerModal
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={() => fetchDashboard(true)}
      />

      <RequestClarificationModal
        isOpen={isClarificationModalOpen}
        onClose={() => setIsClarificationModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={() => fetchDashboard(true)}
      />
    </div>
  );
}

