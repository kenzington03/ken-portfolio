import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import { FUN_ZONE_ITEMS } from '../../data/funZone.jsx';
import { useOS } from '../../context/OSContext.jsx';
import DesktopIcon from './DesktopIcon.jsx';
import styles from './FunZone.module.css';

const NUDGE_TEXT = "Explore more after you've seen the work 👀";

// Toothless's corner: the games stacked into a little castle he can climb, a
// tower of three either side and a low courtyard between. Each icon's top is
// somewhere to stand; his own icon, in the courtyard, is where he naps.
const COLUMNS = [
  ['minesweeper', 'chromedino', 'mazemuncher'],
  ['pet'],
  ['terminal'],
  ['tumbleblocks', 'flappybird', 'bubbleshooter'],
];
const CELL_W = 84;
const CELL_H = 92;

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

  const tallest = Math.max(...COLUMNS.map((col) => col.length));
  return (
    <div className={styles.funZone} style={{ width: COLUMNS.length * CELL_W, height: tallest * CELL_H }} onClick={(e) => e.stopPropagation()}>
      {COLUMNS.map((col, x) =>
        col.map((id, y) => {
          const item = byId[id];
          if (!item) return null;
          return (
            <button
              key={id}
              type="button"
              style={{ left: x * CELL_W, bottom: y * CELL_H }}
              className={`${styles.iconButton} ${item.action === 'pet' && petVisible ? styles.iconSelected : ''}`}
              onClick={(e) => handleClick(item, e)}
            >
              {showEasterEggNudge && item.nudge && <span className={styles.nudgeTooltip}>{NUDGE_TEXT}</span>}
              <span className={styles.iconGraphic} data-animation-origin data-cat-surface={id === 'pet' ? 'bed' : ''}>
                <DesktopIcon src={item.src} label={item.label} icon={item.icon} bg={item.bg} />
              </span>
              <span className={styles.iconLabel}>{item.label}</span>
            </button>
          );
        }),
      )}
    </div>
  );
}
