'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface AuthRouteProps {
  children: React.ReactNode;
}

export default function AuthRoute({ children }: AuthRouteProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (!loading) {
      // User is already authenticated, redirect to appropriate dashboard
      if (user) {
        if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else {
          router.replace('/dashboard');
        }
        return;
      }

      // User is not authenticated, allow access to auth pages
      setShouldRender(true);
    }
  }, [user, loading, router]);

  // Show loading state while checking authentication
  if (loading || (user && !shouldRender)) {
    return (
      <div className="min-h-screen flex items-center justify-center page-background">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!shouldRender) {
    return null;
  }

  return <>{children}</>;
}