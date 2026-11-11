// Cal.com bookings in a pop-up over the site, instead of a new tab. Cal's own
// embed script (app.cal.com/embed/embed.js), loaded when a booking link is
// pointed at, focused or touched; a click waits for it. If Cal can't load,
// the booking page opens in a new tab. A finished booking is cal_booked.

import { BOOKING_URL } from '../components/Brief/briefData.js';
import { track } from './track.js';

const NS = 'ken';
const LINK = BOOKING_URL.replace(/^https:\/\/cal\.com\//, ''); // "kenneth-nathanael-hymjak/30min"
const isBooking = (el) => el?.closest?.('a[href^="https://cal.com/"]');

let started = false;
function start() {
  if (started) return;
  started = true;
  /* eslint-disable */
  // Cal's loader, as they publish it: queues calls until embed.js is in.
  (function (C, A, L) {
    const p = (a, ar) => a.q.push(ar);
    const d = C.document;
    C.Cal =
      C.Cal ||
      function () {
        const cal = C.Cal;
        const ar = arguments;
        if (!cal.loaded) {
          cal.ns = {};
          cal.q = cal.q || [];
          d.head.appendChild(d.createElement('script')).src = A;
          cal.loaded = true;
        }
        if (ar[0] === L) {
          const api = function () {
            p(api, arguments);
          };
          const namespace = ar[1];
          api.q = api.q || [];
          if (typeof namespace === 'string') {
            cal.ns[namespace] = cal.ns[namespace] || api;
            p(cal.ns[namespace], ar);
            p(cal, ['initNamespace', namespace]);
          } else p(cal, ar);
          return;
        }
        p(cal, ar);
      };
  })(window, 'https://app.cal.com/embed/embed.js', 'init');
  /* eslint-enable */
  window.Cal('init', NS, { origin: 'https://cal.com' });
  window.Cal.ns[NS]('ui', { hideEventTypeDetails: false, layout: 'month_view' });
  window.Cal.ns[NS]('on', { action: 'bookingSuccessful', callback: () => track('cal_booked') });
}

export function startBookings() {
  const warm = (e) => {
    if (isBooking(e.target)) start();
  };
  document.addEventListener('pointerover', warm, { passive: true });
  document.addEventListener('focusin', warm);
  document.addEventListener('touchstart', warm, { passive: true });
  document.addEventListener(
    'click',
    (e) => {
      const a = isBooking(e.target);
      if (!a || e.metaKey || e.ctrlKey || e.shiftKey) return;
      e.preventDefault();
      start();
      // Queued by the loader until embed.js is in, then it opens.
      window.Cal.ns[NS]('modal', { calLink: LINK, config: { layout: 'month_view' } });
      // If Cal never shows (blocked, offline), the page opens instead.
      setTimeout(() => {
        if (!document.querySelector('cal-modal-box')) window.open(a.href, '_blank', 'noopener');
      }, 6000);
    },
    true
  );
}
