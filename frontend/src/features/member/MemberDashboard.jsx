import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertOctagon,
  FileText,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  CheckSquare,
  ListTodo
} from 'lucide-react';
import { useParams, Link } from 'react-router-dom';
import { getCurrentUser, getWorkspaceById, getActiveDataset, getRoleTitle } from '../../utils/workspaceAccess';
import { prdAssignmentApi } from '../../api/prdAssignment';
import AssignmentDetailModal from './components/AssignmentDetailModal';
import DeveloperDashboard from '../developer/DeveloperDashboard';
import DesignerDashboard from '../designer/DesignerDashboard';
import StakeholderDashboard from '../stakeholder/StakeholderDashboard';

export default function MemberDashboard() {
  const { workspaceId } = useParams();
  const currentUser = getCurrentUser();
  const userRole = String(currentUser?.role || '').toLowerCase();
  const isDeveloper = ['developer', 'dev', 'engineer', 'lead_engineer', 'lead engineer'].includes(userRole);
  const isDesigner = ['designer', 'product_designer', 'product designer', 'ux', 'ux_designer'].includes(userRole);
  const isStakeholder = ['stakeholder', 'business', 'business_owner', 'business owner'].includes(userRole);

  if (isDeveloper) {
    return <DeveloperDashboard />;
  }

  if (isDesigner) {
    return <DesignerDashboard />;
  }

  if (isStakeholder) {
    return <StakeholderDashboard />;
  }

  const workspace = getWorkspaceById(workspaceId);
  const activeDataset = getActiveDataset();

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAssignments = async () => {
    if (!workspaceId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await prdAssignmentApi.getMyAssignments(workspaceId);
      setAssignments(Array.isArray(res) ? res : []);
    } catch (err) {
      console.warn('Error fetching my assignments:', err);
      setError(err.message || 'Failed to load assignments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [workspaceId]);

  const totalCount = assignments.length;
  const pendingCount = assignments.filter((a) => a.status === 'NOT_STARTED').length;
  const inProgressCount = assignments.filter((a) => a.status === 'IN_PROGRESS').length;
  const completedCount = assignments.filter((a) => a.status === 'COMPLETED').length;
  const blockedCount = assignments.filter((a) => a.status === 'BLOCKED').length;

  const handleOpenTask = (assignment) => {
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

  const roleName = currentUser.roleTitle || getRoleTitle(currentUser.role);

  return (
    <div className="w-full text-slate-100 font-sans space-y-6 pb-12">
      {/* Top Banner / Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.08]">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold text-white tracking-tight">
              My Dashboard
            </h1>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#5b3df5]/20 text-[#a78bfa] border border-[#5b3df5]/30 capitalize">
              {currentUser.role?.replace('_', ' ') || 'Team Member'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Assigned PRD requirements, design & engineering tasks for{' '}
            <span className="text-slate-200 font-semibold">{workspace?.name || 'Current Workspace'}</span>
            {activeDataset?.product_name && (
              <> • Product: <span className="text-purple-300 font-medium">{activeDataset.product_name}</span></>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            to={`/workspace/${workspaceId}/my-assignments`}
            className="px-4 py-2 rounded-xl bg-[#5b3df5] hover:bg-[#4d30e3] text-xs font-bold text-white shadow-lg shadow-[#5b3df5]/25 transition-all flex items-center gap-2 cursor-pointer"
          >
            <ListTodo size={14} />
            <span>View All Assignments</span>
          </Link>
          <Link
            to={`/workspace/${workspaceId}/assistant`}
            className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.08] text-xs font-medium text-slate-200 transition-all flex items-center gap-2"
          >
            <Sparkles size={14} className="text-purple-400" />
            <span>Ask AI Assistant</span>
          </Link>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        {/* Total Tasks */}
        <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Assigned Tasks</span>
            <FileText size={16} className="text-purple-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-white">{totalCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Total across active PRDs</span>
          </div>
        </div>

        {/* Pending */}
        <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-[11px] font-bold uppercase tracking-wider">Pending</span>
            <Clock size={16} className="text-slate-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-slate-200">{pendingCount}</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Not started yet</span>
          </div>
        </div>

        {/* In Progress */}
        <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-amber-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">In Progress</span>
            <Clock size={16} className="text-amber-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-amber-400">{inProgressCount}</span>
            <span className="text-[10px] text-amber-500/80 block mt-0.5">Under active work</span>
          </div>
        </div>

        {/* Completed */}
        <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between shadow-lg">
          <div className="flex items-center justify-between text-emerald-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Completed</span>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-emerald-400">{completedCount}</span>
            <span className="text-[10px] text-emerald-500/80 block mt-0.5">Responses submitted</span>
          </div>
        </div>

        {/* Blocked */}
        <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-4 flex flex-col justify-between col-span-2 sm:col-span-1 shadow-lg">
          <div className="flex items-center justify-between text-rose-400">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Blocked</span>
            <AlertOctagon size={16} className="text-rose-400" />
          </div>
          <div className="mt-3">
            <span className="text-2xl font-black text-rose-400">{blockedCount}</span>
            <span className="text-[10px] text-rose-500/80 block mt-0.5">Needs unblocking</span>
          </div>
        </div>
      </div>

      {/* Role Responsibility & Workflow Guidance Card */}
      <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-lg">
        <div className="flex items-center gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#5b3df5]/20 border border-[#5b3df5]/40 flex items-center justify-center text-[#a78bfa] shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>{roleName} Workspace</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
              Review assigned requirements, ground your decisions on generated customer intelligence, and submit your responses to update the product roadmap.
            </p>
          </div>
        </div>
      </div>

      {/* Active Tasks & Requirements Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white">Active Tasks & Requirements</h2>
            <p className="text-xs text-slate-400">Click on any requirement to inspect context and submit your response.</p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Showing {assignments.length} items
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl flex flex-col items-center justify-center gap-3 shadow-lg">
            <div className="w-6 h-6 rounded-full border-2 border-[#5b3df5] border-t-transparent animate-spin" />
            <span>Loading assigned tasks...</span>
          </div>
        ) : assignments.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl space-y-2 shadow-lg">
            <CheckSquare size={32} className="mx-auto text-slate-600 mb-2" />
            <p className="text-sm font-bold text-slate-300">No Assignments Found</p>
            <p className="text-slate-500 max-w-md mx-auto">
              You do not have any requirements assigned under your role in this workspace yet. When the PM assigns PRD items, they will appear here.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {assignments.map((item) => {
              const isBlocked = item.status === 'BLOCKED';
              const isCompleted = item.status === 'COMPLETED';
              const isInProg = item.status === 'IN_PROGRESS';

              return (
                <div
                  key={item.assignment_id}
                  className={`p-5 rounded-2xl border transition-all flex flex-col justify-between bg-[#090d1c]/80 backdrop-blur-xl hover:border-purple-500/40 shadow-lg ${
                    isBlocked
                      ? 'border-rose-500/30 shadow-rose-500/5'
                      : isCompleted
                      ? 'border-emerald-500/20'
                      : 'border-white/[0.08]'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Header tags */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/10 text-white font-bold">
                          {item.requirement_id || 'REQ'}
                        </span>
                        <span className="text-[11px] text-purple-300 font-medium truncate">
                          {item.prd_title || 'PRD Document'}
                        </span>
                      </div>

                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full border capitalize ${
                          isCompleted
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : isInProg
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : isBlocked
                            ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                            : 'bg-slate-500/10 text-slate-400 border-slate-500/30'
                        }`}
                      >
                        {item.status?.replace('_', ' ')}
                      </span>
                    </div>

                    {/* Requirement Title */}
                    <h3 className="text-sm font-bold text-white leading-snug">
                      {item.requirement_title || 'Requirement Title'}
                    </h3>

                    {/* Role guidance or problem snippet */}
                    {item.problem_statement ? (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.problem_statement}
                      </p>
                    ) : item.requirement_description ? (
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {item.requirement_description}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500 italic">
                        Click Open Task to inspect full requirements and acceptance criteria.
                      </p>
                    )}

                    {/* Blocker alert if blocked */}
                    {isBlocked && item.blocker_comment && (
                      <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start gap-2">
                        <AlertTriangle size={14} className="shrink-0 mt-0.5 text-rose-400" />
                        <span className="line-clamp-2">{item.blocker_comment}</span>
                      </div>
                    )}

                    {/* Member Response preview if completed */}
                    {item.response && (
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-xs text-slate-300">
                        <span className="text-[10px] font-bold text-slate-400 block mb-0.5">Submitted Response:</span>
                        <p className="line-clamp-2 italic text-slate-300">"{item.response}"</p>
                      </div>
                    )}
                  </div>

                  {/* Card Action footer */}
                  <div className="pt-4 mt-3 border-t border-white/[0.05] flex items-center justify-between">
                    <span className="text-[10px] text-slate-500">
                      Assigned by {item.assigned_by || 'PM'}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleOpenTask(item)}
                      className="px-3.5 py-1.5 rounded-xl bg-[#5b3df5]/15 hover:bg-[#5b3df5]/30 border border-[#5b3df5]/30 text-xs font-bold text-purple-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <span>Open Task</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for viewing details and submitting responses */}
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
