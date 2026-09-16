import { useState, useEffect } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import AppShell from './AppShell';
import { workspaceApi } from '../../api/client';

export default function WorkspaceAccessGuard() {
  const { workspaceId } = useParams();
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      if (!workspaceId) {
        if (isMounted) setIsUnauthorized(true);
        return;
      }
      try {
        await workspaceApi.getWorkspace(workspaceId);
      } catch (err) {
        console.warn('Workspace access background check:', err?.message);
        if (err?.status === 404 || err?.status === 403) {
          if (isMounted) setIsUnauthorized(true);
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

