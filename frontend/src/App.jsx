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

// 7. Development
import Phases from './features/development/Phases';
import TaskBoard from './features/development/TaskBoard';
import PMValidation from './features/development/PMValidation';

// 8. Outputs
import Reports from './features/reports/Reports';
import ChatAssistant from './features/assistant/ChatAssistant';
import { useState, useEffect } from 'react';
import { workspaceApi } from './api/client';

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
            <Route path="development/phases" element={<Phases />} />
            <Route path="development/tasks" element={<TaskBoard />} />
            <Route path="development/validation" element={<PMValidation />} />
            <Route path="reports" element={<Reports />} />
            <Route path="assistant" element={<ChatAssistant />} />
          </Route>
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}