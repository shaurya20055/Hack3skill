import { Navigate } from 'react-router-dom';
import { useAlertStore } from '../store';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export const ProtectedRoute = ({ children }: Props) => {
  const isAuthenticated = useAlertStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};
