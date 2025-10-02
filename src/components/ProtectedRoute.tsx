'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'user';
  redirectTo?: string;
}

export default function ProtectedRoute({ 
  children, 
  requiredRole, 
  redirectTo 
}: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!loading) {
      // User is not authenticated
      if (!user) {
        router.replace(redirectTo || '/auth/login');
        return;
      }

      // User is authenticated but doesn't have required role
      if (requiredRole && user.role !== requiredRole) {
        if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
        return;
      }

      // User is authorized
      setIsAuthorized(true);
    }
  }, [user, loading, requiredRole, redirectTo, router]);

  // Show loading state while checking authentication
  if (loading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center page-background">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}