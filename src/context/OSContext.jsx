import { createContext, useContext, useMemo, useCallback } from 'react';
import { useWindowManager } from '../hooks/useWindowManager.js';
import { useAchievements } from '../hooks/useAchievements.js';
import { useAppLauncher } from '../hooks/useAppLauncher.js';
import { useFilterState } from '../hooks/useFilterState.js';
import { useMusicPlayer } from '../hooks/useMusicPlayer.js';
import { usePetState, useMusicPlayerUi } from '../hooks/usePetState.js';
import { useJourneyState } from '../hooks/useJourneyState.js';

const OSContext = createContext(null);

export function OSProvider({ children }) {
  const windowManager = useWindowManager();
  const achievements = useAchievements();
  const filterState = useFilterState();
  const musicPlayer = useMusicPlayer();
  const musicPlayerUi = useMusicPlayerUi();
  const petState = usePetState();
  const journeyState = useJourneyState();
  const { markPortfolioOpened } = journeyState;
  const appLauncher = useAppLauncher(windowManager, achievements);

  const launchApp = useCallback(
    (appId, options = {}) => {
      const id = appLauncher.launchApp(appId, options);
      if (appId === 'finder') {
        markPortfolioOpened();
      }
      return id;
    },
    [appLauncher, markPortfolioOpened]
  );

  const launchFromDock = useCallback(
    (appId, options = {}) => {
      const id = appLauncher.launchFromDock(appId, options);
      if (appId === 'finder') {
        markPortfolioOpened();
      }
      return id;
    },
    [appLauncher, markPortfolioOpened]
  );

  const value = useMemo(
    () => ({
      ...windowManager,
      ...achievements,
      ...filterState,
      ...musicPlayer,
      ...musicPlayerUi,
      ...petState,
      ...journeyState,
      openProject: appLauncher.openProject,
      launchApp,
      launchFromDock,
    }),
    [
      windowManager,
      achievements,
      filterState,
      musicPlayer,
      musicPlayerUi,
      petState,
      journeyState,
      appLauncher.openProject,
      launchApp,
      launchFromDock,
    ]
  );

  return <OSContext.Provider value={value}>{children}</OSContext.Provider>;
}

export function useOS() {
  const ctx = useContext(OSContext);
  if (!ctx) throw new Error('useOS must be used within OSProvider');
  return ctx;
}
