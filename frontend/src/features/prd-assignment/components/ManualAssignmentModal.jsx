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
  FileText,
  Layers,
  Sparkles,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { prdApi } from '../../../api/prd';

export default function ManualAssignmentModal({
  isOpen,
  onClose,
  requirement = null,
  teamMembers = [],
  prds = [],
  workspaceId = '',
  onSave,
  isSaving = false,
}) {
  const isReassign = Boolean(requirement?.isReassign || requirement?.assignment_id);
  const isFixed = Boolean(requirement?.isFixed || requirement?.requirement_id);

  const [selectedPrdId, setSelectedPrdId] = useState('');
  const [availableRequirements, setAvailableRequirements] = useState([]);
  const [isLoadingReqs, setIsLoadingReqs] = useState(false);

  const [selectedReqId, setSelectedReqId] = useState('');
  const [selectedReqTitle, setSelectedReqTitle] = useState('');
  const [selectedFeatureId, setSelectedFeatureId] = useState('');
  const [customReqMode, setCustomReqMode] = useState(false);

  const [selectedAssignments, setSelectedAssignments] = useState([]);
  const [assignReason, setAssignReason] = useState('Manually assigned by PM');
  const [validationError, setValidationError] = useState('');

  // 1. Synchronize modal state on open or requirement change
  useEffect(() => {
    if (!isOpen) {
      setValidationError('');
      return;
    }

    setValidationError('');

    // Determine initial PRD ID
    const initialPrdId = requirement?.prd_id || (prds.length > 0 ? prds[0].prd_id : '');
    setSelectedPrdId(initialPrdId);

    if (isFixed && requirement) {
      // Fixed requirement mode (from table row, recommendation, or reassign)
      setSelectedReqId(requirement.requirement_id || requirement.id || 'REQ-001');
      setSelectedReqTitle(
        requirement.requirement_title || requirement.title || requirement.description || 'Selected Requirement'
      );
      setSelectedFeatureId(requirement.feature_id || '');
      setCustomReqMode(false);
    } else {
      // General manual assign mode
      setSelectedReqId(requirement?.requirement_id || '');
      setSelectedReqTitle(requirement?.requirement_title || '');
      setSelectedFeatureId(requirement?.feature_id || '');
      setCustomReqMode(false);
    }

    // Set Assign Reason
    if (isReassign) {
      setAssignReason('Reassigned by PM to optimize delivery & skillset');
    } else {
      setAssignReason('Manually assigned by PM');
    }

    // Initialize assignees
    const defaultDev = teamMembers.find((m) => m.team_role === 'DEVELOPER') || teamMembers[0];
    const defaultUserId = defaultDev?.user_id || '';
    const defaultRole = defaultDev?.team_role || 'DEVELOPER';

    if (requirement?.assigned_members && requirement.assigned_members.length > 0) {
      setSelectedAssignments(
        requirement.assigned_members.map((am) => ({
          user_id: am.user_id || defaultUserId,
          team_role: am.team_role || defaultRole,
          reason: am.reason || 'Assigned by PM',
        }))
      );
    } else if (requirement?.recommended_members && requirement.recommended_members.length > 0) {
      setSelectedAssignments(
        requirement.recommended_members.map((rm) => ({
          user_id: rm.user_id || defaultUserId,
          team_role: rm.role || rm.team_role || defaultRole,
          reason: rm.reason || 'AI recommendation accepted',
        }))
      );
    } else {
      setSelectedAssignments([
        {
          user_id: defaultUserId,
          team_role: defaultRole,
          reason: isReassign ? 'Reassigned team member' : 'Assigned for requirement implementation',
        },
      ]);
    }
  }, [isOpen, requirement, teamMembers, isFixed, isReassign, prds]);

  // 2. Fetch Requirements for Selected PRD in General Mode
  useEffect(() => {
    let isMounted = true;
    if (!isOpen || isFixed || !selectedPrdId || !workspaceId) return;

    setIsLoadingReqs(true);
    prdApi
      .getPRD(workspaceId, selectedPrdId)
      .then((tree) => {
        if (!isMounted) return;
        const reqList = Array.isArray(tree?.requirements) ? tree.requirements : [];
        setAvailableRequirements(reqList);

        if (reqList.length > 0) {
          // If no requirement currently selected or selected requirement is not in this PRD
          const exists = reqList.some((r) => (r.requirement_id || r.id) === selectedReqId);
          if (!exists) {
            const first = reqList[0];
            const firstId = first.requirement_id || first.id || 'REQ-001';
            setSelectedReqId(firstId);
            setSelectedReqTitle(first.title || first.description || `Requirement ${firstId}`);
            setSelectedFeatureId(first.feature_id || '');
          }
        } else {
          setCustomReqMode(true);
          if (!selectedReqId) {
            setSelectedReqId('REQ-001');
            setSelectedReqTitle('Core Functional Requirement');
          }
        }
      })
      .catch((err) => {
        console.warn('Could not fetch requirements for PRD:', err);
        if (isMounted) {
          setAvailableRequirements([]);
          setCustomReqMode(true);
          if (!selectedReqId) {
            setSelectedReqId('REQ-001');
            setSelectedReqTitle('Core Functional Requirement');
          }
        }
      })
      .finally(() => {
        if (isMounted) setIsLoadingReqs(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, isFixed, selectedPrdId, workspaceId]);

  if (!isOpen) return null;

  // Handlers
  const handlePrdChange = (newPrdId) => {
    setSelectedPrdId(newPrdId);
    setSelectedReqId('');
    setSelectedReqTitle('');
    setSelectedFeatureId('');
  };

  const handleRequirementSelect = (reqId) => {
    setSelectedReqId(reqId);
    const matched = availableRequirements.find((r) => (r.requirement_id || r.id) === reqId);
    if (matched) {
      setSelectedReqTitle(matched.title || matched.description || `Requirement ${reqId}`);
      setSelectedFeatureId(matched.feature_id || '');
    }
  };

  const handleAddMemberSlot = () => {
    const unselected =
      teamMembers.find((m) => !selectedAssignments.some((a) => a.user_id === m.user_id)) || teamMembers[0];
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
    setValidationError('');

    if (!selectedPrdId) {
      setValidationError('Please select a target PRD document.');
      return;
    }

    if (!selectedReqId.trim()) {
      setValidationError('Please select or specify a valid Requirement ID (e.g. REQ-001).');
      return;
    }

    if (selectedAssignments.length === 0) {
      setValidationError('Please assign at least one team member.');
      return;
    }

    const invalidAssignee = selectedAssignments.find((a) => !a.user_id || !a.user_id.trim());
    if (invalidAssignee) {
      setValidationError('One or more assignees does not have a valid team member selected.');
      return;
    }

    onSave({
      assignment_id: requirement?.assignment_id,
      isReassign,
      prd_id: selectedPrdId,
      requirement_id: selectedReqId.trim(),
      requirement_title: selectedReqTitle.trim() || `Requirement ${selectedReqId}`,
      feature_id: selectedFeatureId || undefined,
      assignments: selectedAssignments,
      reason: assignReason.trim() || (isReassign ? 'Reassigned by PM' : 'Manually assigned by PM'),
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
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                {isReassign ? 'REASSIGNMENT' : 'MANUAL ASSIGNMENT'}
              </span>
              {selectedPrdId && (
                <span className="text-[10px] font-mono text-slate-400">
                  {selectedPrdId}
                </span>
              )}
            </div>
            <h3 className="text-sm sm:text-base font-bold text-white">
              {isReassign
                ? 'Reassign Requirement to Product Team Member'
                : 'Assign Requirement to Product Team Members'}
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
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Validation Alert */}
          {validationError && (
            <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs rounded-xl p-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{validationError}</span>
            </div>
          )}

          {/* 1. Target PRD Selector (if not fixed) */}
          {!isFixed && prds.length > 0 && (
            <div className="space-y-1">
              <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                Target PRD Document
              </label>
              <select
                value={selectedPrdId}
                onChange={(e) => handlePrdChange(e.target.value)}
                className="w-full bg-[#111827] border border-[#223048] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500 cursor-pointer"
              >
                {prds.map((p) => (
                  <option key={p.prd_id} value={p.prd_id}>
                    {p.prd_id} — {p.title || 'PRD Document'}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* 2. Target Requirement Selector */}
          {isFixed ? (
            <div className="bg-[#111827] border border-[#223048] rounded-xl p-3.5 space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
                  {selectedReqId}
                </span>
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Target Requirement
                </span>
              </div>
              <p className="text-xs text-slate-200 leading-relaxed font-medium">
                {selectedReqTitle || 'Specified PRD Requirement'}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                  Select Requirement to Assign
                </label>
                {availableRequirements.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setCustomReqMode(!customReqMode)}
                    className="text-[10px] text-violet-400 hover:text-violet-300 font-semibold cursor-pointer"
                  >
                    {customReqMode ? 'Pick from PRD List' : 'Enter Custom Requirement'}
                  </button>
                )}
              </div>

              {isLoadingReqs ? (
                <div className="bg-[#111827] border border-[#223048] rounded-xl p-3 flex items-center justify-center gap-2 text-xs text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-400" />
                  <span>Loading requirements for selected PRD...</span>
                </div>
              ) : !customReqMode && availableRequirements.length > 0 ? (
                <select
                  value={selectedReqId}
                  onChange={(e) => handleRequirementSelect(e.target.value)}
                  className="w-full bg-[#111827] border border-[#223048] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500 cursor-pointer"
                >
                  {availableRequirements.map((r) => {
                    const rId = r.requirement_id || r.id;
                    const rTitle = r.title || r.description || `Requirement ${rId}`;
                    return (
                      <option key={rId} value={rId}>
                        [{rId}] {rTitle.length > 70 ? `${rTitle.slice(0, 70)}...` : rTitle}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={selectedReqId}
                    onChange={(e) => setSelectedReqId(e.target.value)}
                    placeholder="REQ-001"
                    className="bg-[#111827] border border-[#223048] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500 font-mono"
                  />
                  <input
                    type="text"
                    value={selectedReqTitle}
                    onChange={(e) => setSelectedReqTitle(e.target.value)}
                    placeholder="Requirement Title / Description"
                    className="sm:col-span-2 bg-[#111827] border border-[#223048] rounded-xl px-3 py-2 text-xs text-slate-200 outline-none focus:border-violet-500"
                  />
                </div>
              )}
            </div>
          )}

          {/* 3. Assigned Members Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                {isReassign ? 'New Assigned Team Member' : `Assigned Team Members (${selectedAssignments.length})`}
              </label>
              {!isReassign && (
                <button
                  type="button"
                  onClick={handleAddMemberSlot}
                  className="text-[11px] font-bold text-violet-400 hover:text-violet-300 flex items-center gap-1 cursor-pointer bg-violet-500/10 hover:bg-violet-500/20 px-2.5 py-1 rounded-lg border border-violet-500/20 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Another Assignee</span>
                </button>
              )}
            </div>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
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

                  {!isReassign && selectedAssignments.length > 1 && (
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

          {/* 4. Reason / Notes */}
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
              className="px-5 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white text-xs font-bold flex items-center gap-2 transition-colors cursor-pointer shadow-lg shadow-violet-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{isReassign ? 'Update Assignment' : 'Save Assignment'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
