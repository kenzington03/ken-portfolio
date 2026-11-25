import { CalendarIcon, CustomIcon } from './icons.jsx';
import { ICON } from './apps.js';

/* One app's face, filling its box (64px on the home screen, smaller in a
   folder or a notification): Apple's icon from the kit, the live Calendar,
   one of our own tiles, a project cover, or a game's tile. Every one is a
   squircle (iOS's rounded shape, a 22.4% radius), never a plain rectangle. */
export default function AppTile({ app }) {
  if (app.live === 'calendar') return <CalendarIcon />;
  if (app.custom) return <CustomIcon kind={app.custom} />;
  if (app.icon) return <img src={ICON(app.icon)} alt="" draggable={false} style={{ width: '100%', height: '100%', display: 'block', objectFit: 'cover' }} />;
  const bg = app.cover ? `center / cover url("${app.cover}")` : app.style || '#2c2c2e';
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        borderRadius: '22.37%',
        overflow: 'hidden',
        background: bg,
        display: 'grid',
        placeItems: 'center',
        boxShadow: 'inset 0 0 0 0.5px rgba(255,255,255,0.28)',
      }}
    >
      {!app.cover && app.imgSrc && (
        // Some tiles were drawn for a rectangle: crop them to the square, never stretch.
        <img src={app.imgSrc} alt="" draggable={false} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
      )}
      {!app.cover && !app.imgSrc && app.glyph}
    </div>
  );
}
