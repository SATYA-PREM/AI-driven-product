import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DataIngestion from './features/DataIngestion';
import { ProtectedRoutes, PublicRoutes } from './routes/RouteGuards';

// 1. Layouts
import AppShell from './components/layout/AppShell';
import WorkspaceAccessGuard from './components/layout/WorkspaceAccessGuard';
import PMRouteGuard from './components/layout/PMRouteGuard';

// 2. Landing & Auth
import LandingPage from './features/landing/LandingPage';
import Login from './features/auth/Login';

// 3. Profile & Account
import Profile from './features/profile/Profile';

// 4. Workspaces & PM Dashboard
import WorkspaceList from './features/workspaces/WorkspaceList';
import CreateWorkspace from './features/workspaces/CreateWorkspace';
import WorkspaceDashboard from './features/workspaces/WorkspaceDashboard';
import PMDashboard from './features/pm/PMDashboard';
import WorkspaceSettings from './features/workspaces/WorkspaceSettings';


// 5. Data Pipeline
import DatasetList from './features/datasets/DatasetList';
import UploadDataset from './features/datasets/UploadDataset';
import ValidationUI from './features/datasets/ValidationUI';
import ProcessingUI from './features/datasets/ProcessingUI';
import DirtyDataAgent from './features/dataAgent/DirtyDataAgent';

// 6. Intelligence, Review & Agents
import AIAgentPipeline from './features/aiAgents/AIAgentPipeline';
import PipelineWorkflow from './features/workflow/PipelineWorkflow';
import InsightsDashboard from './features/intelligence/InsightsDashboard';
import CriticalIssues from './features/intelligence/CriticalIssues';
import PMReview from './features/pm/PMReview';
import FeedbackManagement from './features/feedback/FeedbackManagement';
import FeaturesOverview from './features/features/FeaturesOverview';
import TeamResponsesPage from './features/pm/TeamResponsesPage';
import ProblemResolutionAuditPage from './features/pm/ProblemResolutionAuditPage';

// 7. Development & Outputs
import PRDManagement from './features/prd/PRDManagement';
import PRDAssignmentPage from './features/prd-assignment/PRDAssignmentPage';
import ChatAssistant from './features/assistant/ChatAssistant';

// 8. Member Role Workspace
import MemberDashboard from './features/member/MemberDashboard';
import MyAssignmentsPage from './features/member/MyAssignmentsPage';
import RoleRequirementView from './features/member/RoleRequirementView';
import AssignedPRDsView from './features/member/AssignedPRDsView';

// 9. Product Designer Dedicated Pages
import DesignerDashboard from './features/designer/DesignerDashboard';
import DesignerAssignments from './features/designer/DesignerAssignments';
import DesignerProductContext from './features/designer/DesignerProductContext';
import DesignerAssignedPRDs from './features/designer/DesignerAssignedPRDs';
import DesignerUXRequirements from './features/designer/DesignerUXRequirements';
import DesignerCustomerFeedback from './features/designer/DesignerCustomerFeedback';
import DesignerResponse from './features/designer/DesignerResponse';
import DesignerResponseWorkspace from './features/designer/DesignerResponseWorkspace';

// 10. Developer Workspace Dedicated Pages
import {
  DeveloperDashboard,
  DeveloperAssignments,
  ImplementationWorkspace,
  DeveloperDefects,
  DeveloperDesignHandoff,
  DeveloperBlockers,
  DeveloperSubmissions
} from './features/developer';

// 11. QA Lead / Tester Workspace Dedicated Pages
import {
  QADashboard,
  QATestAssignments,
  QATestPlans,
  QATestCases,
  QATestSuites,
  QATestExecution,
  QARegressionTesting,
  QADefects,
  QARetestingQueue,
  QAReports,
  QAReleaseReadiness,
  QAAssignedPRDs,
  QAAcceptanceCriteria,
  QADesignHandoff,
  QAProductContext
} from './features/qa';

// 12. Stakeholder / Business Owner Dedicated Pages
import {
  StakeholderDashboard,
  ProductOverview,
  BusinessObjectives,
  RoadmapPortfolio,
  PendingApprovals,
  PRDBusinessReview,
  BusinessFeedbackPage,
  DecisionHistoryPage,
  MilestonesProgress,
  BusinessImpactMetrics,
  RisksDependencies
} from './features/stakeholder';

import { useState, useEffect } from 'react';
import { workspaceApi } from './api/workspaces';

function WorkspaceSettingsRedirect() {
  const [targetUrl, setTargetUrl] = useState('');
  useEffect(() => {
    async function resolveWs() {
      try {
        const storedId = localStorage.getItem('active_workspace_id');
        if (storedId) {
          setTargetUrl(`/workspace/${storedId}/settings`);
          return;
        }
        const list = await workspaceApi.listWorkspaces();
        if (list && list.length > 0) {
          setTargetUrl(`/workspace/${list[0].id}/settings`);
        } else {
          setTargetUrl('/workspaces');
        }
      } catch {
        setTargetUrl('/workspaces');
      }
    }
    resolveWs();
  }, []);

  if (!targetUrl) {
    return (
      <div className="min-h-screen bg-[#070910] text-slate-100 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#5b3df5]"></div>
      </div>
    );
  }

  return <Navigate to={targetUrl} replace />;
}

export default function App() {
  return (
    <Router>
      <Routes>
        {/* Public pages */}
        <Route element={<PublicRoutes />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
        </Route>

        {/* Authenticated application */}
        <Route element={<ProtectedRoutes />}>
          <Route path="/profile" element={<Profile />} />
          <Route path="/workspaces" element={<WorkspaceList />} />
          <Route path="/workspaces/new" element={<CreateWorkspace />} />
          <Route path="/workspaces/settings" element={<WorkspaceSettingsRedirect />} />

          <Route path="/workspace/:workspaceId" element={<WorkspaceAccessGuard />}>
            {/* PM-Only Overview & Dedicated PM Dashboard */}
            <Route element={<PMRouteGuard />}>
              <Route path="pm-dashboard" element={<PMDashboard />} />
              <Route path="overview" element={<PMDashboard />} />
            </Route>
            {/* Workspace Operational Dashboard */}
            <Route path="dashboard" element={<WorkspaceDashboard />} />
            <Route path="workspace-dashboard" element={<WorkspaceDashboard />} />
            <Route path="settings" element={<WorkspaceSettings />} />

            <Route path="data/datasets" element={<DatasetList />} />
            <Route path="data/upload" element={<DataIngestion />} />
            <Route path="data/agent" element={<DirtyDataAgent />} />
            <Route path="data/preprocessing" element={<DirtyDataAgent />} />
            <Route path="data/dirty-data" element={<DirtyDataAgent />} />
            <Route path="data/validation" element={<ValidationUI />} />
            <Route path="data/processing" element={<ProcessingUI />} />
            <Route path="ai/analysis" element={<AIAgentPipeline />} />
            <Route path="ai/agents" element={<AIAgentPipeline />} />
            <Route path="workflow" element={<PipelineWorkflow />} />
            <Route path="intelligence/insights" element={<InsightsDashboard />} />
            <Route path="intelligence/issues" element={<CriticalIssues />} />
            <Route path="pm-review" element={<PMReview />} />
            <Route path="feedback" element={<FeedbackManagement />} />
            <Route path="features" element={<FeaturesOverview />} />
            <Route path="features/overview" element={<FeaturesOverview />} />
            <Route path="development/prd" element={<PRDManagement />} />
            <Route path="development/prd-assignments" element={<PRDAssignmentPage />} />
            <Route path="prd-assignments" element={<PRDAssignmentPage />} />
            <Route path="development/assignments" element={<PRDAssignmentPage />} />
            <Route path="assignments" element={<PRDAssignmentPage />} />
            <Route path="team-responses" element={<TeamResponsesPage />} />
            <Route path="resolution-audit" element={<ProblemResolutionAuditPage />} />
            <Route path="assistant" element={<ChatAssistant />} />

            {/* Member Role-Specific Workspace Routes */}
            <Route path="my-dashboard" element={<MemberDashboard />} />
            <Route path="my-assignments" element={<MyAssignmentsPage />} />
            <Route path="assigned-prds" element={<AssignedPRDsView />} />
            <Route path="ux-requirements" element={<RoleRequirementView viewType="ux" />} />
            <Route path="technical-requirements" element={<RoleRequirementView viewType="tech" />} />
            <Route path="acceptance-criteria" element={<RoleRequirementView viewType="acceptance" />} />
            <Route path="test-scenarios" element={<RoleRequirementView viewType="test" />} />
            <Route path="product-context" element={<RoleRequirementView viewType="context" />} />
            <Route path="customer-evidence" element={<RoleRequirementView viewType="evidence" />} />

            {/* Product Designer Dedicated Routes */}
            <Route path="designer/dashboard" element={<DesignerDashboard />} />
            <Route path="designer/assignments" element={<DesignerAssignments />} />
            <Route path="designer/assignments/:assignmentId" element={<DesignerResponseWorkspace />} />
            <Route path="designer/response/:assignmentId" element={<DesignerResponseWorkspace />} />
            <Route path="designer/product-context" element={<DesignerProductContext />} />
            <Route path="designer/assigned-prds" element={<DesignerAssignedPRDs />} />
            <Route path="designer/ux-requirements" element={<DesignerUXRequirements />} />
            <Route path="designer/customer-feedback" element={<DesignerCustomerFeedback />} />
            <Route path="designer/design-response" element={<DesignerResponse />} />

            {/* Developer Dedicated Routes */}
            <Route path="developer/dashboard" element={<DeveloperDashboard />} />
            <Route path="developer/assignments" element={<DeveloperAssignments />} />
            <Route path="developer/assignments/:assignmentId" element={<ImplementationWorkspace />} />
            <Route path="developer/assigned-prds" element={<AssignedPRDsView />} />
            <Route path="developer/technical-requirements" element={<RoleRequirementView viewType="tech" />} />
            <Route path="developer/design-handoff" element={<DeveloperDesignHandoff />} />
            <Route path="developer/submissions" element={<DeveloperSubmissions />} />
            <Route path="developer/defects" element={<DeveloperDefects />} />
            <Route path="developer/blockers" element={<DeveloperBlockers />} />
            <Route path="developer/product-context" element={<RoleRequirementView viewType="context" />} />

            {/* QA Lead / Tester Dedicated Routes */}
            <Route path="qa/dashboard" element={<QADashboard />} />
            <Route path="qa/assignments" element={<QATestAssignments />} />
            <Route path="qa/my-assignments" element={<QATestAssignments />} />
            <Route path="qa/test-plans" element={<QATestPlans />} />
            <Route path="qa/test-cases" element={<QATestCases />} />
            <Route path="qa/test-suites" element={<QATestSuites />} />
            <Route path="qa/test-execution" element={<QATestExecution />} />
            <Route path="qa/regression-testing" element={<QARegressionTesting />} />
            <Route path="qa/defects" element={<QADefects />} />
            <Route path="qa/retesting-queue" element={<QARetestingQueue />} />
            <Route path="qa/reports" element={<QAReports />} />
            <Route path="qa/release-readiness" element={<QAReleaseReadiness />} />
            <Route path="qa/assigned-prds" element={<QAAssignedPRDs />} />
            <Route path="qa/acceptance-criteria" element={<QAAcceptanceCriteria />} />
            <Route path="qa/design-handoff" element={<QADesignHandoff />} />
            <Route path="qa/product-context" element={<QAProductContext />} />

            {/* Stakeholder / Business Owner Dedicated Routes */}
            <Route path="stakeholder/dashboard" element={<StakeholderDashboard />} />
            <Route path="stakeholder/product-overview" element={<ProductOverview />} />
            <Route path="stakeholder/business-objectives" element={<BusinessObjectives />} />
            <Route path="stakeholder/roadmap" element={<RoadmapPortfolio />} />
            <Route path="stakeholder/approvals" element={<PendingApprovals />} />
            <Route path="stakeholder/prd-review" element={<PRDBusinessReview />} />
            <Route path="stakeholder/feedback" element={<BusinessFeedbackPage />} />
            <Route path="stakeholder/decisions" element={<DecisionHistoryPage />} />
            <Route path="stakeholder/milestones" element={<MilestonesProgress />} />
            <Route path="stakeholder/metrics" element={<BusinessImpactMetrics />} />
            <Route path="stakeholder/risks" element={<RisksDependencies />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}