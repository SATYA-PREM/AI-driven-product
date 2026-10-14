import React, { useState, useEffect } from 'react';
import {
  FileText,
  Layers,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Link as LinkIcon,
  Palette,
  CheckSquare
} from 'lucide-react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import { getSessionCache } from '../../api/core';
import DesignResponseModal from './components/DesignResponseModal';

export default function DesignerAssignedPRDs() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();

  const cacheKey = workspaceId ? `/workspaces/${workspaceId}/designer/assignments` : null;
  const initialCache = cacheKey ? getSessionCache(cacheKey) : null;

  const [tasks, setTasks] = useState(() => (Array.isArray(initialCache) ? initialCache : []));
  const [loading, setLoading] = useState(() => !Array.isArray(initialCache));
  const [selectedTask, setSelectedTask] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      console.warn('Error loading designer PRDs:', err);
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

  // Group by PRD
  const prdGroups = React.useMemo(() => {
    const map = new Map();
    tasks.forEach((t) => {
      const prdId = t.prd_id || 'general_prd';
      if (!map.has(prdId)) {
        map.set(prdId, {
          prd_id: prdId,
          prd_title: t.prd_title || 'PRD Document',
          prd_version: t.prd_version || 'v1.0',
          items: [],
        });
      }
      map.get(prdId).items.push(t);
    });
    return Array.from(map.values());
  }, [tasks]);

  const [modalInitialTab, setModalInitialTab] = useState('submission');

  const handleOpenTask = (task, tab = 'submission') => {
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

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <FileText className="text-purple-400" size={26} />
            Assigned PRDs
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Product Requirements Documents containing UX specifications and wireframe requirements.
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
          <span>Loading assigned PRDs...</span>
        </div>
      ) : prdGroups.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl space-y-2 shadow-lg">
          <FileText size={36} className="mx-auto text-slate-600 mb-2" />
          <p className="text-sm font-bold text-slate-300">No Assigned PRDs</p>
          <p className="text-slate-500 max-w-sm mx-auto">
            You do not have any PRDs assigned for UX review or wireframe delivery in this workspace yet.
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/[0.05] pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-bold text-white">{group.prd_title}</h2>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {group.prd_version}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      {total} UX requirement{total > 1 ? 's' : ''} assigned to you
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full sm:w-48 space-y-1.5">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400">UX Completion</span>
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

                {/* Requirements list */}
                <div className="space-y-3 pt-1">
                  {group.items.map((item) => (
                    <div
                      key={item.assignment_id}
                      className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-purple-500/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
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
                        {item.figma_url && (
                          <a
                            href={item.figma_url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 font-mono underline"
                          >
                            <LinkIcon size={11} />
                            <span>Figma File Linked</span>
                          </a>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            item.status === 'COMPLETED'
                              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                              : (item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED')
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : (item.status === 'SUBMITTED_FOR_REVIEW' || item.review_status === 'PENDING_REVIEW')
                              ? 'bg-blue-500/20 text-blue-300 border-blue-500/40'
                              : item.status === 'BLOCKED'
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                          }`}
                        >
                          {item.status === 'REVISION_REQUESTED' || item.review_status === 'REVISION_REQUESTED'
                            ? `Revision Requested (#${item.revision_count || 1})`
                            : item.status === 'SUBMITTED_FOR_REVIEW' || item.review_status === 'PENDING_REVIEW'
                            ? 'In PM Review'
                            : item.status?.replace('_', ' ')}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleOpenTask(item, 'clarification')}
                          className="px-2.5 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-slate-300 transition-all cursor-pointer"
                        >
                          Ask Question
                        </button>
                        <button
                          type="button"
                          onClick={() => handleOpenTask(item, item.status === 'REVISION_REQUESTED' ? 'feedback' : 'submission')}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 text-xs font-bold text-purple-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>{item.status === 'REVISION_REQUESTED' ? 'Revise' : 'Open Task'}</span>
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

