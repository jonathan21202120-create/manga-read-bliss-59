import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingTransitionProps {
  isLoading: boolean;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  delay?: number;
}

export function LoadingTransition({ 
  isLoading, 
  children, 
  fallback,
  delay = 150 
}: LoadingTransitionProps) {
  const [showLoading, setShowLoading] = useState(isLoading);
  const [showContent, setShowContent] = useState(!isLoading);

  useEffect(() => {
    if (isLoading) {
      setShowContent(false);
      const timer = setTimeout(() => setShowLoading(true), delay);
      return () => clearTimeout(timer);
    } else {
      setShowLoading(false);
      const timer = setTimeout(() => setShowContent(true), 50);
      return () => clearTimeout(timer);
    }
  }, [isLoading, delay]);

  if (showLoading) {
    return (
      <div className="animate-fade-in">
        {fallback || <DefaultLoadingFallback />}
      </div>
    );
  }

  if (showContent) {
    return (
      <div className="animate-fade-in">
        {children}
      </div>
    );
  }

  return null;
}

function DefaultLoadingFallback() {
  return (
    <div className="space-y-4 p-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}