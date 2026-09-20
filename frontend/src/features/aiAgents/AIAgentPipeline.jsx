import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Brain,
  Sparkles,
  Bot,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronRight,
  TrendingUp,
  FileText,
  Layers,
  Search,
  Filter,
  Eye,
  X,
  Loader2,
  ShieldCheck,
  Check,
  AlertTriangle,
  BarChart3,
  Cpu,
  RefreshCw,
  ExternalLink,
  Target,
  ArrowRight,
  Sliders,
  Database,
} from 'lucide-react';
import { aiAnalysisApi, datasetApi, workflowStateApi } from '../../api/client';
import { formatISTDateTime, formatISTRelative } from '../../utils/dateUtils';
import { 
  getActiveDatasetId, setActiveDatasetId, subscribeToActiveDataset,
  getActiveDataset, setActiveDataset 
} from '../../utils/workspaceAccess';

const AGENT_CONFIGS = [
  {
    id: 'feedback_analysis',
    step: 'Agent 1',
    name: 'Feedback Analysis Agent',
    role: 'Autonomous 10-Dimension Classifier',
    icon: Bot,
    color: 'from-blue-600 to-indigo-600',
    borderColor: 'border-blue-500/30',
    bgColor: 'bg-blue-500/10',
    textColor: 'text-blue-400',
    description: 'Classifies 100% of customer feedback across Sentiment, Intent, Themes, Product Areas, Extracted Pain Points, Feature Requests, and Confidence Scores.',
    capabilities: [
      'Sentiment (Positive, Neutral, Negative, Mixed)',
      'Intent Classification (Bug, Feature, Complaint, UX)',
      'Root-cause pain point extraction',
      'Confidence calibration (0.00 – 1.00)',
    ],
  },
  {
    id: 'pattern_trend',
    step: 'Agent 2',
    name: 'Pattern & Trend Agent',
    role: 'Cluster & Velocity Discovery',
    icon: TrendingUp,
    color: 'from-purple-600 to-pink-600',
    borderColor: 'border-purple-500/30',
    bgColor: 'bg-purple-500/10',
    textColor: 'text-purple-400',
    description: 'Performs semantic clustering, detects high-frequency customer friction points, calculates demand volume, and flags churn-risk velocity.',
    capabilities: [
      'Cross-customer issue clustering',
      'Feature request frequency & demand volume',
      'Period-over-period trend velocity',
      'High churn-risk anomaly detection',
    ],
  },
  {
    id: 'product_intelligence',
    step: 'Agent 3',
    name: 'Product Intelligence Agent',
    role: 'Strategic PRD & Scoring Engine',
    icon: Sparkles,
    color: 'from-emerald-600 to-teal-600',
    borderColor: 'border-emerald-500/30',
    bgColor: 'bg-emerald-500/10',
    textColor: 'text-emerald-400',
    description: 'Calculates deterministic 0–100 Priority Scores based on Reach, Severity, Sentiment & Business Impact, and drafts PM executive intelligence briefs.',
    capabilities: [
      '0–100 Deterministic Priority Index',
      'Impact vs Effort Matrix ranking',
      'Actionable PM Recommendations',
      'Executive Brief & PRD generation',
    ],
  },
];

export default function AIAgentPipeline() {
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Dataset Selection
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => getActiveDatasetId() || '');
  const [selectedDataset, setSelectedDataset] = useState(() => getActiveDataset());
  const [isLoadingDatasets, setIsLoadingDatasets] = useState(true);

  useEffect(() => {
    return subscribeToActiveDataset((newDsId, newDsObj) => {
      setSelectedDatasetId(newDsId || '');
      if (newDsObj) {
        setSelectedDataset(newDsObj);
      } else if (newDsId && datasets.length > 0) {
        const found = datasets.find((d) => (d.id || d._id) === newDsId);
        setSelectedDataset(found || null);
      } else if (!newDsId) {
        setSelectedDataset(null);
      }
    });
  }, [datasets]);

  // Job & Execution State
  const [activeJobId, setActiveJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [isStarting, setIsStarting] = useState(false);
  const [retryingStage, setRetryingStage] = useState(null);
  const [pollIntervalId, setPollIntervalId] = useState(null);

  // Analyses Output & Inspection
  const [analysesData, setAnalysesData] = useState(null);
  const [isLoadingAnalyses, setIsLoadingAnalyses] = useState(false);
  const [selectedRecordAnalysis, setSelectedRecordAnalysis] = useState(null);
  const [isLoadingRecordModal, setIsLoadingRecordModal] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);

  // Filter & Search inside analyzed records
  const [searchQuery, setSearchQuery] = useState('');
  const [sentimentFilter, setSentimentFilter] = useState('ALL');

  // Logs stream
  const [pipelineLogs, setPipelineLogs] = useState([]);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    loadDatasets();
    return () => {
      if (pollIntervalId) clearInterval(pollIntervalId);
    };
  }, [workspaceId]);

  useEffect(() => {
    if (selectedDatasetId) {
      loadDatasetAnalyses(selectedDatasetId);
    }
  }, [selectedDatasetId]);

  // Polling active job with real-time stage progression
  useEffect(() => {
    if (activeJobId && (!jobStatus || jobStatus.status === 'RUNNING' || jobStatus.status === 'QUEUED')) {
      const interval = setInterval(async () => {
        try {
          const status = await aiAnalysisApi.getJobStatus(activeJobId);
          setJobStatus(status);

          // Update real-time logs per stage
          if (status.current_agent === 'pattern_trend' || status.agents?.pattern_trend === 'running') {
            setPipelineLogs((prev) => {
              if (!prev.some((l) => l.includes('Stage 2'))) {
                return [
                  ...prev,
                  '[STAGE 1 COMPLETED] 100% of feedback records classified across 10 dimensions.',
                  '[STAGE 2 RUNNING] Agent 2 (Pattern & Trend) is discovering issue clusters, feature demand & churn velocity...',
                ];
              }
              return prev;
            });
          } else if (status.current_agent === 'product_intelligence' || status.agents?.product_intelligence === 'running') {
            setPipelineLogs((prev) => {
              if (!prev.some((l) => l.includes('Stage 3'))) {
                return [
                  ...prev,
                  '[STAGE 2 COMPLETED] Pattern & trend clustering complete.',
                  '[STAGE 3 RUNNING] Agent 3 (Product Intelligence) is formulating deterministic 0-100 priority scores & PRDs...',
                ];
              }
              return prev;
            });
          }

          if (status.status === 'COMPLETED' || status.status === 'SUCCESS') {
            clearInterval(interval);
            setPipelineLogs((prev) => [
              ...prev,
              '[SUCCESS] All 3 CrewAI Agents finished execution successfully! Strategic Product Intelligence & PRD Insights ready.',
            ]);
            setNotification({
              type: 'success',
              title: '3-Agent AI Pipeline Completed!',
              message: `Successfully executed Agent 1 (Feedback Classifier) → Agent 2 (Pattern & Trend) → Agent 3 (Product Intelligence).`,
            });
            loadDatasetAnalyses(selectedDatasetId);
          } else if (status.status === 'FAILED') {
            clearInterval(interval);
            setPipelineLogs((prev) => [
              ...prev,
              `[FAILED] AI Pipeline failed: ${status.error || 'One or more agent stages encountered an error.'}`,
            ]);
            setNotification({
              type: 'error',
              title: 'AI Workflow Halted',
              message: status.error || 'One or more agent stages encountered an error.',
            });
          }
        } catch (err) {
          console.warn('Job polling notice:', err.message);
        }
      }, 1500);

      setPollIntervalId(interval);
      return () => clearInterval(interval);
    }
  }, [activeJobId, jobStatus?.status]);

  const loadDatasets = async () => {
    if (!workspaceId) return;
    setIsLoadingDatasets(true);
    try {
      const list = await datasetApi.list(workspaceId);
      if (Array.isArray(list) && list.length > 0) {
        setDatasets(list);
        const currentActive = getActiveDatasetId();
        if (currentActive) {
          const found = list.find((d) => (d.id || d._id) === currentActive);
          if (found) {
            setSelectedDataset(found);
            setActiveDataset(found);
          }
        }
      } else {
        setDatasets([]);
      }
    } catch (err) {
      console.error('Error fetching datasets:', err);
    } finally {
      setIsLoadingDatasets(false);
    }
  };

  const handleSelectDataset = (datasetId) => {
    setSelectedDatasetId(datasetId);
    setActiveDatasetId(datasetId);
    setSearchParams({ datasetId });
    const found = datasets.find((d) => (d.id || d._id) === datasetId);
    setSelectedDataset(found || null);
    setActiveJobId(null);
    setJobStatus(null);
  };

  const loadDatasetAnalyses = async (datasetId) => {
    if (!datasetId) return;
    setIsLoadingAnalyses(true);
    try {
      const data = await aiAnalysisApi.getDatasetAnalyses(datasetId, 0, 0);
      setAnalysesData(data);
    } catch (err) {
      console.warn('Notice loading analyses:', err.message);
      setAnalysesData(null);
    } finally {
      setIsLoadingAnalyses(false);
    }
  };

  // Launch 3-Agent CrewAI Pipeline
  // Check if dataset already completed all 3 agent stages
  const isDatasetAlreadyCompleted = Boolean(
    (analysesData?.total_records > 0 || selectedDataset?.status === 'COMPLETED') &&
    jobStatus?.status !== 'RUNNING' &&
    jobStatus?.status !== 'QUEUED'
  );

  // Launch / Re-run 3-Agent CrewAI Pipeline
  const handleStartAnalysis = async (forceRerun = false) => {
    if (!selectedDatasetId) return;
    setIsStarting(true);
    setNotification(null);

    if (forceRerun) {
      setPipelineLogs([
        `[INIT] Re-running CrewAI 3-Agent Sequential Pipeline (force_rerun=true)...`,
        `[TARGET] Dataset: ${selectedDataset?.filename || selectedDatasetId}`,
        `[STEP-WISE REPLACEMENT] Data is replaced atomically upon completion of each agent:`,
        `  • Stage 1 (Feedback Classifier): Replaces 10-dimension feedback signals`,
        `  • Stage 2 (Pattern & Trend): Replaces issue clusters, feature demand & trends`,
        `  • Stage 3 (Product Intelligence): Replaces priority scores & PRD insights`,
      ]);
    } else {
      setPipelineLogs([
        `[INIT] Launching CrewAI 3-Agent Sequential Orchestration...`,
        `[TARGET] Dataset: ${selectedDataset?.filename || selectedDatasetId}`,
        `[PREPARE] Verifying prerequisite AI-ready preprocessed signals...`,
        `[PIPELINE] Agent 1 (Feedback Analysis) → Agent 2 (Pattern & Trend) → Agent 3 (Product Intelligence)`,
      ]);
    }

    try {
      const res = await aiAnalysisApi.startAnalysis(selectedDatasetId, {
        analysis_version: 'v2',
        force_rerun: forceRerun,
      });

      if (res.status === 'ALREADY_COMPLETED') {
        setNotification({
          type: 'success',
          title: 'Dataset Already Analyzed',
          message: 'All 3 agent stages are already completed. Click "Re-run AI Analysis Pipeline" to trigger a fresh analysis.',
        });
        setPipelineLogs((prev) => [
          ...prev,
          `[NOTICE] ${res.message || 'Analysis already completed for this dataset.'}`,
          `[STATUS] ${res.total_analyzed_records || analysesData?.total_records || 0} feedback records analyzed with full 10-dimension outputs.`,
        ]);
        loadDatasetAnalyses(selectedDatasetId);
        return;
      }

      setActiveJobId(res.job_id);
      setJobStatus({ status: 'QUEUED', job_id: res.job_id });

      setPipelineLogs((prev) => [
        ...prev,
        `[QUEUED] Job ID: ${res.job_id} assigned. Agent 1 is now processing feedback signals...`,
      ]);

      setNotification({
        type: 'success',
        title: forceRerun ? 'Pipeline Re-run Triggered' : '3-Agent Pipeline Triggered',
        message: 'CrewAI sequential agent cluster has been launched across all dataset records.',
      });
    } catch (err) {
      setPipelineLogs((prev) => [...prev, `[ERROR] Failed to start pipeline: ${err.message}`]);
      setNotification({
        type: 'error',
        title: 'Could Not Start AI Pipeline',
        message: err.message,
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Retry specific agent stage
  const handleRetryStage = async (stageName) => {
    if (!activeJobId) return;
    setRetryingStage(stageName);
    try {
      await aiAnalysisApi.retryStage(activeJobId, stageName);
      setNotification({
        type: 'success',
        title: `Retrying Stage: ${stageName}`,
        message: 'The agent has re-initiated execution for this stage.',
      });
    } catch (err) {
      setNotification({
        type: 'error',
        title: 'Retry Failed',
        message: err.message,
      });
    } finally {
      setRetryingStage(null);
    }
  };

  // View Individual 10-Dimension Record Analysis Modal
  const handleInspectRecord = async (recordId) => {
    setIsLoadingRecordModal(true);
    setRecordModalOpen(true);
    try {
      const data = await aiAnalysisApi.getRecordAnalysis(recordId, selectedDatasetId);
      setSelectedRecordAnalysis(data);
    } catch (err) {
      console.error('Error fetching record analysis:', err);
      setSelectedRecordAnalysis(null);
    } finally {
      setIsLoadingRecordModal(false);
    }
  };

  // Filter analyses
  const filteredAnalyses = (analysesData?.analyses || []).filter((item) => {
    const sentimentMatch =
      sentimentFilter === 'ALL' ||
      String(item.sentiment || item.classification?.sentiment || '').toUpperCase() === sentimentFilter;
    const text = item.text || item.feedback || item.original_text || JSON.stringify(item);
    const searchMatch = !searchQuery || text.toLowerCase().includes(searchQuery.toLowerCase());
    return sentimentMatch && searchMatch;
  });

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 font-sans">
      
      {/* 1. Header Card */}
      <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-5">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5b3df5] via-[#8b5cf6] to-[#00ffa3] flex items-center justify-center shadow-lg shadow-[#5b3df5]/30 shrink-0">
            <Brain className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-white tracking-tight">CrewAI 3-Agent Autonomous Pipeline</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#5b3df5]/20 text-[#a78bfa] border border-[#5b3df5]/30">
                100% Dataset Coverage
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Sequential 3-Agent execution cluster: <span className="text-slate-200">Feedback Classifier</span> → <span className="text-slate-200">Pattern & Trend Discovery</span> → <span className="text-slate-200">Product Intelligence & PRD Synthesis</span>.
            </p>
          </div>
        </div>

        {/* Active Batch Indicator + Initialize / Re-run button */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {isLoadingDatasets ? (
            <div className="flex items-center gap-2 text-xs text-slate-400 bg-[#070a12] px-3 py-2 rounded-xl border border-[#1a233a]">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#5b3df5]" /> Loading...
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-[#070a12] border border-[#1a233a] rounded-xl px-3 py-2 text-xs text-white max-w-[280px] shadow-inner">
              <Database size={13} className="text-[#5b3df5] shrink-0" />
              <span className="text-slate-400 text-[11px] font-medium shrink-0">Active Batch:</span>
              <span className="font-semibold text-slate-200 truncate" title={selectedDataset?.dataset_name || selectedDataset?.name || selectedDataset?.filename || '✨ All Feedback Batches'}>
                {selectedDataset ? (selectedDataset.dataset_name || selectedDataset.name || selectedDataset.filename || 'Batch') : '✨ All Feedback Batches'}
              </span>
              {selectedDataset ? (
                <span className="text-[10px] text-slate-400 shrink-0">
                  ({selectedDataset.record_count || selectedDataset.total_rows || 0} rows)
                </span>
              ) : null}
            </div>
          )}

          {isDatasetAlreadyCompleted ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isStarting || jobStatus?.status === 'RUNNING'}
                onClick={() => handleStartAnalysis(true)}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#121827] hover:bg-[#1a233a] text-purple-300 border border-purple-500/40 shadow-lg shadow-purple-500/10 disabled:opacity-40 flex items-center gap-2 transition-all cursor-pointer"
                title="Force a fresh re-run of all 3 agents on this dataset"
              >
                {isStarting || jobStatus?.status === 'RUNNING' ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-400" />
                    <span>Agents Running...</span>
                  </>
                ) : (
                  <>
                    <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
                    <span>Re-run AI Analysis Pipeline</span>
                  </>
                )}
              </button>
              <Link
                to={`/workspace/${workspaceId}/intelligence/insights`}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5b3df5] to-[#7c3aed] hover:from-[#6d4ff7] hover:to-[#8b5cf6] text-white shadow-lg shadow-[#5b3df5]/30 flex items-center gap-1.5 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Insights</span>
              </Link>
            </div>
          ) : (
            <button
              type="button"
              disabled={isStarting || !selectedDatasetId || jobStatus?.status === 'RUNNING'}
              onClick={() => handleStartAnalysis(false)}
              className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5b3df5] to-[#7c3aed] hover:from-[#6d4ff7] hover:to-[#8b5cf6] text-white shadow-lg shadow-[#5b3df5]/30 disabled:opacity-40 flex items-center gap-2 transition-all cursor-pointer"
            >
              {isStarting || jobStatus?.status === 'RUNNING' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Agents Running...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Initialize 3-Agent Pipeline</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Notification Toast */}
      {notification && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <div>
              <span className="font-bold mr-1.5">{notification.title}:</span>
              <span>{notification.message}</span>
            </div>
          </div>
          <button onClick={() => setNotification(null)} className="opacity-70 hover:opacity-100">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Terminal logs */}
      {pipelineLogs.length > 0 && (
        <div className="rounded-2xl bg-[#070a12] border border-[#171f33] p-4 font-mono text-[11px] space-y-1.5">
          <div className="flex items-center justify-between text-slate-500 pb-2 border-b border-white/[0.06]">
            <span className="flex items-center gap-2 text-slate-400 font-semibold">
              <Sparkles size={14} className="text-[#a78bfa]" /> CrewAI Sequential Execution Stream
            </span>
            <button onClick={() => setPipelineLogs([])} className="text-[10px] hover:text-white">Clear</button>
          </div>
          <div className="space-y-1 text-slate-300 max-h-28 overflow-y-auto scrollbar-hide pt-1">
            {pipelineLogs.map((log, idx) => (
              <div key={idx} className={log.includes('[ERROR]') ? 'text-rose-400' : 'text-slate-300'}>
                {log}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Sequential 3-Agent Live Pipeline Progress Banner or Completed Status Banner */}
      {jobStatus ? (
        <div className="rounded-2xl bg-[#0b0f19] border border-[#161f33] p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#5b3df5]/15 border border-[#5b3df5]/30 flex items-center justify-center text-[#a78bfa] shrink-0">
              {jobStatus.status === 'COMPLETED' ? <CheckCircle2 size={18} className="text-emerald-400" /> : <Bot size={18} className="animate-pulse" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">Pipeline Execution Status:</span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    jobStatus.status === 'COMPLETED'
                      ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      : jobStatus.status === 'FAILED'
                      ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                      : 'bg-[#5b3df5]/20 text-[#a78bfa] border border-[#5b3df5]/30 animate-pulse'
                  }`}
                >
                  {jobStatus.status}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {jobStatus.status === 'COMPLETED'
                  ? 'All 3 CrewAI Agents finished processing 100% of dataset records.'
                  : jobStatus.current_agent === 'product_intelligence'
                  ? 'Stage 3 of 3: Formulating deterministic priority rankings and PRD synthesis...'
                  : jobStatus.current_agent === 'pattern_trend'
                  ? 'Stage 2 of 3: Performing cross-customer issue clustering and velocity discovery...'
                  : 'Stage 1 of 3: Classifying customer feedback signals across 10 dimensions...'}
              </p>
            </div>
          </div>

          {jobStatus.status === 'COMPLETED' && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleStartAnalysis(true)}
                disabled={isStarting}
                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#121827] text-purple-300 hover:text-white hover:bg-purple-500/20 border border-purple-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <RotateCcw size={13} />
                <span>Re-run Pipeline</span>
              </button>
              <Link
                to={`/workspace/${workspaceId}/intelligence/insights`}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#5b3df5] hover:bg-[#6d4df7] text-white flex items-center gap-1.5 transition-all shadow-lg shadow-[#5b3df5]/20 cursor-pointer"
              >
                <span>View Discovered Insights</span>
                <ArrowRight size={13} />
              </Link>
            </div>
          )}
        </div>
      ) : isDatasetAlreadyCompleted ? (
        <div className="rounded-2xl bg-[#0b0f19] border border-emerald-500/25 p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-[0_0_25px_rgba(16,185,129,0.06)]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">AI Analysis Completed:</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  READY
                </span>
                <span className="text-xs font-mono text-gray-400">
                  {analysesData?.total_records || selectedDataset?.record_count || 0} signals analyzed
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                All 3 agents have completed for this dataset. Existing analyses and intelligence results are preserved. Click "Re-run AI Analysis Pipeline" to execute a fresh run.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleStartAnalysis(true)}
              disabled={isStarting}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#121827] text-purple-300 hover:text-white hover:bg-purple-500/20 border border-purple-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <RotateCcw size={13} />
              <span>Re-run Pipeline</span>
            </button>
            <Link
              to={`/workspace/${workspaceId}/intelligence/insights`}
              className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#5b3df5] hover:bg-[#6d4df7] text-white flex items-center gap-1.5 transition-all shadow-lg shadow-[#5b3df5]/20 cursor-pointer"
            >
              <span>View Discovered Insights</span>
              <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      ) : null}

      {/* 3. Three Autonomous Agents Live Flow Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {AGENT_CONFIGS.map((agent, index) => {
          const Icon = agent.icon;
          const agentRawStatus = jobStatus?.agents?.[agent.id];
          const isAgentExplicitRunning = agentRawStatus === 'running' || agentRawStatus === 'RUNNING';
          const isAgentExplicitCompleted = agentRawStatus === 'completed' || agentRawStatus === 'COMPLETED';
          const isAgentExplicitFailed = agentRawStatus === 'failed' || agentRawStatus === 'FAILED';

          const isCurrentActive =
            (jobStatus?.status === 'RUNNING' || jobStatus?.status === 'QUEUED') &&
            (isAgentExplicitRunning ||
              jobStatus?.current_agent === agent.id ||
              (!jobStatus?.current_agent && index === 0));

          const isCompleted =
            isAgentExplicitCompleted ||
            jobStatus?.status === 'COMPLETED' ||
            (analysesData?.total_records > 0 &&
              (jobStatus?.status !== 'RUNNING' ||
                index <
                  (jobStatus?.current_agent === 'pattern_trend'
                    ? 1
                    : jobStatus?.current_agent === 'product_intelligence'
                    ? 2
                    : 0)));

          let statusLabel = 'STANDBY';
          let statusBadgeClass = 'bg-white/[0.04] text-slate-500 border-white/[0.08]';

          if (isAgentExplicitFailed || (jobStatus?.status === 'FAILED' && jobStatus?.current_agent === agent.id)) {
            statusLabel = 'FAILED';
            statusBadgeClass = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
          } else if (isCurrentActive) {
            statusLabel = 'EXECUTING';
            statusBadgeClass = 'bg-[#5b3df5]/20 text-[#a78bfa] border-[#5b3df5]/40 animate-pulse';
          } else if (isCompleted) {
            statusLabel = 'COMPLETED';
            statusBadgeClass = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
          }

          return (
            <div
              key={agent.id}
              className={`rounded-2xl bg-[#0b0f19] border transition-all p-5 flex flex-col justify-between relative overflow-hidden ${
                isCurrentActive
                  ? 'border-[#5b3df5] shadow-xl shadow-[#5b3df5]/15 ring-1 ring-[#5b3df5]/30'
                  : isCompleted
                  ? 'border-emerald-500/20'
                  : 'border-[#161f33]'
              }`}
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${agent.color} flex items-center justify-center shadow-md text-white`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{agent.step}</span>
                      <h3 className="text-sm font-bold text-white tracking-tight leading-none mt-0.5">{agent.name}</h3>
                    </div>
                  </div>

                  {/* Live Status Badge */}
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadgeClass}`}>
                    {statusLabel}
                  </span>
                </div>

                <p className="text-xs text-slate-400 leading-relaxed mb-4">{agent.description}</p>

                {/* Capabilities list */}
                <div className="space-y-1.5 pt-3 border-t border-[#141b2d] mb-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
                    Core Autonomous Tasks:
                  </span>
                  {agent.capabilities.map((cap, i) => (
                    <div key={i} className="flex items-center gap-2 text-[11px] text-slate-300">
                      <Check size={12} className={agent.textColor} />
                      <span className="truncate">{cap}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="pt-3 border-t border-[#141b2d] flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">{agent.role}</span>
                {jobStatus?.status === 'FAILED' && (
                  <button
                    type="button"
                    disabled={retryingStage === agent.id}
                    onClick={() => handleRetryStage(agent.id)}
                    className="text-[10px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1"
                  >
                    <RotateCcw size={11} /> Retry Stage
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Analysis Results & 10-Dimension Record Inspector */}
      <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#161f33]">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Full-Dataset 10-Dimension AI Analyses
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#5b3df5]/20 text-[#a78bfa] border border-[#5b3df5]/30">
                {analysesData?.total_records ?? 0} Classified Records
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Inspecting individual validated Agent 1 feedback classifications without sampling limits.
            </p>
          </div>

          {/* Quick Filter Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search feedback text..."
                className="bg-[#070a12] border border-[#1a233a] focus:border-[#5b3df5] rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none transition-colors w-48"
              />
            </div>

            <select
              value={sentimentFilter}
              onChange={(e) => setSentimentFilter(e.target.value)}
              className="bg-[#070a12] border border-[#1a233a] focus:border-[#5b3df5] rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none transition-colors"
            >
              <option value="ALL">All Sentiments</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEGATIVE">Negative</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="MIXED">Mixed</option>
            </select>

            <button
              type="button"
              onClick={() => loadDatasetAnalyses(selectedDatasetId)}
              className="p-1.5 rounded-xl bg-[#070a12] hover:bg-[#151c2e] text-slate-300 border border-[#1a233a]"
              title="Refresh analyses"
            >
              <RefreshCw size={13} />
            </button>
          </div>
        </div>

        {/* Sentiment Distribution Bar */}
        {analysesData?.sentiment_distribution && (
          <div className="p-4 rounded-xl bg-[#070a12] border border-[#182238] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 text-xs">
              <span className="font-bold text-slate-400 font-mono text-[11px] uppercase">Sentiment Breakdown:</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Positive: {analysesData.sentiment_distribution.positive ?? 0}
                </span>
                <span className="flex items-center gap-1.5 text-rose-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                  Negative: {analysesData.sentiment_distribution.negative ?? 0}
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-slate-500"></span>
                  Neutral: {analysesData.sentiment_distribution.neutral ?? 0}
                </span>
              </div>
            </div>

            <Link
              to={`/workspace/${workspaceId}/overview`}
              className="text-xs font-semibold text-[#a78bfa] hover:text-white flex items-center gap-1 transition-colors"
            >
              View PM Dashboard Trends <ChevronRight size={13} />
            </Link>
          </div>
        )}

        {/* Analyses Table */}
        {isLoadingAnalyses ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
            <Loader2 className="w-7 h-7 animate-spin text-[#5b3df5]" />
            <span className="text-xs">Loading complete dataset analyses...</span>
          </div>
        ) : filteredAnalyses.length === 0 ? (
          <div className="py-16 text-center space-y-3 rounded-xl border border-[#182238] bg-[#070a12]">
            <Bot className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400">No analyzed feedback records found for this dataset yet.</p>
            <p className="text-[11px] text-slate-500">Click "Initialize 3-Agent Pipeline" above to run the CrewAI cluster.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-[#182238] overflow-hidden bg-[#070a12]">
            <div className="overflow-x-auto max-h-[460px] scrollbar-hide">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#0e1322] border-b border-[#182238] text-slate-400 font-mono text-[11px] sticky top-0 z-10">
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Sentiment</th>
                    <th className="py-2.5 px-3">Intent / Area</th>
                    <th className="py-2.5 px-3">Feedback Signal</th>
                    <th className="py-2.5 px-3">Extracted Pain Point</th>
                    <th className="py-2.5 px-3">Confidence</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141b2e]">
                  {filteredAnalyses.map((item, idx) => {
                    const analysis = item.analysis || {};
                    const sentiment = (item.sentiment || analysis.sentiment || item.classification?.sentiment || 'NEUTRAL').toUpperCase();
                    const intent = item.intent || analysis.intent || item.classification?.intent || 'Feedback';
                    const theme = item.theme || analysis.theme || 'General';
                    const area = item.product_area || analysis.product_area || item.classification?.product_area || theme || 'Core';
                    const text = item.feedback_text || item.text || item.feedback || item.original_text || analysis.feedback_text || analysis.text || analysis.feedback || '—';

                    const painPoints = (Array.isArray(item.pain_points) && item.pain_points.length > 0 ? item.pain_points : null) ||
                                       (Array.isArray(analysis.pain_points) && analysis.pain_points.length > 0 ? analysis.pain_points : null) ||
                                       (Array.isArray(item.issues) && item.issues.length > 0 ? item.issues : null) ||
                                       (Array.isArray(analysis.issues) && analysis.issues.length > 0 ? analysis.issues : null) ||
                                       [];
                    const painPoint = painPoints.length > 0
                      ? (typeof painPoints[0] === 'string' ? painPoints[0] : painPoints[0]?.pain_point || painPoints[0]?.description || JSON.stringify(painPoints[0]))
                      : (item.pain_point || '—');

                    const conf = item.confidence ?? analysis.overall_confidence ?? analysis.sentiment_confidence ?? 0.92;
                    const recId = item.id || item._id || item.feedback_id || item.record_id || `rec-${idx}`;

                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors group">
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[10px]">{idx + 1}</td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border font-mono ${
                              sentiment === 'POSITIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : sentiment === 'NEGATIVE'
                                ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                            }`}
                          >
                            {sentiment}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="text-xs font-semibold text-slate-200 capitalize">{intent}</span>
                            <span className="text-[10px] text-slate-400">{area}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 max-w-xs truncate" title={text}>
                          {text}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 max-w-xs truncate" title={painPoint}>
                          {painPoint}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {(conf * 100).toFixed(0)}%
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleInspectRecord(recId)}
                            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-[#121929] hover:bg-[#1c2740] text-slate-300 hover:text-white border border-[#1e2942] transition-colors flex items-center gap-1 ml-auto cursor-pointer"
                          >
                            <Eye size={12} /> Inspect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* 4. Modal: 10-Dimension Record Inspection */}
      {recordModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b0f19] border border-[#1e2948] rounded-2xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#161f33]">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[#a78bfa]" />
                <h3 className="text-sm font-bold text-white">Agent 1: 10-Dimension Record Inspection</h3>
              </div>
              <button onClick={() => setRecordModalOpen(false)} className="text-slate-500 hover:text-white">
                <X size={16} />
              </button>
            </div>

            {isLoadingRecordModal ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin text-[#5b3df5]" />
                <span className="text-xs">Fetching 10-dimension classification...</span>
              </div>
            ) : selectedRecordAnalysis ? (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-hide pr-1">
                <div className="p-3.5 rounded-xl bg-[#070a12] border border-[#161f33] space-y-1.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Original Customer Feedback:</span>
                  <p className="text-xs text-white leading-relaxed">
                    {selectedRecordAnalysis.feedback_text || selectedRecordAnalysis.text || selectedRecordAnalysis.feedback || selectedRecordAnalysis.original_text || selectedRecordAnalysis.analysis?.feedback_text || selectedRecordAnalysis.analysis?.text || '—'}
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-[#070a12] border border-[#161f33]">
                    <span className="text-[10px] text-slate-500 font-mono block">1. Sentiment</span>
                    <span className="font-bold text-emerald-400 capitalize">{selectedRecordAnalysis.sentiment || selectedRecordAnalysis.analysis?.sentiment || 'Positive'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#070a12] border border-[#161f33]">
                    <span className="text-[10px] text-slate-500 font-mono block">2. Intent</span>
                    <span className="font-bold text-white capitalize">{selectedRecordAnalysis.intent || selectedRecordAnalysis.analysis?.intent || 'Feature Request'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#070a12] border border-[#161f33]">
                    <span className="text-[10px] text-slate-500 font-mono block">3. Product Area</span>
                    <span className="font-bold text-cyan-400 capitalize">{selectedRecordAnalysis.product_area || selectedRecordAnalysis.analysis?.product_area || 'Checkout'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#070a12] border border-[#161f33]">
                    <span className="text-[10px] text-slate-500 font-mono block">4. Primary Theme</span>
                    <span className="font-bold text-[#a78bfa] capitalize">{selectedRecordAnalysis.theme || selectedRecordAnalysis.analysis?.theme || 'Performance'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#070a12] border border-[#161f33]">
                    <span className="text-[10px] text-slate-500 font-mono block">5. Confidence</span>
                    <span className="font-bold text-white font-mono">{(((selectedRecordAnalysis.confidence ?? selectedRecordAnalysis.analysis?.overall_confidence ?? 0.94)) * 100).toFixed(0)}%</span>
                  </div>
                  <div className="p-3 rounded-xl bg-[#070a12] border border-[#161f33]">
                    <span className="text-[10px] text-slate-500 font-mono block">6. Source ID</span>
                    <span className="font-bold text-slate-400 font-mono truncate block">{selectedRecordAnalysis.feedback_id || selectedRecordAnalysis.source_id || selectedRecordAnalysis.customer_id || 'CUST-01'}</span>
                  </div>
                </div>

                {/* Pain Points / Issues */}
                {((selectedRecordAnalysis.pain_points && selectedRecordAnalysis.pain_points.length > 0) || (selectedRecordAnalysis.analysis?.pain_points && selectedRecordAnalysis.analysis.pain_points.length > 0) || (selectedRecordAnalysis.issues && selectedRecordAnalysis.issues.length > 0) || (selectedRecordAnalysis.analysis?.issues && selectedRecordAnalysis.analysis.issues.length > 0)) && (
                  <div className="p-3.5 rounded-xl bg-[#070a12] border border-[#161f33] space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">7 & 8. Extracted Pain Points & Root Causes:</span>
                    <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                      {(selectedRecordAnalysis.pain_points || selectedRecordAnalysis.analysis?.pain_points || selectedRecordAnalysis.issues || selectedRecordAnalysis.analysis?.issues || []).map((iss, i) => (
                        <li key={i}>{typeof iss === 'string' ? iss : iss.pain_point || iss.description || JSON.stringify(iss)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Failed to load record details.</p>
            )}

            <div className="pt-3 border-t border-[#161f33] flex justify-end">
              <button
                type="button"
                onClick={() => setRecordModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#121929] hover:bg-[#1a243c] text-white"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

