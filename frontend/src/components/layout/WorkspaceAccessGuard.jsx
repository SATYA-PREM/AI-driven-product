import { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import AppShell from './AppShell';
import { workspaceApi } from '../../api/client';
import {
  isValidatedWorkspace,
  markWorkspaceValidated,
  setActiveWorkspaceId,
} from '../../utils/workspaceAccess';

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

      // If already validated in session, mark as verified immediately without lag
      if (isValidatedWorkspace(workspaceId)) {
        // Run background refresh non-blockingly
        workspaceApi.getWorkspace(workspaceId).then((res) => {
          if (res) markWorkspaceValidated(workspaceId);
        }).catch((err) => {
          if (err?.status === 404 || err?.status === 403) {
            if (isMounted) setIsUnauthorized(true);
          }
        });
        return;
      }

      try {
        await workspaceApi.getWorkspace(workspaceId);
        markWorkspaceValidated(workspaceId);
      } catch (err) {
        console.warn('Workspace access background check notice:', err?.message);
        if (err?.status === 404 || err?.status === 403) {
          if (isMounted) setIsUnauthorized(true);
        } else {
          // Soft fallback so network drop doesn't kick user out
          markWorkspaceValidated(workspaceId);
        }
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
