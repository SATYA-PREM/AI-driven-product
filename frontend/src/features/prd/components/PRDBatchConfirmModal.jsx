import React from 'react';
import { Sparkles, X, CheckCircle2, AlertTriangle, ShieldCheck, Database, Layers } from 'lucide-react';

export default function PRDBatchConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  selectedCount = 0,
  selectedItems = [],
  reviewId = 'REV-001',
  datasetName = 'Active Feedback Collection',
  isGenerating = false,
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6 relative">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Confirm PRD Generation
              </h3>
              <p className="text-xs text-slate-400">
                CrewAI 4-Agent Pipeline powered by Google Gemini
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Source Scope Summary */}
        <div className="bg-[#111827] border border-[#223048] rounded-xl p-4 space-y-3 text-xs">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Source Review Package:</span>
            <span className="font-mono font-bold text-violet-400">{reviewId} (PM APPROVED)</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Dataset Scope:</span>
            <span className="font-semibold text-slate-200">{datasetName}</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Approved Items to Synthesize:</span>
            <span className="font-bold text-emerald-400">{selectedCount} Items</span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-slate-400">Initial Document Lifecycle:</span>
            <span className="font-mono text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
              DRAFT / v1.0 (Requires PM Approval)
            </span>
          </div>
        </div>

        {/* Selected Items Preview */}
        <div className="space-y-1.5">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Approved Items in Scope:
          </span>
          <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
            {selectedItems.map((item, idx) => (
              <div
                key={item.id || item.issue_id || idx}
                className="p-2 rounded-lg bg-[#070b13] border border-[#1e293b] flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2 truncate">
                  <span className="font-mono text-[10px] text-violet-400 font-bold">
                    {item.id || item.issue_id || `ITEM-${idx + 1}`}
                  </span>
                  <span className="text-slate-200 font-medium truncate">{item.title}</span>
                </div>
                <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono shrink-0">
                  {item.customer_impact || item.priority || 'HIGH'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Multi-Agent Notice */}
        <div className="p-3 bg-violet-500/5 border border-violet-500/20 rounded-xl flex items-start gap-2.5 text-xs text-violet-300">
          <ShieldCheck className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            The 4 AI Agents (Product Analyst, Requirements Analyst, Product Manager, and PRD Architect) will execute sequentially to synthesize requirements, user stories, and end-to-end traceability.
          </p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#1e293b]">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 rounded-xl bg-[#111827] border border-[#223048] hover:border-slate-600 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isGenerating || selectedCount === 0}
            className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{isGenerating ? 'Synthesizing PRD...' : `Generate PRD (${selectedCount} Items)`}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

