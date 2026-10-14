import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  Play,
  Plus,
  Search,
  Filter,
  Bug,
  Clock,
  CheckCircle2,
  XCircle,
  AlertOctagon,
  SkipForward,
  ChevronRight,
  Layers,
  FileText,
  Target,
} from 'lucide-react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { qaApi } from '../../api/qa';
import CreateTestCaseModal from './components/CreateTestCaseModal';
import ExecuteTestModal from './components/ExecuteTestModal';
import CreateDefectModal from './components/CreateDefectModal';

export default function QATestCases() {
  const { workspaceId } = useParams();
  const [searchParams] = useSearchParams();

  const [testCases, setTestCases] = useState([]);
  const [suites, setSuites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [outcomeFilter, setOutcomeFilter] = useState(searchParams.get('outcome') || 'ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [selectedSuite, setSelectedSuite] = useState(searchParams.get('suite_id') || 'ALL');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedCase, setSelectedCase] = useState(null);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectInitialData, setDefectInitialData] = useState({});

  const fetchData = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const [tcRes, suitesRes] = await Promise.all([
        qaApi.getTestCases(workspaceId),
        qaApi.getTestSuites(workspaceId),
      ]);
      setTestCases(tcRes || []);
      setSuites(suitesRes || []);
    } catch (err) {
      setError(err.message || 'Failed to load test cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [workspaceId]);

  const handleRunTest = (tc) => {
    setSelectedCase(tc);
    setIsExecuteModalOpen(true);
  };

  const handleReportDefectFromFailure = (defectInfo) => {
    setDefectInitialData(defectInfo);
    setIsDefectModalOpen(true);
  };

  const getOutcomeBadge = (outcome) => {
    const o = String(outcome || '').toUpperCase();
    if (o === 'PASSED') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (o === 'FAILED') {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
    if (o === 'BLOCKED') {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    if (o === 'SKIPPED') {
      return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
    }
    return 'bg-purple-500/15 text-purple-300 border-purple-500/30';
  };

  const filtered = testCases.filter((tc) => {
    const matchesSearch =
      (tc.test_case_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (tc.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (tc.requirement_id || '').toLowerCase().includes(search.toLowerCase());

    const matchesOutcome = outcomeFilter === 'ALL' || tc.latest_outcome === outcomeFilter;
    const matchesPriority = priorityFilter === 'ALL' || tc.priority === priorityFilter;
    const matchesType = typeFilter === 'ALL' || tc.test_type === typeFilter;
    const matchesSuite = selectedSuite === 'ALL' || tc.suite_id === selectedSuite;

    return matchesSearch && matchesOutcome && matchesPriority && matchesType && matchesSuite;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <CheckSquare size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Test Cases Management
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              {testCases.length} Defined
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Maintain step procedures, expected outcomes, preconditions, and execution outcomes
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={14} />
            <span>New Test Case</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search test cases or requirements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          <select
            value={outcomeFilter}
            onChange={(e) => setOutcomeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Outcomes</option>
            <option value="PASSED">Passed</option>
            <option value="FAILED">Failed</option>
            <option value="BLOCKED">Blocked</option>
            <option value="NOT_EXECUTED">Not Executed</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="P1">P1 (Critical)</option>
            <option value="P2">P2 (Core)</option>
            <option value="P3">P3 (Edge)</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Test Types</option>
            <option value="FUNCTIONAL">Functional</option>
            <option value="INTEGRATION">Integration</option>
            <option value="REGRESSION">Regression</option>
            <option value="SECURITY">Security</option>
            <option value="ACCESSIBILITY">Accessibility</option>
          </select>

          {suites.length > 0 && (
            <select
              value={selectedSuite}
              onChange={(e) => setSelectedSuite(e.target.value)}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Suites</option>
              {suites.map((s) => (
                <option key={s.suite_id} value={s.suite_id}>
                  {s.suite_name}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Test Cases Table / Cards */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading test cases...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] text-center text-slate-400 text-xs space-y-2">
          <p>No test cases matched your filter criteria.</p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="text-purple-400 underline font-semibold"
          >
            Create first test case
          </button>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filtered.map((tc) => (
            <div
              key={tc.test_case_id}
              className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-purple-500/30 transition-all space-y-3"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {tc.test_case_id}
                  </span>
                  <h3 className="text-sm font-bold text-white">{tc.title}</h3>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {tc.test_type}
                  </span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                    tc.priority === 'P1'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  }`}>
                    {tc.priority}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${getOutcomeBadge(tc.latest_outcome)}`}>
                    {tc.latest_outcome || 'NOT_EXECUTED'}
                  </span>
                  <button
                    onClick={() => handleRunTest(tc)}
                    className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                  >
                    <Play size={13} />
                    <span>Run Test</span>
                  </button>
                </div>
              </div>

              {/* Steps and expected results summary */}
              <div className="text-xs space-y-1.5 text-slate-300">
                <p>
                  <strong className="text-slate-400">Expected Result: </strong>
                  <span className="text-emerald-300">{tc.expected_results}</span>
                </p>
                {tc.preconditions && (
                  <p className="text-[11px] text-slate-400">
                    <strong className="text-slate-500">Preconditions: </strong>
                    {tc.preconditions}
                  </p>
                )}
                {tc.steps && tc.steps.length > 0 && (
                  <div className="pt-1.5">
                    <span className="text-[11px] font-bold text-slate-400 block mb-1">
                      Procedure ({tc.steps.length} Steps):
                    </span>
                    <div className="space-y-1 pl-2 border-l border-white/[0.08]">
                      {tc.steps.slice(0, 3).map((st, i) => (
                        <div key={i} className="text-[11px] text-slate-300 flex items-baseline gap-2">
                          <span className="font-mono text-purple-400 font-bold">#{st.step_number || i + 1}</span>
                          <span>{st.action}</span>
                          <span className="text-slate-500">&rarr; {st.expected_result}</span>
                        </div>
                      ))}
                      {tc.steps.length > 3 && (
                        <span className="text-[10px] text-slate-500 italic block">
                          + {tc.steps.length - 3} more steps...
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-slate-400">
                <div className="flex items-center gap-3">
                  <span>Req: <strong className="font-mono text-purple-300">{tc.requirement_id || 'REQ-01'}</strong></span>
                  <span>Criterion: <strong className="text-slate-300">{tc.criterion_id || 'AC-01'}</strong></span>
                  <span>Executions: <strong className="text-slate-200">{tc.execution_count || 0}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    to={`/workspace/${workspaceId}/qa/test-execution?test_case_id=${encodeURIComponent(tc.test_case_id)}`}
                    className="text-purple-400 hover:text-purple-300 font-semibold flex items-center gap-1"
                  >
                    <span>Full Execution Interface</span>
                    <ChevronRight size={13} />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <CreateTestCaseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        workspaceId={workspaceId}
        suites={suites}
        onSuccess={() => fetchData()}
      />

      <ExecuteTestModal
        isOpen={isExecuteModalOpen}
        onClose={() => setIsExecuteModalOpen(false)}
        testCase={selectedCase}
        workspaceId={workspaceId}
        onSuccess={() => fetchData()}
        onReportDefect={handleReportDefectFromFailure}
      />

      <CreateDefectModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        workspaceId={workspaceId}
        initialData={defectInitialData}
        onSuccess={() => fetchData()}
      />
    </div>
  );
}

