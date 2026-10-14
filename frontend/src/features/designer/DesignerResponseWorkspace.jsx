import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertOctagon,
  Sparkles,
  Send,
  AlertTriangle,
  FileText,
  ExternalLink,
  Layers,
  Palette,
  CheckSquare,
  Link as LinkIcon,
  Plus,
  Trash2,
  Save,
  MessageSquare,
  HelpCircle,
  History,
  RotateCcw,
  ShieldCheck,
  Code,
  Layout,
  Check,
  AlertCircle,
  Eye,
  Loader2
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import { isProductManager, getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';

export default function DesignerResponseWorkspace() {
  const { workspaceId, assignmentId } = useParams();
  const navigate = useNavigate();
  const isPmUser = isProductManager();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const [task, setTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Tab state: 'submission' | 'deliverables' | 'feedback' | 'clarification' | 'blocker' | 'history'
  const [activeTab, setActiveTab] = useState('submission');

  // Form State
  const [status, setStatus] = useState('IN_PROGRESS');
  const [response, setResponse] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [prototypeUrl, setPrototypeUrl] = useState('');
  const [handoffNotes, setHandoffNotes] = useState('');
  const [accessibilityNotes, setAccessibilityNotes] = useState('');
  const [responsiveNotes, setResponsiveNotes] = useState('');
  const [revisionResponse, setRevisionResponse] = useState('');
  const [deliverables, setDeliverables] = useState([]);

  // PM Review Decision Form State
  const [pmDecision, setPmDecision] = useState('APPROVED');
  const [pmReviewComments, setPmReviewComments] = useState('');
  const [pmSubmittingReview, setPmSubmittingReview] = useState(false);

  // Blocker Form State
  const [blockerTitle, setBlockerTitle] = useState('');
  const [blockerDesc, setBlockerDesc] = useState('');
  const [blockerCategory, setBlockerCategory] = useState('MISSING_REQUIREMENTS');
  const [blockerImpact, setBlockerImpact] = useState('HIGH');
  const [submittingBlocker, setSubmittingBlocker] = useState(false);

  // Clarification Form State
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [clarificationContext, setClarificationContext] = useState('');
  const [submittingClarification, setSubmittingClarification] = useState(false);

  // Histories & Logs
  const [submissionsHistory, setSubmissionsHistory] = useState([]);
  const [reviewsHistory, setReviewsHistory] = useState([]);
  const [blockersList, setBlockersList] = useState([]);
  const [clarificationsList, setClarificationsList] = useState([]);

  // Action status
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch Task Detail & Histories
  const fetchTaskDetail = async () => {
    if (!workspaceId || !assignmentId) return;
    setLoading(true);
    setLoadError(null);
    try {
      const data = await designerApi.getAssignmentDetail(workspaceId, assignmentId);
      if (!data) {
        throw new Error(`Assignment ${assignmentId} not found`);
      }
      setTask(data);
      setStatus(data.status || 'IN_PROGRESS');
      setResponse(data.response || '');
      setFigmaUrl(data.figma_url || '');
      setPrototypeUrl(data.prototype_url || '');
      setHandoffNotes(data.handoff_notes || '');
      setAccessibilityNotes(data.accessibility_notes || '');
      setResponsiveNotes(data.responsive_notes || '');
      setDeliverables(
        data.deliverables && data.deliverables.length > 0
          ? [...data.deliverables]
          : [
              {
                deliverable_id: 'deliv-1',
                title: 'Primary Figma Flow',
                deliverable_type: 'FIGMA_FILE',
                url: data.figma_url || '',
                description: 'High-fidelity screens, component autolayouts and token specs',
              },
            ]
      );

      // Load histories in parallel
      const aid = data.assignment_id || assignmentId;
      const [subs, revs, blks, clrs] = await Promise.allSettled([
        designerApi.getSubmissions(workspaceId, aid),
        designerApi.getReviews(workspaceId, aid),
        designerApi.getBlockers(workspaceId, aid),
        designerApi.getClarifications(workspaceId, aid),
      ]);

      if (subs.status === 'fulfilled' && Array.isArray(subs.value)) setSubmissionsHistory(subs.value);
      if (revs.status === 'fulfilled' && Array.isArray(revs.value)) setReviewsHistory(revs.value);
      if (blks.status === 'fulfilled' && Array.isArray(blks.value)) setBlockersList(blks.value);
      if (clrs.status === 'fulfilled' && Array.isArray(clrs.value)) setClarificationsList(clrs.value);

      if (data.status === 'REVISION_REQUESTED') {
        setActiveTab('feedback');
      }
    } catch (err) {
      console.warn('Error loading assignment workspace:', err);
      setLoadError(err.message || 'Failed to load design assignment details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetail();
  }, [workspaceId, assignmentId]);

  // Handlers
  const handleAddDeliverable = () => {
    setDeliverables([
      ...deliverables,
      {
        deliverable_id: `deliv-${Date.now()}`,
        title: '',
        deliverable_type: 'FIGMA_FILE',
        url: '',
        description: '',
      },
    ]);
  };

  const handleRemoveDeliverable = (idx) => {
    setDeliverables(deliverables.filter((_, i) => i !== idx));
  };

  const handleUpdateDeliverable = (idx, field, val) => {
    const copy = [...deliverables];
    copy[idx][field] = val;
    setDeliverables(copy);
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg('');
    try {
      const payload = {
        status: 'IN_PROGRESS',
        response: response.trim() || 'Work in progress draft.',
        figma_url: figmaUrl.trim() || null,
        prototype_url: prototypeUrl.trim() || null,
        deliverables: deliverables.filter((d) => d.url && d.title),
        handoff_notes: handoffNotes.trim() || null,
        accessibility_notes: accessibilityNotes.trim() || null,
        responsive_notes: responsiveNotes.trim() || null,
        is_draft: true,
      };

      const updated = await designerApi.submitResponse(workspaceId, assignmentId, payload);
      setTask(updated);
      setSuccessMsg('Draft saved successfully to workspace.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async (e) => {
    if (e) e.preventDefault();
    if (!response.trim()) {
      setErrorMsg('Please provide design specifications or interaction rationale before submitting.');
      setActiveTab('submission');
      return;
    }

    const validDelivs = deliverables.filter((d) => d.url && d.url.trim().length > 0);
    for (const d of validDelivs) {
      if (!d.url.startsWith('http://') && !d.url.startsWith('https://')) {
        setErrorMsg(`Deliverable "${d.title || 'Asset'}" must have a valid URL starting with https://`);
        setActiveTab('deliverables');
        return;
      }
    }

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg('');

    try {
      const payload = {
        status: 'SUBMITTED_FOR_REVIEW',
        response: response.trim(),
        figma_url: figmaUrl.trim() || (validDelivs.find((d) => d.deliverable_type === 'FIGMA_FILE')?.url || null),
        prototype_url: prototypeUrl.trim() || (validDelivs.find((d) => d.deliverable_type === 'PROTOTYPE')?.url || null),
        deliverables: validDelivs,
        handoff_notes: handoffNotes.trim() || null,
        accessibility_notes: accessibilityNotes.trim() || null,
        responsive_notes: responsiveNotes.trim() || null,
        revision_response: revisionResponse.trim() || null,
        is_draft: false,
      };

      const updated = await designerApi.submitResponse(workspaceId, assignmentId, payload);
      setTask(updated);
      setStatus('SUBMITTED_FOR_REVIEW');
      setSuccessMsg('Design deliverables submitted successfully for Product Manager review!');
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit design response.');
    } finally {
      setSaving(false);
    }
  };

  const handlePmSubmitReview = async (e) => {
    if (e) e.preventDefault();
    if (!pmReviewComments.trim()) {
      setErrorMsg('Please provide review comments or revision requirements.');
      return;
    }
    setPmSubmittingReview(true);
    setErrorMsg(null);
    try {
      const updated = await designerApi.reviewSubmission(workspaceId, assignmentId, {
        decision: pmDecision,
        comments: pmReviewComments.trim(),
        deliverable_ids: deliverables.map((d) => d.deliverable_id || d.title).filter(Boolean),
      });
      setTask(updated);
      setStatus(updated.status);
      setSuccessMsg(`Review decision (${pmDecision.replace('_', ' ')}) recorded successfully!`);
      setPmReviewComments('');
      const revs = await designerApi.getReviews(workspaceId, assignmentId);
      setReviewsHistory(Array.isArray(revs) ? revs : []);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit review decision');
    } finally {
      setPmSubmittingReview(false);
    }
  };

  const handleReportBlocker = async (e) => {
    if (e) e.preventDefault();
    if (!blockerTitle.trim() || !blockerDesc.trim()) {
      setErrorMsg('Please provide both a title and description for the blocker.');
      return;
    }
    setSubmittingBlocker(true);
    setErrorMsg(null);
    try {
      await designerApi.reportBlocker(workspaceId, assignmentId, {
        title: blockerTitle.trim(),
        description: blockerDesc.trim(),
        category: blockerCategory,
        impact: blockerImpact,
      });
      setSuccessMsg('Blocker reported successfully.');
      setBlockerTitle('');
      setBlockerDesc('');
      const blks = await designerApi.getBlockers(workspaceId, assignmentId);
      setBlockersList(Array.isArray(blks) ? blks : []);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to report blocker');
    } finally {
      setSubmittingBlocker(false);
    }
  };

  const handleRequestClarification = async (e) => {
    if (e) e.preventDefault();
    if (!clarificationQuestion.trim()) {
      setErrorMsg('Please enter your clarification question.');
      return;
    }
    setSubmittingClarification(true);
    setErrorMsg(null);
    try {
      await designerApi.requestClarification(workspaceId, assignmentId, {
        question: clarificationQuestion.trim(),
        context: clarificationContext.trim() || undefined,
      });
      setSuccessMsg('Clarification request sent to the product team.');
      setClarificationQuestion('');
      setClarificationContext('');
      const clrs = await designerApi.getClarifications(workspaceId, assignmentId);
      setClarificationsList(Array.isArray(clrs) ? clrs : []);
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit clarification question');
    } finally {
      setSubmittingClarification(false);
    }
  };

  const getStatusBadge = (st) => {
    const s = String(st || 'NOT_STARTED').toUpperCase();
    if (s === 'COMPLETED') {
      return (
        <span className="text-xs bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 size={13} className="text-emerald-400" /> Completed
        </span>
      );
    }
    if (s === 'SUBMITTED_FOR_REVIEW') {
      return (
        <span className="text-xs bg-purple-500/15 text-purple-300 border border-purple-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
          <Clock size={13} className="text-purple-400" /> Submitted for Review
        </span>
      );
    }
    if (s === 'REVISION_REQUESTED') {
      return (
        <span className="text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
          <AlertTriangle size={13} className="text-amber-400" /> Revision Requested
        </span>
      );
    }
    if (s === 'BLOCKED') {
      return (
        <span className="text-xs bg-rose-500/20 text-rose-300 border border-rose-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
          <AlertOctagon size={13} className="text-rose-400" /> Blocked
        </span>
      );
    }
    return (
      <span className="text-xs bg-blue-500/15 text-blue-300 border border-blue-500/30 px-3 py-1 rounded-full font-bold flex items-center gap-1.5 shadow-sm">
        <Clock size={13} className="text-blue-400" /> In Progress
      </span>
    );
  };

  if (loading) {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center gap-4 text-slate-400 font-sans">
        <div className="w-10 h-10 rounded-full border-3 border-purple-500 border-t-transparent animate-spin" />
        <span className="text-sm font-medium">Loading Design Response Workspace...</span>
      </div>
    );
  }

  if (loadError || !task) {
    return (
      <div className="w-full max-w-4xl mx-auto py-12 px-4 text-center font-sans space-y-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
          <AlertCircle size={28} />
        </div>
        <h2 className="text-xl font-bold text-white">Design Assignment Not Found</h2>
        <p className="text-xs text-slate-400 max-w-md mx-auto">{loadError || 'The requested assignment could not be loaded.'}</p>
        <Link
          to={`/workspace/${workspaceId}/designer/assignments`}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
        >
          <ArrowLeft size={14} /> Back to Design Assignments
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-24 max-w-7xl mx-auto">
      {/* Toast Notification Banner */}
      {successMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-emerald-950/95 border border-emerald-500/40 text-emerald-200 text-xs font-semibold shadow-2xl animate-in slide-in-from-top-2">
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} className="ml-2 text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {errorMsg && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-rose-950/95 border border-rose-500/40 text-rose-200 text-xs font-semibold shadow-2xl animate-in slide-in-from-top-2">
          <AlertCircle size={16} className="text-rose-400 shrink-0" />
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-2 text-slate-400 hover:text-white">&times;</button>
        </div>
      )}

      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 flex-wrap">
            <Link
              to={`/workspace/${workspaceId}/designer/assignments`}
              className="inline-flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 font-semibold transition-colors bg-purple-500/10 hover:bg-purple-500/20 px-2.5 py-1 rounded-lg border border-purple-500/20 mr-2"
            >
              <ArrowLeft size={13} />
              <span>Back to Assignments</span>
            </Link>
            <span className="text-[11px] font-mono text-slate-400">
              {task.prd_id || 'PRD'}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-[11px] font-mono text-purple-400 font-bold bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
              {task.requirement_id || 'REQ'}
            </span>
            <span className="text-slate-600">/</span>
            <span className="text-[11px] font-semibold text-slate-300 uppercase tracking-wider">
              {task.requirement_type || 'User Experience'}
            </span>
            <span className="text-slate-600">/</span>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
              (task.priority || 'HIGH').toUpperCase() === 'CRITICAL'
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                : (task.priority || 'HIGH').toUpperCase() === 'HIGH'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : (task.priority || 'HIGH').toUpperCase() === 'MEDIUM'
                ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                : 'bg-slate-500/20 text-slate-300 border-slate-500/40'
            }`}>
              {task.priority || 'HIGH'} Priority
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight pt-1">
            {task.requirement_title || task.requirement_id}
          </h1>
          <p className="text-xs text-slate-400">
            {task.prd_title || 'Product Requirement Document'} • Version {task.prd_version || 'v1.0'}
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {getStatusBadge(status)}
          {figmaUrl && (
            <a
              href={figmaUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-xs font-semibold text-purple-300 flex items-center gap-1.5 transition-all"
            >
              <ExternalLink size={13} />
              <span>Open in Figma</span>
            </a>
          )}
        </div>
      </div>

      {/* Full Page Tab Navigation Bar */}
      <div className="flex items-center gap-2 border-b border-[#182034] bg-[#0c1020] px-4 pt-2.5 rounded-2xl shadow-lg overflow-x-auto scrollbar-hide text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('submission')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'submission'
              ? 'border-purple-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Send size={14} className={activeTab === 'submission' ? 'text-purple-400' : ''} />
          <span>Design Submission</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('deliverables')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'deliverables'
              ? 'border-purple-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers size={14} className={activeTab === 'deliverables' ? 'text-purple-400' : ''} />
          <span>Deliverables & Assets ({deliverables.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('evidence')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'evidence'
              ? 'border-purple-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText size={14} className={activeTab === 'evidence' ? 'text-purple-400' : ''} />
          <span>Raw Data & Customer Evidence</span>
          {task.raw_data_quotes && task.raw_data_quotes.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {task.raw_data_quotes.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('feedback')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap relative ${
            activeTab === 'feedback'
              ? 'border-purple-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare size={14} className={activeTab === 'feedback' ? 'text-purple-400' : ''} />
          <span>Review Feedback</span>
          {reviewsHistory.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-purple-500/20 text-purple-300 font-mono">
              {reviewsHistory.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('clarification')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'clarification'
              ? 'border-purple-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle size={14} className={activeTab === 'clarification' ? 'text-purple-400' : ''} />
          <span>Ask Clarification</span>
          {clarificationsList.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 font-mono">
              {clarificationsList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('blocker')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'blocker'
              ? 'border-rose-500 text-rose-300 font-bold'
              : 'border-transparent text-slate-400 hover:text-rose-300'
          }`}
        >
          <AlertOctagon size={14} className={activeTab === 'blocker' ? 'text-rose-400' : ''} />
          <span>Report Blocker</span>
          {blockersList.length > 0 && (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-500/20 text-rose-300 font-mono">
              {blockersList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('history')}
          className={`pb-3 px-3.5 border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'history'
              ? 'border-purple-500 text-white font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History size={14} className={activeTab === 'history' ? 'text-purple-400' : ''} />
          <span>Revisions & History ({submissionsHistory.length})</span>
        </button>
      </div>

      {/* Tab 1: Design Submission */}
      {activeTab === 'submission' && (
        <div className="space-y-6">
          {/* PRD Intelligence & Acceptance Requirements Card */}
          <div className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2">
                <FileText size={16} className="text-purple-400" />
                <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                  PRD Requirement Context & Acceptance Criteria (From MongoDB)
                </h3>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                (task.priority || 'HIGH').toUpperCase() === 'CRITICAL'
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : (task.priority || 'HIGH').toUpperCase() === 'HIGH'
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : 'bg-blue-500/20 text-blue-300 border-blue-500/40'
              }`}>
                {task.priority || 'HIGH'} Priority
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1.5 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Customer Problem Context</span>
                <p className="text-slate-200 leading-relaxed">{task.problem_statement || 'Identified customer friction in workflow.'}</p>
                {task.customer_impact && (
                  <p className="text-[11px] text-purple-300 pt-1 font-medium">Customer Impact: {task.customer_impact}</p>
                )}
              </div>

              <div className="space-y-1.5 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Designer Role Guidance</span>
                <p className="text-slate-300 leading-relaxed">{task.role_responsibility || 'Design UI flows, interaction states, wireframes, and accessibility guidelines.'}</p>
              </div>
            </div>

            {/* Acceptance Criteria */}
            {task.acceptance_criteria && task.acceptance_criteria.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Acceptance Criteria to Fix & Hand Off ({task.acceptance_criteria.length})
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {task.acceptance_criteria.map((crit, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-purple-500/[0.04] border border-purple-500/15 text-xs text-slate-300">
                      <CheckCircle2 size={14} className="text-purple-400 shrink-0 mt-0.5" />
                      <span>{crit}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* User Stories */}
            {task.user_stories && task.user_stories.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  User Stories
                </span>
                <div className="space-y-1.5">
                  {task.user_stories.map((story, sIdx) => (
                    <p key={sIdx} className="text-xs text-slate-400 italic bg-white/[0.02] p-2.5 rounded-lg border border-white/[0.04]">
                      "{story}"
                    </p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Current Status Box */}
          <div className="p-4 rounded-2xl bg-[#0b101b] border border-[#1e2744] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
            <div>
              <span className="font-bold text-white text-xs block">Current Status</span>
              <span className="text-[11px] text-slate-400">
                {status === 'SUBMITTED_FOR_REVIEW'
                  ? 'Awaiting Product Manager review and acceptance.'
                  : status === 'REVISION_REQUESTED'
                  ? 'Action Required: Revisions requested by Product Manager.'
                  : status === 'COMPLETED'
                  ? 'Approved & handoff finalized for engineering.'
                  : 'Design drafting in progress.'}
              </span>
            </div>
            <div className="shrink-0">{getStatusBadge(status)}</div>
          </div>

          {/* UX Specifications & Flow Notes */}
          <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-5 shadow-xl space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>UX Specifications, Flow Notes & Rationale</span>
                <span className="text-rose-400">*</span>
              </label>
              <span className="text-[10px] text-slate-400 font-mono">Markdown supported</span>
            </div>
            <textarea
              rows={8}
              value={response}
              onChange={(e) => setResponse(e.target.value)}
              placeholder="Detail your interaction flow, mobile breakpoints, accessibility considerations, empty/error state layouts, design tokens, and wireframe architecture..."
              className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500 font-mono leading-relaxed"
            />
          </div>

          {/* Figma and Prototype Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-4 space-y-2 shadow-md">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Palette size={14} className="text-purple-400" />
                  <span>Figma File / Frame URL</span>
                </span>
                {figmaUrl && (
                  <a
                    href={figmaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    Launch <ExternalLink size={10} />
                  </a>
                )}
              </label>
              <input
                type="url"
                value={figmaUrl}
                onChange={(e) => setFigmaUrl(e.target.value)}
                placeholder="https://figma.com/file/..."
                className="w-full bg-[#111827] border border-[#223048] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-4 space-y-2 shadow-md">
              <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <LinkIcon size={14} className="text-blue-400" />
                  <span>Interactive Prototype URL</span>
                </span>
                {prototypeUrl && (
                  <a
                    href={prototypeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
                  >
                    Test Flow <ExternalLink size={10} />
                  </a>
                )}
              </label>
              <input
                type="url"
                value={prototypeUrl}
                onChange={(e) => setPrototypeUrl(e.target.value)}
                placeholder="https://figma.com/proto/... or https://prototype.com/..."
                className="w-full bg-[#111827] border border-[#223048] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500 font-mono"
              />
            </div>
          </div>

          {/* Accessibility & Responsive Considerations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-4 space-y-2 shadow-md">
              <label className="text-xs font-bold text-slate-300 block">
                Accessibility Notes (WCAG 2.1 AA)
              </label>
              <input
                type="text"
                value={accessibilityNotes}
                onChange={(e) => setAccessibilityNotes(e.target.value)}
                placeholder="Focus traps, aria-live regions, contrast ratios, keyboard navigation order..."
                className="w-full bg-[#111827] border border-[#223048] rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500"
              />
            </div>

            <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-4 space-y-2 shadow-md">
              <label className="text-xs font-bold text-slate-300 block">
                Responsive Breakpoint Considerations
              </label>
              <input
                type="text"
                value={responsiveNotes}
                onChange={(e) => setResponsiveNotes(e.target.value)}
                placeholder="320px mobile drawer, 768px tablet, 1440px desktop fluid grid..."
                className="w-full bg-[#111827] border border-[#223048] rounded-xl px-3 py-2.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Developer & QA Handoff Notes */}
          <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-4 space-y-2 shadow-md">
            <label className="text-xs font-bold text-slate-300 block">
              Developer & QA Handoff Notes
            </label>
            <textarea
              rows={3}
              value={handoffNotes}
              onChange={(e) => setHandoffNotes(e.target.value)}
              placeholder="Engineering constraints, Framer Motion transition curves, API response expectations, skeleton loader states..."
              className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-purple-500 font-mono"
            />
          </div>

          {/* Revision Response Notes (if revision requested) */}
          {status === 'REVISION_REQUESTED' && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 space-y-2">
              <label className="text-xs font-bold text-amber-300 block flex items-center gap-1.5">
                <RotateCcw size={14} />
                <span>Revision Changelog / PM Response Notes</span>
              </label>
              <textarea
                rows={3}
                value={revisionResponse}
                onChange={(e) => setRevisionResponse(e.target.value)}
                placeholder="Explain the changes made in response to PM feedback (e.g. Added secondary payment retry option, widened mobile click target)..."
                className="w-full bg-[#111827] border border-amber-500/30 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-amber-400"
              />
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Deliverables & Assets */}
      {activeTab === 'deliverables' && (
        <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-[#182034] pb-4">
            <div>
              <h3 className="text-sm font-bold text-white">Deliverable Assets & Spec Files</h3>
              <p className="text-xs text-slate-400">
                Attach high-fidelity designs, component tokens, interactive flows, or design system assets.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddDeliverable}
              className="px-3 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/25 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus size={14} />
              <span>Add Deliverable</span>
            </button>
          </div>

          <div className="space-y-3">
            {deliverables.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 italic bg-[#111827]/50 rounded-xl border border-[#223048]">
                No deliverables added yet. Click "Add Deliverable" to attach Figma or prototype links.
              </div>
            ) : (
              deliverables.map((deliv, idx) => (
                <div
                  key={deliv.deliverable_id || idx}
                  className="bg-[#111827] border border-[#223048] rounded-xl p-4 space-y-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <input
                      type="text"
                      value={deliv.title}
                      onChange={(e) => handleUpdateDeliverable(idx, 'title', e.target.value)}
                      placeholder="Title (e.g. Primary Checkout Modal)"
                      className="bg-[#0b101b] border border-[#1e2744] rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-purple-500 font-semibold"
                    />

                    <select
                      value={deliv.deliverable_type}
                      onChange={(e) => handleUpdateDeliverable(idx, 'deliverable_type', e.target.value)}
                      className="bg-[#0b101b] border border-[#1e2744] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500 cursor-pointer"
                    >
                      <option value="FIGMA_FILE">Figma File / Design Token Spec</option>
                      <option value="PROTOTYPE">Interactive Prototype</option>
                      <option value="WIREFRAME">Low-Fi Wireframe</option>
                      <option value="DESIGN_SYSTEM">Design System Component</option>
                      <option value="EXPORT_ASSETS">Exported Assets (SVG/PNG)</option>
                    </select>

                    <div className="flex items-center gap-2">
                      <input
                        type="url"
                        value={deliv.url}
                        onChange={(e) => handleUpdateDeliverable(idx, 'url', e.target.value)}
                        placeholder="https://figma.com/..."
                        className="flex-1 bg-[#0b101b] border border-[#1e2744] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveDeliverable(idx)}
                        className="p-2 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>

                  <input
                    type="text"
                    value={deliv.description || ''}
                    onChange={(e) => handleUpdateDeliverable(idx, 'description', e.target.value)}
                    placeholder="Short description, variant states, or handoff considerations..."
                    className="w-full bg-[#0b101b] border border-[#1e2744] rounded-xl px-3 py-2 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-purple-500"
                  />
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab: Raw Data & Customer Evidence */}
      {activeTab === 'evidence' && (
        <div className="space-y-6">
          <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-6 shadow-xl space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#182034] pb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Database size={16} className="text-cyan-400" />
                  <span>Customer Evidence & Raw Feedback Data</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Direct user complaints, raw support quotes, and telemetry linked to requirement <span className="text-purple-300 font-mono font-semibold">{task.requirement_id}</span> from MongoDB.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('submission')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-500/20 transition-all cursor-pointer self-start sm:self-auto"
              >
                <Sparkles size={14} />
                <span>Fix Issue & Submit Design</span>
              </button>
            </div>

            {/* Requirement Problem Statement & Impact */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#111827] border border-[#223048] rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Identified User Pain Point
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {task.problem_statement || task.requirement_description || 'No direct problem description recorded in PRD.'}
                </p>
              </div>
              <div className="bg-[#111827] border border-[#223048] rounded-xl p-4 space-y-2">
                <span className="text-[11px] font-bold text-purple-400 uppercase tracking-wider block">
                  Customer & Business Impact
                </span>
                <p className="text-xs text-slate-200 leading-relaxed font-sans">
                  {task.customer_impact || 'Reduces friction, improves conversion, and resolves key UX drop-offs.'}
                </p>
              </div>
            </div>

            {/* Verbatim Customer Quotes / Raw Quotes */}
            <div className="space-y-3">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-2">
                <MessageSquare size={14} className="text-cyan-400" />
                <span>Verbatim User Quotes & Direct Feedback</span>
                <span className="text-[10px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full border border-cyan-500/20 font-mono">
                  {task.raw_data_quotes && task.raw_data_quotes.length > 0 ? task.raw_data_quotes.length : 'PRD Context'}
                </span>
              </span>

              {task.raw_data_quotes && task.raw_data_quotes.length > 0 ? (
                <div className="grid grid-cols-1 gap-3">
                  {task.raw_data_quotes.map((quote, idx) => (
                    <div
                      key={idx}
                      className="bg-[#111827]/80 border border-cyan-500/20 rounded-xl p-4 flex items-start gap-3 hover:border-cyan-500/40 transition-colors"
                    >
                      <span className="text-cyan-400 font-serif text-2xl leading-none select-none">“</span>
                      <p className="text-xs text-slate-200 italic leading-relaxed pt-1">
                        {quote}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-[#111827] border border-[#223048] rounded-xl p-5 text-center space-y-2">
                  <p className="text-xs text-slate-400 italic">
                    "{task.requirement_description || task.problem_statement || 'User encounters friction during this workflow and requested a clearer, modern UI layout.'}"
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Source: Verified PRD requirement synthesis from user feedback.
                  </p>
                </div>
              )}
            </div>

            {/* Supporting Research & Behavioral Insights */}
            {task.supporting_insights && task.supporting_insights.length > 0 && (
              <div className="space-y-3">
                <span className="text-xs font-bold text-slate-200 block">
                  Supporting Behavioral & Quantitative Insights
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {task.supporting_insights.map((insight, idx) => (
                    <div key={idx} className="bg-[#111827] border border-[#223048] rounded-xl p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-200">{insight.title || `Insight #${idx + 1}`}</span>
                        {insight.source && (
                          <span className="text-[10px] text-purple-400 font-mono bg-purple-500/10 px-1.5 py-0.5 rounded">
                            {insight.source}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed">
                        {insight.description || insight.summary || JSON.stringify(insight)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Link back to Customer Feedback Hub */}
            <div className="flex items-center justify-between pt-2 border-t border-[#182034] text-xs">
              <Link
                to={`/workspace/${workspaceId}/designer/customer-feedback`}
                className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center gap-1.5"
              >
                <span>Browse Full Customer Feedback Explorer</span>
                <ArrowRight size={13} />
              </Link>
              <button
                type="button"
                onClick={() => setActiveTab('submission')}
                className="text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1.5"
              >
                <span>Ready to Submit Design Specs</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Review Feedback */}
      {activeTab === 'feedback' && (
        <div className="space-y-6">
          {/* PM Review Form (visible if PM user or review requested) */}
          {isPmUser && (
            <div className="bg-[#0b101b] border border-purple-500/30 rounded-2xl p-5 shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#182034] pb-3">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <ShieldCheck size={16} className="text-purple-400" />
                  <span>Product Manager Review Decision</span>
                </span>
                <span className="text-[10px] text-purple-300 bg-purple-500/10 px-2 py-0.5 rounded font-mono">
                  PM Privilege Mode
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-300 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="APPROVED"
                      checked={pmDecision === 'APPROVED'}
                      onChange={() => setPmDecision('APPROVED')}
                    />
                    <span>Approve Deliverables</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold text-amber-300 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="REVISION_REQUESTED"
                      checked={pmDecision === 'REVISION_REQUESTED'}
                      onChange={() => setPmDecision('REVISION_REQUESTED')}
                    />
                    <span>Request Revisions</span>
                  </label>
                </div>

                <textarea
                  rows={3}
                  value={pmReviewComments}
                  onChange={(e) => setPmReviewComments(e.target.value)}
                  placeholder="Provide review findings, acceptance criteria confirmation, or specific required changes..."
                  className="w-full bg-[#111827] border border-[#223048] rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-purple-500"
                />

                <button
                  type="button"
                  disabled={pmSubmittingReview}
                  onClick={handlePmSubmitReview}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  {pmSubmittingReview ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  <span>Submit Review Decision</span>
                </button>
              </div>
            </div>
          )}

          {/* Past Review History */}
          <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white">Review Decisions & PM Feedback</h3>
            {reviewsHistory.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 italic bg-[#111827]/40 rounded-xl">
                No formal PM review decisions recorded yet.
              </div>
            ) : (
              <div className="space-y-3">
                {reviewsHistory.map((rev, rIdx) => (
                  <div key={rIdx} className="bg-[#111827] border border-[#223048] rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">
                        Reviewed by: {rev.reviewed_by || rev.reviewer_name || 'Product Manager'}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          rev.decision === 'APPROVED'
                            ? 'bg-emerald-500/20 text-emerald-300'
                            : 'bg-amber-500/20 text-amber-300'
                        }`}
                      >
                        {rev.decision}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300">{rev.comments}</p>
                    <span className="text-[10px] text-slate-500 font-mono block">
                      {rev.created_at ? new Date(rev.created_at).toLocaleString() : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Ask Clarification */}
      {activeTab === 'clarification' && (
        <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white">Ask Clarification on PRD & UX Requirements</h3>
            <p className="text-xs text-slate-400">
              Submit questions directly to the Product Manager or Technical Architect.
            </p>
          </div>

          <form onSubmit={handleRequestClarification} className="space-y-3 bg-[#111827] border border-[#223048] p-4 rounded-xl">
            <input
              type="text"
              value={clarificationQuestion}
              onChange={(e) => setClarificationQuestion(e.target.value)}
              placeholder="e.g. Should the payment retry button auto-focus on viewport load?"
              className="w-full bg-[#0b101b] border border-[#1e2744] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-purple-500 font-semibold"
            />
            <textarea
              rows={2}
              value={clarificationContext}
              onChange={(e) => setClarificationContext(e.target.value)}
              placeholder="Additional context, user story reference, or edge case scenario..."
              className="w-full bg-[#0b101b] border border-[#1e2744] rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-purple-500"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingClarification}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {submittingClarification ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                <span>Send Question</span>
              </button>
            </div>
          </form>

          {/* Past Clarifications */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300">Question Thread ({clarificationsList.length})</h4>
            {clarificationsList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 italic bg-[#111827]/40 rounded-xl">
                No clarification questions posted yet.
              </div>
            ) : (
              clarificationsList.map((c, i) => (
                <div key={i} className="bg-[#111827] border border-[#223048] rounded-xl p-3.5 space-y-1.5">
                  <span className="text-xs font-bold text-white block">{c.question}</span>
                  {c.context && <p className="text-[11px] text-slate-400">{c.context}</p>}
                  {c.response && (
                    <div className="p-2.5 bg-[#0b101b] rounded-lg border border-purple-500/20 text-xs text-purple-200 mt-2">
                      <span className="font-bold block text-[10px] text-purple-400">Response:</span>
                      {c.response}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Report Blocker */}
      {activeTab === 'blocker' && (
        <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-6 shadow-xl space-y-6">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertOctagon size={16} className="text-rose-400" />
              <span>Report Design / Technical Blocker</span>
            </h3>
            <p className="text-xs text-slate-400">
              Flag dependencies, missing acceptance criteria, or technical blockers halting UX progress.
            </p>
          </div>

          <form onSubmit={handleReportBlocker} className="space-y-3 bg-[#111827] border border-[#223048] p-4 rounded-xl">
            <input
              type="text"
              value={blockerTitle}
              onChange={(e) => setBlockerTitle(e.target.value)}
              placeholder="Blocker Title (e.g. Missing error response schema from payment gateway)"
              className="w-full bg-[#0b101b] border border-[#1e2744] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-rose-500 font-semibold"
            />
            <div className="grid grid-cols-2 gap-3">
              <select
                value={blockerCategory}
                onChange={(e) => setBlockerCategory(e.target.value)}
                className="bg-[#0b101b] border border-[#1e2744] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="MISSING_REQUIREMENTS">Missing Requirements / Specs</option>
                <option value="TECHNICAL_DEPENDENCY">Technical / API Dependency</option>
                <option value="DESIGN_SYSTEM">Design System / Asset Gap</option>
                <option value="STAKEHOLDER_ALIGNMENT">Stakeholder Alignment</option>
              </select>

              <select
                value={blockerImpact}
                onChange={(e) => setBlockerImpact(e.target.value)}
                className="bg-[#0b101b] border border-[#1e2744] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-rose-500 cursor-pointer"
              >
                <option value="HIGH">High Impact (Work Blocked)</option>
                <option value="MEDIUM">Medium Impact (Degraded Progress)</option>
                <option value="LOW">Low Impact (Informational)</option>
              </select>
            </div>

            <textarea
              rows={2.5}
              value={blockerDesc}
              onChange={(e) => setBlockerDesc(e.target.value)}
              placeholder="Detailed description of what is blocking delivery and what is needed to unblock..."
              className="w-full bg-[#0b101b] border border-[#1e2744] rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-rose-500"
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submittingBlocker}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {submittingBlocker ? <Loader2 size={13} className="animate-spin" /> : <AlertOctagon size={13} />}
                <span>Report Blocker</span>
              </button>
            </div>
          </form>

          {/* Past Blockers */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-slate-300">Reported Blockers ({blockersList.length})</h4>
            {blockersList.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-500 italic bg-[#111827]/40 rounded-xl">
                No active blockers reported.
              </div>
            ) : (
              blockersList.map((b, i) => (
                <div key={i} className="bg-[#111827] border border-rose-500/20 rounded-xl p-3.5 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-rose-300">{b.title}</span>
                    <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
                      {b.impact || 'HIGH'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{b.description}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 6: Revisions & Audit Trail */}
      {activeTab === 'history' && (
        <div className="bg-[#0b101b] border border-[#1e2744] rounded-2xl p-6 shadow-xl space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <History size={16} className="text-purple-400" />
            <span>Submission & Revision Audit History</span>
          </h3>
          {submissionsHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic bg-[#111827]/40 rounded-xl">
              No historical submission snapshots found for this requirement.
            </div>
          ) : (
            <div className="space-y-3">
              {submissionsHistory.map((sub, i) => (
                <div key={i} className="bg-[#111827] border border-[#223048] rounded-xl p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">
                      Revision #{sub.revision_number || (submissionsHistory.length - i)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : ''}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 font-mono whitespace-pre-wrap line-clamp-3">
                    {sub.response || 'No notes provided'}
                  </p>
                  {sub.figma_url && (
                    <a
                      href={sub.figma_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono"
                    >
                      Snapshot Figma <ExternalLink size={10} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#0b101b]/95 border-t border-[#182034] backdrop-blur-xl px-6 py-4 flex items-center justify-between shadow-2xl">
        <div className="flex items-center gap-2">
          <Link
            to={`/workspace/${workspaceId}/designer/assignments`}
            className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#223048] text-xs font-semibold transition-colors"
          >
            Cancel / Back
          </Link>
          <button
            type="button"
            disabled={saving}
            onClick={handleSaveDraft}
            className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-purple-600/20 text-slate-300 hover:text-purple-300 border border-[#223048] hover:border-purple-500/40 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Save size={14} />
            <span>Save Draft</span>
          </button>
        </div>

        <button
          type="button"
          disabled={saving}
          onClick={handleSubmitForReview}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-purple-600/30 disabled:opacity-50"
        >
          {saving ? (
            <>
              <Loader2 size={14} className="animate-spin" />
              <span>Submitting...</span>
            </>
          ) : (
            <>
              <Send size={14} />
              <span>Submit for PM Review</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

