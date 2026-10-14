import React, { useState, useEffect } from 'react';
import {
  Bug,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  GitPullRequest,
  ExternalLink,
  ChevronRight,
  ShieldAlert
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { developerApi } from '../../api/developer';
import SubmitDefectFixModal from './components/SubmitDefectFixModal';

export default function DeveloperDefects() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Fix modal
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [isFixModalOpen, setIsFixModalOpen] = useState(false);

  const fetchDefects = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await developerApi.getDefects(workspaceId);
      setDefects(data || []);
    } catch (err) {
      console.warn('Error fetching defects:', err);
      setError(err.message || 'Failed to load defects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, [workspaceId]);

  const filteredDefects = defects.filter((d) => {
    if (severityFilter !== 'ALL' && d.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && d.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (d.title || '').toLowerCase().includes(q);
      const matchId = (d.defect_id || '').toLowerCase().includes(q);
      const matchDesc = (d.description || '').toLowerCase().includes(q);
      return matchTitle || matchId || matchDesc;
    }
    return true;
  });

  const getSeverityBadge = (sev) => {
    const s = String(sev || '').toUpperCase();
    if (s === 'CRITICAL') return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
    if (s === 'HIGH') return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
    if (s === 'MEDIUM') return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
  };

  const getStatusBadge = (st) => {
    const s = String(st || '').toUpperCase();
    if (s === 'RESOLVED' || s === 'VERIFIED') return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
    if (s === 'IN_RETEST') return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
    if (s === 'IN_FIX') return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30';
    return 'bg-rose-500/20 text-rose-300 border-rose-500/30';
  };

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <Bug size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              QA Defects & Bug Fixes
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">
              {defects.length} Issues Logged
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Defects identified during QA verification requiring developer resolution and retest for{' '}
            <span className="text-slate-200 font-semibold">{workspace?.name || 'Customer Intelligence'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchDefects}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
            title="Refresh defects"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-rose-400' : ''} />
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search defects by title, ID, description..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter size={13} />
            <span>Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="bg-slate-900 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-slate-900 border border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-rose-500 cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_FIX">In Fix</option>
              <option value="IN_RETEST">In Retest</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>
      </div>

      {/* Defect Cards */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading defects...</span>
        </div>
      ) : filteredDefects.length === 0 ? (
        <div className="p-12 text-center bg-[#090d1c]/80 border border-white/[0.08] rounded-2xl text-slate-400 text-xs">
          No defects found matching your filter criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDefects.map((defect) => (
            <div
              key={defect.defect_id}
              className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-rose-500/30 transition-all shadow-xl space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded border border-rose-800/40">
                    {defect.defect_id}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(defect.severity)}`}>
                    {defect.severity || 'HIGH'}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getStatusBadge(defect.status)}`}>
                    {defect.status || 'OPEN'}
                  </span>
                  {defect.assignment_id && (
                    <span className="text-xs text-slate-400 font-mono">
                      Task: {defect.assignment_id}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedDefect(defect);
                      setIsFixModalOpen(true);
                    }}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Bug size={13} />
                    <span>Submit Fix Details</span>
                  </button>

                  {defect.assignment_id && (
                    <Link
                      to={`/workspace/${workspaceId}/developer/assignments/${defect.assignment_id}`}
                      className="p-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white"
                      title="Open Associated Task"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm md:text-base font-semibold text-white">
                  {defect.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {defect.description}
                </p>
              </div>

              {defect.reproduction_steps && (
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/[0.04] text-xs">
                  <div className="font-semibold text-slate-400 text-[11px] mb-1">Steps to Reproduce:</div>
                  <div className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap">
                    {defect.reproduction_steps}
                  </div>
                </div>
              )}

              {defect.fix_summary && (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-800/30 text-xs space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-emerald-400 font-semibold">
                    <span>Submitted Fix:</span>
                    <span>Status: {defect.status}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">{defect.fix_summary}</p>
                  {defect.pr_url && (
                    <div className="pt-1">
                      <a
                        href={defect.pr_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline font-mono text-[11px]"
                      >
                        Pull Request Link
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Fix Modal */}
      <SubmitDefectFixModal
        isOpen={isFixModalOpen}
        onClose={() => setIsFixModalOpen(false)}
        defect={selectedDefect}
        workspaceId={workspaceId}
        onSaved={fetchDefects}
      />
    </div>
  );
}

