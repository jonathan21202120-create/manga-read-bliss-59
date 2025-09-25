import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/pages/Login';
import ProfileSetup from '@/pages/ProfileSetup';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isLoading, hasProfile } = useAuth();

  console.log('ProtectedRoute render:', { user: !!user, isLoading, hasProfile: hasProfile() });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
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