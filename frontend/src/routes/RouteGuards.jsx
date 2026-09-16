import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { getStoredToken } from '../api/client';
import { getActiveWorkspaceId } from '../utils/workspaceAccess';

function hasSession() {
  const token = getStoredToken();
  const user = localStorage.getItem('currentUser');
  return Boolean(token || user);
}

export function PublicRoutes() {
  const location = useLocation();

  if (hasSession() && location.pathname === '/login') {
    const activeWsId = getActiveWorkspaceId();
    return <Navigate to={activeWsId ? `/workspace/${activeWsId}/overview` : '/workspaces'} replace />;
  }

  return <Outlet />;
}

export function ProtectedRoutes() {
  const location = useLocation();

  if (!hasSession()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}