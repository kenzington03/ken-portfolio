import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import IOS26Phone from '../components/IOS26/IOS26Phone.jsx';

/* iOS 26 simulator: the phone, on its own page, to look at and try.
   Open /ioslab.html on the dev server. Not part of the production build. */

const SCREENS = [
  ['lock', 'Lock screen'],
  ['lock-notifs', 'Notifications'],
  ['home', 'Home screen'],
];

function Seg({ value, onChange, options }) {
  return (
    <div style={{ display: 'inline-flex', background: '#2c2c2e', borderRadius: 9, padding: 2, gap: 2 }}>
      {options.map(([v, l]) => (
        <button
          key={v}
          type="button"
          onClick={() => onChange(v)}
          aria-pressed={value === v}
          style={{
            border: 0,
            borderRadius: 7,
            padding: '6px 12px',
            font: 'inherit',
            cursor: 'pointer',
            background: value === v ? '#636366' : 'transparent',
            color: '#fff',
          }}
        >
          {l}
        </button>
      ))}
    </div>
  );
}

function Lab() {
  const [theme, setTheme] = useState('dark');
  const [screen, setScreen] = useState('lock');
  const [mode, setMode] = useState('one'); // one | compare | edge

  if (mode === 'edge') {
    return (
      <>
        <IOS26Phone theme={theme} framed={false} screen={screen} onScreenChange={setScreen} onThemeChange={setTheme} />
        <button
          type="button"
          onClick={() => setMode('one')}
          style={{ position: 'fixed', top: 8, right: 8, zIndex: 99999, opacity: 0.5, font: '12px system-ui', padding: '4px 8px' }}
        >
          exit
        </button>
      </>
    );
  }

  return (
    <div>
      <header style={{ padding: '16px 20px 6px' }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>iOS 26 simulator</h1>
        <p style={{ margin: '4px 0 0', color: '#9a9aa2', maxWidth: '72ch' }}>
          Built from the iOS and iPadOS 26 Community kit. Swipe up on the lock screen (or the home indicator) to unlock; tap the home indicator to lock again.
        </p>
      </header>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, padding: '10px 20px', alignItems: 'center' }}>
        <Seg value={theme} onChange={setTheme} options={[['light', 'Light'], ['dark', 'Dark']]} />
        <Seg value={screen} onChange={setScreen} options={SCREENS} />
        <Seg value={mode} onChange={setMode} options={[['one', 'Phone'], ['compare', 'Light + Dark'], ['edge', 'Full screen']]} />
      </div>
      <div style={{ display: 'flex', flexWrap: mode === 'compare' ? 'nowrap' : 'wrap', gap: 24, justifyContent: 'center', padding: '8px 20px 28px' }}>
        {mode === 'compare' ? (
          <>
            <IOS26Phone theme="light" framed across={2} screen={screen} onScreenChange={setScreen} />
            <IOS26Phone theme="dark" framed across={2} screen={screen} onScreenChange={setScreen} />
          </>
        ) : (
          <IOS26Phone theme={theme} framed screen={screen} onScreenChange={setScreen} onThemeChange={setTheme} />
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Lab />
  </StrictMode>,
);
