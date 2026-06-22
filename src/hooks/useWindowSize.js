import { useEffect, useState } from 'react';

const MOBILE_BREAKPOINT = 768;

export function useWindowSize() {
  const [width, setWidth] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth : MOBILE_BREAKPOINT
  );

  useEffect(() => {
    const onResize = () => setWidth(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    width,
    isMobile: width < MOBILE_BREAKPOINT,
  };
}
