'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'user';
  startDate?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Only run on client side
    if (typeof window !== 'undefined') {
      // Add a small delay to prevent flashing
      const initAuth = async () => {
        try {
          // Check for stored auth data on mount
          const storedToken = localStorage.getItem('authToken');
          const storedUser = localStorage.getItem('userData');
          
          if (storedToken && storedUser) {
            try {
              setToken(storedToken);
              setUser(JSON.parse(storedUser));
            } catch (error) {
              console.error('Error parsing stored user data:', error);
              // Clear invalid data
              localStorage.removeItem('authToken');
              localStorage.removeItem('userData');
            }
          }
        } catch (error) {
          console.error('Auth initialization error:', error);
        } finally {
          setLoading(false);
          setIsInitialized(true);
        }
      };

      // Small delay to prevent flash of wrong content
      setTimeout(initAuth, 100);
    } else {
      setLoading(false);
      setIsInitialized(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setLoading(true);
      const result = await authAPI.login(email, password);

      if (result.success && result.data) {
        const { accessToken, user: userData } = result.data;
        setToken(accessToken);
        setUser({
          id: userData._id || userData.id,
          name: userData.name,
          email: userData.email,
          phone: userData.phone,
          role: userData.role,
          startDate: userData.startDate,
        });
        
        // Only access localStorage on client side
        if (typeof window !== 'undefined') {
          localStorage.setItem('authToken', accessToken);
          localStorage.setItem('userData', JSON.stringify({
            id: userData._id || userData.id,
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            role: userData.role,
            startDate: userData.startDate,
          }));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setLoading(true);
    setUser(null);
    setToken(null);
    
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      // Use replace to prevent back button issues
      window.location.replace('/auth/login');
    }
  };

  const value = {
    user,
    token,
    login,
    logout,
    loading,
  };

  // Don't render children until auth is initialized
  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center page-background">
        <div className="glass-card p-8 rounded-2xl text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-text-secondary">Loading OnboardFlow...</p>
        </div>
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};