import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import { FUN_ZONE_ITEMS } from '../../data/funZone.jsx';
import { useOS } from '../../context/OSContext.jsx';
import DesktopIcon from './DesktopIcon.jsx';
import styles from './FunZone.module.css';

const NUDGE_TEXT = "Explore more after you've seen the work 👀";

const STEPS = [1, 2, 3, 2];
const CELL_W = 78;
const CELL_H = 92;

export default function FunZone() {
  const { launchApp, togglePet, petVisible, showEasterEggNudge } = useOS();

  const handleClick = (item, e) => {
    if (item.action === 'pet') {
      togglePet();
      return;
    }
    if (item.appId) {
      launchApp(item.appId, { animationOrigin: getOriginFromEvent(e) });
    }
  };

  // Stacked as steps (one, two, three, two high), so the cat can climb them.
  const at = (i) => {
    let n = i;
    for (let col = 0; col < STEPS.length; col += 1) {
      if (n < STEPS[col]) return { left: col * CELL_W, bottom: n * CELL_H };
      n -= STEPS[col];
    }
    return { left: STEPS.length * CELL_W, bottom: 0 };
  };
  return (
    <div className={styles.funZone} style={{ width: STEPS.length * CELL_W, height: Math.max(...STEPS) * CELL_H }} onClick={(e) => e.stopPropagation()}>
      {FUN_ZONE_ITEMS.map((item, i) => {
        const showNudge = showEasterEggNudge && item.nudge;

        return (
          <button
            key={item.id}
            type="button"
            style={at(i)}
            className={`${styles.iconButton} ${item.action === 'pet' && petVisible ? styles.iconSelected : ''}`}
            onClick={(e) => handleClick(item, e)}
          >
            {showNudge && <span className={styles.nudgeTooltip}>{NUDGE_TEXT}</span>}
            <span className={styles.iconGraphic} data-animation-origin data-cat-surface>
              <DesktopIcon src={item.src} label={item.label} icon={item.icon} bg={item.bg} />
            </span>
            <span className={styles.iconLabel}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
