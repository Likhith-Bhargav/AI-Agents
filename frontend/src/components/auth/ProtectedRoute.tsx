'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
}

export default function ProtectedRoute({ 
  children, 
  requiredRole = 'user' 
}: ProtectedRouteProps) {
  const { user, isLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // Store the current URL so we can redirect back after login
      const currentPath = window.location.pathname;
      router.push(`/login?redirect=${encodeURIComponent(currentPath)}`);
    } else if (!isLoading && isAuthenticated && requiredRole === 'admin' && user?.role !== 'admin') {
      // User is logged in but doesn't have the required admin role
      router.push('/unauthorized');
    }
  }, [isLoading, isAuthenticated, user, router, requiredRole]);

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (requiredRole === 'admin' && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Unauthorized Access
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
