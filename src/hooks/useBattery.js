import { useEffect, useState } from 'react';

// The visitor's real battery, where the browser shares it (Chrome and Edge,
// through the Battery Status API: no prompt, only the level and whether it's
// charging). Elsewhere (Safari, Firefox) it stays the Mac's full battery.
const FULL = { level: 1, charging: true, real: false };

export function useBattery() {
  const [battery, setBattery] = useState(FULL);
  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.getBattery) return undefined;
    let bat = null;
    let alive = true;
    const read = () => alive && bat && setBattery({ level: bat.level, charging: bat.charging, real: true });
    navigator
      .getBattery()
      .then((b) => {
        bat = b;
        read();
        b.addEventListener('levelchange', read);
        b.addEventListener('chargingchange', read);
      })
      .catch(() => {});
    return () => {
      alive = false;
      bat?.removeEventListener('levelchange', read);
      bat?.removeEventListener('chargingchange', read);
    };
  }, []);
  return battery;
}
