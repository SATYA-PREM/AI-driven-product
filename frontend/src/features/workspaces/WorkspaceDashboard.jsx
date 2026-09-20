import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Users, Database, Cpu, Bot, Activity,
  UploadCloud, Settings, Plus, RefreshCw, FileSpreadsheet,
  CheckCircle2, Clock, AlertTriangle, ArrowRight, Sparkles,
  ChevronDown, UserCheck, LogOut, Layers, Play
} from 'lucide-react';
import { 
  getCurrentUser, logoutUser, setCurrentUser, setActiveWorkspaceId,
  getActiveDatasetId, subscribeToActiveDataset 
} from '../../utils/workspaceAccess';
import { workspaceApi, datasetApi, intelligenceApi } from '../../api/client';
import { formatISTRelative, formatISTDateTime } from '../../utils/dateUtils';

export default function WorkspaceDashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const rawName = currentUser?.name || '';
  const displayName = (rawName.toLowerCase() === 'string' || !rawName.trim()) 
    ? (currentUser?.email?.split('@')[0] || 'User') 
    : rawName;

  // Live State
  const [workspace, setWorkspace] = useState(null);
  const [workspaces, setWorkspaces] = useState([]);
  const [datasets, setDatasets] = useState([]);
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => getActiveDatasetId());
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showWsMenu, setShowWsMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  useEffect(() => {
    return subscribeToActiveDataset((newDsId) => {
      setSelectedDatasetId(newDsId);
    });
  }, []);

  const fetchWorkspaceHubData = async () => {
    setIsLoading(true);
    try {
      const opts = selectedDatasetId ? { dataset_id: selectedDatasetId } : null;
      const [wsRes, listRes, dsRes, memRes, actRes, sumRes] = await Promise.allSettled([
        workspaceApi.getWorkspace(workspaceId),
        workspaceApi.listWorkspaces(),
        datasetApi.list(workspaceId),
        workspaceApi.listMembers(workspaceId),
        workspaceApi.getActivity(workspaceId, 10),
        intelligenceApi.getSummary(workspaceId, opts),
      ]);

      if (wsRes.status === 'fulfilled' && wsRes.value) {
        setWorkspace(wsRes.value);
      }
      if (listRes.status === 'fulfilled' && Array.isArray(listRes.value)) {
        setWorkspaces(listRes.value);
      }
      if (dsRes.status === 'fulfilled' && Array.isArray(dsRes.value)) {
        setDatasets(dsRes.value);
      }
      if (memRes.status === 'fulfilled' && Array.isArray(memRes.value)) {
        setMembers(memRes.value);
      }
      if (actRes.status === 'fulfilled' && Array.isArray(actRes.value)) {
        setActivities(actRes.value);
      }
      if (sumRes.status === 'fulfilled' && sumRes.value) {
        setSummary(sumRes.value);
      }
    } catch (e) {
      console.error('Failed to load workspace hub data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceHubData();
  }, [workspaceId, selectedDatasetId]);

  const handleSwitchWorkspace = (newId) => {
    setActiveWorkspaceId(newId);
    setShowWsMenu(false);
    navigate(`/workspace/${newId}/dashboard`);
  };

  const totalDatasets = datasets.length;
  const totalRows = datasets.reduce((acc, d) => acc + (d.total_rows || d.row_count || 0), 0);
  const totalCleaned = datasets.filter(d => d.stage === 'cleaned' || d.stage === 'preprocessed' || d.current_state === 'CLEANING_COMPLETED' || d.current_state === 'AI_ANALYSIS' || d.current_state === 'COMPLETED').length;
  const totalAnalyzed = summary?.summary?.total_feedback_analyzed || datasets.reduce((acc, d) => acc + (d.analyzed_count || 0), 0);

  return (
    <div className="w-full font-sans text-slate-100 space-y-5 pb-12 select-none">
      
      {/* 1. Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-1">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight flex items-center gap-2">
              {workspace?.name || 'Workspace Dashboard'}
            </h1>
            <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#5b3df5]/15 text-[#a78bfa] border border-[#5b3df5]/30">
              Workspace Hub
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {workspace?.description || 'Operational hub for dataset ingestion, pipelines, team members, and data assets.'}
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* Quick Refresh */}
          <button
            type="button"
            onClick={fetchWorkspaceHubData}
            title="Refresh Workspace Data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e1322] border border-[#1b2338] hover:border-[#5b3df5]/50 transition-all text-xs cursor-pointer"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-[11px] font-mono text-slate-300">
              {isLoading ? 'Syncing...' : 'MongoDB Live'}
            </span>
            <RefreshCw size={11} className={`text-slate-400 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          {/* Switch to PM Dashboard Button */}
          <Link
            to={`/workspace/${workspaceId}/pm-dashboard`}
            className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/20 to-amber-600/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            <Sparkles size={13} className="text-amber-400" />
            <span>Open PM Dashboard</span>
          </Link>

          {/* Workspace dropdown selector */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowWsMenu(!showWsMenu)}
              className="flex flex-col text-left px-3.5 py-1.5 rounded-xl bg-[#0e1322] border border-[#1b2338] hover:border-[#5b3df5]/50 transition-all cursor-pointer min-w-[170px]"
            >
              <span className="text-[10px] text-slate-400 font-medium leading-none">Workspace</span>
              <div className="flex items-center justify-between text-xs font-semibold text-white mt-1 gap-2">
                <span className="truncate">{workspace?.name || 'Current Workspace'}</span>
                <ChevronDown size={13} className="text-slate-400 shrink-0" />
              </div>
            </button>

            {showWsMenu && (
              <div className="absolute top-full right-0 mt-2 w-56 rounded-xl bg-[#121828] border border-[#202a42] shadow-2xl p-1.5 z-40 text-xs">
                <span className="text-[10px] font-bold text-slate-500 uppercase px-2 py-1 block">
                  Select Workspace
                </span>
                {workspaces.map((ws) => (
                  <button
                    key={ws.id || ws._id}
                    type="button"
                    onClick={() => handleSwitchWorkspace(ws.id || ws._id)}
                    className={`w-full text-left px-2.5 py-2 rounded-lg transition-all flex items-center justify-between cursor-pointer ${
                      (ws.id || ws._id) === workspaceId 
                        ? 'bg-[#5b3df5] text-white font-bold' 
                        : 'text-slate-300 hover:bg-white/[0.05]'
                    }`}
                  >
                    <span className="truncate">{ws.name}</span>
                    {(ws.id || ws._id) === workspaceId && <span className="text-[10px] font-mono">Active</span>}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Operational KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        
        {/* Total Ingested Datasets */}
        <div className="p-4 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0">
            <Database className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block leading-none">Total Datasets</span>
            <p className="text-2xl font-bold text-white tracking-tight mt-1 leading-none">{totalDatasets}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Active Ingestions</span>
          </div>
        </div>

        {/* Total Raw Rows */}
        <div className="p-4 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block leading-none">Total Records</span>
            <p className="text-2xl font-bold text-white tracking-tight mt-1 leading-none">{Number(totalRows).toLocaleString()}</p>
            <span className="text-[11px] text-blue-400 mt-1 block">Customer Signals</span>
          </div>
        </div>

        {/* Cleaned & Sanitized */}
        <div className="p-4 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block leading-none">Cleaned Batches</span>
            <p className="text-2xl font-bold text-white tracking-tight mt-1 leading-none">{totalCleaned}</p>
            <span className="text-[11px] text-emerald-400 mt-1 block">Agent Processed</span>
          </div>
        </div>

        {/* Workspace Members */}
        <div className="p-4 rounded-2xl bg-[#0e1322] border border-[#1b2338] shadow-sm flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <span className="text-xs text-slate-400 font-medium block leading-none">Team Members</span>
            <p className="text-2xl font-bold text-white tracking-tight mt-1 leading-none">{members.length || 1}</p>
            <span className="text-[11px] text-amber-400 mt-1 block">Active Collaborators</span>
          </div>
        </div>

      </div>

      {/* 3. Quick Pipelines & Ingestion Action Bar */}
      <div className="p-4 rounded-2xl bg-gradient-to-r from-[#0e1322] via-[#141b2e] to-[#0e1322] border border-[#1e273f] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#5b3df5]/20 flex items-center justify-center text-[#a78bfa] shrink-0">
            <Layers size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">Automated AI Pipeline Engine</h3>
            <p className="text-xs text-slate-400">Ingest dirty feedback datasets, clean, classify, and extract product intelligence in 1-click.</p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            to={`/workspace/${workspaceId}/data/upload`}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white shadow-lg shadow-[#5b3df5]/30 transition-all flex items-center gap-1.5"
          >
            <Plus size={15} />
            <span>Upload Dataset</span>
          </Link>
          <Link
            to={`/workspace/${workspaceId}/pipeline`}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-[#161d31] hover:bg-[#1b243d] text-slate-200 border border-[#232d44] transition-all flex items-center gap-1.5"
          >
            <Activity size={15} className="text-[#8b5cf6]" />
            <span>Pipeline Matrix</span>
          </Link>
        </div>
      </div>

      {/* 4. Datasets Table & Ingestion Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Datasets in Workspace (8 cols) */}
        <div className="lg:col-span-8 rounded-2xl bg-[#0e1322] border border-[#1b2338] p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Ingested Datasets</h3>
              <p className="text-xs text-slate-400">All data assets currently managed in this workspace</p>
            </div>
            <Link to={`/workspace/${workspaceId}/data/datasets`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
              View Datasets Studio ({datasets.length})
            </Link>
          </div>

          <div className="overflow-x-auto">
            {datasets.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <Database size={32} className="text-slate-600 mb-2.5" />
                <p className="text-xs font-medium text-slate-300">No datasets uploaded yet</p>
                <p className="text-[11px] text-slate-500 mt-0.5">Upload customer feedback files (CSV, XLSX, JSON) to start intelligence processing.</p>
                <Link
                  to={`/workspace/${workspaceId}/data/upload`}
                  className="mt-4 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#5b3df5] hover:bg-[#4f2ee8] text-white transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>Upload First Dataset</span>
                </Link>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#1b2338] text-[11px] text-slate-400 font-semibold">
                    <th className="pb-3">Dataset Name</th>
                    <th className="pb-3">Records</th>
                    <th className="pb-3">Current Stage</th>
                    <th className="pb-3">Uploaded</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#171e30]">
                  {datasets.map((ds) => {
                    const dsId = ds.id || ds._id;
                    const stage = ds.current_state || ds.stage || 'RAW_UPLOADED';
                    const isDone = stage === 'COMPLETED' || stage === 'AI_ANALYSIS' || stage === 'AGENT_3_COMPLETED';

                    return (
                      <tr key={dsId} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 pr-3 text-white font-medium">
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet size={16} className="text-[#8b5cf6] shrink-0" />
                            <span className="truncate max-w-[200px]">{ds.filename || ds.name || 'Feedback Batch'}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-3 text-slate-300 font-mono text-[11px]">
                          {ds.total_rows || ds.row_count || 30} rows
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isDone 
                              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' 
                              : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                          }`}>
                            {stage}
                          </span>
                        </td>
                        <td className="py-3 pr-3 text-slate-400 font-mono text-[11px]">
                          {ds.created_at ? formatISTRelative(ds.created_at) : 'Recent'}
                        </td>
                        <td className="py-3 text-right">
                          <Link
                            to={`/workspace/${workspaceId}/ai/analysis`}
                            className="px-2.5 py-1 rounded-lg bg-[#5b3df5]/15 hover:bg-[#5b3df5]/30 text-[#c4b5fd] text-[11px] font-semibold transition-colors inline-flex items-center gap-1"
                          >
                            <Play size={11} /> Run AI
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Workspace Members & Audit Activity (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          
          {/* Members Card */}
          <div className="rounded-2xl bg-[#0e1322] border border-[#1b2338] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Workspace Members</h3>
                <p className="text-[11px] text-slate-400">Team access controls</p>
              </div>
              <Link to={`/workspace/${workspaceId}/settings`} className="text-xs text-[#8b5cf6] hover:text-[#a78bfa] font-semibold">
                Manage
              </Link>
            </div>

            <div className="space-y-2.5">
              {members.length === 0 ? (
                <div className="flex items-center gap-2.5 p-2 rounded-xl bg-[#121727] border border-[#1c253b]">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5b3df5] to-[#a855f7] flex items-center justify-center text-white font-bold text-xs">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{displayName}</p>
                    <p className="text-[10px] text-amber-400">Owner / Product Manager</p>
                  </div>
                </div>
              ) : (
                members.map((m) => (
                  <div key={m.id || m._id} className="flex items-center justify-between gap-2 p-2 rounded-xl bg-[#121727] border border-[#1c253b]">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-[#5b3df5]/25 text-[#a78bfa] flex items-center justify-center font-bold text-xs">
                        {(m.name || m.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{m.name || m.email}</p>
                        <p className="text-[10px] text-slate-400 truncate">{m.role || 'Member'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-300 font-mono">
                      {m.role || 'MEMBER'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Audit Logs */}
          <div className="rounded-2xl bg-[#0e1322] border border-[#1b2338] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-bold text-white">Recent Activity</h3>
                <p className="text-[11px] text-slate-400">Audit trail</p>
              </div>
            </div>

            <div className="space-y-3">
              {activities.length === 0 ? (
                <div className="py-4 text-center text-xs text-slate-500">
                  No activity recorded yet in this workspace.
                </div>
              ) : (
                activities.slice(0, 5).map((item) => (
                  <div key={item.id || item._id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-[#5b3df5]/20 text-[#a78bfa] flex items-center justify-center shrink-0 text-[10px]">
                        ●
                      </div>
                      <p className="text-slate-300 truncate">
                        <span className="font-semibold text-white">{item.user_name || 'User'}</span> {item.title || item.action}
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

    </div>
  );
}