'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SidebarNav from '@/components/SidebarNav';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, loading } = useAuth();

  // Show loading state if auth is still loading
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center page-background">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <div className="min-h-screen page-background">{children}</div>;
  }

  return (
    <div className="min-h-screen page-background flex">
      <SidebarNav />
      <main className="flex-1 ml-0 lg:ml-64 transition-all duration-300">
        <div className="p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;