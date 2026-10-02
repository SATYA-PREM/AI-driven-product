import React from 'react';
import {
  History,
  X,
  Sparkles,
  CheckCircle2,
  RefreshCw,
  Trash2,
  UserCheck,
  Clock,
  ArrowRight
} from 'lucide-react';

export default function AssignmentHistory({
  isOpen,
  onClose,
  history = [],
  selectedAssignment = null,
}) {
  if (!isOpen) return null;

  const getActionIcon = (action) => {
    switch (action) {
      case 'ACCEPTED':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'RECOMMENDED':
        return <Sparkles className="w-4 h-4 text-violet-400" />;
      case 'REASSIGNED':
        return <RefreshCw className="w-4 h-4 text-blue-400" />;
      case 'REMOVED':
        return <Trash2 className="w-4 h-4 text-rose-400" />;
      default:
        return <UserCheck className="w-4 h-4 text-amber-400" />;
    }
  };

  const formatLocalDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 my-auto flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#1e293b] bg-[#0b101b] flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-violet-400" />
              <h3 className="text-sm sm:text-base font-bold text-white">
                Assignment Audit Trail & History
              </h3>
            </div>
            <p className="text-xs text-slate-400">
              {selectedAssignment
                ? `History for ${selectedAssignment.requirement_id} (${selectedAssignment.prd_id})`
                : 'Complete chronological history of assignment changes, AI acceptances & reassignments'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* History Timeline Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-4 flex-1">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              No audit logs recorded for this requirement yet.
            </div>
          ) : (
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#1e293b]">
              {history.map((h, idx) => (
                <div key={h.history_id || idx} className="relative space-y-1.5">
                  {/* Dot */}
                  <div className="absolute -left-6 top-0.5 p-1 rounded-full bg-[#0b101b] border border-[#223048]">
                    {getActionIcon(h.action)}
                  </div>

                  <div className="bg-[#111827] border border-[#223048] rounded-xl p-3.5 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white uppercase tracking-wider">
                          {h.action}
                        </span>
                        <span className="text-[10px] font-mono text-violet-400 bg-violet-500/10 px-1.5 py-0.5 rounded">
                          {h.requirement_id}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatLocalDate(h.timestamp)}
                      </span>
                    </div>

                    {/* Change detail */}
                    <div className="text-xs text-slate-300 flex items-center gap-2 flex-wrap">
                      <span>Changed by: <strong className="text-slate-100">{h.changed_by || 'PM Lead'}</strong></span>
                      {h.previous_user_id && h.new_user_id && (
                        <div className="flex items-center gap-1.5 bg-[#0b101b] px-2 py-0.5 rounded border border-[#1e293b] text-[11px]">
                          <span className="text-slate-400">{h.previous_user_id}</span>
                          <ArrowRight className="w-3 h-3 text-violet-400" />
                          <span className="text-emerald-400 font-bold">{h.new_user_id}</span>
                        </div>
                      )}
                    </div>

                    {h.reason && (
                      <p className="text-[11px] text-slate-400 italic bg-[#0b101b] p-2 rounded-lg border border-[#1e293b]">
                        "{h.reason}"
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

