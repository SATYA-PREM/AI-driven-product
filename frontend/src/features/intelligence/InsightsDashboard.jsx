import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useLocation, Link } from 'react-router-dom';
import {
  Download,
  RefreshCw,
  Sparkles,
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
  const [isLoading, setIsLoading] = useState(true);

  // Live Backend Data State
  const [liveData, setLiveData] = useState({
    summary: null,
    issues: [],
    features: [],
    sentiment: null,
    trends: [],
    insights: [],
  });
  const [liveDatasets, setLiveDatasets] = useState([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);

  // Multi-Product & Dataset Selector State
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
      <div className="py-4 flex flex-col xl:flex-row xl:items-end xl:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-[24px] font-bold text-white tracking-tight">{activeTab}</h1>
            <button
              onClick={fetchInsightsData}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#111827] border border-[#263348] text-xs hover:border-violet-500/50 cursor-pointer"
              title="Refresh MongoDB Data"
            >
              <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
              <span className="text-[10px] font-mono text-slate-300">
                {isLoading ? 'Syncing...' : (isLiveConnected ? 'FastAPI + MongoDB Live' : 'Connecting...')}
              </span>
              <RefreshCw size={11} className={`text-slate-400 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">Analyze live customer feedback signals across products in this workspace from MongoDB.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link to={`/workspace/${workspaceId}/pm-dashboard`} className="flex items-center gap-2 bg-[#111827] border border-[#263348] px-3.5 py-2 rounded-lg text-[10px] text-slate-300 hover:text-white transition-colors hover:border-violet-500/50">
            <Sparkles className="w-3.5 h-3.5 text-amber-400"/> PM Dashboard
          </Link>
          <Link to={`/workspace/${workspaceId}/reports`} className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg text-[10px] font-medium text-white transition-all shadow-lg hover:scale-105 active:scale-95">
            <Download className="w-3.5 h-3.5"/> Export Report
          </Link>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-6 border-b border-[#263348] mb-6 overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "pb-3 text-[12px] font-medium relative transition-colors whitespace-nowrap cursor-pointer",
              activeTab === tab ? "text-violet-400" : "text-slate-400 hover:text-slate-200"
            )}
          >
            {tab}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500 rounded-t-md shadow-[0_0_8px_rgba(139,92,246,0.6)] transition-all" />
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