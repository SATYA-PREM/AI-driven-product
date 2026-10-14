import React, { useState, useEffect } from 'react';
import {
  X,
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
  ShieldCheck
} from 'lucide-react';
import { designerApi } from '../../../api/designer';
import { isProductManager, getCurrentUser } from '../../../utils/workspaceAccess';
import { useNavigate } from 'react-router-dom';

export default function DesignResponseModal({
  isOpen,
  onClose,
  task,
  workspaceId,
  onSaved,
  initialTab = 'submission'
}) {
  const navigate = useNavigate();
  const isPmUser = isProductManager();
  const currentUser = getCurrentUser();

  const [activeTab, setActiveTab] = useState(initialTab || 'submission'); // submission | deliverables | feedback | blocker | clarification | history
  const [status, setStatus] = useState('IN_PROGRESS');
  const [response, setResponse] = useState('');
  const [figmaUrl, setFigmaUrl] = useState('');
  const [prototypeUrl, setPrototypeUrl] = useState('');
  const [handoffNotes, setHandoffNotes] = useState('');
  const [accessibilityNotes, setAccessibilityNotes] = useState('');
  const [responsiveNotes, setResponsiveNotes] = useState('');
  const [revisionResponse, setRevisionResponse] = useState('');
  const [blockerComment, setBlockerComment] = useState('');
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

  // Clarification Form State
  const [clarificationQuestion, setClarificationQuestion] = useState('');
  const [clarificationContext, setClarificationContext] = useState('');

  // History & Review Data
  const [submissionsHistory, setSubmissionsHistory] = useState([]);
  const [reviewsHistory, setReviewsHistory] = useState([]);
  const [blockersList, setBlockersList] = useState([]);
  const [clarificationsList, setClarificationsList] = useState([]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen && task) {
      setStatus(task.status || 'IN_PROGRESS');
      setResponse(task.response || '');
      setFigmaUrl(task.figma_url || '');
      setPrototypeUrl(task.prototype_url || '');
      setHandoffNotes(task.handoff_notes || '');
      setAccessibilityNotes(task.accessibility_notes || '');
      setResponsiveNotes(task.responsive_notes || '');
      setRevisionResponse('');
      setBlockerComment(task.blocker_comment || '');
      setDeliverables(task.deliverables && task.deliverables.length > 0 ? [...task.deliverables] : [
        {
          deliverable_id: 'deliv-1',
          title: 'Primary Figma Flow',
          deliverable_type: 'FIGMA_FILE',
          url: task.figma_url || '',
          description: 'High-fidelity screens, component autolayouts and token specs'
        }
      ]);
      setError(null);
      setSuccessMsg('');
      setActiveTab(initialTab || (task.status === 'REVISION_REQUESTED' ? 'feedback' : 'submission'));

      // Load histories
      const aid = task.assignment_id || task.id;
      if (aid && workspaceId) {
        designerApi.getSubmissions(workspaceId, aid)
          .then(res => setSubmissionsHistory(Array.isArray(res) ? res : []))
          .catch(() => setSubmissionsHistory([]));

        designerApi.getReviews(workspaceId, aid)
          .then(res => setReviewsHistory(Array.isArray(res) ? res : []))
          .catch(() => setReviewsHistory([]));

        designerApi.getBlockers(workspaceId, aid)
          .then(res => setBlockersList(Array.isArray(res) ? res : []))
          .catch(() => setBlockersList([]));

        designerApi.getClarifications(workspaceId, aid)
          .then(res => setClarificationsList(Array.isArray(res) ? res : []))
          .catch(() => setClarificationsList([]));
      }
    }
  }, [isOpen, task, workspaceId, initialTab]);

  const handlePmSubmitReview = async (e) => {
    if (e) e.preventDefault();
    if (!pmReviewComments.trim()) {
      setError('Please provide review comments or revision requirements.');
      return;
    }
    setPmSubmittingReview(true);
    setError(null);
    try {
      const aid = task.assignment_id || task.id;
      await designerApi.reviewSubmission(workspaceId, aid, {
        decision: pmDecision,
        comments: pmReviewComments.trim(),
        deliverable_ids: deliverables.map(d => d.deliverable_id || d.title).filter(Boolean)
      });
      setSuccessMsg(`Review decision (${pmDecision.replace('_', ' ')}) recorded successfully!`);
      setPmReviewComments('');
      const revs = await designerApi.getReviews(workspaceId, aid);
      setReviewsHistory(Array.isArray(revs) ? revs : []);
      if (onSaved) onSaved();
    } catch (err) {
      setError(err.message || 'Failed to submit review decision');
    } finally {
      setPmSubmittingReview(false);
    }
  };

  if (!isOpen || !task) return null;

  const handleAddDeliverable = () => {
    setDeliverables([
      ...deliverables,
      {
        deliverable_id: `deliv-${Date.now()}`,
        title: '',
        deliverable_type: 'FIGMA_FILE',
        url: '',
        description: ''
      }
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
    setError(null);
    setSuccessMsg('');
    try {
      const payload = {
        status: 'IN_PROGRESS',
        response: response.trim() || 'Work in progress draft.',
        figma_url: figmaUrl.trim() || null,
        prototype_url: prototypeUrl.trim() || null,
        deliverables: deliverables.filter(d => d.url && d.title),
        handoff_notes: handoffNotes.trim() || null,
        accessibility_notes: accessibilityNotes.trim() || null,
        responsive_notes: responsiveNotes.trim() || null,
        is_draft: true,
      };

      const updated = await designerApi.submitResponse(
        workspaceId,
        task.assignment_id || task.id,
        payload
      );

      setSuccessMsg('Draft saved successfully to workspace.');
      if (onSaved) onSaved(updated);
    } catch (err) {
      setError(err.message || 'Failed to save draft.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitForReview = async (e) => {
    e.preventDefault();
    if (!response.trim()) {
      setError('Please provide design specifications or interaction rationale before submitting.');
      setActiveTab('submission');
      return;
    }

    // URL validation on deliverables
    const validDelivs = deliverables.filter(d => d.url && d.url.trim().length > 0);
    for (const d of validDelivs) {
      if (!d.url.startsWith('http://') && !d.url.startsWith('https://')) {
        setError(`Deliverable "${d.title || 'Asset'}" must have a valid URL starting with https://`);
        setActiveTab('deliverables');
        return;
      }
    }

    setSaving(true);
    setError(null);
    setSuccessMsg('');

    try {
      const payload = {
        status: 'SUBMITTED_FOR_REVIEW',
        response: response.trim(),
        figma_url: figmaUrl.trim() || (validDelivs.find(d => d.deliverable_type === 'FIGMA_FILE')?.url || null),
        prototype_url: prototypeUrl.trim() || (validDelivs.find(d => d.deliverable_type === 'PROTOTYPE')?.url || null),
        deliverables: validDelivs,
        handoff_notes: handoffNotes.trim() || null,
        accessibility_notes: accessibilityNotes.trim() || null,
        responsive_notes: responsiveNotes.trim() || null,
        revision_response: revisionResponse.trim() || null,
        is_draft: false,
      };

      const updated = await designerApi.submitResponse(
        workspaceId,
        task.assignment_id || task.id,
        payload
      );

      setSuccessMsg('Design deliverables submitted for Product Manager review!');
      if (onSaved) onSaved(updated);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err) {
      setError(err.message || 'Failed to submit design response. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleReportBlocker = async (e) => {
    e.preventDefault();
    if (!blockerTitle.trim() || !blockerDesc.trim()) {
      setError('Please enter a blocker title and explanation.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await designerApi.reportBlocker(workspaceId, task.assignment_id || task.id, {
        title: blockerTitle.trim(),
        description: blockerDesc.trim(),
        category: blockerCategory,
        impact: blockerImpact,
      });
      setSuccessMsg('Blocker reported and assignment marked as Blocked.');
      if (onSaved) onSaved();
      setTimeout(() => onClose(), 1200);
    } catch (err) {
      setError(err.message || 'Failed to report blocker.');
    } finally {
      setSaving(false);
    }
  };

  const handleRequestClarification = async (e) => {
    e.preventDefault();
    if (!clarificationQuestion.trim()) {
      setError('Please enter your clarification question.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await designerApi.requestClarification(workspaceId, task.assignment_id || task.id, {
        question: clarificationQuestion.trim(),
        context_notes: clarificationContext.trim() || null,
        priority: 'HIGH',
      });
      setSuccessMsg('Clarification request sent to the Product Manager!');
      setClarificationQuestion('');
      setClarificationContext('');
      // refresh clarifications
      const clrs = await designerApi.getClarifications(workspaceId, task.assignment_id || task.id);
      setClarificationsList(Array.isArray(clrs) ? clrs : []);
    } catch (err) {
      setError(err.message || 'Failed to send clarification request.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0e1b] border border-[#1d253b] w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200 font-sans">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#182034] bg-[#0e1222] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400 shrink-0">
              <Palette size={20} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                  {task.requirement_id || 'REQ'}
                </span>
                <span className="text-xs text-purple-300 font-medium truncate max-w-[200px]">
                  {task.prd_title || 'PRD'}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full border border-purple-500/30 bg-purple-500/10 text-purple-300 font-semibold">
                  v{task.prd_version || '1.0'}
                </span>
              </div>
              <h2 className="text-sm font-bold text-white truncate mt-0.5">
                {task.requirement_title || 'UX Task Deliverables & Response'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const id = task.assignment_id || task.id || task.requirement_id;
                if (id) {
                  onClose();
                  navigate(`/workspace/${workspaceId}/designer/assignments/${id}?tab=${activeTab}`);
                }
              }}
              className="px-2.5 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Open full page workspace"
            >
              <ExternalLink size={13} />
              <span className="hidden sm:inline">Full Page View</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-white/[0.05] transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-[#182034] bg-[#0c1020] overflow-x-auto scrollbar-hide shrink-0 text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('submission')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'submission'
                ? 'border-purple-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Send size={13} />
            <span>Design Submission</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('deliverables')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'deliverables'
                ? 'border-purple-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers size={13} />
            <span>Deliverables ({deliverables.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('feedback')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'feedback'
                ? 'border-purple-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <MessageSquare size={13} />
            <span>Review Feedback {reviewsHistory.length > 0 && `(${reviewsHistory.length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clarification')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'clarification'
                ? 'border-purple-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <HelpCircle size={13} />
            <span>Ask Clarification</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('blocker')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'blocker'
                ? 'border-rose-500 text-rose-300 font-bold'
                : 'border-transparent text-slate-400 hover:text-rose-300'
            }`}
          >
            <AlertOctagon size={13} />
            <span>Report Blocker</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'history'
                ? 'border-purple-500 text-white font-bold'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <History size={13} />
            <span>Revisions ({submissionsHistory.length})</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* TAB 1: DESIGN SUBMISSION */}
          {activeTab === 'submission' && (
            <div className="space-y-5">
              {/* Context Summary */}
              {task.problem_statement && (
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Customer Problem / UX Focus
                  </span>
                  <p className="text-slate-300 leading-relaxed">{task.problem_statement}</p>
                </div>
              )}

              {/* Status Banner */}
              <div className="p-3.5 rounded-xl bg-[#101527] border border-[#1e2744] flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-white block">Current Status</span>
                  <span className="text-[11px] text-slate-400">
                    {task.status === 'SUBMITTED_FOR_REVIEW' ? 'Under Review by Product Manager' :
                     task.status === 'REVISION_REQUESTED' ? 'Revision Requested by PM' :
                     task.status === 'COMPLETED' ? 'Approved & Handed Off' : 'In Progress'}
                  </span>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${
                  task.status === 'COMPLETED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                  task.status === 'REVISION_REQUESTED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                  task.status === 'BLOCKED' ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' :
                  'bg-purple-500/20 text-purple-300 border-purple-500/30'
                }`}>
                  {task.status}
                </span>
              </div>

              {/* Revision Response (if revision requested) */}
              {task.status === 'REVISION_REQUESTED' && (
                <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                    <RotateCcw size={14} />
                    <span>Response to Requested Revisions</span>
                  </div>
                  {task.review_comments && (
                    <p className="text-xs text-amber-200/80 italic bg-black/20 p-2 rounded-lg">
                      PM Feedback: "{task.review_comments}"
                    </p>
                  )}
                  <textarea
                    rows={2}
                    value={revisionResponse}
                    onChange={(e) => setRevisionResponse(e.target.value)}
                    placeholder="Describe how requested changes were resolved in this new revision..."
                    className="w-full bg-[#151221] border border-amber-500/30 rounded-lg p-2.5 text-xs text-amber-100 placeholder-amber-300/40 focus:outline-none focus:border-amber-400"
                  />
                </div>
              )}

              {/* Specifications & Interaction Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
                  <span>UX Specifications, Flow Notes & Rationale <span className="text-rose-400">*</span></span>
                  <span className="text-[10px] text-slate-500 font-mono">Markdown supported</span>
                </label>
                <textarea
                  rows={5}
                  value={response}
                  onChange={(e) => setResponse(e.target.value)}
                  placeholder="Detail your interaction flow, mobile breakpoints, accessibility considerations, empty/error state layouts, and design tokens..."
                  className="w-full bg-[#101527] border border-[#212b45] rounded-xl p-3.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors leading-relaxed font-sans"
                />
              </div>

              {/* Handoff & Architecture Notes */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Accessibility Notes (WCAG 2.1 AA)
                  </label>
                  <input
                    type="text"
                    value={accessibilityNotes}
                    onChange={(e) => setAccessibilityNotes(e.target.value)}
                    placeholder="Focus traps, aria-live regions, contrast ratios..."
                    className="w-full bg-[#101527] border border-[#212b45] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Responsive Breakpoint Considerations
                  </label>
                  <input
                    type="text"
                    value={responsiveNotes}
                    onChange={(e) => setResponsiveNotes(e.target.value)}
                    placeholder="320px mobile drawer, 768px tablet, 1440px desktop..."
                    className="w-full bg-[#101527] border border-[#212b45] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Developer & QA Handoff Notes
                </label>
                <textarea
                  rows={2}
                  value={handoffNotes}
                  onChange={(e) => setHandoffNotes(e.target.value)}
                  placeholder="Engineering constraints, Framer Motion transition curves, API response expectations..."
                  className="w-full bg-[#101527] border border-[#212b45] rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
              </div>
            </div>
          )}

          {/* TAB 2: DELIVERABLES */}
          {activeTab === 'deliverables' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
                <div>
                  <h3 className="text-xs font-bold text-white">Attached Design Deliverables</h3>
                  <p className="text-[11px] text-slate-400">Link external Figma files, prototypes, wireframes or asset packages.</p>
                </div>
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus size={13} />
                  <span>Add Deliverable</span>
                </button>
              </div>

              {deliverables.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  No deliverables attached yet. Click "Add Deliverable" to attach Figma or prototype links.
                </div>
              ) : (
                <div className="space-y-3">
                  {deliverables.map((d, idx) => (
                    <div key={d.deliverable_id || idx} className="p-3.5 rounded-xl bg-[#101527] border border-[#1e2744] space-y-2.5">
                      <div className="flex items-center justify-between gap-3">
                        <input
                          type="text"
                          value={d.title}
                          onChange={(e) => handleUpdateDeliverable(idx, 'title', e.target.value)}
                          placeholder="Deliverable Title (e.g. Mobile Checkout Prototype)"
                          className="flex-1 bg-[#151c33] border border-[#2a375e] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        <select
                          value={d.deliverable_type}
                          onChange={(e) => handleUpdateDeliverable(idx, 'deliverable_type', e.target.value)}
                          className="bg-[#151c33] border border-[#2a375e] rounded-lg px-2.5 py-1.5 text-xs text-purple-300 font-semibold focus:outline-none cursor-pointer"
                        >
                          <option value="FIGMA_FILE">Figma File</option>
                          <option value="PROTOTYPE">Interactive Prototype</option>
                          <option value="WIREFRAME">Wireframe</option>
                          <option value="SPECIFICATION">Spec Document</option>
                          <option value="USER_FLOW">User Flow</option>
                          <option value="ASSET">Asset Package</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRemoveDeliverable(idx)}
                          className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                          title="Remove deliverable"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <LinkIcon size={13} className="text-purple-400 shrink-0" />
                        <input
                          type="url"
                          value={d.url}
                          onChange={(e) => handleUpdateDeliverable(idx, 'url', e.target.value)}
                          placeholder="https://figma.com/file/... or https://..."
                          className="flex-1 bg-[#151c33] border border-[#2a375e] rounded-lg px-2.5 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                        />
                        {d.url && (
                          <a
                            href={d.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-purple-300 hover:text-white"
                            title="Open link"
                          >
                            <ExternalLink size={13} />
                          </a>
                        )}
                      </div>

                      <input
                        type="text"
                        value={d.description || ''}
                        onChange={(e) => handleUpdateDeliverable(idx, 'description', e.target.value)}
                        placeholder="Description (e.g. Artboard 4 to 12 covers the error recovery flow)"
                        className="w-full bg-[#151c33] border border-[#2a375e] rounded-lg px-2.5 py-1 text-xs text-slate-400 placeholder-slate-600 focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: REVIEW FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-white/[0.06]">
                <h3 className="text-xs font-bold text-white">Product Manager Review Decisions & Critique</h3>
                <p className="text-[11px] text-slate-400">Review historical approval comments and revision requirements from PM.</p>
              </div>

              {/* PM Review Form (Only visible to PM / Admin) */}
              {isPmUser && (
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="text-purple-400" size={16} />
                      <h4 className="text-xs font-bold text-white">Evaluate & Review UX Deliverables</h4>
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 font-mono">
                      PM Review Authority
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    Review the designer's submitted Figma assets, user flows, and interaction specs. Approve to complete the UX stage or request revisions.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Review Decision <span className="text-rose-400">*</span>
                      </label>
                      <select
                        value={pmDecision}
                        onChange={(e) => setPmDecision(e.target.value)}
                        className="w-full bg-[#101527] border border-[#212b45] rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                      >
                        <option value="APPROVED">Approve (Mark Complete & Ready for Dev Handoff)</option>
                        <option value="REVISION_REQUESTED">Request Revisions (Return to Designer with Feedback)</option>
                        <option value="REJECTED">Reject / Block (Halt Design with Blocker)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Deliverables Verified
                      </label>
                      <div className="px-3 py-2 rounded-xl bg-[#101527] border border-[#212b45] text-xs text-slate-300 flex items-center gap-2">
                        <CheckSquare size={14} className="text-purple-400" />
                        <span>{deliverables.length} Deliverable(s) attached</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                      Review Comments & Critique <span className="text-rose-400">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={pmReviewComments}
                      onChange={(e) => setPmReviewComments(e.target.value)}
                      placeholder="e.g. Excellent interaction flow on desktop. Please add empty states and error toast specs for checkout failure..."
                      className="w-full bg-[#101527] border border-[#212b45] rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handlePmSubmitReview}
                    disabled={pmSubmittingReview}
                    className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all cursor-pointer flex items-center gap-2 shadow-lg disabled:opacity-50 ${
                      pmDecision === 'APPROVED'
                        ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30'
                        : pmDecision === 'REVISION_REQUESTED'
                        ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/30'
                        : 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30'
                    }`}
                  >
                    {pmSubmittingReview ? (
                      <>
                        <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        <span>Recording Review...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={14} />
                        <span>Submit Review Decision</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {reviewsHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  No formal review feedback recorded yet. Once submitted, PM decisions will appear here.
                </div>
              ) : (
                <div className="space-y-3">
                  {reviewsHistory.map((rev) => (
                    <div key={rev.review_id} className="p-4 rounded-xl bg-[#101527] border border-[#1e2744] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          rev.decision === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' :
                          rev.decision === 'REVISION_REQUESTED' ? 'bg-amber-500/20 text-amber-300 border-amber-500/30' :
                          'bg-rose-500/20 text-rose-300 border-rose-500/30'
                        }`}>
                          {rev.decision.replace('_', ' ')}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {rev.created_at ? new Date(rev.created_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed font-sans">{rev.comments}</p>
                      <div className="text-[10px] text-slate-400 pt-1 border-t border-white/[0.04]">
                        Reviewer: <span className="text-slate-300 font-semibold">{rev.reviewed_by}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: ASK CLARIFICATION */}
          {activeTab === 'clarification' && (
            <div className="space-y-5">
              <div className="pb-2 border-b border-white/[0.06]">
                <h3 className="text-xs font-bold text-white">Ask Requirement Clarification</h3>
                <p className="text-[11px] text-slate-400">Request context or guidance from the Product Manager without halting your work.</p>
              </div>

              <form onSubmit={handleRequestClarification} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Your Clarification Question <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={2}
                    value={clarificationQuestion}
                    onChange={(e) => setClarificationQuestion(e.target.value)}
                    placeholder="e.g. Is payment retry expected to support Apple Pay / Google Pay web fallback?"
                    className="w-full bg-[#101527] border border-[#212b45] rounded-xl p-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Supporting Context Notes (Optional)
                  </label>
                  <input
                    type="text"
                    value={clarificationContext}
                    onChange={(e) => setClarificationContext(e.target.value)}
                    placeholder="Referencing section 3.2 in PRD..."
                    className="w-full bg-[#101527] border border-[#212b45] rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Send Clarification Question</span>
                </button>
              </form>

              {clarificationsList.length > 0 && (
                <div className="pt-3 border-t border-white/[0.06] space-y-2">
                  <h4 className="text-[11px] font-bold uppercase text-slate-400">Recent Questions</h4>
                  {clarificationsList.map(c => (
                    <div key={c.clarification_id} className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-1">
                      <p className="font-semibold text-slate-200">{c.question}</p>
                      {c.answer ? (
                        <p className="text-emerald-400 text-[11px] bg-emerald-500/10 p-2 rounded">
                          PM Answer: {c.answer}
                        </p>
                      ) : (
                        <span className="text-[10px] text-amber-400 font-mono">Awaiting PM Answer</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: REPORT BLOCKER */}
          {activeTab === 'blocker' && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-white/[0.06]">
                <h3 className="text-xs font-bold text-rose-300">Report an Unresolved Blocker</h3>
                <p className="text-[11px] text-slate-400">Stop work on this requirement and notify the Product Manager with an explicit blocker reason.</p>
              </div>

              <form onSubmit={handleReportBlocker} className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Blocker Title <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={blockerTitle}
                    onChange={(e) => setBlockerTitle(e.target.value)}
                    placeholder="e.g. Missing checkout error payload API contract"
                    className="w-full bg-[#101527] border border-rose-500/30 rounded-xl px-3 py-2 text-xs text-rose-200 placeholder-rose-300/40 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Blocker Category</label>
                    <select
                      value={blockerCategory}
                      onChange={(e) => setBlockerCategory(e.target.value)}
                      className="w-full bg-[#101527] border border-[#212b45] rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
                    >
                      <option value="MISSING_REQUIREMENTS">Missing Requirements</option>
                      <option value="CONFLICTING_REQUIREMENTS">Conflicting Requirements</option>
                      <option value="MISSING_CUSTOMER_CONTEXT">Missing Customer Context</option>
                      <option value="TECHNICAL_DEPENDENCY">Technical Dependency</option>
                      <option value="ACCESS_PERMISSIONS">Access & Permissions</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1">Impact Level</label>
                    <select
                      value={blockerImpact}
                      onChange={(e) => setBlockerImpact(e.target.value)}
                      className="w-full bg-[#101527] border border-[#212b45] rounded-xl px-3 py-2 text-xs text-rose-300 font-bold focus:outline-none cursor-pointer"
                    >
                      <option value="CRITICAL">Critical (Total Halt)</option>
                      <option value="HIGH">High Impact</option>
                      <option value="MEDIUM">Medium Impact</option>
                      <option value="LOW">Low Impact</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Blocker Explanation & Assistance Needed <span className="text-rose-400">*</span>
                  </label>
                  <textarea
                    rows={3}
                    value={blockerDesc}
                    onChange={(e) => setBlockerDesc(e.target.value)}
                    placeholder="Describe what is preventing design completion and what decision is needed from PM..."
                    className="w-full bg-[#101527] border border-rose-500/30 rounded-xl p-3 text-xs text-rose-200 placeholder-rose-300/40 focus:outline-none focus:border-rose-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                >
                  <AlertOctagon size={14} />
                  <span>Mark Task Blocked & Notify PM</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 6: IMMUTABLE SUBMISSION HISTORY */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <div className="pb-2 border-b border-white/[0.06]">
                <h3 className="text-xs font-bold text-white">Immutable Submission Snapshots</h3>
                <p className="text-[11px] text-slate-400">Archived revisions preserving exact deliverables reviewed by PM.</p>
              </div>

              {submissionsHistory.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400 bg-white/[0.02] border border-white/[0.06] rounded-xl">
                  No historical submissions yet. When submitted for review, snapshots will be archived here.
                </div>
              ) : (
                <div className="space-y-3">
                  {submissionsHistory.map((sub) => (
                    <div key={sub.submission_id} className="p-4 rounded-xl bg-[#101527] border border-[#1e2744] space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                            Rev #{sub.revision_number}
                          </span>
                          <span className="text-xs text-slate-300">{sub.submission_id}</span>
                        </div>
                        <span className="text-[11px] text-slate-400 font-mono">
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : ''}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 font-sans leading-relaxed">{sub.response}</p>
                      {sub.deliverables && sub.deliverables.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          {sub.deliverables.map((d, i) => (
                            <a
                              key={i}
                              href={d.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-white/[0.05] border border-white/10 text-[11px] text-purple-300 hover:text-white"
                            >
                              <LinkIcon size={11} />
                              <span>{d.title || d.deliverable_type}</span>
                            </a>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Feedback messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
              <AlertTriangle size={15} />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
              <CheckCircle2 size={15} />
              <span>{successMsg}</span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        {isPmUser ? (
          <div className="px-6 py-3.5 border-t border-[#182034] bg-[#0c1020] flex items-center justify-between shrink-0">
            <span className="text-xs text-purple-300 flex items-center gap-1.5 font-medium">
              <ShieldCheck size={14} className="text-purple-400" />
              Viewing in PM / Admin Review Mode
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('feedback')}
                className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-lg shadow-purple-600/30"
              >
                <CheckCircle2 size={13} />
                <span>Go to Review Decisions</span>
              </button>
            </div>
          </div>
        ) : (
          (activeTab === 'submission' || activeTab === 'deliverables') && (
            <div className="px-6 py-3.5 border-t border-[#182034] bg-[#0c1020] flex items-center justify-between shrink-0">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-white/[0.06] border border-white/[0.08] transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Save size={13} />
                <span>Save Draft</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmitForReview}
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send size={14} />
                      <span>{task.status === 'REVISION_REQUESTED' ? 'Resubmit Revised Deliverables' : 'Submit for PM Review'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )
        )}

      </div>
    </div>
  );
}


