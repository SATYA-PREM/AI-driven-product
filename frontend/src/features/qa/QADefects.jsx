import React, { useState, useEffect } from 'react';
import {
  Bug,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  GitPullRequest,
  User,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';
import CreateDefectModal from './components/CreateDefectModal';
import VerifyDefectModal from './components/VerifyDefectModal';

export default function QADefects() {
  const { workspaceId } = useParams();
  const [defects, setDefects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [severityFilter, setSeverityFilter] = useState('ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);

  const fetchDefects = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await qaApi.getDefects(workspaceId);
      setDefects(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load defects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDefects();
  }, [workspaceId]);

  const handleVerify = (defect) => {
    setSelectedDefect(defect);
    setIsVerifyModalOpen(true);
  };

  const getSeverityBadge = (sev) => {
    const s = String(sev || '').toUpperCase();
    if (s === 'CRITICAL') return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    if (s === 'HIGH') return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    if (s === 'MEDIUM') return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  };

  const getStatusBadge = (st) => {
    const s = String(st || '').toUpperCase();
    if (s === 'VERIFIED' || s === 'CLOSED') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (s === 'FIX_SUBMITTED' || s === 'RETEST_PENDING') {
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    }
    if (s === 'REOPENED') {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
    return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
  };

  const filtered = defects.filter((d) => {
    const matchesSearch =
      (d.defect_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.requirement_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (d.assigned_developer || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || d.status === statusFilter;
    const matchesSeverity = severityFilter === 'ALL' || d.severity === severityFilter;

    return matchesSearch && matchesStatus && matchesSeverity;
  });

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
              Defects & Bugs Management
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">
              {defects.length} Total
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Track defect triage, assign fixes to developers, and manage the retest verification workflow
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/workspace/${workspaceId}/qa/retesting-queue`}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.08] text-xs font-semibold text-cyan-300 hover:text-white transition-colors"
          >
            Retesting Queue
          </Link>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-bold text-white shadow-lg shadow-rose-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>Report Defect</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by defect ID, title, developer, or requirement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="FIX_SUBMITTED">Fix Submitted</option>
            <option value="RETEST_PENDING">Retest Pending</option>
            <option value="VERIFIED">Verified</option>
            <option value="REOPENED">Reopened</option>
            <option value="CLOSED">Closed</option>
          </select>

          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-rose-500"
          >
            <option value="ALL">All Severities</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>
        </div>
      </div>

      {/* Defect Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading defects...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] text-center text-slate-400 text-xs space-y-2">
          <p>No defects matching filter criteria.</p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((d) => (
            <div
              key={d.defect_id}
              className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-rose-500/30 transition-all space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    {d.defect_id}
                  </span>
                  <h3 className="text-sm font-bold text-white">{d.title}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(d.severity)}`}>
                    {d.severity}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {d.priority}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${getStatusBadge(d.status)}`}>
                    {d.status}
                  </span>
                  {d.status === 'FIX_SUBMITTED' || d.status === 'RETEST_PENDING' ? (
                    <button
                      onClick={() => handleVerify(d)}
                      className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <ShieldCheck size={13} />
                      <span>Verify Fix</span>
                    </button>
                  ) : d.status === 'VERIFIED' ? (
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 size={13} /> Verified
                    </span>
                  ) : null}
                </div>
              </div>

              {/* Expected vs Actual Result */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs">
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">EXPECTED BEHAVIOR</span>
                  <p className="text-emerald-300 mt-1">{d.expected_result}</p>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] block font-semibold">OBSERVED ACTUAL BEHAVIOR</span>
                  <p className="text-rose-300 mt-1">{d.actual_result}</p>
                </div>
              </div>

              {/* Developer Fix Details (if submitted) */}
              {d.fix_reference && (
                <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 text-xs space-y-1">
                  <div className="flex items-center gap-2 text-cyan-300 font-semibold text-[11px]">
                    <GitPullRequest size={13} />
                    <span>Developer Fix: {d.fix_reference}</span>
                  </div>
                  {d.fix_notes && (
                    <p className="text-slate-300 text-[11px] pl-5">{d.fix_notes}</p>
                  )}
                </div>
              )}

              {/* Verification Notes (if verified) */}
              {d.verification_notes && (
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-xs space-y-1">
                  <span className="text-emerald-400 font-semibold text-[11px] block">
                    QA Verification Notes:
                  </span>
                  <p className="text-slate-300 text-[11px]">{d.verification_notes}</p>
                </div>
              )}

              {/* Metadata Footer */}
              <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span>Assigned: <strong className="text-slate-200">{d.assigned_developer || 'Unassigned'}</strong></span>
                  <span>Reporter: <strong className="text-slate-200">{d.reporter}</strong></span>
                  <span>Environment: <strong className="text-slate-300">{d.environment}</strong></span>
                  {d.reopen_count > 0 && (
                    <span className="text-rose-400 font-bold">Reopened {d.reopen_count}x</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {d.test_case_id && (
                    <Link
                      to={`/workspace/${workspaceId}/qa/test-execution?test_case_id=${encodeURIComponent(d.test_case_id)}`}
                      className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                    >
                      <span>Retest Execution</span>
                      <ChevronRight size={13} />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateDefectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={workspaceId}
        onSuccess={() => fetchDefects()}
      />

      <VerifyDefectModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        defect={selectedDefect}
        workspaceId={workspaceId}
        onSuccess={() => fetchDefects()}
      />
    </div>
  );
}

