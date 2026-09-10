import { Navigate, Outlet, useLocation } from 'react-router-dom';

function hasSession() {
  return Boolean(localStorage.getItem('token'));
}

export function PublicRoutes() {
  return <Outlet />;
}

export function ProtectedRoutes() {
  const location = useLocation();

  if (!hasSession()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}