import React, { useState, useEffect } from 'react';
import {
  FileText,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { prdAssignmentApi } from '../../api/prdAssignment';
import AssignmentDetailModal from './components/AssignmentDetailModal';

export default function AssignedPRDsView() {
  const { workspaceId } = useParams();
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!workspaceId) return;
    setLoading(true);
    prdAssignmentApi.getMyAssignments(workspaceId)
      .then((res) => {
        setAssignments(Array.isArray(res) ? res : []);
      })
      .catch((err) => {
        console.warn('Error loading assigned PRDs:', err);
      })
      .finally(() => setLoading(false));
  }, [workspaceId]);

  // Group assignments by PRD
  const prdGroups = React.useMemo(() => {
    const map = new Map();
    assignments.forEach((item) => {
      const prdId = item.prd_id || 'general_prd';
      if (!map.has(prdId)) {
        map.set(prdId, {
          prd_id: prdId,
          prd_title: item.prd_title || 'Product Requirements Document',
          prd_version: item.prd_version || 'v1.0',
          category_id: item.category_id || 'General',
          items: [],
        });
      }
      map.get(prdId).items.push(item);
    });
    return Array.from(map.values());
  }, [assignments]);

  const handleOpenModal = (assignment) => {
    setSelectedAssignment(assignment);
    setIsModalOpen(true);
  };

  const handleSaved = (updated) => {
    setAssignments((prev) =>
      prev.map((item) =>
        item.assignment_id === updated.assignment_id ? { ...item, ...updated } : item
      )
    );
  };

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="text-purple-400" size={26} />
            Assigned PRDs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Product Requirements Documents containing items assigned to your product role.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* PRD Groups */}
      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg">
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span>Loading assigned PRDs...</span>
        </div>
      ) : prdGroups.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl space-y-2 shadow-lg">
          <FileText size={36} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-300">No Assigned PRDs</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            You do not have any PRDs assigned for review or implementation in this workspace yet.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {prdGroups.map((group) => {
            const completedCount = group.items.filter((i) => i.status === 'COMPLETED').length;
            const total = group.items.length;
            const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0;

            return (
              <div
                key={group.prd_id}
                className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 space-y-4 shadow-lg"
              >
                {/* PRD Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.08] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{group.prd_title}</h2>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {group.prd_version}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Category: <span className="text-slate-300 font-medium">{group.category_id}</span> • {total} requirement{total > 1 ? 's' : ''} assigned to you
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full sm:w-48 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">Completion</span>
                      <span className="text-emerald-400 font-bold">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-white/[0.08] rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Requirements in this PRD */}
                <div className="space-y-3 pt-1">
                  {group.items.map((item) => (
                    <div
                      key={item.assignment_id}
                      className="p-3.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                            {item.requirement_id || 'REQ'}
                          </span>
                          <span className="text-xs font-bold text-white truncate">
                            {item.requirement_title}
                          </span>
                        </div>
                        {item.problem_statement && (
                          <p className="text-xs text-slate-400 line-clamp-1">{item.problem_statement}</p>
                        )}
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : item.status === 'IN_PROGRESS'
                              ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                              : item.status === 'BLOCKED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          }`}
                        >
                          {item.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(item)}
                          className="px-3 py-1.5 rounded-lg bg-[#5b3df5]/15 hover:bg-[#5b3df5]/30 text-xs font-bold text-purple-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowRight size={13} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Assignment Detail Modal */}
      <AssignmentDetailModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        assignment={selectedAssignment}
        workspaceId={workspaceId}
        onSaved={handleSaved}
      />
    </div>
  );
}
