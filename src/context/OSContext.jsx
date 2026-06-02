import { createContext, useContext, useMemo } from 'react';
import { useWindowManager } from '../hooks/useWindowManager.js';
import { useAchievements } from '../hooks/useAchievements.js';
import { useAppLauncher } from '../hooks/useAppLauncher.js';

const OSContext = createContext(null);

export function OSProvider({ children }) {
  const windowManager = useWindowManager();
  const achievements = useAchievements();
  const appLauncher = useAppLauncher(windowManager, achievements);

  const value = useMemo(
    () => ({
      ...windowManager,
      ...achievements,
      ...appLauncher,
    }),
    [windowManager, achievements, appLauncher]
  );

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
}
