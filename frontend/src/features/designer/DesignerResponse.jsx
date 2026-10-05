import React, { useState, useEffect } from 'react';
import {
  Edit3,
  Sparkles,
  Send,
  Link as LinkIcon,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  ExternalLink,
  Layers,
  Palette,
  CheckSquare
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import DesignResponseModal from './components/DesignResponseModal';

export default function DesignerResponse() {
  const { workspaceId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchTasks = async () => {
    if (!workspaceId) return;
    setLoading(true);
    try {
      const res = await designerApi.getAssignments(workspaceId);
      setTasks(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Error loading design tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [workspaceId]);

  const handleOpenModal = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    fetchTasks();
  };

  const completed = tasks.filter((t) => t.status === 'COMPLETED');
  const pending = tasks.filter((t) => t.status !== 'COMPLETED');

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 p-6 md:p-8 font-sans space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#141b2d]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Edit3 size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Design Response & Handoff Hub
            </h1>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
              Handoff Workspace
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Submit interaction flows, attach Figma prototypes, and complete design deliverables for downstream engineering handoff.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-4 py-2 rounded-xl bg-[#121729] hover:bg-[#1a223c] border border-[#212c49] text-xs font-medium text-slate-200 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>AI Assistant</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#0e1322] border border-[#1a233b] rounded-2xl flex flex-col items-center justify-center gap-3">
          <div className="w-6 h-6 rounded-full border-2 border-[#5b3df5] border-t-transparent animate-spin" />
          <span>Loading design handoff items...</span>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* Pending Response Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                <span>Requirements Awaiting Design Response ({pending.length})</span>
              </h2>
            </div>

            {pending.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-[#0e1322] border border-[#1a233b] rounded-2xl">
                <CheckCircle2 size={28} className="mx-auto text-emerald-400 mb-2" />
                <p className="font-semibold text-slate-300">All assigned requirements have design responses submitted!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map((task) => (
                  <div
                    key={task.assignment_id}
                    className="p-5 rounded-2xl bg-[#0e1322] border border-[#1a233b] hover:border-[#2a375e] transition-all flex flex-col justify-between space-y-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                          {task.requirement_id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                          {task.status}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{task.requirement_title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{task.problem_statement || task.requirement_description}</p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">PRD: {task.prd_title}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(task)}
                        className="px-3.5 py-1.5 rounded-xl bg-purple-500/15 hover:bg-purple-500/30 border border-purple-500/30 text-xs font-bold text-purple-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>Submit Response</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Completed Submissions Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Submitted Design Responses & Handoffs ({completed.length})</span>
              </h2>
            </div>

            {completed.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-[#0e1322] border border-[#1a233b] rounded-2xl">
                <Clock size={28} className="mx-auto text-slate-600 mb-2" />
                <p>No completed design handoffs yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completed.map((task) => (
                  <div
                    key={task.assignment_id}
                    className="p-5 rounded-2xl bg-[#0e1322] border border-emerald-500/20 space-y-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                          {task.requirement_id}
                        </span>
                        <h3 className="text-sm font-bold text-white">{task.requirement_title}</h3>
                        <span className="text-xs text-purple-300 font-medium">({task.prd_title})</span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                          COMPLETED
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(task)}
                          className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline"
                        >
                          Edit Handoff
                        </button>
                      </div>
                    </div>

                    {task.figma_url && (
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-purple-300">Figma URL:</span>
                        <a
                          href={task.figma_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-purple-400 hover:text-white underline font-mono flex items-center gap-1"
                        >
                          <span>{task.figma_url}</span>
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}

                    {task.response && (
                      <div className="p-3 rounded-xl bg-[#12182a] border border-[#1e2744] text-xs text-slate-300">
                        <p className="whitespace-pre-wrap leading-relaxed">{task.response}</p>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 text-right">
                      Submitted at: {task.submitted_at || 'Recently'} by {task.submitted_by || 'Product Designer'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Response Modal */}
      <DesignResponseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        task={selectedTask}
        workspaceId={workspaceId}
        onSaved={handleSaved}
      />

    </div>
  );
}

