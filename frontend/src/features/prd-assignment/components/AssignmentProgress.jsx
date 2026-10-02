import React from 'react';
import { Sparkles, CheckCircle2, Clock, Loader2, AlertCircle } from 'lucide-react';

export default function AssignmentProgress({ job }) {
  if (!job) return null;

  const isCompleted = job.status === 'COMPLETED' || job.progress === 100;
  const isFailed = job.status === 'FAILED';
  const progressPercent = Math.min(Math.max(job.progress || 0, 0), 100);

  const getStageLabel = (stage) => {
    switch (stage) {
      case 'FETCHING_PRDS':
        return 'Fetching PRDs and Requirement Matrices...';
      case 'EXTRACTING_PLANNING_DATA':
        return 'Extracting Planning Context & Acceptance Criteria...';
      case 'ANALYZING_REQUIREMENTS':
        return `Analyzing requirements with Product Assignment Specialist (${job.processed_requirements || 0} evaluated)...`;
      case 'VALIDATING_MEMBERS':
        return 'Validating recommended roles against workspace roster...';
      case 'COMPLETED':
        return 'Assignment analysis complete. Recommendations ready for PM review.';
      case 'FAILED':
        return `Assignment analysis failed: ${job.error || 'Unknown error'}`;
      default:
        return 'Analyzing selected PRDs...';
    }
  };

  return (
    <div className="bg-gradient-to-r from-[#101426] to-[#0d1222] border border-violet-500/30 rounded-2xl p-5 shadow-2xl space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-600/20 text-violet-400 border border-violet-500/30">
            {isCompleted ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            ) : isFailed ? (
              <AlertCircle className="w-5 h-5 text-rose-400" />
            ) : (
              <Loader2 className="w-5 h-5 text-violet-400 animate-spin" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-white">
                {isCompleted ? 'AI Assignment Analysis Ready' : 'AI Assignment Analysis In Progress'}
              </h4>
              <span className="text-[10px] font-mono font-bold text-violet-300 bg-violet-500/20 px-2 py-0.5 rounded">
                Job: {job.job_id}
              </span>
            </div>
            <p className="text-xs text-slate-300 pt-0.5">
              {getStageLabel(job.stage)}
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-sm font-black font-mono text-violet-300">
            {progressPercent}%
          </span>
          <span className="text-[10px] text-slate-400 block font-mono">
            {job.processed_requirements || 0} / {job.total_requirements || job.processed_requirements || 0} Reqs
          </span>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-[#090d16] h-2.5 rounded-full overflow-hidden border border-[#1e293b]">
        <div
          className={`h-full transition-all duration-500 rounded-full ${
            isFailed
              ? 'bg-rose-500'
              : isCompleted
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
              : 'bg-gradient-to-r from-violet-600 via-indigo-500 to-purple-500 animate-pulse'
          }`}
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  );
}

