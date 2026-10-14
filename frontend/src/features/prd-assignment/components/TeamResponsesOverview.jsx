import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  AlertTriangle,
  FileText,
  User,
  Sparkles,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  ShieldCheck,
  Code,
  Palette,
  UserCheck
} from 'lucide-react';
import { prdAssignmentApi } from '../../../api/prdAssignment';
import DesignResponseModal from '../../designer/components/DesignResponseModal';

export default function TeamResponsesOverview({ workspaceId, selectedPrdIds = [] }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedDesignerTask, setSelectedDesignerTask] = useState(null);
  const [isDesignerModalOpen, setIsDesignerModalOpen] = useState(false);

  const fetchOverview = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await prdAssignmentApi.getTeamResponsesOverview(workspaceId, selectedPrdIds);
      setData(res || null);
    } catch (err) {
      console.warn('Error fetching team responses overview:', err);
      setError(err.message || 'Failed to load team responses overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOverview();
  }, [workspaceId, selectedPrdIds]);

  const getRoleIcon = (role) => {
    switch (role?.toUpperCase()) {
      case 'PRODUCT_DESIGNER':
      case 'DESIGNER':
        return <Palette className="w-4 h-4 text-purple-400" />;
      case 'DEVELOPER':
        return <Code className="w-4 h-4 text-blue-400" />;
      case 'QA':
        return <ShieldCheck className="w-4 h-4 text-emerald-400" />;
      case 'STAKEHOLDER':
        return <UserCheck className="w-4 h-4 text-amber-400" />;
      default:
        return <User className="w-4 h-4 text-slate-400" />;
    }
  };

  if (loading) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-12 text-center text-xs text-slate-400 flex flex-col items-center justify-center gap-3">
        <div className="w-6 h-6 rounded-full border-2 border-[#5b3df5] border-t-transparent animate-spin" />
        <span>Loading team responses and role progress...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-8 text-center text-xs text-slate-400 space-y-2">
        <AlertTriangle className="w-8 h-8 text-amber-400 mx-auto mb-2" />
        <p className="text-sm font-bold text-slate-300">Unable to load team responses</p>
        <p className="text-slate-500">{error || 'No overview data available'}</p>
      </div>
    );
  }

  const { total_assignments, completed_count, in_progress_count, pending_count, blocked_count, roles, recent_submissions } = data;

  return (
    <div className="space-y-6">
      
      {/* Top Rollup Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-[#0e1322] border border-[#1b243c] rounded-xl p-3.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Assignments</span>
          <span className="text-xl font-black text-white mt-1 block">{total_assignments}</span>
          <span className="text-[10px] text-slate-500">Across active requirements</span>
        </div>

        <div className="bg-[#0e1322] border border-emerald-500/20 rounded-xl p-3.5">
          <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider block">Completed</span>
          <span className="text-xl font-black text-emerald-400 mt-1 block">{completed_count}</span>
          <span className="text-[10px] text-emerald-500/70">Responses submitted</span>
        </div>

        <div className="bg-[#0e1322] border border-amber-500/20 rounded-xl p-3.5">
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">In Progress</span>
          <span className="text-xl font-black text-amber-400 mt-1 block">{in_progress_count}</span>
          <span className="text-[10px] text-amber-500/70">Under active review</span>
        </div>

        <div className="bg-[#0e1322] border border-slate-700/50 rounded-xl p-3.5">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending</span>
          <span className="text-xl font-black text-slate-300 mt-1 block">{pending_count}</span>
          <span className="text-[10px] text-slate-500">Not started yet</span>
        </div>

        <div className="bg-[#0e1322] border border-rose-500/20 rounded-xl p-3.5 col-span-2 sm:col-span-1">
          <span className="text-[10px] font-bold text-rose-400 uppercase tracking-wider block">Blocked</span>
          <span className="text-xl font-black text-rose-400 mt-1 block">{blocked_count}</span>
          <span className="text-[10px] text-rose-500/70">Needs PM attention</span>
        </div>
      </div>

      {/* Role-by-Role Progress Bars */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp size={16} className="text-[#8c6eff]" />
              Role Completion Progress
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Tracking submission and delivery velocity across cross-functional team roles.</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roles && roles.map((r) => {
            const rate = Math.round(r.completion_rate * 100);
            return (
              <div key={r.role} className="p-4 rounded-xl bg-[#0f1424] border border-[#1d2742] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-white/[0.04]">
                      {getRoleIcon(r.role)}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white">{r.role_title}</h4>
                      <span className="text-[10px] text-slate-400">
                        {r.completed} of {r.total} completed • {r.in_progress} in progress {r.blocked > 0 ? `• ${r.blocked} blocked` : ''}
                      </span>
                    </div>
                  </div>
                  <span className="text-sm font-black text-emerald-400 font-mono">{rate}%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2 bg-[#171e31] rounded-full overflow-hidden flex">
                  <div
                    className="bg-emerald-500 h-full transition-all duration-300"
                    style={{ width: `${rate}%` }}
                    title={`Completed: ${r.completed}`}
                  />
                  {r.in_progress > 0 && (
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${r.total > 0 ? (r.in_progress / r.total) * 100 : 0}%` }}
                      title={`In Progress: ${r.in_progress}`}
                    />
                  )}
                  {r.blocked > 0 && (
                    <div
                      className="bg-rose-500 h-full transition-all duration-300"
                      style={{ width: `${r.total > 0 ? (r.blocked / r.total) * 100 : 0}%` }}
                      title={`Blocked: ${r.blocked}`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Submissions Feed */}
      <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-white/[0.05] pb-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare size={16} className="text-emerald-400" />
              Recent Team Responses & Submissions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">Live feed of input and completion notes from team members.</p>
          </div>
          <span className="text-xs text-slate-400 font-semibold">
            {recent_submissions ? recent_submissions.length : 0} submissions
          </span>
        </div>

        {(!recent_submissions || recent_submissions.length === 0) ? (
          <div className="py-8 text-center text-xs text-slate-500 italic">
            No member responses or submissions recorded yet. Once members submit their notes in their dashboards, they will appear here.
          </div>
        ) : (
          <div className="space-y-3">
            {recent_submissions.map((sub) => (
              <div
                key={sub.assignment_id}
                className="p-4 rounded-xl bg-[#0f1424] border border-[#1d2742] space-y-2.5"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                      {sub.requirement_id || 'REQ'}
                    </span>
                    <span className="text-xs font-bold text-white">{sub.requirement_title}</span>
                    <span className="text-xs text-purple-300 font-medium">({sub.prd_title})</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-400">
                      By <strong className="text-slate-200">{sub.submitted_by || sub.user_name || 'Member'}</strong> ({sub.team_role})
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        sub.status === 'COMPLETED'
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                          : sub.status === 'BLOCKED'
                          ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                          : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                      }`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>

                {sub.response && (
                  <div className="p-3 rounded-lg bg-black/20 border border-white/[0.04] text-xs text-slate-300">
                    <p className="leading-relaxed whitespace-pre-wrap">{sub.response}</p>
                  </div>
                )}

                {sub.status === 'BLOCKED' && sub.blocker_comment && (
                  <div className="p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                    <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                    <span><strong>Blocker:</strong> {sub.blocker_comment}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-white/[0.04] flex items-center justify-between text-[11px] text-slate-500">
                  <span>Submitted at: {sub.submitted_at || 'Recently'}</span>
                  
                  {(sub.team_role?.toUpperCase().includes('DESIGN') || sub.team_role === 'PRODUCT_DESIGNER') && (
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDesignerTask(sub);
                        setIsDesignerModalOpen(true);
                      }}
                      className="px-3 py-1 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md shadow-purple-600/30"
                    >
                      <CheckCircle2 size={12} />
                      <span>Review UX Submission</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Designer Review Modal for PM */}
      <DesignResponseModal
        isOpen={isDesignerModalOpen}
        onClose={() => setIsDesignerModalOpen(false)}
        task={selectedDesignerTask}
        workspaceId={workspaceId}
        onSaved={fetchOverview}
        initialTab="feedback"
      />

    </div>
  );
}

