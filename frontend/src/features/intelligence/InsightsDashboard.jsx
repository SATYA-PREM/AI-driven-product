import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Download,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { intelligenceApi } from '../../api/intelligence';
import { datasetApi } from '../../api/datasets';
import { productApi } from '../../api/workspaces';
import { getSessionCache } from '../../api/core';
import { 
  getActiveWorkspaceId, 
  getActiveProductId, 
  setActiveProductId, 
  subscribeToActiveProduct,
  getActiveDatasetId,
  subscribeToActiveDataset
} from '../../utils/workspaceAccess';
import { cn } from './components/IntelligenceUIPrimitives';

// Import standalone modular sub-components
import Overview from './Overview';
import PainPoints from './PainPoints';
import Trends from './Trends';
import Themes from './Themes';
import Sentiment from './Sentiment';
import Segments from './Segments';
import Comparisons from './Comparisons';

/* =========================================
   CONSTANTS & TAB MAPPING
   ========================================= */
const TABS = ['Overview', 'Pain Points', 'Trends', 'Themes', 'Sentiment', 'Segments', 'Comparisons'];

function getTabFromHash(hash) {
  const key = (hash || '').replace('#', '');
  const map = {
    Overview: 'Overview',
    PainPoints: 'Pain Points',
    Trends: 'Trends',
    Themes: 'Themes',
    Sentiment: 'Sentiment',
    Segments: 'Segments',
    Comparisons: 'Comparisons',
  };
  return map[key] || 'Overview';
}

function useLocalTab() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(() => getTabFromHash(location.hash));
  useEffect(() => { setActiveTab(getTabFromHash(location.hash)); }, [location.hash]);
  const selectTab = (tab) => {
    setActiveTab(tab);
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}#${tab.replace(/\s+/g, '')}`);
  };
  return [activeTab, selectTab];
}

/* =========================================
   MAIN INSIGHTS DASHBOARD CONTAINER
   ========================================= */
export default function InsightsDashboard() {
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = routeWorkspaceId || getActiveWorkspaceId();

  const [activeTab, setActiveTab] = useLocalTab();
  const [toastMessage, setToastMessage] = useState(null);

  // Multi-Product & Dataset Selector State
  const [products, setProducts] = useState(() => 
    (workspaceId && getSessionCache(`/products/?workspace_id=${encodeURIComponent(workspaceId)}`)) || []
  );
  const [selectedProductId, setSelectedProductId] = useState(() => getActiveProductId());
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => getActiveDatasetId());

  // Cached initial snapshot
  const getCachedInsights = () => {
    if (!workspaceId) return null;
    const opts = {};
    if (selectedProductId) opts.product_id = selectedProductId;
    if (selectedDatasetId) opts.dataset_id = selectedDatasetId;

    const params = new URLSearchParams();
    if (opts.dataset_id) params.append('dataset_id', opts.dataset_id);
    if (opts.product_id) params.append('product_id', opts.product_id);
    const qStr = params.toString() ? `?${params.toString()}` : '';

    const cachedSummary = getSessionCache(`/workspaces/${workspaceId}/intelligence/summary${qStr}`);
    const cachedIssues = getSessionCache(`/workspaces/${workspaceId}/intelligence/issues${qStr ? `${qStr}&limit=50` : '?limit=50'}`)
      || getSessionCache(`/workspaces/${workspaceId}/intelligence/issues${qStr ? `${qStr}&limit=20` : '?limit=20'}`);
    const cachedFeatures = getSessionCache(`/workspaces/${workspaceId}/intelligence/features${qStr ? `${qStr}&limit=50` : '?limit=50'}`)
      || getSessionCache(`/workspaces/${workspaceId}/intelligence/features${qStr ? `${qStr}&limit=20` : '?limit=20'}`);
    const cachedSentiment = getSessionCache(`/workspaces/${workspaceId}/intelligence/sentiment${qStr}`);
    const cachedTrends = getSessionCache(`/workspaces/${workspaceId}/intelligence/trends${qStr ? `${qStr}&limit=50` : '?limit=50'}`)
      || getSessionCache(`/workspaces/${workspaceId}/intelligence/trends${qStr}`);
    const cachedInsightsList = getSessionCache(`/workspaces/${workspaceId}/intelligence/insights${qStr ? `${qStr}&limit=50` : '?limit=50'}`)
      || getSessionCache(`/workspaces/${workspaceId}/intelligence/insights${qStr ? `${qStr}&limit=20` : '?limit=20'}`);

    if (cachedSummary || cachedIssues || cachedFeatures || cachedSentiment) {
      return {
        summary: cachedSummary || null,
        issues: Array.isArray(cachedIssues) ? cachedIssues : [],
        features: Array.isArray(cachedFeatures) ? cachedFeatures : [],
        sentiment: cachedSentiment || null,
        trends: Array.isArray(cachedTrends) ? cachedTrends : [],
        insights: Array.isArray(cachedInsightsList) ? cachedInsightsList : [],
      };
    }
    return null;
  };

  const initialCached = getCachedInsights();

  // Live Backend Data State
  const [liveData, setLiveData] = useState(() => initialCached || {
    summary: null,
    issues: [],
    features: [],
    sentiment: null,
    trends: [],
    insights: [],
  });
  const [liveDatasets, setLiveDatasets] = useState(() => 
    (workspaceId && getSessionCache(`/datasets?workspace_id=${encodeURIComponent(workspaceId)}`)) || []
  );
  const [isLiveConnected, setIsLiveConnected] = useState(true);
  const [isLoading, setIsLoading] = useState(() => !initialCached);

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

  useEffect(() => {
    let isMounted = true;
    if (workspaceId) {
      productApi.list(workspaceId)
        .then((res) => {
          if (isMounted && Array.isArray(res)) {
            setProducts(res);
          }
        })
        .catch((err) => console.warn('Product list fetch notice:', err?.message));
    }
    return () => { isMounted = false; };
  }, [workspaceId]);

  const fetchInsightsData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const opts = {};
      if (selectedProductId) opts.product_id = selectedProductId;
      if (selectedDatasetId) opts.dataset_id = selectedDatasetId;

      const [
        sumRes, issRes, featRes, sentRes,
        trendsRes, insRes, dsRes
      ] = await Promise.allSettled([
        intelligenceApi.getSummary(workspaceId, opts),
        intelligenceApi.getIssues(workspaceId, opts, 50),
        intelligenceApi.getFeatures(workspaceId, opts, 50),
        intelligenceApi.getSentiment(workspaceId, opts),
        intelligenceApi.getTrends(workspaceId, opts, 50),
        intelligenceApi.getInsights(workspaceId, opts, 50),
        datasetApi.list(workspaceId),
      ]);

      const updated = {};
      if (sumRes.status === 'fulfilled' && sumRes.value) {
        updated.summary = sumRes.value;
      }
      if (issRes.status === 'fulfilled' && Array.isArray(issRes.value)) {
        updated.issues = issRes.value;
      }
      if (featRes.status === 'fulfilled' && Array.isArray(featRes.value)) {
        updated.features = featRes.value;
      }
      if (sentRes.status === 'fulfilled' && sentRes.value) {
        updated.sentiment = sentRes.value;
      }
      if (trendsRes.status === 'fulfilled' && Array.isArray(trendsRes.value)) {
        updated.trends = trendsRes.value;
      }
      if (insRes.status === 'fulfilled' && Array.isArray(insRes.value)) {
        updated.insights = insRes.value;
      }

      setLiveData(updated);
      setIsLiveConnected(true);

      if (dsRes.status === 'fulfilled' && Array.isArray(dsRes.value)) {
        setLiveDatasets(dsRes.value);
      }
    } catch {
      setIsLiveConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInsightsData();

    const onCacheUpdate = (e) => {
      const ep = e.detail?.endpoint;
      const data = e.detail?.data;
      if (!ep || !data) return;

      if (ep.includes('/intelligence/summary')) {
        setLiveData((prev) => ({ ...prev, summary: data }));
      } else if (ep.includes('/intelligence/issues')) {
        setLiveData((prev) => ({ ...prev, issues: Array.isArray(data) ? data : prev.issues }));
      } else if (ep.includes('/intelligence/features')) {
        setLiveData((prev) => ({ ...prev, features: Array.isArray(data) ? data : prev.features }));
      } else if (ep.includes('/intelligence/sentiment')) {
        setLiveData((prev) => ({ ...prev, sentiment: data }));
      } else if (ep.includes('/intelligence/trends')) {
        setLiveData((prev) => ({ ...prev, trends: Array.isArray(data) ? data : prev.trends }));
      } else if (ep.includes('/intelligence/insights')) {
        setLiveData((prev) => ({ ...prev, insights: Array.isArray(data) ? data : prev.insights }));
      }
    };

    window.addEventListener('cache_updated', onCacheUpdate);
    return () => window.removeEventListener('cache_updated', onCacheUpdate);
  }, [workspaceId, selectedProductId, selectedDatasetId]);

  const triggerToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const content = useMemo(() => {
    const props = { liveData, liveDatasets, onToast: triggerToast, workspaceId, selectedProductId, products };
    switch (activeTab) {
      case 'Overview': return <Overview {...props} />;
      case 'Pain Points': return <PainPoints {...props} />;
      case 'Trends': return <Trends {...props} />;
      case 'Themes': return <Themes {...props} />;
      case 'Sentiment': return <Sentiment {...props} />;
      case 'Segments': return <Segments {...props} />;
      case 'Comparisons': return <Comparisons {...props} />;
      default: return <Overview {...props} />;
    }
  }, [activeTab, liveData, liveDatasets, workspaceId, selectedProductId, products]);

  return (
    <div className="w-full bg-transparent text-slate-300 font-sans flex flex-col space-y-1 pb-12 select-none">
      {/* Header Actions */}
      <div className="py-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-white tracking-tight">{activeTab}</h1>
          <button
            onClick={fetchInsightsData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-purple-500/40 text-xs transition-colors cursor-pointer"
            title="Refresh Data"
          >
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : isLoading ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'}`}></span>
            <span className="text-[11px] font-medium text-slate-300">
              {isLoading ? 'Syncing...' : (isLiveConnected ? 'Live' : 'Offline')}
            </span>
            <RefreshCw size={11} className={`text-slate-400 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to={`/workspace/${workspaceId}/pm-dashboard`} className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] px-3.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white transition-colors hover:border-purple-500/40">
            <Sparkles className="w-3.5 h-3.5 text-purple-400"/> PM Dashboard
          </Link>
          <Link to={`/workspace/${workspaceId}/development/prd`} className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 px-4 py-1.5 rounded-xl text-xs font-semibold text-white shadow-lg shadow-purple-600/20 transition-all">
            <Sparkles className="w-3.5 h-3.5"/> PRD Studio
          </Link>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-6 border-b border-white/[0.08] mb-6 overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-xs font-semibold relative transition-colors whitespace-nowrap cursor-pointer",
              activeTab === tab ? "text-purple-400" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-cyan-400 rounded-t-md shadow-[0_0_10px_rgba(168,85,247,0.5)] transition-all" />
            )}
          </button>
        ))}
      </div>

      {/* Active Tab View */}
      <div className="w-full">
        {isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="w-6 h-6 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"/>
          </div>
        ) : content}
      </div>

      {/* Floating Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-8 right-8 z-50 flex items-center gap-2.5 bg-[#111827] border border-violet-500/30 px-4 py-3 rounded-xl shadow-2xl transition-all">
          <Sparkles className="w-4 h-4 text-violet-400"/>
          <span className="text-[11px] font-medium text-slate-100">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}