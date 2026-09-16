import React, { useState, useEffect, useMemo } from 'react';
import { useOutletContext, useNavigate, useParams, Link } from 'react-router-dom';
import {
  Database,
  UploadCloud,
  FileText,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  Edit3,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  Play,
  Check,
  X,
  Copy,
  ExternalLink,
  HardDrive,
  Layers,
  Activity,
  ChevronRight,
  ChevronLeft,
  Table as TableIcon,
  Code as CodeIcon,
  ShieldAlert,
  Sliders,
  CheckCircle,
  HelpCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { datasetApi } from '../../api/client';
import { formatISTDate, formatISTDateTime } from '../../utils/dateUtils';

const SOURCE_TYPE_CONFIG = {
  feedback: { label: 'User Feedback', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20' },
  support_tickets: { label: 'Support Tickets', color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
  reviews: { label: 'App Reviews', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20' },
  feature_requests: { label: 'Feature Requests', color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  surveys: { label: 'Survey Responses', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
  social_media: { label: 'Social & Web', color: 'text-pink-400 bg-pink-500/10 border-pink-500/20' },
};

const STAGE_CONFIG = {
  UPLOADED: { label: 'Uploaded', color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/25', icon: HardDrive },
  VALIDATED: { label: 'Validated', color: 'text-blue-400 bg-blue-500/10 border-blue-500/25', icon: CheckCircle },
  CLEANED: { label: 'Cleaned', color: 'text-[#00FFA3] bg-[#00FFA3]/10 border-[#00FFA3]/25', icon: CheckCircle2 },
  PREPROCESSED: { label: 'AI Ready (Preprocessed)', color: 'text-purple-400 bg-purple-500/10 border-purple-500/25', icon: Sparkles },
  AI_ANALYSIS: { label: 'AI Analyzing', color: 'text-amber-400 bg-amber-500/10 border-amber-500/25', icon: Activity },
  COMPLETED: { label: 'Fully Processed', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25', icon: CheckCircle2 },
  FAILED: { label: 'Failed', color: 'text-rose-400 bg-rose-500/10 border-rose-500/25', icon: AlertTriangle },
};

export default function DatasetList() {
  const { isDark = true } = useOutletContext() || {};
  const navigate = useNavigate();
  const { workspaceId } = useParams();

  // Dataset directory states
  const [datasets, setDatasets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Copy feedback state
  const [copiedId, setCopiedId] = useState(null);

  // --- Inspect Data Modal State ---
  const [inspectModal, setInspectModal] = useState({
    isOpen: false,
    dataset: null,
    stage: 'raw', // 'raw' | 'cleaned' | 'processed'
    records: [],
    isLoading: false,
    error: null,
    viewMode: 'table', // 'table' | 'json'
    skip: 0,
    limit: 50,
    searchTerm: '',
    copiedJson: false,
  });

  // --- Edit Metadata Modal State ---
  const [editModal, setEditModal] = useState({
    isOpen: false,
    dataset: null,
    filename: '',
    source_type: 'feedback',
    description: '',
    isSaving: false,
    error: null,
  });

  // --- Delete Confirmation Modal State ---
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    dataset: null,
    isDeleting: false,
    error: null,
  });

  // Fetch datasets for current workspace
  const fetchDatasets = async (showLoadingSpinner = true) => {
    if (!workspaceId) return;
    try {
      if (showLoadingSpinner) setIsLoading(true);
      else setIsRefreshing(true);
      setError(null);
      const data = await datasetApi.list(workspaceId);
      setDatasets(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Error fetching datasets:', err);
      setError(err.message || 'Failed to load datasets for this workspace.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDatasets(true);
  }, [workspaceId]);

  // Copy ID helper
  const handleCopyId = (id) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // KPI Calculations
  const stats = useMemo(() => {
    const totalDatasets = datasets.length;
    const totalRecords = datasets.reduce((acc, curr) => acc + (curr.record_count || 0), 0);
    const cleanedDatasets = datasets.filter((d) => ['CLEANED', 'PREPROCESSED', 'AI_ANALYSIS', 'COMPLETED'].includes(d.status)).length;
    const aiReadyDatasets = datasets.filter((d) => ['PREPROCESSED', 'AI_ANALYSIS', 'COMPLETED'].includes(d.status)).length;
    const totalBytes = datasets.reduce((acc, curr) => acc + (curr.file_size || 0), 0);
    
    // Format storage size
    let storageFormatted = '0 KB';
    if (totalBytes > 1024 * 1024) {
      storageFormatted = `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else if (totalBytes > 0) {
      storageFormatted = `${(totalBytes / 1024).toFixed(1)} KB`;
    }

    return {
      totalDatasets,
      totalRecords,
      cleanedDatasets,
      aiReadyDatasets,
      storageFormatted,
    };
  }, [datasets]);

  // Filtered datasets
  const filteredDatasets = useMemo(() => {
    return datasets.filter((dataset) => {
      const matchSearch =
        searchQuery.trim() === '' ||
        dataset.filename?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dataset.source_type?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchSource =
        sourceFilter === 'ALL' || dataset.source_type?.toLowerCase() === sourceFilter.toLowerCase();

      const matchStatus =
        statusFilter === 'ALL' || dataset.status?.toUpperCase() === statusFilter.toUpperCase();

      return matchSearch && matchSource && matchStatus;
    });
  }, [datasets, searchQuery, sourceFilter, statusFilter]);

  // --- Inspect Data Modal Handlers ---
  const handleOpenInspectModal = async (dataset, stage = 'raw') => {
    setInspectModal({
      isOpen: true,
      dataset,
      stage,
      records: [],
      isLoading: true,
      error: null,
      viewMode: 'table',
      skip: 0,
      limit: 50,
      searchTerm: '',
      copiedJson: false,
    });
    fetchInspectRecords(dataset.id, stage, 0, 50);
  };

  const fetchInspectRecords = async (datasetId, stage, skip = 0, limit = 50) => {
    setInspectModal((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const records = await datasetApi.getRecords(datasetId, stage, skip, limit);
      setInspectModal((prev) => ({
        ...prev,
        records: Array.isArray(records) ? records : [],
        isLoading: false,
        stage,
        skip,
        limit,
      }));
    } catch (err) {
      console.error('Failed to load dataset records:', err);
      setInspectModal((prev) => ({
        ...prev,
        error: err.message || `Failed to load ${stage} records for this dataset.`,
        isLoading: false,
        records: [],
      }));
    }
  };

  const handleStageTabChange = (stage) => {
    if (!inspectModal.dataset) return;
    setInspectModal((prev) => ({ ...prev, stage, skip: 0 }));
    fetchInspectRecords(inspectModal.dataset.id, stage, 0, inspectModal.limit);
  };

  // --- Edit Metadata Handlers ---
  const handleOpenEditModal = (dataset) => {
    setEditModal({
      isOpen: true,
      dataset,
      filename: dataset.filename || '',
      source_type: dataset.source_type || 'feedback',
      description: dataset.description || '',
      isSaving: false,
      error: null,
    });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editModal.dataset) return;
    setEditModal((prev) => ({ ...prev, isSaving: true, error: null }));
    try {
      const updated = await datasetApi.update(editModal.dataset.id, {
        filename: editModal.filename.trim(),
        source_type: editModal.source_type,
        description: editModal.description.trim(),
      });
      setDatasets((prev) =>
        prev.map((d) => (d.id === editModal.dataset.id ? { ...d, ...updated } : d))
      );
      setEditModal((prev) => ({ ...prev, isOpen: false, isSaving: false }));
    } catch (err) {
      console.error('Failed to update dataset:', err);
      setEditModal((prev) => ({
        ...prev,
        isSaving: false,
        error: err.message || 'Failed to update dataset metadata.',
      }));
    }
  };

  // --- Delete Handlers ---
  const handleOpenDeleteModal = (dataset) => {
    setDeleteModal({
      isOpen: true,
      dataset,
      isDeleting: false,
      error: null,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.dataset) return;
    setDeleteModal((prev) => ({ ...prev, isDeleting: true, error: null }));
    try {
      await datasetApi.deleteDataset(deleteModal.dataset.id);
      setDatasets((prev) => prev.filter((d) => d.id !== deleteModal.dataset.id));
      setDeleteModal({ isOpen: false, dataset: null, isDeleting: false, error: null });
    } catch (err) {
      console.error('Failed to delete dataset:', err);
      setDeleteModal((prev) => ({
        ...prev,
        isDeleting: false,
        error: err.message || 'Failed to delete dataset.',
      }));
    }
  };

  // Helper to format record data for inspector table
  const filteredInspectRecords = useMemo(() => {
    if (!inspectModal.searchTerm.trim()) return inspectModal.records;
    const term = inspectModal.searchTerm.toLowerCase();
    return inspectModal.records.filter((rec) => {
      const serialized = JSON.stringify(rec).toLowerCase();
      return serialized.includes(term);
    });
  }, [inspectModal.records, inspectModal.searchTerm]);

  const inspectTableColumns = useMemo(() => {
    if (!inspectModal.records || inspectModal.records.length === 0) return [];
    const keys = new Set();
    // Gather up to 6 prominent keys
    inspectModal.records.slice(0, 10).forEach((rec) => {
      Object.keys(rec).forEach((k) => {
        if (!['id', '_id', 'raw_record_id', 'workspace_id', 'dataset_id'].includes(k)) {
          keys.add(k);
        }
      });
    });
    return Array.from(keys).slice(0, 6);
  }, [inspectModal.records]);

  return (
    <div className="flex flex-col h-full gap-6 relative max-w-7xl mx-auto w-full pb-12">
      {/* Top Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
              <Database className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Dataset Management Studio
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold uppercase tracking-wider">
                  Phase 3: Ingestion
                </span>
              </h1>
              <p className="text-sm text-gray-400 mt-0.5">
                Inspect, sanitize, and manage uploaded customer signals across all pipeline transformation stages.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button
            onClick={() => fetchDatasets(false)}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#121827] text-gray-300 hover:text-white border border-white/10 hover:border-white/20 transition-all shadow-sm disabled:opacity-50"
            title="Refresh dataset list"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-[#00FFA3]' : ''}`} />
            Refresh
          </button>

          <Link
            to={`/workspace/${workspaceId}/data/upload`}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-[#00FFA3] text-black hover:bg-[#00FFA3]/90 transition-all shadow-[0_0_20px_rgba(0,255,163,0.3)] hover:shadow-[0_0_30px_rgba(0,255,163,0.5)] cursor-pointer"
          >
            <UploadCloud className="h-4 w-4" />
            Upload New Dataset
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Datasets */}
        <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-indigo-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all"></div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Total Datasets</p>
            <h3 className="text-2xl font-black text-white mt-1">{stats.totalDatasets}</h3>
            <p className="text-[11px] text-indigo-400 mt-0.5 flex items-center gap-1 font-mono">
              <HardDrive className="h-3 w-3" /> {stats.storageFormatted} Volume
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Database className="h-6 w-6" />
          </div>
        </div>

        {/* Total Raw Records */}
        <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-2xl group-hover:bg-cyan-500/10 transition-all"></div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Ingested Signals</p>
            <h3 className="text-2xl font-black text-white mt-1">{stats.totalRecords.toLocaleString()}</h3>
            <p className="text-[11px] text-cyan-400 mt-0.5 flex items-center gap-1 font-mono">
              <FileSpreadsheet className="h-3 w-3" /> Across all files
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400">
            <Layers className="h-6 w-6" />
          </div>
        </div>

        {/* Cleaned Datasets */}
        <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-[#00FFA3]/40 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#00FFA3]/5 rounded-full blur-2xl group-hover:bg-[#00FFA3]/10 transition-all"></div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Cleaned & Validated</p>
            <h3 className="text-2xl font-black text-[#00FFA3] mt-1">{stats.cleanedDatasets}</h3>
            <p className="text-[11px] text-emerald-400 mt-0.5 flex items-center gap-1 font-mono">
              <CheckCircle2 className="h-3 w-3" /> Sanitized for AI
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-[#00FFA3]/10 border border-[#00FFA3]/20 flex items-center justify-center text-[#00FFA3]">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        {/* AI Ready Pipelines */}
        <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-purple-500/40 transition-colors">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full blur-2xl group-hover:bg-purple-500/10 transition-all"></div>
          <div>
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">AI Ready Signals</p>
            <h3 className="text-2xl font-black text-purple-300 mt-1">{stats.aiReadyDatasets}</h3>
            <p className="text-[11px] text-purple-400 mt-0.5 flex items-center gap-1 font-mono">
              <Sparkles className="h-3 w-3" /> Ready for CrewAI
            </p>
          </div>
          <div className="h-12 w-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <Sparkles className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[#0b0f19] border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search datasets by filename, ID, or source type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#121827] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors font-mono"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>

        {/* Source Type Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            <Filter className="h-3 w-3" /> Source:
          </span>
          {['ALL', 'feedback', 'support_tickets', 'reviews', 'feature_requests'].map((type) => (
            <button
              key={type}
              onClick={() => setSourceFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                sourceFilter === type
                  ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(99,102,241,0.4)]'
                  : 'bg-[#121827] text-gray-400 hover:text-gray-200 border border-white/5'
              }`}
            >
              {type === 'ALL' ? 'All Sources' : SOURCE_TYPE_CONFIG[type]?.label || type}
            </button>
          ))}
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            <Sliders className="h-3 w-3" /> Status:
          </span>
          {['ALL', 'UPLOADED', 'CLEANED', 'PREPROCESSED', 'COMPLETED'].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                statusFilter === status
                  ? 'bg-purple-600 text-white shadow-[0_0_10px_rgba(168,85,247,0.4)]'
                  : 'bg-[#121827] text-gray-400 hover:text-gray-200 border border-white/5'
              }`}
            >
              {status === 'ALL' ? 'All Statuses' : status}
            </button>
          ))}
        </div>
      </div>

      {/* Dataset Directory Table Card */}
      <div className="bg-[#0b0f19] border border-white/10 rounded-2xl overflow-hidden shadow-xl flex flex-col">
        {isLoading ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="relative">
              <div className="h-14 w-14 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin flex items-center justify-center mb-4"></div>
              <Database className="h-6 w-6 text-indigo-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 -mt-2" />
            </div>
            <h4 className="text-base font-semibold text-white">Loading Workspace Datasets</h4>
            <p className="text-xs text-gray-400 mt-1 max-w-sm">
              Connecting to repository and fetching ingested customer feedback records...
            </p>
          </div>
        ) : error ? (
          <div className="p-12 flex flex-col items-center justify-center text-center">
            <div className="h-12 w-12 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-3">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h4 className="text-base font-semibold text-white">Failed to Load Datasets</h4>
            <p className="text-xs text-rose-400/80 mt-1 max-w-md">{error}</p>
            <button
              onClick={() => fetchDatasets(true)}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-sm"
            >
              Try Again
            </button>
          </div>
        ) : filteredDatasets.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-4 shadow-[0_0_20px_rgba(99,102,241,0.15)]">
              <Database className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-bold text-white">
              {datasets.length === 0 ? 'No Datasets in Workspace' : 'No Matching Datasets'}
            </h3>
            <p className="text-xs text-gray-400 mt-1 max-w-md">
              {datasets.length === 0
                ? 'Upload your first CSV, JSON, or Excel file with customer feedback to begin inspection, cleaning, and AI intelligence analysis.'
                : 'No datasets matched your current search and filter settings. Try adjusting your query.'}
            </p>
            {datasets.length === 0 ? (
              <Link
                to={`/workspace/${workspaceId}/data/upload`}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00FFA3] text-black hover:bg-[#00FFA3]/90 transition-all shadow-[0_0_20px_rgba(0,255,163,0.3)]"
              >
                <UploadCloud className="h-4 w-4" />
                Upload Feedback Dataset
              </Link>
            ) : (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSourceFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold bg-[#121827] text-indigo-400 border border-indigo-500/30 hover:bg-indigo-500/10 transition-all"
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#121827]/80 text-gray-400 text-[11px] font-semibold uppercase tracking-wider border-b border-white/10">
                  <th className="py-3.5 px-5">Dataset & ID</th>
                  <th className="py-3.5 px-4">Source Type</th>
                  <th className="py-3.5 px-4">Pipeline Status</th>
                  <th className="py-3.5 px-4">Records / Size</th>
                  <th className="py-3.5 px-4">Uploaded Date (IST)</th>
                  <th className="py-3.5 px-5 text-right">Actions & Pipeline</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-sm">
                {filteredDatasets.map((dataset) => {
                  const sourceConfig = SOURCE_TYPE_CONFIG[dataset.source_type] || {
                    label: dataset.source_type || 'Feedback',
                    color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
                  };
                  const stageConfig = STAGE_CONFIG[dataset.status?.toUpperCase()] || {
                    label: dataset.status || 'Unknown',
                    color: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
                    icon: HelpCircle,
                  };
                  const StageIcon = stageConfig.icon;

                  // Format file size
                  const sizeFormatted = dataset.file_size
                    ? dataset.file_size > 1024 * 1024
                      ? `${(dataset.file_size / (1024 * 1024)).toFixed(1)} MB`
                      : `${(dataset.file_size / 1024).toFixed(1)} KB`
                    : '--';

                  return (
                    <tr
                      key={dataset.id}
                      className="hover:bg-[#121827]/60 transition-colors group"
                    >
                      {/* Dataset Name & ID */}
                      <td className="py-4 px-5">
                        <div className="flex items-start gap-3">
                          <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-white text-sm truncate max-w-[240px]">
                                {dataset.filename || 'Untitled Dataset'}
                              </span>
                              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/5 text-gray-400 border border-white/10 font-bold">
                                {dataset.format || 'CSV'}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[11px] font-mono text-gray-400 truncate max-w-[150px]">
                                {dataset.id}
                              </span>
                              <button
                                onClick={() => handleCopyId(dataset.id)}
                                className="text-gray-500 hover:text-[#00FFA3] transition-colors p-0.5 rounded"
                                title="Copy Dataset ID"
                              >
                                {copiedId === dataset.id ? (
                                  <Check className="h-3 w-3 text-[#00FFA3]" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Source Type */}
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${sourceConfig.color}`}
                        >
                          {sourceConfig.label}
                        </span>
                      </td>

                      {/* Pipeline Status */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border w-fit ${stageConfig.color}`}
                          >
                            <StageIcon className="h-3.5 w-3.5" />
                            {stageConfig.label}
                          </span>
                        </div>
                      </td>

                      {/* Records / Size */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-white text-sm">
                            {(dataset.record_count || 0).toLocaleString()}{' '}
                            <span className="text-xs font-normal text-gray-400">records</span>
                          </span>
                          <span className="text-xs text-gray-500 font-mono">{sizeFormatted}</span>
                        </div>
                      </td>

                      {/* Upload Date */}
                      <td className="py-4 px-4">
                        <div className="flex flex-col text-xs text-gray-300">
                          <span className="font-medium">{formatISTDate(dataset.created_at)}</span>
                          <span className="text-[11px] text-gray-500">
                            {formatISTDateTime(dataset.created_at).split(',')[1] || ''}
                          </span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect Data Modal Button */}
                          <button
                            onClick={() => handleOpenInspectModal(dataset, 'raw')}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#121827] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-500/10 border border-cyan-500/20 transition-all shadow-sm"
                            title="Inspect multi-stage data records"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Inspect
                          </button>

                          {/* Preprocessing Data Agent Link */}
                          <button
                            onClick={() => navigate(`/workspace/${workspaceId}/data/agent?dataset=${dataset.id}`)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#121827] text-[#00FFA3] hover:text-black hover:bg-[#00FFA3] border border-[#00FFA3]/30 transition-all shadow-sm"
                            title="Open Dirty Data Agent (Clean & Preprocess)"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            Clean
                          </button>

                          {/* Run AI Analysis Link */}
                          <button
                            onClick={() => navigate(`/workspace/${workspaceId}/ai/analysis?dataset=${dataset.id}`)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#121827] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 border border-purple-500/20 transition-all shadow-sm"
                            title="Run CrewAI 3-Agent Flow"
                          >
                            <Play className="h-3.5 w-3.5" />
                            AI Crew
                          </button>

                          {/* Edit Metadata */}
                          <button
                            onClick={() => handleOpenEditModal(dataset)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                            title="Edit Dataset Details"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </button>

                          {/* Delete Dataset */}
                          <button
                            onClick={() => handleOpenDeleteModal(dataset)}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete Dataset"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
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

      {/* ========================================================================= */}
      {/* 1. MULTI-STAGE DATA INSPECTOR MODAL                                      */}
      {/* ========================================================================= */}
      {inspectModal.isOpen && inspectModal.dataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-5xl max-h-[90vh] bg-[#0b0f19] border border-cyan-500/30 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-5 border-b border-white/10 bg-[#070a12]/80 gap-3">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.2)]">
                  <Layers className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    Multi-Stage Data Inspector
                    <span className="text-xs px-2 py-0.5 rounded bg-white/10 text-cyan-300 font-mono">
                      {inspectModal.dataset.filename}
                    </span>
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Dataset ID: <span className="font-mono text-gray-300">{inspectModal.dataset.id}</span> • Total Rows: {(inspectModal.dataset.record_count || 0).toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* View Mode Toggle */}
                <div className="flex items-center bg-[#121827] p-1 rounded-xl border border-white/10">
                  <button
                    onClick={() => setInspectModal((prev) => ({ ...prev, viewMode: 'table' }))}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      inspectModal.viewMode === 'table'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <TableIcon className="h-3.5 w-3.5" /> Table
                  </button>
                  <button
                    onClick={() => setInspectModal((prev) => ({ ...prev, viewMode: 'json' }))}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                      inspectModal.viewMode === 'json'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 shadow-sm'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <CodeIcon className="h-3.5 w-3.5" /> JSON Raw
                  </button>
                </div>

                <button
                  onClick={() => setInspectModal((prev) => ({ ...prev, isOpen: false }))}
                  className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Stage Selector Tabs */}
            <div className="flex items-center justify-between px-5 pt-3 pb-3 border-b border-white/5 bg-[#0e1322] flex-wrap gap-2">
              <div className="flex items-center gap-2">
                {[
                  { id: 'raw', label: '1. Raw Ingested Records', desc: 'Original dirty inputs' },
                  { id: 'cleaned', label: '2. Cleaned & Sanitized', desc: 'Deduplicated & normalized' },
                  { id: 'processed', label: '3. Canonical AI Signals', desc: 'Tokenized & structured' },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleStageTabChange(tab.id)}
                    className={`flex flex-col text-left px-4 py-2 rounded-xl transition-all border ${
                      inspectModal.stage === tab.id
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-white shadow-[0_0_15px_rgba(99,102,241,0.2)]'
                        : 'bg-[#121827]/60 border-white/5 text-gray-400 hover:text-gray-200 hover:bg-[#121827]'
                    }`}
                  >
                    <span className="text-xs font-bold flex items-center gap-1.5">
                      {inspectModal.stage === tab.id && <span className="h-2 w-2 rounded-full bg-[#00FFA3] animate-pulse"></span>}
                      {tab.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{tab.desc}</span>
                  </button>
                ))}
              </div>

              {/* In-Modal Search */}
              <div className="relative min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filter inspect records..."
                  value={inspectModal.searchTerm}
                  onChange={(e) => setInspectModal((prev) => ({ ...prev, searchTerm: e.target.value }))}
                  className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#121827] border border-white/10 text-white text-xs placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>
            </div>

            {/* Modal Body / Records Viewer */}
            <div className="flex-1 overflow-y-auto p-5 min-h-[300px]">
              {inspectModal.isLoading ? (
                <div className="h-64 flex flex-col items-center justify-center text-center">
                  <div className="h-10 w-10 rounded-full border-2 border-cyan-500/20 border-t-cyan-500 animate-spin mb-3"></div>
                  <p className="text-xs text-gray-300 font-medium">Fetching {inspectModal.stage} records from database...</p>
                </div>
              ) : inspectModal.error ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-rose-500/5 border border-rose-500/20 rounded-xl">
                  <AlertCircle className="h-8 w-8 text-rose-400 mb-2" />
                  <h5 className="text-sm font-semibold text-white">Records Not Available for this Stage</h5>
                  <p className="text-xs text-rose-400/80 mt-1 max-w-md">{inspectModal.error}</p>
                  <p className="text-[11px] text-gray-400 mt-2">
                    Tip: Run the Data Preprocessing Agent on this dataset to generate cleaned and canonical AI records.
                  </p>
                </div>
              ) : filteredInspectRecords.length === 0 ? (
                <div className="h-64 flex flex-col items-center justify-center text-center p-6 bg-white/5 border border-white/10 rounded-xl">
                  <Database className="h-8 w-8 text-gray-500 mb-2" />
                  <h5 className="text-sm font-semibold text-white">No Records Found for Stage: {inspectModal.stage.toUpperCase()}</h5>
                  <p className="text-xs text-gray-400 mt-1 max-w-sm">
                    This dataset has not reached this stage yet or no records matched your filter term.
                  </p>
                </div>
              ) : inspectModal.viewMode === 'table' ? (
                <div className="border border-white/10 rounded-xl overflow-x-auto shadow-inner bg-[#070a12]">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#121827] text-gray-400 font-mono uppercase tracking-wider border-b border-white/10">
                        <th className="py-2.5 px-3 w-12">#</th>
                        {inspectTableColumns.map((col) => (
                          <th key={col} className="py-2.5 px-3 capitalize font-semibold text-gray-300">
                            {col.replace(/_/g, ' ')}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 font-sans">
                      {filteredInspectRecords.map((record, idx) => (
                        <tr key={record.id || record._id || idx} className="hover:bg-white/5 transition-colors">
                          <td className="py-2.5 px-3 font-mono text-gray-500 text-[11px]">
                            {inspectModal.skip + idx + 1}
                          </td>
                          {inspectTableColumns.map((col) => {
                            const val = record[col];
                            return (
                              <td key={col} className="py-2.5 px-3 text-gray-300 max-w-[280px] truncate">
                                {typeof val === 'object' && val !== null ? (
                                  <span className="font-mono text-[11px] text-indigo-300 bg-indigo-500/10 px-1.5 py-0.5 rounded">
                                    {JSON.stringify(val)}
                                  </span>
                                ) : (
                                  String(val ?? '--')
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute right-4 top-4 z-10">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(filteredInspectRecords, null, 2));
                        setInspectModal((prev) => ({ ...prev, copiedJson: true }));
                        setTimeout(() => setInspectModal((prev) => ({ ...prev, copiedJson: false })), 2000);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#121827] text-gray-300 hover:text-[#00FFA3] border border-white/10 hover:border-[#00FFA3]/30 transition-all"
                    >
                      {inspectModal.copiedJson ? <Check className="h-3.5 w-3.5 text-[#00FFA3]" /> : <Copy className="h-3.5 w-3.5" />}
                      {inspectModal.copiedJson ? 'Copied JSON' : 'Copy JSON'}
                    </button>
                  </div>
                  <pre className="text-xs p-5 rounded-xl overflow-x-auto bg-[#070a12] text-[#00FFA3] font-mono border border-white/10 shadow-inner max-h-[400px]">
                    {JSON.stringify(filteredInspectRecords, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer / Navigation */}
            <div className="flex items-center justify-between p-4 border-t border-white/10 bg-[#070a12]/80">
              <span className="text-xs text-gray-400 font-mono">
                Showing {filteredInspectRecords.length} records (offset {inspectModal.skip})
              </span>

              <div className="flex items-center gap-2">
                <button
                  disabled={inspectModal.skip === 0 || inspectModal.isLoading}
                  onClick={() => {
                    const newSkip = Math.max(0, inspectModal.skip - inspectModal.limit);
                    fetchInspectRecords(inspectModal.dataset.id, inspectModal.stage, newSkip, inspectModal.limit);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#121827] text-gray-300 hover:text-white border border-white/10 disabled:opacity-40"
                >
                  <ChevronLeft className="h-3.5 w-3.5" /> Previous {inspectModal.limit}
                </button>
                <button
                  disabled={inspectModal.records.length < inspectModal.limit || inspectModal.isLoading}
                  onClick={() => {
                    const newSkip = inspectModal.skip + inspectModal.limit;
                    fetchInspectRecords(inspectModal.dataset.id, inspectModal.stage, newSkip, inspectModal.limit);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium bg-[#121827] text-gray-300 hover:text-white border border-white/10 disabled:opacity-40"
                >
                  Next {inspectModal.limit} <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EDIT DATASET METADATA MODAL                                            */}
      {/* ========================================================================= */}
      {editModal.isOpen && editModal.dataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#0b0f19] border border-indigo-500/30 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-white/10 bg-[#070a12]/80">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="h-4 w-4 text-indigo-400" />
                Edit Dataset Properties
              </h3>
              <button
                onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
              {editModal.error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
                  {editModal.error}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Dataset Filename</label>
                <input
                  type="text"
                  required
                  value={editModal.filename}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, filename: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#121827] border border-white/10 text-white text-xs font-mono focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Feedback Source Type</label>
                <select
                  value={editModal.source_type}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, source_type: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-[#121827] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500"
                >
                  <option value="feedback">User Feedback (General)</option>
                  <option value="support_tickets">Support Tickets</option>
                  <option value="reviews">App Store / Play Store Reviews</option>
                  <option value="feature_requests">Feature Requests</option>
                  <option value="surveys">NPS / CSAT Survey Responses</option>
                  <option value="social_media">Social & Public Channels</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-300 mb-1">Notes / Description (Optional)</label>
                <textarea
                  rows={3}
                  value={editModal.description}
                  onChange={(e) => setEditModal((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide context or notes about this batch of feedback..."
                  className="w-full px-3 py-2 rounded-xl bg-[#121827] border border-white/10 text-white text-xs focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setEditModal((prev) => ({ ...prev, isOpen: false }))}
                  className="px-4 py-2 rounded-xl text-xs font-medium bg-[#121827] text-gray-300 hover:text-white border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editModal.isSaving}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white transition-all shadow-[0_0_15px_rgba(99,102,241,0.3)] disabled:opacity-50"
                >
                  {editModal.isSaving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. DELETE CONFIRMATION DIALOG                                             */}
      {/* ========================================================================= */}
      {deleteModal.isOpen && deleteModal.dataset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#0b0f19] border border-rose-500/30 rounded-2xl shadow-[0_0_40px_rgba(0,0,0,0.8)] overflow-hidden">
            <div className="p-6 text-center">
              <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4 shadow-[0_0_20px_rgba(244,63,94,0.2)]">
                <ShieldAlert className="h-7 w-7" />
              </div>
              <h3 className="text-lg font-bold text-white">Delete Feedback Dataset?</h3>
              <p className="text-xs text-gray-400 mt-2">
                You are about to permanently delete <span className="font-semibold text-white">"{deleteModal.dataset.filename}"</span> containing{' '}
                <span className="font-semibold text-rose-400 font-mono">{(deleteModal.dataset.record_count || 0).toLocaleString()}</span> ingested records.
              </p>
              <p className="text-[11px] text-gray-500 mt-1">
                This action cannot be undone and will remove all associated raw and cleaned records.
              </p>

              {deleteModal.error && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs text-left">
                  {deleteModal.error}
                </div>
              )}

              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  type="button"
                  disabled={deleteModal.isDeleting}
                  onClick={() => setDeleteModal({ isOpen: false, dataset: null, isDeleting: false, error: null })}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#121827] text-gray-300 hover:text-white border border-white/10"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteModal.isDeleting}
                  onClick={handleConfirmDelete}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white transition-all shadow-[0_0_20px_rgba(244,63,94,0.3)] disabled:opacity-50"
                >
                  {deleteModal.isDeleting ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}