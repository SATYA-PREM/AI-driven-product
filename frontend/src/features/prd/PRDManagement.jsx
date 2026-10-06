import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  FileText,
  Sparkles,
  Layers,
  Users,
  Target,
  Clock,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Zap,
  ArrowRight,
  Database,
  ListFilter,
  FileCheck,
  Activity,
  History,
} from 'lucide-react';
import { prdApi } from '../../api/prd';
import {
  getActiveWorkspaceId,
  getActiveDatasetId,
  subscribeToActiveDataset,
  getActiveSourceType,
  subscribeToActiveSourceType,
} from '../../utils/workspaceAccess';

import PRDInsightsSelector from './components/PRDInsightsSelector';
import PRDDocumentView from './components/PRDDocumentView';
import PRDRelatedContextSidebar from './components/PRDRelatedContextSidebar';
import PRDGeneratedHistoryTable from './components/PRDGeneratedHistoryTable';
import PRDReviewDetailsView from './components/PRDReviewDetailsView';
import PRDRequirementsTable from './components/PRDRequirementsTable';
import UserStoriesGrid from './components/UserStoriesGrid';
import PRDTraceabilityTableView from './components/PRDTraceabilityTableView';
import PRDReviewApprovalView from './components/PRDReviewApprovalView';
import PRDAIGenerationAuditView from './components/PRDAIGenerationAuditView';
import PRDFeatureDetailViewer from './components/PRDFeatureDetailViewer';
import PRDBatchConfirmModal from './components/PRDBatchConfirmModal';
import ProvenanceTraceModal from './components/ProvenanceTraceModal';

const VIEWS = [
  { id: 'studio', label: 'PRD Studio & Generator', icon: Sparkles },
  { id: 'feature_explorer', label: 'Feature Deep-Dive & Circulation Pack', icon: Layers },
  { id: 'pm_review', label: 'PM Review & Integrity', icon: ShieldCheck },
  { id: 'requirements', label: 'Requirements & NFRs', icon: FileText },
  { id: 'user_stories', label: 'User Stories & Scenarios', icon: Users },
  { id: 'traceability', label: 'Traceability Matrix', icon: Target },
  { id: 'prd_review', label: 'PRD Review & Approval', icon: FileCheck },
  { id: 'ai_audit', label: 'AI Generation Run & Telemetry', icon: Activity },
];

export default function PRDManagement(props) {
  const { workspaceId: routeWsId } = useParams();
  const workspaceId = props.workspaceId || routeWsId || getActiveWorkspaceId();

  const [activeView, setActiveView] = useState('studio');
  const [contextPreview, setContextPreview] = useState(null);
  const [pmReviews, setPmReviews] = useState([]);
  const [selectedReviewId, setSelectedReviewId] = useState('REV-001');
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => getActiveDatasetId());
  const [selectedSourceType, setSelectedSourceType] = useState(() => getActiveSourceType());
  const [projectsList, setProjectsList] = useState([]);
  const [selectedPrdId, setSelectedPrdId] = useState(null);
  const [prdData, setPrdData] = useState(null);
  const [selectedInsightIds, setSelectedInsightIds] = useState([]);
  const [pmComments, setPmComments] = useState('');

  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingStories, setIsGeneratingStories] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [traceData, setTraceData] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  useEffect(() => {
    const unsubDs = subscribeToActiveDataset((dsId) => {
      setSelectedDatasetId(dsId);
    });
    const unsubSt = subscribeToActiveSourceType((st) => {
      setSelectedSourceType(st);
    });
    return () => {
      unsubDs();
      unsubSt();
    };
  }, []);

  // 1. Load PM Review Context Preview & Existing PRD Projects from MongoDB
  const loadContextAndPRD = async (
    reviewId = selectedReviewId,
    dsId = selectedDatasetId,
    sType = selectedSourceType,
    prdIdToSelect = null
  ) => {
    if (!workspaceId) return;
    setIsLoadingContext(true);
    try {
      const [reviews, preview, projects] = await Promise.all([
        prdApi.listPMReviews(workspaceId, { datasetId: dsId, sourceType: sType }).catch(() => []),
        prdApi.getContextPreview(workspaceId, {
          source_review_id: reviewId,
          dataset_id: dsId,
          source_type: sType,
        }).catch(() => null),
        prdApi.listProjects(workspaceId, { datasetId: dsId, sourceType: sType }).catch(() => []),
      ]);

      setPmReviews(reviews || []);
      setContextPreview(preview);
      setProjectsList(projects || []);

      const approvedIds = (preview?.approved_issues || []).map((i) => i.issue_id || i.id);
      setSelectedInsightIds(approvedIds);

      // Select PRD project
      const targetPrdId = prdIdToSelect || (projects && projects.length > 0 ? projects[0].prd_id : null);
      if (targetPrdId) {
        setSelectedPrdId(targetPrdId);
        const fullTree = await prdApi.getPRD(workspaceId, targetPrdId).catch(() => null);
        setPrdData(fullTree);
      } else {
        setSelectedPrdId(null);
        setPrdData(null);
      }
    } catch (err) {
      console.error('Failed to load PRD context:', err);
      showToast('Failed to load PM Review context.');
    } finally {
      setIsLoadingContext(false);
    }
  };

  useEffect(() => {
    if (workspaceId) {
      loadContextAndPRD(selectedReviewId, selectedDatasetId, selectedSourceType);
    }
  }, [workspaceId, selectedDatasetId, selectedSourceType]);

  // Handle PRD Selection from History Table
  const handleSelectPRD = async (prdId) => {
    setSelectedPrdId(prdId);
    try {
      const fullTree = await prdApi.getPRD(workspaceId, prdId);
      setPrdData(fullTree);
      showToast(`Loaded ${prdId}`);
    } catch (err) {
      console.error('Failed to fetch PRD:', err);
      showToast('Failed to load PRD document.');
    }
  };

  // Open Batch Confirmation Modal
  const handleOpenConfirmModal = () => {
    if (selectedInsightIds.length === 0) {
      showToast('Please select at least 1 PM-approved item.');
      return;
    }
    setIsConfirmModalOpen(true);
  };

  // Execute Batch PRD Generation
  const handleExecuteGeneration = async () => {
    setIsGenerating(true);
    setIsConfirmModalOpen(false);
    try {
      const payload = {
        source_review_id: selectedReviewId || 'REV-001',
        dataset_id: selectedDatasetId,
        source_type: selectedSourceType,
        pm_comments: pmComments || contextPreview?.pm_comments,
        selected_insight_ids: selectedInsightIds,
      };

      const result = await prdApi.generatePRD(workspaceId, payload);
      setPrdData(result);
      if (result?.project?.prd_id) {
        setSelectedPrdId(result.project.prd_id);
      }

      // Refresh project list
      const projects = await prdApi.listProjects(workspaceId, {
        datasetId: selectedDatasetId,
        sourceType: selectedSourceType,
      });
      setProjectsList(projects || []);

      showToast(`PRD ${result?.project?.prd_id || ''} generated successfully!`);
    } catch (err) {
      console.error('PRD generation error:', err);
      showToast('PRD generation failed. Please check your network and Gemini API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  // Save PRD Document Edits
  const handleSavePRD = async (updatedFields) => {
    if (!selectedPrdId) return;
    setIsSaving(true);
    try {
      const result = await prdApi.updatePRD(workspaceId, selectedPrdId, updatedFields);
      setPrdData(result);
      showToast('PRD document saved and version snapshot recorded.');
    } catch (err) {
      console.error('Save error:', err);
      showToast('Failed to save PRD document changes.');
    } finally {
      setIsSaving(false);
    }
  };

  // Submit PM Review Approval Gate
  const handleSubmitReview = async (reviewPayload) => {
    if (!selectedPrdId) return;
    setIsSubmittingReview(true);
    try {
      const result = await prdApi.submitReview(workspaceId, selectedPrdId, reviewPayload);
      setPrdData(result);
      showToast(`PRD review recorded: ${reviewPayload.decision.toUpperCase()}`);
    } catch (err) {
      console.error('Review submit error:', err);
      showToast('Failed to record review decision.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  // Decompose User Stories
  const handleGenerateStories = async () => {
    if (!selectedPrdId) return;
    setIsGeneratingStories(true);
    try {
      const stories = await prdApi.generateStories(workspaceId, selectedPrdId);
      setPrdData((prev) => (prev ? { ...prev, user_stories: stories } : prev));
      showToast(`Decomposed ${stories.length} User Stories with Acceptance Criteria!`);
    } catch (err) {
      console.error('Stories error:', err);
      showToast('Failed to decompose user stories.');
    } finally {
      setIsGeneratingStories(false);
    }
  };

  // Generate Feature Circulation Package
  const handleGenerateCirculationPackage = async (payload) => {
    if (!selectedPrdId) return null;
    try {
      const result = await prdApi.generateCirculationPackage(workspaceId, selectedPrdId, payload);
      showToast(`Generated Circulation Pack for ${payload.feature_ids?.length || 0} features!`);
      return result;
    } catch (err) {
      console.error('Circulation package error:', err);
      showToast('Failed to compile circulation pack from backend.');
      throw err;
    }
  };

  // Open Trace Modal
  const handleOpenTrace = async (itemType, itemId) => {
    if (!selectedPrdId) return;
    try {
      const trace = await prdApi.getProvenance(workspaceId, selectedPrdId, itemType, itemId);
      setTraceData(trace);
    } catch (err) {
      console.error('Trace error:', err);
      setTraceData({
        item_type: itemType,
        item_id: itemId,
        provenance_chain: [
          { stage: 'Item', id: itemId, label: `${itemType.toUpperCase()} ${itemId}` },
          { stage: 'PRD Document', id: selectedPrdId, label: prdData?.project?.title || 'PRD' },
          { stage: 'PM Review Gate', id: selectedReviewId, label: 'Approved PM Package' },
        ],
      });
    }
  };

  const selectedItemsList = (contextPreview?.approved_issues || []).filter((i) =>
    selectedInsightIds.includes(i.issue_id || i.id)
  );

  return (
    <div className="space-y-6 select-none max-w-7xl mx-auto px-4 py-6 font-sans">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 bg-[#111827] border border-violet-500/50 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-2xl flex items-center gap-2 animate-slideDown">
          <Sparkles className="w-4 h-4 text-violet-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Confirmation Modal */}
      <PRDBatchConfirmModal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        onConfirm={handleExecuteGeneration}
        selectedCount={selectedInsightIds.length}
        selectedItems={selectedItemsList}
        reviewId={selectedReviewId}
        datasetName={contextPreview?.dataset_name || 'Active Feedback Collection'}
        isGenerating={isGenerating}
      />

      {/* Provenance Trace Modal */}
      {traceData && (
        <ProvenanceTraceModal traceData={traceData} onClose={() => setTraceData(null)} />
      )}

      {/* 1. Module Header & Navigation Bar */}
      <div className="bg-[#090d1c]/80 border border-white/[0.08] backdrop-blur-xl rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/15 border border-purple-500/30 rounded-xl text-purple-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">PRD Studio</h1>
              <p className="text-xs text-slate-400">
                Transform PM-approved customer intelligence into structured, traceable PRDs.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => loadContextAndPRD(selectedReviewId, selectedDatasetId, selectedSourceType, selectedPrdId)}
              disabled={isLoadingContext}
              className="px-3.5 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:border-purple-500/40 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-2 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingContext ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {/* Multi-Agent Progress Bar (Visible while generating) */}
        {isGenerating && (
          <div className="p-4 bg-violet-950/40 border border-violet-500/30 rounded-xl space-y-2 animate-pulse">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-violet-300 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400 animate-spin" />
                CrewAI 4-Agent Pipeline Synthesizing PRD...
              </span>
              <span className="font-mono text-violet-300 font-bold">Inference Running</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-violet-500 to-indigo-500 h-full w-3/4 animate-pulse rounded-full" />
            </div>
            <p className="text-[10px] text-slate-400 font-mono">
              Product Analyst → Requirements Analyst → Product Manager → PRD Architect
            </p>
          </div>
        )}

        {/* Clean Views Switcher */}
        <div className="flex items-center gap-1.5 border-t border-[#1e293b] pt-4 overflow-x-auto scrollbar-hide pb-1">
          {VIEWS.map((v) => {
            const Icon = v.icon;
            const isActive = activeView === v.id;
            return (
              <button
                key={v.id}
                onClick={() => setActiveView(v.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'bg-[#111827] border border-[#223048] text-slate-400 hover:text-slate-200 hover:border-slate-600'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{v.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Main View Content */}
      {activeView === 'studio' && (
        <div className="space-y-6">
          {/* 3-Column Studio Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            {/* Left Column: PM Approved Insights Selector */}
            <div className="lg:col-span-3 h-[740px]">
              <PRDInsightsSelector
                contextPreview={contextPreview}
                selectedInsightIds={selectedInsightIds}
                onToggleInsight={(id) => {
                  setSelectedInsightIds((prev) =>
                    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
                  );
                }}
                onSelectAll={(ids) => setSelectedInsightIds(ids)}
                onDeselectAll={() => setSelectedInsightIds([])}
                onGeneratePRD={handleOpenConfirmModal}
                isGenerating={isGenerating}
              />
            </div>

            {/* Center Column: 14-Section Document Viewer & Live Editor */}
            <div className="lg:col-span-6 h-[740px]">
              <PRDDocumentView
                prdData={prdData}
                onSavePRD={handleSavePRD}
                onRegeneratePRD={handleOpenConfirmModal}
                isSaving={isSaving}
                isRegenerating={isGenerating}
                onGoToGenerator={() => setActiveView('studio')}
              />
            </div>

            {/* Right Column: Source Insights, Evidence & Business Context */}
            <div className="lg:col-span-3 h-[740px] overflow-y-auto pr-1">
              <PRDRelatedContextSidebar
                prdData={prdData}
                contextPreview={contextPreview}
                onOpenPMReviewModal={() => setActiveView('pm_review')}
                onOpenTraceModal={handleOpenTrace}
              />
            </div>
          </div>

          {/* Bottom Table: MongoDB PRD History */}
          <PRDGeneratedHistoryTable
            projectsList={projectsList}
            selectedPrdId={selectedPrdId}
            onSelectPRD={handleSelectPRD}
          />
        </div>
      )}

      {/* View: Feature Deep-Dive & Team Circulation Studio */}
      {activeView === 'feature_explorer' && (
        <PRDFeatureDetailViewer
          prdData={prdData}
          onOpenTraceModal={handleOpenTrace}
          onGoToGenerator={() => setActiveView('studio')}
          onGenerateCirculationPackage={handleGenerateCirculationPackage}
        />
      )}

      {/* View 2: PM Review Package & Integrity */}
      {activeView === 'pm_review' && (
        <PRDReviewDetailsView
          contextPreview={contextPreview}
          onGoToGenerator={() => setActiveView('studio')}
          onSelectEvidenceTrace={(type, id) => handleOpenTrace(type, id)}
        />
      )}

      {/* View 3: Requirements & NFRs */}
      {activeView === 'requirements' && (
        <PRDRequirementsTable
          requirements={prdData?.requirements || []}
          onSelectRequirementTrace={(type, id) => handleOpenTrace(type, id)}
          onGoToGenerator={() => setActiveView('studio')}
        />
      )}

      {/* View 4: User Stories & Scenarios */}
      {activeView === 'user_stories' && (
        <UserStoriesGrid
          stories={prdData?.user_stories || []}
          onGenerateStories={handleGenerateStories}
          isGeneratingStories={isGeneratingStories}
          onSelectStoryTrace={(type, id) => handleOpenTrace(type, id)}
          onGoToGenerator={() => setActiveView('studio')}
        />
      )}

      {/* View 5: Traceability Matrix */}
      {activeView === 'traceability' && (
        <PRDTraceabilityTableView
          traceability={prdData?.traceability || []}
          onOpenTraceModal={handleOpenTrace}
          onGoToGenerator={() => setActiveView('studio')}
        />
      )}

      {/* View 6: PRD Review & Approval Gate */}
      {activeView === 'prd_review' && (
        <PRDReviewApprovalView
          prdData={prdData}
          onSubmitReview={handleSubmitReview}
          isSubmittingReview={isSubmittingReview}
          onGoToGenerator={() => setActiveView('studio')}
        />
      )}

      {/* View 7: AI Generation Run & Telemetry */}
      {activeView === 'ai_audit' && (
        <PRDAIGenerationAuditView
          prdData={prdData}
          onGoToGenerator={() => setActiveView('studio')}
        />
      )}
    </div>
  );
}
