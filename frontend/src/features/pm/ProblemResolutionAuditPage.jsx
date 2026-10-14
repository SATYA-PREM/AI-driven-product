import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  Layers,
  FileText,
  Clock,
  Filter,
  Search,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Cpu,
  BadgeAlert,
  ArrowUpRight
} from 'lucide-react';
import { prdAssignmentApi } from '../../api/prdAssignment';
import {
  getActiveDatasetId,
  subscribeToActiveDataset,
  getActiveSourceType,
  subscribeToActiveSourceType,
} from '../../utils/workspaceAccess';
import { useTheme } from '../../context/ThemeContext';

export default function ProblemResolutionAuditPage() {
  const { workspaceId } = useParams();
  const { isDark } = useTheme();

  // Scope State
  const [activeDatasetId, setActiveDatasetId] = useState(getActiveDatasetId());
  const [activeSourceType, setActiveSourceType] = useState(getActiveSourceType());
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState(null);

  // Active Tab
  const [activeTab, setActiveTab] = useState('tasks'); // 'tasks' | 'features' | 'issues'
  const [taskFilter, setTaskFilter] = useState('ALL'); // 'ALL' | 'COMPLETED' | 'REJECTED' | 'IN_PROGRESS' | 'BLOCKED'
  const [featureFilter, setFeatureFilter] = useState('ALL'); // 'ALL' | 'ADDED' | 'REMOVED' | 'PLANNED'
  const [issueFilter, setIssueFilter] = useState('ALL'); // 'ALL' | 'FIXED' | 'OPEN'
  const [searchQuery, setSearchQuery] = useState('');

  // Subscribe to scope updates
  useEffect(() => {
    const unsubDs = subscribeToActiveDataset((dsId) => {
      setActiveDatasetId(dsId || '');
    });
    const unsubSrc = subscribeToActiveSourceType((src) => {
      setActiveSourceType(src || 'all');
    });
    return () => {
      unsubDs();
      unsubSrc();
    };
  }, []);

  // Fetch Audit Data
  const fetchAuditData = async () => {
    if (!workspaceId) return;
    try {
      setLoading(true);
      const res = await prdAssignmentApi.getResolutionAudit(workspaceId, {
        dataset_id: activeDatasetId,
        source_type: activeSourceType,
      });
      setAuditData(res);
    } catch (err) {
      console.error('Error fetching resolution audit data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAuditData();
  }, [workspaceId, activeDatasetId, activeSourceType]);

  // Derived filtered lists
  const filteredTasks = useMemo(() => {
    if (!auditData) return [];
    let list = [];
    if (taskFilter === 'ALL') {
      list = [
        ...(auditData.completed_tasks || []),
        ...(auditData.rejected_tasks || []),
        ...(auditData.in_progress_tasks || []),
        ...(auditData.blocked_tasks || []),
      ];
    } else if (taskFilter === 'COMPLETED') {
      list = auditData.completed_tasks || [];
    } else if (taskFilter === 'REJECTED') {
      list = auditData.rejected_tasks || [];
    } else if (taskFilter === 'IN_PROGRESS') {
      list = auditData.in_progress_tasks || [];
    } else if (taskFilter === 'BLOCKED') {
      list = auditData.blocked_tasks || [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((t) => {
        const title = (t.requirement_title || '').toLowerCase();
        const rid = (t.requirement_id || '').toLowerCase();
        const prd = (t.prd_title || '').toLowerCase();
        const user = (t.user_name || '').toLowerCase();
        const notes = (t.review_notes || t.response || '').toLowerCase();
        return title.includes(q) || rid.includes(q) || prd.includes(q) || user.includes(q) || notes.includes(q);
      });
    }
    return list;
  }, [auditData, taskFilter, searchQuery]);

  const filteredFeatures = useMemo(() => {
    if (!auditData) return [];
    let list = [];
    if (featureFilter === 'ALL') {
      list = [
        ...(auditData.features_added || []),
        ...(auditData.features_removed || []),
        ...(auditData.features_planned || []),
      ];
    } else if (featureFilter === 'ADDED') {
      list = auditData.features_added || [];
    } else if (featureFilter === 'REMOVED') {
      list = auditData.features_removed || [];
    } else if (featureFilter === 'PLANNED') {
      list = auditData.features_planned || [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((f) => {
        const name = (f.name || '').toLowerCase();
        const fid = (f.feature_id || '').toLowerCase();
        const desc = (f.description || '').toLowerCase();
        const reason = (f.reason || '').toLowerCase();
        return name.includes(q) || fid.includes(q) || desc.includes(q) || reason.includes(q);
      });
    }
    return list;
  }, [auditData, featureFilter, searchQuery]);

  const filteredIssues = useMemo(() => {
    if (!auditData) return [];
    let list = [];
    if (issueFilter === 'ALL') {
      list = [...(auditData.issues_fixed || []), ...(auditData.issues_open || [])];
    } else if (issueFilter === 'FIXED') {
      list = auditData.issues_fixed || [];
    } else if (issueFilter === 'OPEN') {
      list = auditData.issues_open || [];
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter((i) => {
        const title = (i.title || '').toLowerCase();
        const did = (i.defect_id || '').toLowerCase();
        const notes = (i.fix_notes || '').toLowerCase();
        return title.includes(q) || did.includes(q) || notes.includes(q);
      });
    }
    return list;
  }, [auditData, issueFilter, searchQuery]);

  const tasksSummary = auditData?.tasks_summary || {};
  const featuresSummary = auditData?.features_summary || {};
  const issuesSummary = auditData?.issues_summary || {};

  return (
    <div className={`w-full font-sans space-y-6 pb-12 select-none relative ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* 1. Global Context Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl border backdrop-blur-xl transition-all shadow-sm ${
        isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5 flex-wrap gap-y-1">
            <span className={`px-2.5 py-1 text-xs font-semibold uppercase tracking-wider rounded-md border ${
              isDark 
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
              PM Delivery & Resolution Audit
            </span>
            <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Scope: {activeDatasetId ? `Dataset (${activeDatasetId.slice(-6)})` : 'All Batches'} • Source: {activeSourceType}
            </span>
          </div>
          <h1 className={`text-2xl font-bold tracking-tight mt-1 flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            Problem Tasks Queue & Resolution Audit
          </h1>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            Track fixed vs. rejected tasks queue, features added vs. out-of-scope removals, and customer issues resolved across the current workspace.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            to={`/workspace/${workspaceId}/team-responses`}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center space-x-2 transition-all shadow-sm cursor-pointer ${
              isDark
                ? 'bg-[#12172b] hover:bg-[#1a223f] text-slate-200 border-white/[0.08]'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-300'
            }`}
          >
            <span>Review Team Submissions</span>
            <ArrowUpRight className="w-4 h-4 text-purple-400" />
          </Link>
          <button
            onClick={fetchAuditData}
            disabled={loading}
            className={`px-3.5 py-2 text-xs font-semibold rounded-xl border flex items-center space-x-2 transition-all shadow-sm cursor-pointer ${
              isDark
                ? 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border-emerald-500/40'
                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border-emerald-300'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Audit</span>
          </button>
        </div>
      </div>

      {/* 2. 3 Pillar Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pillar 1: Task Queue (Fixed vs Rejected) */}
        <div
          onClick={() => setActiveTab('tasks')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 shadow-sm ${
            activeTab === 'tasks'
              ? isDark 
                ? 'bg-[#0f1424] border-purple-500/70 ring-1 ring-purple-500/40 shadow-lg' 
                : 'bg-purple-50/60 border-purple-400 ring-1 ring-purple-300 shadow-md'
              : isDark
                ? 'bg-[#090d1c]/80 border-white/[0.08] hover:border-white/[0.15]'
                : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-purple-300' : 'text-purple-700'
            }`}>
              <CheckCircle2 className="w-4 h-4" /> Task Resolution Queue
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-medium ${
              isDark ? 'bg-purple-500/20 text-purple-300' : 'bg-purple-100 text-purple-700'
            }`}>
              {tasksSummary.completion_rate || 0}% Complete
            </span>
          </div>

          <div className="mt-3 flex items-baseline space-x-3">
            <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{tasksSummary.completed || 0}</span>
            <span className="text-xs text-emerald-500 font-semibold">Fixed & Verified</span>
            <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>/</span>
            <span className="text-xl font-bold text-rose-500">{tasksSummary.rejected || 0}</span>
            <span className="text-xs text-rose-500 font-semibold">Rejected</span>
          </div>

          <div className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-white/[0.08] text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span>In Progress: <strong className={isDark ? 'text-blue-300' : 'text-blue-600'}>{tasksSummary.in_progress || 0}</strong></span>
            <span>Blocked: <strong className={isDark ? 'text-amber-300' : 'text-amber-600'}>{tasksSummary.blocked || 0}</strong></span>
            <span>Total: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{tasksSummary.total || 0}</strong></span>
          </div>
        </div>

        {/* Pillar 2: Feature Scope Delta (Added vs Removed) */}
        <div
          onClick={() => setActiveTab('features')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 shadow-sm ${
            activeTab === 'features'
              ? isDark 
                ? 'bg-[#0f1424] border-emerald-500/70 ring-1 ring-emerald-500/40 shadow-lg' 
                : 'bg-emerald-50/60 border-emerald-400 ring-1 ring-emerald-300 shadow-md'
              : isDark
                ? 'bg-[#090d1c]/80 border-white/[0.08] hover:border-white/[0.15]'
                : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-emerald-400' : 'text-emerald-700'
            }`}>
              <Layers className="w-4 h-4" /> Features Delta
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-medium ${
              isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {featuresSummary.total_features || 0} Items
            </span>
          </div>

          <div className="mt-3 flex items-baseline space-x-3">
            <span className="text-3xl font-bold text-emerald-500">+{featuresSummary.features_added_count || 0}</span>
            <span className="text-xs text-emerald-500 font-semibold">Added</span>
            <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>/</span>
            <span className="text-xl font-bold text-amber-500">-{featuresSummary.features_removed_count || 0}</span>
            <span className="text-xs text-amber-500 font-semibold">Out of Scope</span>
          </div>

          <div className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-white/[0.08] text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span>Planned: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{featuresSummary.features_planned_count || 0}</strong></span>
            <span>Boundary: <strong className="text-emerald-500 font-semibold">Enforced</strong></span>
          </div>
        </div>

        {/* Pillar 3: Issues Fixed vs Open */}
        <div
          onClick={() => setActiveTab('issues')}
          className={`cursor-pointer rounded-2xl p-5 border transition-all duration-200 shadow-sm ${
            activeTab === 'issues'
              ? isDark 
                ? 'bg-[#0f1424] border-cyan-500/70 ring-1 ring-cyan-500/40 shadow-lg' 
                : 'bg-cyan-50/60 border-cyan-400 ring-1 ring-cyan-300 shadow-md'
              : isDark
                ? 'bg-[#090d1c]/80 border-white/[0.08] hover:border-white/[0.15]'
                : 'bg-white border-slate-200 hover:border-slate-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 ${
              isDark ? 'text-cyan-400' : 'text-cyan-700'
            }`}>
              <AlertTriangle className="w-4 h-4" /> Issues & Defects Resolution
            </span>
            <span className={`text-xs px-2 py-0.5 rounded-md font-mono font-medium ${
              isDark ? 'bg-cyan-500/20 text-cyan-300' : 'bg-cyan-100 text-cyan-700'
            }`}>
              {issuesSummary.fix_rate || 0}% Solved
            </span>
          </div>

          <div className="mt-3 flex items-baseline space-x-3">
            <span className="text-3xl font-bold text-cyan-500">{issuesSummary.issues_fixed_count || 0}</span>
            <span className="text-xs text-cyan-500 font-semibold">Issues Fixed</span>
            <span className={isDark ? 'text-slate-600' : 'text-slate-400'}>/</span>
            <span className="text-xl font-bold text-rose-500">{issuesSummary.issues_open_count || 0}</span>
            <span className="text-xs text-rose-500 font-semibold">Open Friction</span>
          </div>

          <div className={`mt-3 pt-3 border-t flex items-center justify-between text-xs ${
            isDark ? 'border-white/[0.08] text-slate-400' : 'border-slate-200 text-slate-500'
          }`}>
            <span>Total Tracked: <strong className={isDark ? 'text-slate-200' : 'text-slate-700'}>{issuesSummary.total_issues || 0}</strong></span>
            <span>Impact: <strong className="text-cyan-500 font-semibold">Monitored</strong></span>
          </div>
        </div>
      </div>

      {/* 3. Navigation Tab Bar & Filters */}
      <div className={`p-4 rounded-2xl border backdrop-blur-xl flex flex-col md:flex-row gap-3 items-center justify-between ${
        isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
      }`}>
        {/* Tab Switcher */}
        <div className={`flex items-center p-1 rounded-xl border ${
          isDark ? 'bg-[#060814] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
        }`}>
          <button
            onClick={() => setActiveTab('tasks')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-purple-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Problem Tasks Queue
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'features'
                ? 'bg-emerald-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Features Added / Removed
          </button>
          <button
            onClick={() => setActiveTab('issues')}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              activeTab === 'issues'
                ? 'bg-cyan-600 text-white shadow-md'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Issues Fixed vs Open
          </button>
        </div>

        {/* Sub-Filters per active tab */}
        <div className="flex flex-wrap items-center gap-2">
          {activeTab === 'tasks' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
              isDark ? 'bg-[#060814] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Queue:</span>
              <select
                value={taskFilter}
                onChange={(e) => setTaskFilter(e.target.value)}
                className={`bg-transparent outline-none cursor-pointer font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
              >
                <option value="ALL" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>All Tasks</option>
                <option value="COMPLETED" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>Fixed & Verified</option>
                <option value="REJECTED" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>Rejected / Rework</option>
                <option value="IN_PROGRESS" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>In Progress</option>
                <option value="BLOCKED" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>Blocked</option>
              </select>
            </div>
          )}

          {activeTab === 'features' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
              isDark ? 'bg-[#060814] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Delta:</span>
              <select
                value={featureFilter}
                onChange={(e) => setFeatureFilter(e.target.value)}
                className={`bg-transparent outline-none cursor-pointer font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
              >
                <option value="ALL" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>All Delta Items</option>
                <option value="ADDED" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>Features Added (In-Scope)</option>
                <option value="REMOVED" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>Features Removed (Out-of-Scope)</option>
                <option value="PLANNED" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>Planned Backlog</option>
              </select>
            </div>
          )}

          {activeTab === 'issues' && (
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs ${
              isDark ? 'bg-[#060814] border-white/[0.08]' : 'bg-slate-100 border-slate-200'
            }`}>
              <span className={isDark ? 'text-slate-400' : 'text-slate-500'}>Status:</span>
              <select
                value={issueFilter}
                onChange={(e) => setIssueFilter(e.target.value)}
                className={`bg-transparent outline-none cursor-pointer font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}
              >
                <option value="ALL" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>All Issues</option>
                <option value="FIXED" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>Issues Fixed</option>
                <option value="OPEN" className={isDark ? 'bg-[#0e1220] text-slate-200' : 'bg-white text-slate-800'}>Open Friction / Defects</option>
              </select>
            </div>
          )}

          {/* Search bar */}
          <div className="relative w-64">
            <Search className={`w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 ${
              isDark ? 'text-slate-400' : 'text-slate-500'
            }`} />
            <input
              type="text"
              placeholder="Search items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-8 pr-3 py-1.5 rounded-xl text-xs outline-none border transition-colors ${
                isDark 
                  ? 'bg-[#060814] border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-purple-500/60' 
                  : 'bg-slate-100 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-purple-400'
              }`}
            />
          </div>
        </div>
      </div>

      {/* 4. Main Content Areas */}
      {loading ? (
        <div className={`h-64 flex flex-col items-center justify-center space-y-3 rounded-2xl border backdrop-blur-xl ${
          isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
        }`}>
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-emerald-500"></div>
          <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading resolution audit and queue telemetry...</span>
        </div>
      ) : (
        <div>
          {/* TAB 1: Tasks Queue (Fixed vs Rejected) */}
          {activeTab === 'tasks' && (
            <div className="space-y-3">
              {filteredTasks.length === 0 ? (
                <div className={`h-48 flex flex-col items-center justify-center rounded-2xl border text-center p-6 ${
                  isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
                }`}>
                  <CheckCircle2 className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No tasks in this queue for the selected scope.</span>
                </div>
              ) : (
                filteredTasks.map((task) => {
                  const isCompleted = task.review_status === 'ACCEPTED' || ['COMPLETED', 'APPROVED', 'FIXED', 'VERIFIED'].includes(task.status);
                  const isRejected = task.review_status === 'REJECTED' || task.status === 'REJECTED';
                  const isBlocked = task.status === 'BLOCKED';

                  return (
                    <div
                      key={task.assignment_id}
                      className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isDark 
                          ? 'bg-[#090d1c]/80 border-white/[0.08] hover:border-white/[0.15]' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1.5 max-w-2xl">
                        <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                            isDark ? 'text-purple-300 bg-purple-500/10 border-purple-500/30' : 'text-purple-700 bg-purple-50 border-purple-200'
                          }`}>
                            {task.requirement_id || 'TASK'}
                          </span>
                          <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {task.prd_title || 'PRD'}
                          </span>
                          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
                          <span className={`text-[11px] px-2 py-0.5 rounded border ${
                            isDark ? 'text-slate-300 bg-white/[0.04] border-white/[0.08]' : 'text-slate-700 bg-slate-100 border-slate-200'
                          }`}>
                            {task.team_role}
                          </span>
                        </div>

                        <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {task.requirement_title || 'Deliverable Task'}
                        </h4>

                        {task.response && (
                          <p className={`text-xs line-clamp-2 p-2.5 rounded-xl border font-mono ${
                            isDark ? 'bg-[#060814] border-white/[0.08] text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'
                          }`}>
                            {task.response}
                          </p>
                        )}

                        {task.review_notes && (
                          <div className={`text-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                            <span className="font-semibold">PM Note:</span> {task.review_notes}
                          </div>
                        )}
                      </div>

                      {/* Right metadata & Action */}
                      <div className="flex items-center space-x-3 flex-shrink-0">
                        <div className="text-right">
                          <div className={`text-xs font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{task.user_name || 'Assigned Lead'}</div>
                          <div className={`text-[11px] ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>{task.user_email}</div>
                        </div>

                        {isCompleted && (
                          <span className={`px-3 py-1 text-xs font-medium rounded-xl flex items-center gap-1.5 border ${
                            isDark ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          }`}>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Fixed / Verified
                          </span>
                        )}
                        {isRejected && (
                          <span className={`px-3 py-1 text-xs font-medium rounded-xl flex items-center gap-1.5 border ${
                            isDark ? 'bg-rose-950/80 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700'
                          }`}>
                            <XCircle className="w-3.5 h-3.5 text-rose-500" /> Rejected Queue
                          </span>
                        )}
                        {isBlocked && (
                          <span className={`px-3 py-1 text-xs font-medium rounded-xl flex items-center gap-1.5 border ${
                            isDark ? 'bg-amber-950/80 border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-700'
                          }`}>
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Blocked
                          </span>
                        )}
                        {!isCompleted && !isRejected && !isBlocked && (
                          <span className={`px-3 py-1 text-xs font-medium rounded-xl flex items-center gap-1.5 border ${
                            isDark ? 'bg-blue-950/80 border-blue-500/40 text-blue-300' : 'bg-blue-50 border-blue-300 text-blue-700'
                          }`}>
                            <Clock className="w-3.5 h-3.5 text-blue-500" /> In Progress
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 2: Features Added / Removed */}
          {activeTab === 'features' && (
            <div className="space-y-3">
              {filteredFeatures.length === 0 ? (
                <div className={`h-48 flex flex-col items-center justify-center rounded-2xl border text-center p-6 ${
                  isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
                }`}>
                  <Layers className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No feature scope items match your filter.</span>
                </div>
              ) : (
                filteredFeatures.map((feat, idx) => {
                  const isAdded = feat.status === 'added';
                  const isRemoved = feat.status === 'removed';

                  return (
                    <div
                      key={feat.feature_id || idx}
                      className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isDark 
                          ? 'bg-[#090d1c]/80 border-white/[0.08] hover:border-white/[0.15]' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1.5 max-w-3xl">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                            isDark ? 'text-slate-300 bg-white/[0.04] border-white/[0.08]' : 'text-slate-700 bg-slate-100 border-slate-200'
                          }`}>
                            {feat.feature_id}
                          </span>
                          {feat.prd_id && (
                            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                              PRD: {feat.prd_id}
                            </span>
                          )}
                          <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
                          <span className={`text-[11px] uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Priority: {feat.priority || 'Medium'}
                          </span>
                        </div>

                        <h4 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {isAdded && <PlusCircle className="w-4 h-4 text-emerald-500 shrink-0" />}
                          {isRemoved && <MinusCircle className="w-4 h-4 text-amber-500 shrink-0" />}
                          {!isAdded && !isRemoved && <Clock className="w-4 h-4 text-slate-400 shrink-0" />}
                          {feat.name}
                        </h4>

                        <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>{feat.description}</p>

                        {feat.reason && (
                          <div className={`text-[11px] p-2.5 rounded-xl border ${
                            isDark ? 'bg-[#060814] border-white/[0.08] text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-600'
                          }`}>
                            <span className={`font-semibold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Rationale:</span> {feat.reason}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isAdded && (
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 border ${
                            isDark ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          }`}>
                            <PlusCircle className="w-4 h-4 text-emerald-500" /> Feature Added (In Scope)
                          </span>
                        )}
                        {isRemoved && (
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 border ${
                            isDark ? 'bg-amber-950/80 border-amber-500/40 text-amber-300' : 'bg-amber-50 border-amber-300 text-amber-700'
                          }`}>
                            <MinusCircle className="w-4 h-4 text-amber-500" /> Feature Removed / Out of Scope
                          </span>
                        )}
                        {!isAdded && !isRemoved && (
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 border ${
                            isDark ? 'bg-white/[0.04] border-white/[0.08] text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-700'
                          }`}>
                            <Clock className="w-4 h-4 text-slate-400" /> Planned in Backlog
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* TAB 3: Issues Fixed vs Open */}
          {activeTab === 'issues' && (
            <div className="space-y-3">
              {filteredIssues.length === 0 ? (
                <div className={`h-48 flex flex-col items-center justify-center rounded-2xl border text-center p-6 ${
                  isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
                }`}>
                  <CheckCircle2 className={`w-8 h-8 mb-2 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                  <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No issues found matching the criteria.</span>
                </div>
              ) : (
                filteredIssues.map((issue, idx) => {
                  const isFixed = ['VERIFIED_CLOSED', 'CLOSED', 'RESOLVED'].includes(issue.status);

                  return (
                    <div
                      key={issue.defect_id || idx}
                      className={`p-4 rounded-2xl border backdrop-blur-xl transition-all duration-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                        isDark 
                          ? 'bg-[#090d1c]/80 border-white/[0.08] hover:border-white/[0.15]' 
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="space-y-1.5 max-w-3xl">
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border ${
                            isDark ? 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30' : 'text-cyan-700 bg-cyan-50 border-cyan-200'
                          }`}>
                            {issue.defect_id}
                          </span>
                          <span className={`text-[11px] uppercase font-semibold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            Severity: {issue.severity || 'Medium'}
                          </span>
                          {issue.prd_id && (
                            <>
                              <span className={isDark ? 'text-slate-600' : 'text-slate-300'}>•</span>
                              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>PRD: {issue.prd_id}</span>
                            </>
                          )}
                        </div>

                        <h4 className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{issue.title}</h4>

                        {issue.fix_notes && (
                          <div className={`text-xs p-2.5 rounded-xl border ${
                            isDark ? 'text-emerald-300 bg-emerald-950/30 border-emerald-500/30' : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                          }`}>
                            <span className="font-semibold">Fix Verification:</span> {issue.fix_notes}
                          </div>
                        )}
                      </div>

                      <div className="shrink-0">
                        {isFixed ? (
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 border ${
                            isDark ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          }`}>
                            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Issue Fixed & Verified
                          </span>
                        ) : (
                          <span className={`px-3 py-1.5 text-xs font-semibold rounded-xl flex items-center gap-1.5 border ${
                            isDark ? 'bg-rose-950/80 border-rose-500/40 text-rose-300' : 'bg-rose-50 border-rose-300 text-rose-700'
                          }`}>
                            <AlertTriangle className="w-4 h-4 text-rose-500" /> Open Customer Friction
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
