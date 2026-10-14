import React, { useState, useEffect } from 'react';
import {
  FileText,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Shield,
  Search,
  Filter,
  User,
  ExternalLink,
  Lock
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { stakeholderApi } from '../../api/stakeholder';

export default function DecisionHistoryPage() {
  const { workspaceId } = useParams();
  const [decisions, setDecisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('ALL');

  useEffect(() => {
    async function loadDecisions() {
      if (!workspaceId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await stakeholderApi.listDecisionHistory(workspaceId);
        setDecisions(Array.isArray(res) ? res : []);
      } catch (err) {
        console.error('Failed to load decision history:', err);
        setError(err.message || 'Failed to fetch decision history');
      } finally {
        setLoading(false);
      }
    }
    loadDecisions();
  }, [workspaceId]);

  const filteredDecisions = decisions.filter((d) => {
    const matchesSearch =
      d.target_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.rationale.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.decision_maker_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDecision = decisionFilter === 'ALL' || d.decision === decisionFilter;
    return matchesSearch && matchesDecision;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16 animate-fade-in">
      {/* Top Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Shield size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-bold text-white tracking-tight">Decision History & Audit Trail</h1>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  Immutable Governance Log
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Audit-traceable record of executive approvals, rejections, change requests, and business rationale
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-400">
          <Lock size={13} className="text-emerald-400" />
          <span>Non-repudiation audit trail active</span>
        </div>
      </div>

      {/* Audit Policy Banner */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.08] flex items-center gap-2.5 text-xs text-slate-300">
        <Shield size={16} className="text-emerald-400 shrink-0" />
        <div>
          <span className="font-semibold text-white">Immutable Record Guarantee: </span>
          Recorded approval decisions cannot be edited or erased. Reversals or reconsiderations must be recorded as new authorized decision entries linked to the preceding record.
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by proposal, rationale, or approver..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/60 border border-slate-700/80 rounded-xl text-slate-100 placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500"
          />
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          {[
            { id: 'ALL', label: 'All Decisions' },
            { id: 'APPROVED', label: 'Approved' },
            { id: 'CHANGES_REQUESTED', label: 'Changes Req.' },
            { id: 'REJECTED', label: 'Rejected' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDecisionFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                decisionFilter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
          {error}
        </div>
      )}

      {/* Decisions Timeline Table */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredDecisions.length === 0 ? (
          <div className="p-10 rounded-2xl bg-slate-900/40 border border-white/[0.06] text-center space-y-2">
            <CheckCircle2 size={36} className="mx-auto text-emerald-400 opacity-60" />
            <div className="text-sm font-semibold text-white">No decision records found</div>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Decisions recorded in the Pending Approvals queue will appear here in chronological audit sequence.
            </p>
          </div>
        ) : (
          filteredDecisions.map((d) => (
            <div
              key={d.decision_id}
              className="p-5 rounded-2xl bg-slate-900/60 border border-white/[0.08] hover:border-slate-700 transition-all space-y-3 shadow-lg shadow-black/20"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="space-y-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {d.decision_id}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded flex items-center gap-1 ${
                      d.decision === 'APPROVED' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' :
                      d.decision === 'REJECTED' ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30' :
                      'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'
                    }`}>
                      {d.decision === 'APPROVED' && <CheckCircle2 size={11} />}
                      {d.decision === 'REJECTED' && <XCircle size={11} />}
                      {d.decision === 'CHANGES_REQUESTED' && <AlertCircle size={11} />}
                      <span>{d.decision?.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Req: <span className="font-mono text-slate-300">{d.request_id}</span>
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white">{d.target_title}</h3>
                </div>

                <div className="flex flex-col sm:items-end text-[11px] text-slate-400 shrink-0">
                  <span className="flex items-center gap-1">
                    <Clock size={12} /> {d.timestamp?.slice(0, 19).replace('T', ' ')}
                  </span>
                  <span className="mt-0.5">
                    By <strong className="text-slate-200">{d.decision_maker_name}</strong> ({d.decision_maker_role})
                  </span>
                </div>
              </div>

              {/* Rationale Block */}
              <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800 space-y-1.5 text-xs">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Recorded Rationale</span>
                <p className="text-slate-300 leading-relaxed">{d.rationale}</p>
              </div>

              {/* Conditions & Follow-up Actions */}
              {d.conditions && d.conditions.length > 0 && (
                <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">Conditions & Follow-up Actions</span>
                  <ul className="list-disc list-inside space-y-0.5 text-amber-200/90 text-[11px]">
                    {d.conditions.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

