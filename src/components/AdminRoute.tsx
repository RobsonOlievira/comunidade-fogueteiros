import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/src/context/AuthContext';

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, cargo, cargoLoaded } = useAuth();

  if (loading || !cargoLoaded) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (!user || (cargo !== 'admin' && cargo !== 'mod')) {
    return <Navigate to="/labs" replace />;
  }

  return <>{children}</>;
}
