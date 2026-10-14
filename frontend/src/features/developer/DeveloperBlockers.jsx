import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  HelpCircle,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MessageSquare,
  Plus,
  ExternalLink
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { developerApi } from '../../api/developer';
import ReportBlockerModal from './components/ReportBlockerModal';
import RequestClarificationModal from './components/RequestClarificationModal';

export default function DeveloperBlockers() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals state
  const [selectedTask, setSelectedTask] = useState(null);
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);
  const [isClarificationModalOpen, setIsClarificationModalOpen] = useState(false);

  const fetchAssignments = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await developerApi.getAssignments(workspaceId);
      setAssignments(data || []);
    } catch (err) {
      console.warn('Error fetching tasks for blockers:', err);
      setError(err.message || 'Failed to load task status');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [workspaceId]);

  const blockedTasks = assignments.filter((t) => t.status === 'BLOCKED');

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400">
              <AlertOctagon size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Blockers, Dependencies & PM Clarifications
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-300 border border-rose-500/30 font-mono">
              {blockedTasks.length} Blocked
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Track impediments, technical dependencies, and open requirement queries submitted to the PM for{' '}
            <span className="text-slate-200 font-semibold">{workspace?.name || 'Customer Intelligence'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (assignments.length > 0) {
                setSelectedTask(assignments[0]);
                setIsBlockerModalOpen(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <AlertOctagon size={14} />
            <span>Report Blocker</span>
          </button>

          <button
            onClick={() => {
              if (assignments.length > 0) {
                setSelectedTask(assignments[0]);
                setIsClarificationModalOpen(true);
              }
            }}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <HelpCircle size={14} />
            <span>Ask PM Question</span>
          </button>
        </div>
      </div>

      {/* Blocked Tasks Section */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold uppercase tracking-wider text-rose-400 flex items-center gap-2">
          <AlertOctagon size={16} />
          <span>Currently Blocked Tasks ({blockedTasks.length})</span>
        </h2>

        {loading ? (
          <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-rose-500 border-t-transparent rounded-full animate-spin" />
            <span>Loading blocker state...</span>
          </div>
        ) : blockedTasks.length === 0 ? (
          <div className="p-8 text-center bg-[#090d1c]/80 border border-white/[0.08] rounded-2xl text-slate-400 text-xs">
            No development tasks are currently blocked in this workspace. All pipelines clear! 🚀
          </div>
        ) : (
          <div className="space-y-3">
            {blockedTasks.map((task) => (
              <div
                key={task.assignment_id}
                className="p-5 rounded-2xl bg-[#090d1c]/80 border border-rose-500/30 shadow-xl space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-rose-400">
                      {task.assignment_id}
                    </span>
                    <h3 className="text-sm font-semibold text-white">
                      {task.feature_title || task.title}
                    </h3>
                  </div>

                  <Link
                    to={`/workspace/${workspaceId}/developer/assignments/${task.assignment_id}`}
                    className="p-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white"
                  >
                    <ExternalLink size={14} />
                  </Link>
                </div>

                <div className="p-3.5 rounded-xl bg-rose-950/20 border border-rose-800/30 text-xs space-y-1">
                  <span className="font-semibold text-rose-300 block">Blocker Details:</span>
                  <p className="text-slate-300 leading-relaxed">
                    {task.blocker_comment || task.notes || 'Task execution is halted pending resolution.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <ReportBlockerModal
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={fetchAssignments}
      />

      <RequestClarificationModal
        isOpen={isClarificationModalOpen}
        onClose={() => setIsClarificationModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={fetchAssignments}
      />
    </div>
  );
}

