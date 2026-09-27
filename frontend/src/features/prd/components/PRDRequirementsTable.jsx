import React from 'react';
import { Layers, CheckCircle2, ShieldCheck, Tag, ArrowUpRight, Search, Check } from 'lucide-react';

export default function PRDRequirementsTable({ requirements = [], onSelectRequirementTrace, onGoToGenerator }) {
  if (requirements.length === 0) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center space-y-4 select-none animate-fadeIn">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <Layers className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-bold text-white">No Requirements Synthesized Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Functional and non-functional requirements will be synthesized when a PRD is generated from approved PM review insights.
          </p>
        </div>
        {onGoToGenerator && (
          <button
            onClick={onGoToGenerator}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
          >
            Go to PRD Generator
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4 select-none animate-fadeIn">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Functional & Non-Functional Requirements ({requirements.length})</h2>
            <p className="text-xs text-slate-400">Derived 1:1 from approved insights & opportunities with distinct acceptance criteria</p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300 border-collapse">
          <thead>
            <tr className="bg-[#111827] border-b border-[#223048] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              <th className="p-3">REQ ID</th>
              <th className="p-3">Requirement Title, Details & Acceptance Criteria</th>
              <th className="p-3">Type</th>
              <th className="p-3">Priority</th>
              <th className="p-3">Source Mapping</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Traceability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b]">
            {requirements.map((req, idx) => (
              <tr key={req.requirement_id || idx} className="hover:bg-[#111827]/60 transition-colors align-top">
                <td className="p-3 font-mono text-violet-400 font-bold whitespace-nowrap">{req.requirement_id}</td>
                <td className="p-3 max-w-lg space-y-2">
                  <p className="font-bold text-white text-xs">{req.title}</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed">{req.description}</p>

                  {req.acceptance_criteria && req.acceptance_criteria.length > 0 && (
                    <div className="space-y-1 pt-1.5 border-t border-[#1e293b]/60">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Acceptance Criteria:</span>
                      <ul className="space-y-1">
                        {req.acceptance_criteria.map((ac, acIdx) => (
                          <li key={acIdx} className="text-[11px] text-slate-300 flex items-start gap-1.5 bg-[#070b13] p-2 rounded-lg border border-[#1e293b]/60">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                            <span>{ac}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                    req.type === 'functional' ? 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/20' : 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                  }`}>
                    {req.type}
                  </span>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    req.priority === 'high' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300'
                  }`}>
                    {req.priority}
                  </span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {(req.source_insights || []).map((ins, i) => (
                      <span key={i} className="text-[10px] bg-[#1e293b] text-slate-300 px-1.5 py-0.5 rounded font-mono">
                        {ins}
                      </span>
                    ))}
                    {(req.source_opportunities || []).map((opp, i) => (
                      <span key={i} className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded font-mono border border-blue-500/30">
                        {opp}
                      </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 whitespace-nowrap">
                  <span className="text-emerald-400 font-semibold text-[11px] flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {req.status || 'Approved'}
                  </span>
                </td>
                <td className="p-3 text-right whitespace-nowrap">
                  <button
                    onClick={() => onSelectRequirementTrace && onSelectRequirementTrace('requirement', req.requirement_id)}
                    className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-violet-600 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                  >
                    Trace Lineage <ArrowUpRight className="w-3 h-3" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
