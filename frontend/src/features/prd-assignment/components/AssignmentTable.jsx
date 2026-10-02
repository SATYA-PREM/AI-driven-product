import React, { useState, useMemo } from 'react';
import {
  UserCheck,
  Code,
  Palette,
  ShieldCheck,
  Search,
  Filter,
  RefreshCw,
  Trash2,
  History,
  Edit2,
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight
} from 'lucide-react';

export default function AssignmentTable({
  assignments = [],
  onReassign,
  onRemove,
  onViewHistory,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [methodFilter, setMethodFilter] = useState('ALL');

  const filteredAssignments = useMemo(() => {
    return assignments.filter((item) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        (item.prd_title || '').toLowerCase().includes(q) ||
        (item.prd_id || '').toLowerCase().includes(q) ||
        (item.requirement_id || '').toLowerCase().includes(q) ||
        (item.requirement_title || '').toLowerCase().includes(q) ||
        (item.user_name || '').toLowerCase().includes(q);

      const matchesRole = roleFilter === 'ALL' || item.team_role === roleFilter;
      const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
      const matchesMethod = methodFilter === 'ALL' || item.assignment_method === methodFilter;

      return matchesSearch && matchesRole && matchesStatus && matchesMethod;
    });
  }, [assignments, searchQuery, roleFilter, statusFilter, methodFilter]);

  const getRoleBadge = (role) => {
    const r = String(role || '').toUpperCase();
    if (r.includes('DESIGN')) {
      return (
        <span className="text-[10px] bg-purple-500/15 text-purple-300 border border-purple-500/30 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1">
          <Palette className="w-3 h-3 text-purple-400" />
          Product Designer
        </span>
      );
    }
    if (r.includes('DEV') || r.includes('ENG')) {
      return (
        <span className="text-[10px] bg-blue-500/15 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1">
          <Code className="w-3 h-3 text-blue-400" />
          Developer
        </span>
      );
    }
    if (r.includes('QA') || r.includes('TEST')) {
      return (
        <span className="text-[10px] bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          QA / Tester
        </span>
      );
    }
    if (r.includes('STAKEHOLDER') || r.includes('BUSINESS')) {
      return (
        <span className="text-[10px] bg-amber-500/15 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1">
          <UserCheck className="w-3 h-3 text-amber-400" />
          Stakeholder
        </span>
      );
    }
    return (
      <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-bold">
        Product Manager
      </span>
    );
  };

  const getMethodBadge = (method) => {
    const m = String(method || 'MANUAL').toUpperCase();
    if (m === 'AI_ACCEPTED') {
      return (
        <span className="text-[10px] bg-violet-500/15 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-violet-400" />
          AI Accepted
        </span>
      );
    }
    if (m === 'AI_RECOMMENDED') {
      return (
        <span className="text-[10px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 rounded font-bold inline-flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-indigo-400" />
          AI Suggested
        </span>
      );
    }
    return (
      <span className="text-[10px] bg-slate-800 text-slate-300 border border-slate-700 px-2 py-0.5 rounded font-bold">
        Manual
      </span>
    );
  };

  const getStatusBadge = (status) => {
    const s = String(status || 'ASSIGNED').toUpperCase();
    if (s === 'COMPLETED') {
      return <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded font-bold uppercase">{s}</span>;
    }
    if (s === 'IN_PROGRESS') {
      return <span className="text-[10px] bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded font-bold uppercase">{s}</span>;
    }
    if (s === 'REASSIGNMENT_REQUESTED') {
      return <span className="text-[10px] bg-rose-500/20 text-rose-300 border border-rose-500/30 px-2 py-0.5 rounded font-bold uppercase">Reassign Req</span>;
    }
    return <span className="text-[10px] bg-violet-500/20 text-violet-300 border border-violet-500/30 px-2 py-0.5 rounded font-bold uppercase">{s}</span>;
  };

  return (
    <div className="bg-[#0b101b] border border-[#1e293b] rounded-2xl shadow-xl overflow-hidden space-y-0">
      {/* Search and Filters Toolbar */}
      <div className="p-4 sm:p-5 border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-3 bg-[#080c16]">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search requirement, PRD title, assignee..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#111827] border border-[#223048] rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 outline-none focus:border-violet-500"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-[#111827] border border-[#223048] rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="ALL">All Roles</option>
            <option value="PRODUCT_DESIGNER">Product Designer</option>
            <option value="DEVELOPER">Developer / Engineer</option>
            <option value="QA">QA / Tester</option>
            <option value="STAKEHOLDER">Stakeholder</option>
            <option value="PRODUCT_MANAGER">Product Manager</option>
          </select>

          {/* Method Filter */}
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="bg-[#111827] border border-[#223048] rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="ALL">All Methods</option>
            <option value="AI_ACCEPTED">AI Accepted</option>
            <option value="AI_RECOMMENDED">AI Suggested</option>
            <option value="MANUAL">Manual</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-[#111827] border border-[#223048] rounded-xl px-2.5 py-1.5 text-xs text-slate-300 outline-none cursor-pointer"
          >
            <option value="ALL">All Statuses</option>
            <option value="ASSIGNED">Assigned</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="REASSIGNMENT_REQUESTED">Reassignment Req</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1e293b] bg-[#070b13] text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <th className="py-3.5 px-4">PRD Document</th>
              <th className="py-3.5 px-4">Requirement & Spec</th>
              <th className="py-3.5 px-4">Role & Specialization</th>
              <th className="py-3.5 px-4">Assigned To</th>
              <th className="py-3.5 px-4">Method</th>
              <th className="py-3.5 px-4">Status</th>
              <th className="py-3.5 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1e293b] text-xs">
            {filteredAssignments.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500 text-xs">
                  No active assignments found. Select PRDs and click "Auto Assign" or "Manual Assign".
                </td>
              </tr>
            ) : (
              filteredAssignments.map((item) => (
                <tr
                  key={item.assignment_id}
                  className="hover:bg-[#111827]/60 transition-colors group"
                >
                  {/* PRD Title */}
                  <td className="py-3 px-4 min-w-[160px]">
                    <div className="space-y-0.5">
                      <span className="font-mono text-[10px] font-bold text-violet-400 block">
                        {item.prd_id}
                      </span>
                      <span className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {item.prd_title || item.prd_id}
                      </span>
                    </div>
                  </td>

                  {/* Requirement */}
                  <td className="py-3 px-4 min-w-[240px]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-[10px] font-bold text-slate-400 bg-[#090d16] px-1.5 py-0.5 rounded border border-[#1e293b]">
                          {item.requirement_id}
                        </span>
                        <span className="text-[10px] bg-slate-800 text-slate-400 px-1 rounded">
                          {item.requirement_type || 'UX/Tech'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 font-medium line-clamp-2">
                        {item.requirement_title || item.requirement_id}
                      </p>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="py-3 px-4 min-w-[140px]">
                    {getRoleBadge(item.team_role)}
                  </td>

                  {/* Assigned Team Member */}
                  <td className="py-3 px-4 min-w-[180px]">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-slate-800 text-slate-200 flex items-center justify-center font-bold text-xs border border-slate-700 shrink-0">
                        {(item.user_name || 'U').charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-100 truncate block">
                          {item.user_name || item.user_id}
                        </span>
                        <span className="text-[10px] text-slate-400 truncate block">
                          {item.user_email || item.role_title || ''}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Assignment Method */}
                  <td className="py-3 px-4 shrink-0">
                    {getMethodBadge(item.assignment_method)}
                  </td>

                  {/* Status */}
                  <td className="py-3 px-4 shrink-0">
                    {getStatusBadge(item.status)}
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-right shrink-0">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => onReassign(item)}
                        title="Reassign to another team member"
                        className="p-1.5 rounded-lg bg-[#111827] hover:bg-violet-600/20 text-slate-400 hover:text-violet-300 border border-[#223048] hover:border-violet-500/40 transition-colors cursor-pointer"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onViewHistory(item)}
                        title="View assignment audit history"
                        className="p-1.5 rounded-lg bg-[#111827] hover:bg-slate-800 text-slate-400 hover:text-white border border-[#223048] transition-colors cursor-pointer"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => onRemove(item)}
                        title="Remove assignment"
                        className="p-1.5 rounded-lg bg-[#111827] hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-[#223048] hover:border-rose-500/40 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

