import { useState } from 'react';
import { OSProvider, useOS } from './context/OSContext.jsx';
import { useGlobalKeyboard } from './hooks/useGlobalKeyboard.js';
import Desktop from './components/Desktop/Desktop.jsx';
import MenuBar from './components/MenuBar/MenuBar.jsx';
import Dock from './components/Dock/Dock.jsx';
import Screensaver from './components/Screensaver/Screensaver.jsx';
import Modal from './components/Modal/Modal.jsx';
import AchievementsPanel from './components/Achievements/AchievementsPanel.jsx';
import AchievementToast from './components/Achievements/AchievementToast.jsx';
import Spotlight from './components/Spotlight/Spotlight.jsx';

function GlobalKeyboardBridge({ spotlightOpen, onSpotlightToggle }) {
  const { activeWindowId, closeWindow, windows } = useOS();
  useGlobalKeyboard({
    activeWindowId,
    closeWindow,
    windows,
    spotlightOpen,
    onSpotlightToggle,
  });
  return null;
}

function AppShell() {
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  const toggleSpotlight = () => setSpotlightOpen((open) => !open);

  return (
    <>
      <GlobalKeyboardBridge
        spotlightOpen={spotlightOpen}
        onSpotlightToggle={toggleSpotlight}
      />
      <MenuBar onOpenAchievements={() => setAchievementsOpen(true)} />
      <Desktop />
      <Dock />
      <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
      <Screensaver />
      <AchievementToast />
      <Modal
        title="Achievements"
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
      >
        <AchievementsPanel />
      </Modal>
    </>
  );
}

export default function App() {
  return (
    <OSProvider>
      <AppShell />
    </OSProvider>
  );
}
