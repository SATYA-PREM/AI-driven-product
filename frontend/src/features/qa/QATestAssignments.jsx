import React, { useState, useEffect } from 'react';
import {
  ListTodo,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileText,
  Search,
  Filter,
  ArrowRight,
  Play,
  Bug,
  HelpCircle,
  ChevronRight,
  GitPullRequest,
  CheckSquare,
  ShieldAlert,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';
import ExecuteTestModal from './components/ExecuteTestModal';
import CreateDefectModal from './components/CreateDefectModal';
import QARequestClarificationModal from './components/QARequestClarificationModal';

export default function QATestAssignments() {
  const { workspaceId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [selectedTestCase, setSelectedTestCase] = useState(null);
  const [isExecuteModalOpen, setIsExecuteModalOpen] = useState(false);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);
  const [defectInitialData, setDefectInitialData] = useState({});
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [targetReqId, setTargetReqId] = useState('');

  const fetchAssignments = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await qaApi.getAssignments(workspaceId);
      setAssignments(res || []);
    } catch (err) {
      setError(err.message || 'Failed to load QA test assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [workspaceId]);

  const handleStartTesting = async (asn) => {
    try {
      await qaApi.updateAssignmentStatus(workspaceId, asn.assignment_id, {
        status: 'IN_PROGRESS',
        notes: 'QA Lead initiated test cycle execution.',
      });
      fetchAssignments();
    } catch (err) {
      alert(`Could not start testing: ${err.message}`);
    }
  };

  const handleOpenClarification = (reqId) => {
    setTargetReqId(reqId);
    setIsClarificationModalOpen(true);
  };

  const handleReportDefect = (asn) => {
    setDefectInitialData({
      requirement_id: asn.requirement_id,
      title: `Defect in ${asn.task_title || asn.requirement_title || 'Feature'}`,
    });
    setIsDefectModalOpen(true);
  };

  const filtered = assignments.filter((a) => {
    const matchesSearch =
      (a.assignment_id || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.task_title || a.requirement_title || a.feature_name || '').toLowerCase().includes(search.toLowerCase()) ||
      (a.requirement_id || '').toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || a.testing_status === statusFilter || a.status === statusFilter;
    const matchesPriority = priorityFilter === 'ALL' || (a.priority || '').toUpperCase() === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <ListTodo size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              My Test Assignments
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              QA Assignments
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Assigned feature testing, verification queues, and linked developer submissions
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to={`/workspace/${workspaceId}/qa/dashboard`}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-white/[0.08] hover:border-white/[0.2] text-xs font-semibold text-slate-300 transition-colors"
          >
            QA Dashboard
          </Link>
          <Link
            to={`/workspace/${workspaceId}/qa/test-cases`}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5"
          >
            <CheckSquare size={14} />
            <span>All Test Cases</span>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="p-3.5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by assignment ID, feature, or requirement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1 text-xs text-slate-400">
            <Filter size={13} />
            <span>Status:</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="BLOCKED">Blocked</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-900 border border-white/[0.08] text-xs text-slate-200 focus:outline-none focus:border-purple-500"
          >
            <option value="ALL">All Priorities</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - Core</option>
            <option value="P3">P3 - Edge</option>
          </select>
        </div>
      </div>

      {/* Assignments List */}
      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading testing assignments...
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] text-center text-slate-400 text-xs space-y-2">
          <p>No testing assignments matched your filter criteria.</p>
          <p className="text-slate-500">Testing assignments populate automatically from approved PRD requirements.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((asn) => {
            const hasSubmission = !!asn.developer_submission;
            const openDefects = asn.open_defects_count || 0;
            const passedCount = asn.passed_tests || 0;
            const failedCount = asn.failed_tests || 0;
            const totalCases = asn.test_case_count || 0;

            return (
              <div
                key={asn.assignment_id}
                className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-purple-500/30 transition-all space-y-4"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      {asn.assignment_id}
                    </span>
                    <h3 className="text-sm font-bold text-white">
                      {asn.task_title || asn.requirement_title || 'Payment Flow & Failure Recovery'}
                    </h3>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      asn.priority === 'P1' || asn.priority === 'HIGH'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {asn.priority || 'P1'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Due: <span className="text-slate-200">{asn.due_date}</span></span>
                    <span className="text-slate-600">&bull;</span>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      {asn.testing_status}
                    </span>
                  </div>
                </div>

                {/* Scope & Requirement description */}
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="line-clamp-2">
                    {asn.description || asn.scope || 'Verify zero duplicate charge creation under network latency; test fallback card retry CTA.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>PRD: <strong className="text-slate-300">{asn.prd_id || 'PRD-001'} (v1.2)</strong></span>
                    <span>Requirement: <strong className="font-mono text-purple-300">{asn.requirement_id || 'REQ-01'}</strong></span>
                    <span>Tester: <strong className="text-slate-300">{asn.responsible_tester}</strong></span>
                  </div>
                </div>

                {/* Quality Execution Progress Bar */}
                <div className="p-3 rounded-xl bg-slate-900/60 border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Test Coverage</span>
                      <span className="font-bold text-white">{totalCases} Cases</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Passed</span>
                      <span className="font-bold text-emerald-400">{passedCount} Passed</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Failed</span>
                      <span className={`font-bold ${failedCount > 0 ? 'text-rose-400' : 'text-slate-400'}`}>
                        {failedCount} Failed
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Open Defects</span>
                      <span className={`font-bold ${openDefects > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {openDefects} Defects
                      </span>
                    </div>
                  </div>

                  {hasSubmission && (
                    <div className="flex items-center gap-2 text-cyan-300 text-[11px] bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-500/20">
                      <GitPullRequest size={13} />
                      <span>Dev Submitted Rev #{asn.developer_submission?.revision_number || 1}</span>
                    </div>
                  )}
                </div>

                {/* Actions Footer */}
                <div className="pt-2 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                    <span>Next Action:</span>
                    <span className="text-purple-300 font-semibold">{asn.next_required_action}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleOpenClarification(asn.requirement_id)}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <HelpCircle size={13} />
                      <span>Clarify</span>
                    </button>

                    <button
                      onClick={() => handleReportDefect(asn)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Bug size={13} />
                      <span>Report Bug</span>
                    </button>

                    <Link
                      to={`/workspace/${workspaceId}/qa/test-cases?requirement_id=${encodeURIComponent(asn.requirement_id || '')}`}
                      className="px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <Play size={13} />
                      <span>Execute Tests</span>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateDefectModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        workspaceId={workspaceId}
        initialData={defectInitialData}
        onSuccess={() => fetchAssignments()}
      />

      <QARequestClarificationModal
        isOpen={isClarificationModalOpen}
        onClose={() => setIsClarificationModalOpen(false)}
        workspaceId={workspaceId}
        requirementId={targetReqId}
        onSuccess={() => fetchAssignments()}
      />
    </div>
  );
}

