import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Users, Database, FileSpreadsheet,
  CheckCircle2, Clock, Sparkles, RefreshCw,
  FolderGit2, Shield, Layers, FileText
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { getCurrentUser } from '../../utils/workspaceAccess';
import { workspaceApi } from '../../api/workspaces';
import { datasetApi } from '../../api/datasets';
import { formatISTRelative } from '../../utils/dateUtils';

export default function MemberWorkspaceOverview() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const { isDark } = useTheme();

  const [workspace, setWorkspace] = useState(null);
  const [datasets, setDatasets] = useState([]);
  const [members, setMembers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaceData = async () => {
    if (!workspaceId) return;
    setIsLoading(true);
    try {
      const [wsRes, dsRes, memRes, actRes] = await Promise.allSettled([
        workspaceApi.getWorkspace(workspaceId),
        datasetApi.list(workspaceId),
        workspaceApi.listMembers(workspaceId),
        workspaceApi.getActivity(workspaceId, 8),
      ]);

      if (wsRes.status === 'fulfilled' && wsRes.value) {
        setWorkspace(wsRes.value);
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
    } catch (e) {
      console.warn('Failed to load member workspace overview data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceData();
  }, [workspaceId]);

  const totalDatasets = datasets.length;
  const totalRows = datasets.reduce((acc, d) => acc + (d.total_rows || d.row_count || 0), 0);

  const roleLabel = (currentUser?.role || 'team_member').replace(/_/g, ' ');

  return (
    <div className={`w-full font-sans space-y-6 pb-14 select-none ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      
      {/* 1. Header Banner */}
      <div className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm transition-all ${
        isDark ? 'bg-[#090d1c]/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDark ? 'bg-purple-500/15 border border-purple-500/30 text-purple-400' : 'bg-purple-50 border border-purple-200 text-purple-600'
            }`}>
              <FolderGit2 size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className={`text-xl sm:text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {workspace?.name || 'Workspace Space'}
                </h1>
                <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border uppercase ${
                  isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-50 text-purple-700 border-purple-200'
                }`}>
                  Team Space
                </span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded border capitalize ${
                  isDark ? 'bg-white/[0.04] text-slate-300 border-white/[0.08]' : 'bg-slate-100 text-slate-700 border-slate-200'
                }`}>
                  {roleLabel} View
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {workspace?.description || 'Collaborative workspace space with read-only access to team members and active datasets.'}
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchWorkspaceData}
            title="Refresh Space Data"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
              isDark 
                ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300 hover:text-white' 
                : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700 shadow-xs'
            }`}
          >
            <RefreshCw size={12} className={`text-purple-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Workspace Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Ingested Datasets */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3.5 shadow-sm ${
          isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
        }`}>
          <div className="w-11 h-11 rounded-xl bg-purple-500/15 flex items-center justify-center shrink-0 text-purple-400">
            <Database size={20} />
          </div>
          <div>
            <span className={`text-xs font-medium block leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Available Datasets
            </span>
            <p className={`text-2xl font-bold tracking-tight mt-1 leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {totalDatasets}
            </p>
            <span className="text-[11px] text-purple-400 mt-1 block">Active Ingestions</span>
          </div>
        </div>

        {/* Total Records */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3.5 shadow-sm ${
          isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
        }`}>
          <div className="w-11 h-11 rounded-xl bg-blue-500/15 flex items-center justify-center shrink-0 text-blue-400">
            <FileSpreadsheet size={20} />
          </div>
          <div>
            <span className={`text-xs font-medium block leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Total Records
            </span>
            <p className={`text-2xl font-bold tracking-tight mt-1 leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {Number(totalRows).toLocaleString()}
            </p>
            <span className="text-[11px] text-blue-400 mt-1 block">Customer Signals</span>
          </div>
        </div>

        {/* Team Members */}
        <div className={`p-4 rounded-2xl border flex items-center gap-3.5 shadow-sm ${
          isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
        }`}>
          <div className="w-11 h-11 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0 text-emerald-400">
            <Users size={20} />
          </div>
          <div>
            <span className={`text-xs font-medium block leading-none ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Team Members
            </span>
            <p className={`text-2xl font-bold tracking-tight mt-1 leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {members.length || 1}
            </p>
            <span className="text-[11px] text-emerald-400 mt-1 block">Active Collaborators</span>
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Datasets (Read-Only) & Team Members */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        
        {/* Datasets View (8 cols) - Limited to viewing metadata only */}
        <div className={`lg:col-span-8 rounded-2xl border p-5 shadow-sm ${
          isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Workspace Datasets
              </h3>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                Datasets ingested and managed in this workspace (Read-Only)
              </p>
            </div>
            <span className={`text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {datasets.length} Total
            </span>
          </div>

          <div className="overflow-x-auto">
            {datasets.length === 0 ? (
              <div className="py-12 text-center flex flex-col items-center justify-center">
                <Database size={32} className={`mb-2.5 ${isDark ? 'text-slate-600' : 'text-slate-400'}`} />
                <p className={`text-xs font-medium ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                  No datasets uploaded yet
                </p>
                <p className={`text-[11px] mt-0.5 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  Datasets will appear here once ingested by the workspace administrator.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className={`border-b text-[11px] font-semibold ${
                    isDark ? 'border-white/[0.08] text-slate-400' : 'border-slate-200 text-slate-600'
                  }`}>
                    <th className="pb-3">Dataset Name</th>
                    <th className="pb-3">Records</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Uploaded</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/[0.04]' : 'divide-slate-100'}`}>
                  {datasets.map((ds) => {
                    const dsId = ds.id || ds._id;
                    const stage = ds.current_state || ds.stage || 'RAW_UPLOADED';
                    const isDone = stage === 'COMPLETED' || stage === 'AI_ANALYSIS' || stage === 'AGENT_3_COMPLETED';

                    return (
                      <tr key={dsId} className={`transition-colors ${isDark ? 'hover:bg-white/[0.02]' : 'hover:bg-slate-50'}`}>
                        <td className={`py-3 pr-3 font-medium ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <div className="flex items-center gap-2">
                            <FileSpreadsheet size={16} className="text-purple-400 shrink-0" />
                            <span className="truncate max-w-[220px]">{ds.filename || ds.name || 'Feedback Batch'}</span>
                          </div>
                        </td>
                        <td className={`py-3 pr-3 font-mono text-[11px] ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
                          {ds.total_rows || ds.row_count || 30} rows
                        </td>
                        <td className="py-3 pr-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            isDone 
                              ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20' 
                              : 'text-amber-500 bg-amber-500/10 border-amber-500/20'
                          }`}>
                            {stage}
                          </span>
                        </td>
                        <td className={`py-3 text-right font-mono text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {ds.created_at ? formatISTRelative(ds.created_at) : 'Recent'}
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
          
          {/* Members Card - View Only */}
          <div className={`rounded-2xl border p-5 shadow-sm ${
            isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Workspace Members
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Team roster ({members.length || 1})
                </p>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDark ? 'bg-white/[0.04] text-slate-400 border-white/[0.08]' : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}>
                Read-Only
              </span>
            </div>

            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {members.length === 0 ? (
                <div className={`flex items-center gap-2.5 p-2 rounded-xl border ${
                  isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                }`}>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#5b3df5] to-[#a855f7] flex items-center justify-center text-white font-bold text-xs shrink-0">
                    {currentUser?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                      {currentUser?.name || 'Current User'}
                    </p>
                    <p className="text-[10px] text-purple-400 font-mono capitalize">
                      {roleLabel}
                    </p>
                  </div>
                </div>
              ) : (
                members.map((m) => (
                  <div
                    key={m.id || m._id}
                    className={`flex items-center justify-between gap-2 p-2 rounded-xl border ${
                      isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center font-bold text-xs shrink-0">
                        {(m.name || m.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          {m.name || m.email}
                        </p>
                        <p className={`text-[10px] truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {m.role?.replace(/_/g, ' ') || 'Member'}
                        </p>
                      </div>
                    </div>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono uppercase ${
                      isDark ? 'bg-white/[0.05] text-slate-300' : 'bg-white text-slate-700 border border-slate-200'
                    }`}>
                      {m.role || 'MEMBER'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className={`rounded-2xl border p-5 shadow-sm ${
            isDark ? 'bg-[#090d1c]/80 border-white/[0.08]' : 'bg-white border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Recent Workspace Activity
                </h3>
                <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Audit trail
                </p>
              </div>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {activities.length === 0 ? (
                <div className={`py-4 text-center text-xs ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  No recent activity recorded.
                </div>
              ) : (
                activities.slice(0, 5).map((item) => (
                  <div key={item.id || item._id} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 text-[10px]">
                        ●
                      </div>
                      <p className={`truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        <span className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{item.user_name || 'User'}</span> {item.title || item.action}
                      </p>
                    </div>
                    <span className={`text-[10px] font-mono shrink-0 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
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

