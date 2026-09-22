/* Recognizable game glyphs — original artwork (redrawn shapes/palettes,
   not copied sprites or logos) so each game reads as itself at a glance
   instead of sharing one generic gamepad/block icon. Shared between the
   desktop launcher (funZone.jsx) and the mobile home screen (appData.jsx),
   which each composite it onto their own gradient tile background. */

export const PacManGlyph = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <path d="M14 14 L24.4 8 A12 12 0 1 0 24.4 20 Z" fill="#FFD400" />
    <circle cx="14.5" cy="7" r="1.4" fill="#3A2E00" />
  </svg>
);

export const TetrisGlyph = () => (
  <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
    <rect x="1" y="1" width="10.5" height="10.5" rx="1.5" fill="#31C7EF" />
    <rect x="14.5" y="1" width="10.5" height="10.5" rx="1.5" fill="#F7D308" />
    <rect x="1" y="14.5" width="10.5" height="10.5" rx="1.5" fill="#AD4D9C" />
    <rect x="14.5" y="14.5" width="10.5" height="10.5" rx="1.5" fill="#FF9612" />
  </svg>
);

export const FlappyBirdGlyph = () => (
  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
    <ellipse cx="14" cy="14" rx="9" ry="8" fill="#F9D71C" />
    <ellipse cx="10" cy="17" rx="5" ry="3.2" fill="#F5A623" />
    <circle cx="18" cy="10" r="3.2" fill="#fff" />
    <circle cx="19" cy="10" r="1.5" fill="#1a1a1a" />
    <path d="M21 12.5L27 14L21 16.5Z" fill="#E8833A" />
  </svg>
);
