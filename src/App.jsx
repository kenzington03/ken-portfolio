import { useState } from 'react';
import { OSProvider } from './context/OSContext.jsx';
import Desktop from './components/Desktop/Desktop.jsx';
import MenuBar from './components/MenuBar/MenuBar.jsx';
import Dock from './components/Dock/Dock.jsx';
import Screensaver from './components/Screensaver/Screensaver.jsx';
import Modal from './components/Modal/Modal.jsx';
import AchievementsPanel from './components/Achievements/AchievementsPanel.jsx';
import AchievementToast from './components/Achievements/AchievementToast.jsx';

export default function App() {
  const [achievementsOpen, setAchievementsOpen] = useState(false);

  return (
    <OSProvider>
      <MenuBar onOpenAchievements={() => setAchievementsOpen(true)} />
      <Desktop />
      <Dock />
      <Screensaver />
      <AchievementToast />
      <Modal
        title="Achievements"
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
      >
        <AchievementsPanel />
      </Modal>
    </OSProvider>
  );
}
