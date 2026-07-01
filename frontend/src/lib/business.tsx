'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from './api';
import type { BusinessOverview, BusinessProfile } from './types';

interface BusinessContextValue {
  profile: BusinessProfile | null;
  overview: BusinessOverview | null;
  loading: boolean;
  refresh: () => Promise<void>;
  updateProfile: (patch: Partial<BusinessProfile>) => Promise<void>;
}

const BusinessContext = createContext<BusinessContextValue | undefined>(undefined);

export function BusinessProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  const [overview, setOverview] = useState<BusinessOverview | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [profileRes, overviewRes] = await Promise.all([
      api.get<BusinessProfile>('/business/me'),
      api.get<BusinessOverview>('/business/overview'),
    ]);
    setProfile(profileRes);
    setOverview(overviewRes);
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
    // Light polling keeps the "AI handled" stats and unread counts feeling live
    // without needing a websocket connection for this version.
    const interval = setInterval(() => {
      refresh().catch(() => undefined);
    }, 15_000);
    return () => clearInterval(interval);
  }, [refresh]);

  const updateProfile = useCallback(
    async (patch: Partial<BusinessProfile>) => {
      const updated = await api.patch<BusinessProfile>('/business/me', patch);
      setProfile(updated);
    },
    [],
  );

  return (
    <BusinessContext.Provider value={{ profile, overview, loading, refresh, updateProfile }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  const ctx = useContext(BusinessContext);
  if (!ctx) throw new Error('useBusiness must be used within a BusinessProvider');
  return ctx;
}
