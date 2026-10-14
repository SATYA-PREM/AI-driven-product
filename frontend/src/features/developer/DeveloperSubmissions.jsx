import React, { useState, useEffect } from 'react';
import {
  GitPullRequest,
  Search,
  RefreshCw,
  GitBranch,
  ExternalLink,
  Code,
  CheckCircle2,
  Clock,
  Layers,
  FileCode
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById } from '../../utils/workspaceAccess';
import { developerApi } from '../../api/developer';

export default function DeveloperSubmissions() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const workspace = getWorkspaceById(workspaceId);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchAssignments = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await developerApi.getAssignments(workspaceId);
      setAssignments(data || []);
    } catch (err) {
      console.warn('Error fetching submissions:', err);
      setError(err.message || 'Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [workspaceId]);

  const submittedTasks = assignments.filter((t) => t.revision_number > 0 || t.status === 'IN_REVIEW' || t.status === 'COMPLETED');

  const filteredTasks = submittedTasks.filter((t) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = (t.feature_title || t.title || '').toLowerCase().includes(q);
      const matchId = (t.assignment_id || '').toLowerCase().includes(q);
      const matchBranch = (t.branch_name || '').toLowerCase().includes(q);
      return matchTitle || matchId || matchBranch;
    }
    return true;
  });

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <GitPullRequest size={20} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Implementation Submissions & Revisions
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-mono">
              {submittedTasks.length} Work Submissions
            </span>
          </div>
          <p className="text-xs text-slate-400 pl-11">
            Submitted code, revision snapshots, branch references, and QA verification status for{' '}
            <span className="text-slate-200 font-semibold">{workspace?.name || 'Customer Intelligence'}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAssignments}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white hover:border-white/[0.2] transition-colors cursor-pointer"
            title="Refresh submissions"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin text-cyan-400' : ''} />
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] flex items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search submissions by title, branch, ID..."
            className="w-full pl-9 pr-3.5 py-2 bg-slate-900/80 border border-white/[0.08] rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Submissions List */}
      {loading ? (
        <div className="p-12 text-center text-slate-400 text-xs flex items-center justify-center gap-2">
          <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading submissions...</span>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="p-12 text-center bg-[#090d1c]/80 border border-white/[0.08] rounded-2xl text-slate-400 text-xs">
          No implementation submissions logged yet. Start working on your assignments and submit your code for review.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.assignment_id}
              className="p-6 rounded-2xl bg-[#090d1c]/80 border border-white/[0.08] hover:border-cyan-500/30 transition-all shadow-xl space-y-3"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/40 px-2 py-0.5 rounded border border-cyan-800/40">
                    {task.assignment_id}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {task.status || 'IN_REVIEW'}
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300 border border-white/[0.08]">
                    Revision #{task.revision_number || 1}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {task.pr_url && (
                    <a
                      href={task.pr_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-cyan-600/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-600/30 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <GitPullRequest size={13} />
                      <span>PR Link</span>
                      <ExternalLink size={12} />
                    </a>
                  )}

                  <Link
                    to={`/workspace/${workspaceId}/developer/assignments/${task.assignment_id}`}
                    className="p-1.5 rounded-lg bg-slate-900 border border-white/[0.08] text-slate-300 hover:text-white"
                    title="Open Full Workspace"
                  >
                    <ExternalLink size={14} />
                  </Link>
                </div>
              </div>

              <div>
                <h3 className="text-base font-semibold text-white">
                  {task.feature_title || task.title}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  {task.implementation_notes || task.notes || 'Implementation completed and submitted for QA verification.'}
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap pt-2 border-t border-white/[0.04]">
                {task.branch_name && (
                  <span className="font-mono text-cyan-300 flex items-center gap-1">
                    <GitBranch size={12} className="text-cyan-400" />
                    {task.branch_name}
                  </span>
                )}
                {task.commit_sha && (
                  <span className="font-mono text-slate-400">
                    Commit: {task.commit_sha}
                  </span>
                )}
                {task.repository_url && (
                  <span className="text-slate-400 truncate">
                    Repo: {task.repository_url}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

