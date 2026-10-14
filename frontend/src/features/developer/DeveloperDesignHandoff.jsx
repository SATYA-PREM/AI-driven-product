import React, { useState, useEffect } from 'react';
import {
  Layers,
  Palette,
  ExternalLink,
  RefreshCw,
  Search,
  CheckCircle2,
  Sliders,
  Smartphone,
  Eye,
  ShieldCheck,
  FileCode
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { developerApi } from '../../api/developer';

export default function DeveloperDesignHandoff() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchHandoffs = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await developerApi.getDesignHandoffs(workspaceId);
      setHandoffs(data || []);
    } catch (err) {
      console.warn('Error fetching design handoffs:', err);
      setError(err.message || 'Failed to load design handoffs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHandoffs();
  }, [workspaceId]);

  const filteredHandoffs = handoffs.filter((h) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (h.feature_title || h.title || '').toLowerCase().includes(q);
      const matchSpecs = (h.design_specs || h.response || '').toLowerCase().includes(q);
      return matchTitle || matchSpecs;
    }
    return true;
  });

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
              Design Handoff & Specifications
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              UX Specifications
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Approved Figma prototypes, component interactions, responsive breakpoints, and accessibility tokens for{' '}
            <span className="text-slate-200 font-semibold">{workspace?.name || 'Customer Intelligence'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchHandoffs}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
            title="Refresh handoffs"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-purple-400' : ''} />
          </button>
        </div>
      </div>

      {/* Standards & Guidelines Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-purple-400 font-bold text-xs uppercase tracking-wider">
            <Palette size={14} />
            <span>Theme & Colors</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Strict adherence to dark mode (#090d1c base, purple-600 accents, white/[0.08] borders) and light theme CSS tokens.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase tracking-wider">
            <Smartphone size={14} />
            <span>Responsive Layout</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Mobile-first fluid layouts with breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px).
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] space-y-2">
          <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
            <ShieldCheck size={14} />
            <span>Accessibility (a11y)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            WCAG AA contrast ratios, aria-labels on icon buttons, keyboard tab navigation, and focus rings.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search handoffs by feature, component, specs..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {filteredHandoffs.length} Approved Deliverables
        </span>
      </div>

      {/* Handoff Items */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading design handoffs...</span>
        </div>
      ) : filteredHandoffs.length === 0 ? (
        <div className="p-12 text-center bg-[#090d1c]/80 border border-white/[0.08] rounded-2xl text-slate-400 text-xs">
          No design handoffs found.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHandoffs.map((handoff, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-purple-500/30 transition-all shadow-xl space-y-4"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono text-xs font-bold text-purple-400 bg-purple-950/40 px-2 py-0.5 rounded border border-purple-800/40">
                    {handoff.assignment_id || `DESIGN-0${idx + 1}`}
                  </span>
                  <h3 className="text-base font-semibold text-white">
                    {handoff.feature_title || handoff.title}
                  </h3>
                </div>

                <div className="flex items-center gap-2.5">
                  {handoff.figma_url && (
                    <a
                      href={handoff.figma_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 hover:bg-purple-600/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Palette size={13} />
                      <span>Figma Specs</span>
                      <ExternalLink size={12} />
                    </a>
                  )}

                  {handoff.prototype_url && (
                    <a
                      href={handoff.prototype_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Eye size={13} />
                      <span>Prototype</span>
                      <ExternalLink size={12} />
                    </a>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-white/[0.05] text-xs space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Approved Design Specifications & Interaction Rationale:
                </div>
                <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                  {handoff.design_specs || handoff.response || 'Full responsive layouts and interactions approved for engineering implementation.'}
                </p>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/[0.04]">
                <span>Status: <strong className="text-emerald-400">Approved by Designer</strong></span>
                <span className="font-mono text-[11px] text-slate-500">Updated: {handoff.updated_at || 'Recent'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

