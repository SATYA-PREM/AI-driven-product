import React from 'react';
import { X, ArrowRight, ShieldCheck, CheckCircle2, FileText, Users, Layers, MessageSquare } from 'lucide-react';

export default function ProvenanceTraceModal({ traceData, onClose }) {
  if (!traceData) return null;

  const chain = traceData.provenance_chain || [];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-6 max-w-2xl w-full space-y-6 shadow-2xl animate-scaleUp">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Traceability & Lineage Chain</h3>
              <p className="text-xs text-slate-400">
                End-to-End Evidence Path for <strong className="text-violet-400">{traceData.item_type}: {traceData.item_id}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#111827]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Chain Node List */}
        <div className="space-y-3 relative">
          <div className="absolute top-4 left-5 bottom-4 w-0.5 bg-gradient-to-b from-violet-500 via-indigo-500 to-emerald-500 z-0" />

          {chain.map((step, idx) => (
            <div key={idx} className="flex items-start gap-4 relative z-10">
              <div className="w-10 h-10 rounded-xl bg-[#111827] border border-[#223048] flex items-center justify-center text-violet-400 shrink-0 font-mono text-xs font-bold shadow">
                {idx + 1}
              </div>
              <div className="bg-[#111827] border border-[#223048] hover:border-violet-500/40 rounded-xl p-4 flex-1 space-y-1 transition-colors">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-violet-400 uppercase tracking-wider">{step.stage}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-[#0b101b] px-2 py-0.5 rounded border border-[#1e293b]">
                    {step.id}
                  </span>
                </div>
                <p className="text-xs font-semibold text-white leading-snug">{step.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Modal Footer */}
        <div className="pt-2 border-t border-[#1e293b] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold shadow"
          >
            Close Trace Explorer
          </button>
        </div>
      </div>
    </div>
  );
}
