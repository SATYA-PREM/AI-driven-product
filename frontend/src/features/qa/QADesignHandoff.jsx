import React, { useState, useEffect } from 'react';
import { Palette, ExternalLink, Eye, Layers, ShieldCheck, CheckSquare } from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { developerApi } from '../../api/developer';

export default function QADesignHandoff() {
  const { workspaceId } = useParams();
  const [handoffs, setHandoffs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadHandoffs() {
      if (!workspaceId) return;
      try {
        const res = await developerApi.getDesignHandoffs(workspaceId);
        setHandoffs(res || []);
      } catch (err) {
        console.warn('Failed to load design handoffs:', err);
      } finally {
        setLoading(false);
      }
    }
    loadHandoffs();
  }, [workspaceId]);

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
              <Palette size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Design Handoff & Interaction Specs
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30 font-mono">
              UX Specifications
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Verify implemented frontends against approved Figma design specs, responsive breakpoints, and accessibility tokens
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-16 text-center text-slate-400 text-xs">
          Loading design handoffs...
        </div>
      ) : handoffs.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] text-center text-slate-400 text-xs">
          No design handoffs available for this workspace yet.
        </div>
      ) : (
        <div className="space-y-4">
          {handoffs.map((h, idx) => (
            <div
              key={h.handoff_id || idx}
              className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-purple-500/30 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                    {h.handoff_id}
                  </span>
                  <h3 className="text-sm font-bold text-white">{h.feature_title}</h3>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                  {h.status || 'APPROVED'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.04] space-y-2">
                  <span className="text-slate-400 font-semibold block text-[11px]">INTERACTION SPECIFICATIONS:</span>
                  <p className="text-slate-200">
                    {h.interaction_specs || 'Button must trigger immediate in-place loading spinner with 1500ms disable state to debounce double taps.'}
                  </p>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Design Tokens: <span className="font-mono text-purple-300">var(--accent-purple), 4.5:1 text contrast</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-white/[0.04] space-y-2">
                  <span className="text-slate-400 font-semibold block text-[11px]">ACCESSIBILITY SPECIFICATIONS:</span>
                  <p className="text-slate-200">
                    {h.accessibility_specs || 'Keyboard focus must remain trapped inside modal. ARIA live region must announce decline errors.'}
                  </p>
                  <div className="text-[11px] text-slate-400 pt-1">
                    Standard: <span className="text-emerald-400 font-semibold">WCAG 2.1 AA Compliance</span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Requirement: <strong className="font-mono text-slate-300">{h.requirement_id || 'REQ-01'}</strong>
                </span>
                <Link
                  to={`/workspace/${workspaceId}/qa/test-cases?requirement_id=${encodeURIComponent(h.requirement_id || '')}`}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-bold text-white flex items-center gap-1.5 transition-colors"
                >
                  <CheckSquare size={13} />
                  <span>Execute UX Tests</span>
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

