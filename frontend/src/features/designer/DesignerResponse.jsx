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
import { useParams, Link, useNavigate } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import { getSessionCache } from '../../api/core';
import DesignResponseModal from './components/DesignResponseModal';

export default function DesignerResponse() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/designer/assignments` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [tasks, setTasks] = useState(() => (Array.isArray(initialCache) ? initialCache : []));
  const [loading, setLoading] = useState(() => !Array.isArray(initialCache));
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [modalInitialTab, setModalInitialTab] = useState('submission');

  const fetchTasks = async () => {
    if (!workspaceId) return;
    const cached = getSessionCache(cacheKey);
    if (!cached && tasks.length === 0) {
      setLoading(true);
    }
    try {
      const res = await designerApi.getAssignments(workspaceId);
      if (Array.isArray(res)) setTasks(res);
    } catch (err) {
      console.warn('Error loading design tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();

    const onCacheUpdate = (e) => {
      if (e.detail?.endpoint === cacheKey && Array.isArray(e.detail?.data)) {
        setTasks(e.detail.data);
      }
    };
    window.addEventListener('cache_updated', onCacheUpdate);
    return () => window.removeEventListener('cache_updated', onCacheUpdate);
  }, [workspaceId]);

  const handleOpenModal = (task, tab = 'submission') => {
    const id = task.assignment_id || task.id || task.requirement_id;
    if (id) {
      navigate(`/workspace/${workspaceId}/designer/assignments/${id}?tab=${tab}`);
      return;
    }
    setSelectedTask(task);
    setModalInitialTab(tab);
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    fetchTasks();
  };

  const completed = tasks.filter((t) => t.status === 'COMPLETED');
  const inReview = tasks.filter((t) => t.status === 'SUBMITTED_FOR_REVIEW' || t.review_status === 'PENDING_REVIEW');
  const revisionRequested = tasks.filter((t) => t.status === 'REVISION_REQUESTED' || t.review_status === 'REVISION_REQUESTED');
  const pending = tasks.filter((t) => t.status !== 'COMPLETED' && t.status !== 'SUBMITTED_FOR_REVIEW' && t.status !== 'REVISION_REQUESTED');

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
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
            Submit interaction flows, attach Figma prototypes, address PM reviews, and complete design deliverables.
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

      {loading ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg">
          <div className="w-6 h-6 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
          <span>Loading design handoff items...</span>
        </div>
      ) : (
        <div className="space-y-8">
          
          {/* SECTION 1: REVISIONS REQUESTED (Highest priority) */}
          {revisionRequested.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-amber-300 uppercase tracking-wider flex items-center gap-2">
                  <AlertTriangle size={16} className="text-amber-400" />
                  <span>Revisions Requested by PM ({revisionRequested.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {revisionRequested.map((task) => (
                  <div
                    key={task.assignment_id}
                    className="p-5 rounded-2xl bg-[#090d1c]/80 border border-amber-500/40 backdrop-blur-xl hover:border-amber-500 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                          {task.requirement_id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/20 text-amber-300 border-amber-500/40">
                          Rev #{task.revision_count || 1}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{task.requirement_title}</h3>
                      
                      {task.review_comments && (
                        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                          <strong className="block text-[10px] uppercase text-amber-400 mb-0.5">PM Feedback:</strong>
                          <p className="italic line-clamp-3">"{task.review_comments}"</p>
                        </div>
                      )}
                    </div>

                    <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">PRD: {task.prd_title}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(task, 'feedback')}
                        className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-xs font-bold text-white shadow-lg shadow-amber-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Edit3 size={13} />
                        <span>Address Critique & Revise</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: IN PM REVIEW */}
          {inReview.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-blue-300 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-blue-400" />
                  <span>Submissions Awaiting PM Review ({inReview.length})</span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {inReview.map((task) => (
                  <div
                    key={task.assignment_id}
                    className="p-5 rounded-2xl bg-[#090d1c]/80 border border-blue-500/30 backdrop-blur-xl hover:border-blue-500/60 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                          {task.requirement_id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-blue-500/20 text-blue-300 border-blue-500/40">
                          In Review
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{task.requirement_title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{task.response || 'Deliverables submitted for review'}</p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">PRD: {task.prd_title}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(task, 'history')}
                        className="px-3.5 py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <Layers size={13} />
                        <span>View Submission</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: PENDING & IN PROGRESS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Clock size={16} className="text-amber-400" />
                <span>Requirements Awaiting Design Response ({pending.length})</span>
              </h2>
            </div>

            {pending.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-lg">
                <CheckCircle2 size={28} className="mx-auto text-emerald-400 mb-2" />
                <p className="font-semibold text-slate-300">All assigned requirements have active deliverables submitted!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pending.map((task) => (
                  <div
                    key={task.assignment_id}
                    className="p-5 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl hover:border-purple-500/40 transition-all flex flex-col justify-between space-y-3 shadow-lg"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                          {task.requirement_id}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/30">
                          {task.status?.replace('_', ' ')}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white">{task.requirement_title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2">{task.problem_statement || task.requirement_description}</p>
                    </div>

                    <div className="pt-3 border-t border-white/[0.05] flex items-center justify-between">
                      <span className="text-[11px] text-slate-500">PRD: {task.prd_title}</span>
                      <button
                        type="button"
                        onClick={() => handleOpenModal(task, 'submission')}
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

          {/* SECTION 4: APPROVED & COMPLETED HANDOFFS */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Approved & Completed Handoffs ({completed.length})</span>
              </h2>
            </div>

            {completed.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl shadow-lg">
                <Clock size={28} className="mx-auto text-slate-600 mb-2" />
                <p>No completed design handoffs yet.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completed.map((task) => (
                  <div
                    key={task.assignment_id}
                    className="p-5 rounded-2xl bg-[#090d1c]/80 border border-emerald-500/20 backdrop-blur-xl space-y-3 shadow-lg"
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
                          APPROVED & HANDED OFF
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenModal(task, 'submission')}
                          className="text-xs text-purple-400 hover:text-purple-300 font-semibold cursor-pointer underline"
                        >
                          View Details
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
                      <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
                        <p className="whitespace-pre-wrap leading-relaxed">{task.response}</p>
                      </div>
                    )}

                    <div className="text-[10px] text-slate-500 text-right">
                      Approved at: {task.submitted_at || 'Recently'} by {task.reviewed_by || 'Product Manager'}
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
        initialTab={modalInitialTab}
      />

    </div>
  );
}

