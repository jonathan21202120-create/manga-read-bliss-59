import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import ProfileSetup from '@/pages/ProfileSetup';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, hasProfile } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!hasProfile()) {
    return <ProfileSetup />;
  }

  return <>{children}</>;
};