import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingTransition } from '@/components/LoadingTransition';

interface AuthCheckProps {
  children: React.ReactNode;
}

export const AuthCheck: React.FC<AuthCheckProps> = ({ children }) => {
  const { isLoading } = useAuth();

  if (isLoading) {
    return (
      <LoadingTransition isLoading={true} delay={0}>
        <div />
      </LoadingTransition>
    );
  }

  return (
    <div className="animate-fade-in">
      {children}
    </div>
  );
};