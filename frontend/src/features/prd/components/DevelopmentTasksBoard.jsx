import React from 'react';
import { CalendarDays, CheckCircle2, Clock, Users, ArrowUpRight } from 'lucide-react';

export default function DevelopmentTasksBoard({ phases = [], tasks = [], onSelectTaskTrace, onGoToGenerator }) {
  if (phases.length === 0 && tasks.length === 0) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center space-y-4 select-none animate-fadeIn">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <Clock className="w-7 h-7" />
        </div>
        <div className="max-w-md mx-auto space-y-2">
          <h3 className="text-base font-bold text-white">No Development Phases or Tasks</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            Product rollout phases and engineering execution tasks will be created upon PRD generation from reviewed feature requirements.
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
    <div className="space-y-6 select-none animate-fadeIn">
      {/* Phases Overview */}
      {phases.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {phases.map((ph, idx) => (
            <div key={ph.phase_id || idx} className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-violet-400 font-bold uppercase">{ph.phase_id}</span>
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                  ph.approval_status === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300'
                }`}>
                  {ph.approval_status}
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">{ph.name}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{ph.description}</p>
              <div className="flex items-center justify-between pt-2 border-t border-[#1e293b] text-xs text-slate-400">
                <span className="flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5 text-violet-400" /> Target: {ph.target_date || '2026-10-30'}</span>
                <span>Features Linked: <strong className="text-slate-200">{(ph.feature_ids || []).length}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Development Tasks List */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#1e293b] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">Development Execution Tasks ({tasks.length})</h2>
              <p className="text-xs text-slate-400">Actionable engineering tasks with story & acceptance criteria linkage</p>
            </div>
          </div>
        </div>

        {tasks.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No engineering tasks decomposed for these phases yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300 border-collapse">
              <thead>
                <tr className="bg-[#111827] border-b border-[#223048] text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="p-3">Task ID</th>
                  <th className="p-3">Phase & Story</th>
                  <th className="p-3">Task Title & Details</th>
                  <th className="p-3">Assigned To</th>
                  <th className="p-3">Effort</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Traceability</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1e293b]">
                {tasks.map((tk, idx) => (
                  <tr key={tk.task_id || idx} className="hover:bg-[#111827]/60 transition-colors">
                    <td className="p-3 font-mono text-emerald-400 font-bold">{tk.task_id}</td>
                    <td className="p-3">
                      <span className="text-[10px] bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded font-mono">
                        {tk.phase_id}
                      </span>
                      <p className="text-[10px] text-slate-400 mt-1 font-mono">{tk.story_id}</p>
                    </td>
                    <td className="p-3 max-w-xs">
                      <p className="font-bold text-white text-xs">{tk.title}</p>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-0.5">{tk.description}</p>
                    </td>
                    <td className="p-3 text-slate-300 font-medium">{tk.assigned_to || 'Priya Sharma (PM)'}</td>
                    <td className="p-3 font-mono text-slate-300">{tk.estimated_effort || 5} pts</td>
                    <td className="p-3">
                      <span className="bg-blue-500/10 text-blue-300 border border-blue-500/20 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">
                        {tk.status || 'todo'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => onSelectTaskTrace && onSelectTaskTrace('task', tk.task_id)}
                        className="px-2.5 py-1 rounded bg-[#1e293b] hover:bg-emerald-600 text-slate-300 hover:text-white text-[11px] font-semibold flex items-center gap-1 ml-auto transition-colors cursor-pointer"
                      >
                        Full Trace <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
