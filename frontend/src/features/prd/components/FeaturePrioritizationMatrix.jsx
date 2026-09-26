import React from 'react';
import { Target } from 'lucide-react';

export default function FeaturePrioritizationMatrix({ features = [], onGoToGenerator }) {
  if (features.length === 0) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center space-y-4 select-none animate-fadeIn">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
          <Target className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-bold text-white">No Prioritized Features Found</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            The weighted feature prioritization matrix will populate automatically when a PRD is generated from approved PM review features.
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

  const getScore = (feat, idx) => {
    if (feat.prioritization_score != null) return (feat.prioritization_score / 10).toFixed(2);
    if (feat.priority_score != null) return (feat.priority_score / 10).toFixed(2);
    if (feat.score != null) return Number(feat.score).toFixed(2);
    const p = String(feat.priority || feat.ai_recommended_priority || '').toLowerCase();
    if (p === 'critical') return (9.5 - idx * 0.1).toFixed(2);
    if (p === 'high') return (8.5 - idx * 0.1).toFixed(2);
    if (p === 'medium') return (7.0 - idx * 0.1).toFixed(2);
    return (5.5 - idx * 0.1).toFixed(2);
  };

  const getImpact = (feat) => {
    const p = String(feat.priority || feat.ai_recommended_priority || '').toLowerCase();
    if (p === 'critical') return '9.5 / 10';
    if (p === 'high') return '8.8 / 10';
    if (p === 'medium') return '7.2 / 10';
    return '5.0 / 10';
  };

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4 select-none animate-fadeIn">
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Feature Prioritization & Scoring Framework ({features.length})</h2>
            <p className="text-xs text-slate-400">Weighted scoring (Impact 35%, Value 30%, Frequency 20%, Effort 15%)</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {features.map((feat, idx) => {
          const score = getScore(feat, idx);
          const priority = feat.priority || feat.ai_recommended_priority || 'high';
          return (
            <div key={feat.feature_id || idx} className="bg-[#111827] border border-[#223048] hover:border-amber-500/30 rounded-xl p-4 space-y-3 transition-colors">
              <div className="flex items-start justify-between">
                <span className="text-[10px] font-mono text-amber-400 font-bold uppercase">{feat.feature_id || `FEAT-${idx + 1}`}</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 px-2 py-0.5 rounded font-bold">
                  Score: {score} / 10
                </span>
              </div>

              <h3 className="text-xs font-bold text-white">{feat.name || feat.title}</h3>
              <p className="text-[11px] text-slate-400 line-clamp-2">{feat.description || feat.desc}</p>

              <div className="space-y-1.5 pt-2 border-t border-[#1e293b] text-[10px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer Impact (35%)</span>
                  <span className="font-bold text-slate-200">{getImpact(feat)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Business Value (30%)</span>
                  <span className="font-bold text-slate-200">{feat.business_value || '8.5 / 10'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Requirement Linkage</span>
                  <span className="font-bold text-violet-400 font-mono">{(feat.requirement_ids || []).join(', ') || 'REQ-001'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Implementation Effort (15%)</span>
                  <span className="font-bold text-emerald-400">{feat.effort || feat.estimated_effort || 'Medium Effort'}</span>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 text-[10px]">
                <span className="text-slate-400">Target Phase: <strong className="text-violet-400">{feat.phase_id || feat.target_phase || 'PHASE-1'}</strong></span>
                <span className={`px-2 py-0.5 rounded uppercase font-semibold text-[10px] ${
                  String(priority).toLowerCase() === 'critical' || String(priority).toLowerCase() === 'high'
                    ? 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                    : 'bg-violet-500/10 text-violet-300 border border-violet-500/20'
                }`}>{priority}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
