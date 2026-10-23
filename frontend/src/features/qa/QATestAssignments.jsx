import React, { useState, useEffect, useMemo } from 'react';
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
  Sparkles,
  RefreshCw,
  X,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { qaApi } from '../../api/qa';
import { useTheme } from '../../context/ThemeContext';
import ExecuteTestModal from './components/ExecuteTestModal';
import CreateDefectModal from './components/CreateDefectModal';
import QARequestClarificationModal from './components/QARequestClarificationModal';
import QATaskStatusModal from './components/QATaskStatusModal';

export default function QATestAssignments() {
  const { workspaceId } = useParams();
  const { isDark } = useTheme();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');

  // Modals state
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
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
      setAssignments(Array.isArray(res) && res.length > 0 ? res : getFallbackAssignments());
    } catch (err) {
      console.warn('Failed to load QA test assignments:', err);
      setAssignments(getFallbackAssignments());
    } finally {
      setLoading(false);
    }
  };

  const getFallbackAssignments = () => [
    {
      assignment_id: 'QA-ASN-001',
      task_title: 'Reliable Report Export and Data Parity Engine',
      requirement_id: 'REQ-001',
      prd_id: 'PRD-20261014-1605-73A4',
      prd_title: 'Report Export Failures Impacting Task Completion',
      priority: 'P1',
      status: 'ASSIGNED',
      testing_status: 'ASSIGNED',
      due_date: '2026-10-24',
      responsible_tester: 'Satya Prem (QA Lead)',
      description: 'Validate zero duplicate job submissions, sub-200ms dispatch, and exact column/value hash parity between dashboard and CSV.',
      test_case_count: 3,
      passed_tests: 1,
      failed_tests: 0,
      open_defects_count: 0,
      next_required_action: 'Execute automated parity and edge-case test suite',
      developer_submission: { revision_number: 1 },
    },
    {
      assignment_id: 'QA-ASN-002',
      task_title: 'High-Volume Record Ingestion Validation and Virtual Grid',
      requirement_id: 'REQ-002',
      prd_id: 'PRD-20261014-0952-18C7',
      prd_title: 'Report Export Failures Requires Attention',
      priority: 'P1',
      status: 'IN_PROGRESS',
      testing_status: 'IN_PROGRESS',
      due_date: '2026-10-25',
      responsible_tester: 'Satya Prem (QA Lead)',
      description: 'Stress-test DOM virtualization with 25k records and verify accurate error messaging on corrupted CSV rows.',
      test_case_count: 4,
      passed_tests: 2,
      failed_tests: 1,
      open_defects_count: 1,
      next_required_action: 'Retest line index reporting defect fix',
      developer_submission: { revision_number: 2 },
    },
  ];

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

  const statusCounts = useMemo(() => {
    return {
      ALL: assignments.length,
      ASSIGNED: assignments.filter((a) => (a.testing_status || a.status || '').toUpperCase() === 'ASSIGNED').length,
      IN_PROGRESS: assignments.filter((a) => (a.testing_status || a.status || '').toUpperCase() === 'IN_PROGRESS').length,
      COMPLETED: assignments.filter((a) => (a.testing_status || a.status || '').toUpperCase() === 'COMPLETED').length,
      REJECTED: assignments.filter((a) => {
        const s = (a.testing_status || a.status || '').toUpperCase();
        return s === 'REJECTED' || s === 'BLOCKED' || s === 'FAILED';
      }).length,
    };
  }, [assignments]);

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch =
        (a.assignment_id || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.task_title || a.requirement_title || a.feature_name || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.requirement_id || '').toLowerCase().includes(search.toLowerCase()) ||
        (a.prd_id || '').toLowerCase().includes(search.toLowerCase());

      const itemStatus = (a.testing_status || a.status || '').toUpperCase();
      let matchesStatus = true;
      if (statusFilter !== 'ALL') {
        if (statusFilter === 'REJECTED') {
          matchesStatus = itemStatus === 'REJECTED' || itemStatus === 'BLOCKED' || itemStatus === 'FAILED';
        } else {
          matchesStatus = itemStatus === statusFilter;
        }
      }

      let matchesPriority = true;
      if (priorityFilter !== 'ALL') {
        const p = (a.priority || '').toUpperCase();
        if (priorityFilter === 'CRITICAL' || priorityFilter === 'P1') {
          matchesPriority = p === 'CRITICAL' || p === 'P1';
        } else if (priorityFilter === 'HIGH' || priorityFilter === 'P2') {
          matchesPriority = p === 'HIGH' || p === 'P2';
        } else if (priorityFilter === 'MEDIUM' || priorityFilter === 'P3') {
          matchesPriority = p === 'MEDIUM' || p === 'P3';
        } else if (priorityFilter === 'LOW' || priorityFilter === 'P4') {
          matchesPriority = p === 'LOW' || p === 'P4';
        } else {
          matchesPriority = p === priorityFilter;
        }
      }

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [assignments, search, statusFilter, priorityFilter]);

  return (
    <div className={`w-full font-sans space-y-6 pb-12 transition-colors duration-200 ${isDark ? 'text-slate-100' : 'text-slate-900'}`}>
      {/* Header */}
      <div className={`flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b ${
        isDark ? 'border-white/[0.06]' : 'border-slate-200'
      }`}>
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              isDark ? 'bg-purple-500/20 border-purple-500/40 text-purple-400' : 'bg-purple-50 border-purple-200 text-purple-600'
            }`}>
              <ListTodo size={20} />
            </div>
            <h1 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              My Test Assignments
            </h1>
            <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border font-mono ${
              isDark ? 'bg-purple-500/15 text-purple-300 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-200'
            }`}>
              QA Assignments
              QA Task Management
            </span>
          </div>
          <p className={`text-xs pl-11 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
            Assigned feature testing, verification queues, and linked PRD requirements
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={fetchAssignments}
            title="Refresh Assignments"
            className={`p-2 rounded-xl border transition-colors cursor-pointer ${
              isDark ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-slate-300' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
            }`}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin text-purple-400' : ''} />
          </button>
          <Link
            to={`/workspace/${workspaceId}/qa/dashboard`}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              isDark ? 'bg-slate-900 border-white/[0.08] hover:border-white/[0.2] text-slate-300' : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
            }`}
          >
            QA Dashboard
          </Link>
          <Link
            to={`/workspace/${workspaceId}/qa/feedback`}
            className={`px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors flex items-center gap-1.5 ${
              isDark ? 'bg-slate-900 border-purple-500/30 hover:border-purple-500/50 text-purple-300' : 'bg-purple-50 border-purple-200 hover:bg-purple-100 text-purple-700'
            }`}
          >
            <span>Feedback & Suggestions</span>
          </Link>
          <Link
            to={`/workspace/${workspaceId}/qa/prd-view`}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-1.5"
          >
            <FileText size={14} />
            <span>PRD Viewer</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className={`flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 p-3 rounded-2xl border shadow-sm ${
        isDark ? 'bg-[#090d1c]/80 border-white/[0.08] backdrop-blur-xl' : 'bg-white border-slate-200'
      }`}>
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
          {[
            { id: 'ALL', label: 'All Tasks' },
            { id: 'ASSIGNED', label: 'Assigned' },
            { id: 'IN_PROGRESS', label: 'In Progress' },
            { id: 'COMPLETED', label: 'Completed' },
            { id: 'BLOCKED', label: 'Blocked' },
            { id: 'REJECTED', label: 'Rejected / Blocked' },
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            const count = statusCounts[tab.id] ?? 0;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30'
                    : isDark
                    ? 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    isActive ? 'bg-white/20 text-white' : isDark ? 'bg-white/[0.06] text-slate-400' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Priority Filter & Search Input */}
        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className={`px-3 py-2 rounded-xl border text-xs outline-none transition-colors cursor-pointer ${
              isDark
                ? 'bg-[#101428] border-white/[0.08] text-slate-200 focus:border-purple-500/50'
                : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-purple-600'
            }`}
          >
            <option value="ALL">All Priorities</option>
            <option value="P1">P1 - Critical</option>
            <option value="P2">P2 - Core</option>
            <option value="P3">P3 - Edge</option>
            <option value="CRITICAL">Critical (P1)</option>
            <option value="HIGH">High (P2)</option>
            <option value="MEDIUM">Medium (P3)</option>
            <option value="LOW">Low (P4)</option>
          </select>

          <div className="relative flex-1 sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search assignment ID, requirement..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={`w-full pl-9 pr-8 py-2 rounded-xl border text-xs outline-none transition-colors ${
                isDark
                  ? 'bg-white/[0.04] border-white/[0.08] text-slate-200 placeholder-slate-500 focus:border-purple-500/50'
                  : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400 focus:border-purple-600'
              }`}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X size={13} />
              </button>
            )}
          </div>
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
            const itemStatus = (asn.testing_status || asn.status || 'ASSIGNED').toUpperCase();

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
                      asn.priority === 'P1' || asn.priority === 'CRITICAL' || asn.priority === 'HIGH'
                        ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                        : 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30'
                    }`}>
                      {asn.priority || 'P1'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">Due: <span className="text-slate-200">{asn.due_date}</span></span>
                    <span className="text-slate-600">&bull;</span>
                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded border ${
                      itemStatus === 'COMPLETED'
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        : itemStatus === 'IN_PROGRESS'
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                        : itemStatus === 'REJECTED' || itemStatus === 'BLOCKED'
                        ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        : 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}>
                      {itemStatus.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                {/* Scope & Requirement description */}
                <div className="text-xs text-slate-300 space-y-1">
                  <p className="line-clamp-2">
                    {asn.description || asn.scope || 'Verify zero duplicate charge creation under network latency; test fallback card retry CTA.'}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                    <span>PRD: <strong className="text-slate-300">{asn.prd_title || asn.prd_id || 'PRD-001'}</strong></span>
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
                <div className={`pt-2 border-t flex flex-wrap items-center justify-between gap-2 text-xs ${
                  isDark ? 'border-white/[0.06]' : 'border-slate-200'
                }`}>
                  <div className={`flex items-center gap-1.5 text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    <span>Status Note:</span>
                    <span className="text-purple-400 font-semibold">{asn.notes || asn.next_required_action || 'Ready for evaluation'}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* View PRD Button */}
                    <Link
                      to={`/workspace/${workspaceId}/qa/prd-view`}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors ${
                        isDark
                          ? 'bg-white/[0.04] hover:bg-white/[0.08] border-white/[0.08] text-purple-400 hover:text-purple-300'
                          : 'bg-purple-50 hover:bg-purple-100 border-purple-200 text-purple-700'
                      }`}
                      title="View Full PRD Document"
                    >
                      <FileText size={12} className="text-purple-400" />
                      <span>View PRD</span>
                    </Link>

                    {/* Ask Question / Clarify Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenClarification(asn.requirement_id)}
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                        isDark ? 'bg-slate-800 hover:bg-slate-700 border-white/[0.06] text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-700'
                      }`}
                    >
                      <HelpCircle size={13} />
                      <span>Ask PM</span>
                    </button>

                    {/* Report Defect */}
                    <button
                      type="button"
                      onClick={() => handleReportDefect(asn)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Bug size={13} />
                      <span>Report Bug</span>
                    </button>

                    {/* Manage Task Status Button */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAssignment(asn);
                        setIsStatusModalOpen(true);
                      }}
                      className="px-3.5 py-1.5 rounded-lg bg-[#5b3df5] hover:bg-[#4a2ee3] text-xs font-bold text-white shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                    >
                      <CheckCircle2 size={13} />
                      <span>Manage Status</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <QATaskStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        assignment={selectedAssignment}
        workspaceId={workspaceId}
        onSuccess={() => fetchAssignments()}
        onClarify={(reqId) => handleOpenClarification(reqId)}
      />

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

