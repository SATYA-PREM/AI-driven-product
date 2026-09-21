import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  MessageSquare,
  Sparkles,
  Layers,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Calendar,
  RefreshCw,
  ArrowRight,
  TrendingUp,
  Target,
  FileText,
  Map,
  Smile,
} from 'lucide-react';
import { feedbackApi, featureApi } from '../../api/client';
import { getActiveDatasetId, subscribeToActiveDataset } from '../../utils/workspaceAccess';

import FeedbackOverviewTab from './components/FeedbackOverviewTab';
import AllFeedbackTab from './components/AllFeedbackTab';
import MyFeedbackTab from './components/MyFeedbackTab';
import FeedbackAnalysisTab from './components/FeedbackAnalysisTab';
import UnresolvedFeedbackTab from './components/UnresolvedFeedbackTab';
import ResolvedFeedbackTab from './components/ResolvedFeedbackTab';
import FeedbackFeatureMappingTab from './components/FeedbackFeatureMappingTab';
import FeedbackDetailsModal from './components/FeedbackDetailsModal';
import AddFeedbackModal from './components/AddFeedbackModal';

export default function FeedbackManagement() {
  const { workspaceId = 'ws-sync-980c304d' } = useParams();

  // Active dataset listener
  const [activeDatasetId, setActiveDatasetId] = useState(() => getActiveDatasetId(workspaceId));
  useEffect(() => {
    return subscribeToActiveDataset((event) => {
      if (!event?.detail?.workspaceId || event.detail.workspaceId === workspaceId) {
        setActiveDatasetId(event?.detail?.datasetId || null);
      }
    });
  }, [workspaceId]);

  // Main active tab (1 to 8)
  const [activeTab, setActiveTab] = useState('overview'); // overview, all, my, analysis, unresolved, resolved, mapping

  // Data states
  const [feedbackList, setFeedbackList] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters for All Feedback Tab
  const [sourceFilter, setSourceFilter] = useState('All');
  const [sentimentFilter, setSentimentFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Selected feedback for Details Modal (Screen 3)
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Add Feedback Modal (Screen 9)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    text: '',
    source: 'Play Store',
    sentiment: 'Neutral',
    category: 'Checkout & Payments',
    priority: 'Medium',
    user_id: '',
    device: 'Android',
    app_version: 'v2.3.1',
  });

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // Fetch Feedback list and metrics
  const loadFeedback = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        const params = {};
        if (sourceFilter !== 'All') params.source = sourceFilter;
        if (sentimentFilter !== 'All') params.sentiment = sentimentFilter;
        if (statusFilter !== 'All') params.status = statusFilter;
        if (searchQuery.trim()) params.search = searchQuery.trim();

        const res = await feedbackApi.listFeedback(workspaceId, params);
        if (res) {
          setFeedbackList(res.feedback || []);
          setMetrics(res.metrics || null);

          // Update active modal item if open
          if (selectedFeedback) {
            const updated = (res.feedback || []).find(
              (f) => f.feedback_id === selectedFeedback.feedback_id
            );
            if (updated) setSelectedFeedback(updated);
          }
        }
      } catch (err) {
        console.error('Failed to load feedback:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workspaceId, sourceFilter, sentimentFilter, statusFilter, searchQuery, selectedFeedback]
  );

  useEffect(() => {
    loadFeedback();
  }, [workspaceId, sourceFilter, sentimentFilter, statusFilter, searchQuery]);

  // Open Feedback Details Modal
  const handleOpenDetails = (item) => {
    setSelectedFeedback(item);
    setIsDetailsOpen(true);
  };

  // Previous / Next Feedback inside Modal
  const currentIndex = useMemo(() => {
    if (!selectedFeedback) return -1;
    return feedbackList.findIndex((f) => f.feedback_id === selectedFeedback.feedback_id);
  }, [feedbackList, selectedFeedback]);

  const handlePrevFeedback = () => {
    if (currentIndex > 0) {
      setSelectedFeedback(feedbackList[currentIndex - 1]);
    }
  };

  const handleNextFeedback = () => {
    if (currentIndex >= 0 && currentIndex < feedbackList.length - 1) {
      setSelectedFeedback(feedbackList[currentIndex + 1]);
    }
  };

  // Status Change (Resolve, In Review, etc.)
  const handleStatusChange = async (feedbackId, newStatus) => {
    try {
      await feedbackApi.updateFeedback(workspaceId, feedbackId, { status: newStatus });
      showToast(`Feedback ${feedbackId} updated to ${newStatus}.`);
      loadFeedback(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to update status.');
    }
  };

  // Quick Resolve
  const handleResolve = async (feedbackId) => {
    handleStatusChange(feedbackId, 'Resolved');
  };

  // Map to Feature
  const handleMapFeature = async (feedbackId, suggestedName) => {
    try {
      const res = await feedbackApi.mapFeature(workspaceId, feedbackId, {
        feature_name: suggestedName,
      });
      showToast(`Linked ${feedbackId} to feature "${suggestedName}".`);
      loadFeedback(true);
      if (selectedFeedback && selectedFeedback.feedback_id === feedbackId) {
        setSelectedFeedback(res);
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to link feature.');
    }
  };

  // Create Feedback (Manual Entry)
  const handleCreateFeedback = async (e) => {
    e.preventDefault();
    try {
      const created = await feedbackApi.createFeedback(workspaceId, addFormData);
      showToast(`Feedback ${created.feedback_id} logged successfully.`);
      setIsAddModalOpen(false);
      setAddFormData({
        text: '',
        source: 'Play Store',
        sentiment: 'Neutral',
        category: 'Checkout & Payments',
        priority: 'Medium',
        user_id: '',
        device: 'Android',
        app_version: 'v2.3.1',
      });
      loadFeedback(true);
      handleOpenDetails(created);
    } catch (err) {
      console.error(err);
      showToast('Failed to create feedback.');
    }
  };

  return (
    <div className="p-6 bg-[#080d1a] min-h-screen text-slate-200 font-sans space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-6 z-50 bg-indigo-600/95 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 border border-indigo-400/40 animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Banner matching ProdIntel AI Mockup */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] text-indigo-400 font-bold uppercase tracking-wider mb-1">
            <span className="bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/30">
              ProdIntel AI
            </span>
            <span className="text-slate-500">•</span>
            <span className="text-slate-300 font-normal">Product Feedback Intelligence Platform</span>
          </div>

          <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2.5">
            <span>FEEDBACK MANAGEMENT</span>
            <button
              onClick={() => loadFeedback(true)}
              title="Refresh feedback"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            From customer voices to product impact — Listen &rarr; Analyze &rarr; Prioritize &rarr; Build &rarr; Deliver
          </p>
        </div>

        {/* Right Badge & Add Action */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="hidden lg:flex flex-col text-right pr-3 border-r border-[#1a2338]">
            <span className="text-xs font-bold text-indigo-300 tracking-wider">REAL FEEDBACK.</span>
            <span className="text-xs font-bold text-purple-300 tracking-wider">REAL IMPACT.</span>
          </div>

          {/* Date Range Pill */}
          <div className="flex items-center gap-1.5 bg-[#151d30] border border-[#232f48] px-3 py-1.5 rounded-lg text-xs text-slate-300 font-mono text-[11px]">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Jul 1, 2025 - Jul 31, 2025</span>
          </div>

          {/* + Add Feedback Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/25 cursor-pointer transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Feedback</span>
          </button>
        </div>
      </div>

      {/* 7-Tab Navigation Pill Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#1a2338] pb-3">
        {[
          { key: 'overview', label: '1. Feedback Overview' },
          { key: 'all', label: '2. All Feedback List', count: metrics?.total_feedback ?? feedbackList.length },
          { key: 'my', label: '3. My Feedback', count: feedbackList.filter(f => f.assigned_to === 'Me' || f.assigned_to === 'user_pm').length },
          { key: 'analysis', label: '4. Feedback Analysis' },
          { key: 'unresolved', label: '5. Unresolved Feedback', count: metrics?.unresolved_count },
          { key: 'resolved', label: '6. Resolved Feedback', count: metrics?.resolved_count },
          { key: 'mapping', label: '7. Feedback → Feature Mapping', count: metrics?.mapped_count },
        ].map((tab) => {
          const active = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                active
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                  : 'bg-[#0e1422] text-slate-400 hover:text-white hover:bg-[#151d30] border border-[#1a2338]'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count !== undefined && tab.count !== null && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${active ? 'bg-indigo-700 text-white' : 'bg-slate-800 text-slate-300'}`}>
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <FeedbackOverviewTab
          metrics={metrics}
          recentFeedback={feedbackList}
          onSelectFeedback={handleOpenDetails}
          onNavigateToAll={() => setActiveTab('all')}
        />
      )}

      {activeTab === 'all' && (
        <AllFeedbackTab
          feedbackList={feedbackList}
          totalCount={metrics?.total_feedback ?? feedbackList.length}
          loading={loading}
          sourceFilter={sourceFilter}
          setSourceFilter={setSourceFilter}
          sentimentFilter={sentimentFilter}
          setSentimentFilter={setSentimentFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenAddModal={() => setIsAddModalOpen(true)}
          onSelectFeedback={handleOpenDetails}
        />
      )}

      {activeTab === 'my' && (
        <MyFeedbackTab
          feedbackList={feedbackList}
          onSelectFeedback={handleOpenDetails}
        />
      )}

      {activeTab === 'analysis' && (
        <FeedbackAnalysisTab
          metrics={metrics}
          onViewThemeDetails={() => {
            setCategoryFilter('Checkout & Payments');
            setActiveTab('all');
          }}
        />
      )}

      {activeTab === 'unresolved' && (
        <UnresolvedFeedbackTab
          feedbackList={feedbackList}
          onSelectFeedback={handleOpenDetails}
          onResolve={handleResolve}
        />
      )}

      {activeTab === 'resolved' && (
        <ResolvedFeedbackTab
          feedbackList={feedbackList}
          onSelectFeedback={handleOpenDetails}
        />
      )}

      {activeTab === 'mapping' && (
        <FeedbackFeatureMappingTab
          feedbackList={feedbackList}
          onSelectFeedback={handleOpenDetails}
          onMapFeature={handleMapFeature}
        />
      )}

      {/* Bottom Process Workflow Banner matching reference image */}
      <div className="bg-[#0e1422] border border-[#1a2338] rounded-2xl p-4 shadow-xl mt-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-center text-center">
          <div className="p-2.5 rounded-xl bg-[#151d30]/80 border border-[#232f48] flex flex-col items-center">
            <MessageSquare className="w-5 h-5 text-indigo-400 mb-1" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Customer Feedback</span>
            <span className="text-[10px] text-slate-400">All voices, all channels</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#151d30]/80 border border-[#232f48] flex flex-col items-center">
            <Sparkles className="w-5 h-5 text-purple-400 mb-1" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">AI Analysis</span>
            <span className="text-[10px] text-slate-400">Find patterns & insights</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#151d30]/80 border border-[#232f48] flex flex-col items-center">
            <Layers className="w-5 h-5 text-sky-400 mb-1" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Feature Creation</span>
            <span className="text-[10px] text-slate-400">Turn insights into features</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#151d30]/80 border border-[#232f48] flex flex-col items-center">
            <Target className="w-5 h-5 text-emerald-400 mb-1" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Product Roadmap</span>
            <span className="text-[10px] text-slate-400">Prioritize & plan</span>
          </div>

          <div className="p-2.5 rounded-xl bg-[#151d30]/80 border border-[#232f48] flex flex-col items-center">
            <Smile className="w-5 h-5 text-pink-400 mb-1" />
            <span className="text-[11px] font-bold text-white uppercase tracking-wider">Better Products</span>
            <span className="text-[10px] text-slate-400">Happier customers</span>
          </div>
        </div>
      </div>

      {/* Screen 3: Feedback Details Modal */}
      <FeedbackDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        feedback={selectedFeedback}
        onPrev={handlePrevFeedback}
        onNext={handleNextFeedback}
        hasPrev={currentIndex > 0}
        hasNext={currentIndex >= 0 && currentIndex < feedbackList.length - 1}
        onStatusChange={handleStatusChange}
        onMapFeature={handleMapFeature}
        onAssignToMe={(id) => handleStatusChange(id, 'In Review')}
      />

      {/* Screen 9: Add Feedback Modal */}
      <AddFeedbackModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        formData={addFormData}
        setFormData={setAddFormData}
        onCreate={handleCreateFeedback}
      />
    </div>
  );
}

