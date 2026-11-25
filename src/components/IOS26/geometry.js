/* Where the iPhone sits on a phone's screen. One function, used by both the
   journey's ending and the live phone, so the hand-off between them is the
   same picture: the phone never jumps.

   The phone is shown whole, bezel, Dynamic Island and all, as big as the
   screen allows: this is a phone inside a phone, and it should read as one. */

export const BODY_W = 450; // the iPhone 17 Pro bezel art
export const BODY_H = 920;
export const INSET_X = 24; // the display, in from the bezel's edge
export const INSET_Y = 23;
export const SCREEN_W = 402;
export const SCREEN_H = 874;
export const ROOM = '#08080a'; // the dark room it sits in (the ending's background)

export function deviceFit(vw = window.innerWidth, vh = window.innerHeight) {
  const pad = 4;
  const k = Math.min((vh - pad * 2) / BODY_H, (vw - pad * 2) / BODY_W);
  const w = BODY_W * k;
  const h = BODY_H * k;
  return { k, w, h, left: (vw - w) / 2, top: (vh - h) / 2, vw, vh };
}
