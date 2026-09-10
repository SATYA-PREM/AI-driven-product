import { Navigate, useParams } from 'react-router-dom';
import AppShell from './AppShell';
import { canAccessWorkspace, getStoredWorkspaces, getCurrentUser } from '../../utils/workspaceAccess';

export default function WorkspaceAccessGuard() {
  const { workspaceId } = useParams();
  const workspaces = getStoredWorkspaces();
  const workspace = workspaces.find((item) => item.id === workspaceId);
  const currentUser = getCurrentUser();

  if (!workspace || !canAccessWorkspace(workspace, currentUser)) {
    return <Navigate to="/workspaces" replace />;
  }

  return <AppShell />;
}

