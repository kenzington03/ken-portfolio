/* Where the iPhone sits on a phone's screen. One function, used by both the
   journey's ending and the live phone, so the hand-off between them is the
   same picture: the phone never jumps.

   The phone is shown whole, bezel, Dynamic Island and all, so people can see
   it is a phone inside their phone. It is fitted to the room above the
   navigation bar (Home / Back / Help), centred. */

export const BODY_W = 450; // the iPhone 17 Pro bezel art
export const BODY_H = 920;
export const INSET_X = 24; // the display, in from the bezel's edge
export const INSET_Y = 23;
export const SCREEN_W = 402;
export const SCREEN_H = 874;
export const BAR_H = 52; // the navigation bar under the phone
export const ROOM = '#08080a'; // the dark room it sits in (the ending's background)

export function deviceFit(vw = window.innerWidth, vh = window.innerHeight, bar = BAR_H) {
  const k = Math.min((vh - bar - 14) / BODY_H, (vw - 14) / BODY_W);
  const w = BODY_W * k;
  const h = BODY_H * k;
  return { k, w, h, left: (vw - w) / 2, top: Math.max(6, (vh - bar - h) / 2), bar, vw, vh };
}
