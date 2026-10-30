// The poster's two inks: the name is printed in `pop`, with `pop2` a hair
// off it. The same pair carries through the journey (internships on the
// timeline, focus rings, the brief's stickers), so one switch recolours the
// whole story. Ken picks; `?palette=<id>` (or the swatches on localhost) tries
// one, and the choice is remembered on that browser.

// Each also picks how the name is printed (`name`):
//   jersey    varsity lettering: the ink, a paper inline, an outline in the
//             second ink (a team's number on a shirt)
//   halftone  solid at the top, breaking into a halftone screen below
//   block     ink letters on a hard block shadow in the colour
//   riso      two inks, the second a hair off the first (the first poster)
export const PALETTES = [
  { id: 'jersey', label: 'Jersey', pop: '#e8462c', pop2: '#16234a', name: 'jersey' },
  { id: 'halftone', label: 'Halftone', pop: '#2a4bff', pop2: '#ff5a36', name: 'halftone' },
  { id: 'block', label: 'Block', pop: '#ff5b2e', pop2: '#121214', name: 'block' },
  { id: 'lakers', label: 'Lakers', pop: '#5b2fd6', pop2: '#ffc21a', name: 'riso' },
  { id: 'bubblegum', label: 'Bubblegum', pop: '#ff3e8e', pop2: '#b9ee2f', name: 'riso' },
  { id: 'cherry', label: 'Cherry sky', pop: '#ff2f4f', pop2: '#6fd2ff', name: 'riso' },
  { id: 'mint', label: 'Mint grape', pop: '#0fbf86', pop2: '#8a4dff', name: 'riso' },
  { id: 'sunny', label: 'Sunny', pop: '#ffc400', pop2: '#ff3e8e', name: 'riso' },
];

export const DEFAULT_PALETTE = 'jersey';
const KEY = 'ken:palette-v2';

export function readPalette() {
  let id = null;
  try {
    id = new URLSearchParams(window.location.search).get('palette');
    if (id && PALETTES.some((p) => p.id === id)) localStorage.setItem(KEY, id);
    else id = localStorage.getItem(KEY);
  } catch {
    /* private mode: the default */
  }
  return PALETTES.find((p) => p.id === id) || PALETTES.find((p) => p.id === DEFAULT_PALETTE);
}

export function savePalette(id) {
  try {
    localStorage.setItem(KEY, id);
  } catch {
    /* private mode: it lasts for this visit */
  }
}

export const paletteStyle = (p) => ({ '--accent': p.pop, '--riso': p.pop2, '--pop': p.pop, '--pop-2': p.pop2 });
