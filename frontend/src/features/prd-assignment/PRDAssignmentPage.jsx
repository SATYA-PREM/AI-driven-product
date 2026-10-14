import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import {
  Users,
  Sparkles,
  UserPlus,
  Layers,
  FileText,
  Table,
  CheckCircle2,
  Clock,
  History,
  AlertCircle,
  BarChart3,
  ShieldCheck,
  Code,
  Palette,
  UserCheck
} from 'lucide-react';

import {
  getCurrentUser,
  getActiveWorkspaceId,
  getActiveSourceType,
  subscribeToActiveSourceType,
  getActiveDatasetId,
  subscribeToActiveDataset,
  getActiveDataset,
  getWorkspaceById,
} from '../../utils/workspaceAccess';
import { prdApi } from '../../api/prd';
import { prdAssignmentApi } from '../../api/prdAssignment';

import PRDSelector from './components/PRDSelector';
import AssignmentProgress from './components/AssignmentProgress';
import AssignmentRecommendation from './components/AssignmentRecommendation';
import ManualAssignmentModal from './components/ManualAssignmentModal';
import AssignmentTable from './components/AssignmentTable';
import TeamAssignmentView from './components/TeamAssignmentView';
import AssignmentHistory from './components/AssignmentHistory';
import TeamResponsesOverview from './components/TeamResponsesOverview';

export default function PRDAssignmentPage() {
  const { workspaceId: routeWorkspaceId } = useParams();
  const workspaceId = routeWorkspaceId || getActiveWorkspaceId() || 'default-workspace';

  // Global Context State
  const [currentCategory, setCurrentCategory] = useState(() => getActiveSourceType());
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => getActiveDatasetId());
  const [activeDataset, setActiveDatasetObj] = useState(() => getActiveDataset());
  const currentUser = getCurrentUser();
  const currentWorkspace = getWorkspaceById(workspaceId);

  // Data State
  const [prds, setPrds] = useState([]);
  const [selectedPrdIds, setSelectedPrdIds] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [summary, setSummary] = useState(null);

  // Job & Processing State
  const [activeJob, setActiveJob] = useState(null);
  const [isAutoAssigning, setIsAutoAssigning] = useState(false);
  const [activeTab, setActiveTab] = useState('assignments'); // 'assignments' | 'recommendations' | 'workload' | 'responses'

  // Modal State
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [selectedReqForModal, setSelectedReqForModal] = useState(null);
  const [isSavingManual, setIsSavingManual] = useState(false);

  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Toast Notification
  const [toast, setToast] = useState(null);
  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 4500);
  };

  // Subscribe to category/source type and active dataset updates from top bar
  useEffect(() => {
    const unsubSource = subscribeToActiveSourceType((newCat) => {
      setCurrentCategory(newCat);
    });
    const unsubDataset = subscribeToActiveDataset((newDsId, newDsObj) => {
      setSelectedDatasetId(newDsId);
      if (newDsObj) setActiveDatasetObj(newDsObj);
    });
    return () => {
      unsubSource();
      unsubDataset();
    };
  }, []);

  // 1. Fetch PRDs and Team Members (filtered by active dataset and source type)
  const loadInitialData = useCallback(async () => {
    if (!workspaceId) return;
    try {
      const [prdsRes, membersRes] = await Promise.all([
        prdApi.listProjects(workspaceId, {
          datasetId: selectedDatasetId || undefined,
          sourceType: currentCategory !== 'all' ? currentCategory : undefined,
        }),
        prdAssignmentApi.getWorkspaceTeamMembers(workspaceId),
      ]);

      const prdList = Array.isArray(prdsRes) ? prdsRes : [];
      setPrds(prdList);
      setTeamMembers(Array.isArray(membersRes) ? membersRes : []);

      // Auto-select PRDs matching current filter scope
      setSelectedPrdIds((prev) => {
        const validPrev = prev.filter((id) => prdList.some((p) => p.prd_id === id));
        if (validPrev.length > 0) return validPrev;
        return prdList.length > 0 ? [prdList[0].prd_id] : [];
      });
    } catch (err) {
      console.warn('Error loading PRD assignment initial data:', err);
    }
  }, [workspaceId, selectedDatasetId, currentCategory]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // 2. Fetch Assignments & Recommendations whenever selected PRDs change
  const loadAssignmentsAndRecommendations = useCallback(async () => {
    if (!workspaceId || selectedPrdIds.length === 0) {
      setAssignments([]);
      setRecommendations([]);
      setSummary(null);
      return;
    }

    try {
      const [asnsRes, summaryRes] = await Promise.all([
        prdAssignmentApi.listAssignments(workspaceId, { prd_ids: selectedPrdIds }),
        prdAssignmentApi.getAssignmentSummary(workspaceId, selectedPrdIds),
      ]);

      setAssignments(Array.isArray(asnsRes) ? asnsRes : []);
      setSummary(summaryRes || null);

      // Also fetch recommendations for first selected PRD
      const recsRes = await prdAssignmentApi.getPRDRecommendations(selectedPrdIds[0]);
      setRecommendations(Array.isArray(recsRes) ? recsRes : []);
    } catch (err) {
      console.warn('Error fetching assignments:', err);
    }
  }, [workspaceId, selectedPrdIds]);

  useEffect(() => {
    loadAssignmentsAndRecommendations();
  }, [loadAssignmentsAndRecommendations]);

  // 3. Auto Assign Job Polling
  useEffect(() => {
    let intervalId = null;
    if (activeJob && (activeJob.status === 'RUNNING' || activeJob.status === 'QUEUED')) {
      intervalId = setInterval(async () => {
        try {
          const updatedJob = await prdAssignmentApi.getJobStatus(activeJob.job_id);
          setActiveJob(updatedJob);

          if (updatedJob.status === 'COMPLETED' || updatedJob.status === 'FAILED') {
            setIsAutoAssigning(false);
            if (updatedJob.recommendations && updatedJob.recommendations.length > 0) {
              setRecommendations(updatedJob.recommendations);
              setActiveTab('recommendations'); // Switch to recommendations tab for PM review
            }
            loadAssignmentsAndRecommendations();
          }
        } catch (err) {
          console.error('Error polling assignment job:', err);
          setIsAutoAssigning(false);
        }
      }, 1200);
    }
    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [activeJob, loadAssignmentsAndRecommendations]);

  // 4. Trigger Auto Assign
  const handleAutoAssign = async () => {
    if (selectedPrdIds.length === 0 || isAutoAssigning) return;
    setIsAutoAssigning(true);
    try {
      const jobRes = await prdAssignmentApi.createAssignmentJob(workspaceId, {
        prd_ids: selectedPrdIds,
        category_id: currentCategory !== 'all' ? currentCategory : undefined,
      });
      setActiveJob(jobRes);
    } catch (err) {
      console.error('Failed to trigger auto assignment job:', err);
      setIsAutoAssigning(false);
    }
  };

  // 5. Accept AI Recommendation
  const handleAcceptRecommendation = async (rec) => {
    try {
      await prdAssignmentApi.acceptRecommendation(rec.recommendation_id, {
        workspaceId,
        prdId: rec.prd_id,
        requirementId: rec.requirement_id,
      });
      // Update local recommendation state
      setRecommendations((prev) =>
        prev.map((r) => (r.recommendation_id === rec.recommendation_id ? { ...r, status: 'ACCEPTED' } : r))
      );
      loadAssignmentsAndRecommendations();
    } catch (err) {
      console.error('Failed to accept recommendation:', err);
    }
  };

  // 6. Reject AI Recommendation
  const handleRejectRecommendation = async (rec) => {
    try {
      await prdAssignmentApi.rejectRecommendation(rec.recommendation_id);
      setRecommendations((prev) =>
        prev.map((r) => (r.recommendation_id === rec.recommendation_id ? { ...r, status: 'REJECTED' } : r))
      );
    } catch (err) {
      console.error('Failed to reject recommendation:', err);
    }
  };

  // 7. Batch Accept All Pending
  const handleBatchAccept = async () => {
    const pending = recommendations.filter((r) => r.status === 'PENDING_REVIEW');
    for (const rec of pending) {
      await handleAcceptRecommendation(rec);
    }
  };

  // 8. Manual Assign Modal
  const handleOpenManualModal = (requirement = null) => {
    if (requirement) {
      setSelectedReqForModal({
        ...requirement,
        isFixed: true,
      });
    } else {
      const defaultPrdId = selectedPrdIds[0] || (prds[0]?.prd_id) || '';
      setSelectedReqForModal({
        prd_id: defaultPrdId,
        isFixed: false,
      });
    }
    setManualModalOpen(true);
  };

  const handleSaveManualAssignment = async (payload) => {
    setIsSavingManual(true);
    try {
      if (payload.isReassign && payload.assignment_id) {
        // Reassignment of existing assignment
        const firstAssignee = payload.assignments?.[0];
        if (!firstAssignee?.user_id) {
          throw new Error('Please select a valid team member for reassignment.');
        }
        await prdAssignmentApi.updateAssignment(payload.assignment_id, {
          user_id: firstAssignee.user_id,
          team_role: firstAssignee.team_role,
          reason: payload.reason || firstAssignee.reason,
        });
        showToast('Requirement reassigned successfully!', 'success');
      } else {
        // New manual assignment (supports single or multi-assignee)
        await prdAssignmentApi.createManualAssignment(workspaceId, {
          prd_id: payload.prd_id,
          requirement_id: payload.requirement_id,
          feature_id: payload.feature_id,
          assignments: payload.assignments,
          assignment_method: 'MANUAL',
        });
        showToast('Requirement assigned successfully!', 'success');
      }
      setManualModalOpen(false);
      loadAssignmentsAndRecommendations();
    } catch (err) {
      console.error('Failed to save manual assignment:', err);
      showToast(err.message || 'Failed to save assignment. Please verify inputs.', 'error');
    } finally {
      setIsSavingManual(false);
    }
  };

  // 9. Reassign & Remove
  const handleReassign = (assignmentItem) => {
    setSelectedReqForModal({
      assignment_id: assignmentItem.assignment_id,
      prd_id: assignmentItem.prd_id,
      requirement_id: assignmentItem.requirement_id,
      requirement_title: assignmentItem.requirement_title,
      feature_id: assignmentItem.feature_id,
      isReassign: true,
      isFixed: true,
      assigned_members: [
        {
          user_id: assignmentItem.user_id,
          team_role: assignmentItem.team_role,
        },
      ],
    });
    setManualModalOpen(true);
  };

  const handleRemoveAssignment = async (assignmentItem) => {
    if (window.confirm(`Remove assignment for ${assignmentItem.user_name || assignmentItem.user_id}?`)) {
      try {
        await prdAssignmentApi.deleteAssignment(assignmentItem.assignment_id);
        loadAssignmentsAndRecommendations();
      } catch (err) {
        console.error('Failed to remove assignment:', err);
      }
    }
  };

  // 10. Audit History Modal
  const handleViewHistory = async (assignmentItem) => {
    setSelectedHistoryItem(assignmentItem);
    try {
      const logs = await prdAssignmentApi.getHistory({
        requirement_id: assignmentItem.requirement_id,
        prd_id: assignmentItem.prd_id,
      });
      setHistoryLogs(Array.isArray(logs) ? logs : []);
    } catch (err) {
      setHistoryLogs([]);
    }
    setHistoryModalOpen(true);
  };

  // PRD Selector handlers
  const handleSelectPrd = (prdId) => {
    setSelectedPrdIds((prev) =>
      prev.includes(prdId) ? prev.filter((id) => id !== prdId) : [...prev, prdId]
    );
  };

  const handleSelectAllPrds = () => {
    setSelectedPrdIds(prds.map((p) => p.prd_id));
  };

  const handleDeselectAllPrds = () => {
    setSelectedPrdIds([]);
  };

  const pendingRecsCount = recommendations.filter((r) => r.status === 'PENDING_REVIEW').length;

  return (
    <div className="bg-transparent text-slate-100 font-sans space-y-6 max-w-7xl mx-auto select-none relative">
      {/* Toast Alert Banner */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-in slide-in-from-top-2 duration-200 ${
            toast.type === 'error'
              ? 'bg-rose-950/95 border-rose-500/40 text-rose-200 shadow-rose-900/40'
              : 'bg-emerald-950/95 border-emerald-500/40 text-emerald-200 shadow-emerald-900/40'
          }`}
        >
          {toast.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white cursor-pointer font-bold text-sm"
          >
            &times;
          </button>
        </div>
      )}

      {/* 1. Global Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold text-purple-400">
              {currentWorkspace?.name || workspaceId}
            </span>
            <span className="text-[10px] bg-white/[0.04] text-slate-300 border border-white/[0.08] px-2 py-0.5 rounded font-mono">
              {currentCategory.toUpperCase()}
            </span>
            <span className="text-[10px] bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-2 py-0.5 rounded font-mono">
              {activeDataset ? (activeDataset.dataset_name || activeDataset.name || activeDataset.filename || 'BATCH') : 'ALL BATCHES'}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            PRD Team Assignments
          </h1>
          <p className="text-xs text-slate-400">
            Allocate approved specifications, user stories, and acceptance criteria to cross-functional product roles (Product Designer, Developer, QA, PM, Stakeholder).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white/[0.04] px-3.5 py-2 rounded-xl border border-white/[0.08]">
            <Users className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-semibold text-slate-200">
              {teamMembers.length} Team Members
            </span>
          </div>
        </div>
      </div>

      {/* 2. Top PRD Selection & Primary Action Bar */}
      <PRDSelector
        prds={prds}
        selectedPrdIds={selectedPrdIds}
        onSelectPrd={handleSelectPrd}
        onSelectAll={handleSelectAllPrds}
        onDeselectAll={handleDeselectAllPrds}
        onAutoAssign={handleAutoAssign}
        onManualAssign={() => handleOpenManualModal()}
        isAutoAssigning={isAutoAssigning}
        totalRequirements={summary?.total_requirements || 0}
        assignedRequirements={summary?.assigned_requirements || 0}
        unassignedRequirements={summary?.unassigned_requirements || 0}
      />

      {/* 3. Real-time AI Assignment Progress Bar */}
      {activeJob && (
        <AssignmentProgress job={activeJob} />
      )}

      {/* 4. Role Breakdown Metric Cards */}
      {summary && summary.role_breakdown && (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="bg-[#0b101b] border border-purple-500/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-purple-400">
              <span className="text-[10px] uppercase font-bold">Designers</span>
              <Palette className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-black text-white">
              {summary.role_breakdown['PRODUCT_DESIGNER'] || 0}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">UI/UX Specs</span>
          </div>

          <div className="bg-[#0b101b] border border-blue-500/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-blue-400">
              <span className="text-[10px] uppercase font-bold">Developers</span>
              <Code className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-black text-white">
              {summary.role_breakdown['DEVELOPER'] || 0}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">APIs & Frontend</span>
          </div>

          <div className="bg-[#0b101b] border border-emerald-500/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-emerald-400">
              <span className="text-[10px] uppercase font-bold">QA / Testers</span>
              <ShieldCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-black text-white">
              {summary.role_breakdown['QA'] || 0}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">Test Criteria</span>
          </div>

          <div className="bg-[#0b101b] border border-amber-500/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-amber-400">
              <span className="text-[10px] uppercase font-bold">Stakeholders</span>
              <UserCheck className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-black text-white">
              {summary.role_breakdown['STAKEHOLDER'] || 0}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">Business Direction</span>
          </div>

          <div className="bg-[#0b101b] border border-violet-500/20 rounded-xl p-3 space-y-1">
            <div className="flex items-center justify-between text-violet-400">
              <span className="text-[10px] uppercase font-bold">Product Managers</span>
              <Users className="w-3.5 h-3.5" />
            </div>
            <span className="text-lg font-black text-white">
              {summary.role_breakdown['PRODUCT_MANAGER'] || 0}
            </span>
            <span className="text-[10px] text-slate-400 block truncate">Scope & Roadmap</span>
          </div>
        </div>
      )}

      {/* 5. Navigation Views & Tabs */}
      <div className="flex items-center gap-2 border-b border-[#1e293b] pb-2">
        <button
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'assignments'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'bg-[#0b101b] hover:bg-[#111827] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
          }`}
        >
          <Table className="w-3.5 h-3.5" />
          <span>Assignment Matrix ({assignments.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('recommendations')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer relative ${
            activeTab === 'recommendations'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'bg-[#0b101b] hover:bg-[#111827] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-violet-300" />
          <span>AI Recommendations ({recommendations.length})</span>
          {pendingRecsCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('workload')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'workload'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'bg-[#0b101b] hover:bg-[#111827] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Team Member Workload ({teamMembers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('responses')}
          className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
            activeTab === 'responses'
              ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
              : 'bg-[#0b101b] hover:bg-[#111827] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Team Responses & Progress</span>
        </button>
      </div>

      {/* 6. Active Tab View Content */}
      {activeTab === 'assignments' && (
        <AssignmentTable
          assignments={assignments}
          onReassign={handleReassign}
          onRemove={handleRemoveAssignment}
          onViewHistory={handleViewHistory}
        />
      )}

      {activeTab === 'recommendations' && (
        <AssignmentRecommendation
          recommendations={recommendations}
          onAccept={handleAcceptRecommendation}
          onReject={handleRejectRecommendation}
          onEdit={(rec) => handleOpenManualModal(rec)}
          onBatchAccept={handleBatchAccept}
          isProcessing={isAutoAssigning}
        />
      )}

      {activeTab === 'workload' && (
        <TeamAssignmentView
          teamMembers={teamMembers}
          assignments={assignments}
          onReassign={handleReassign}
        />
      )}

      {activeTab === 'responses' && (
        <TeamResponsesOverview
          workspaceId={workspaceId}
          selectedPrdIds={selectedPrdIds}
        />
      )}

      {/* 7. Manual Assignment / Edit Modal */}
      <ManualAssignmentModal
        isOpen={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        requirement={selectedReqForModal}
        teamMembers={teamMembers}
        prds={prds}
        workspaceId={workspaceId}
        onSave={handleSaveManualAssignment}
        isSaving={isSavingManual}
      />

      {/* 8. Audit History Modal */}
      <AssignmentHistory
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        history={historyLogs}
        selectedAssignment={selectedHistoryItem}
      />
    </div>
  );
}

