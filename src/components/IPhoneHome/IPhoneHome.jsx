import { useCallback, useEffect, useRef, useState } from 'react';
import StatusBar from './StatusBar.jsx';
import AppGrid from './AppGrid.jsx';
import MobileDock from './MobileDock.jsx';
import AppSheet from './AppSheet.jsx';
import FolderOverlay from './FolderOverlay.jsx';
import MobileSpotlight from './MobileSpotlight.jsx';
import SkillsWidget from './SkillsWidget.jsx';
import AppLibrary from './AppLibrary.jsx';
import { HOME_PAGES } from './appData.jsx';
import styles from './IPhoneHome.module.css';

// Home pages, then the App Library.
const PAGE_COUNT = HOME_PAGES.length + 1;

export default function IPhoneHome() {
  const [activeApp, setActiveApp] = useState(null);
  const [activeFolder, setActiveFolder] = useState(null);
  const [wiggle, setWiggle] = useState(false);
  const [spotlightOpen, setSpotlightOpen] = useState(false);
  const [page, setPage] = useState(0);
  // iOS 16: the Search pill stands where the page dots are, and turns into
  // the dots while you swipe between pages.
  const [swiping, setSwiping] = useState(false);
  const pagerRef = useRef(null);
  const swipeTimer = useRef(0);

  useEffect(() => () => clearTimeout(swipeTimer.current), []);

  const onPagerScroll = useCallback(() => {
    const el = pagerRef.current;
    if (!el) return;
    const p = Math.round(el.scrollLeft / el.clientWidth);
    setPage((cur) => (cur === p ? cur : p));
    setSwiping(true);
    clearTimeout(swipeTimer.current);
    swipeTimer.current = setTimeout(() => setSwiping(false), 900);
  }, []);

  const goToPage = useCallback((p) => {
    const el = pagerRef.current;
    if (el) el.scrollTo({ left: p * el.clientWidth, behavior: 'smooth' });
  }, []);

  /* ─── Swipe down on a home page → Spotlight ─── */
  const touchRef = useRef({ x: 0, y: 0, active: false });
  const onTouchStart = useCallback((e) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, active: true };
  }, []);
  const onTouchMove = useCallback(
    (e) => {
      const t = touchRef.current;
      if (!t.active) return;
      const dy = e.touches[0].clientY - t.y;
      const dx = Math.abs(e.touches[0].clientX - t.x);
      if (dx > 20) t.active = false; // that's a page swipe
      else if (dy > 60 && page < HOME_PAGES.length) {
        t.active = false;
        setSpotlightOpen(true);
      }
    },
    [page],
  );
  const onTouchEnd = useCallback(() => {
    touchRef.current.active = false;
  }, []);

  /* ─── Long press → wiggle ─── */
  const enterWiggle = useCallback(() => setWiggle(true), []);
  const exitWiggle = useCallback(() => setWiggle(false), []);

  /* ─── Icon / folder tap: apps zoom out of the icon (rect) ─── */
  const handleTap = useCallback(
    (item, rect = null) => {
      if (wiggle) {
        exitWiggle();
        return;
      }
      if (item.appKey === 'phone') {
        // The real dialler, as tapping Phone does on an iPhone.
        window.location.href = 'tel:+917204662258';
        return;
      }
      if (item.type === 'folder') setActiveFolder(item);
      else setActiveApp({ ...item, rect });
    },
    [wiggle, exitWiggle],
  );

  const openGroup = useCallback((group) => setActiveFolder({ id: group.id, label: group.label, type: 'folder', apps: group.apps }), []);

  const handleBgTap = useCallback(() => {
    if (wiggle) exitWiggle();
  }, [wiggle, exitWiggle]);

  return (
    <div className={styles.homeScreen} onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd} onClick={handleBgTap}>
      <div className={styles.wallpaper} />

      <StatusBar />

      {/* Dynamic Island: always on top, like the hardware cutout. */}
      <div className={styles.dynamicIsland} aria-hidden="true" />

      {/* Pages: swipe sideways, snapping, as on iOS. Icons settle in on unlock. */}
      <div ref={pagerRef} className={`${styles.pager} ${styles.unlock}`} onScroll={onPagerScroll} onClick={(e) => e.stopPropagation()}>
        {HOME_PAGES.map((apps, i) => (
          <section key={i} className={styles.page} aria-label={`Home screen ${i + 1}`}>
            {i === 0 && <SkillsWidget />}
            <AppGrid apps={apps} wiggle={wiggle} onTap={handleTap} onLongPress={enterWiggle} />
          </section>
        ))}
        <section className={styles.page} aria-label="App Library">
          <AppLibrary onOpenApp={handleTap} onOpenGroup={openGroup} onSearch={() => setSpotlightOpen(true)} />
        </section>
      </div>

      {/* Search pill / page dots, just above the dock. Hidden on the App Library. */}
      <div className={`${styles.pageControl} ${page >= HOME_PAGES.length ? styles.pageControlHidden : ''}`}>
        <button
          type="button"
          className={`${styles.searchPill} ${swiping ? styles.searchPillOff : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSpotlightOpen(true);
          }}
          tabIndex={swiping ? -1 : 0}
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none" aria-hidden>
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.6" />
            <path d="M9.7 9.7L13 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          Search
        </button>
        <div className={`${styles.pageDots} ${swiping ? styles.pageDotsOn : ''}`} role="tablist" aria-label="Pages">
          {Array.from({ length: PAGE_COUNT }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={page === i}
              aria-label={i < HOME_PAGES.length ? `Page ${i + 1}` : 'App Library'}
              className={`${styles.dot} ${page === i ? styles.dotActive : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                goToPage(i);
              }}
            />
          ))}
        </div>
      </div>

      <MobileDock onTap={handleTap} />

      <FolderOverlay folder={activeFolder} onClose={() => setActiveFolder(null)} onAppTap={handleTap} />

      <AppSheet app={activeApp} onClose={() => setActiveApp(null)} />

      <MobileSpotlight open={spotlightOpen} onClose={() => setSpotlightOpen(false)} onOpenApp={handleTap} />
    </div>
  );
}
