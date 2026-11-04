import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import { FUN_ZONE_ITEMS } from '../../data/funZone.jsx';
import { useOS } from '../../context/OSContext.jsx';
import DesktopIcon from './DesktopIcon.jsx';
import styles from './FunZone.module.css';

const NUDGE_TEXT = "Explore more after you've seen the work 👀";

// Toothless's castle: a cat tree. A sisal post, platforms staggered either
// side with two games on each, a cushion on top, and a felt condo at the foot
// with a round door he naps behind. Every platform, the cushion, the condo's
// roof and its floor are surfaces he can jump to (data-cat-surface).
// Positions are px from the castle's bottom-left.
const W = 300;
const H = 436;
const CONDO = { left: 0, bottom: 0, width: 140, height: 104 };
const POST = { left: 128, bottom: CONDO.height, width: 24, height: 316 };
const PLATFORMS = [
  { id: 'p1', left: 156, bottom: 150, width: 140, items: ['minesweeper', 'flappybird'] },
  { id: 'p2', left: 0, bottom: 236, width: 128, items: ['chromedino', 'tumbleblocks'] },
  { id: 'p3', left: 156, bottom: 322, width: 140, items: ['mazemuncher', 'bubbleshooter'] },
];
const ROOF_ITEMS = ['pet', 'terminal'];
const BED = { left: 82, bottom: 404, width: 116 };

export default function FunZone() {
  const { launchApp, togglePet, petVisible, showEasterEggNudge } = useOS();
  const byId = Object.fromEntries(FUN_ZONE_ITEMS.map((it) => [it.id, it]));

  const handleClick = (item, e) => {
    if (item.action === 'pet') {
      togglePet();
      return;
    }
    if (item.appId) launchApp(item.appId, { animationOrigin: getOriginFromEvent(e) });
  };

  // Two icons standing on a ledge, spaced out along it.
  const icons = (ids, ledge) =>
    ids.map((id, i) => {
      const item = byId[id];
      if (!item) return null;
      // (Kept clear of the post: a little in from each end of the ledge.)
      const slot = (ledge.width - 16) / ids.length;
      return (
        <button
          key={id}
          type="button"
          style={{ left: ledge.left + 8 + slot * i + slot / 2 - 34, bottom: ledge.bottom + 12 }}
          className={`${styles.iconButton} ${item.action === 'pet' && petVisible ? styles.iconSelected : ''}`}
          onClick={(e) => handleClick(item, e)}
        >
          {showEasterEggNudge && item.nudge && <span className={styles.nudgeTooltip}>{NUDGE_TEXT}</span>}
          <span className={styles.iconGraphic} data-animation-origin>
            <DesktopIcon src={item.src} label={item.label} icon={item.icon} bg={item.bg} />
          </span>
          <span className={styles.iconLabel}>{item.label}</span>
        </button>
      );
    });

  const box = (b) => ({ left: b.left, bottom: b.bottom, width: b.width, height: b.height });
  return (
    <div className={styles.funZone} style={{ width: W, height: H }} onClick={(e) => e.stopPropagation()}>
      <div className={styles.post} style={box(POST)} aria-hidden />
      {/* The condo: he goes in by the round door and is seen only through it. */}
      <div className={styles.condo} style={box(CONDO)} data-cat-inside aria-hidden>
        <span className={styles.roof} data-cat-surface />
        <span className={styles.door} data-cat-hole />
        <span className={styles.condoFloor} data-cat-surface="bed" />
      </div>
      {PLATFORMS.map((p) => (
        <div key={p.id} className={styles.platform} style={{ left: p.left, bottom: p.bottom, width: p.width }} data-cat-surface aria-hidden />
      ))}
      <div className={styles.bed} style={{ left: BED.left, bottom: BED.bottom, width: BED.width }} data-cat-surface="bed" aria-hidden />
      {PLATFORMS.map((p) => icons(p.items, p))}
      {icons(ROOF_ITEMS, { left: CONDO.left, bottom: CONDO.height, width: CONDO.width - 12 })}
    </div>
  );
}
