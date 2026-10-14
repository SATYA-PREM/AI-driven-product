import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Shield,
  Eye,
  CheckSquare,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import { getSessionCache } from '../../api/core';
import DesignResponseModal from './components/DesignResponseModal';

export default function DesignerUXRequirements() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/designer/ux-requirements` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [uxItems, setUxItems] = useState(() => (Array.isArray(initialCache) ? initialCache : []));
  const [loading, setLoading] = useState(() => !Array.isArray(initialCache));
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialTab, setModalInitialTab] = useState('submission');

  const fetchUXRequirements = async () => {
    if (!workspaceId) return;
    const cached = getSessionCache(cacheKey);
    if (!cached && uxItems.length === 0) {
      setLoading(true);
    }
    setError(null);
    try {
      const res = await designerApi.getUXRequirements(workspaceId);
      if (Array.isArray(res)) setUxItems(res);
    } catch (err) {
      console.warn('Error fetching UX requirements:', err);
      if (uxItems.length === 0) setError(err.message || 'Failed to load UX requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUXRequirements();

    const onCacheUpdate = (e) => {
      if (e.detail?.endpoint === cacheKey && Array.isArray(e.detail?.data)) {
        setUxItems(e.detail.data);
      }
    };
    window.addEventListener('cache_updated', onCacheUpdate);
    return () => window.removeEventListener('cache_updated', onCacheUpdate);
  }, [workspaceId]);

  const handleOpenTask = (item, tab = 'submission') => {
    const id = item.assignment_id || item.requirement_id || item.id;
    if (id) {
      navigate(`/workspace/${workspaceId}/designer/assignments/${id}?tab=${tab}`);
      return;
    }
    setSelectedTask({
      assignment_id: item.assignment_id || item.requirement_id,
      requirement_id: item.requirement_id,
      requirement_title: item.requirement_title,
      prd_title: item.prd_title,
      prd_version: item.prd_version,
      problem_statement: item.problem_statement,
      response: item.response,
      figma_url: item.figma_url,
      prototype_url: item.prototype_url,
      blocker_comment: item.blocker_comment,
      status: item.status,
      review_status: item.review_status,
      review_comments: item.review_comments,
      revision_count: item.revision_count,
      deliverables: item.deliverables,
    });
    setModalInitialTab(tab);
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    fetchUXRequirements();
  };

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Palette size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              UX Requirements & UI Guidelines
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Interaction Design
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Human-centered UX specifications, interaction flow diagrams, responsive component states, and accessibility criteria.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg">
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span>Loading UX specifications...</span>
        </div>
      ) : uxItems.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl space-y-2 shadow-lg">
          <Palette size={36} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-300">No UX Requirements Found</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            There are no active UX requirements in this workspace yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {uxItems.map((item) => (
            <div
              key={item.requirement_id}
              className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl hover:border-purple-500/40 rounded-2xl p-6 space-y-5 transition-all shadow-lg"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.05] pb-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2.5">
                    <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
                      {item.requirement_id}
                    </span>
                    <h2 className="text-base font-bold text-white">{item.requirement_title}</h2>
                  </div>
                  <p className="text-xs text-slate-400">
                    PRD: <span className="text-slate-300 font-medium">{item.prd_title}</span> ({item.prd_version}) • Category: {item.category}
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : (item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED')
                        ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                        : (item.status === 'SUBMITTED_FOR_REVIEW' || item.review_status === 'PENDING_REVIEW')
                        ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                        : item.status === 'BLOCKED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                    }`}
                  >
                    {item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED'
                      ? `Revision Requested (#${item.revision_count || 1})`
                      : item.status === 'SUBMITTED_FOR_REVIEW' || item.review_status === 'PENDING_REVIEW'
                      ? 'In PM Review'
                      : item.status?.replace('_', ' ')}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenTask(item, 'clarification')}
                    className="px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                  >
                    Ask Question
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenTask(item, (item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED') ? 'feedback' : 'submission')}
                    className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white shadow-lg shadow-purple-600/25 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>
                      {(item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED')
                        ? 'Review Critique & Revise'
                        : item.response
                        ? 'Update Specs & Deliverables'
                        : 'Submit Design Response'}
                    </span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Problem Statement & Interaction Flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Problem Context & Customer Impact
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.problem_statement}</p>
                  {item.customer_impact && (
                    <p className="text-[11px] text-slate-400 mt-1">Impact: {item.customer_impact}</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-1.5">
                  <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider block">
                    Recommended Interaction Flow
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.interaction_flow}</p>
                </div>
              </div>

              {/* 4 Required UI States Grid */}
              <div className="space-y-2.5">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Eye size={14} className="text-purple-400" />
                  <span>Required Component UI States</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {item.ui_states && Object.entries(item.ui_states).map(([stName, stDesc]) => (
                    <div key={stName} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.05] space-y-1">
                      <span className="text-[11px] font-bold text-purple-300 block">{stName}</span>
                      <p className="text-[11px] text-slate-400 leading-relaxed">{stDesc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Acceptance Criteria & Accessibility Standards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Acceptance Criteria */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare size={14} />
                    <span>Design Acceptance Criteria</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {item.acceptance_criteria && item.acceptance_criteria.map((crit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-emerald-400 font-bold mt-0.5">•</span>
                        <span>{crit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Accessibility Standards */}
                <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] space-y-2">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={14} />
                    <span>Accessibility Criteria (WCAG 2.1 AA)</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {item.accessibility_criteria && item.accessibility_criteria.map((crit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-indigo-400 font-bold mt-0.5">✓</span>
                        <span>{crit}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Figma Link & Submitted Response if existing */}
              {(item.figma_url || item.response) && (
                <div className="p-4 rounded-xl bg-purple-950/20 border border-purple-500/25 space-y-2">
                  {item.figma_url && (
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-purple-300">Figma Asset Link:</span>
                      <a
                        href={item.figma_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-purple-400 hover:text-white underline font-mono flex items-center gap-1"
                      >
                        <span>{item.figma_url}</span>
                        <ExternalLink size={12} />
                      </a>
                    </div>
                  )}
                  {item.response && (
                    <div className="text-xs text-slate-300">
                      <span className="font-bold text-purple-300 block mb-0.5">Design Response Notes:</span>
                      <p className="whitespace-pre-wrap leading-relaxed">{item.response}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Response Modal */}
      <DesignResponseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={handleSaved}
        initialTab={modalInitialTab}
      />
    </div>
  );
}
