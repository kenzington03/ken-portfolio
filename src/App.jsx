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

/* Scroll intro (hero → MacBook → welcome) is behind a flag until approved:
   ?intro=1 is v1, ?intro=2 is v2 ("Night Studio"), ?intro=3 is v3 (walk-in hero →
   about → Mac), ?intro=4 is v4 ("Exposure": light page, lights out before the Mac).
   ?intro=5 is journey A ("Hey, I'm Ken" type-window over the work), ?intro=6 is journey B ("The Desk"), ?intro=7 is journey C (Ken's own flow).
   `npm run dev:v2` … `dev:v6` serve those on :5174 … :5178. */
const INTRO_VERSION = (() => {
  try {
    const q = new URLSearchParams(window.location.search).get('intro');
    if (['1', '2', '3', '4', '5', '6', '7'].includes(q)) return q;
  } catch {
    /* fall through */
  }
  const env = import.meta.env.VITE_INTRO;
  return ['1', '2', '3', '4', '5', '6', '7'].includes(env) ? env : null;
})();
const INTRO_ENABLED = INTRO_VERSION !== null;
// Both intros are their own chunks: visitors without the flag never fetch them.
const Intro = lazy(() => import('./components/Intro/Intro.jsx'));
const Intro2 = lazy(() => import('./components/Intro2/Intro2.jsx'));
const Intro3 = lazy(() => import('./components/Intro3/Intro3.jsx'));
const Intro4 = lazy(() => import('./components/Intro4/Intro4.jsx'));
const JourneyA = lazy(() => import('./components/Journey/A/JourneyA.jsx'));
const JourneyB = lazy(() => import('./components/Journey/B/JourneyB.jsx'));
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
    return INTRO_VERSION === '7' ? <MobileIntroFlow /> : <IPhoneHome />;
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
  const IntroView = INTRO_VERSION === '7' ? JourneyC : INTRO_VERSION === '6' ? JourneyB : INTRO_VERSION === '5' ? JourneyA : INTRO_VERSION === '4' ? Intro4 : INTRO_VERSION === '3' ? Intro3 : INTRO_VERSION === '2' ? Intro2 : Intro;
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
          <IntroView
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
