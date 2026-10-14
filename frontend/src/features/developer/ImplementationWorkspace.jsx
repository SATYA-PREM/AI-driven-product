import React, { useState, useEffect } from 'react';
import {
  Code2,
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileText,
  Sparkles,
  ArrowLeft,
  GitPullRequest,
  GitBranch,
  Bug,
  HelpCircle,
  ExternalLink,
  Layers,
  CheckSquare,
  AlertTriangle,
  Play,
  FileCode,
  ShieldCheck,
  Send,
  RefreshCw,
  FolderGit2
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { developerApi } from '../../api/developer';
import SubmitImplementationModal from './components/SubmitImplementationModal';
import SubmitDefectFixModal from './components/SubmitDefectFixModal';
import ReportBlockerModal from './components/ReportBlockerModal';
import RequestClarificationModal from './components/RequestClarificationModal';

export default function ImplementationWorkspace() {
  const { workspaceId, assignmentId } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const [detailData, setDetailData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('requirements'); // 'overview' | 'requirements' | 'design' | 'implementation' | 'submissions' | 'defects'

  // Progress update state
  const [newStatus, setNewStatus] = useState('');
  const [progressNote, setProgressNote] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusSuccess, setStatusSuccess] = useState('');

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState(null);
  const [isDefectModalOpen, setIsDefectModalOpen] = useState(false);

  const fetchDetail = async () => {
    if (!workspaceId || !assignmentId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await developerApi.getAssignmentDetail(workspaceId, assignmentId);
      setDetailData(data);
      if (data?.assignment?.status) {
        setNewStatus(data.assignment.status);
      }
    } catch (err) {
      console.warn('Error fetching assignment detail:', err);
      setError(err.message || 'Failed to load assignment detail');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [workspaceId, assignmentId]);

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!newStatus) return;
    setUpdatingStatus(true);
    setStatusSuccess('');
    try {
      await developerApi.updateAssignmentStatus(workspaceId, assignmentId, {
        status: newStatus,
        notes: progressNote.trim() || undefined,
      });
      setStatusSuccess('Status updated successfully!');
      setProgressNote('');
      fetchDetail();
      setTimeout(() => setStatusSuccess(''), 3000);
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusBadge = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'COMPLETED' || s === 'APPROVED') {
      return 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    }
    if (s === 'IN_PROGRESS') {
      return 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30';
    }
    if (s === 'IN_REVIEW' || s === 'IN_RETEST') {
      return 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    }
    if (s === 'BLOCKED') {
      return 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    }
    return 'bg-slate-500/15 text-slate-300 border-slate-500/30';
  };

  const getPriorityBadge = (priority) => {
    const p = String(priority || '').toUpperCase();
    if (p === 'CRITICAL') return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
    if (p === 'HIGH') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (p === 'MEDIUM') return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
  };

  if (loading) {
    return (
      <div className="w-full text-slate-100 font-sans p-12 text-center text-xs flex items-center justify-center gap-2">
        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
        <span>Loading implementation workspace...</span>
      </div>
    );
  }

  if (error || !detailData) {
    return (
      <div className="w-full text-slate-100 font-sans p-8 space-y-4">
        <Link
          to={`/workspace/${workspaceId}/developer/assignments`}
          className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5"
        >
          <ArrowLeft size={14} />
          <span>Back to Assignments</span>
        </Link>
        <div className="p-6 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {error || 'Assignment details could not be found.'}
        </div>
      </div>
    );
  }

  const { assignment, requirement, prd, design_handoff, submissions = [], defects = [] } = detailData;

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-16">
      {/* Back button & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <Link
          to={`/workspace/${workspaceId}/developer/assignments`}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Assignments</span>
        </Link>
        <span className="text-xs font-mono text-slate-500">
          ID: {assignment.assignment_id}
        </span>
      </div>

      {/* Main Header Card */}
      <div className="p-6 rounded-2xl bg-[#090d1c]/90 border border-white/[0.08] shadow-2xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                {assignment.assignment_id}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${getStatusBadge(assignment.status)}`}>
                {assignment.status || 'PENDING'}
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded border ${getPriorityBadge(assignment.priority)}`}>
                {assignment.priority || 'MEDIUM'}
              </span>
              {assignment.revision_number > 0 && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-white/[0.08]">
                  Revision #{assignment.revision_number}
                </span>
              )}
            </div>

            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
              {assignment.feature_title || assignment.title || requirement?.title || 'Technical Implementation'}
            </h1>

            <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
              <span>PRD: <strong className="text-slate-200">{prd?.title || assignment.prd_id || 'PRD'}</strong></span>
              <span className="font-mono text-cyan-300">Req: {assignment.requirement_id || 'REQ-DEV-01'}</span>
              {assignment.target_date && <span>Target Date: <strong className="text-slate-200">{assignment.target_date}</strong></span>}
            </div>
          </div>

          {/* Header Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap shrink-0">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/25 flex items-center gap-2 transition-all cursor-pointer"
            >
              <GitPullRequest size={14} />
              <span>Submit Work (Review/QA)</span>
            </button>

            <button
              onClick={() => setIsBlockerModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-rose-500/30 text-rose-300 hover:bg-rose-500/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <AlertOctagon size={14} className="text-rose-400" />
              <span>Report Blocker</span>
            </button>

            <button
              onClick={() => setIsClarificationModalOpen(true)}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <HelpCircle size={14} className="text-indigo-400" />
              <span>Ask PM</span>
            </button>
          </div>
        </div>

        {/* Quick Git & Branch Banner */}
        <div className="pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-mono text-cyan-300">
              <GitBranch size={13} className="text-cyan-400" />
              {assignment.branch_name || `feature/${assignment.requirement_id?.toLowerCase() || 'impl'}`}
            </span>
            {assignment.pr_url && (
              <a
                href={assignment.pr_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-slate-300 hover:text-white underline font-mono text-[11px]"
              >
                <GitPullRequest size={12} className="text-cyan-400" />
                <span>Pull Request</span>
                <ExternalLink size={10} />
              </a>
            )}
          </div>
          <div className="text-[11px] text-slate-500">
            Assigned to Developer • Role-isolated review gate
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/[0.08] pb-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('requirements')}
          className={`px-4 py-2 rounded-t-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'requirements'
              ? 'border-cyan-500 text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <CheckSquare size={14} />
          <span>Requirements & Criteria</span>
        </button>

        <button
          onClick={() => setActiveTab('prd_context')}
          className={`px-4 py-2 rounded-t-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'prd_context'
              ? 'border-blue-500 text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FileText size={14} />
          <span>PRD Overview & Scope</span>
        </button>

        <button
          onClick={() => setActiveTab('customer_evidence')}
          className={`px-4 py-2 rounded-t-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'customer_evidence'
              ? 'border-emerald-500 text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles size={14} />
          <span>Customer Feedback & Insights</span>
        </button>

        <button
          onClick={() => setActiveTab('design')}
          className={`px-4 py-2 rounded-t-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'design'
              ? 'border-purple-500 text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Layers size={14} />
          <span>Design Handoff & Specs</span>
        </button>

        <button
          onClick={() => setActiveTab('implementation')}
          className={`px-4 py-2 rounded-t-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'implementation'
              ? 'border-cyan-500 text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FolderGit2 size={14} />
          <span>Developer Response & Status</span>
        </button>

        <button
          onClick={() => setActiveTab('submissions')}
          className={`px-4 py-2 rounded-t-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'submissions'
              ? 'border-amber-500 text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <GitPullRequest size={14} />
          <span>Submissions & Revisions ({submissions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('defects')}
          className={`px-4 py-2 rounded-t-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-2 border-b-2 ${
            activeTab === 'defects'
              ? 'border-rose-500 text-white bg-slate-900/50'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Bug size={14} />
          <span>QA Defects ({defects.length})</span>
        </button>
      </div>

      {/* TAB CONTENT */}

      {/* 1. Requirements & Acceptance Criteria */}
      {activeTab === 'requirements' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <CheckSquare size={16} className="text-cyan-400" />
              Functional & Technical Requirements
            </h3>

            <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs space-y-2">
              <div className="text-slate-200 font-semibold text-sm">
                {requirement?.title || assignment.feature_title || 'Core Requirement'}
              </div>
              <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                {requirement?.description || assignment.notes || 'Implement approved functional requirements with robust unit tests and idempotent handling.'}
              </p>
            </div>

            {/* Acceptance Criteria List */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Authoritative Acceptance Criteria Checklist
              </h4>
              {requirement?.acceptance_criteria && Array.isArray(requirement.acceptance_criteria) && requirement.acceptance_criteria.length > 0 ? (
                <div className="space-y-2">
                  {requirement.acceptance_criteria.map((crit, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.05] text-xs text-slate-300 flex items-start gap-3"
                    >
                      <input
                        type="checkbox"
                        id={`crit-${idx}`}
                        className="mt-0.5 w-4 h-4 rounded text-cyan-500 bg-slate-800 border-white/[0.2] cursor-pointer"
                      />
                      <label htmlFor={`crit-${idx}`} className="cursor-pointer select-none leading-relaxed flex-1">
                        {crit}
                      </label>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-900/40 border border-white/[0.05] text-xs text-slate-400 space-y-2">
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span>API endpoint returns standard error payload with HTTP 400 on malformed payloads.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span>Idempotency-Key header is enforced and duplicate submissions within 5 minutes return cached result.</span>
                  </div>
                  <div className="flex items-start gap-2.5">
                    <CheckCircle2 size={15} className="text-cyan-400 shrink-0 mt-0.5" />
                    <span>Unit test coverage exceeds 85% for business logic layer.</span>
                  </div>
                </div>
              )}
            </div>

            {/* Non-Functional Requirements */}
            <div className="space-y-2 pt-2 border-t border-white/[0.06]">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Non-Functional Performance & Security Constraints
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.05] space-y-1">
                  <span className="font-semibold text-slate-200">Latency & SLA</span>
                  <p className="text-slate-400">p95 response time &lt; 250ms under 500 concurrent req/sec.</p>
                </div>
                <div className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.05] space-y-1">
                  <span className="font-semibold text-slate-200">Security & Authentication</span>
                  <p className="text-slate-400">Strict Bearer token validation and workspace RBAC enforcement on all routes.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. PRD Overview & Scope Tab */}
      {activeTab === 'prd_context' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-5">
            <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
              <div>
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/40 px-2 py-0.5 rounded border border-blue-800/40">
                  {prd?.prd_id || 'PRD'}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {prd?.title || 'Parent Product Requirements Document'}
                </h3>
                <p className="text-xs text-slate-400">
                  Version: <strong className="text-slate-200">{prd?.version || 'v1.0'}</strong> • Status: <strong className="text-emerald-400">{prd?.status || 'APPROVED'}</strong>
                </p>
              </div>
            </div>

            {/* Problem Statement & Background */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
                <span className="font-semibold text-rose-300 flex items-center gap-1.5">
                  <AlertTriangle size={14} />
                  Problem Statement & Context
                </span>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {typeof prd?.problem_statement === 'string'
                    ? prd.problem_statement
                    : prd?.problem_statement?.primary_problem ||
                      'Customer complaints demonstrate critical friction in this flow. The engineering task addresses this validated user friction directly.'}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
                <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                  <Sparkles size={14} />
                  Proposed Solution & Goals
                </span>
                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap">
                  {typeof prd?.proposed_solution === 'string'
                    ? prd.proposed_solution
                    : prd?.customer_need ||
                      'Deliver automated, idempotent processing and clear client-side validation to eliminate failures and enhance product reliability.'}
                </p>
              </div>
            </div>

            {/* Scope (In-Scope & Out-of-Scope) */}
            {prd?.scope && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                  <span className="font-semibold text-emerald-300 flex items-center gap-1.5">
                    <CheckCircle2 size={14} />
                    In-Scope Deliverables
                  </span>
                  <ul className="space-y-1 text-slate-300 list-disc pl-4">
                    {Array.isArray(prd.scope.in_scope)
                      ? prd.scope.in_scope.map((item, idx) => <li key={idx}>{item}</li>)
                      : <li>{String(prd.scope.in_scope || 'Approved functional specifications')}</li>}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2">
                  <span className="font-semibold text-slate-400 flex items-center gap-1.5">
                    <AlertOctagon size={14} />
                    Out-of-Scope (Do Not Build)
                  </span>
                  <ul className="space-y-1 text-slate-400 list-disc pl-4">
                    {Array.isArray(prd.scope.out_of_scope)
                      ? prd.scope.out_of_scope.map((item, idx) => <li key={idx}>{item}</li>)
                      : <li>{String(prd.scope.out_of_scope || 'Legacy migration not included')}</li>}
                  </ul>
                </div>
              </div>
            )}

            {/* User Stories */}
            {detailData?.user_stories && detailData.user_stories.length > 0 && (
              <div className="space-y-2.5 pt-2 border-t border-white/[0.06]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Target User Stories & Scenarios
                </h4>
                <div className="space-y-2">
                  {detailData.user_stories.map((st, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/40 border border-white/[0.05] text-xs space-y-1">
                      <div className="font-mono text-cyan-400 text-[11px] font-bold">
                        {st.story_id || `US-0${idx + 1}`}
                      </div>
                      <p className="text-slate-200">
                        <strong>As a</strong> {st.as_a || 'user'}, <strong>I want to</strong> {st.i_want || st.title}, <strong>so that</strong> {st.so_that || 'I can achieve my objective smoothly'}.
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Customer Evidence & Insights Tab */}
      {activeTab === 'customer_evidence' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-4">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Sparkles size={16} className="text-emerald-400" />
                Raw Customer Feedback & Ground Truth Evidence
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Real customer feedback from MongoDB that motivated this engineering requirement.
              </p>
            </div>

            {detailData?.raw_customer_evidence && detailData.raw_customer_evidence.length > 0 ? (
              <div className="space-y-3">
                {detailData.raw_customer_evidence.map((fb, idx) => (
                  <div
                    key={fb.feedback_id || idx}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-[11px] text-cyan-400 font-bold">
                          {fb.feedback_id || `FB-${idx + 1}`}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                          {fb.source || 'Customer Review'}
                        </span>
                        {fb.sentiment && (
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                            fb.sentiment.toLowerCase() === 'negative'
                              ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-300'
                          }`}>
                            {fb.sentiment}
                          </span>
                        )}
                        {fb.device && (
                          <span className="text-[10px] text-slate-400 font-mono">
                            {fb.device}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-slate-500">{fb.date_str || fb.created_at || 'Recent'}</span>
                    </div>

                    <p className="text-slate-200 leading-relaxed italic bg-slate-950/40 p-3 rounded-lg border border-white/[0.04]">
                      "{fb.text || fb.feedback || 'User reported friction during checkout.'}"
                    </p>

                    {fb.key_issues && Array.isArray(fb.key_issues) && fb.key_issues.length > 0 && (
                      <div className="flex items-center gap-1.5 flex-wrap text-[11px] text-slate-400 pt-1">
                        <span className="text-slate-500">Key issues:</span>
                        {fb.key_issues.map((iss, i) => (
                          <span key={i} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                            {iss}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs">
                No direct raw customer reviews attached to this requirement ID.
              </div>
            )}
          </div>
        </div>
      )}

      {/* 4. Design Handoff & Specs */}
      {activeTab === 'design' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers size={16} className="text-purple-400" />
                Approved Design Specifications & Figma Handoff
              </h3>
              {design_handoff?.figma_url && (
                <a
                  href={design_handoff.figma_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                >
                  <span>Open in Figma</span>
                  <ExternalLink size={12} />
                </a>
              )}
            </div>

            {design_handoff ? (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] text-xs space-y-2">
                  <span className="font-semibold text-slate-300">Designer Interaction Notes:</span>
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {design_handoff.specs || design_handoff.response || 'Design specs approved by Product Designer.'}
                  </p>
                </div>

                {design_handoff.prototype_url && (
                  <div className="p-3 rounded-xl bg-slate-900/40 border border-white/[0.05] text-xs flex items-center justify-between">
                    <span className="text-slate-400">Interactive Prototype:</span>
                    <a
                      href={design_handoff.prototype_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 underline flex items-center gap-1"
                    >
                      <span>{design_handoff.prototype_url}</span>
                      <ExternalLink size={12} />
                    </a>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-6 rounded-xl bg-slate-900/40 border border-white/[0.05] text-center text-xs text-slate-400 space-y-2">
                <p>No separate design handoff is attached to this requirement.</p>
                <p className="text-[11px] text-slate-500">
                  Follow standard ProdAI UI guidelines and theme color variables.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 3. Code & Progress Updates */}
      {activeTab === 'implementation' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Status Update Card */}
          <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Play size={16} className="text-cyan-400" />
              Update Assignment Status
            </h3>

            {statusSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle2 size={15} />
                <span>{statusSuccess}</span>
              </div>
            )}

            <form onSubmit={handleUpdateStatus} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Workflow Status
                </label>
                <select
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-white/[0.08] rounded-xl text-white focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  <option value="PENDING">PENDING</option>
                  <option value="IN_PROGRESS">IN_PROGRESS</option>
                  <option value="IN_REVIEW">IN_REVIEW (Requires Submission)</option>
                  <option value="BLOCKED">BLOCKED</option>
                  <option value="COMPLETED">COMPLETED (Approved)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1.5">
                  Progress Notes / Work Log
                </label>
                <textarea
                  rows={3}
                  value={progressNote}
                  onChange={(e) => setProgressNote(e.target.value)}
                  placeholder="e.g. Implemented customer validation handler, added pytest unit tests..."
                  className="w-full px-3.5 py-2 bg-slate-900 border border-white/[0.08] rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={updatingStatus}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                {updatingStatus ? (
                  <span>Updating...</span>
                ) : (
                  <>
                    <Send size={13} />
                    <span>Save Status Change</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Code References Card */}
          <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <FileCode size={16} className="text-cyan-400" />
              Code & Repository References
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.05] space-y-1">
                <span className="text-slate-400 block text-[11px]">Git Branch:</span>
                <span className="font-mono text-cyan-300 font-semibold">
                  {assignment.branch_name || 'Not specified'}
                </span>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.05] space-y-1">
                <span className="text-slate-400 block text-[11px]">Pull Request URL:</span>
                {assignment.pr_url ? (
                  <a
                    href={assignment.pr_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 underline font-mono break-all"
                  >
                    {assignment.pr_url}
                  </a>
                ) : (
                  <span className="text-slate-500 italic">No PR linked yet</span>
                )}
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.05] space-y-1">
                <span className="text-slate-400 block text-[11px]">Repository:</span>
                <span className="text-slate-200">
                  {assignment.repository_url || 'Internal Repository'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Submissions & Revisions */}
      {activeTab === 'submissions' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <GitPullRequest size={16} className="text-cyan-400" />
                  Implementation Submissions & Revision History
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Immutable audit records of code submitted for review and QA verification.
                </p>
              </div>

              <button
                onClick={() => setIsSubmitModalOpen(true)}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-md shadow-cyan-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <GitPullRequest size={14} />
                <span>New Submission</span>
              </button>
            </div>

            {submissions.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                No formal implementation submissions logged yet. Click "New Submission" when your code is ready.
              </div>
            ) : (
              <div className="space-y-3">
                {submissions.map((sub, idx) => (
                  <div
                    key={sub.submission_id || idx}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-cyan-400">
                          Revision #{sub.revision_number || (submissions.length - idx)}
                        </span>
                        <span className="text-slate-400">by {sub.submitted_by || 'Developer'}</span>
                      </div>
                      <span className="text-slate-500 text-[11px]">{sub.created_at}</span>
                    </div>

                    <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                      {sub.implementation_notes}
                    </p>

                    <div className="flex items-center gap-4 text-[11px] text-slate-400 flex-wrap pt-1 border-t border-white/[0.04]">
                      {sub.branch_name && (
                        <span className="font-mono text-cyan-300">Branch: {sub.branch_name}</span>
                      )}
                      {sub.pr_url && (
                        <a
                          href={sub.pr_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-cyan-400 underline font-mono"
                        >
                          PR Link
                        </a>
                      )}
                      {sub.commit_sha && (
                        <span className="font-mono text-slate-400">Commit: {sub.commit_sha}</span>
                      )}
                      {sub.flag_for_qa_retest && (
                        <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-semibold border border-emerald-500/30">
                          QA Retest Routed
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* 5. QA Defects */}
      {activeTab === 'defects' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Bug size={16} className="text-rose-400" />
              Defects Logged by QA
            </h3>

            {defects.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">
                Zero defects logged for this assignment! All acceptance criteria verified clean.
              </div>
            ) : (
              <div className="space-y-3">
                {defects.map((def) => (
                  <div
                    key={def.defect_id}
                    className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.06] space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-rose-400">{def.defect_id}</span>
                        <span className="font-semibold text-white">{def.title}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {def.severity || 'HIGH'}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-white/[0.06]">
                          {def.status || 'OPEN'}
                        </span>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedDefect(def);
                          setIsDefectModalOpen(true);
                        }}
                        className="px-3 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Bug size={12} />
                        <span>Submit Fix</span>
                      </button>
                    </div>

                    <p className="text-slate-300 leading-relaxed">{def.description}</p>

                    {def.reproduction_steps && (
                      <div className="p-2.5 rounded bg-slate-950/70 text-slate-300 font-mono text-[11px] whitespace-pre-wrap">
                        {def.reproduction_steps}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      <SubmitImplementationModal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        task={assignment}
        workspaceId={workspaceId}
        onSaved={fetchDetail}
      />

      <SubmitDefectFixModal
        isOpen={isDefectModalOpen}
        onClose={() => setIsDefectModalOpen(false)}
        defect={selectedDefect}
        workspaceId={workspaceId}
        onSaved={fetchDetail}
      />

      <ReportBlockerModal
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        task={assignment}
        workspaceId={workspaceId}
        onSaved={fetchDetail}
      />

      <RequestClarificationModal
        isOpen={isClarificationModalOpen}
        onClose={() => setIsClarificationModalOpen(false)}
        task={assignment}
        workspaceId={workspaceId}
        onSaved={fetchDetail}
      />
    </div>
  );
}

