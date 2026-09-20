import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Database,
  Download,
  Eye,
  Filter,
  Layers,
  ListFilter,
  RefreshCw,
  Search,
  Sparkles,
  Target,
  TrendingDown,
  TrendingUp,
  X,
} from 'lucide-react';
import { intelligenceApi, datasetApi, productApi } from '../../api/client';
import { 
  getActiveWorkspaceId, 
  getActiveProductId, 
  setActiveProductId, 
  subscribeToActiveProduct,
  getActiveDatasetId,
  subscribeToActiveDataset
} from '../../utils/workspaceAccess';

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function CriticalIssues(props) {
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = props?.workspaceId || routeWorkspaceId || getActiveWorkspaceId();
  
  // Try retrieving outlet context safely
  const outletContext = useOutletContext() || {};
  const isDark = outletContext.isDark !== undefined ? outletContext.isDark : true;

  const [issues, setIssues] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(() => getActiveProductId());
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => getActiveDatasetId());

  useEffect(() => {
    const unsubProd = subscribeToActiveProduct((newProdId) => {
      setSelectedProductId(newProdId);
    });
    const unsubDs = subscribeToActiveDataset((newDsId) => {
      setSelectedDatasetId(newDsId);
    });
    return () => {
      unsubProd();
      unsubDs();
    };
  }, []);

  const handleProductChange = (e) => {
    const val = e.target.value;
    setSelectedProductId(val);
    setActiveProductId(val);
  };
  const [severityFilter, setSeverityFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [inspectingIssue, setInspectingIssue] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (workspaceId) {
      productApi.list(workspaceId)
        .then((res) => { if (isMounted && Array.isArray(res)) setProducts(res); })
        .catch((err) => console.warn('Product list notice:', err));
    }
    return () => { isMounted = false; };
  }, [workspaceId]);

  const fetchIssuesData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const opts = {
        dataset_id: selectedDatasetId || null,
        product_id: selectedProductId || null,
      };
      const [issuesRes, dsRes] = await Promise.allSettled([
        intelligenceApi.getIssues(workspaceId, opts, 100),
        datasetApi.list(workspaceId),
      ]);

      if (issuesRes.status === 'fulfilled' && Array.isArray(issuesRes.value)) {
        setIssues(issuesRes.value);
        setIsLiveConnected(true);
      } else {
        setIsLiveConnected(false);
      }

      if (dsRes.status === 'fulfilled' && Array.isArray(dsRes.value)) {
        setDatasets(dsRes.value);
      }
    } catch {
      setIsLiveConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchIssuesData();
  }, [workspaceId, selectedDatasetId, selectedProductId]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Issues
  const filteredIssues = useMemo(() => {
    return issues.filter((issue) => {
      const severity = (issue.severity || issue.priority_level || 'MEDIUM').toUpperCase();
      const matchesSeverity =
        severityFilter === 'All' ||
        severity === severityFilter.toUpperCase() ||
        (severityFilter === 'HIGH' && ['HIGH', 'CRITICAL'].includes(severity));

      const name = (issue.name || issue.title || '').toLowerCase();
      const clusterId = (issue.cluster_id || issue.id || '').toLowerCase();
      const desc = (issue.description || issue.root_cause || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = !query || name.includes(query) || clusterId.includes(query) || desc.includes(query);

      return matchesSeverity && matchesSearch;
    });
  }, [issues, severityFilter, searchQuery]);

  // Derived KPI Summary Metrics
  const totalIssuesCount = issues.length;
  const criticalCount = issues.filter(i => ['CRITICAL', 'HIGH'].includes((i.severity || i.priority_level || '').toUpperCase())).length;
  const avgScore = issues.length > 0 
    ? Math.round(issues.reduce((acc, i) => acc + (i.priority_score || i.score || 50), 0) / issues.length) 
    : 0;
  const totalMentionsSum = issues.reduce((acc, i) => acc + (i.frequency || i.count || 0), 0);

  const getSeverityBadge = (severity) => {
    const s = (severity || 'MEDIUM').toUpperCase();
    switch (s) {
      case 'CRITICAL':
        return 'bg-rose-500/15 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/15 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-yellow-500/15 text-yellow-300 border-yellow-500/30';
      case 'LOW':
        return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
      default:
        return 'bg-slate-500/15 text-slate-400 border-slate-500/30';
    }
  };

  return (
    <div className="w-full bg-transparent text-slate-300 font-sans flex flex-col space-y-5 pb-12 select-none">
      {/* Header Bar */}
      <div className="py-2 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-white tracking-tight flex items-center gap-2.5">
              <AlertTriangle className="w-6 h-6 text-rose-400" />
              Critical Product Issues
            </h1>
            <button
              onClick={fetchIssuesData}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111827] border border-[#263348] text-xs hover:border-violet-500/50 cursor-pointer"
              title="Sync with MongoDB"
            >
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-[10px] font-mono text-slate-300">
                {isLoading ? 'Syncing...' : (isLiveConnected ? 'FastAPI + MongoDB Live' : 'Connecting...')}
              </span>
              <RefreshCw size={11} className={`text-slate-400 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Priority-scored issue clusters extracted by Agent 2 & Agent 3 using Reach, Severity, Sentiment & Business Impact algorithms.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            to={`/workspace/${workspaceId}/pm-dashboard`}
            className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-2 rounded-lg text-[10px] text-slate-300 hover:text-white transition-colors hover:border-violet-500/50"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" /> PM Dashboard
          </Link>
          <Link
            to={`/workspace/${workspaceId}/development/tasks`}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-[10px] font-medium text-white transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <Target className="w-3.5 h-3.5" /> View Roadmap Tasks
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-[#263348] bg-[#111827] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium text-slate-400">Total Issue Clusters</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <Layers size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[22px] font-bold text-white">{totalIssuesCount}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Extracted across feedback signals</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#263348] bg-[#111827] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium text-slate-400">Critical & High Priority</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-500/10 text-rose-400">
              <AlertTriangle size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[22px] font-bold text-rose-400">{criticalCount}</div>
            <span className="text-[10px] text-rose-500/80 mt-0.5 block">Immediate PM action required</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#263348] bg-[#111827] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium text-slate-400">Avg. Priority Score</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <Target size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[22px] font-bold text-amber-300">{avgScore} <span className="text-[12px] text-slate-500 font-normal">/ 100</span></div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Deterministic priority weighting</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#263348] bg-[#111827] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium text-slate-400">Affected Feedback Volume</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[22px] font-bold text-emerald-400">{totalMentionsSum.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Customer feedback mentions</span>
          </div>
        </div>
      </div>

      {/* Filter Controls Bar */}
      <div className="rounded-xl border border-[#263348] bg-[#111827] p-3.5 flex flex-col lg:flex-row items-center justify-between gap-3 shadow-lg">
        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search issues, IDs, root cause..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#182236] border border-[#2a3850] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Severity Tabs */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">

          <div className="flex items-center gap-1 bg-[#182236] border border-[#2a3850] p-1 rounded-lg">
            {['All', 'Critical', 'High', 'Medium', 'Low'].map((sev) => (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={cn(
                  'px-3 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer',
                  severityFilter === sev
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Table View */}
      <div className="rounded-xl border border-[#263348] bg-[#111827] overflow-hidden shadow-lg">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredIssues.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <AlertTriangle className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-medium">No issue clusters matched your active filter or search query.</p>
            <button
              onClick={() => { setSeverityFilter('All'); setSearchQuery(''); setSelectedDatasetId(''); }}
              className="text-[10px] text-violet-400 hover:underline font-semibold"
            >
              Reset all filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-[#172033] text-slate-400 border-b border-[#263348]">
                <tr>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] tracking-wider">Issue Cluster</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] tracking-wider text-center">Mentions</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] tracking-wider">Severity</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] tracking-wider">Priority Score</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263348]/60 text-slate-300">
                {filteredIssues.map((issue, idx) => {
                  const name = issue.name || issue.title || `Issue Cluster ${idx + 1}`;
                  const clusterId = issue.cluster_id || issue.id || `ISS-${idx + 101}`;
                  const frequency = issue.frequency || issue.count || issue.request_count || 1;
                  const severity = issue.severity || issue.priority_level || 'MEDIUM';
                  const score = issue.priority_score || issue.score || 50;

                  return (
                    <tr key={clusterId || idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-slate-100 truncate">{name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-[10px] font-mono text-slate-500">{clusterId}</span>
                          {issue.affected_component && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                              {issue.affected_component}
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                        {frequency.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={cn('px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border', getSeverityBadge(severity))}>
                          {severity}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 min-w-[140px]">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-white text-xs">{score}</span>
                          <div className="w-24 h-1.5 rounded-full bg-slate-800 overflow-hidden">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all duration-300',
                                score >= 80 ? 'bg-rose-500' : score >= 60 ? 'bg-amber-500' : 'bg-emerald-500'
                              )}
                              style={{ width: `${Math.min(100, Math.max(10, score))}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => setInspectingIssue(issue)}
                            className="flex items-center gap-1 bg-[#182236] hover:bg-[#22304d] text-slate-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-medium border border-[#2a3850] transition-colors cursor-pointer"
                          >
                            <Eye size={12} /> Inspect
                          </button>
                          <Link
                            to={`/workspace/${workspaceId}/development/tasks`}
                            onClick={() => triggerToast(`Converted "${name}" to roadmap execution task`)}
                            className="flex items-center gap-1 bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 hover:text-white px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border border-violet-500/30 transition-colors cursor-pointer"
                          >
                            Convert to Task →
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspection Modal / Drawer */}
      {inspectingIssue && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-[#263348] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto shadow-2xl p-6 relative text-slate-300 space-y-4">
            <button
              onClick={() => setInspectingIssue(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2.5">
              <span className={cn('px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border', getSeverityBadge(inspectingIssue.severity))}>
                {inspectingIssue.severity || 'MEDIUM'}
              </span>
              <span className="text-xs font-mono text-slate-500">{inspectingIssue.cluster_id || inspectingIssue.id}</span>
            </div>

            <h2 className="text-lg font-bold text-white tracking-tight">
              {inspectingIssue.name || inspectingIssue.title || 'Issue Cluster Breakdown'}
            </h2>

            <div className="grid grid-cols-3 gap-3 p-3 bg-[#172033] border border-[#232f48] rounded-xl text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Priority Score</span>
                <span className="text-sm font-bold text-amber-300 font-mono">{inspectingIssue.priority_score || inspectingIssue.score || 50} / 100</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Feedback Mentions</span>
                <span className="text-sm font-bold text-white font-mono">{inspectingIssue.frequency || inspectingIssue.count || 1}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Affected Module</span>
                <span className="text-xs font-medium text-violet-300 truncate block">{inspectingIssue.affected_component || 'Core Flow'}</span>
              </div>
            </div>

            {inspectingIssue.description && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Root Cause Analysis</h4>
                <p className="text-xs text-slate-300 leading-relaxed bg-[#182236] p-3 rounded-xl border border-[#2a3850]">
                  {inspectingIssue.description}
                </p>
              </div>
            )}

            {Array.isArray(inspectingIssue.sample_quotes) && inspectingIssue.sample_quotes.length > 0 && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">Customer Signals</h4>
                <div className="space-y-1.5">
                  {inspectingIssue.sample_quotes.map((quote, idx) => (
                    <p key={idx} className="text-[11px] italic text-slate-400 bg-[#141b2b] p-2.5 rounded-lg border border-[#1e293b]">
                      "{quote}"
                    </p>
                  ))}
                </div>
              </div>
            )}

            {inspectingIssue.recommendation && (
              <div>
                <h4 className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider mb-1">PM Recommendation</h4>
                <p className="text-xs text-emerald-300 bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
                  {inspectingIssue.recommendation}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-[#263348] flex justify-end gap-2.5">
              <button
                onClick={() => setInspectingIssue(null)}
                className="px-4 py-2 rounded-lg bg-[#182236] hover:bg-[#22304d] text-xs text-slate-300 font-medium cursor-pointer"
              >
                Close
              </button>
              <Link
                to={`/workspace/${workspaceId}/development/tasks`}
                onClick={() => {
                  triggerToast(`Converted issue to roadmap execution sprint`);
                  setInspectingIssue(null);
                }}
                className="px-4 py-2 rounded-lg bg-violet-600 hover:bg-violet-700 text-xs text-white font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                <Sparkles size={13} /> Convert to Execution Task
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 bg-[#111827] border border-violet-500/30 px-4 py-3 rounded-xl shadow-2xl transition-all">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span className="text-[11px] font-medium text-slate-100">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}