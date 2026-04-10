'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API_URL } from '@/lib/constants';

interface DashboardContextType {
  credits: number;
  planName: string;
  profileName: string;
  avatarUrl: string;
  userEmail: string;
  isLoading: boolean;
  refreshUserData: () => Promise<void>;
  setProfileName: (name: string) => void;
  setAvatarUrl: (url: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [credits, setCredits] = useState(0);
  const [planName, setPlanName] = useState('No Plan');
  const [profileName, setProfileName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [userEmail, setUserEmail] = useState('');

  const refreshUserData = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      router.push('/login');
      return;
    }

    try {
      const [statusRes, userRes] = await Promise.all([
        fetch(`${API_URL}/subscriptions/status`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API_URL}/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      if (statusRes.status === 401 || userRes.status === 401) {
        localStorage.removeItem('access_token');
        router.push('/login');
        return;
      }

      const [statusData, userData] = await Promise.all([
        statusRes.json(),
        userRes.json()
      ]);

      if (statusData.isActive) {
        setCredits(statusData.credits);
        setPlanName(statusData.plan);
      }
      setProfileName(userData.name || '');
      setAvatarUrl(userData.avatarUrl || '');
      setUserEmail(userData.email || '');
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUserData();
  }, []);

  return (
    <DashboardContext.Provider value={{
      credits,
      planName,
      profileName,
      avatarUrl,
      userEmail,
      isLoading,
      refreshUserData,
      setProfileName,
      setAvatarUrl
    }}>
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
}
