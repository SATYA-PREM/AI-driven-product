import React, { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Search,
  Bell,
  HelpCircle,
  ChevronDown,
  Plus,
  MessageSquare,
  Lightbulb,
  LayoutGrid,
  TrendingUp,
  Zap,
  MoreVertical,
  Loader2,
  AlertCircle,
  FileText,
  Check,
  UserCheck,
  LogOut,
  Settings,
  Trash2,
  Play,
  Sparkles,
  Layers,
  ArrowRight,
  Database,
  Eye,
  Cpu,
} from 'lucide-react';
import { getCurrentUser, logoutUser, setCurrentUser, setActiveWorkspaceId } from '../utils/workspaceAccess';
import { datasetApi, workspaceApi, productApi, apiRequest } from '../api/client';
import { formatISTDateTime } from '../utils/dateUtils';

export default function DataIngestion() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const currentUser = getCurrentUser();
  const [workspaces, setWorkspaces] = useState([]);
  const [activeWorkspace, setActiveWorkspace] = useState({
    id: workspaceId || '',
    name: 'Workspace',
    members_count: 1,
  });

  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedSourceType, setSelectedSourceType] = useState('feedback');
  const [datasetName, setDatasetName] = useState('');

  // Dropdown states
  const [showWsMenu, setShowWsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Upload states
  const [isDragging, setIsDragging] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // 1: Upload File, 2: Map Columns, 3: Preview Data, 4: Processing
  const [uploadStatus, setUploadStatus] = useState('idle'); // 'idle' | 'uploading' | 'processing' | 'success' | 'error'
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // Post-upload pipeline action state
  const [isTriggeringPipeline, setIsTriggeringPipeline] = useState(false);
  const [pipelineMessage, setPipelineMessage] = useState('');

  // Recent Uploads list (populated from backend)
  const [recentUploads, setRecentUploads] = useState([]);
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);

  // 1. Load active workspace, workspaces, and products
  useEffect(() => {
    let mounted = true;

    async function loadWorkspaceInfo() {
      try {
        const [wsList, singleWs, prodList] = await Promise.allSettled([
          workspaceApi.listWorkspaces(),
          workspaceApi.getWorkspace(workspaceId),
          productApi.list(workspaceId),
        ]);

        if (!mounted) return;

        if (wsList.status === 'fulfilled' && Array.isArray(wsList.value)) {
          setWorkspaces(wsList.value);
        }
        if (singleWs.status === 'fulfilled' && singleWs.value) {
          setActiveWorkspace(singleWs.value);
        }
        if (prodList.status === 'fulfilled' && Array.isArray(prodList.value) && prodList.value.length > 0) {
          setProducts(prodList.value);
          setSelectedProductId(prodList.value[0].id || prodList.value[0].name);
        } else {
          setSelectedProductId(singleWs.value?.name || 'default-product');
        }
      } catch (err) {
        console.warn('Notice loading workspace info:', err.message);
      }
    }

    if (workspaceId) {
      loadWorkspaceInfo();
    }

    return () => {
      mounted = false;
    };
  }, [workspaceId]);

  // 2. Load backend datasets for this workspace
  const loadDatasets = async () => {
    if (!workspaceId) return;
    setIsLoadingDatasets(true);
    try {
      const data = await datasetApi.list(workspaceId);
      if (Array.isArray(data)) {
        const mapped = data.map((d) => ({
          id: d.id || d._id,
          datasetName: d.dataset_name || d.name || d.file_name || 'dataset.csv',
          fileName: d.file_name || d.filename || d.name || 'dataset.csv',
          type: (d.file_name || d.name || '').endsWith('.json') ? 'json' : (d.file_name || d.name || '').endsWith('.txt') ? 'txt' : 'csv',
          recordsCount: d.record_count || d.records_count || d.total_records || d.total_rows || 0,
          sourceType: d.source_type || 'feedback',
          uploadedAt: d.created_at
            ? `Uploaded on ${formatISTDateTime(d.created_at)}`
            : 'Uploaded recently',
          status: d.status === 'completed' || d.status === 'ready' || d.status === 'uploaded' || d.status === 'UPLOADED'
            ? 'Processed'
            : d.status === 'failed' || d.status === 'FAILED'
            ? 'Failed'
            : 'Processing',
        }));
        setRecentUploads(mapped);
      }
    } catch (err) {
      console.warn('Notice loading datasets:', err.message);
      setRecentUploads([]);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  useEffect(() => {
    loadDatasets();
  }, [workspaceId]);

  const handleSwitchWorkspace = (newId) => {
    setActiveWorkspaceId(newId);
    setShowWsMenu(false);
    navigate(`/workspace/${newId}/data/upload`);
  };

  const handleSwitchToPM = () => {
    setCurrentUser({
      name: 'Priya Sharma',
      email: 'pm@demo.com',
      role: 'PRODUCT_MANAGER',
      roleTitle: 'Product Manager (Owner)',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80'
    });
    window.location.reload();
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const triggerFileSelect = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const resetUploadState = () => {
    setSelectedFile(null);
    setUploadStatus('idle');
    setCurrentStep(1);
    setUploadProgress(0);
    setErrorMessage('');
    setSuccessInfo(null);
    setPipelineMessage('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDeleteDataset = async (datasetId) => {
    if (!datasetId) return;
    if (!window.confirm('Are you sure you want to delete this dataset?')) return;
    try {
      await datasetApi.deleteDataset(datasetId);
      await loadDatasets();
    } catch (err) {
      alert(err.message || 'Failed to delete dataset.');
    }
  };

  // Run full Data Agent Pipeline on dataset
  const handleRunPipeline = async (datasetId) => {
    if (!datasetId) return;
    setIsTriggeringPipeline(true);
    setPipelineMessage('Triggering Data Agent Pipeline (Inspect → Validate → Clean → Preprocess)...');
    try {
      await apiRequest(`/data-agent/datasets/${datasetId}/pipeline`, { method: 'POST' });
      setPipelineMessage('Data Agent pipeline completed successfully! Cleaned and preprocessed signals are AI-ready.');
      await loadDatasets();
    } catch (err) {
      setPipelineMessage(`Pipeline error: ${err.message}`);
    } finally {
      setIsTriggeringPipeline(false);
    }
  };

  // Trigger 3-Agent AI Analysis on dataset
  const handleTriggerAnalysis = async (datasetId) => {
    if (!datasetId) return;
    setIsTriggeringPipeline(true);
    setPipelineMessage('Starting CrewAI 3-Agent Flow (Feedback Analysis → Pattern & Trend → Product Intelligence)...');
    try {
      await apiRequest(`/datasets/${datasetId}/analysis`, {
        method: 'POST',
        body: JSON.stringify({ priority_threshold: 60 }),
      });
      setPipelineMessage('CrewAI analysis launched! Navigating to Intelligence Dashboard...');
      setTimeout(() => {
        navigate(`/workspace/${workspaceId}/intelligence/insights`);
      }, 1500);
    } catch (err) {
      setPipelineMessage(`Analysis trigger notice: ${err.message}`);
    } finally {
      setIsTriggeringPipeline(false);
    }
  };

  const processFile = async (file) => {
    if (!file) return;
    const isValid = file.name.endsWith('.csv') || file.name.endsWith('.txt') || file.name.endsWith('.json') || file.name.endsWith('.xlsx');
    if (!isValid) {
      setErrorMessage('Please upload a valid .csv, .json, .xlsx, or .txt file.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setSuccessInfo(null);
    setUploadStatus('uploading');
    setCurrentStep(1);

    // Dynamic stepped animation tracking backend ingestion stages
    let currentP = 0;
    const progressInterval = setInterval(() => {
      currentP += 15;
      if (currentP <= 85) {
        setUploadProgress(currentP);
        if (currentP >= 30 && currentP < 60) setCurrentStep(2); // Map Columns
        if (currentP >= 60 && currentP < 85) setCurrentStep(3); // Preview Data
      }
    }, 250);

    try {
      const prodId = selectedProductId || activeWorkspace.settings?.product_name || activeWorkspace.name || 'default-product';
      const response = await datasetApi.upload(workspaceId, prodId, file, selectedSourceType, datasetName);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setCurrentStep(4); // Processing / Complete
      setUploadStatus('success');
      setSuccessInfo(response);

      // Refresh real datasets list from backend
      await loadDatasets();
    } catch (err) {
      clearInterval(progressInterval);
      setUploadStatus('error');
      setErrorMessage(err.message || 'Failed to upload dataset to backend.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  return (
    <div className="min-h-full pb-12 font-sans text-slate-100">
      
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#141b2d]">
        
        {/* Left: Breadcrumbs & Page Titles */}
        <div>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1.5">
            <Link 
              to={`/workspace/${workspaceId}/overview`}
              className="hover:text-white transition-colors"
            >
              PM Dashboard
            </Link>
            <span className="text-slate-600">&gt;</span>
            <span className="text-slate-300 font-semibold">New Upload</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white">
            Customer Feedback & Data Ingestion
          </h1>
          <p className="text-xs lg:text-sm text-slate-400 mt-1">
            Ingest raw customer tickets, reviews, and survey feedback into canonical AI-ready signals.
          </p>
        </div>

        {/* Right: Workspace Selector, Icons, Profile & + New Upload Button */}
        <div className="flex items-center gap-3 self-end md:self-auto flex-wrap">
          
          {/* Workspace dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWsMenu(!showWsMenu)}
              className="bg-[#0e1322] border border-[#1b233a] hover:border-[#2a385c] px-3.5 py-2 rounded-xl flex items-center gap-2.5 transition-all cursor-pointer"
            >
              <div className="text-left">
                <span className="text-[10px] text-slate-400 font-medium block leading-none">Workspace</span>
                <span className="text-xs font-bold text-white max-w-[140px] truncate block mt-0.5">
                  {activeWorkspace.name}
                </span>
              </div>
              <ChevronDown size={14} className="text-slate-400" />
            </button>

            {showWsMenu && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-[#0d121f] border border-[#1e2942] rounded-2xl shadow-2xl p-2 z-50 text-xs animate-in fade-in">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2.5 py-1 block">
                  Select Workspace
                </span>
                <div className="space-y-1 max-h-52 overflow-y-auto">
                  {workspaces.map((ws) => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => handleSwitchWorkspace(ws.id)}
                      className={`w-full text-left px-2.5 py-2 rounded-xl transition-all flex items-center justify-between cursor-pointer ${
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
              </div>
            )}
          </div>

          {/* + Reset / New Upload Button */}
          <button
            type="button"
            onClick={resetUploadState}
            className="bg-[#5b3df5] hover:bg-[#6c4ef7] text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-[#5b3df5]/30 transition-all cursor-pointer"
          >
            <Plus size={15} />
            <span>New Upload</span>
          </button>

        </div>
      </div>

      {/* Target Product & Feedback Type Configuration Bar */}
      <div className="mt-6 p-4 rounded-2xl bg-[#0b0f19] border border-[#161f33] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-center">
        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">Target Product</label>
          <select
            value={selectedProductId}
            onChange={(e) => setSelectedProductId(e.target.value)}
            className="w-full bg-[#070a12] border border-[#1b233a] focus:border-[#5b3df5] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            {products.length > 0 ? (
              products.map((p) => (
                <option key={p.id} value={p.id}>{p.name} ({p.category || 'General'})</option>
              ))
            ) : (
              <option value={activeWorkspace.name}>{activeWorkspace.name}</option>
            )}
          </select>
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">Batch / Dataset Name (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Sept 20 App Store Feedback"
            value={datasetName}
            onChange={(e) => setDatasetName(e.target.value)}
            className="w-full bg-[#070a12] border border-[#1b233a] focus:border-[#5b3df5] rounded-xl px-3 py-2 text-xs text-white focus:outline-none placeholder:text-slate-600"
          />
        </div>

        <div className="space-y-1">
          <label className="text-[11px] font-semibold text-slate-400">Source Type</label>
          <select
            value={selectedSourceType}
            onChange={(e) => setSelectedSourceType(e.target.value)}
            className="w-full bg-[#070a12] border border-[#1b233a] focus:border-[#5b3df5] rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="feedback">Customer Feedback & Reviews</option>
            <option value="support_tickets">Support Tickets</option>
            <option value="reviews">App / Play Store Reviews</option>
            <option value="surveys">Customer Satisfaction Surveys</option>
            <option value="social_media">Social Media Mentions</option>
            <option value="feature_requests">Feature Requests</option>
          </select>
        </div>

        <div className="space-y-1 sm:text-right">
          <label className="text-[11px] font-semibold text-slate-400 block">Current Pipeline Stage</label>
          <span className="inline-block text-[11px] font-bold px-2.5 py-1 rounded-lg bg-[#5b3df5]/15 text-[#a78bfa] border border-[#5b3df5]/30">
            Phase 3: Data Ingestion
          </span>
        </div>
      </div>

      {/* 4-Step Progress Tracker */}
      <div className="py-8 flex items-center justify-center">
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap justify-center">
          
          {/* Step 1: Upload File */}
          <div className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === 1 
                ? 'bg-[#5b3df5] text-white shadow-md shadow-[#5b3df5]/40 ring-2 ring-[#5b3df5]/30' 
                : currentStep > 1
                ? 'bg-emerald-500 text-white'
                : 'bg-[#0e1424] border border-[#212c45] text-slate-400'
            }`}>
              {currentStep > 1 ? <Check size={13} /> : '1'}
            </div>
            <span className={`text-xs font-medium ${currentStep >= 1 ? 'text-white' : 'text-slate-500'}`}>
              Upload File
            </span>
          </div>

          <div className="w-8 sm:w-12 h-px bg-[#1e273d]" />

          {/* Step 2: Map Columns */}
          <div className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === 2
                ? 'bg-[#5b3df5] text-white shadow-md shadow-[#5b3df5]/40 ring-2 ring-[#5b3df5]/30'
                : currentStep > 2
                ? 'bg-emerald-500 text-white'
                : 'bg-[#0e1424] border border-[#212c45] text-slate-400'
            }`}>
              {currentStep > 2 ? <Check size={13} /> : '2'}
            </div>
            <span className={`text-xs font-medium ${currentStep >= 2 ? 'text-white' : 'text-slate-500'}`}>
              Map Columns
            </span>
          </div>

          <div className="w-8 sm:w-12 h-px bg-[#1e273d]" />

          {/* Step 3: Preview Data */}
          <div className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === 3
                ? 'bg-[#5b3df5] text-white shadow-md shadow-[#5b3df5]/40 ring-2 ring-[#5b3df5]/30'
                : currentStep > 3
                ? 'bg-emerald-500 text-white'
                : 'bg-[#0e1424] border border-[#212c45] text-slate-400'
            }`}>
              {currentStep > 3 ? <Check size={13} /> : '3'}
            </div>
            <span className={`text-xs font-medium ${currentStep >= 3 ? 'text-white' : 'text-slate-500'}`}>
              Validate & Preview
            </span>
          </div>

          <div className="w-8 sm:w-12 h-px bg-[#1e273d]" />

          {/* Step 4: AI Ready */}
          <div className="flex items-center gap-2.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              currentStep === 4
                ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/40 ring-2 ring-emerald-500/30'
                : 'bg-[#0e1424] border border-[#212c45] text-slate-400'
            }`}>
              {currentStep === 4 ? <Check size={13} /> : '4'}
            </div>
            <span className={`text-xs font-medium ${currentStep === 4 ? 'text-emerald-400 font-bold' : 'text-slate-500'}`}>
              AI-Ready Ingested
            </span>
          </div>

        </div>
      </div>

      {/* Main Grid: Left Column & Right Rail */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ================= LEFT MAIN COLUMN (8 cols) ================= */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Dropzone Container Card */}
          <div className="bg-[#0b0f19] border border-[#171f33] rounded-2xl p-6 sm:p-10 relative overflow-hidden">
            
            {/* Hidden native input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
              accept=".csv,.json,.xlsx,.txt"
            />

            {/* Dashed Border Upload Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={uploadStatus === 'idle' ? triggerFileSelect : undefined}
              className={`border-2 border-dashed rounded-2xl py-12 px-6 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${
                isDragging
                  ? 'border-[#5b3df5] bg-[#5b3df5]/10 shadow-[0_0_40px_rgba(91,61,245,0.2)]'
                  : 'border-[#1e2840] hover:border-[#5b3df5]/50 hover:bg-[#0f1424]'
              }`}
            >
              
              {uploadStatus === 'idle' && (
                <>
                  <div className="w-16 h-16 rounded-2xl bg-[#5b3df5]/15 border border-[#5b3df5]/30 flex items-center justify-center text-[#9f85ff] shadow-[0_0_35px_rgba(91,61,245,0.35)] mb-4">
                    <UploadCloud className="w-8 h-8 text-[#9f85ff]" />
                  </div>

                  <h3 className="text-lg font-bold text-white tracking-tight">
                    Drag and drop your feedback dataset here
                  </h3>
                  
                  <span className="text-xs text-slate-500 my-2">or</span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      triggerFileSelect();
                    }}
                    className="bg-[#5b3df5] hover:bg-[#6c4ef7] text-white px-6 py-2.5 rounded-xl font-semibold text-xs shadow-lg shadow-[#5b3df5]/30 transition-all cursor-pointer"
                  >
                    Browse Files
                  </button>

                  <p className="text-xs text-slate-400 mt-5">
                    Supports CSV, JSON, XLSX, and TXT files up to 50MB
                  </p>

                  <p className="text-xs text-[#8b5cf6] font-medium mt-1">
                    Accepted formats: .csv, .json, .xlsx, .txt
                  </p>
                </>
              )}

              {/* Uploading / Processing State */}
              {(uploadStatus === 'uploading' || uploadStatus === 'processing') && (
                <div className="py-4 flex flex-col items-center max-w-sm w-full">
                  <div className="w-16 h-16 rounded-2xl bg-[#5b3df5]/20 border border-[#5b3df5]/40 flex items-center justify-center text-[#a78bfa] shadow-[0_0_30px_rgba(91,61,245,0.3)] mb-4">
                    <Loader2 className="w-8 h-8 text-[#a78bfa] animate-spin" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">
                    Uploading & Ingesting Dataset...
                  </h4>
                  <p className="text-xs text-slate-400 mb-4 truncate max-w-xs">
                    {selectedFile?.name || 'dataset.csv'}
                  </p>

                  {/* Progress Bar */}
                  <div className="w-full bg-[#171f33] rounded-full h-2 overflow-hidden mb-2">
                    <div 
                      className="bg-gradient-to-r from-[#5b3df5] to-[#8b5cf6] h-full transition-all duration-300 rounded-full"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">{uploadProgress}% Completed</span>
                </div>
              )}

              {/* Upload Success State with Action Hub */}
              {uploadStatus === 'success' && (
                <div className="py-4 flex flex-col items-center max-w-md w-full space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                  </div>
                  <div className="text-center">
                    <h4 className="text-base font-bold text-white">
                      Dataset Uploaded & Ingested!
                    </h4>
                    <p className="text-xs text-slate-300 mt-1">
                      {successInfo?.record_count || successInfo?.records_count || 'All'} records successfully parsed into raw customer signals.
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 mt-0.5 block">
                      Dataset ID: {successInfo?.id || successInfo?.dataset_id}
                    </span>
                  </div>

                  {/* Quick Action Hub */}
                  <div className="w-full pt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 justify-center">
                    <Link
                      to={`/workspace/${workspaceId}/data/agent?datasetId=${successInfo?.id || successInfo?.dataset_id}`}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#182035] hover:bg-[#202b48] border border-[#263558] text-[#a78bfa] hover:text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                    >
                      <Cpu size={15} />
                      <span>1. Clean & Fix Dirty Data</span>
                    </Link>

                    <Link
                      to={`/workspace/${workspaceId}/ai/analysis?datasetId=${successInfo?.id || successInfo?.dataset_id}`}
                      className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5b3df5] to-[#7c3aed] hover:from-[#6c4ef7] hover:to-[#8c5cf8] text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-[#5b3df5]/30"
                    >
                      <Sparkles size={15} />
                      <span>2. Continue to AI Analysis</span>
                    </Link>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      resetUploadState();
                    }}
                    className="text-xs text-slate-400 hover:text-white underline pt-2"
                  >
                    Upload Another Dataset
                  </button>
                </div>
              )}

            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center gap-2 text-rose-300 text-xs">
                <AlertCircle size={15} className="shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Pipeline Status Banner */}
            {pipelineMessage && (
              <div className="mt-4 p-3 rounded-xl bg-[#5b3df5]/15 border border-[#5b3df5]/30 flex items-center gap-2 text-white text-xs">
                {isTriggeringPipeline ? <Loader2 size={15} className="animate-spin text-[#a78bfa]" /> : <Check size={15} className="text-emerald-400" />}
                <span>{pipelineMessage}</span>
              </div>
            )}

          </div>

          {/* Upload Guidelines */}
          <div className="bg-[#0b0f19] border border-[#171f33] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white mb-3.5">
              Upload Guidelines & Preprocessing Rules
            </h3>
            
            <ul className="space-y-2.5">
              <li className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Ensure your file contains customer feedback, reviews, support tickets, or requests.</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>CSV files should be UTF-8 encoded; dirty columns are automatically normalized by the Data Agent.</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Minimum 5 rows recommended for AI pattern & trend extraction.</span>
              </li>
              <li className="flex items-start gap-2.5 text-xs text-slate-300">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Columns like text, feedback, rating, date, and customer ID are automatically detected.</span>
              </li>
            </ul>
          </div>

          {/* Sample File Format Table */}
          <div className="bg-[#0b0f19] border border-[#171f33] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-white">
              Sample Feedback Format
            </h3>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Your file should include columns similar to the sample below:
            </p>

            <div className="overflow-x-auto rounded-xl border border-[#1a233a]">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#0e1424] text-slate-400 text-[11px] font-semibold tracking-wider">
                    <th className="py-2.5 px-3 border-b border-[#182137]">id</th>
                    <th className="py-2.5 px-3 border-b border-[#182137]">feedback_text</th>
                    <th className="py-2.5 px-3 border-b border-[#182137]">source</th>
                    <th className="py-2.5 px-3 border-b border-[#182137]">date</th>
                    <th className="py-2.5 px-3 border-b border-[#182137]">rating</th>
                    <th className="py-2.5 px-3 border-b border-[#182137]">category</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-[#090d17] text-slate-300 font-mono text-[11px] hover:bg-[#0f1527] transition-colors">
                    <td className="py-3 px-3 text-slate-400">1</td>
                    <td className="py-3 px-3 text-white font-sans truncate max-w-[200px]">
                      The checkout process is too slow on mobile...
                    </td>
                    <td className="py-3 px-3 text-slate-300 font-sans">In-App Feedback</td>
                    <td className="py-3 px-3 text-slate-400">2026-08-20</td>
                    <td className="py-3 px-3 text-amber-300 font-bold">2 / 5</td>
                    <td className="py-3 px-3 text-slate-300 font-sans">Checkout</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Data Security Card */}
          <div className="bg-[#0b0f19] border border-[#171f33] rounded-xl p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#5b3df5]/10 border border-[#5b3df5]/25 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-[#8b5cf6]" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Your data is secure & isolated</h4>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All uploaded datasets are scoped exclusively to workspace <span className="text-white font-semibold">{activeWorkspace.name}</span>.
              </p>
            </div>
          </div>

        </div>

        {/* ================= RIGHT RAIL COLUMN (4 cols) ================= */}
        <div className="lg:col-span-4 space-y-5">
          
          {/* Supported Sources Card */}
          <div className="bg-[#0b0f19] border border-[#171f33] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">
              Supported Data Formats
            </h3>

            <div className="space-y-3">
              {/* CSV Files */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-black text-xs flex items-center justify-center shrink-0">
                  CSV
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white">CSV & TSV Files</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Customer feedback tables, surveys, export dumps</p>
                </div>
              </div>

              {/* JSON Files */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 text-purple-400 font-black text-xs flex items-center justify-center shrink-0">
                  JSON
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white">JSON / API Payloads</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Support tickets, webhooks, and raw objects</p>
                </div>
              </div>

              {/* XLSX Files */}
              <div className="flex items-start gap-3 p-2.5 rounded-xl hover:bg-white/[0.02] transition-colors">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400 font-black text-xs flex items-center justify-center shrink-0">
                  XLSX
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-white">Excel Worksheets</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Spreadsheets from product operations and support</p>
                </div>
              </div>
            </div>
          </div>

          {/* AI Analysis Pipeline Summary */}
          <div className="bg-[#0b0f19] border border-[#171f33] rounded-2xl p-5">
            <h3 className="text-sm font-bold text-white mb-4">
              AI Intelligence Pipeline
            </h3>

            <ul className="space-y-3.5">
              <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                <div className="w-6 h-6 rounded-lg bg-[#5b3df5]/10 flex items-center justify-center shrink-0">
                  <MessageSquare className="w-3.5 h-3.5 text-[#a78bfa]" />
                </div>
                <span>10-Dimension Sentiment & Entity Extraction</span>
              </li>
              <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                <div className="w-6 h-6 rounded-lg bg-[#5b3df5]/10 flex items-center justify-center shrink-0">
                  <Lightbulb className="w-3.5 h-3.5 text-[#a78bfa]" />
                </div>
                <span>Semantic Issue Clustering</span>
              </li>
              <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                <div className="w-6 h-6 rounded-lg bg-[#5b3df5]/10 flex items-center justify-center shrink-0">
                  <LayoutGrid className="w-3.5 h-3.5 text-[#a78bfa]" />
                </div>
                <span>Feature Demand Rankings</span>
              </li>
              <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                <div className="w-6 h-6 rounded-lg bg-[#5b3df5]/10 flex items-center justify-center shrink-0">
                  <TrendingUp className="w-3.5 h-3.5 text-[#a78bfa]" />
                </div>
                <span>Period-over-Period Trend Velocity</span>
              </li>
              <li className="flex items-center gap-3 text-xs text-slate-300 font-medium">
                <div className="w-6 h-6 rounded-lg bg-[#5b3df5]/10 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-[#a78bfa]" />
                </div>
                <span>Deterministic 0–100 Priority Scoring</span>
              </li>
            </ul>
          </div>

          {/* Recent Uploads Card */}
          <div className="bg-[#0b0f19] border border-[#171f33] rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white">Recent Uploads</h3>
              <Link 
                to={`/workspace/${workspaceId}/data/datasets`}
                className="text-xs font-semibold text-[#8b5cf6] hover:text-[#a78bfa] transition-colors"
              >
                View All
              </Link>
            </div>

            {isLoadingDatasets ? (
              <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
                <Loader2 className="w-4 h-4 animate-spin text-[#5b3df5]" /> Loading datasets...
              </div>
            ) : recentUploads.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">
                No datasets uploaded yet for this workspace.
              </div>
            ) : (
              <div className="space-y-3">
                {recentUploads.slice(0, 6).map((item) => (
                  <div 
                    key={item.id}
                    className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#070a12] border border-[#161f33] hover:border-[#2a385c] transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        item.type === 'json'
                          ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400'
                          : item.type === 'txt'
                          ? 'bg-blue-500/15 border border-blue-500/30 text-blue-400'
                          : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                      }`}>
                        {item.type.toUpperCase()}
                      </div>
                      
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white transition-colors">
                          {item.fileName}
                        </p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5">
                          {item.recordsCount} Records • {item.sourceType}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                        item.status === 'Processed'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : item.status === 'Processing'
                          ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                          : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {item.status}
                      </span>
                      <Link
                        to={`/workspace/${workspaceId}/data/agent?datasetId=${item.id}`}
                        className="text-slate-400 hover:text-[#a78bfa] p-1 rounded transition-colors"
                        title="Open in Data Agent Preprocessing Studio"
                      >
                        <Cpu size={13} />
                      </Link>
                      <button 
                        type="button" 
                        onClick={() => handleDeleteDataset(item.id)}
                        className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors cursor-pointer"
                        title="Delete Dataset"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}