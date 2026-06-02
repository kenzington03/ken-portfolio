import { useCallback, useEffect, useState } from 'react';
import { achievements, ACHIEVEMENTS_STORAGE_KEY } from '../data/achievements.js';

function loadUnlocked() {
  try {
    const raw = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveUnlocked(ids) {
  try {
    localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore */
  }
}

export function useAchievements() {
  const [unlockedIds, setUnlockedIds] = useState(loadUnlocked);
  const [showToast, setShowToast] = useState(null);
  const [terminalCommandCount, setTerminalCommandCount] = useState(new Set());
  const [projectsViewed, setProjectsViewed] = useState(new Set());

  const unlock = useCallback((id) => {
    setUnlockedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      saveUnlocked(next);
      const achievement = achievements.find((a) => a.id === id);
      if (achievement) setShowToast(achievement);
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => setShowToast(null), []);

  const trackTerminalCommand = useCallback(
    (cmd) => {
      setTerminalCommandCount((prev) => {
        const next = new Set(prev);
        next.add(cmd);
        if (next.size >= 5) unlock('terminal_ninja');
        return next;
      });
    },
    [unlock]
  );

  const trackProjectView = useCallback(
    (projectId) => {
      setProjectsViewed((prev) => {
        const next = new Set(prev);
        next.add(projectId);
        if (next.size >= 3) unlock('project_hunter');
        return next;
      });
    },
    [unlock]
  );

  const trackWindowCount = useCallback(
    (count) => {
      if (count >= 4) unlock('power_user');
    },
    [unlock]
  );

  useEffect(() => {
    unlock('first_boot');
  }, [unlock]);

  const resetAchievements = useCallback(() => {
    saveUnlocked([]);
    setUnlockedIds([]);
    setTerminalCommandCount(new Set());
    setProjectsViewed(new Set());
  }, []);

  return {
    achievements,
    unlockedIds,
    unlock,
    showToast,
    dismissToast,
    trackTerminalCommand,
    trackProjectView,
    trackWindowCount,
    resetAchievements,
  };
}
