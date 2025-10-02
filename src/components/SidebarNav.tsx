'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const SidebarNav: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const userNavItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/tasks', label: 'Tasks', icon: '✅' },
    { href: '/resources', label: 'Resources', icon: '📚' },
    { href: '/feedback', label: 'Feedback', icon: '💬' },
    { href: '/profile', label: 'Profile', icon: '👤' },
  ];

  const adminNavItems = [
    { href: '/admin/dashboard', label: 'Dashboard', icon: '🏠' },
    { href: '/admin/employees', label: 'Employees', icon: '👥' },
    { href: '/admin/tasks', label: 'Tasks', icon: '📋' },
    { href: '/admin/resources', label: 'Resources', icon: '📁' },
    { href: '/admin/feedback', label: 'Feedback', icon: '📝' },
    { href: '/admin/profile', label: 'Profile', icon: '👤' },
  ];

  const navItems = user?.role === 'admin' ? adminNavItems : userNavItems;

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg glass-card text-text-primary"
      >
        <span className="text-xl">☰</span>
      </button>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-full w-64 glass-card transform transition-transform duration-300 z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="p-6">
          {/* Logo */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-accent">EDUNUTSHELL</h1>
            <p className="text-text-secondary text-sm">Employee Onboarding</p>
          </div>

          {/* User Info */}
          <div className="mb-8 p-4 rounded-lg bg-secondary/30">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <p className="text-text-primary font-medium">{user?.name}</p>
                <p className="text-text-muted text-sm capitalize">{user?.role}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.href)
                    ? 'bg-accent text-white'
                    : 'text-text-secondary hover:bg-secondary/50 hover:text-text-primary'
                }`}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <div className="absolute bottom-6 left-6 right-6">
            <button
              onClick={logout}
              className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-text-secondary hover:bg-danger/20 hover:text-danger transition-colors"
            >
              <span className="text-lg">🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default SidebarNav;