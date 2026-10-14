import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  CheckCircle2,
  Play,
  RotateCcw,
  ShieldCheck,
  ChevronRight,
  Bug,
  AlertTriangle,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';
import VerifyDefectModal from './components/VerifyDefectModal';
import ExecuteTestModal from './components/ExecuteTestModal';

export default function QARetestingQueue() {
  const { workspaceId } = useParams();
  const [retestItems, setRetestItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [selectedDefect, setSelectedDefect] = useState(null);
  const [isVerifyModalOpen, setIsVerifyModalOpen] = useState(false);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);

  const fetchRetestQueue = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await qaApi.getRetestingQueue(workspaceId);
      setRetestItems(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load retesting queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRetestQueue();
  }, [workspaceId]);

  const handleVerify = (defect) => {
    setSelectedDefect(defect);
    setIsVerifyModalOpen(true);
  };

  const handleRetestRun = (defect) => {
    if (defect.original_test_case) {
      setSelectedTestCase(defect.original_test_case);
      setIsExecuteModalOpen(true);
    } else {
      setSelectedDefect(defect);
      setIsVerifyModalOpen(true);
    }
  };

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <GitPullRequest size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Retesting Queue
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
              {retestItems.length} Awaiting Verification
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Review developer fix commits, re-execute original failed tests, and confirm verification
          </p>
        </div>

        <Link
          to={`/workspace/${workspaceId}/qa/defects`}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.08] hover:border-white/[0.2] text-xs font-semibold text-slate-300 transition-colors"
        >
          All Defects
        </Link>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading retesting items...
        </div>
      ) : retestItems.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] text-center text-slate-400 text-xs space-y-2">
          <CheckCircle2 size={32} className="mx-auto text-emerald-400 opacity-80" />
          <p className="text-sm font-semibold text-slate-200">Retesting Queue is Empty</p>
          <p className="text-slate-500">When developers submit fixes for reported defects, items appear here for QA validation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {retestItems.map((item) => (
            <div
              key={item.defect_id}
              className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-cyan-500/30 transition-all space-y-3.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30">
                    {item.defect_id}
                  </span>
                  <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    Fix Submitted
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleRetestRun(item)}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Play size={13} />
                    <span>Run Retest</span>
                  </button>
                  <button
                    onClick={() => handleVerify(item)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <ShieldCheck size={13} />
                    <span>Verify Fix</span>
                  </button>
                </div>
              </div>

              {/* Developer Fix Summary */}
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-cyan-400 font-semibold">
                    Developer Fix Reference: <strong className="font-mono text-slate-200">{item.fix_reference || 'Committed'}</strong>
                  </span>
                  <span className="text-slate-400 text-[11px]">Assigned: {item.assigned_developer}</span>
                </div>
                {item.fix_notes && (
                  <p className="text-slate-300 text-[11px] bg-black/40 p-2.5 rounded border border-white/[0.04]">
                    {item.fix_notes}
                  </p>
                )}
              </div>

              {/* Previous Failure Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px] block font-semibold">PREVIOUS FAILURE:</span>
                  <p className="text-rose-300 mt-1 line-clamp-2">{item.actual_result}</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.04]">
                  <span className="text-slate-500 text-[10px] block font-semibold">EXPECTED BEHAVIOR:</span>
                  <p className="text-emerald-300 mt-1 line-clamp-2">{item.expected_result}</p>
                </div>
              </div>

              {/* Footer */}
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span>Linked Test: <strong className="font-mono text-purple-300">{item.test_case_id || 'TC-01'}</strong></span>
                  <span>Environment: <strong className="text-slate-200">{item.environment}</strong></span>
                </div>
                <span className="text-cyan-400 font-medium">Required Action: Re-run test and record outcome</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <VerifyDefectModal
        isOpen={isVerifyModalOpen}
        onClose={() => setIsVerifyModalOpen(false)}
        defect={selectedDefect}
        workspaceId={workspaceId}
        onSuccess={() => fetchRetestQueue()}
      />

      <ExecuteTestModal
        isOpen={isExecuteModalOpen}
        onClose={() => setIsExecuteModalOpen(false)}
        testCase={selectedTestCase}
        workspaceId={workspaceId}
        onSuccess={() => fetchRetestQueue()}
        onReportDefect={() => {}}
      />
    </div>
  );
}

