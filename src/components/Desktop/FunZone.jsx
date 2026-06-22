import { getOriginFromEvent } from '../../utils/animationOrigin.js';
import { FUN_ZONE_ITEMS } from '../../data/funZone.js';
import { useOS } from '../../context/OSContext.jsx';
import DesktopIcon from './DesktopIcon.jsx';
import styles from './FunZone.module.css';

const NUDGE_TEXT = "Explore more after you've seen the work 👀";

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

  return (
    <div className={styles.funZone} onClick={(e) => e.stopPropagation()}>
      {FUN_ZONE_ITEMS.map((item) => {
        const showNudge = showEasterEggNudge && item.nudge;

        return (
          <button
            key={item.id}
            type="button"
            className={`${styles.iconButton} ${item.action === 'pet' && petVisible ? styles.iconSelected : ''}`}
            onClick={(e) => handleClick(item, e)}
          >
            {showNudge && <span className={styles.nudgeTooltip}>{NUDGE_TEXT}</span>}
            <span className={styles.iconGraphic} data-animation-origin>
              <DesktopIcon src={item.src} label={item.label} />
            </span>
            <span className={styles.iconLabel}>{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
