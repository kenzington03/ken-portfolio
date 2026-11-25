import { Suspense, lazy, useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { OSProvider, useOS } from './context/OSContext.jsx';
import { useGlobalKeyboard } from './hooks/useGlobalKeyboard.js';
import { useWindowSize } from './hooks/useWindowSize.js';
import { useTheme } from './components/IOS26/theme.js';
import LaptopHint from './components/IOS26/LaptopHint.jsx';
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
import WelcomeScreen from './components/WelcomeScreen/WelcomeScreen.jsx';
import ShutdownPrompt from './components/ShutdownPrompt/ShutdownPrompt.jsx';
import BriefSheet from './components/Brief/BriefSheet.jsx';
import { paletteStyle, readPalette } from './components/Journey/C/palette.js';
import { clearWork, workSlugFromUrl } from './utils/route.js';
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
// Phones: the same story as the laptop, then an iPhone (iOS 26) in place of the Mac.
const IOS26Phone = lazy(() => import('./components/IOS26/IOS26Phone.jsx'));
// A shared link to one project opens its page.
const PhonePage = lazy(() => import('./components/PhonePage/PhonePage.jsx'));

const BLACKOUT_MS = 380;

function DesktopShell({ unlocked = true, onShutDown }) {
  const [achievementsOpen, setAchievementsOpen] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [briefOpen, setBriefOpen] = useState(false);
  const { helloDismissed, dismissHello } = useOS();
  // "Let's talk", from anywhere on the Mac (the desktop icon asks for it).
  useEffect(() => {
    const open = () => setBriefOpen(true);
    window.addEventListener('ken:brief', open);
    return () => window.removeEventListener('ken:brief', open);
  }, []);

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
        onWorkWithMe={() => setBriefOpen(true)}
      />
      <Desktop />
      <Dock />
      <HelloScreen />
      <OnboardingTour />
      <Spotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} />
      <Screensaver />
      {onShutDown && <ShutdownPrompt onShutDown={onShutDown} disabled={!unlocked} />}
      <AchievementToast />
      <BriefSheet open={briefOpen} onClose={() => setBriefOpen(false)} style={paletteStyle(readPalette())} />
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
  if (isMobile) return <PhoneFlow />;
  return INTRO_ENABLED ? <IntroFlow /> : <DesktopShell />;
}

/** Phones: the laptop's story (hero, About, the career, the logo), then, where
 *  the laptop opens, an iPhone. Its screen grows until it is the visitor's
 *  screen: the iOS 26 lock screen. Swipe up and it is the home screen: About,
 *  Brief, Resume, Contact, the Work folder, the games. A link to a project
 *  (/work/<slug>) goes straight to that project's page; `?intro=0` straight to
 *  the home screen. */
function PhoneFlow() {
  const [phase, setPhase] = useState(() => (workSlugFromUrl() ? 'work' : INTRO_ENABLED ? 'intro' : 'phone'));
  const [screen, setScreen] = useState(() => (INTRO_ENABLED ? 'lock' : 'home'));
  const [theme, setTheme] = useTheme();
  useLayoutEffect(() => {
    const root = document.documentElement;
    // The story scrolls the page; the phone is a fixed surface that does not.
    root.classList.toggle('intro-scroll', phase !== 'work');
    if (phase !== 'intro') window.scrollTo(0, 0);
    root.style.overflow = phase === 'phone' ? 'hidden' : '';
    return () => {
      root.classList.remove('intro-scroll');
      root.style.overflow = '';
    };
  }, [phase]);
  const toPhone = useCallback(() => {
    setScreen('lock');
    setPhase('phone');
  }, []);
  const toHome = useCallback(() => {
    setScreen('home');
    setPhase('phone');
  }, []);
  // "Back to the story" (Control Center, Settings): the journey from the top.
  const replay = useCallback(() => {
    if (workSlugFromUrl()) clearWork();
    window.scrollTo(0, 0);
    setScreen('lock');
    setPhase('intro');
  }, []);
  const fallback = <div style={{ minHeight: '100svh', background: '#000' }} />;
  return (
    <>
      {phase === 'intro' && (
        <Suspense fallback={<div style={{ minHeight: '100svh', background: '#ededea' }} />}>
          <JourneyC phone onReachScreen={toPhone} onSkip={toHome} />
        </Suspense>
      )}
      {phase === 'intro' && <LaptopHint />}
      {phase === 'phone' && (
        <Suspense fallback={fallback}>
          <IOS26Phone device theme={theme} onThemeChange={setTheme} screen={screen} onScreenChange={setScreen} autoNotifs onExit={replay} />
        </Suspense>
      )}
      {phase === 'work' && (
        <Suspense fallback={<div style={{ minHeight: '100svh', background: '#ededea' }} />}>
          <PhonePage onReplay={() => {
            if (workSlugFromUrl()) clearWork();
            window.scrollTo(0, 0);
            setPhase('intro');
          }} />
        </Suspense>
      )}
    </>
  );
}

/** intro (scroll hero + 3D MacBook) → welcome → desktop; Shut Down plays it back. */
function IntroFlow() {
  // A link to a project (/work/<slug>) goes straight to the Mac, the project open.
  const [phase, setPhase] = useState(() => (workSlugFromUrl() ? 'desktop' : 'intro'));
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

  // "Back to start" on the desktop: straight to the hero, no replay.
  useEffect(() => {
    const back = () => {
      // Back at the start, the address is the site's, not the linked project's.
      if (workSlugFromUrl()) clearWork();
      window.scrollTo(0, 0);
      setIntroMode('open');
      setPhase('intro');
    };
    window.addEventListener('ken:back-to-start', back);
    return () => window.removeEventListener('ken:back-to-start', back);
  }, []);
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
