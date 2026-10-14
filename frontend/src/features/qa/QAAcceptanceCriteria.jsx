import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  CheckCircle2,
  XCircle,
  Clock,
  Bug,
  Play,
  ChevronRight,
  Filter,
  Search,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';

export default function QAAcceptanceCriteria() {
  const { workspaceId } = useParams();
  const [requirementsData, setRequirementsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('ALL');

  useEffect(() => {
    async function loadData() {
      if (!workspaceId) return;
      setLoading(true);
      try {
        const res = await qaApi.getRequirements(workspaceId);
        setRequirementsData(res || null);
      } catch (err) {
        console.warn('Failed to load acceptance criteria:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [workspaceId]);

  const reqs = requirementsData?.requirements || [];
  const allCriteria = [];
  reqs.forEach((r) => {
    (r.acceptance_criteria || []).forEach((ac) => {
      allCriteria.push({
        ...ac,
        requirement_id: r.requirement_id,
        requirement_title: r.title,
      });
    });
  });

  const filtered = allCriteria.filter((ac) => {
    return filterStatus === 'ALL' || ac.verification_status === filterStatus;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckSquare size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Acceptance Criteria Traceability
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono">
              {allCriteria.length} Criteria
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Track verification state of every acceptance criterion backed by actual execution results
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All States</option>
            <option value="VERIFIED">Verified</option>
            <option value="FAILED">Failed</option>
            <option value="PENDING_EXECUTION">Pending Execution</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading acceptance criteria traceability...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] text-center text-slate-400 text-xs">
          No acceptance criteria matching filter.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((ac) => {
            const isVerified = ac.verification_status === 'VERIFIED';
            const isFailed = ac.verification_status === 'FAILED';
            const linkedCases = ac.linked_test_cases || [];
            const linkedDefects = ac.linked_defects || [];

            return (
              <div
                key={ac.criterion_id}
                className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-purple-500/30 transition-all space-y-3.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {ac.criterion_id}
                    </span>
                    <h3 className="text-sm font-bold text-white">{ac.description}</h3>
                  </div>

                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${
                      isVerified
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : isFailed
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {ac.verification_status || 'PENDING'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.04] text-xs space-y-1">
                  <span className="text-slate-500 text-[10px] block font-semibold">EXPECTED BEHAVIOR:</span>
                  <p className="text-slate-200">{ac.expected_behavior}</p>
                </div>

                {/* Linked Test Cases & Defects */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.04] space-y-1">
                    <span className="text-slate-400 font-semibold block text-[11px]">
                      Linked Test Cases ({linkedCases.length}):
                    </span>
                    {linkedCases.length === 0 ? (
                      <span className="text-slate-500 text-[11px]">No linked test cases yet</span>
                    ) : (
                      <div className="space-y-1">
                        {linkedCases.map((tc) => (
                          <div key={tc.test_case_id} className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-purple-300">{tc.test_case_id}</span>
                            <span className="text-slate-300 truncate max-w-[180px]">{tc.title}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              tc.latest_outcome === 'PASSED' ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400'
                            }`}>
                              {tc.latest_outcome || 'NOT_RUN'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.04] space-y-1">
                    <span className="text-slate-400 font-semibold block text-[11px]">
                      Linked Defects ({linkedDefects.length}):
                    </span>
                    {linkedDefects.length === 0 ? (
                      <span className="text-emerald-400 text-[11px]">Zero defects linked &bull; Clear</span>
                    ) : (
                      <div className="space-y-1">
                        {linkedDefects.map((d) => (
                          <div key={d.defect_id} className="flex items-center justify-between text-[11px]">
                            <span className="font-mono text-rose-400">{d.defect_id}</span>
                            <span className="text-slate-300 truncate max-w-[180px]">{d.title}</span>
                            <span className="text-amber-400 font-bold text-[9px]">{d.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                  <span>Requirement: <strong className="font-mono text-purple-300">{ac.requirement_id}</strong> &bull; {ac.requirement_title}</span>
                  <Link
                    to={`/workspace/${workspaceId}/qa/test-cases?requirement_id=${encodeURIComponent(ac.requirement_id)}`}
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                  >
                    <span>Execute Criteria Tests</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

