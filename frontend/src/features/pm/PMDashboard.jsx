import { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MessageSquare, LayoutGrid, Star, Frown, Plus,
  ChevronDown, Send, Truck, CreditCard, Moon, Heart,
  FileText, Download, Eye, Calendar, Clock,
  Search, Bell, HelpCircle, ArrowRight, MousePointer,
  RotateCcw, Sparkles, UserCheck, Settings, LogOut,
  SquarePlus, Database, Activity, RefreshCw, Layers,
  X, Minimize2, Maximize2, MessageCircle, AlertCircle, CheckCircle2,
  TrendingUp, BarChart2
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  PieChart, Pie, Cell
} from 'recharts';
import { 
  getCurrentUser, logoutUser, setCurrentUser, setActiveWorkspaceId,
  getActiveDatasetId, subscribeToActiveDataset 
} from '../../utils/workspaceAccess';
import { intelligenceApi, workspaceApi, reportApi, datasetApi } from '../../api/client';
import { formatISTRelative, formatISTDateTime, formatISTTime } from '../../utils/dateUtils';

export default function PMDashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  // Sanitized display name (avoids raw 'string' from placeholder tokens)
  const rawName = currentUser?.name || '';
  const displayName = (rawName.toLowerCase() === 'string' || !rawName.trim()) 
    ? (currentUser?.email?.split('@')[0] || 'Product Manager') 
    : rawName;

  // Live Backend State from MongoDB
  const [currentWorkspace, setCurrentWorkspace] = useState(null);
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => getActiveDatasetId());
  const [liveData, setLiveData] = useState({
    summary: null,
    issues: [],
    features: [],
    sentiment: null,
    trends: [],
    insights: [],
    latestReport: null,
  });
  const [liveDatasets, setLiveDatasets] = useState([]);
  const [liveWorkspaces, setLiveWorkspaces] = useState([]);
  const [liveActivities, setLiveActivities] = useState([]);
  const [isLiveConnected, setIsLiveConnected] = useState(false);
  const [isLoadingLive, setIsLoadingLive] = useState(true);

  useEffect(() => {
    return subscribeToActiveDataset((newDsId) => {
      setSelectedDatasetId(newDsId);
    });
  }, []);

  // Floating AI Assistant Popup State
  const [isAiPopupOpen, setIsAiPopupOpen] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState([
    {
      sender: 'ai',
      text: `Hi ${displayName.split(' ')[0]}! 👋\nI'm your Product Intelligence Assistant, directly synced with your MongoDB feedback data. Ask me anything about customer pain points, feature requests, or strategic risks.`
    }
  ]);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const chatBottomRef = useRef(null);

  const fetchDashboardData = async () => {
    setIsLoadingLive(true);
    try {
      const opts = selectedDatasetId ? { dataset_id: selectedDatasetId } : null;
      const [
        sumRes, issRes, featRes, sentRes,
        trendsRes, insRes, repRes,
        wsRes, curWsRes, actRes, dsRes
      ] = await Promise.allSettled([
        intelligenceApi.getSummary(workspaceId, opts),
        intelligenceApi.getIssues(workspaceId, opts, 10),
        intelligenceApi.getFeatures(workspaceId, opts, 10),
        intelligenceApi.getSentiment(workspaceId, opts),
        intelligenceApi.getTrends(workspaceId, opts),
        intelligenceApi.getInsights(workspaceId, opts, 10),
        reportApi.getLatestReport(workspaceId),
        workspaceApi.listWorkspaces(),
        workspaceApi.getWorkspace(workspaceId),
        workspaceApi.getActivity(workspaceId, 10),
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
      if (repRes.status === 'fulfilled' && repRes.value) {
        updated.latestReport = repRes.value;
      }

      setLiveData(updated);
      setIsLiveConnected(true);

      if (wsRes.status === 'fulfilled' && Array.isArray(wsRes.value)) {
        setLiveWorkspaces(wsRes.value);
      }
      if (curWsRes.status === 'fulfilled' && curWsRes.value) {
        setCurrentWorkspace(curWsRes.value);
      }
      if (actRes.status === 'fulfilled' && Array.isArray(actRes.value)) {
        setLiveActivities(actRes.value);
      }
      if (dsRes.status === 'fulfilled' && Array.isArray(dsRes.value)) {
        setLiveDatasets(dsRes.value);
      }
    } catch {
      setIsLiveConnected(false);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [workspaceId, selectedDatasetId]);

  useEffect(() => {
    if (isAiPopupOpen && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiPopupOpen]);

  const [period, setPeriod] = useState('All-Time Live Data');
  const [showWsMenu, setShowWsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Suggested prompt questions
  const suggestedQuestions = [
    "What are the top customer pain points?",
    "Show me the most requested features",
    "What are the biggest risks right now?",
    "Generate PRD for top priority feature",
    "Summarize sentiment breakdown"
  ];

  const handleSendQuestion = (questionText) => {
    const q = questionText || chatInput;
    if (!q.trim()) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text: q }]);
    setChatInput('');
    setIsAiResponding(true);

    setTimeout(() => {
      const topIssue = liveData.issues?.[0];
      const secondIssue = liveData.issues?.[1];
      const thirdIssue = liveData.issues?.[2];

      const topFeature = liveData.features?.[0];
      const secondFeature = liveData.features?.[1];
      const thirdFeature = liveData.features?.[2];

      const negPct = liveData.sentiment?.percentages?.negative ?? 0;
      const posPct = liveData.sentiment?.percentages?.positive ?? 0;
      const totalCount = liveData.sentiment?.total_count ?? liveData.summary?.summary?.total_feedback_analyzed ?? 0;

      let answer = "";

      if (q.toLowerCase().includes('pain points') || q.toLowerCase().includes('issues') || q.toLowerCase().includes('problem')) {
        if (liveData.issues && liveData.issues.length > 0) {
          answer = `Top customer pain points from MongoDB:\n1) ${topIssue?.name || 'Critical Issue'} (${topIssue?.frequency || 1} mentions, ${topIssue?.priority_level?.toUpperCase() || 'MEDIUM'})\n${secondIssue ? `2) ${secondIssue.name} (${secondIssue.frequency || 1} mentions)\n` : ''}${thirdIssue ? `3) ${thirdIssue.name} (${thirdIssue.frequency || 1} mentions)` : ''}`;
        } else {
          answer = "No customer pain points detected yet. Ingest and run AI analysis on a dataset to cluster feedback issues.";
        }
      } else if (q.toLowerCase().includes('feature') || q.toLowerCase().includes('requested') || q.toLowerCase().includes('demand')) {
        if (liveData.features && liveData.features.length > 0) {
          answer = `Top requested features from MongoDB:\n1) ${topFeature?.name || 'Feature Demand'} (${topFeature?.frequency || topFeature?.request_count || 1} requests, Priority: ${topFeature?.priority_level?.toUpperCase() || 'P1'})\n${secondFeature ? `2) ${secondFeature.name} (${secondFeature.frequency || 1} requests)\n` : ''}${thirdFeature ? `3) ${thirdFeature.name} (${thirdFeature.frequency || 1} requests)` : ''}`;
        } else {
          answer = "No feature requests identified yet. Run AI pipeline to extract customer opportunities.";
        }
      } else if (q.toLowerCase().includes('risk') || q.toLowerCase().includes('critical') || q.toLowerCase().includes('quarter')) {
        if (negPct > 0) {
          answer = `Primary product risk: ${negPct}% of analyzed signals are negative (${liveData.sentiment?.distribution?.negative || 0} feedback items). Top friction area: '${topIssue?.name || 'Checkout/Export Failures'}'. Immediate mitigation is advised.`;
        } else {
          answer = "Customer satisfaction is healthy. Continue monitoring emerging issue clusters.";
        }
      } else if (q.toLowerCase().includes('sentiment')) {
        answer = `Customer Sentiment Breakdown across ${totalCount} records:\n• Positive: ${posPct}% (${liveData.sentiment?.distribution?.positive || 0} records)\n• Neutral: ${liveData.sentiment?.percentages?.neutral || 0}% (${liveData.sentiment?.distribution?.neutral || 0} records)\n• Negative: ${negPct}% (${liveData.sentiment?.distribution?.negative || 0} records)`;
      } else if (q.toLowerCase().includes('prd') || q.toLowerCase().includes('doc')) {
        if (topFeature) {
          answer = `Drafting PRD for '${topFeature.name}':\n• Scope: Implement high-demand capability requested by ${topFeature.frequency || 1} customers.\n• Business Impact: High positive sentiment lift.\n• Acceptance Criteria: Real-time telemetry, automated error recovery, responsive PM dashboard.`;
        } else {
          answer = "Upload a customer dataset first to identify top priority features for automated PRD generation.";
        }
      } else {
        answer = `Based on ${totalCount} feedback signals in workspace '${activeWorkspace?.name || 'Product Workspace'}', our primary friction point is '${topIssue?.name || 'system stability'}' and highest requested feature is '${topFeature?.name || 'automated reporting'}'.`;
      }

      setChatMessages((prev) => [...prev, { sender: 'ai', text: answer }]);
      setIsAiResponding(false);
    }, 450);
  };

  const handleSwitchWorkspace = (newId) => {
    setActiveWorkspaceId(newId);
    setShowWsMenu(false);
    navigate(`/workspace/${newId}/pm-dashboard`);
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const handleSwitchToPM = () => {
    setCurrentUser({
      name: 'Priya Sharma',
      email: 'pm@demo.com',
      role: 'PRODUCT_MANAGER',
      roleTitle: 'Product Manager',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    });
    setShowUserMenu(false);
    window.location.reload();
  };

  // --- Real MongoDB Metrics & Calculations ---
  const summaryObj = liveData.summary?.summary;
  const sentDist = liveData.sentiment?.distribution || {};
  const sentPcts = liveData.sentiment?.percentages || {};
  const totalSentimentCount = liveData.sentiment?.total_count || 0;

  // Real Counts directly from MongoDB
  const posCount = sentDist.positive || 0;
  const neuCount = sentDist.neutral || 0;
  const negCount = sentDist.negative || 0;
  const mixCount = sentDist.mixed || 0;

  // Real Percentages directly from MongoDB
  const posPct = sentPcts.positive ?? (totalSentimentCount > 0 ? Number(((posCount / totalSentimentCount) * 100).toFixed(1)) : 0);
  const neuPct = sentPcts.neutral ?? (totalSentimentCount > 0 ? Number(((neuCount / totalSentimentCount) * 100).toFixed(1)) : 0);
  const negPct = sentPcts.negative ?? (totalSentimentCount > 0 ? Number(((negCount / totalSentimentCount) * 100).toFixed(1)) : 0);

  const donutData = totalSentimentCount > 0 ? [
    { name: 'Positive', value: posPct, color: '#10b981', count: posCount },
    { name: 'Neutral', value: neuPct, color: '#f59e0b', count: neuCount },
    { name: 'Negative', value: negPct, color: '#f43f5e', count: negCount },
  ] : [
    { name: 'No Data', value: 100, color: '#1f293d', count: 0 }
  ];

  // Workspaces for selector
  const allWorkspaces = liveWorkspaces.map(ws => ({
    id: ws.id || ws._id,
    name: ws.name || 'Product Workspace',
    description: ws.description || '',
  }));

  const activeWorkspace = liveWorkspaces.find(w => (w.id || w._id) === workspaceId) || currentWorkspace;

  // Real KPI Metrics from MongoDB
  const kpiTotalFeedback = summaryObj?.total_feedback_analyzed ?? totalSentimentCount;
  const kpiIdentifiedThemes = summaryObj?.total_insights ?? ((liveData.issues?.length || 0) + (liveData.features?.length || 0));
  const kpiFeatureRequests = summaryObj?.high_demand_features ?? (liveData.features?.length || 0);
  const kpiHighPriority = summaryObj?.high_priority_issues ?? (liveData.issues?.filter(i => i.severity === 'high' || i.severity === 'critical' || (i.priority_score && i.priority_score >= 60) || i.priority_level === 'high').length || 0);
  
  // Real Dominant Sentiment Calculation
  let kpiSentiment = 'NEUTRAL';
  let sentimentSubtext = 'Balanced';
  if (totalSentimentCount === 0) {
    kpiSentiment = 'NO DATA';
    sentimentSubtext = 'Awaiting Ingestion';
  } else if (negCount >= posCount && negCount >= neuCount) {
    kpiSentiment = 'NEGATIVE';
    sentimentSubtext = 'Net Negative';
  } else if (posCount >= negCount && posCount >= neuCount) {
    kpiSentiment = 'POSITIVE';
    sentimentSubtext = 'Net Positive';
  }

  // --- Real Feedback Trend Data Construction from MongoDB Datasets & Analysis ---
  const trendPoints = (() => {
    if (liveDatasets && liveDatasets.length > 0) {
      const points = liveDatasets.map((ds, idx) => {
        const dName = ds.filename ? (ds.filename.length > 12 ? ds.filename.slice(0, 10) + '...' : ds.filename) : `Batch ${idx + 1}`;
        const rowCount = ds.total_rows || ds.row_count || (kpiTotalFeedback / liveDatasets.length);
        return {
          month: dName,
          value: Math.round(rowCount),
        };
      });
      return points;
    }
    if (kpiTotalFeedback > 0) {
      return [
        { month: 'Start', value: 0 },
        { month: 'Raw Upload', value: Math.round(kpiTotalFeedback * 0.4) },
        { month: 'Cleaned', value: Math.round(kpiTotalFeedback * 0.8) },
        { month: 'AI Analyzed', value: kpiTotalFeedback },
      ];
    }
    return [
      { month: 'No Data', value: 0 },
    ];
  })();

  const maxTrendVal = Math.max(...trendPoints.map(p => p.value), 10);

  // Top Pain Points (100% from MongoDB)
  const displayPainPoints = liveData.issues || [];

  // Top Feature Requests (100% from MongoDB)
  const displayFeatureRequests = liveData.features || [];

  // Dynamic Milestones synthesized from MongoDB insights/features
  const dynamicMilestones = (() => {
    const items = [];
    if (displayFeatureRequests.length > 0) {
      items.push({
        title: `Implement: ${displayFeatureRequests[0].name}`,
        date: 'P1 Sprint',
        status: 'In Progress',
        statusType: 'progress',
        iconColor: 'purple',
      });
    }
    if (displayPainPoints.length > 0) {
      items.push({
        title: `Resolve: ${displayPainPoints[0].name}`,
        date: 'Critical Hotfix',
        status: 'Upcoming',
        statusType: 'upcoming',
        iconColor: 'orange',
      });
    }
    if (displayFeatureRequests.length > 1) {
      items.push({
        title: `Plan: ${displayFeatureRequests[1].name}`,
        date: 'Next Phase',
        status: 'Planned',
        statusType: 'planned',
        iconColor: 'blue',
      });
    }
    return items;
  })();

  return (
    <div className="w-full font-sans text-slate-100 space-y-4 pb-12 select-none relative">
      
      {/* 1. Header Row (Welcome back + Live Badge + Workspace Selector + Header Utilities) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight flex items-center gap-2">
              Welcome back, {displayName.split(' ')[0]} 👋
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-300 border border-amber-500/30">
              Product Manager Command Center
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Executive intelligence, sentiment breakdown, and synthesized customer demand from MongoDB.
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Refresh / Live Status Badge */}
          <button
            type="button"
            onClick={fetchDashboardData}
            title="Refresh Live Metrics from MongoDB"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e1322] border border-[#1b2338] hover:border-[#5b3df5]/50 transition-all text-xs cursor-pointer"
          >
            <span className={`w-2 h-2 rounded-full ${isLiveConnected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`}></span>
            <span className="text-[11px] font-mono text-slate-300">
              {isLoadingLive ? 'Syncing...' : (isLiveConnected ? 'FastAPI + MongoDB Live' : 'Connecting to API...')}
            </span>
            <RefreshCw size={11} className={`text-slate-400 ml-1 ${isLoadingLive ? 'animate-spin' : ''}`} />
          </button>

          {/* Workspace dropdown selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWsMenu(!showWsMenu)}
              className="flex flex-col text-left px-3.5 py-1.5 rounded-xl bg-[#0e1322] border border-[#1b2338] hover:border-[#5b3df5]/50 transition-all cursor-pointer min-w-[170px]"
            >
              <span className="text-[10px] text-slate-400 font-medium leading-none">Workspace</span>
              <div className="flex items-center justify-between text-xs font-semibold text-white mt-1 gap-2">
                <span className="truncate">{activeWorkspace?.name || 'Product Workspace'}</span>
                <ChevronDown size={13} className="text-slate-400 shrink-0" />
              </div>
            </button>

            {showWsMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-[#121828] border border-[#202a42] shadow-2xl p-1.5 z-40 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 block">
                  Select Workspace
                </span>
                {allWorkspaces.map((ws) => (
                  <button
                    key={ws.id}
                    type="button"
                    onClick={() => handleSwitchWorkspace(ws.id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                      ws.id === workspaceId 
                        ? 'bg-[#5b3df5] text-white font-bold' 
                        : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {ws.id === workspaceId && <span className="text-[10px] font-mono">Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* User Profile */}
          <div className="relative">
            <div 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2.5 cursor-pointer p-1 rounded-xl hover:bg-white/[0.04] transition-all"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5b3df5] to-[#a855f7] flex items-center justify-center text-white font-bold text-xs shrink-0 border border-white/10">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:block text-left min-w-0">
                <p className="text-xs font-bold text-white leading-tight truncate">{displayName}</p>
                <p className="text-[10px] text-slate-400 leading-tight truncate">Product Manager</p>
              </div>
              <ChevronDown size={13} className="text-slate-400" />
            </div>

            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-[#121828] border border-[#202a42] rounded-xl shadow-2xl p-1.5 z-50 text-xs">
                <div className="px-2.5 py-1.5 border-b border-white/[0.06] mb-1">
                  <p className="font-bold text-white">{displayName}</p>
                  <p className="text-[10px] text-slate-400 truncate">{currentUser?.email || 'pm@productintel.ai'}</p>
                </div>

                <button
                  type="button"
                  onClick={handleSwitchToPM}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-amber-300 hover:bg-amber-500/10 flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck size={14} /> Switch to Priya Sharma (PM)
                </button>

                <button
                  type="button"
                  onClick={() => { setShowUserMenu(false); navigate('/profile'); }}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-slate-300 hover:bg-white/[0.05] flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <Settings size={14} /> Account Settings
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-2 py-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 flex items-center gap-2 cursor-pointer font-medium"
                >
                  <LogOut size={14} /> Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action button row: Ingestion & Upload shortcut */}
      <div className="flex justify-end -mt-1 -mb-1">
        <Link
          to={`/workspace/${workspaceId}/data/upload`}
          className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={15} />
          <span>New Upload</span>
        </Link>
      </div>

      {/* 2. Top KPI Cards (5 Cards from Real MongoDB Data) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* Total Feedback */}
        <div className="p-3.5 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
            <MessageSquare className="w-5 h-5 text-purple-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium block leading-none">Total Feedback</span>
            <p className="text-[22px] font-bold text-white tracking-tight mt-1 leading-none">
              {Number(kpiTotalFeedback).toLocaleString()}
            </p>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-0.5 mt-1.5 leading-none">
              Live from MongoDB
            </span>
          </div>
        </div>

        {/* Identified Themes */}
        <div className="p-3.5 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <LayoutGrid className="w-5 h-5 text-blue-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium block leading-none">Identified Themes</span>
            <p className="text-[22px] font-bold text-white tracking-tight mt-1 leading-none">{kpiIdentifiedThemes}</p>
            <span className="text-[11px] font-medium text-blue-400 flex items-center gap-0.5 mt-1.5 leading-none">
              Discovered Clusters
            </span>
          </div>
        </div>

        {/* Feature Requests */}
        <div className="p-3.5 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <SquarePlus className="w-5 h-5 text-emerald-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium block leading-none">Feature Requests</span>
            <p className="text-[22px] font-bold text-white tracking-tight mt-1 leading-none">{kpiFeatureRequests}</p>
            <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-0.5 mt-1.5 leading-none">
              Opportunities
            </span>
          </div>
        </div>

        {/* High Priority Features */}
        <div className="p-3.5 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium block leading-none">High Priority Features</span>
            <p className="text-[22px] font-bold text-white tracking-tight mt-1 leading-none">{kpiHighPriority}</p>
            <span className="text-[11px] font-medium text-amber-400 flex items-center gap-0.5 mt-1.5 leading-none">
              Action Required
            </span>
          </div>
        </div>

        {/* Customer Sentiment */}
        <div className="p-3.5 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            kpiSentiment === 'POSITIVE' ? 'bg-emerald-500/15 text-emerald-400' : (kpiSentiment === 'NEGATIVE' ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400')
          }`}>
            <Frown className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <span className="text-xs text-slate-400 font-medium block leading-none">Customer Sentiment</span>
            <p className={`text-[22px] font-bold tracking-tight mt-1 leading-none ${
              kpiSentiment === 'POSITIVE' ? 'text-emerald-400' : (kpiSentiment === 'NEGATIVE' ? 'text-rose-400' : 'text-amber-400')
            }`}>
              {kpiSentiment}
            </p>
            <span className={`text-[11px] font-medium block mt-1.5 leading-none ${
              kpiSentiment === 'POSITIVE' ? 'text-emerald-400' : (kpiSentiment === 'NEGATIVE' ? 'text-rose-400' : 'text-amber-400')
            }`}>
              {sentimentSubtext}
            </span>
          </div>
        </div>

      </div>

      {/* 3. Middle Section: 2-Column Trend & Sentiment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Feedback Trend Curve (7 cols width) */}
        <div className="lg:col-span-7 rounded-2xl bg-[#0e1322] border border-[#1b2338] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Feedback Trend</h3>
              <p className="text-[11px] text-slate-400">Signal volume across datasets in MongoDB</p>
            </div>
            <div className="flex items-center gap-1 text-[11px] text-slate-300 px-2.5 py-1 rounded-lg bg-[#121828] border border-[#1e273f]">
              <span>{period}</span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendPoints} margin={{ top: 15, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="pmPurpleGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="month" 
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  domain={[0, Math.ceil(maxTrendVal * 1.2)]}
                  stroke="#64748b" 
                  fontSize={11} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(v) => `${v}`} 
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#121828', borderColor: '#232d44', borderRadius: '8px', fontSize: '11px', color: '#fff' }} 
                  formatter={(val) => [`${val} records`, 'Volume']}
                />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8b5cf6" 
                  strokeWidth={2.5} 
                  fillOpacity={1} 
                  fill="url(#pmPurpleGradient)" 
                  dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#ffffff' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Distribution Donut Chart (5 cols width) */}
        <div className="lg:col-span-5 rounded-2xl bg-[#0e1322] border border-[#1b2338] p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-white">Sentiment Distribution</h3>
              <p className="text-[11px] text-slate-400">Classified by Agent 1</p>
            </div>
            <span className="text-[11px] font-mono text-slate-400 px-2 py-0.5 rounded bg-[#121828] border border-[#1e273f]">
              {Number(kpiTotalFeedback).toLocaleString()} signals
            </span>
          </div>

          <div className="flex items-center justify-around gap-4 my-auto py-2">
            {/* Donut Chart */}
            <div className="w-36 h-36 relative shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={64}
                    paddingAngle={donutData.length > 1 ? 3 : 0}
                    dataKey="value"
                  >
                    {donutData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#121828', borderColor: '#232d44', borderRadius: '8px', fontSize: '11px', color: '#fff' }} 
                    formatter={(val) => [`${val}%`, 'Sentiment Ratio']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] text-slate-400 font-medium">Dominant</span>
                <span className="text-xs font-bold text-white">{kpiSentiment}</span>
              </div>
            </div>

            {/* Legend with live values and percentages */}
            <div className="space-y-3 text-xs min-w-[130px]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></div>
                  <span className="text-slate-200 font-medium">Positive</span>
                </div>
                <p className="text-xs text-slate-400 ml-4 font-normal mt-0.5">
                  {posCount.toLocaleString()} ({posPct}%)
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b]"></div>
                  <span className="text-slate-200 font-medium">Neutral</span>
                </div>
                <p className="text-xs text-slate-400 ml-4 font-normal mt-0.5">
                  {neuCount.toLocaleString()} ({neuPct}%)
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#f43f5e]"></div>
                  <span className="text-slate-200 font-medium">Negative</span>
                </div>
                <p className="text-xs text-slate-400 ml-4 font-normal mt-0.5">
                  {negCount.toLocaleString()} ({negPct}%)
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* 4. Lower-Middle: Top Pain Points + Top Feature Requests */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Top Pain Points */}
        <div className="rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Top Pain Points</h3>
              <p className="text-[11px] text-slate-400">Extracted by Agent 2 clustering</p>
            </div>
            <Link to={`/workspace/${workspaceId}/intelligence/issues`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
              View All ({displayPainPoints.length})
            </Link>
          </div>

          <div className="space-y-2">
            {displayPainPoints.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No customer pain points detected yet. Upload and analyze feedback to extract issue clusters.
              </div>
            ) : (
              displayPainPoints.slice(0, 5).map((item, idx) => {
                const severity = item.priority_level 
                  ? (item.priority_level.charAt(0).toUpperCase() + item.priority_level.slice(1)) 
                  : (item.priority_score >= 60 ? 'High' : 'Medium');
                const isHigh = severity.toLowerCase() === 'high' || severity.toLowerCase() === 'critical';

                return (
                  <Link
                    key={item.cluster_id || item.id || `iss_${idx}`}
                    to={`/workspace/${workspaceId}/intelligence/issues`}
                    className="p-2.5 rounded-xl bg-[#121727] border border-[#1c253b] flex items-center justify-between gap-3 hover:bg-[#151c2f] transition-colors block"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                        isHigh ? 'bg-rose-500/15 text-rose-400' : 'bg-amber-500/15 text-amber-400'
                      }`}>
                        <Clock size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.name || item.title || 'Friction Point'}</p>
                        <span className="text-[11px] text-slate-400">{item.frequency || item.evidence_record_ids?.length || 1} mentions</span>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 text-[10px] font-semibold rounded-md border shrink-0 ${
                      isHigh 
                        ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' 
                        : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>
                      {severity}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

        {/* Top Feature Requests */}
        <div className="rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Top Feature Requests</h3>
              <p className="text-[11px] text-slate-400">Opportunity clusters from MongoDB</p>
            </div>
            <Link to={`/workspace/${workspaceId}/intelligence/features`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
              View All ({displayFeatureRequests.length})
            </Link>
          </div>

          <div className="space-y-2">
            {displayFeatureRequests.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No feature requests identified yet. Run AI analysis to synthesize customer demands.
              </div>
            ) : (
              displayFeatureRequests.slice(0, 5).map((item, idx) => {
                const priority = item.priority_level ? item.priority_level.toUpperCase() : (idx === 0 ? 'P1' : 'P2');

                return (
                  <Link
                    key={item.cluster_id || item.id || `feat_${idx}`}
                    to={`/workspace/${workspaceId}/intelligence/features`}
                    className="p-2.5 rounded-xl bg-[#121727] border border-[#1c253b] flex items-center justify-between gap-3 hover:bg-[#151c2f] transition-colors block"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/15 text-blue-400 flex items-center justify-center shrink-0">
                        <Truck size={16} />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{item.name || item.title || 'Feature Opportunity'}</p>
                        <span className="text-[11px] text-slate-400">{item.frequency || item.request_count || item.evidence_record_ids?.length || 1} requests</span>
                      </div>
                    </div>

                    <span className="px-2.5 py-0.5 text-[10px] font-semibold rounded-md border text-blue-400 bg-blue-500/10 border-blue-500/20 shrink-0">
                      {priority}
                    </span>
                  </Link>
                );
              })
            )}
          </div>
        </div>

      </div>

      {/* 5. Bottom Row: Recently Generated Documents + Milestones & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Recently Generated Documents (~62% width) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-bold text-white">Recently Generated Documents</h3>
              <p className="text-[11px] text-slate-400">Synthesized PRDs, Reports & Decision Briefs</p>
            </div>
            <Link to={`/workspace/${workspaceId}/reports`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
              View All Reports
            </Link>
          </div>

          <div className="overflow-x-auto">
            {liveData.latestReport ? (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1b2338] text-[11px] text-slate-400 font-semibold">
                    <th className="pb-2.5 font-semibold">Document</th>
                    <th className="pb-2.5 font-semibold">Type</th>
                    <th className="pb-2.5 font-semibold">Feature / Scope</th>
                    <th className="pb-2.5 font-semibold">Generated On</th>
                    <th className="pb-2.5 font-semibold">By</th>
                    <th className="pb-2.5 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171e30]">
                  <tr className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2.5 pr-3 text-slate-200 font-medium">
                      <div className="flex items-center gap-2">
                        <FileText size={15} className="text-emerald-400 shrink-0" />
                        <span className="truncate max-w-[200px]">{liveData.latestReport.title || 'Product Intelligence Executive Report'}</span>
                      </div>
                    </td>
                    <td className="py-2.5 pr-3 text-slate-300">Executive Brief</td>
                    <td className="py-2.5 pr-3 text-slate-400 truncate max-w-[140px]">{displayFeatureRequests[0]?.name || 'Workspace Feedback'}</td>
                    <td className="py-2.5 pr-3 text-slate-400 font-mono text-[11px]">{formatISTRelative(liveData.latestReport.created_at || new Date().toISOString())}</td>
                    <td className="py-2.5 pr-3 text-[#a78bfa] font-medium">AI Synthesizer</td>
                    <td className="py-2.5 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link 
                          to={`/workspace/${workspaceId}/reports`}
                          className="p-1 text-[#8b5cf6] hover:text-[#a78bfa] transition-colors cursor-pointer inline-block" 
                          title="Preview Report"
                        >
                          <Eye size={15} />
                        </Link>
                        <Link 
                          to={`/workspace/${workspaceId}/reports`}
                          className="p-1 text-emerald-400 hover:text-emerald-300 transition-colors cursor-pointer inline-block" 
                          title="Download Report"
                        >
                          <Download size={15} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                  {displayFeatureRequests.length > 0 && (
                    <tr className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2.5 pr-3 text-slate-200 font-medium">
                        <div className="flex items-center gap-2">
                          <FileText size={15} className="text-amber-400 shrink-0" />
                          <span className="truncate max-w-[200px]">PRD: {displayFeatureRequests[0].name}</span>
                        </div>
                      </td>
                      <td className="py-2.5 pr-3 text-slate-300">PRD</td>
                      <td className="py-2.5 pr-3 text-slate-400 truncate max-w-[140px]">{displayFeatureRequests[0].name}</td>
                      <td className="py-2.5 pr-3 text-slate-400 font-mono text-[11px]">Recent</td>
                      <td className="py-2.5 pr-3 text-[#a78bfa] font-medium">{displayName}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2.5">
                          <Link 
                            to={`/workspace/${workspaceId}/reports`}
                            className="p-1 text-[#8b5cf6] hover:text-[#a78bfa] transition-colors cursor-pointer inline-block" 
                            title="Preview Report"
                          >
                            <Eye size={15} />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            ) : (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <FileText size={28} className="text-slate-600 mb-2" />
                <p className="text-xs text-slate-400">No synthesized reports generated yet for this workspace.</p>
                <Link
                  to={`/workspace/${workspaceId}/reports`}
                  className="mt-3 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white transition-colors flex items-center gap-1.5"
                >
                  <Sparkles size={13} />
                  <span>Generate Intelligence Report</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Right Stack: Upcoming Milestones + Workspace Activity (~38% width) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Upcoming Milestones */}
          <div className="rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Upcoming Milestones</h3>
                <p className="text-[11px] text-slate-400">Roadmap targets</p>
              </div>
              <Link to={`/workspace/${workspaceId}/development/phases`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
                View Roadmap
              </Link>
            </div>

            <div className="space-y-2">
              {dynamicMilestones.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  No active milestones. Upload data to generate automated roadmaps.
                </div>
              ) : (
                dynamicMilestones.map((m, idx) => {
                  const iconColorMap = {
                    orange: 'text-amber-400',
                    purple: 'text-purple-400',
                    blue: 'text-blue-400',
                  };
                  const iconColor = iconColorMap[m.iconColor] || 'text-purple-400';

                  const statusStyles = {
                    progress: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
                    upcoming: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
                    planned: 'text-slate-400 bg-slate-500/10 border-slate-500/20',
                  };
                  const statusStyle = statusStyles[m.statusType] || 'text-slate-400 bg-slate-500/10 border-slate-500/20';

                  return (
                    <div 
                      key={idx} 
                      className="p-2.5 rounded-xl bg-[#121727] border border-[#1c253b] flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Calendar size={15} className={`${iconColor} shrink-0`} />
                        <p className="text-xs font-semibold text-white truncate">{m.title}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-slate-400 font-mono">{m.date}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${statusStyle}`}>
                          {m.status}
                        </span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Workspace Activity (100% from MongoDB) */}
          <div className="rounded-2xl bg-[#0e1322] border border-[#1b2338] p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Activity</h3>
                <p className="text-[11px] text-slate-400">Live audit trail from MongoDB</p>
              </div>
              <Link to={`/workspace/${workspaceId}/settings`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
                Manage
              </Link>
            </div>

            <div className="space-y-3">
              {liveActivities.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  No activity recorded yet in this workspace.
                </div>
              ) : (
                liveActivities.map((item) => (
                  <div key={item.id || item._id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-6 h-6 rounded-full bg-[#5b3df5]/25 text-[#a78bfa] flex items-center justify-center shrink-0">
                        <Sparkles size={12} />
                      </div>
                      <p className="text-slate-300 truncate">
                        <span className="font-bold text-white">{item.user_name || 'System'}</span> {item.title || item.action}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {item.created_at ? formatISTRelative(item.created_at) : 'Recent'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

      {/* ── 6. FLOATING BOTTOM-RIGHT AI ASSISTANT POPUP ─────────────────────── */}
      
      {/* Floating Trigger Button */}
      {!isAiPopupOpen && (
        <button
          type="button"
          onClick={() => setIsAiPopupOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-[#5b3df5] to-[#7c3aed] hover:from-[#4f2ee8] hover:to-[#6d28d9] text-white shadow-2xl shadow-[#5b3df5]/50 border border-white/20 transition-all transform hover:scale-105 cursor-pointer group"
          title="Open AI Product Intelligence Assistant"
        >
          <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
            <Sparkles size={16} className="text-white animate-spin-slow" />
          </div>
          <span className="text-xs font-bold tracking-wide">Ask AI Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping ml-0.5"></span>
        </button>
      )}

      {/* Floating Popup Window */}
      {isAiPopupOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-[380px] sm:w-[420px] max-h-[580px] h-[580px] rounded-2xl bg-[#0e1322] border border-[#232d44] shadow-2xl flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          
          {/* Header */}
          <div className="px-4 py-3 bg-[#121828] border-b border-[#1b2338] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#5b3df5] to-[#7c3aed] flex items-center justify-center">
                <Sparkles size={15} className="text-white" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                  AI Product Assistant
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                    MongoDB Live
                  </span>
                </h4>
                <p className="text-[10px] text-slate-400">Contextual answers from active feedback signals</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setChatMessages([{
                  sender: 'ai',
                  text: `Hi ${displayName.split(' ')[0]}! 👋\nHow can I help you with your live product insights?`
                }])}
                className="text-[10px] text-[#8b5cf6] hover:text-[#a78bfa] font-semibold px-2 py-1 rounded hover:bg-white/[0.04] cursor-pointer"
                title="Reset Chat"
              >
                Reset
              </button>
              <button
                type="button"
                onClick={() => setIsAiPopupOpen(false)}
                className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/[0.05] transition-colors cursor-pointer"
                title="Minimize / Close"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs bg-[#0b0f19]/80">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                {msg.sender === 'ai' && (
                  <div className="w-6 h-6 rounded-lg bg-[#5b3df5]/20 text-[#a78bfa] flex items-center justify-center shrink-0 mt-0.5 border border-[#5b3df5]/30">
                    <Sparkles size={12} />
                  </div>
                )}
                <div className={`p-3 rounded-2xl leading-relaxed whitespace-pre-line ${
                  msg.sender === 'user'
                    ? 'bg-[#5b3df5] text-white max-w-[85%] rounded-tr-sm shadow-md'
                    : 'bg-[#141b2c] border border-[#1e273f] text-slate-200 max-w-[88%] rounded-tl-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {isAiResponding && (
              <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono animate-pulse pl-8">
                <RefreshCw size={11} className="animate-spin text-[#8b5cf6]" />
                Synthesizing response from MongoDB data...
              </div>
            )}
            <div ref={chatBottomRef} />
          </div>

          {/* Suggested Question Chips */}
          <div className="px-3 py-2 bg-[#0e1322] border-t border-[#182033] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {suggestedQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendQuestion(q)}
                className="shrink-0 text-[10px] text-slate-300 hover:text-white px-2.5 py-1 rounded-full bg-[#141b2c] hover:bg-[#1a233a] border border-[#202b45] transition-colors cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Input Footer */}
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSendQuestion(chatInput); }}
            className="p-3 bg-[#121828] border-t border-[#1b2338] relative flex items-center gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about pain points, features, risks..."
              className="flex-1 pl-3 pr-3 py-2 rounded-xl bg-[#0e1322] border border-[#1f283e] text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#5b3df5]"
            />
            <button
              type="submit"
              disabled={!chatInput.trim()}
              className="w-8 h-8 rounded-xl bg-[#5b3df5] hover:bg-[#4f2ee8] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shadow shrink-0 cursor-pointer"
            >
              <Send size={13} className="-rotate-12 translate-x-0.5" />
            </button>
          </form>

        </div>
      )}

    </div>
  );
}

