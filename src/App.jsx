import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { OSProvider, useOS } from './context/OSContext.jsx';
import { useGlobalKeyboard } from './hooks/useGlobalKeyboard.js';
import { useWindowSize } from './hooks/useWindowSize.js';
import Desktop from './components/Desktop/Desktop.jsx';
import MenuBar from './components/MenuBar/MenuBar.jsx';
import Dock from './components/Dock/Dock.jsx';
import Screensaver from './components/Screensaver/Screensaver.jsx';
import Modal from './components/Modal/Modal.jsx';
import AchievementsPanel from './components/Achievements/AchievementsPanel.jsx';
import AchievementToast from './components/Achievements/AchievementToast.jsx';
import Spotlight from './components/Spotlight/Spotlight.jsx';
import HelloScreen from './components/HelloScreen/HelloScreen.jsx';
import JourneyBridge from './components/JourneyBridge/JourneyBridge.jsx';
import OnboardingTour from './components/OnboardingTour/OnboardingTour.jsx';
import IPhoneHome from './components/IPhoneHome/IPhoneHome.jsx';
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen.jsx';
import ShutdownPrompt from './components/ShutdownPrompt/ShutdownPrompt.jsx';
import styles from './App.module.css';

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

/* The scroll intro (hero → hand over the lens → about → timeline → MacBook →
   welcome) plays for everyone. `?intro=0` goes straight to the desktop. */
const INTRO_ENABLED = (() => {
  try {
    return new URLSearchParams(window.location.search).get('intro') !== '0';
  } catch {
    return true;
  }
})();
// Its own chunk (with three.js), so the desktop never waits on it.
const JourneyC = lazy(() => import('./components/Journey/C/JourneyC.jsx'));

const BLACKOUT_MS = 380;

function DesktopShell({ unlocked = true, onShutDown }) {
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const { helloDismissed, dismissHello } = useOS();

  // Intro flow: the welcome screen stands in for the hello screen.
  useEffect(() => {
    if (onShutDown && unlocked && !helloDismissed) dismissHello();
  }, [onShutDown, unlocked, helloDismissed, dismissHello]);

  const toggleSpotlight = () => setSpotlightOpen((open) => !open);

  return (
    <div className={styles.shell}>
      <GlobalKeyboardBridge
        spotlightOpen={spotlightOpen}
        onSpotlightToggle={toggleSpotlight}
      />
      <JourneyBridge />
      <MenuBar
        onOpenAchievements={() => setAchievementsOpen(true)}
        onShutDown={onShutDown}
      />
      <Desktop />
      <Dock />
      <HelloScreen />
      <OnboardingTour />
      <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
      <Screensaver />
      {onShutDown && <ShutdownPrompt onShutDown={onShutDown} disabled={!unlocked} />}
      <AchievementToast />
      <Modal
        title="Achievements"
        open={achievementsOpen}
        onClose={() => setAchievementsOpen(false)}
      >
        <AchievementsPanel />
      </Modal>
    </div>
  );
}

function AppShell() {
  const { isMobile } = useWindowSize();

  if (isMobile) {
    // Journey C is built for phones too: it plays, then lands on the iPhone home.
    return INTRO_ENABLED ? <MobileIntroFlow /> : <IPhoneHome />;
  }

  return INTRO_ENABLED ? <IntroFlow /> : <DesktopShell />;
}

/** Phones: the same intro, then straight into the iPhone home screen. */
function MobileIntroFlow() {
  const [done, setDone] = useState(false);
  const finish = useCallback(() => setDone(true), []);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('intro-scroll', !done);
    if (done) window.scrollTo(0, 0);
    return () => root.classList.remove('intro-scroll');
  }, [done]);

  if (done) return <IPhoneHome />;
  return (
    <Suspense fallback={<div style={{ height: '100vh', background: '#07070a' }} />}>
      <JourneyC mode="open" active onReachScreen={finish} onSkip={finish} phone />
    </Suspense>
  );
}

/** intro (scroll hero + 3D MacBook) → welcome → desktop; Shut Down plays it back. */
function IntroFlow() {
  const [phase, setPhase] = useState('intro');
  const [introMode, setIntroMode] = useState('open');
  const [blackout, setBlackout] = useState(false);

  // Only the intro scrolls the page; the OS is a fixed, full-viewport surface.
  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('intro-scroll', phase === 'intro');
    if (phase === 'desktop') window.scrollTo(0, 0);
    return () => root.classList.remove('intro-scroll');
  }, [phase]);

  const skipToWork = useCallback(() => setPhase('desktop'), []);
  const showWelcome = useCallback(() => setPhase('welcome'), []);

  const shutDown = useCallback(() => {
    setBlackout(true);
    setTimeout(() => {
      setIntroMode('close');
      setPhase('intro');
      setTimeout(() => setBlackout(false), 250);
    }, BLACKOUT_MS);
  }, []);

  return (
    <>
      {phase !== 'desktop' && (
        <Suspense fallback={<div style={{ height: '100vh', background: '#07070a' }} />}>
          <JourneyC
            mode={introMode}
            active={phase === 'intro'}
            onReachScreen={showWelcome}
            onSkip={skipToWork}
            onClosed={() => setIntroMode('open')}
          />
        </Suspense>
      )}
      {phase !== 'intro' && (
        <div className={styles.osLayer}>
          <DesktopShell unlocked={phase === 'desktop'} onShutDown={shutDown} />
        </div>
      )}
      {phase === 'welcome' && <WelcomeScreen onDone={() => setPhase('desktop')} />}
      <div className={`${styles.blackout} ${blackout ? styles.blackoutOn : ''}`} aria-hidden />
    </>
  );
}

export default function App() {
  return (
    <OSProvider skipHello={INTRO_ENABLED}>
      <AppShell />
    </OSProvider>
  );
}
