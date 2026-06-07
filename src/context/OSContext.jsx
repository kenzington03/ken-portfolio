import { createContext, useContext, useMemo } from 'react';
import { useWindowManager } from '../hooks/useWindowManager.js';
import { useAchievements } from '../hooks/useAchievements.js';
import { useAppLauncher } from '../hooks/useAppLauncher.js';
import { useFilterState } from '../hooks/useFilterState.js';
import { useMusicPlayer } from '../hooks/useMusicPlayer.js';
import { usePetState, useMusicPlayerUi } from '../hooks/usePetState.js';

const OSContext = createContext(null);

export function OSProvider({ children }) {
  const windowManager = useWindowManager();
  const achievements = useAchievements();
  const filterState = useFilterState();
  const musicPlayer = useMusicPlayer();
  const musicPlayerUi = useMusicPlayerUi();
  const petState = usePetState();
  const appLauncher = useAppLauncher(windowManager, achievements);

  const value = useMemo(
    () => ({
      ...windowManager,
      ...achievements,
      ...appLauncher,
      ...filterState,
      ...musicPlayer,
      ...musicPlayerUi,
      ...petState,
    }),
    [windowManager, achievements, appLauncher, filterState, musicPlayer, musicPlayerUi, petState]
  );

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
}
