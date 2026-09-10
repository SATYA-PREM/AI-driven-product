import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DataIngestion from './features/DataIngestion';
import { ProtectedRoutes, PublicRoutes } from './routes/RouteGuards';

// 1. Layouts
import AppShell from './components/layout/AppShell';
import WorkspaceAccessGuard from './components/layout/WorkspaceAccessGuard';

// 2. Landing & Auth
import LandingPage from './features/landing/LandingPage';
import Login from './features/auth/Login';

// 3. Profile & Account
import Profile from './features/profile/Profile';

// 4. Workspaces
import WorkspaceList from './features/workspaces/WorkspaceList';
import CreateWorkspace from './features/workspaces/CreateWorkspace';
import WorkspaceDashboard from './features/workspaces/WorkspaceDashboard';

// 5. Data Pipeline
import DatasetList from './features/datasets/DatasetList';
import UploadDataset from './features/datasets/UploadDataset';
import ValidationUI from './features/datasets/ValidationUI';
import ProcessingUI from './features/datasets/ProcessingUI';

// 6. Intelligence
import InsightsDashboard from './features/intelligence/InsightsDashboard';
import CriticalIssues from './features/intelligence/CriticalIssues';
import Trends from './features/intelligence/Trends';

// 7. Development
import Phases from './features/development/Phases';
import TaskBoard from './features/development/TaskBoard';
import PMValidation from './features/development/PMValidation';

// 8. Outputs
import Reports from './features/reports/Reports';
import ChatAssistant from './features/assistant/ChatAssistant';

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

          <Route path="/workspace/:workspaceId" element={<WorkspaceAccessGuard />}>
            <Route path="overview" element={<WorkspaceDashboard />} />
            <Route path="data/datasets" element={<DatasetList />} />
            <Route path="data/upload" element={<DataIngestion />} />
            <Route path="data/validation" element={<ValidationUI />} />
            <Route path="data/processing" element={<ProcessingUI />} />
            <Route path="intelligence/insights" element={<InsightsDashboard />} />
            <Route path="intelligence/issues" element={<CriticalIssues />} />
            <Route path="intelligence/trends" element={<Trends />} />
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