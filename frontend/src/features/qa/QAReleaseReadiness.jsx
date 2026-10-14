import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  AlertOctagon,
  Clock,
  ChevronRight,
  FileText,
  UserCheck,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';

export default function QAReleaseReadiness() {
  const { workspaceId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchReadiness = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await qaApi.getReleaseReadiness(workspaceId);
      setData(res || null);
    } catch (err) {
      setError(err.message || 'Failed to evaluate release readiness');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReadiness();
  }, [workspaceId]);

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <ShieldCheck size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Release Readiness Gating
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              Quality Gate
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Authoritative evaluation of whether feature work satisfies all verified criteria for release
          </p>
        </div>

        <Link
          to={`/workspace/${workspaceId}/qa/reports`}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.08] hover:border-white/[0.2] text-xs font-semibold text-slate-300 transition-colors"
        >
          View QA Reports
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Calculating release criteria and defect gates...
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Main Status Banner */}
          <div
            className={`p-6 rounded-2xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
              data.ready_for_release
                ? 'bg-emerald-950/20 border-emerald-500/40'
                : data.open_critical_defects > 0
                ? 'bg-rose-950/25 border-rose-500/40'
                : 'bg-amber-950/20 border-amber-500/40'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`p-3 rounded-2xl ${
                  data.ready_for_release
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : data.open_critical_defects > 0
                    ? 'bg-rose-500/20 text-rose-400'
                    : 'bg-amber-500/20 text-amber-400'
                }`}
              >
                {data.ready_for_release ? (
                  <CheckCircle2 size={28} />
                ) : data.open_critical_defects > 0 ? (
                  <AlertOctagon size={28} />
                ) : (
                  <Clock size={28} />
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                    QA EVALUATION STATUS:
                  </span>
                  <span className="text-sm font-black text-white">{data.qa_recommendation}</span>
                </div>
                <h2 className="text-xl font-bold text-white">
                  {data.ready_for_release
                    ? 'Ready for Product Manager Release Review'
                    : data.open_critical_defects > 0
                    ? 'Release Gate Blocked by Open Critical Defects'
                    : 'Feature Testing Currently In Progress'}
                </h2>
                <p className="text-xs text-slate-300 max-w-2xl">
                  {data.ready_for_release
                    ? 'All required acceptance criteria have passed verification; 0 open critical or high defects remain.'
                    : `${data.missing_criteria.length} release criterion gates currently unresolved.`}
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-black/40 border border-white/[0.08] text-right text-xs shrink-0">
              <span className="text-slate-400 block text-[10px]">EXECUTION COVERAGE</span>
              <span className="text-2xl font-black text-purple-400">{data.execution_coverage_pct}%</span>
              <span className="text-[10px] text-slate-500 block">Of required test suite</span>
            </div>
          </div>

          {/* Missing Criteria Alerts (if any) */}
          {data.missing_criteria.length > 0 && (
            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-rose-500/30 space-y-2.5">
              <h3 className="text-xs font-bold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                <AlertTriangle size={15} />
                <span>Unresolved Release Criteria</span>
              </h3>
              <div className="space-y-1.5">
                {data.missing_criteria.map((crit, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-xs text-slate-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                    <span>{crit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quality Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
            <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08]">
              <span className="text-xs text-slate-400 font-medium">Verified Passed</span>
              <div className="mt-2 text-2xl font-black text-emerald-400">{data.latest_passed}</div>
              <span className="text-[11px] text-slate-500">Passing test cases</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08]">
              <span className="text-xs text-slate-400 font-medium">Failed Tests</span>
              <div className="mt-2 text-2xl font-black text-rose-400">{data.latest_failed}</div>
              <span className="text-[11px] text-slate-500">Active test failures</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08]">
              <span className="text-xs text-slate-400 font-medium">Critical Defects</span>
              <div className="mt-2 text-2xl font-black text-rose-400">{data.open_critical_defects}</div>
              <span className="text-[11px] text-slate-500">Must be 0 for release</span>
            </div>
            <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08]">
              <span className="text-xs text-slate-400 font-medium">Unexecuted Tests</span>
              <div className="mt-2 text-2xl font-black text-amber-400">{data.unexecuted_required_tests}</div>
              <span className="text-[11px] text-slate-500">Remaining to run</span>
            </div>
          </div>

          {/* Outstanding Approvals & Known Risks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <UserCheck size={15} className="text-purple-400" />
                <span>Required Authority Sign-offs</span>
              </h3>
              <div className="space-y-2 text-xs">
                {data.outstanding_approvals.map((appr, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.04] flex items-center justify-between">
                    <span className="text-slate-200">{appr}</span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                      Pending
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle size={15} className="text-amber-400" />
                <span>Documented Production Risks</span>
              </h3>
              <div className="space-y-2 text-xs">
                {data.known_risks.map((risk, idx) => (
                  <div key={idx} className="p-2.5 rounded-xl bg-slate-900/60 border border-white/[0.04] text-slate-300">
                    {risk}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Notice banner */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs text-slate-400 flex items-center justify-between">
            <span>
              <strong>Governance Rule:</strong> QA approval certifies that tested acceptance criteria meet specifications. Production deployment authorization remains reserved for the Product Manager.
            </span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

