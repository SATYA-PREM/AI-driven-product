import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  CheckCircle2,
  XCircle,
  Play,
  Layers,
  ChevronRight,
  ShieldCheck,
  Search,
  CheckSquare,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';
import ExecuteTestModal from './components/ExecuteTestModal';
import CreateDefectModal from './components/CreateDefectModal';

export default function QARegressionTesting() {
  const { workspaceId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedCase, setSelectedCase] = useState(null);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectInitialData, setDefectInitialData] = useState({});

  const fetchRegression = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await qaApi.getRegressionTests(workspaceId);
      setData(res || null);
    } catch (err) {
      setError(err.message || 'Failed to load regression tests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegression();
  }, [workspaceId]);

  const handleRun = (tc) => {
    setSelectedCase(tc);
    setIsExecuteModalOpen(true);
  };

  const testCases = data?.test_cases || [];

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <RotateCcw size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Regression Testing
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono">
              Release Guardrails
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Ensure existing critical flows, security boundaries, and payment retry idempotency remain intact
          </p>
        </div>

        <Link
          to={`/workspace/${workspaceId}/qa/release-readiness`}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5"
        >
          <ShieldCheck size={14} />
          <span>Release Readiness</span>
        </Link>
      </div>

      {/* Regression KPI Summary Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08]">
          <span className="text-xs text-slate-400 font-medium">Regression Scope</span>
          <div className="mt-2 text-2xl font-black text-white">{data?.total_regression_tests || 0}</div>
          <span className="text-[11px] text-slate-500">P1 & regression cases</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08]">
          <span className="text-xs text-slate-400 font-medium">Verified Passed</span>
          <div className="mt-2 text-2xl font-black text-emerald-400">{data?.passed_count || 0}</div>
          <span className="text-[11px] text-slate-500">Confirmed non-regressed</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08]">
          <span className="text-xs text-slate-400 font-medium">Failing Tests</span>
          <div className="mt-2 text-2xl font-black text-rose-400">{data?.failed_count || 0}</div>
          <span className="text-[11px] text-slate-500">Active regressions</span>
        </div>
        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08]">
          <span className="text-xs text-slate-400 font-medium">Regression Pass Rate</span>
          <div className="mt-2 text-2xl font-black text-amber-400">{data?.pass_rate || 0}%</div>
          <span className="text-[11px] text-slate-500">Target: 100% for release</span>
        </div>
      </div>

      {/* Regression Cases List */}
      <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-3.5">
        <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <CheckSquare size={16} className="text-amber-400" />
            <span>Target Regression Test Cases</span>
          </h3>
          <span className="text-xs text-slate-500 font-mono">{testCases.length} Cases</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            Loading regression scope...
          </div>
        ) : testCases.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            No test cases flagged for regression.
          </div>
        ) : (
          <div className="space-y-3">
            {testCases.map((tc) => (
              <div
                key={tc.test_case_id}
                className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] hover:border-amber-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-amber-400 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/20">
                      {tc.test_case_id}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{tc.title}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      {tc.test_type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 line-clamp-1">
                    Expected: {tc.expected_results}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      tc.latest_outcome === 'PASSED'
                        ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                        : tc.latest_outcome === 'FAILED'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-slate-500/15 text-slate-300 border-slate-500/30'
                    }`}
                  >
                    {tc.latest_outcome || 'NOT_EXECUTED'}
                  </span>
                  <button
                    onClick={() => handleRun(tc)}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Play size={13} />
                    <span>Re-run</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ExecuteTestModal
        isOpen={isExecuteModalOpen}
        onClose={() => setIsExecuteModalOpen(false)}
        testCase={selectedCase}
        workspaceId={workspaceId}
        onSuccess={() => fetchRegression()}
        onReportDefect={(defectInfo) => {
          setDefectInitialData(defectInfo);
          setIsDefectModalOpen(true);
        }}
      />

      <CreateDefectModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        workspaceId={workspaceId}
        initialData={defectInitialData}
        onSuccess={() => fetchRegression()}
      />
    </div>
  );
}

