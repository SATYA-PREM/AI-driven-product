import React, { useState, useEffect } from 'react';
import {
  Palette,
  Sparkles,
  Layers,
  CheckSquare,
  Shield,
  Eye,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Link as LinkIcon,
  ArrowRight,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import DesignResponseModal from './components/DesignResponseModal';

export default function DesignerUXRequirements() {
  const { workspaceId } = useParams();
  const [uxItems, setUxItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchUXRequirements = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await designerApi.getUXRequirements(workspaceId);
      setUxItems(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Error fetching UX requirements:', err);
      setError(err.message || 'Failed to load UX requirements');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUXRequirements();
  }, [workspaceId]);

  const handleOpenTask = (item) => {
    setSelectedTask({
      assignment_id: item.assignment_id || item.requirement_id,
      requirement_id: item.requirement_id,
      requirement_title: item.requirement_title,
      prd_title: item.prd_title,
      problem_statement: item.problem_statement,
      response: item.response,
      figma_url: item.figma_url,
      blocker_comment: item.blocker_comment,
      status: item.status,
    });
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    fetchUXRequirements();
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 p-6 md:p-8 font-sans space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#141b2d]">
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
            className="px-4 py-2 rounded-xl bg-[#121729] hover:bg-[#1a223c] border border-[#212c49] text-xs font-medium text-slate-200 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#0e1322] border border-[#1a233b] rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-[#5b3df5] border-t-transparent animate-spin" />
          <span>Loading UX specifications...</span>
        </div>
      ) : uxItems.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#0e1322] border border-[#1a233b] rounded-2xl space-y-2">
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
              className="bg-[#0e1322] border border-[#1a233b] hover:border-[#2a375e] rounded-2xl p-6 space-y-5 transition-all"
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

                <div className="flex items-center gap-3">
                  <span
                    className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                      item.status === 'COMPLETED'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : item.status === 'IN_PROGRESS'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : item.status === 'BLOCKED'
                        ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                        : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                    }`}
                  >
                    {item.status}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleOpenTask(item)}
                    className="px-4 py-2 rounded-xl bg-[#5b3df5] hover:bg-[#4d30e3] text-xs font-bold text-white shadow-lg shadow-[#5b3df5]/25 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <span>{item.response ? 'Update Specs & Figma' : 'Submit Design Response'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>

              {/* Problem Statement & Interaction Flow */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#12182a] border border-[#1e2744] space-y-1.5">
                  <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                    Problem Context & Customer Impact
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed">{item.problem_statement}</p>
                  {item.customer_impact && (
                    <p className="text-[11px] text-slate-400 mt-1">Impact: {item.customer_impact}</p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-[#12182a] border border-[#1e2744] space-y-1.5">
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
                  {Object.entries(item.ui_states).map(([stName, stDesc]) => (
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
                <div className="p-4 rounded-xl bg-[#12182a] border border-[#1e2744] space-y-2">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckSquare size={14} />
                    <span>Design Acceptance Criteria</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {item.acceptance_criteria.map((crit, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-xs text-slate-300">
                        <span className="text-emerald-400 font-bold mt-0.5">•</span>
                        <span>{crit}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Accessibility Standards */}
                <div className="p-4 rounded-xl bg-[#12182a] border border-[#1e2744] space-y-2">
                  <h4 className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield size={14} />
                    <span>Accessibility Criteria (WCAG 2.1 AA)</span>
                  </h4>
                  <ul className="space-y-1.5">
                    {item.accessibility_criteria.map((crit, idx) => (
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
      />

    </div>
  );
}

