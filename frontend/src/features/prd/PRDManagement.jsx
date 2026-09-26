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
} from 'lucide-react';
import { prdApi } from '../../api/client';
import {
  getActiveWorkspaceId,
  getActiveDatasetId,
  subscribeToActiveDataset,
  getActiveSourceType,
  subscribeToActiveSourceType,
} from '../../utils/workspaceAccess';

import PRDContextViewer from './components/PRDContextViewer';
import PRDEditor from './components/PRDEditor';
import PRDRequirementsTable from './components/PRDRequirementsTable';
import UserStoriesGrid from './components/UserStoriesGrid';
import FeaturePrioritizationMatrix from './components/FeaturePrioritizationMatrix';
import DevelopmentTasksBoard from './components/DevelopmentTasksBoard';
import ProvenanceTraceModal from './components/ProvenanceTraceModal';

const TABS = [
  'PRD Generator',
  'PRD Document & Editor',
  'Requirements & Stories',
  'Feature Prioritization',
  'Phasing & Development Tasks',
];

export default function PRDManagement(props) {
  const { workspaceId: routeWsId } = useParams();
  const workspaceId = props.workspaceId || routeWsId || getActiveWorkspaceId();

  const [activeTab, setActiveTab] = useState('PRD Generator');
  const [contextPreview, setContextPreview] = useState(null);
  const [pmReviews, setPmReviews] = useState([]);
  const [selectedReviewId, setSelectedReviewId] = useState('REV-001');
  const [selectedDatasetId, setSelectedDatasetId] = useState(() => getActiveDatasetId());
  const [selectedSourceType, setSelectedSourceType] = useState(() => getActiveSourceType());
  const [prdData, setPrdData] = useState(null);
  const [pmComments, setPmComments] = useState('');

  const [isLoadingContext, setIsLoadingContext] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingStories, setIsGeneratingStories] = useState(false);
  const [traceData, setTraceData] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
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

  // 1. Load PM Review Context Preview & Existing PRD
  const loadContextAndPRD = async (reviewId = selectedReviewId, dsId = selectedDatasetId, sType = selectedSourceType) => {
    if (!workspaceId) return;
    setIsLoadingContext(true);
    try {
      const [reviews, preview] = await Promise.all([
        prdApi.listPMReviews(workspaceId, { datasetId: dsId, sourceType: sType }).catch(() => []),
        prdApi.getContextPreview(workspaceId, reviewId, { datasetId: dsId, sourceType: sType }),
      ]);
      setPmReviews(reviews || []);
      setContextPreview(preview);
      if (preview?.pm_comments) {
        setPmComments(preview.pm_comments);
      }

      // Check if PRD already exists in workspace for this specific batch
      const projects = await prdApi.listProjects(workspaceId, { datasetId: dsId, sourceType: sType }).catch(() => []);
      if (projects && projects.length > 0) {
        const latestPrd = await prdApi.getPRD(workspaceId, projects[0].prd_id);
        setPrdData(latestPrd);
      } else {
        setPrdData(null);
      }
    } catch (err) {
      console.error('Failed to load PRD context preview:', err);
      setPrdData(null);
    } finally {
      setIsLoadingContext(false);
    }
  };

  useEffect(() => {
    loadContextAndPRD(selectedReviewId, selectedDatasetId, selectedSourceType);
  }, [workspaceId, selectedReviewId, selectedDatasetId, selectedSourceType]);

  const handleSelectReview = (reviewId) => {
    setSelectedReviewId(reviewId);
    showToast(`Switched active context package to ${reviewId}`);
  };

  const handleApproveReview = async (reviewId) => {
    try {
      await prdApi.approvePMReview(workspaceId, reviewId);
      showToast(`PM Review Package ${reviewId} approved!`);
      setSelectedReviewId(reviewId);
      loadContextAndPRD(reviewId, selectedDatasetId, selectedSourceType);
    } catch (err) {
      showToast(`Approval failed: ${err.message}`);
    }
  };

  // 2. Trigger Batch PRD Generation
  const handleGeneratePRD = async () => {
    if (!workspaceId) return;
    setIsGenerating(true);
    showToast('Executing CrewAI + Gemini Multi-Agent Batch PRD Generation...');
    try {
      const res = await prdApi.generatePRD(workspaceId, {
        source_review_id: selectedReviewId || 'REV-001',
        dataset_id: selectedDatasetId || undefined,
        source_type: selectedSourceType !== 'all' ? selectedSourceType : undefined,
        pm_comments: pmComments,
      });
      setPrdData(res);
      setActiveTab('PRD Document & Editor');
      showToast('Structured PRD generated successfully!');
    } catch (err) {
      showToast(`PRD Generation failed: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // 3. Save PRD Section Edits
  const handleSavePRD = async (updateData) => {
    const prdId = prdData?.project?.prd_id;
    if (!prdId) return;
    setIsSaving(true);
    try {
      const updated = await prdApi.updatePRD(workspaceId, prdId, updateData);
      setPrdData(updated);
      showToast('PRD Document updated successfully!');
    } catch (err) {
      showToast(`Update failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // 4. Submit PM Review Gate
  const handleSubmitReviewGate = async (decision, comments) => {
    const prdId = prdData?.project?.prd_id;
    if (!prdId) return;
    try {
      const updated = await prdApi.submitReviewGate(workspaceId, prdId, {
        decision,
        comments,
        reviewed_by: 'Priya Sharma (PM)',
      });
      setPrdData(updated);
      showToast(`PM Review Gate submitted: ${decision.toUpperCase()}`);
    } catch (err) {
      showToast(`Review gate error: ${err.message}`);
    }
  };

  // 5. Generate User Stories
  const handleGenerateStories = async () => {
    const prdId = prdData?.project?.prd_id;
    if (!prdId) return;
    setIsGeneratingStories(true);
    try {
      await prdApi.generateUserStories(workspaceId, prdId);
      const updated = await prdApi.getPRD(workspaceId, prdId);
      setPrdData(updated);
      showToast('User Stories & Acceptance Criteria generated!');
    } catch (err) {
      showToast(`Story generation error: ${err.message}`);
    } finally {
      setIsGeneratingStories(false);
    }
  };

  // 6. Trace Lineage Modal
  const handleTraceLineage = async (itemType, itemId) => {
    const prdId = prdData?.project?.prd_id;
    if (!prdId) return;
    try {
      const res = await prdApi.getProvenance(workspaceId, prdId, itemType, itemId);
      setTraceData(res);
    } catch (err) {
      showToast(`Trace error: ${err.message}`);
    }
  };

  return (
    <div className="w-full text-slate-300 font-sans space-y-6 select-none pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#1e293b] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Milestone 3</span>
            <span className="text-xs text-slate-600">/</span>
            <span className="text-xs font-semibold text-violet-400">PRD Generation System</span>
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">PRD Generator & Development Studio</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadContextAndPRD}
            className="px-3.5 py-1.5 rounded-xl bg-[#111827] border border-[#223048] hover:border-violet-500/50 text-xs font-semibold text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Refresh Context
          </button>
        </div>
      </div>

      {/* Navigation Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#1e293b] pb-2 scrollbar-none">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
              activeTab === tab
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                : 'bg-[#0b101b] border border-[#1e293b] text-slate-400 hover:text-white hover:border-[#223048]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active Tab View */}
      {activeTab === 'PRD Generator' && (
        <PRDContextViewer
          contextPreview={contextPreview}
          pmReviews={pmReviews}
          selectedReviewId={selectedReviewId}
          onSelectReview={handleSelectReview}
          onApproveReview={handleApproveReview}
          isLoadingContext={isLoadingContext}
          isGenerating={isGenerating}
          onGeneratePRD={handleGeneratePRD}
          pmComments={pmComments}
          setPmComments={setPmComments}
        />
      )}

      {activeTab === 'PRD Document & Editor' && (
        <PRDEditor
          prdData={prdData}
          onSavePRD={handleSavePRD}
          onSubmitReview={handleSubmitReviewGate}
          isSaving={isSaving}
          onGoToGenerator={() => setActiveTab('PRD Generator')}
        />
      )}

      {activeTab === 'Requirements & Stories' && (
        <div className="space-y-6">
          <PRDRequirementsTable
            requirements={prdData?.requirements || []}
            onSelectRequirementTrace={handleTraceLineage}
            onGoToGenerator={() => setActiveTab('PRD Generator')}
          />
          <UserStoriesGrid
            stories={prdData?.user_stories || []}
            onGenerateStories={handleGenerateStories}
            isGeneratingStories={isGeneratingStories}
            onSelectStoryTrace={handleTraceLineage}
            onGoToGenerator={() => setActiveTab('PRD Generator')}
          />
        </div>
      )}

      {activeTab === 'Feature Prioritization' && (
        <FeaturePrioritizationMatrix
          features={prdData?.features || []}
          onGoToGenerator={() => setActiveTab('PRD Generator')}
        />
      )}

      {activeTab === 'Phasing & Development Tasks' && (
        <DevelopmentTasksBoard
          phases={prdData?.phases || []}
          tasks={prdData?.tasks || []}
          onSelectTaskTrace={handleTraceLineage}
          onGoToGenerator={() => setActiveTab('PRD Generator')}
        />
      )}

      {/* Traceability Explorer Modal */}
      {traceData && (
        <ProvenanceTraceModal traceData={traceData} onClose={() => setTraceData(null)} />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#111827] border border-violet-500/40 text-slate-100 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-medium animate-fadeIn">
          {toastMsg}
        </div>
      )}
    </div>
  );
}
