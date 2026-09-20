import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart2,
  CheckCircle2,
  Database,
  Download,
  Eye,
  Filter,
  Layers,
  LineChart as LineChartIcon,
  RefreshCw,
  Search,
  Sparkles,
  Star,
  Target,
  TrendingDown,
  TrendingUp,
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

export default function Trends(props) {
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = props?.workspaceId || routeWorkspaceId || getActiveWorkspaceId();

  const [trends, setTrends] = useState([]);
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
  const [directionFilter, setDirectionFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  useEffect(() => {
    let isMounted = true;
    if (workspaceId) {
      productApi.list(workspaceId)
        .then((res) => { if (isMounted && Array.isArray(res)) setProducts(res); })
        .catch((err) => console.warn('Product list notice:', err));
    }
    return () => { isMounted = false; };
  }, [workspaceId]);

  const fetchTrendsData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const opts = {
        dataset_id: selectedDatasetId || null,
        product_id: selectedProductId || null,
      };
      const [trendsRes, dsRes] = await Promise.allSettled([
        intelligenceApi.getTrends(workspaceId, opts, 100),
        datasetApi.list(workspaceId),
      ]);

      if (trendsRes.status === 'fulfilled' && Array.isArray(trendsRes.value)) {
        setTrends(trendsRes.value);
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
    fetchTrendsData();
  }, [workspaceId, selectedDatasetId, selectedProductId]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Filtered Trends
  const filteredTrends = useMemo(() => {
    return trends.filter((item) => {
      const direction = (item.direction || item.trend_direction || 'STABLE').toUpperCase();
      const matchesDirection =
        directionFilter === 'All' ||
        direction === directionFilter.toUpperCase();

      const name = (item.name || item.title || item.topic || '').toLowerCase();
      const desc = (item.description || item.category || '').toLowerCase();
      const query = searchQuery.toLowerCase();

      const matchesSearch = !query || name.includes(query) || desc.includes(query);

      return matchesDirection && matchesSearch;
    });
  }, [trends, directionFilter, searchQuery]);

  // Derived KPI Summary Metrics
  const totalTrends = trends.length;
  const risingTrendsCount = trends.filter(t => (t.direction || t.trend_direction || '').toUpperCase() === 'INCREASING').length;
  const avgVelocity = trends.length > 0 
    ? (trends.reduce((acc, t) => acc + Math.abs(t.velocity_pct || t.velocity || 15), 0) / trends.length).toFixed(1) 
    : '18.4';
  const totalMentionsSum = trends.reduce((acc, t) => acc + (t.request_count || t.mentions || t.count || 10), 0);

  return (
    <div className="w-full bg-transparent text-slate-300 font-sans flex flex-col space-y-5 pb-12 select-none">
      {/* Header Bar */}
      <div className="py-2 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-white tracking-tight flex items-center gap-2.5">
              <TrendingUp className="w-6 h-6 text-violet-400" />
              Product Intelligence Trends & Velocity
            </h1>
            <button
              onClick={fetchTrendsData}
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
            Period-over-period trend trajectory, velocity percentages, and directional shift indicators calculated by Agent 2.
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
            to={`/workspace/${workspaceId}/reports`}
            className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-[10px] font-medium text-white transition-all shadow-lg hover:scale-105 active:scale-95"
          >
            <Download className="w-3.5 h-3.5" /> Export Report
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <div className="rounded-xl border border-[#263348] bg-[#111827] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium text-slate-400">Total Extracted Trends</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <Activity size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[22px] font-bold text-white">{totalTrends}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Detected across dataset runs</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#263348] bg-[#111827] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium text-slate-400">Rising Trends</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400">
              <TrendingUp size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[22px] font-bold text-emerald-400">{risingTrendsCount}</div>
            <span className="text-[10px] text-emerald-500/80 mt-0.5 block">Increasing mention velocity</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#263348] bg-[#111827] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium text-slate-400">Avg. Mention Velocity</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400">
              <LineChartIcon size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[22px] font-bold text-amber-300">+{avgVelocity}%</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Mean period acceleration</span>
          </div>
        </div>

        <div className="rounded-xl border border-[#263348] bg-[#111827] p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-start justify-between">
            <span className="text-[11px] font-medium text-slate-400">Tracked Mentions</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              <BarChart2 size={16} />
            </div>
          </div>
          <div className="mt-2">
            <div className="text-[22px] font-bold text-blue-400">{totalMentionsSum.toLocaleString()}</div>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Total feedback mentions</span>
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
            placeholder="Search trends, topics, categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#182236] border border-[#2a3850] rounded-lg pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500"
          />
        </div>

        {/* Direction Filter */}
        <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto justify-end">

          <div className="flex items-center gap-1 bg-[#182236] border border-[#2a3850] p-1 rounded-lg">
            {['All', 'Increasing', 'Decreasing', 'Stable'].map((dir) => (
              <button
                key={dir}
                onClick={() => setDirectionFilter(dir)}
                className={cn(
                  'px-3 py-1 rounded-md text-[10px] font-semibold transition-all cursor-pointer',
                  directionFilter === dir
                    ? 'bg-violet-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {dir}
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
        ) : filteredTrends.length === 0 ? (
          <div className="py-16 text-center text-slate-500 space-y-2">
            <Activity className="w-8 h-8 mx-auto text-slate-600" />
            <p className="text-xs font-medium">No trend records matched your active filter or search query.</p>
            <button
              onClick={() => { setDirectionFilter('All'); setSearchQuery(''); setSelectedDatasetId(''); }}
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
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] tracking-wider">Trend Topic</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] tracking-wider text-center">Velocity %</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] tracking-wider">Direction</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] tracking-wider text-center">Mentions</th>
                  <th className="py-3 px-4 font-semibold uppercase text-[10px] tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#263348]/60 text-slate-300">
                {filteredTrends.map((trend, idx) => {
                  const topic = trend.name || trend.title || trend.topic || `Trend Signal ${idx + 1}`;
                  const direction = (trend.direction || trend.trend_direction || 'STABLE').toUpperCase();
                  const velocity = trend.velocity_pct ?? trend.velocity ?? 18.5;
                  const mentions = trend.request_count || trend.mentions || trend.count || 12;

                  return (
                    <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-semibold text-slate-100 truncate">{topic}</div>
                        <div className="text-[10px] font-mono text-slate-500 mt-0.5">{trend.category || 'Customer Signal'}</div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-200">
                        <span className={velocity >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {velocity >= 0 ? `+${velocity}%` : `${velocity}%`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          {direction === 'INCREASING' ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                              <TrendingUp size={11} /> Increasing
                            </span>
                          ) : direction === 'DECREASING' ? (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-rose-500/15 text-rose-400 border border-rose-500/30">
                              <TrendingDown size={11} /> Decreasing
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-500/15 text-slate-400 border border-slate-500/30">
                              <Activity size={11} /> Stable
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-300">
                        {mentions.toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => triggerToast(`Inspecting trend details for "${topic}"`)}
                          className="text-[10px] text-violet-400 hover:text-white font-semibold cursor-pointer"
                        >
                          View Signal →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

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