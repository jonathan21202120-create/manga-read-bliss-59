import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import ProfileSetup from '@/pages/ProfileSetup';
import { LoadingTransition } from '@/components/LoadingTransition';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, hasProfile } = useAuth();

  if (isLoading) {
    return (
      <LoadingTransition isLoading={true} delay={0}>
        <div />
      </LoadingTransition>
    );
  }

  if (!user) {
    return <Login />;
  }

  if (!hasProfile()) {
    return <ProfileSetup />;
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
};