import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

export default function PRDConflictValidationPanel({ validation = null }) {
  if (!validation) return null;

  const conflicts = validation.conflicts || [];
  const warnings = validation.warnings || [];
  const isComplete = validation.complete !== false && conflicts.length === 0;

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4 shadow-xl select-none">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <div className={`p-2 rounded-xl border ${
            isComplete
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
              : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
          }`}>
            {isComplete ? <ShieldCheck className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              PRD Architect Validation & Conflict Engine
              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                isComplete
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
              }`}>
                {isComplete ? 'PASSED (0 CONFLICTS)' : `${conflicts.length} CONFLICTS FLAGGED`}
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Cross-checks Requirement feasibility against PM Scope boundaries and completeness criteria
            </p>
          </div>
        </div>
      </div>

      {/* Conflict Items */}
      {conflicts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Detected Scope / Requirement Contradictions:
          </h3>
          <div className="space-y-2">
            {conflicts.map((conf, idx) => (
              <div
                key={idx}
                className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-3 text-xs flex items-start gap-2.5"
              >
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-amber-300 uppercase text-[10px]">
                    {conf.type || 'Scope Conflict'} &bull; Section: {conf.section || 'requirements'}
                  </span>
                  <p className="text-slate-300 leading-relaxed">{conf.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-blue-400" />
            Completeness Notes:
          </h3>
          <ul className="space-y-1 text-xs text-slate-300">
            {warnings.map((warn, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-blue-400 rounded-full" />
                <span>{warn}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {isComplete && warnings.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/20 rounded-xl p-3 font-medium">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>All requirements map cleanly to in-scope features. Zero contradictions or orphan items detected.</span>
        </div>
      )}
    </div>
  );
}

