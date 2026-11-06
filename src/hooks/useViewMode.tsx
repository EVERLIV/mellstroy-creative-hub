import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/src/hooks/useAuth';
import { getAppVariant, type AppVariant } from '@/src/lib/app-variant';
import type { UserRole } from '@/types';

export type ViewMode = 'student' | 'trainer' | 'admin';

type ViewModeContextValue = {
  isAdmin: boolean;
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  /** Role used by UI routing/shells (never admin). */
  effectiveRole: UserRole;
  appVariant: AppVariant;
};

const STORAGE_KEY = 'rhinofit-admin-view-mode';

const ViewModeContext = createContext<ViewModeContextValue | undefined>(undefined);

function readStoredMode(): ViewMode | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'student' || v === 'trainer' || v === 'admin') return v;
  } catch {
    /* ignore */
  }
  return null;
}

function defaultModeForVariant(appVariant: AppVariant): ViewMode {
  return appVariant === 'trainer' ? 'trainer' : 'student';
}

export function ViewModeProvider({ children }: { children: React.ReactNode }) {
  const { isAdmin, userRole } = useAuth();
  const appVariant = getAppVariant();
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    const stored = readStoredMode();
    if (stored) return stored;
    return defaultModeForVariant(appVariant);
  });

  useEffect(() => {
    if (!isAdmin) {
      const next: ViewMode =
        userRole === 'trainer' ? 'trainer' : userRole === 'student' ? 'student' : defaultModeForVariant(appVariant);
      setViewModeState(next);
    }
  }, [isAdmin, userRole, appVariant]);

  const setViewMode = (mode: ViewMode) => {
    if (!isAdmin && mode === 'admin') return;
    setViewModeState(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      /* ignore */
    }
  };

  const effectiveRole: UserRole = useMemo(() => {
    // Dual frontends: shell/routes follow the binary (VITE_APP_VARIANT).
    // Admins can override via the preview switcher.
    if (isAdmin) {
      if (viewMode === 'trainer') return 'trainer';
      if (viewMode === 'student') return 'student';
      return appVariant === 'trainer' ? 'trainer' : 'student';
    }
    return appVariant === 'trainer' ? 'trainer' : 'student';
  }, [isAdmin, viewMode, appVariant]);

  const value: ViewModeContextValue = {
    isAdmin: !!isAdmin,
    viewMode,
    setViewMode,
    effectiveRole,
    appVariant,
  };

  return <ViewModeContext.Provider value={value}>{children}</ViewModeContext.Provider>;
}

export function useViewMode() {
  const ctx = useContext(ViewModeContext);
  if (!ctx) throw new Error('useViewMode must be used within ViewModeProvider');
  return ctx;
}

/** Prefer this over useAuth().userRole for UI that should respect admin preview. */
export function useEffectiveRole(): UserRole {
  const { effectiveRole } = useViewMode();
  return effectiveRole;
}
