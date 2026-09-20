import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Sparkles,
  Search,
  Filter,
  RefreshCw,
  FileText,
  ChevronRight,
  TrendingUp,
  Shield,
  Layers,
  MessageSquare,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  RotateCcw,
  Check,
  X,
  UserCheck,
  Activity,
  Lightbulb,
  Target,
  ExternalLink,
} from 'lucide-react';
import {
  isProductManager,
  getCurrentUser,
  getActiveDatasetId,
  subscribeToActiveDataset,
} from '../../utils/workspaceAccess';
import { intelligenceApi, datasetApi } from '../../api/client';
import { formatISTDateTime, formatISTRelative } from '../../utils/dateUtils';

export default function PMReview() {
  const { workspaceId } = useParams();
  const isPm = isProductManager();
  const currentUser = getCurrentUser();

  // Active dataset filter state
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => getActiveDatasetId());
  const [datasets, setDatasets] = useState([]);
  const [insights, setInsights] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Filter Bar state
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [impactFilter, setImpactFilter] = useState('ALL');
  const [areaFilter, setAreaFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Slide-over drawer state
  const [selectedInsight, setSelectedInsight] = useState(null);
  const [drawerTab, setDrawerTab] = useState('evidence'); // 'evidence' | 'rationale' | 'trend'
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [evidenceData, setEvidenceData] = useState(null);

  // Review decision form state
  const [decisionStatus, setDecisionStatus] = useState('ACCEPTED');
  const [pmComment, setPmComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Subscribe to active dataset in TopNavbar
  useEffect(() => {
    return subscribeToActiveDataset((newDsId) => {
      setSelectedDatasetId(newDsId);
    });
  }, []);

  // Fetch datasets for display label
  useEffect(() => {
    let mounted = true;
    if (workspaceId && datasetApi?.list) {
      datasetApi.list(workspaceId)
        .then((res) => {
          if (mounted && Array.isArray(res)) setDatasets(res);
        })
        .catch((err) => console.warn('Dataset list error:', err));
    }
    return () => { mounted = false; };
  }, [workspaceId]);

  // Fetch insights
  const fetchInsights = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError(null);
    try {
      const opts = selectedDatasetId ? { dataset_id: selectedDatasetId } : null;
      const data = await intelligenceApi.getInsights(workspaceId, opts, 100);
      if (Array.isArray(data)) {
        setInsights(data);
      } else {
        setInsights([]);
      }
    } catch (err) {
      console.error('Failed to load insights for PM review:', err);
      setError(err.message || 'Failed to fetch insights');
      setInsights([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights(true);
  }, [workspaceId, selectedDatasetId]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchInsights(false);
  };

  // When an insight is selected, fetch ground truth customer evidence
  useEffect(() => {
    if (!selectedInsight) {
      setEvidenceData(null);
      return;
    }
    let mounted = true;
    setEvidenceLoading(true);
    setDecisionStatus(selectedInsight.review_status === 'PENDING_REVIEW' ? 'ACCEPTED' : selectedInsight.review_status);
    setPmComment(selectedInsight.pm_comment || '');

    intelligenceApi.getInsightEvidence(workspaceId, selectedInsight.insight_id)
      .then((res) => {
        if (mounted) {
          setEvidenceData(res);
        }
      })
      .catch((err) => {
        console.warn('Failed to fetch evidence records:', err);
        if (mounted) {
          // Fallback based on evidence_record_ids in the insight
          setEvidenceData({
            insight_id: selectedInsight.insight_id,
            evidence_records: (selectedInsight.evidence_record_ids || []).map((id) => ({
              feedback_id: id,
              text: `Customer signal trace for ID: ${id}`,
              sentiment: selectedInsight.dominant_sentiment || 'neutral',
              intent: 'complaint',
              severity: selectedInsight.severity || 'medium',
              aspects: [selectedInsight.product_area || 'General'],
            })),
          });
        }
      })
      .finally(() => {
        if (mounted) setEvidenceLoading(false);
      });

    return () => { mounted = false; };
  }, [selectedInsight, workspaceId]);

  // Submit PM Review
  const handleSubmitReview = async (insightToReview = selectedInsight, customStatus = decisionStatus, customComment = pmComment) => {
    if (!insightToReview) return;
    setSubmittingReview(true);
    try {
      const payload = {
        review_status: customStatus,
        pm_comment: customComment.trim() || undefined,
      };
      const updated = await intelligenceApi.submitInsightReview(workspaceId, insightToReview.insight_id, payload);

      // Update local insights list
      setInsights((prev) =>
        prev.map((ins) => (ins.insight_id === insightToReview.insight_id ? { ...ins, ...updated } : ins))
      );

      // Update selected insight if active
      if (selectedInsight && selectedInsight.insight_id === insightToReview.insight_id) {
        setSelectedInsight((prev) => ({ ...prev, ...updated }));
      }

      setToastMessage({
        type: 'success',
        text: `Insight ${insightToReview.insight_id} marked as ${customStatus.replace('_', ' ')}!`,
      });
      setTimeout(() => setToastMessage(null), 4000);
    } catch (err) {
      console.error('Error submitting PM review:', err);
      setToastMessage({
        type: 'error',
        text: `Failed to save review: ${err.message}`,
      });
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Quick accept/reject directly from card
  const handleQuickDecision = (e, ins, status) => {
    e.stopPropagation();
    handleSubmitReview(ins, status, status === 'ACCEPTED' ? 'Quick approved by PM' : 'Quick rejected by PM');
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const total = insights.length;
    let highImpact = 0;
    let emerging = 0;
    let pending = 0;
    let accepted = 0;
    let rejected = 0;

    insights.forEach((ins) => {
      const imp = (typeof ins.customer_impact === 'object' ? ins.customer_impact?.level : ins.customer_impact) || ins.severity || '';
      if (['high', 'critical'].includes(imp.toLowerCase())) {
        highImpact += 1;
      }
      if (ins.insight_type === 'EMERGING_ISSUE' || (ins.trend?.direction === 'increasing' && (ins.trend?.change_percentage || 0) > 10)) {
        emerging += 1;
      }
      const st = ins.review_status || 'PENDING_REVIEW';
      if (st === 'PENDING_REVIEW') pending += 1;
      else if (st === 'ACCEPTED') accepted += 1;
      else if (st === 'REJECTED') rejected += 1;
    });

    return { total, highImpact, emerging, pending, accepted, rejected };
  }, [insights]);

  // Product areas dynamic list
  const productAreas = useMemo(() => {
    const set = new Set();
    insights.forEach((ins) => {
      if (ins.product_area) set.add(ins.product_area);
    });
    return Array.from(set);
  }, [insights]);

  // Filtered Insights
  const filteredInsights = useMemo(() => {
    return insights.filter((ins) => {
      // Tab filter
      if (activeTab === 'ISSUES' && !['HIGH_PRIORITY_ISSUE', 'EMERGING_ISSUE', 'RECURRING_ISSUE'].includes(ins.insight_type)) return false;
      if (activeTab === 'FEATURES' && !['HIGH_DEMAND_FEATURE', 'PRODUCT_OPPORTUNITY'].includes(ins.insight_type)) return false;
      if (activeTab === 'TRENDS' && !['NEGATIVE_TREND', 'POSITIVE_TREND'].includes(ins.insight_type)) return false;
      if (activeTab === 'CX' && ins.insight_type !== 'CUSTOMER_EXPERIENCE_RISK') return false;

      // Status filter
      if (statusFilter !== 'ALL') {
        const currentStatus = ins.review_status || 'PENDING_REVIEW';
        if (currentStatus !== statusFilter) return false;
      }

      // Priority filter
      if (priorityFilter !== 'ALL') {
        const pLevel = ins.priority_level || ins.priority?.level || 'medium';
        if (pLevel.toLowerCase() !== priorityFilter.toLowerCase()) return false;
      }

      // Customer Impact filter
      if (impactFilter !== 'ALL') {
        const imp = (typeof ins.customer_impact === 'object' ? ins.customer_impact?.level : ins.customer_impact) || ins.severity || 'medium';
        if (imp.toLowerCase() !== impactFilter.toLowerCase()) return false;
      }

      // Product area filter
      if (areaFilter !== 'ALL' && ins.product_area !== areaFilter) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const title = (ins.title || '').toLowerCase();
        const summary = (ins.summary || '').toLowerCase();
        const id = (ins.insight_id || '').toLowerCase();
        const area = (ins.product_area || '').toLowerCase();
        if (!title.includes(q) && !summary.includes(q) && !id.includes(q) && !area.includes(q)) {
          return false;
        }
      }

      return true;
    });
  }, [insights, activeTab, statusFilter, priorityFilter, impactFilter, areaFilter, searchQuery]);

  // Active dataset name helper
  const activeDatasetName = useMemo(() => {
    if (!selectedDatasetId) return 'All Feedback Batches';
    const match = datasets.find((d) => (d.dataset_id || d._id || d.id) === selectedDatasetId);
    return match ? (match.dataset_name || match.filename || match.name || selectedDatasetId) : selectedDatasetId;
  }, [selectedDatasetId, datasets]);

  const renderStatusBadge = (status) => {
    const st = status || 'PENDING_REVIEW';
    switch (st) {
      case 'ACCEPTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 size={12} /> Accepted for PRD
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
            <XCircle size={12} /> Rejected
          </span>
        );
      case 'REANALYSIS_REQUESTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
            <RotateCcw size={12} /> Re-analysis
          </span>
        );
      case 'PENDING_REVIEW':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/30 animate-pulse">
            <Clock size={12} /> Pending Review
          </span>
        );
    }
  };

  const renderTypeBadge = (type) => {
    switch (type) {
      case 'HIGH_PRIORITY_ISSUE':
      case 'RECURRING_ISSUE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-300 border border-rose-500/30 uppercase tracking-wider">
            <AlertTriangle size={11} /> Issue
          </span>
        );
      case 'EMERGING_ISSUE':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase tracking-wider">
            <TrendingUp size={11} /> Emerging
          </span>
        );
      case 'HIGH_DEMAND_FEATURE':
      case 'PRODUCT_OPPORTUNITY':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-[#5b3df5]/20 text-[#a78bfa] border border-[#5b3df5]/40 uppercase tracking-wider">
            <Lightbulb size={11} /> Feature
          </span>
        );
      case 'NEGATIVE_TREND':
      case 'POSITIVE_TREND':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 uppercase tracking-wider">
            <TrendingUp size={11} /> Trend
          </span>
        );
      case 'CUSTOMER_EXPERIENCE_RISK':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/15 text-purple-300 border border-purple-500/30 uppercase tracking-wider">
            <Shield size={11} /> CX Risk
          </span>
        );
    }
  };

  const renderSentimentPill = (sentiment) => {
    const s = (sentiment || 'neutral').toLowerCase();
    if (s.includes('pos')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
          <ThumbsUp size={10} /> Positive
        </span>
      );
    }
    if (s.includes('neg')) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/15 text-rose-400 border border-rose-500/20">
          <ThumbsDown size={10} /> Negative
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-slate-500/15 text-slate-400 border border-slate-500/20">
        Neutral
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-[#070a12] text-slate-100 font-sans pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-2xl text-xs font-semibold animate-in slide-in-from-top-3 ${
          toastMessage.type === 'success'
            ? 'bg-emerald-950/90 text-emerald-200 border-emerald-500/40 shadow-emerald-900/30'
            : 'bg-rose-950/90 text-rose-200 border-rose-500/40 shadow-rose-900/30'
        }`}>
          {toastMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Top Header & Context Bar */}
      <div className="border-b border-[#141b2d] bg-[#090d19]/80 backdrop-blur sticky top-0 z-20 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-tr from-[#5b3df5] to-[#7c3aed] text-white shadow-lg shadow-[#5b3df5]/30">
                <UserCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-white tracking-tight">PM Review & Decision Gate</h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5b3df5]/20 text-[#a78bfa] border border-[#5b3df5]/40 uppercase tracking-wider">
                    Stage Gate
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Inspect customer evidence, evaluate impact, and validate insights before feeding Product Planning & PRD generation.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Scope Pill */}
            <div className="flex items-center gap-2 bg-[#0e1424] border border-[#1b243b] px-3 py-1.5 rounded-xl text-xs">
              <span className="text-slate-400">Batch:</span>
              <span className="font-semibold text-slate-200 max-w-[180px] truncate" title={activeDatasetName}>
                {activeDatasetName}
              </span>
            </div>

            {/* PM Role Badge */}
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isPm 
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                : 'bg-slate-800/60 text-slate-400 border-slate-700/40'
            }`}>
              <Shield size={13} />
              <span>{isPm ? 'Product Manager (Decision Maker)' : 'Viewer (Read Only)'}</span>
            </div>

            {/* Refresh Button */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-[#0e1424] hover:bg-[#161f38] text-slate-300 border border-[#1b243b] hover:text-white transition-all cursor-pointer disabled:opacity-50"
              title="Refresh Insights"
            >
              <RefreshCw size={15} className={refreshing ? 'animate-spin text-[#5b3df5]' : ''} />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-6 space-y-6">
        {/* Top 4 KPI Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-[#0b101d] border border-[#161f36] rounded-2xl p-4 relative overflow-hidden shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Total Insights</span>
              <div className="p-1.5 rounded-lg bg-[#5b3df5]/15 text-[#a78bfa]">
                <Layers size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-white">{stats.total}</span>
              <span className="text-[11px] text-slate-400">synthesized by AI</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
              <span className="text-emerald-400 font-semibold">{stats.accepted} accepted</span>
              <span>•</span>
              <span className="text-rose-400 font-semibold">{stats.rejected} rejected</span>
            </div>
          </div>

          <div className="bg-[#0b101d] border border-[#161f36] rounded-2xl p-4 relative overflow-hidden shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">High Customer Impact</span>
              <div className="p-1.5 rounded-lg bg-rose-500/15 text-rose-400">
                <AlertTriangle size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-rose-400">{stats.highImpact}</span>
              <span className="text-[11px] text-slate-400">require immediate review</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              High / Critical severity in core workflows
            </div>
          </div>

          <div className="bg-[#0b101d] border border-[#161f36] rounded-2xl p-4 relative overflow-hidden shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Emerging Issues</span>
              <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-amber-400">{stats.emerging}</span>
              <span className="text-[11px] text-slate-400">growing velocity</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              Spiking frequency compared to previous cycles
            </div>
          </div>

          <div className="bg-[#0b101d] border border-[#161f36] rounded-2xl p-4 relative overflow-hidden shadow-lg shadow-black/20">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-semibold uppercase tracking-wider">Pending PM Review</span>
              <div className="p-1.5 rounded-lg bg-blue-500/15 text-blue-400">
                <Clock size={16} />
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-blue-400">{stats.pending}</span>
              <span className="text-[11px] text-slate-400">awaiting sign-off</span>
            </div>
            <div className="mt-2 text-[10px] text-slate-400">
              Decision required before PRD generation
            </div>
          </div>
        </div>

        {/* Filter Navigation Bar */}
        <div className="bg-[#0b101d] border border-[#161f36] rounded-2xl p-4 space-y-3">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-[#161f36] pb-3">
            {[
              { id: 'ALL', label: 'All Insights', count: insights.length },
              { id: 'ISSUES', label: 'Issues & Friction', count: insights.filter((i) => ['HIGH_PRIORITY_ISSUE', 'EMERGING_ISSUE', 'RECURRING_ISSUE'].includes(i.insight_type)).length },
              { id: 'FEATURES', label: 'Feature Demands', count: insights.filter((i) => ['HIGH_DEMAND_FEATURE', 'PRODUCT_OPPORTUNITY'].includes(i.insight_type)).length },
              { id: 'TRENDS', label: 'Trends & Velocity', count: insights.filter((i) => ['NEGATIVE_TREND', 'POSITIVE_TREND'].includes(i.insight_type)).length },
              { id: 'CX', label: 'Customer Experience', count: insights.filter((i) => i.insight_type === 'CUSTOMER_EXPERIENCE_RISK').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#5b3df5] text-white shadow-md shadow-[#5b3df5]/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#121829]'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Secondary Filter Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px] max-w-md">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, summary, ID, or area..."
                className="w-full bg-[#0e1424] border border-[#1c2642] rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] transition-colors"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Dropdown Selectors */}
            <div className="flex flex-wrap items-center gap-2.5 text-xs">
              {/* Review Status */}
              <div className="flex items-center gap-1.5 bg-[#0e1424] border border-[#1c2642] px-2.5 py-1.5 rounded-xl">
                <span className="text-slate-500 text-[11px]">Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0e1424]">All Statuses</option>
                  <option value="PENDING_REVIEW" className="bg-[#0e1424]">Pending Review</option>
                  <option value="ACCEPTED" className="bg-[#0e1424]">Accepted for PRD</option>
                  <option value="REJECTED" className="bg-[#0e1424]">Rejected</option>
                  <option value="REANALYSIS_REQUESTED" className="bg-[#0e1424]">Re-analysis</option>
                </select>
              </div>

              {/* Priority */}
              <div className="flex items-center gap-1.5 bg-[#0e1424] border border-[#1c2642] px-2.5 py-1.5 rounded-xl">
                <span className="text-slate-500 text-[11px]">Priority:</span>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0e1424]">All Priorities</option>
                  <option value="critical" className="bg-[#0e1424]">Critical</option>
                  <option value="high" className="bg-[#0e1424]">High</option>
                  <option value="medium" className="bg-[#0e1424]">Medium</option>
                  <option value="low" className="bg-[#0e1424]">Low</option>
                </select>
              </div>

              {/* Impact */}
              <div className="flex items-center gap-1.5 bg-[#0e1424] border border-[#1c2642] px-2.5 py-1.5 rounded-xl">
                <span className="text-slate-500 text-[11px]">Impact:</span>
                <select
                  value={impactFilter}
                  onChange={(e) => setImpactFilter(e.target.value)}
                  className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
                >
                  <option value="ALL" className="bg-[#0e1424]">All Impacts</option>
                  <option value="critical" className="bg-[#0e1424]">Critical</option>
                  <option value="high" className="bg-[#0e1424]">High</option>
                  <option value="medium" className="bg-[#0e1424]">Medium</option>
                  <option value="low" className="bg-[#0e1424]">Low</option>
                </select>
              </div>

              {/* Product Area */}
              {productAreas.length > 0 && (
                <div className="flex items-center gap-1.5 bg-[#0e1424] border border-[#1c2642] px-2.5 py-1.5 rounded-xl">
                  <span className="text-slate-500 text-[11px]">Area:</span>
                  <select
                    value={areaFilter}
                    onChange={(e) => setAreaFilter(e.target.value)}
                    className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[140px] truncate"
                  >
                    <option value="ALL" className="bg-[#0e1424]">All Areas</option>
                    {productAreas.map((area) => (
                      <option key={area} value={area} className="bg-[#0e1424]">
                        {area.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Insights List / Feed */}
        {loading ? (
          <div className="bg-[#0b101d] border border-[#161f36] rounded-2xl p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5b3df5] mb-3"></div>
            <p className="text-sm text-slate-300 font-semibold">Loading product intelligence insights...</p>
            <p className="text-xs text-slate-500 mt-1">Retrieving AI clusters and decision records from MongoDB</p>
          </div>
        ) : error ? (
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-2xl p-8 text-center text-rose-300">
            <AlertTriangle size={32} className="mx-auto mb-2 text-rose-400" />
            <p className="text-sm font-semibold">{error}</p>
            <button
              type="button"
              onClick={() => fetchInsights(true)}
              className="mt-3 px-4 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 rounded-xl text-xs font-semibold text-rose-200"
            >
              Retry Loading
            </button>
          </div>
        ) : filteredInsights.length === 0 ? (
          <div className="bg-[#0b101d] border border-[#161f36] rounded-2xl p-12 text-center text-slate-400">
            <Layers size={36} className="mx-auto mb-3 text-slate-600" />
            <h3 className="text-sm font-semibold text-slate-200">No Insights Match Current Filters</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
              Try broadening your filter criteria or switch to another feedback batch in the top navbar.
            </p>
            {(activeTab !== 'ALL' || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || searchQuery) && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('ALL');
                  setStatusFilter('ALL');
                  setPriorityFilter('ALL');
                  setImpactFilter('ALL');
                  setAreaFilter('ALL');
                  setSearchQuery('');
                }}
                className="mt-4 px-3.5 py-1.5 bg-[#141b2e] hover:bg-[#1e2946] text-slate-200 rounded-xl text-xs font-semibold border border-[#233154] transition-all"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredInsights.map((ins) => {
              const priorityScore = ins.priority_score ?? ins.priority?.score ?? 50;
              const priorityLevel = (ins.priority_level || ins.priority?.level || 'medium').toLowerCase();
              const impactLevel = (typeof ins.customer_impact === 'object' ? ins.customer_impact?.level : ins.customer_impact) || ins.severity || 'medium';
              const evidenceCount = ins.evidence_record_ids?.length || ins.evidence?.record_count || 0;
              const isSelected = selectedInsight?.insight_id === ins.insight_id;
              const currentReviewStatus = ins.review_status || 'PENDING_REVIEW';

              return (
                <div
                  key={ins.insight_id}
                  onClick={() => setSelectedInsight(ins)}
                  className={`bg-[#0b101d] border rounded-2xl p-5 transition-all cursor-pointer relative group hover:shadow-xl hover:shadow-[#5b3df5]/5 ${
                    isSelected
                      ? 'border-[#5b3df5] ring-1 ring-[#5b3df5]/50 bg-[#0d1424]'
                      : 'border-[#161f36] hover:border-[#2a375e]'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-mono font-bold text-[#a78bfa] bg-[#5b3df5]/15 px-2 py-0.5 rounded border border-[#5b3df5]/30">
                        {ins.insight_id}
                      </span>
                      {renderTypeBadge(ins.insight_type)}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        priorityLevel === 'critical' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' :
                        priorityLevel === 'high' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                        'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}>
                        Priority: {Math.round(priorityScore)}/100
                      </span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        Area: <strong className="text-slate-300">{(ins.product_area || 'general').replace(/_/g, ' ')}</strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {renderStatusBadge(currentReviewStatus)}
                    </div>
                  </div>

                  {/* Title & Summary */}
                  <h3 className="text-base font-bold text-white group-hover:text-[#a78bfa] transition-colors mb-1.5 leading-snug">
                    {ins.title}
                  </h3>
                  <p className="text-xs text-slate-300 leading-relaxed line-clamp-2 mb-4">
                    {ins.summary}
                  </p>

                  {/* Signals & Impact Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 py-2.5 px-3 bg-[#0e1424] border border-[#172038] rounded-xl text-xs mb-3">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block uppercase">Customers Affected</span>
                      <span className="text-slate-200 font-bold">
                        {ins.frequency || 0} signals ({ins.percentage_of_feedback || 0}%)
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block uppercase">Customer Impact</span>
                      <span className={`font-bold capitalize ${
                        impactLevel === 'critical' ? 'text-rose-400' :
                        impactLevel === 'high' ? 'text-amber-400' :
                        'text-slate-200'
                      }`}>
                        {impactLevel}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block uppercase">Trend Velocity</span>
                      <span className="text-slate-200 font-bold flex items-center gap-1">
                        {ins.trend?.change_percentage ? (
                          <span className={ins.trend.change_percentage > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                            {ins.trend.change_percentage > 0 ? `+${ins.trend.change_percentage}%` : `${ins.trend.change_percentage}%`}
                          </span>
                        ) : (
                          <span>Stable (0%)</span>
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] font-semibold text-slate-500 block uppercase">Customer Evidence</span>
                      <span className="text-[#a78bfa] font-bold flex items-center gap-1">
                        <MessageSquare size={11} /> {evidenceCount} verified signals
                      </span>
                    </div>
                  </div>

                  {/* AI Recommendation Snippet */}
                  {ins.recommended_action && (
                    <div className="flex items-start gap-2 text-xs bg-[#5b3df5]/10 border border-[#5b3df5]/20 rounded-xl p-2.5 mb-3 text-slate-300">
                      <Sparkles size={14} className="text-[#a78bfa] shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <strong className="text-white font-semibold">Recommended Product Action: </strong>
                        <span>{ins.recommended_action}</span>
                      </div>
                    </div>
                  )}

                  {/* Review Banner if already reviewed */}
                  {currentReviewStatus !== 'PENDING_REVIEW' && (
                    <div className="flex items-center justify-between text-[11px] bg-[#121828] border border-[#1e2740] rounded-xl px-3 py-1.5 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-slate-400">Decision:</span>
                        <span className="font-semibold text-white capitalize">{currentReviewStatus.replace('_', ' ').toLowerCase()}</span>
                        {ins.reviewed_by && (
                          <span className="text-slate-500">by {ins.reviewed_by}</span>
                        )}
                        {ins.reviewed_at && (
                          <span className="text-slate-500">({formatISTRelative(ins.reviewed_at)})</span>
                        )}
                      </div>
                      {ins.pm_comment && (
                        <span className="text-slate-300 italic truncate max-w-xs" title={ins.pm_comment}>
                          "{ins.pm_comment}"
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Footer */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#141b2e]">
                    <div className="text-[11px] text-slate-500">
                      Component: <span className="text-slate-400 font-medium">
                        {typeof ins.affected_feature === 'object' ? ins.affected_feature?.name || 'General' : ins.affected_feature || 'General'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isPm && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => handleQuickDecision(e, ins, 'ACCEPTED')}
                            disabled={submittingReview}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 transition-all flex items-center gap-1"
                            title="Accept insight for PRD generation"
                          >
                            <Check size={12} /> Accept
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleQuickDecision(e, ins, 'REJECTED')}
                            disabled={submittingReview}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition-all flex items-center gap-1"
                            title="Reject insight"
                          >
                            <X size={12} /> Reject
                          </button>
                        </>
                      )}

                      <button
                        type="button"
                        onClick={() => setSelectedInsight(ins)}
                        className="px-3 py-1 rounded-lg text-xs font-semibold bg-[#5b3df5] hover:bg-[#6c4ef7] text-white transition-all flex items-center gap-1 shadow-sm shadow-[#5b3df5]/40"
                      >
                        <span>Deep-Dive & Decision</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Slide-Over Evidence & Review Decision Drawer */}
      {selectedInsight && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
          {/* Backdrop */}
          <div
            onClick={() => setSelectedInsight(null)}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
          />

          {/* Drawer Content */}
          <div className="relative w-full max-w-2xl bg-[#0a0e1c] border-l border-[#19233d] shadow-2xl h-full flex flex-col z-10 animate-in slide-in-from-right-4 duration-200">
            {/* Drawer Header */}
            <div className="p-5 border-b border-[#161f38] bg-[#0c1224] flex items-start justify-between gap-4 shrink-0">
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-mono font-bold text-[#a78bfa] bg-[#5b3df5]/20 px-2 py-0.5 rounded border border-[#5b3df5]/40">
                    {selectedInsight.insight_id}
                  </span>
                  {renderTypeBadge(selectedInsight.insight_type)}
                  {renderStatusBadge(selectedInsight.review_status)}
                </div>
                <h2 className="text-base font-bold text-white leading-snug">
                  {selectedInsight.title}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span>Priority Score: <strong className="text-white">{Math.round(selectedInsight.priority_score ?? selectedInsight.priority?.score ?? 50)}/100</strong></span>
                  <span>•</span>
                  <span>Confidence: <strong className="text-emerald-400">{selectedInsight.confidence?.score ?? 85}%</strong></span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInsight(null)}
                className="p-1.5 rounded-xl bg-[#141c30] hover:bg-[#1d2946] text-slate-400 hover:text-white transition-all cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Navigation Tabs */}
            <div className="flex items-center gap-2 px-5 py-2.5 border-b border-[#161f38] bg-[#090d1a] shrink-0 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setDrawerTab('evidence')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  drawerTab === 'evidence'
                    ? 'bg-[#5b3df5] text-white shadow-md shadow-[#5b3df5]/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#121829]'
                }`}
              >
                <MessageSquare size={13} />
                <span>Customer Evidence ({evidenceData?.total_evidence_records || selectedInsight.evidence_record_ids?.length || 0})</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerTab('rationale')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  drawerTab === 'rationale'
                    ? 'bg-[#5b3df5] text-white shadow-md shadow-[#5b3df5]/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#121829]'
                }`}
              >
                <Lightbulb size={13} />
                <span>AI Rationale & Impact</span>
              </button>

              <button
                type="button"
                onClick={() => setDrawerTab('trend')}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer ${
                  drawerTab === 'trend'
                    ? 'bg-[#5b3df5] text-white shadow-md shadow-[#5b3df5]/30'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-[#121829]'
                }`}
              >
                <TrendingUp size={13} />
                <span>Pattern Lineage</span>
              </button>
            </div>

            {/* Drawer Body Scroll Area */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {/* TAB 1: Ground Truth Customer Evidence */}
              {drawerTab === 'evidence' && (
                <div className="space-y-4">
                  <div className="bg-[#0e1426] border border-[#1b2542] rounded-xl p-3.5">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-semibold text-slate-200">Ground-Truth Evidence Traceability</span>
                      <span className="text-[#a78bfa] font-mono text-[11px]">
                        {evidenceData?.total_evidence_records || selectedInsight.evidence_record_ids?.length || 0} Linked Signals
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      Each insight generated by the AI is strictly anchored in customer records. Review the actual feedback text and detected sentiment below.
                    </p>
                  </div>

                  {evidenceLoading ? (
                    <div className="py-12 text-center">
                      <div className="inline-block animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#5b3df5] mb-2"></div>
                      <p className="text-xs text-slate-400">Loading ground-truth customer feedback records...</p>
                    </div>
                  ) : evidenceData?.evidence_records?.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 bg-[#0e1426] border border-[#1b2542] rounded-xl">
                      <MessageSquare size={24} className="mx-auto mb-2 text-slate-600" />
                      <p className="text-xs">No customer feedback records retrieved for this insight.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {(evidenceData?.evidence_records || []).map((ev, idx) => (
                        <div
                          key={ev.feedback_id || idx}
                          className="bg-[#0e1426] border border-[#1a233b] hover:border-[#273559] rounded-xl p-3.5 transition-all space-y-2"
                        >
                          <div className="flex items-center justify-between gap-2 text-xs">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                                {ev.feedback_id}
                              </span>
                              {renderSentimentPill(ev.sentiment)}
                              {ev.intent && (
                                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 capitalize">
                                  {ev.intent.replace(/_/g, ' ')}
                                </span>
                              )}
                            </div>
                            {ev.created_at && (
                              <span className="text-[10px] text-slate-500">
                                {formatISTRelative(ev.created_at)}
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-slate-200 leading-relaxed pl-2.5 border-l-2 border-[#5b3df5]/60 bg-black/20 p-2 rounded-r-lg font-normal">
                            "{ev.text}"
                          </div>

                          {ev.aspects && ev.aspects.length > 0 && (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              <span className="text-[10px] text-slate-500">Tags:</span>
                              {ev.aspects.map((asp, aIdx) => (
                                <span key={aIdx} className="text-[10px] bg-[#12192d] text-slate-300 px-1.5 py-0.2 rounded border border-[#1b2542]">
                                  {asp}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: AI Rationale & Impact Breakdown */}
              {drawerTab === 'rationale' && (
                <div className="space-y-4 text-xs">
                  {/* Executive Summary */}
                  <div className="bg-[#0e1426] border border-[#1b2542] rounded-xl p-4 space-y-2">
                    <span className="font-semibold text-slate-200 block text-xs uppercase tracking-wider">Executive Problem Synthesis</span>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      {selectedInsight.summary}
                    </p>
                  </div>

                  {/* Customer & Business Impact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="bg-[#0e1426] border border-[#1b2542] rounded-xl p-3.5 space-y-1.5">
                      <span className="font-semibold text-slate-200 block uppercase text-[11px]">Customer Impact</span>
                      <p className="text-slate-300 leading-relaxed text-xs">
                        {typeof selectedInsight.customer_impact === 'object'
                          ? selectedInsight.customer_impact?.description || 'Friction experienced by users'
                          : selectedInsight.customer_impact || 'Friction experienced by users'}
                      </p>
                      <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 uppercase">
                        Severity: {selectedInsight.severity || 'Medium'}
                      </span>
                    </div>

                    <div className="bg-[#0e1426] border border-[#1b2542] rounded-xl p-3.5 space-y-1.5">
                      <span className="font-semibold text-slate-200 block uppercase text-[11px]">Business Impact</span>
                      <p className="text-slate-300 leading-relaxed text-xs">
                        {selectedInsight.business_impact?.description || 'Product experience friction affecting retention and task completion.'}
                      </p>
                      {selectedInsight.business_impact?.impact_areas && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {selectedInsight.business_impact.impact_areas.map((area, i) => (
                            <span key={i} className="text-[10px] bg-slate-800 text-slate-300 px-1.5 py-0.2 rounded">
                              {area.replace(/_/g, ' ')}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Root Cause Hypothesis */}
                  <div className="bg-[#0e1426] border border-[#1b2542] rounded-xl p-4 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-200 block uppercase text-[11px]">Root-Cause Hypothesis</span>
                      <span className="text-[10px] font-mono text-emerald-400">
                        {Math.round((selectedInsight.root_cause?.confidence || 0.70) * 100)}% confidence
                      </span>
                    </div>
                    <p className="text-slate-300 leading-relaxed text-xs">
                      {selectedInsight.root_cause?.description || 'Workflow friction discovered during customer signal clustering.'}
                    </p>
                  </div>

                  {/* AI Strategic Recommendation */}
                  <div className="bg-[#5b3df5]/10 border border-[#5b3df5]/30 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-white font-semibold text-xs">
                      <Sparkles size={14} className="text-[#a78bfa]" />
                      <span>Strategic Product Recommendation</span>
                    </div>
                    <p className="text-slate-200 leading-relaxed text-xs">
                      {selectedInsight.product_recommendation?.action || selectedInsight.recommended_action || 'Review and optimize user workflow.'}
                    </p>
                    {selectedInsight.product_recommendation?.rationale && (
                      <p className="text-slate-400 text-[11px] italic">
                        Rationale: {selectedInsight.product_recommendation.rationale}
                      </p>
                    )}
                  </div>

                  {/* Recommended Next Steps */}
                  {selectedInsight.recommended_next_steps && selectedInsight.recommended_next_steps.length > 0 && (
                    <div className="bg-[#0e1426] border border-[#1b2542] rounded-xl p-4 space-y-2">
                      <span className="font-semibold text-slate-200 block uppercase text-[11px]">Actionable Next Steps</span>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-300 text-xs">
                        {selectedInsight.recommended_next_steps.map((step, idx) => (
                          <li key={idx} className="leading-relaxed">{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Pattern Lineage */}
              {drawerTab === 'trend' && (
                <div className="space-y-4 text-xs">
                  <div className="bg-[#0e1426] border border-[#1b2542] rounded-xl p-4 space-y-3">
                    <span className="font-semibold text-slate-200 block uppercase text-[11px]">Trend Direction & Velocity</span>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-[#0a0e1c] p-3 rounded-lg border border-[#161f36]">
                        <span className="text-[10px] text-slate-500 uppercase block">Direction</span>
                        <span className="text-white font-bold capitalize">
                          {selectedInsight.trend?.direction || 'Stable'}
                        </span>
                      </div>
                      <div className="bg-[#0a0e1c] p-3 rounded-lg border border-[#161f36]">
                        <span className="text-[10px] text-slate-500 uppercase block">Period Change</span>
                        <span className={`font-bold ${
                          (selectedInsight.trend?.change_percentage || 0) > 0 ? 'text-rose-400' : 'text-emerald-400'
                        }`}>
                          {selectedInsight.trend?.change_percentage ? `${selectedInsight.trend.change_percentage}%` : '0%'}
                        </span>
                      </div>
                    </div>
                    {selectedInsight.trend?.reason && (
                      <p className="text-[11px] text-slate-400">
                        {selectedInsight.trend.reason}
                      </p>
                    )}
                  </div>

                  <div className="bg-[#0e1426] border border-[#1b2542] rounded-xl p-4 space-y-2">
                    <span className="font-semibold text-slate-200 block uppercase text-[11px]">Cluster Lineage</span>
                    <div className="text-slate-300 space-y-1 text-xs">
                      <div>Product Area: <strong className="text-white">{(selectedInsight.product_area || 'General').replace(/_/g, ' ')}</strong></div>
                      <div>Affected Component: <strong className="text-white">{typeof selectedInsight.affected_feature === 'object' ? selectedInsight.affected_feature?.name || 'General' : selectedInsight.affected_feature || 'General'}</strong></div>
                      <div>Observed Volume: <strong className="text-white">{selectedInsight.frequency || 0} customer records</strong></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Sticky PM Decision Action Panel */}
            <div className="p-5 border-t border-[#161f38] bg-[#0c1224] shrink-0 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                  <Shield size={14} className="text-[#5b3df5]" />
                  <span>PM Decision Gate</span>
                </span>
                <span className="text-[11px] text-slate-400">
                  {isPm ? 'Full Review Authority' : 'View Only (Read-Only)'}
                </span>
              </div>

              {isPm ? (
                <>
                  {/* Decision Selector Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setDecisionStatus('ACCEPTED')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                        decisionStatus === 'ACCEPTED'
                          ? 'bg-emerald-500 text-white border-emerald-400 shadow-lg shadow-emerald-500/20'
                          : 'bg-[#12192d] text-emerald-300 border-emerald-500/30 hover:bg-emerald-500/10'
                      }`}
                    >
                      <CheckCircle2 size={13} />
                      <span>Accept Insight</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecisionStatus('REJECTED')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                        decisionStatus === 'REJECTED'
                          ? 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/20'
                          : 'bg-[#12192d] text-rose-300 border-rose-500/30 hover:bg-rose-500/10'
                      }`}
                    >
                      <XCircle size={13} />
                      <span>Reject Insight</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setDecisionStatus('REANALYSIS_REQUESTED')}
                      className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border cursor-pointer ${
                        decisionStatus === 'REANALYSIS_REQUESTED'
                          ? 'bg-amber-500 text-white border-amber-400 shadow-lg shadow-amber-500/20'
                          : 'bg-[#12192d] text-amber-300 border-amber-500/30 hover:bg-amber-500/10'
                      }`}
                    >
                      <RotateCcw size={13} />
                      <span>Re-analyze</span>
                    </button>
                  </div>

                  {/* PM Rationale Comment Box */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                      PM Strategic Justification / Note for Product Planning:
                    </label>
                    <textarea
                      rows={2}
                      value={pmComment}
                      onChange={(e) => setPmComment(e.target.value)}
                      placeholder={
                        decisionStatus === 'ACCEPTED'
                          ? 'e.g. Validated with customer success; prioritizing into Q3 roadmap...'
                          : decisionStatus === 'REJECTED'
                          ? 'e.g. Duplicate of existing tracking issue / out of current product scope...'
                          : 'e.g. Evidence looks sparse; request deeper sentiment clustering...'
                      }
                      className="w-full bg-[#080c18] border border-[#1c2742] rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#5b3df5] transition-colors resize-none"
                    />
                  </div>

                  {/* Save Decision Button */}
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedInsight(null)}
                      className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSubmitReview(selectedInsight, decisionStatus, pmComment)}
                      disabled={submittingReview}
                      className="px-5 py-2 rounded-xl text-xs font-bold bg-[#5b3df5] hover:bg-[#6d4ef8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {submittingReview ? (
                        <>
                          <RefreshCw size={13} className="animate-spin" />
                          <span>Saving Decision...</span>
                        </>
                      ) : (
                        <>
                          <Check size={14} />
                          <span>Save Decision to MongoDB</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              ) : (
                <div className="bg-[#0e1424] border border-[#1b2542] rounded-xl p-3 text-center text-xs text-slate-400">
                  <Shield size={16} className="mx-auto mb-1 text-slate-500" />
                  <span>You are viewing in read-only mode. Only users with the Product Manager role can modify insight decisions.</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

