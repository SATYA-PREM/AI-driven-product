import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  FileText,
  Sparkles,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Target,
  RefreshCw,
  MessageSquare,
  Users,
  Layers,
  ChevronRight,
  Activity
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { stakeholderApi } from '../../api/stakeholder';
import { getSessionCache } from '../../api/core';
import DecisionModal from './components/DecisionModal';
import StakeholderFeedbackModal from './components/StakeholderFeedbackModal';

export default function StakeholderDashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/stakeholder/dashboard` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [dashboardData, setDashboardData] = useState(() => initialCache);
  const [loading, setLoading] = useState(() => !initialCache);
  const [error, setError] = useState(null);
  const [lastSyncTime, setLastSyncTime] = useState(new Date().toLocaleTimeString());

  // Modals state
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);

  const fetchDashboard = async () => {
    if (!workspaceId) return;
    setLoading(true);
    const cached = getSessionCache(cacheKey);
    if (!cached && !dashboardData) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await stakeholderApi.getDashboard(workspaceId);
      setDashboardData(res || null);
      setLastSyncTime(new Date().toLocaleTimeString());
      if (res) {
        setDashboardData(res);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    } catch (err) {
      console.warn('Error fetching stakeholder dashboard:', err);
      setError(err.message || 'Failed to load stakeholder dashboard');
      if (!dashboardData) setError(err.message || 'Failed to load stakeholder dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();

    const onCacheUpdate = (e) => {
      if (e.detail?.endpoint === cacheKey && e.detail?.data) {
        setDashboardData(e.detail.data);
        setLastSyncTime(new Date().toLocaleTimeString());
      }
    };
    window.addEventListener('cache_updated', onCacheUpdate);
    return () => window.removeEventListener('cache_updated', onCacheUpdate);
  }, [workspaceId]);

  const handleOpenDecision = (approval) => {
    setSelectedApproval(approval);
    setIsDecisionModalOpen(true);
  };

  const handleDecisionRecorded = () => {
    setIsDecisionModalOpen(false);
    setSelectedApproval(null);
    fetchDashboard();
  };

  const rawKpis = dashboardData?.kpis;
  const kpis = {
    active_initiatives: typeof rawKpis?.active_initiatives === 'object' && rawKpis?.active_initiatives !== null
      ? (rawKpis.active_initiatives.value ?? 0)
      : (rawKpis?.active_initiatives ?? dashboardData?.active_initiatives_count ?? 0),
    pending_decisions: typeof rawKpis?.pending_decisions === 'object' && rawKpis?.pending_decisions !== null
      ? (rawKpis.pending_decisions.value ?? 0)
      : (rawKpis?.pending_decisions ?? dashboardData?.pending_decisions_count ?? 0),
    upcoming_milestones: typeof rawKpis?.upcoming_milestones === 'object' && rawKpis?.upcoming_milestones !== null
      ? (rawKpis.upcoming_milestones.value ?? 0)
      : (rawKpis?.upcoming_milestones ?? dashboardData?.upcoming_milestones_count ?? 0),
    open_business_risks: typeof rawKpis?.open_risks === 'object' && rawKpis?.open_risks !== null
      ? (rawKpis.open_risks.value ?? 0)
      : typeof rawKpis?.open_business_risks === 'object' && rawKpis?.open_business_risks !== null
      ? (rawKpis.open_business_risks.value ?? 0)
      : (rawKpis?.open_business_risks ?? rawKpis?.open_risks ?? dashboardData?.open_risks_count ?? 0),
    business_impact: typeof rawKpis?.business_impact === 'object' && rawKpis?.business_impact !== null
      ? {
          metric_name: rawKpis.business_impact.subtext || rawKpis.business_impact.label || rawKpis.business_impact.metric_name || null,
          metric_value: rawKpis.business_impact.value ?? rawKpis.business_impact.metric_value ?? null,
          unit: rawKpis.business_impact.unit || null,
          trend: rawKpis.business_impact.trend || null,
          is_configured: Boolean(rawKpis.business_impact.configured ?? rawKpis.business_impact.is_configured),
        }
      : {
          metric_name: null,
          metric_value: null,
          unit: null,
          trend: null,
          is_configured: false,
        }
  };

  const initiatives = dashboardData?.initiatives || [];
  const pendingApprovals = dashboardData?.pending_approvals || [];
  const upcomingMilestones = dashboardData?.upcoming_milestones || [];
  const topRisks = dashboardData?.top_risks || [];
  const recentUpdates = dashboardData?.recent_pm_updates || [];
  const keyInsights = dashboardData?.key_insights || [];

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-md shadow-purple-500/10">
              <Briefcase size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">
                  Stakeholder Dashboard
                </h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30">
                  Executive Workspace
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitor product direction, review business decisions, and track progress toward business outcomes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Live Sync Status */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="text-[11px]">Sync: {lastSyncTime}</span>
            <button
              onClick={fetchDashboard}
              title="Refresh governance telemetry"
              className="hover:text-white transition-colors"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>

          {/* Quick Action: Pending Approvals */}
          <Link
            to={`/workspace/${workspaceId}/stakeholder/approvals`}
            className="px-3.5 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <Clock size={14} />
            <span>Pending Approvals ({kpis.pending_decisions})</span>
          </Link>

          {/* Quick Action: Feedback */}
          <button
            onClick={() => setIsFeedbackModalOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 text-xs font-semibold flex items-center gap-2 transition-all shadow-sm"
          >
            <MessageSquare size={14} />
            <span>Business Feedback</span>
          </button>

          {/* Quick Action: AI Assistant */}
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700/80 border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-2 transition-colors"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle size={16} />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchDashboard}
            className="px-3 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 font-semibold"
          >
            Retry
          </button>
        </div>
      )}

      {/* 5 KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* 1. Active Initiatives */}
        <Link
          to={`/workspace/${workspaceId}/stakeholder/roadmap`}
          className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/[0.08] hover:border-purple-500/40 transition-all group flex flex-col justify-between shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Active Initiatives</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center">
              <Layers size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-white tracking-tight">
              {loading ? '—' : kpis.active_initiatives}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">In flight across workspace</div>
          </div>
          <div className="text-[11px] text-blue-400 group-hover:text-blue-300 flex items-center gap-1 font-medium pt-2 border-t border-white/[0.06]">
            <span>View Roadmap Portfolio</span>
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* 2. Pending Decisions */}
        <Link
          to={`/workspace/${workspaceId}/stakeholder/approvals`}
          className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/[0.08] hover:border-amber-500/40 transition-all group flex flex-col justify-between shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Pending Decisions</span>
            <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-400 flex items-center justify-center">
              <Clock size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-amber-300 tracking-tight">
              {loading ? '—' : kpis.pending_decisions}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Awaiting stakeholder action</div>
          </div>
          <div className="text-[11px] text-amber-400 group-hover:text-amber-300 flex items-center gap-1 font-medium pt-2 border-t border-white/[0.06]">
            <span>Open Approval Queue</span>
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* 3. Upcoming Milestones */}
        <Link
          to={`/workspace/${workspaceId}/stakeholder/milestones`}
          className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/[0.08] hover:border-indigo-500/40 transition-all group flex flex-col justify-between shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Upcoming Milestones</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-500/15 text-indigo-400 flex items-center justify-center">
              <Target size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-white tracking-tight">
              {loading ? '—' : kpis.upcoming_milestones}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Target dates approaching</div>
          </div>
          <div className="text-[11px] text-indigo-400 group-hover:text-indigo-300 flex items-center gap-1 font-medium pt-2 border-t border-white/[0.06]">
            <span>Track Milestones</span>
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* 4. Open Business Risks */}
        <Link
          to={`/workspace/${workspaceId}/stakeholder/risks`}
          className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/[0.08] hover:border-rose-500/40 transition-all group flex flex-col justify-between shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Open Business Risks</span>
            <div className="w-8 h-8 rounded-lg bg-rose-500/15 text-rose-400 flex items-center justify-center">
              <ShieldAlert size={16} />
            </div>
          </div>
          <div className="my-2">
            <div className="text-2xl font-bold text-rose-300 tracking-tight">
              {loading ? '—' : kpis.open_business_risks}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">Requiring mitigation oversight</div>
          </div>
          <div className="text-[11px] text-rose-400 group-hover:text-rose-300 flex items-center gap-1 font-medium pt-2 border-t border-white/[0.06]">
            <span>Inspect Risk Register</span>
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>

        {/* 5. Business Impact */}
        <Link
          to={`/workspace/${workspaceId}/stakeholder/metrics`}
          className="p-4 rounded-2xl bg-slate-900/60 hover:bg-slate-800/80 border border-white/[0.08] hover:border-emerald-500/40 transition-all group flex flex-col justify-between shadow-lg shadow-black/20"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Business Impact</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 text-emerald-400 flex items-center justify-center">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="my-2">
            {kpis.business_impact?.is_configured ? (
              <>
                <div className="text-2xl font-bold text-emerald-300 tracking-tight">
                  {kpis.business_impact.metric_value}
                  <span className="text-xs text-slate-400 ml-1">{kpis.business_impact.unit}</span>
                </div>
                <div className="text-[11px] text-slate-300 truncate mt-0.5">
                  {kpis.business_impact.metric_name}
                </div>
              </>
            ) : (
              <>
                <div className="text-sm font-semibold text-slate-400">Not configured</div>
                <div className="text-[11px] text-slate-400 mt-0.5">Awaiting telemetry setup</div>
              </>
            )}
          </div>
          <div className="text-[11px] text-emerald-400 group-hover:text-emerald-300 flex items-center gap-1 font-medium pt-2 border-t border-white/[0.06]">
            <span>Success Metrics</span>
            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
          </div>
        </Link>
      </div>

      {/* Main Grid: Pending Decisions (Critical) & Milestones */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Approvals Queue (2 Cols) */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-amber-400" />
              <h2 className="text-base font-bold text-white">Pending Executive Decisions</h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                {pendingApprovals.length}
              </span>
            </div>
            <Link
              to={`/workspace/${workspaceId}/stakeholder/approvals`}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              <span>View All Approvals</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          {pendingApprovals.length === 0 ? (
            <div className="p-8 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center space-y-2">
              <CheckCircle2 size={32} className="mx-auto text-emerald-400" />
              <div className="text-sm font-semibold text-white">No pending approval requests</div>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                All business proposals and release sign-offs are up to date. You will be notified when new reviews are requested.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {pendingApprovals.map((req) => (
                <div
                  key={req.request_id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-amber-500/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                        {req.request_id}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                        {req.request_type?.replace(/_/g, ' ')}
                      </span>
                      {req.due_date && (
                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock size={11} /> Due: {req.due_date}
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-bold text-white truncate">{req.title}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>Submitted by {req.requested_by_name || 'Product Manager'}</span>
                      {req.business_impact_summary && (
                        <>
                          <span>•</span>
                          <span className="text-slate-300 truncate">{req.business_impact_summary}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleOpenDecision(req)}
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-600/25 flex items-center gap-1.5 transition-all"
                    >
                      <span>Record Decision</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Milestones & High-Level Progress (1 Col) */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target size={16} className="text-indigo-400" />
              <h2 className="text-base font-bold text-white">Upcoming Milestones</h2>
            </div>
            <Link
              to={`/workspace/${workspaceId}/stakeholder/milestones`}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              <span>Details</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {upcomingMilestones.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center text-xs text-slate-400">
                No active milestone schedules found.
              </div>
            ) : (
              upcomingMilestones.slice(0, 4).map((m) => (
                <div
                  key={m.milestone_id}
                  className="p-3.5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-white truncate">{m.name}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      m.status === 'COMPLETED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                      m.status === 'ON_TRACK' ? 'bg-blue-500/15 text-blue-300 border border-blue-500/30' :
                      m.status === 'AT_RISK' ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30' :
                      'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                    }`}>
                      {m.status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Target: {m.target_date}</span>
                    <span className="font-semibold text-slate-300">{m.progress_percentage}%</span>
                  </div>
                  {/* Progress Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        m.status === 'AT_RISK' ? 'bg-amber-400' :
                        m.status === 'DELAYED' ? 'bg-rose-400' :
                        'bg-purple-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(0, m.progress_percentage))}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Secondary Grid: Active Initiatives & Risk Register Highlights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Product Initiatives */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers size={16} className="text-blue-400" />
              <h2 className="text-base font-bold text-white">Major Product Initiatives</h2>
            </div>
            <Link
              to={`/workspace/${workspaceId}/stakeholder/roadmap`}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              <span>Portfolio View</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {initiatives.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center text-xs text-slate-400">
                No active initiatives recorded.
              </div>
            ) : (
              initiatives.slice(0, 4).map((init) => (
                <div
                  key={init.initiative_id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-slate-700 transition-all space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">{init.title}</div>
                      <div className="text-xs text-slate-400 line-clamp-1 mt-0.5">{init.expected_outcome}</div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-300 border border-blue-500/30 shrink-0">
                      {init.current_stage?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users size={12} /> PM: {init.responsible_pm}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock size={12} /> Timeline: {init.planned_timeline}
                    </span>
                    <span className={`font-semibold ${
                      init.risk_status === 'HIGH' ? 'text-rose-400' :
                      init.risk_status === 'MEDIUM' ? 'text-amber-400' :
                      'text-emerald-400'
                    }`}>
                      Risk: {init.risk_status}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Significant Business Risks Highlights */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-400" />
              <h2 className="text-base font-bold text-white">Significant Business Risks</h2>
            </div>
            <Link
              to={`/workspace/${workspaceId}/stakeholder/risks`}
              className="text-xs text-purple-400 hover:text-purple-300 font-medium flex items-center gap-1"
            >
              <span>Risk Register</span>
              <ArrowRight size={13} />
            </Link>
          </div>

          <div className="space-y-3">
            {topRisks.length === 0 ? (
              <div className="p-6 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center text-xs text-slate-400">
                No open critical risks flagged for executive review.
              </div>
            ) : (
              topRisks.map((risk) => (
                <div
                  key={risk.risk_id}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="text-xs font-bold text-white">{risk.title}</div>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      risk.severity === 'CRITICAL' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40' :
                      risk.severity === 'HIGH' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                    }`}>
                      {risk.severity} SEVERITY
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 line-clamp-2">
                    {risk.business_impact}
                  </p>
                  <div className="pt-2 border-t border-white/[0.06] text-[11px] text-slate-400 flex items-center justify-between">
                    <span className="truncate">Mitigation: {risk.mitigation_strategy}</span>
                    <span className="font-mono text-[10px] text-slate-400 shrink-0">{risk.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Tertiary Row: Recent PM Updates & Customer / Market Evidence */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent PM Updates */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2">
            <Activity size={16} className="text-purple-400" />
            <h3 className="text-sm font-bold text-white">Recent PM Updates & Rationale</h3>
          </div>
          {recentUpdates.length === 0 ? (
            <p className="text-xs text-slate-400">No recent updates published.</p>
          ) : (
            <div className="space-y-3">
              {recentUpdates.map((upd, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-purple-300">{upd.author}</span>
                    <span>{upd.timestamp}</span>
                  </div>
                  <p className="text-xs text-slate-200">{upd.summary}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Customer Evidence & Product Insights */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-amber-400" />
            <h3 className="text-sm font-bold text-white">Strategic Evidence & Customer Signals</h3>
          </div>
          {keyInsights.length === 0 ? (
            <p className="text-xs text-slate-400">No strategic evidence records configured.</p>
          ) : (
            <div className="space-y-3">
              {keyInsights.map((ins, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/50 space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span className="font-semibold text-slate-300">{ins.topic}</span>
                    <span className="text-amber-400 font-mono text-[10px]">{ins.metric_quote}</span>
                  </div>
                  <p className="text-xs text-slate-300 italic">"{ins.insight_summary}"</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Decision Modal */}
      {selectedApproval && (
        <DecisionModal
          isOpen={isDecisionModalOpen}
          onClose={() => setIsDecisionModalOpen(false)}
          approvalRequest={selectedApproval}
          workspaceId={workspaceId}
          onSuccess={handleDecisionRecorded}
        />
      )}

      {/* Feedback Modal */}
      <StakeholderFeedbackModal
        isOpen={isFeedbackModalOpen}
        onClose={() => setIsFeedbackModalOpen(false)}
        workspaceId={workspaceId}
        onSuccess={() => {
          fetchDashboard();
        }}
      />
    </div>
  );
}

