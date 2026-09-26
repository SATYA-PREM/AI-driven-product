import React from 'react';
import {
  Activity,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';

export default function PRDBatchStatusCards({
  totalInsights = 0,
  approvedCount = 0,
  pendingCount = 0,
  rejectedCount = 0,
  datasetName = 'Active Feedback Batch',
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 select-none">
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-xl p-4 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
          <span>Total Insights in Batch</span>
          <Activity className="w-4 h-4 text-violet-400" />
        </div>
        <p className="text-2xl font-bold text-white tracking-tight">{totalInsights}</p>
        <span className="text-[11px] text-slate-500">Synthesized from {datasetName}</span>
      </div>

      <div className="bg-[#0b101b] border border-[#1e293b] rounded-xl p-4 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
          <span>PM Reviewed & Approved</span>
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-2xl font-bold text-emerald-400 tracking-tight">{approvedCount}</p>
        <span className="text-[11px] text-emerald-500/80 font-medium">Ready for PRD inclusion</span>
      </div>

      <div className="bg-[#0b101b] border border-[#1e293b] rounded-xl p-4 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
          <span>Pending PM Review</span>
          <Clock className="w-4 h-4 text-amber-400" />
        </div>
        <p className="text-2xl font-bold text-amber-400 tracking-tight">{pendingCount}</p>
        <span className="text-[11px] text-amber-500/80 font-medium">Awaiting PM sign-off</span>
      </div>

      <div className="bg-[#0b101b] border border-[#1e293b] rounded-xl p-4 space-y-1">
        <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
          <span>Rejected / Deferred</span>
          <XCircle className="w-4 h-4 text-rose-400" />
        </div>
        <p className="text-2xl font-bold text-slate-400 tracking-tight">{rejectedCount}</p>
        <span className="text-[11px] text-slate-500">Excluded from PRD build</span>
      </div>
    </div>
  );
}

