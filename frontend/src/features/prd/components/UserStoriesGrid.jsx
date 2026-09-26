import React from 'react';
import { Users, CheckCircle2, Tag, ArrowUpRight, Sparkles } from 'lucide-react';

export default function UserStoriesGrid({ stories = [], onGenerateStories, isGeneratingStories, onSelectStoryTrace, onGoToGenerator }) {
  if (stories.length === 0) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center space-y-4 select-none animate-fadeIn">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
          <Users className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-bold text-white">No User Stories Decomposed Yet</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            User stories and acceptance criteria will be decomposed automatically from approved functional requirements.
          </p>
        </div>
        {onGenerateStories && (
          <button
            onClick={onGenerateStories}
            disabled={isGeneratingStories}
            className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {isGeneratingStories ? 'Decomposing Stories...' : 'Generate User Stories'}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4 select-none animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Agile User Stories & Acceptance Criteria ({stories.length})</h2>
            <p className="text-xs text-slate-400">Decomposed directly from approved functional requirements</p>
          </div>
        </div>

        <button
          onClick={onGenerateStories}
          disabled={isGeneratingStories}
          className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-colors cursor-pointer"
        >
          <Sparkles className="w-3.5 h-3.5" />
          {isGeneratingStories ? 'Decomposing Stories...' : 'Regenerate Stories'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {stories.map((st, idx) => (
          <div key={st.story_id || idx} className="bg-[#111827] border border-[#223048] hover:border-violet-500/30 rounded-xl p-4 space-y-3 transition-colors">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className="text-[10px] font-mono text-cyan-400 font-bold uppercase">{st.story_id}</span>
                <span className="text-[10px] text-slate-400 ml-2 font-mono">REQ: {st.requirement_id}</span>
              </div>
              <span className="text-[10px] bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded font-medium">
                {st.persona || 'enterprise_user'}
              </span>
            </div>

            <p className="text-xs font-semibold text-white leading-relaxed">{st.story}</p>

            <div className="space-y-1.5 pt-2 border-t border-[#1e293b]">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acceptance Criteria (AC):</span>
              <ul className="space-y-1">
                {(st.acceptance_criteria || ['System executes within threshold', 'Confirmation message displayed']).map((ac, i) => (
                  <li key={i} className="text-[11px] text-slate-300 flex items-start gap-1.5 bg-[#0b101b] p-2 rounded-lg border border-[#1e293b]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{ac}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-2 text-right">
              <button
                onClick={() => onSelectStoryTrace && onSelectStoryTrace('story', st.story_id)}
                className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold inline-flex items-center gap-1"
              >
                Trace Back to Feedback <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
