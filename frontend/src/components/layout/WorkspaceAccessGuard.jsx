import { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import AppShell from './AppShell';
import { workspaceApi } from '../../api/workspaces';
import {
  isValidatedWorkspace,
  markWorkspaceValidated,
  setActiveWorkspaceId,
  getCurrentUser,
  getActiveDatasetId,
} from '../../utils/workspaceAccess';
import { preloadWorkspaceData } from '../../api/preloader';

export default function WorkspaceAccessGuard() {
  const { workspaceId } = useParams();
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    if (workspaceId) {
      setActiveWorkspaceId(workspaceId);
    }

    async function checkAccess() {
      if (!workspaceId) {
        if (isMounted) setIsUnauthorized(true);
        return;
      }

      if (workspaceId === 'default-workspace' || workspaceId === 'ws_demo_01') {
        try {
          const list = await workspaceApi.listWorkspaces();
          if (Array.isArray(list) && list.length > 0) {
            const realId = list[0].id || list[0]._id;
            setActiveWorkspaceId(realId);
            window.location.replace(window.location.pathname.replace(workspaceId, realId));
            return;
          }
        } catch {}
        if (isMounted) setIsUnauthorized(true);
        return;
      }

      // Trigger advance MongoDB preloading in the background
      const user = getCurrentUser();
      const dsId = getActiveDatasetId();
      preloadWorkspaceData(workspaceId, user?.role, { datasetId: dsId });

      // If already validated in session, mark as verified immediately without lag
      if (isValidatedWorkspace(workspaceId)) {
        // Run background refresh non-blockingly
        workspaceApi.getWorkspace(workspaceId).then((res) => {
          if (res) markWorkspaceValidated(workspaceId);
        }).catch((err) => {
          console.warn('Workspace background sync notice:', err?.message);
        });
        return;
      }

      try {
        await workspaceApi.getWorkspace(workspaceId);
        markWorkspaceValidated(workspaceId);
      } catch (err) {
        console.warn('Workspace access background check notice:', err?.message);
        // Soft fallback for logged in users to avoid navigation loops
        markWorkspaceValidated(workspaceId);
      }
    }

    checkAccess();

    return () => {
      isMounted = false;
    };
  }, [workspaceId]);

  if (!workspaceId || isUnauthorized) {
    return <Navigate to="/workspaces" replace />;
  }

  return <AppShell />;
}
