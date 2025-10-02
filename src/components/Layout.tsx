'use client';

import React, { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import SidebarNav from '@/components/SidebarNav';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user } = useAuth();

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