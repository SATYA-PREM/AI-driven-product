import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Activity,
  CheckCircle2,
  Clock,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  Database,
  Search,
  Wand2,
  Cpu,
  Bot,
  TrendingUp,
  FileText,
  BarChart3,
  ChevronRight,
  Loader2,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Zap,
  Check,
} from 'lucide-react';
import { workflowStateApi, datasetApi, aiAnalysisApi, dataAgentApi } from '../../api/client';
import { formatISTDateTime, formatISTRelative } from '../../utils/dateUtils';

const MASTER_STAGES = [
  {
    id: 'UPLOADED',
    step: 1,
    title: 'Data Ingestion',
    subtitle: 'Upload CSV, JSON, XLSX feedback batches',
    icon: Database,
    color: 'emerald',
    link: (wsId) => `/workspace/${wsId}/data/upload`,
    linkText: 'Data Ingestion Studio',
  },
  {
    id: 'VALIDATED',
    step: 2,
    title: 'Schema Validation',
    subtitle: '0–100% Quality Score & boundary gate',
    icon: ShieldCheck,
    color: 'blue',
    link: (wsId) => `/workspace/${wsId}/data/agent`,
    linkText: 'Quality Inspector',
  },
  {
    id: 'CLEANED',
    step: 3,
    title: 'Sanitization & Deduplication',
    subtitle: 'Strip XSS, impute missing, normalize ratings',
    icon: Wand2,
    color: 'amber',
    link: (wsId) => `/workspace/${wsId}/data/agent`,
    linkText: 'Cleaning Studio',
  },
  {
    id: 'PREPROCESSED',
    step: 4,
    title: 'Canonical AI Preprocessing',
    subtitle: 'Tokenization & AI-ready signal generation',
    icon: Cpu,
    color: 'indigo',
    link: (wsId) => `/workspace/${wsId}/data/agent`,
    linkText: 'Preprocessing Studio',
  },
  {
    id: 'AI_ANALYSIS',
    step: 5,
    title: 'CrewAI 3-Agent Cluster',
    subtitle: 'Feedback Analysis → Patterns → Intelligence',
    icon: Bot,
    color: 'purple',
    link: (wsId) => `/workspace/${wsId}/ai/analysis`,
    linkText: '3-Agent Pipeline',
  },
  {
    id: 'INTELLIGENCE',
    step: 6,
    title: 'Product Intelligence',
    subtitle: 'Priority Scoring & Feature Ranking',
    icon: TrendingUp,
    color: 'pink',
    link: (wsId) => `/workspace/${wsId}/overview`,
    linkText: 'PM Dashboard',
  },
  {
    id: 'REPORT',
    step: 7,
    title: 'Executive Reports & PRDs',
    subtitle: 'Automated executive briefs & documentation',
    icon: FileText,
    color: 'teal',
    link: (wsId) => `/workspace/${wsId}/reports`,
    linkText: 'Executive Reports',
  },
];

export default function PipelineWorkflow() {
  const { workspaceId } = useParams();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(searchParams.get('datasetId') || '');
  const [selectedDataset, setSelectedDataset] = useState(null);

  const [workflowState, setWorkflowState] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadDatasets();
  }, [workspaceId]);

  useEffect(() => {
    if (workspaceId) {
      loadWorkflow(selectedDatasetId);
    }
  }, [workspaceId, selectedDatasetId]);

  // Polling for live workflow updates if running
  useEffect(() => {
    const interval = setInterval(() => {
      if (workflowState?.status === 'IN_PROGRESS' || workflowState?.status === 'RUNNING') {
        loadWorkflow(selectedDatasetId, true);
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [workspaceId, selectedDatasetId, workflowState]);

  const loadDatasets = async () => {
    try {
      const list = await datasetApi.list(workspaceId);
      if (Array.isArray(list) && list.length > 0) {
        setDatasets(list);
        if (!selectedDatasetId) {
          const firstId = list[0].id || list[0]._id;
          setSelectedDatasetId(firstId);
          setSelectedDataset(list[0]);
        } else {
          const found = list.find((d) => (d.id || d._id) === selectedDatasetId);
          setSelectedDataset(found || list[0]);
        }
      }
    } catch (err) {
      console.warn('Could not list datasets:', err.message);
    }
  };

  const loadWorkflow = async (datasetId, silent = false) => {
    if (!silent) setIsLoading(true);
    setIsRefreshing(true);
    try {
      const res = await workflowStateApi.getWorkspaceWorkflow(workspaceId, datasetId || undefined);
      setWorkflowState(res);
    } catch (err) {
      console.warn('Workflow fetch fallback:', err.message);
      // Construct intuitive state from dataset if workflow document not yet initialized
      if (selectedDataset) {
        const rawStatus = (selectedDataset.status || 'UPLOADED').toUpperCase();
        setWorkflowState({
          workspace_id: workspaceId,
          dataset_id: datasetId,
          current_state: rawStatus,
          status: rawStatus === 'COMPLETED' ? 'SUCCESS' : 'IDLE',
          transitions: [
            { from_state: 'START', to_state: 'UPLOADED', triggered_at: selectedDataset.created_at || new Date().toISOString() }
          ],
        });
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleSelectDataset = (datasetId) => {
    setSelectedDatasetId(datasetId);
    setSearchParams({ datasetId });
    const found = datasets.find((d) => (d.id || d._id) === datasetId);
    setSelectedDataset(found || null);
  };

  const currentState = (workflowState?.current_state || selectedDataset?.status || 'UPLOADED').toUpperCase();

  const getStageStatus = (stageId, index) => {
    const stageOrder = ['UPLOADED', 'VALIDATED', 'CLEANED', 'PREPROCESSED', 'AI_ANALYSIS', 'INTELLIGENCE', 'REPORT'];
    const currentIdx = stageOrder.indexOf(currentState);
    const thisIdx = stageOrder.indexOf(stageId);

    if (currentState === 'COMPLETED' || currentIdx > thisIdx) {
      return 'COMPLETED';
    }
    if (currentIdx === thisIdx) {
      return workflowState?.status === 'IN_PROGRESS' || workflowState?.status === 'RUNNING'
        ? 'RUNNING'
        : 'ACTIVE';
    }
    return 'PENDING';
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
      
      {/* 1. Header Card */}
      <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5b3df5] via-[#8b5cf6] to-[#00ffa3] flex items-center justify-center shadow-lg shadow-[#5b3df5]/30 shrink-0">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white tracking-tight">Master Pipeline Workflow Engine</h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-[#5b3df5]/20 text-[#a78bfa] border border-[#5b3df5]/30">
                Live State Tracking
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Live deterministic state machine orchestrating end-to-end execution across ingestion, cleaning, AI agents, and reports.
            </p>
          </div>
        </div>

        {/* Dataset Switcher + Refresh */}
        <div className="flex items-center gap-3">
          {datasets.length > 0 && (
            <select
              value={selectedDatasetId}
              onChange={(e) => handleSelectDataset(e.target.value)}
              className="bg-[#070a12] border border-[#1e2942] rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-[#5b3df5] transition-colors max-w-[200px] truncate"
            >
              {datasets.map((d) => (
                <option key={d.id || d._id} value={d.id || d._id}>
                  {d.filename || d.file_name || d.name || 'Dataset'} ({d.record_count || d.total_rows || 0} rows)
                </option>
              ))}
            </select>
          )}

          <button
            type="button"
            onClick={() => loadWorkflow(selectedDatasetId)}
            className="p-2 rounded-xl bg-[#070a12] hover:bg-[#121929] text-slate-300 border border-[#1e2942] transition-colors cursor-pointer"
            title="Refresh workflow state"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-[#5b3df5]' : ''} />
          </button>
        </div>
      </div>

      {/* 2. Current State Hero Card */}
      <div className="bg-gradient-to-r from-[#0c1020] via-[#10162a] to-[#0c1020] border border-[#1e2948] rounded-2xl p-6 relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
              Active Workflow Execution State
            </span>
            <div className="flex items-center gap-3">
              <span className="text-2xl font-extrabold text-white tracking-tight font-mono">{currentState}</span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                In-Sync with Backend State Machine
              </span>
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Current dataset target: <span className="text-slate-200 font-semibold">{selectedDataset?.filename || selectedDatasetId || 'Active Dataset'}</span>.
            </p>
          </div>

          {/* Quick Step Forward Button */}
          <div className="flex items-center gap-3 shrink-0">
            {currentState === 'UPLOADED' && (
              <Link
                to={`/workspace/${workspaceId}/data/agent?datasetId=${selectedDatasetId}`}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#5b3df5] hover:bg-[#6f50ff] text-white flex items-center gap-2 shadow-lg shadow-[#5b3df5]/30 transition-all"
              >
                <span>Launch Data Agent Studio</span>
                <ChevronRight size={14} />
              </Link>
            )}
            {(currentState === 'VALIDATED' || currentState === 'CLEANED' || currentState === 'PREPROCESSED') && (
              <Link
                to={`/workspace/${workspaceId}/ai/analysis?datasetId=${selectedDatasetId}`}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-[#5b3df5] to-[#7c3aed] text-white flex items-center gap-2 shadow-lg shadow-[#5b3df5]/30 transition-all"
              >
                <span>Launch CrewAI 3-Agent Pipeline</span>
                <ChevronRight size={14} />
              </Link>
            )}
            {(currentState === 'AI_ANALYSIS' || currentState === 'INTELLIGENCE' || currentState === 'COMPLETED') && (
              <Link
                to={`/workspace/${workspaceId}/overview`}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-[#00ffa3] hover:bg-[#00e693] text-black flex items-center gap-2 transition-all font-sans"
              >
                <span>View Intelligence Dashboard</span>
                <ChevronRight size={14} />
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 3. Seven-Stage Master Flow Map */}
      <div className="bg-[#0b0f19] border border-[#161f33] rounded-2xl p-6 space-y-6">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
          <Layers size={14} className="text-[#a78bfa]" /> Master Pipeline Progression Matrix
        </h3>

        <div className="space-y-4">
          {MASTER_STAGES.map((stage, idx) => {
            const Icon = stage.icon;
            const status = getStageStatus(stage.id, idx);
            const isCompleted = status === 'COMPLETED';
            const isActive = status === 'ACTIVE' || status === 'RUNNING';

            return (
              <div
                key={stage.id}
                className={`p-4 rounded-xl border transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                  isActive
                    ? 'bg-[#5b3df5]/10 border-[#5b3df5] shadow-lg shadow-[#5b3df5]/10'
                    : isCompleted
                    ? 'bg-[#070a12] border-[#182238]'
                    : 'bg-[#070a12]/50 border-[#141b2b] opacity-60'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${
                      isCompleted
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : isActive
                        ? 'bg-[#5b3df5] text-white shadow-md shadow-[#5b3df5]/30 animate-pulse'
                        : 'bg-white/[0.04] text-slate-500 border border-white/[0.06]'
                    }`}
                  >
                    {isCompleted ? <Check size={18} /> : stage.step}
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white tracking-tight">{stage.title}</h4>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            : isActive
                            ? 'bg-[#5b3df5]/20 text-[#a78bfa] border-[#5b3df5]/30'
                            : 'bg-white/[0.04] text-slate-500 border-white/[0.06]'
                        }`}
                      >
                        {status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{stage.subtitle}</p>
                  </div>
                </div>

                {/* Right link action */}
                <div className="flex items-center gap-3 shrink-0">
                  <Link
                    to={stage.link(workspaceId)}
                    className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#111726] hover:bg-[#192237] text-slate-300 hover:text-white border border-[#1e273d] transition-colors flex items-center gap-1.5"
                  >
                    <span>{stage.linkText}</span>
                    <ExternalLink size={12} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}

