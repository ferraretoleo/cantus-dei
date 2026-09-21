import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function MasterRoute({
  children
}: {
  children: ReactNode;
}) {
  const { token, user } = useAuth();

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  if (user?.perfilGlobal !== 'MASTER') {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
