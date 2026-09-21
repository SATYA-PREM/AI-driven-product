import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Calendar,
  Sparkles,
  Plus,
  RefreshCw,
  Download,
  ExternalLink,
} from 'lucide-react';
import { getActiveDatasetId, subscribeToActiveDataset } from '../../utils/workspaceAccess';
import { featureApi } from '../../api/client';

import FeatureKpiGrid from './components/FeatureKpiGrid';
import FeatureChartsRow from './components/FeatureChartsRow';
import FeatureFilterBar from './components/FeatureFilterBar';
import FeatureTable from './components/FeatureTable';
import FeatureDetailsDrawer from './components/FeatureDetailsDrawer';
import EditFeatureModal from './components/EditFeatureModal';
import AddFeatureModal from './components/AddFeatureModal';

// Fallback monthly trend progression
const DEFAULT_TREND_DATA = [
  { name: 'Jan', total: 10, implemented: 2, inProgress: 4, planned: 4 },
  { name: 'Feb', total: 15, implemented: 4, inProgress: 6, planned: 5 },
  { name: 'Mar', total: 22, implemented: 6, inProgress: 8, planned: 8 },
  { name: 'Apr', total: 28, implemented: 10, inProgress: 11, planned: 7 },
  { name: 'May', total: 34, implemented: 14, inProgress: 12, planned: 8 },
  { name: 'Jun', total: 42, implemented: 18, inProgress: 14, planned: 10 },
  { name: 'Jul', total: 49, implemented: 22, inProgress: 15, planned: 12 },
  { name: 'Aug', total: 56, implemented: 24, inProgress: 14, planned: 18 },
];

export default function FeaturesOverview() {
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

  // Data states
  const [features, setFeatures] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [sourceFilter, setSourceFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Table selection & Drawer
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: '',
    desc: '',
    category: '',
    priority: '',
    status: '',
    owner: '',
    long_desc: '',
  });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addFormData, setAddFormData] = useState({
    name: '',
    desc: '',
    category: 'Checkout & Payments',
    priority: 'High',
    status: 'Not Started',
    owner: '',
    long_desc: '',
  });

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  }, []);

  // Fetch Features from backend API
  const loadFeatures = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true);
      else setRefreshing(true);

      try {
        const queryParams = {};
        if (statusFilter !== 'All') queryParams.status = statusFilter;
        if (priorityFilter !== 'All') queryParams.priority = priorityFilter;
        if (categoryFilter !== 'All') queryParams.category = categoryFilter;
        if (searchQuery.trim()) queryParams.search = searchQuery.trim();

        const res = await featureApi.listFeatures(workspaceId, queryParams);
        if (res) {
          const list = res.features || [];
          setFeatures(list);
          setMetrics(res.metrics || null);

          // Keep active drawer feature updated with latest data
          if (selectedFeature) {
            const updatedActive = list.find((f) => f.feature_id === selectedFeature.feature_id);
            if (updatedActive) setSelectedFeature(updatedActive);
          } else if (list.length > 0 && !selectedFeature) {
            // Select first feature by default for instant preview
            setSelectedFeature(list[0]);
          }
        }
      } catch (err) {
        console.error('Failed to load features:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [workspaceId, statusFilter, priorityFilter, categoryFilter, searchQuery, selectedFeature]
  );

  useEffect(() => {
    loadFeatures();
  }, [workspaceId, statusFilter, priorityFilter, categoryFilter, searchQuery]);

  // Extract from customer feedback
  const handleExtractFromFeedback = async () => {
    setExtracting(true);
    showToast('Extracting new features from feedback dataset in real-time...');
    try {
      const res = await featureApi.extractFeatures(workspaceId, activeDatasetId);
      if (res && res.extracted_count !== undefined) {
        showToast(`Extraction complete! Found ${res.extracted_count} new candidate features.`);
        await loadFeatures(true);
      } else {
        showToast('Feature extraction complete.');
        await loadFeatures(true);
      }
    } catch (err) {
      console.error('Extraction error:', err);
      showToast('Extraction failed. Verify backend and dataset.');
    } finally {
      setExtracting(false);
    }
  };

  // Table row select handlers
  const handleToggleRow = (id) => {
    const next = new Set(selectedRows);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedRows(next);
    setSelectAll(next.size === features.length && features.length > 0);
  };

  const handleToggleSelectAll = () => {
    if (selectAll) {
      setSelectedRows(new Set());
      setSelectAll(false);
    } else {
      setSelectedRows(new Set(features.map((f) => f.feature_id)));
      setSelectAll(true);
    }
  };

  // Drawer action workflows
  const handleSendToPrioritization = async (featureId) => {
    try {
      await featureApi.sendToPrioritization(workspaceId, featureId);
      showToast(`Feature ${featureId} sent to Prioritization matrix.`);
      loadFeatures(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to send to prioritization.');
    }
  };

  const handleLinkPrd = async (featureId) => {
    try {
      await featureApi.linkPrd(workspaceId, featureId);
      showToast(`PRD generation initiated for ${featureId}.`);
      loadFeatures(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to link PRD.');
    }
  };

  const handleAddToRoadmap = async (featureId) => {
    try {
      await featureApi.addToRoadmap(workspaceId, featureId);
      showToast(`Feature ${featureId} added to roadmap successfully.`);
      loadFeatures(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to add to roadmap.');
    }
  };

  // Edit Feature
  const handleOpenEdit = () => {
    if (!selectedFeature) return;
    setEditFormData({
      name: selectedFeature.name || '',
      desc: selectedFeature.desc || '',
      category: selectedFeature.category || 'Checkout & Payments',
      priority: selectedFeature.priority || 'High',
      status: selectedFeature.status || 'Planned',
      owner: selectedFeature.owner || 'Unassigned',
      long_desc: selectedFeature.long_desc || '',
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!selectedFeature) return;
    try {
      const updated = await featureApi.updateFeature(
        workspaceId,
        selectedFeature.feature_id,
        editFormData
      );
      showToast('Feature updated successfully.');
      setIsEditModalOpen(false);
      setSelectedFeature(updated);
      loadFeatures(true);
    } catch (err) {
      console.error(err);
      showToast('Failed to update feature.');
    }
  };

  // Create Feature
  const handleCreateFeature = async (e) => {
    e.preventDefault();
    try {
      const created = await featureApi.createFeature(workspaceId, addFormData);
      showToast(`Feature "${created.name}" created.`);
      setIsAddModalOpen(false);
      setAddFormData({
        name: '',
        desc: '',
        category: 'Checkout & Payments',
        priority: 'High',
        status: 'Not Started',
        owner: '',
        long_desc: '',
      });
      loadFeatures(true);
      setSelectedFeature(created);
    } catch (err) {
      console.error(err);
      showToast('Failed to create feature.');
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = ['Feature ID', 'Name', 'Category', 'Priority', 'Status', 'Users Impacted', 'Feedback Count'];
    const rows = features.map((f) => [
      f.feature_id,
      `"${f.name}"`,
      f.category,
      f.priority,
      f.status,
      f.impact_users,
      f.feedback_count,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `features_overview_${workspaceId}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported features to CSV.');
  };

  // Chart data calculations
  const statusChartData = useMemo(() => {
    if (!metrics?.by_status) {
      return [
        { name: 'Implemented', value: 24, color: '#22c55e' },
        { name: 'In Progress', value: 14, color: '#3b82f6' },
        { name: 'Planned', value: 18, color: '#f97316' },
      ];
    }
    return [
      { name: 'Implemented', value: metrics.by_status['Implemented'] || 0, color: '#22c55e' },
      { name: 'In Progress', value: metrics.by_status['In Progress'] || 0, color: '#3b82f6' },
      { name: 'Planned', value: metrics.by_status['Planned'] || 0, color: '#f97316' },
      { name: 'Not Started', value: metrics.by_status['Not Started'] || 0, color: '#64748b' },
    ];
  }, [metrics]);

  const priorityChartData = useMemo(() => {
    if (!metrics?.by_priority) {
      return [
        { name: 'Critical', value: 8, color: '#ef4444' },
        { name: 'High', value: 22, color: '#f97316' },
        { name: 'Medium', value: 18, color: '#eab308' },
        { name: 'Low', value: 8, color: '#64748b' },
      ];
    }
    return [
      { name: 'Critical', value: metrics.by_priority['Critical'] || 0, color: '#ef4444' },
      { name: 'High', value: metrics.by_priority['High'] || 0, color: '#f97316' },
      { name: 'Medium', value: metrics.by_priority['Medium'] || 0, color: '#eab308' },
      { name: 'Low', value: metrics.by_priority['Low'] || 0, color: '#64748b' },
    ];
  }, [metrics]);

  return (
    <div className="p-6 bg-[#080d1a] min-h-screen text-slate-200 font-sans space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-6 z-50 bg-indigo-600/95 text-white text-xs px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md flex items-center gap-2 border border-indigo-400/40 animate-in fade-in slide-in-from-top-3 duration-200">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header Row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          {/* Breadcrumbs */}
          <div className="flex items-center gap-2 text-[11px] text-slate-400 font-medium mb-1">
            <Link to={`/workspace/${workspaceId}/features`} className="hover:text-indigo-400 transition-colors">
              Features
            </Link>
            <span>&gt;</span>
            <span className="text-white font-semibold">Overview</span>
          </div>

          <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
            <span>Features Overview</span>
            <button
              onClick={() => loadFeatures(true)}
              title="Refresh features"
              className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </h1>
          <p className="text-xs text-slate-400">
            Real-time synthesis of product features extracted from customer feedback, PRD links, and roadmap progress.
          </p>
        </div>

        {/* Right Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Date Range Pill */}
          <div className="flex items-center gap-1.5 bg-[#0e1422] border border-[#1a2338] px-3 py-1.5 rounded-lg text-xs text-slate-300 shadow-xs">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Jan 01, 2026 - Dec 31, 2026</span>
          </div>

          {/* Real-time AI Extraction Trigger */}
          <button
            onClick={handleExtractFromFeedback}
            disabled={extracting}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-purple-600 text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-md shadow-indigo-600/25 transition-all duration-150 cursor-pointer disabled:opacity-60"
          >
            <Sparkles className={`w-3.5 h-3.5 ${extracting ? 'animate-spin' : ''}`} />
            <span>{extracting ? 'Extracting...' : 'Extract From Feedback'}</span>
          </button>

          {/* Add Feature Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-[#151d30] hover:bg-[#1a2338] border border-[#232f48] text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-indigo-400" />
            <span>Add Feature</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <FeatureKpiGrid metrics={metrics} />

      {/* Analytics Charts Section */}
      <FeatureChartsRow
        trendData={DEFAULT_TREND_DATA}
        statusChartData={statusChartData}
        priorityChartData={priorityChartData}
        totalFeatures={metrics?.total_features ?? features.length}
      />

      {/* Filter and Search Bar */}
      <FeatureFilterBar
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
        priorityFilter={priorityFilter}
        setPriorityFilter={setPriorityFilter}
        categoryFilter={categoryFilter}
        setCategoryFilter={setCategoryFilter}
        sourceFilter={sourceFilter}
        setSourceFilter={setSourceFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAdvancedFilters={() => showToast('Advanced filtering enabled')}
      />

      {/* Main Table + Details Drawer Layout */}
      <div className="grid grid-cols-12 gap-5 items-start">
        <div className={`transition-all duration-200 ${selectedFeature ? 'col-span-12 lg:col-span-8' : 'col-span-12'}`}>
          <FeatureTable
            features={features}
            loading={loading}
            selectedFeature={selectedFeature}
            onSelectFeature={(feat) => setSelectedFeature(feat)}
            selectedRows={selectedRows}
            onToggleRow={handleToggleRow}
            selectAll={selectAll}
            onToggleSelectAll={handleToggleSelectAll}
            totalFeatures={metrics?.total_features ?? features.length}
          />
        </div>

        {/* Feature Details Right Drawer */}
        {selectedFeature && (
          <div className="col-span-12 lg:col-span-4 sticky top-6">
            <FeatureDetailsDrawer
              feature={selectedFeature}
              onClose={() => setSelectedFeature(null)}
              onOpenEdit={handleOpenEdit}
              onSendToPrioritization={handleSendToPrioritization}
              onLinkPrd={handleLinkPrd}
              onAddToRoadmap={handleAddToRoadmap}
              onTriggerToast={showToast}
            />
          </div>
        )}
      </div>

      {/* Edit Feature Modal */}
      <EditFeatureModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        formData={editFormData}
        setFormData={setEditFormData}
        onSave={handleSaveEdit}
      />

      {/* Add Feature Modal */}
      <AddFeatureModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        formData={addFormData}
        setFormData={setAddFormData}
        onCreate={handleCreateFeature}
      />
    </div>
  );
}
