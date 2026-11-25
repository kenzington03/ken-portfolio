import useClock from '../../hooks/useClock.js';
import { Glyph } from './icons.jsx';
import { usePhone } from './PhoneContext.js';
import styles from './ios26.module.css';

const A = '/assets/ios26/chrome';

const hm = (d) => `${d.getHours() % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')}`;

/* Status bar, Figma "Status Bar" 402×62: time centred in the left half,
   cellular / wifi / battery centred in the right half (the Dynamic Island
   sits between them, drawn by the bezel). `time` pins it (the lab shows
   9:41 like the kit); otherwise it is the real time. `onTap` makes the right
   side a way into Control Center. The icons follow Airplane Mode / Wi-Fi /
   Cellular, as set in Control Center or Settings. */
export default function StatusBar({ time, tone = 'light', onTap }) {
  const live = useClock(hm);
  const { net } = usePhone();
  return (
    <div className={`${styles.status} ${tone === 'dark' ? styles.statusDark : ''}`}>
      <div className={styles.statusTime}>{time ?? live}</div>
      <div
        className={styles.statusLevels}
        onClick={onTap}
        role={onTap ? 'button' : undefined}
        aria-label={onTap ? 'Open Control Center' : undefined}
        style={onTap ? { pointerEvents: 'auto', cursor: 'pointer' } : undefined}
      >
        {net.air && <Glyph name="airplane" size={15} />}
        {!net.air && net.cell && <img src={`${A}/cellular.svg`} width="19.2" height="12.226" alt="" />}
        {!net.air && net.wifi && <img src={`${A}/wifi.svg`} width="17.142" height="12.328" alt="" />}
        <img src={`${A}/battery.svg`} width="27.328" height="13" alt="" />
      </div>
    </div>
  );
}
