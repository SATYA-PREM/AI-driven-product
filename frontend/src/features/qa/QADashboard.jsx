import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  Clock,
  Sparkles,
  ArrowRight,
  Bug,
  RefreshCw,
  Play,
  Layers,
  FileText,
  Target,
  RotateCcw,
  GitPullRequest,
  CheckSquare,
  HelpCircle,
  AlertTriangle,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { qaApi } from '../../api/qa';
import { getSessionCache } from '../../api/core';
import ExecuteTestModal from './components/ExecuteTestModal';
import CreateDefectModal from './components/CreateDefectModal';
import VerifyDefectModal from './components/VerifyDefectModal';
import QARequestClarificationModal from './components/QARequestClarificationModal';

export default function QADashboard() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/qa/dashboard` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [dashboardData, setDashboardData] = useState(() => initialCache);
  const [loading, setLoading] = useState(() => !initialCache);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Modals state
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectInitialData, setDefectInitialData] = useState({});
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);

  // Active sub-tab
  const [activeTab, setActiveTab] = useState('queue'); // 'queue' | 'defects' | 'retest' | 'submissions' | 'executions'

  const fetchDashboard = async (isManual = false) => {
    if (!workspaceId) return;
    const cached = getSessionCache(cacheKey);
    if (isManual) {
      setRefreshing(true);
    } else if (!cached && !dashboardData) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await qaApi.getDashboard(workspaceId);
      if (res) setDashboardData(res);
    } catch (err) {
      console.warn('Error loading QA dashboard:', err);
      if (!dashboardData) setError(err.message || 'Failed to load QA dashboard');
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

  const handleRunTest = (testCase) => {
    setSelectedTestCase(testCase);
    setIsExecuteModalOpen(true);
  };

  const handleReportDefectFromFailure = (defectInfo) => {
    setDefectInitialData(defectInfo);
    setIsDefectModalOpen(true);
  };

  const handleVerifyDefect = (defect) => {
    setSelectedDefect(defect);
    setIsVerifyModalOpen(true);
  };

  const kpis = dashboardData?.kpis || {};
  const testQueue = dashboardData?.test_queue || [];
  const priorityDefects = dashboardData?.priority_defects || [];
  const retestingQueue = dashboardData?.retesting_queue || [];
  const featuresAwaitingQA = dashboardData?.features_awaiting_qa || [];
  const recentExecutions = dashboardData?.recent_executions || [];
  const readinessSummary = dashboardData?.release_readiness_summary || {};

  const getOutcomeBadge = (outcome) => {
    const o = String(outcome || '').toUpperCase();
    if (o === 'PASSED') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (o === 'FAILED') {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
    if (o === 'BLOCKED') {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    if (o === 'SKIPPED') {
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
    return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  };

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <ShieldCheck size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              QA Lead Dashboard
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              Quality Workspace
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Validate requirements, manage defects, and track product quality across assigned features for{' '}
            <span className="text-slate-200 font-semibold">{workspace?.name || 'Workspace'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchDashboard(true)}
            disabled={refreshing || loading}
            title="Refresh quality metrics"
            className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
          >
            <RefreshCw size={15} className={refreshing ? 'animate-spin text-purple-400' : ''} />
          </button>

          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-purple-500/30 text-purple-300 hover:text-purple-200 hover:border-purple-500/50 text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>Ask AI Assistant</span>
          </Link>

          <Link
            to={`/workspace/${workspaceId}/qa/assignments`}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <span>My Test Assignments</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchDashboard(true)} className="underline font-bold">Retry</button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Assigned Tests */}
        <Link
          to={`/workspace/${workspaceId}/qa/assignments`}
          className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-purple-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Assigned Tests</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
              <CheckSquare size={15} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white tracking-tight">
              {kpis.assigned_tests ?? 0}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Across approved PRDs</div>
        </Link>

        {/* Pending Execution */}
        <Link
          to={`/workspace/${workspaceId}/qa/test-cases?outcome=NOT_EXECUTED`}
          className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-slate-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Pending Execution</span>
            <div className="p-1.5 rounded-lg bg-slate-500/10 text-slate-400 group-hover:scale-105 transition-transform">
              <Clock size={15} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-200 tracking-tight">
              {kpis.pending_execution ?? 0}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Ready for testing</div>
        </Link>

        {/* In Progress */}
        <Link
          to={`/workspace/${workspaceId}/qa/test-plans`}
          className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-cyan-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">In Progress</span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400 group-hover:scale-105 transition-transform">
              <Play size={15} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-cyan-400 tracking-tight">
              {kpis.in_progress ?? 0}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Active test cycles</div>
        </Link>

        {/* Failed Tests */}
        <Link
          to={`/workspace/${workspaceId}/qa/test-cases?outcome=FAILED`}
          className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-rose-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Failed Tests</span>
            <div className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 group-hover:scale-105 transition-transform">
              <XCircle size={15} />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-400 tracking-tight">
              {kpis.failed_tests ?? 0}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Requires dev fix</div>
        </Link>

        {/* Open Defects */}
        <Link
          to={`/workspace/${workspaceId}/qa/defects`}
          className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Open Defects</span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:scale-105 transition-transform">
              <Bug size={15} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-400 tracking-tight">
              {kpis.open_defects ?? 0}
            </span>
            {kpis.critical_defects > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                {kpis.critical_defects} Crit
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {kpis.awaiting_retest || 0} in retest queue
          </div>
        </Link>

        {/* Release Readiness Score */}
        <Link
          to={`/workspace/${workspaceId}/qa/release-readiness`}
          className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-purple-500/40 transition-all flex flex-col justify-between group"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium">Release Readiness</span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400 group-hover:scale-105 transition-transform">
              <ShieldCheck size={15} />
            </div>
          </div>
          <div className="mt-3">
            <span className={`text-2xl font-black tracking-tight ${
              kpis.release_readiness_score >= 80 ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {kpis.release_readiness_score ?? 0}%
            </span>
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Quality score gate</div>
        </Link>
      </div>

      {/* Main Split Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Tabs & Primary Working Queues */}
        <div className="lg:col-span-2 space-y-4">
          {/* Sub-tab Navigation */}
          <div className="flex flex-wrap items-center justify-between p-1.5 rounded-xl bg-slate-900/80 border border-white/[0.08] gap-1.5">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveTab('queue')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'queue'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <CheckSquare size={14} />
                <span>Testing Queue ({testQueue.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('defects')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'defects'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Bug size={14} />
                <span>Priority Defects ({priorityDefects.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('retest')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'retest'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <GitPullRequest size={14} />
                <span>Retesting Queue ({retestingQueue.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('submissions')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'submissions'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileText size={14} />
                <span>Dev Submissions ({featuresAwaitingQA.length})</span>
              </button>
            </div>

            <button
              onClick={() => {
                setDefectInitialData({});
                setIsDefectModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-xs font-semibold text-rose-300 border border-rose-500/30 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Bug size={13} />
              <span>Report Defect</span>
            </button>
          </div>

          {/* Tab 1: Testing Queue */}
          {activeTab === 'queue' && (
            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CheckSquare size={16} className="text-purple-400" />
                  <span>Test Cases Requiring Execution</span>
                </h3>
                <Link
                  to={`/workspace/${workspaceId}/qa/test-cases`}
                  className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
                >
                  <span>View All Test Cases</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              {testQueue.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No pending tests. Testing work appears when developer work is submitted for review.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {testQueue.map((tc) => (
                    <div
                      key={tc.test_case_id}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-purple-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-purple-400 px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
                            {tc.test_case_id}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {tc.title}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-white/[0.06]">
                            {tc.test_type}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          Expected: {tc.expected_results}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getOutcomeBadge(tc.latest_outcome)}`}>
                          {tc.latest_outcome || 'NOT_EXECUTED'}
                        </span>
                        <button
                          onClick={() => handleRunTest(tc)}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                        >
                          <Play size={13} />
                          <span>Run Test</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Priority Defects */}
          {activeTab === 'defects' && (
            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bug size={16} className="text-rose-400" />
                  <span>Open Critical & High Defects</span>
                </h3>
                <Link
                  to={`/workspace/${workspaceId}/qa/defects`}
                  className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1"
                >
                  <span>Full Defect Center</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              {priorityDefects.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Zero critical defects reported! Quality gate is clear.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {priorityDefects.map((d) => (
                    <div
                      key={d.defect_id}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-rose-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-rose-400 px-1.5 py-0.5 rounded bg-rose-500/10 border border-rose-500/20">
                            {d.defect_id}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {d.title}
                          </span>
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            {d.severity}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1">
                          Assigned: <span className="text-slate-300">{d.assigned_developer || 'Unassigned'}</span> &bull; Status: <span className="text-amber-400">{d.status}</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {d.status === 'FIX_SUBMITTED' ? (
                          <button
                            onClick={() => handleVerifyDefect(d)}
                            className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                          >
                            <ShieldCheck size={13} />
                            <span>Verify Fix</span>
                          </button>
                        ) : (
                          <Link
                            to={`/workspace/${workspaceId}/qa/defects`}
                            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 flex items-center gap-1"
                          >
                            <span>Inspect</span>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Retesting Queue */}
          {activeTab === 'retest' && (
            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitPullRequest size={16} className="text-cyan-400" />
                  <span>Developer Fixes Awaiting Verification</span>
                </h3>
                <Link
                  to={`/workspace/${workspaceId}/qa/retesting-queue`}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
                >
                  <span>Retest Center</span>
                  <ChevronRight size={13} />
                </Link>
              </div>

              {retestingQueue.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  Retesting queue is clear. No developer fixes are pending verification.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {retestingQueue.map((d) => (
                    <div
                      key={d.defect_id}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-cyan-500/30 transition-all space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-400">{d.defect_id}</span>
                            <span className="text-xs font-bold text-white">{d.title}</span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-1">
                            Fix Reference: <span className="font-mono text-cyan-300">{d.fix_reference || 'Committed to main'}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => handleVerifyDefect(d)}
                          className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
                        >
                          <ShieldCheck size={13} />
                          <span>Verify Retest</span>
                        </button>
                      </div>
                      {d.fix_notes && (
                        <p className="text-[11px] text-slate-300 bg-black/40 p-2 rounded border border-white/[0.04]">
                          {d.fix_notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Developer Submissions */}
          {activeTab === 'submissions' && (
            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3.5">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText size={16} className="text-amber-400" />
                  <span>Developer Implementation Submissions</span>
                </h3>
              </div>

              {featuresAwaitingQA.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No submissions currently in review.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {featuresAwaitingQA.map((sub, idx) => (
                    <div
                      key={sub.submission_id || idx}
                      className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-amber-400">
                              Revision #{sub.revision_number || 1}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {sub.submission_summary || 'Feature implementation completed'}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Submitted by <span className="text-slate-300">{sub.submitted_by || 'Developer'}</span> &bull; {sub.submitted_at?.slice(0, 10)}
                          </p>
                        </div>
                        <Link
                          to={`/workspace/${workspaceId}/qa/assignments`}
                          className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5"
                        >
                          <span>Review & Test</span>
                        </Link>
                      </div>
                      {sub.work_completed && (
                        <p className="text-[11px] text-slate-300 bg-black/40 p-2 rounded border border-white/[0.04]">
                          {sub.work_completed}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Release Readiness & Quick Tools */}
        <div className="space-y-4">
          {/* Release Readiness Scorecard */}
          <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3.5">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck size={16} className="text-purple-400" />
                <span>Release Readiness Gate</span>
              </h3>
              <Link
                to={`/workspace/${workspaceId}/qa/release-readiness`}
                className="text-xs text-purple-400 hover:text-purple-300 font-medium"
              >
                Detail
              </Link>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">QA Recommendation:</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] border ${
                  readinessSummary.recommendation === 'QA_PASSED'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : readinessSummary.recommendation === 'BLOCKED'
                    ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                    : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                }`}>
                  {readinessSummary.recommendation || 'TESTING_IN_PROGRESS'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Critical Blockers:</span>
                <span className={`font-bold ${readinessSummary.critical_blockers_count > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {readinessSummary.critical_blockers_count || 0} defects
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400">Unexecuted Tests:</span>
                <span className="text-slate-200 font-semibold">
                  {readinessSummary.unexecuted_count || 0} test cases
                </span>
              </div>
            </div>

            <p className="text-[11px] text-slate-500">
              QA approval authorizes quality sign-off; release authorization remains with the Product Manager.
            </p>

            <div className="pt-1 flex flex-col gap-2">
              <Link
                to={`/workspace/${workspaceId}/qa/reports`}
                className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-200 border border-white/[0.08] flex items-center justify-between transition-colors cursor-pointer"
              >
                <span>View QA Reports</span>
                <ChevronRight size={14} className="text-slate-400" />
              </Link>
              <button
                onClick={() => setIsClarificationModalOpen(true)}
                className="w-full py-2 px-3 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-purple-300 border border-purple-500/30 flex items-center justify-between transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <HelpCircle size={14} /> Request PM Clarification
                </span>
                <ChevronRight size={14} className="text-purple-400" />
              </button>
            </div>
          </div>

          {/* Quick Nav Card */}
          <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-2.5">
            <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Testing Workflows
            </h4>
            <div className="space-y-1.5 text-xs">
              <Link
                to={`/workspace/${workspaceId}/qa/test-plans`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Target size={14} className="text-purple-400" />
                  <span>Test Plans & Strategies</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </Link>
              <Link
                to={`/workspace/${workspaceId}/qa/test-suites`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Layers size={14} className="text-cyan-400" />
                  <span>Test Suites Catalog</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </Link>
              <Link
                to={`/workspace/${workspaceId}/qa/regression-testing`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw size={14} className="text-amber-400" />
                  <span>Regression Suite Scope</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </Link>
              <Link
                to={`/workspace/${workspaceId}/qa/acceptance-criteria`}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/[0.04] text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <CheckSquare size={14} className="text-emerald-400" />
                  <span>Acceptance Criteria Traceability</span>
                </div>
                <ChevronRight size={13} className="text-slate-500" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ExecuteTestModal
        isOpen={isExecuteModalOpen}
        onClose={() => setIsExecuteModalOpen(false)}
        testCase={selectedTestCase}
        workspaceId={workspaceId}
        onSuccess={() => fetchDashboard(true)}
        onReportDefect={handleReportDefectFromFailure}
      />

      <CreateDefectModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        workspaceId={workspaceId}
        initialData={defectInitialData}
        onSuccess={() => fetchDashboard(true)}
      />

      <VerifyDefectModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        defect={selectedDefect}
        workspaceId={workspaceId}
        onSuccess={() => fetchDashboard(true)}
      />

      <QARequestClarificationModal
        isOpen={isClarificationModalOpen}
        onClose={() => setIsClarificationModalOpen(false)}
        workspaceId={workspaceId}
        onSuccess={() => fetchDashboard(true)}
      />
    </div>
  );
}

