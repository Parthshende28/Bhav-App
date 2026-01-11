import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useAuthStore } from '@/store/auth-store';

// Create context
const AuthContext = createContext<ReturnType<typeof useAuthStore> | null>(null);

// Provider component
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  // Get the auth state from Zustand
  const authStore = useAuthStore();

  // Initialize auth on mount (load token from secure storage)
  useEffect(() => {
    // Fire-and-forget init
    authStore.initAuth().catch((e) => console.error('initAuth error', e));
  }, []);

  return (
    <AuthContext.Provider value={authStore}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};