import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { track } from '../../utils/track.js';

/* A phone gets the story and an iPhone, but the site is made to be seen on a
   laptop (it is a Mac, there). Once, on arrival: say so, and offer to send the
   link to wherever the laptop is: the share sheet (Mail, Messages, AirDrop,
   Notes...) or, where there is none, an email to themselves. */

const KEY = 'ken-laptop-hint';
const URL_TO_SEND = () => `${window.location.origin}/`;

const seen = () => {
  try {
    return window.localStorage.getItem(KEY) === '1';
  } catch {
    return false;
  }
};
const remember = () => {
  try {
    window.localStorage.setItem(KEY, '1');
  } catch {
    /* private mode: it just asks again next time */
  }
};

export default function LaptopHint() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (seen()) return undefined;
    // Not over the loader: wait for the page to finish loading, then a moment,
    // so it arrives after the hero, not on top of the counter.
    let id;
    const arm = () => {
      id = setTimeout(() => setOpen(true), 3200);
    };
    if (document.readyState === 'complete') arm();
    else window.addEventListener('load', arm, { once: true });
    return () => {
      clearTimeout(id);
      window.removeEventListener('load', arm);
    };
  }, []);

  const close = () => {
    remember();
    setOpen(false);
  };
  const send = async () => {
    track('laptop_link_send', {});
    const url = URL_TO_SEND();
    const text = "Ken's portfolio: it is made to be seen on a laptop.";
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Kenneth Nathanael, Designer', text, url });
        close();
        return;
      }
    } catch {
      return; // they closed the share sheet: leave the prompt up
    }
    window.location.href = `mailto:?subject=${encodeURIComponent("Ken's portfolio, for my laptop")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`;
    close();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-label="Best viewed on a laptop"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 40, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 360, damping: 32 }}
          style={{
            position: 'fixed',
            left: 12,
            right: 12,
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 84px)',
            zIndex: 9000,
            padding: '16px 16px 14px',
            borderRadius: 24,
            background: 'rgba(20,20,22,0.94)',
            color: '#f4f4f2',
            boxShadow: '0 18px 50px rgba(0,0,0,0.35), inset 0 0 0 0.5px rgba(255,255,255,0.14)',
            backdropFilter: 'blur(18px)',
            WebkitBackdropFilter: 'blur(18px)',
            font: "400 15px/20px -apple-system, 'SF Pro', system-ui, sans-serif",
          }}
        >
          <div style={{ font: "600 17px/22px -apple-system, 'SF Pro', system-ui, sans-serif", marginBottom: 4 }}>Best viewed on a laptop</div>
          <div style={{ color: 'rgba(244,244,242,0.68)', marginBottom: 14 }}>
            This portfolio is built like a Mac. The phone version is a good taste, but the full thing is on a laptop. Send yourself the link?
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" onClick={send} style={{ flex: 1, minHeight: 44, border: 0, borderRadius: 14, background: '#f4f4f2', color: '#111', font: 'inherit', fontWeight: 600, cursor: 'pointer' }}>
              Send me the link
            </button>
            <button type="button" onClick={close} style={{ flex: 1, minHeight: 44, border: 0, borderRadius: 14, background: 'rgba(255,255,255,0.12)', color: 'inherit', font: 'inherit', fontWeight: 500, cursor: 'pointer' }}>
              Continue here
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
