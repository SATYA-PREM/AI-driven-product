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
import { useParams, Link } from 'react-router-dom';
import { designerApi } from '../../api/designer';
import DesignResponseModal from './components/DesignResponseModal';

export default function DesignerAssignedPRDs() {
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
      console.warn('Error loading designer PRDs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
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

  const handleOpenTask = (task) => {
    setSelectedTask(task);
    setIsModalOpen(true);
  };

  const handleSaved = () => {
    fetchTasks();
  };

  return (
    <div className="min-h-screen bg-[#070913] text-slate-100 p-6 md:p-8 font-sans space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#141b2d]">
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
          <span>Loading assigned PRDs...</span>
        </div>
      ) : prdGroups.length === 0 ? (
        <div className="p-16 text-center text-xs text-slate-400 bg-[#0e1322] border border-[#1a233b] rounded-2xl space-y-2">
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
                className="bg-[#0e1322] border border-[#1a233b] rounded-2xl p-6 space-y-4"
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
                    <div className="w-full h-1.5 bg-[#171e31] rounded-full overflow-hidden">
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
                      className="p-4 rounded-xl bg-[#12182a] border border-[#1e2744] hover:border-[#2a375e] flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all"
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
                          onClick={() => handleOpenTask(item)}
                          className="px-3 py-1.5 rounded-lg bg-purple-500/15 hover:bg-purple-500/30 text-xs font-bold text-purple-300 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open Task</span>
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
      />

    </div>
  );
}

