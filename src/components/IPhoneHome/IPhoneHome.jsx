import { useCallback, useRef, useState } from 'react';
import StatusBar from './StatusBar.jsx';
import AppGrid from './AppGrid.jsx';
import MobileDock from './MobileDock.jsx';
import AppSheet from './AppSheet.jsx';
import MobileSpotlight from './MobileSpotlight.jsx';
import styles from './IPhoneHome.module.css';

const WALLPAPER = '/assets/ui/background-1.jpg';

export default function IPhoneHome() {
  const [activeApp, setActiveApp] = useState(null);
  const [wiggle, setWiggle] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);

  /* ─── Swipe-down → Spotlight ───────────────────────────── */
  const touchStartRef = useRef({ y: 0, active: false });

  const onTouchStart = useCallback((e) => {
    touchStartRef.current = { y: e.touches[0].clientY, active: true };
  }, []);

  const onTouchMove = useCallback((e) => {
    if (!touchStartRef.current.active) return;
    const delta = e.touches[0].clientY - touchStartRef.current.y;
    if (delta > 60) {
      touchStartRef.current.active = false;
      setSpotlightOpen(true);
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    touchStartRef.current.active = false;
  }, []);

  /* ─── Long press → wiggle mode ─────────────────────────── */
  const enterWiggle = useCallback(() => setWiggle(true), []);

  const exitWiggle = useCallback(() => setWiggle(false), []);

  /* ─── Icon tap ──────────────────────────────────────────── */
  const handleTap = useCallback((app) => {
    if (wiggle) { exitWiggle(); return; }
    setActiveApp(app);
  }, [wiggle, exitWiggle]);

  const handleBgTap = useCallback(() => {
    if (wiggle) exitWiggle();
  }, [wiggle, exitWiggle]);

  return (
    <div
      className={styles.homeScreen}
      style={{ backgroundImage: `url("${WALLPAPER}")` }}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      onClick={handleBgTap}
    >
      <div className={styles.wallpaperOverlay} aria-hidden="true" />

      <StatusBar />

      <div className={styles.scrollArea}>
        <div
          className={styles.gridArea}
          onClick={(e) => e.stopPropagation()}
        >
          <AppGrid
            wiggle={wiggle}
            onTap={handleTap}
            onLongPress={enterWiggle}
          />
        </div>

        <div className={styles.pageDots} aria-hidden="true">
          <span className={`${styles.dot} ${styles.dotActive}`} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      </div>

      <MobileDock onTap={handleTap} />

      <AppSheet
        app={activeApp}
        onClose={() => setActiveApp(null)}
      />

      <MobileSpotlight
        open={spotlightOpen}
        onClose={() => setSpotlightOpen(false)}
      />
    </div>
  );
}
