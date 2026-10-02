import React, { useState, useEffect } from 'react';
import {
  X,
  UserCheck,
  Code,
  Palette,
  ShieldCheck,
  Save,
  Plus,
  Trash2,
  AlertCircle,
  FileText
} from 'lucide-react';

export default function ManualAssignmentModal({
  isOpen,
  onClose,
  requirement = null,
  teamMembers = [],
  onSave,
  isSaving = false,
}) {
  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [assignReason, setAssignReason] = useState('Manually assigned by PM');

  useEffect(() => {
    if (requirement) {
      if (requirement.recommended_members && requirement.recommended_members.length > 0) {
        setSelectedAssignments(
          requirement.recommended_members.map((rm) => ({
            user_id: rm.user_id,
            team_role: rm.role || 'DEVELOPER',
            reason: rm.reason || 'Manually assigned by PM',
          }))
        );
      } else if (requirement.assigned_members && requirement.assigned_members.length > 0) {
        setSelectedAssignments(
          requirement.assigned_members.map((am) => ({
            user_id: am.user_id,
            team_role: am.team_role || 'DEVELOPER',
            reason: am.reason || 'Manually assigned by PM',
          }))
        );
      } else {
        // Default to developer if nothing selected
        const devMember = teamMembers.find((m) => m.team_role === 'DEVELOPER') || teamMembers[0];
        setSelectedAssignments([
          {
            user_id: devMember?.user_id || '',
            team_role: devMember?.team_role || 'DEVELOPER',
            reason: 'Assigned for technical implementation',
          },
        ]);
      }
    }
  }, [requirement, teamMembers]);

  if (!isOpen || !requirement) return null;

  const handleAddMemberSlot = () => {
    const unselected = teamMembers.find((m) => !selectedAssignments.some((a) => a.user_id === m.user_id)) || teamMembers[0];
    if (unselected) {
      setSelectedAssignments([
        ...selectedAssignments,
        {
          user_id: unselected.user_id,
          team_role: unselected.team_role || 'DEVELOPER',
          reason: 'Additional assignee for cross-functional support',
        },
      ]);
    }
  };

  const handleRemoveMemberSlot = (index) => {
    setSelectedAssignments(selectedAssignments.filter((_, idx) => idx !== index));
  };

  const handleMemberChange = (index, userId) => {
    const mem = teamMembers.find((m) => m.user_id === userId);
    const updated = [...selectedAssignments];
    updated[index] = {
      ...updated[index],
      user_id: userId,
      team_role: mem?.team_role || updated[index].team_role,
    };
    setSelectedAssignments(updated);
  };

  const handleRoleChange = (index, role) => {
    const updated = [...selectedAssignments];
    updated[index] = {
      ...updated[index],
      team_role: role,
    };
    setSelectedAssignments(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (selectedAssignments.length === 0) return;
    onSave({
      prd_id: requirement.prd_id,
      requirement_id: requirement.requirement_id || requirement.id,
      feature_id: requirement.feature_id,
      assignments: selectedAssignments,
      reason: assignReason,
    });
  };

  const rolesList = [
    { key: 'PRODUCT_DESIGNER', label: 'Product Designer / UX Designer', icon: Palette },
    { key: 'DEVELOPER', label: 'Developer / Engineer', icon: Code },
    { key: 'QA', label: 'QA / Tester', icon: ShieldCheck },
    { key: 'STAKEHOLDER', label: 'Stakeholder / Business Owner', icon: UserCheck },
    { key: 'PRODUCT_MANAGER', label: 'Product Manager (PM)', icon: UserCheck },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-[#0f172a] border border-[#1e293b] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 my-auto">
        {/* Header */}
        <div className="p-5 border-b border-[#1e293b] bg-[#0b101b] flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                {requirement.requirement_id || requirement.id}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {requirement.prd_id}
              </span>
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              Assign Requirement to Product Team Members
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {/* Requirement Summary Box */}
          <div className="bg-[#111827] border border-[#223048] rounded-xl p-3.5 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Requirement Description:
            </span>
            <p className="text-xs text-slate-200 leading-relaxed font-medium">
              {requirement.requirement_title || requirement.title || requirement.description}
            </p>
          </div>

          {/* Assigned Members Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Assigned Team Members ({selectedAssignments.length})
              </label>
              <button
                type="button"
                onClick={handleAddMemberSlot}
                className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer bg-violet-500/10 hover:bg-violet-500/20 px-2.5 py-1 rounded-lg border border-violet-500/20 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Another Assignee</span>
              </button>
            </div>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {selectedAssignments.map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#0b101b] border border-[#223048] rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 flex-1 w-full">
                    {/* User Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">
                        Team Member
                      </label>
                      <select
                        value={item.user_id}
                        onChange={(e) => handleMemberChange(idx, e.target.value)}
                        className="w-full bg-[#111827] border border-[#223048] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500 cursor-pointer"
                      >
                        {teamMembers.map((m) => (
                          <option key={m.user_id} value={m.user_id}>
                            {m.name} ({m.role_title || m.team_role})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Role Select */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-400 block">
                        Assigned Role
                      </label>
                      <select
                        value={item.team_role}
                        onChange={(e) => handleRoleChange(idx, e.target.value)}
                        className="w-full bg-[#111827] border border-[#223048] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500 cursor-pointer"
                      >
                        {rolesList.map((r) => (
                          <option key={r.key} value={r.key}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedAssignments.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveMemberSlot(idx)}
                      className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer shrink-0 self-end sm:self-center mt-2 sm:mt-4"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Reason / Notes */}
          <div className="space-y-1.5">
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
              Assignment Notes / Directives:
            </label>
            <input
              type="text"
              value={assignReason}
              onChange={(e) => setAssignReason(e.target.value)}
              placeholder="e.g. Lead UI implementation for mobile and web viewport..."
              className="w-full bg-[#111827] border border-[#223048] rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-violet-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#1e293b]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-[#111827] hover:bg-slate-800 text-slate-300 hover:text-white border border-[#223048] text-xs font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || selectedAssignments.length === 0}
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-violet-600/30"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Assignment'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

