import { useEffect, useState } from 'react';

/* The phone follows the visitor's system appearance until they flip it in
   Control Center. */
const MQ = '(prefers-color-scheme: dark)';

export const systemTheme = () => {
  try {
    return window.matchMedia(MQ).matches ? 'dark' : 'light';
  } catch {
    return 'dark';
  }
};

/** [theme, setTheme]: starts as the system's; follows it if it changes. */
export function useTheme() {
  const [theme, setTheme] = useState(systemTheme);
  useEffect(() => {
    let mq;
    try {
      mq = window.matchMedia(MQ);
    } catch {
      return undefined;
    }
    const on = () => setTheme(mq.matches ? 'dark' : 'light');
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return [theme, setTheme];
}
