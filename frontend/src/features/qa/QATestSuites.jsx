import React, { useState, useEffect } from 'react';
import { Layers, Plus, CheckCircle2, XCircle, AlertOctagon, Play, ChevronRight, CheckSquare } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';
import CreateTestSuiteModal from './components/CreateTestSuiteModal';

export default function QATestSuites() {
  const { workspaceId } = useParams();
  const [suites, setSuites] = useState([]);
  const [testPlans, setTestPlans] = useState([]);
  const [testCases, setTestCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const fetchSuites = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const [suitesRes, plansRes, casesRes] = await Promise.all([
        qaApi.getTestSuites(workspaceId),
        qaApi.getTestPlans(workspaceId),
        qaApi.getTestCases(workspaceId),
      ]);
      setSuites(suitesRes || []);
      setTestPlans(plansRes || []);
      setTestCases(casesRes || []);
    } catch (err) {
      console.warn('Failed to load test suites:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuites();
  }, [workspaceId]);

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Layers size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Test Suites
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              {suites.length} Suites
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Group test cases by component, feature boundary, and execution priority
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
        >
          <Plus size={14} />
          <span>New Test Suite</span>
        </button>
      </div>

      {/* Suites Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading test suites...
        </div>
      ) : suites.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] text-center text-slate-400 text-xs space-y-2">
          <p>No test suites created yet.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-purple-400 underline font-semibold"
          >
            Create first test suite
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {suites.map((suite) => (
            <div
              key={suite.suite_id}
              className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-purple-500/30 transition-all flex flex-col justify-between space-y-4"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {suite.suite_id}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30">
                    {suite.execution_status || 'READY'}
                  </span>
                </div>

                <h3 className="text-sm font-bold text-white">{suite.suite_name}</h3>
                {suite.description && (
                  <p className="text-xs text-slate-400 line-clamp-2">{suite.description}</p>
                )}
                <div className="text-[11px] text-slate-400">
                  Feature: <strong className="text-slate-300">{suite.related_feature || 'Core Feature'}</strong>
                </div>
              </div>

              {/* Counts Badge Strip */}
              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] flex items-center justify-around text-xs">
                <div className="text-center">
                  <span className="text-slate-500 block text-[10px]">TOTAL</span>
                  <span className="font-bold text-white">{suite.test_case_count || 0}</span>
                </div>
                <div className="text-center">
                  <span className="text-emerald-500 block text-[10px]">PASS</span>
                  <span className="font-bold text-emerald-400">{suite.pass_count || 0}</span>
                </div>
                <div className="text-center">
                  <span className="text-rose-500 block text-[10px]">FAIL</span>
                  <span className="font-bold text-rose-400">{suite.fail_count || 0}</span>
                </div>
                <div className="text-center">
                  <span className="text-amber-500 block text-[10px]">BLOCK</span>
                  <span className="font-bold text-amber-400">{suite.blocked_count || 0}</span>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Owner: {suite.owner || 'QA Lead'}
                </span>
                <Link
                  to={`/workspace/${workspaceId}/qa/test-cases?suite_id=${encodeURIComponent(suite.suite_id)}`}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  <CheckSquare size={13} />
                  <span>View Test Cases</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <CreateTestSuiteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={workspaceId}
        testPlans={testPlans}
        testCases={testCases}
        onSuccess={() => fetchSuites()}
      />
    </div>
  );
}

