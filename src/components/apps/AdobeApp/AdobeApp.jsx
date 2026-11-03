import { useState } from 'react';
import styles from './AdobeApp.module.css';

// Photoshop and Illustrator, as Ken leaves them open: a few of his working
// files in tabs, the tools down the left, the Layers panel on the right. The
// layers are real: each is a layer of the canvas, and its eye shows or hides
// it; click one to select it.

const P = '/assets/projects';
const APPS = {
  photoshop: {
    menus: ['File', 'Edit', 'Image', 'Layer', 'Type', 'Select', 'Filter', '3D', 'View', 'Window', 'Help'],
    tools: ['move', 'marquee', 'lasso', 'wand', 'crop', 'eyedrop', 'brush', 'stamp', 'eraser', 'gradient', 'type', 'pen', 'shape', 'hand', 'zoom'],
    docs: [
      {
        name: 'FluidAI_KeyVisual_v7.psd',
        zoom: '66.7% (RGB/8)',
        w: 1600,
        h: 900,
        layers: [
          { name: 'Headline', kind: 'text', text: 'Liquidity, made intelligent.', style: { left: '7%', top: '62%', fontSize: '5.2cqw', color: '#fff', fontWeight: 700 } },
          { name: 'Logo lockup', kind: 'image', src: `${P}/01-fluidai/rebranding/rebranding__fluid-rebrand-04-brain-logo-lockup.png`, style: { left: '7%', top: '8%', width: '26%' } },
          { name: 'Glow', kind: 'fill', style: { inset: 0, background: 'radial-gradient(40% 50% at 70% 45%, rgb(160 90 255 / 0.55), transparent 70%)', mixBlendMode: 'screen' } },
          { name: 'Brain render', kind: 'image', src: `${P}/01-fluidai/rebranding/rebranding__fluid-rebrand-01-brain-banner-dark.png`, style: { inset: 0, width: '100%', height: '100%', objectFit: 'cover' } },
          { name: 'Background', kind: 'fill', locked: true, style: { inset: 0, background: '#0b0620' } },
        ],
      },
      {
        name: 'Momentum26_Banner_FINAL_final2.psd',
        zoom: '50% (RGB/8)',
        w: 1600,
        h: 900,
        layers: [
          { name: 'Date lockup', kind: 'text', text: 'ONE TEAM. ONE VISION.', style: { left: '50%', top: '80%', transform: 'translateX(-50%)', fontSize: '2.6cqw', color: '#fff', letterSpacing: '0.2em' } },
          { name: 'Light streaks', kind: 'fill', style: { inset: 0, background: 'linear-gradient(115deg, transparent 40%, rgb(255 255 255 / 0.18) 50%, transparent 60%)', mixBlendMode: 'screen' } },
          { name: 'Key art', kind: 'image', src: `${P}/02-milestone/01-momentum-2026/01.jpg`, style: { inset: 0, width: '100%', height: '100%', objectFit: 'cover' } },
          { name: 'Background', kind: 'fill', locked: true, style: { inset: 0, background: '#05060c' } },
        ],
      },
    ],
  },
  illustrator: {
    menus: ['File', 'Edit', 'Object', 'Type', 'Select', 'Effect', 'View', 'Window', 'Help'],
    tools: ['select', 'direct', 'pen', 'curvature', 'type', 'line', 'rect', 'brush', 'shaper', 'rotate', 'width', 'eyedrop', 'artboard', 'hand', 'zoom'],
    docs: [
      {
        name: 'Truearte_Packaging_v3.ai',
        zoom: '33% (CMYK/Preview)',
        w: 1600,
        h: 1000,
        artboard: true,
        layers: [
          { name: 'Dielines', kind: 'fill', style: { inset: '6%', border: '1.5px dashed #ff2bd6', pointerEvents: 'none' } },
          { name: 'Copy', kind: 'text', text: 'Truearte · art supplies', style: { left: '8%', top: '86%', fontSize: '2cqw', color: '#222' } },
          { name: 'Pack collection', kind: 'image', src: `${P}/06-branding/Truearte/packaging-collection.png`, style: { left: '8%', top: '8%', width: '84%', height: '74%', objectFit: 'contain' } },
          { name: 'Artboard', kind: 'fill', locked: true, style: { inset: 0, background: '#fff' } },
        ],
      },
      {
        name: 'StepSetGo_AppScreens.ai',
        zoom: '25% (RGB/Preview)',
        w: 1600,
        h: 1000,
        artboard: true,
        layers: [
          { name: 'Screen 03', kind: 'image', src: `${P}/06-branding/Step-Set-Go/track-your-fitness.png`, style: { left: '68%', top: '10%', width: '26%', height: '80%', objectFit: 'contain' } },
          { name: 'Screen 02', kind: 'image', src: `${P}/06-branding/Step-Set-Go/redeem-exclusive-offers.png`, style: { left: '37%', top: '10%', width: '26%', height: '80%', objectFit: 'contain' } },
          { name: 'Screen 01', kind: 'image', src: `${P}/06-branding/Step-Set-Go/compete-with-friends.png`, style: { left: '6%', top: '10%', width: '26%', height: '80%', objectFit: 'contain' } },
          { name: 'Artboard', kind: 'fill', locked: true, style: { inset: 0, background: '#f4f4f6' } },
        ],
      },
    ],
  },
};

// Tool glyphs on a 20 grid.
const GLYPH = {
  move: 'M10 2v16M2 10h16M10 2 7.5 4.5M10 2l2.5 2.5M10 18l-2.5-2.5M10 18l2.5-2.5M2 10l2.5-2.5M2 10l2.5 2.5M18 10l-2.5-2.5M18 10l-2.5 2.5',
  marquee: 'M3 3h3M8 3h4M14 3h3v3M17 8v4M17 14v3h-3M12 17H8M6 17H3v-3M3 12V8M3 6V3',
  lasso: 'M5 13c-3-2-2-8 5-8s8 5 4 7c-3 1.5-7 1-8 0M6 13c-1 2 0 4 1 5',
  wand: 'M4 16 14 6M13 3v2M16 7h2M15 4l1.5-1.5M11 4.5 12 5.5',
  crop: 'M6 2v12h12M2 6h12v12',
  eyedrop: 'M14 3l3 3-9 9H5v-3zM12 5l3 3',
  brush: 'M15 3c-3 2-6 6-7 8l2 2c2-1 6-4 8-7zM8 11c-3 0-4 2-4 5 2 0 5-1 5-4',
  stamp: 'M7 3h6v5H7zM10 8v3M4 11h12v3H4zM5 16h10',
  eraser: 'M3 13 11 5l5 5-6 6H6zM8 8l5 5',
  gradient: 'M3 3h14v14H3zM3 17 17 3',
  type: 'M4 4h12M10 4v13M7 17h6',
  pen: 'M10 2l5 9-5 7-5-7zM10 2v8M10 11a1 1 0 1 0 0 .1',
  shape: 'M3 3h14v14H3z',
  hand: 'M7 10V4.5a1.2 1.2 0 0 1 2.4 0V9M9.4 9V3.5a1.2 1.2 0 0 1 2.4 0V9M11.8 9V4.5a1.2 1.2 0 0 1 2.4 0V11c0 4-2 6-5 6-2.5 0-4-1.5-5.5-4L3 10.5a1.2 1.2 0 0 1 2-1.3L7 12',
  zoom: 'M8.5 3a5.5 5.5 0 1 1 0 11 5.5 5.5 0 0 1 0-11zM12.5 12.5 17 17',
  select: 'M5 2v14l4-4 3 6 2-1-3-6h5z',
  direct: 'M5 2v14l4-4 3 6 2-1-3-6h5zM5 2',
  curvature: 'M3 16C6 4 14 4 17 16M10 6v.1',
  line: 'M3 17 17 3',
  rect: 'M3 5h14v10H3z',
  shaper: 'M4 15c2-6 6-10 12-11M4 15l3 1',
  rotate: 'M15 6a6 6 0 1 0 1 7M15 2v4h-4',
  width: 'M3 10c4-6 10-6 14 0M3 10c4 6 10 6 14 0M10 6v8',
  artboard: 'M5 2v16M15 2v16M2 5h16M2 15h16',
};

function Tool({ name, on, onClick }) {
  return (
    <button type="button" className={`${styles.tool} ${on ? styles.toolOn : ''}`} onClick={onClick} aria-label={name} title={name}>
      <svg viewBox="0 0 20 20" aria-hidden>
        <path d={GLYPH[name]} />
      </svg>
    </button>
  );
}

function Layer({ layer, hidden }) {
  if (hidden) return null;
  const style = { position: 'absolute', ...layer.style };
  if (layer.kind === 'image') return <img src={layer.src} alt="" style={style} draggable={false} />;
  if (layer.kind === 'text') return <span style={{ ...style, whiteSpace: 'nowrap', lineHeight: 1.05 }}>{layer.text}</span>;
  return <span style={style} />;
}

export default function AdobeApp({ data }) {
  const app = APPS[data?.app] ?? APPS.photoshop;
  const ps = app === APPS.photoshop;
  const [docAt, setDocAt] = useState(0);
  const [tool, setTool] = useState(app.tools[0]);
  const [hidden, setHidden] = useState({});
  const [selected, setSelected] = useState(0);
  const doc = app.docs[docAt];
  const key = (i) => `${docAt}:${i}`;

  return (
    <div className={`${styles.app} ${ps ? styles.ps : styles.ai}`}>
      <nav className={styles.menus} aria-hidden>
        <span className={styles.badge}>{ps ? 'Ps' : 'Ai'}</span>
        {app.menus.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </nav>
      <div className={styles.tabs} role="tablist">
        {app.docs.map((d, i) => (
          <button key={d.name} type="button" role="tab" aria-selected={i === docAt} className={i === docAt ? styles.tabOn : ''} onClick={() => setDocAt(i)}>
            {d.name} @ {d.zoom}
            <i aria-hidden>×</i>
          </button>
        ))}
      </div>
      <div className={styles.body}>
        <div className={styles.tools}>
          {app.tools.map((t) => (
            <Tool key={t} name={t} on={t === tool} onClick={() => setTool(t)} />
          ))}
          <span className={styles.swatches} aria-hidden>
            <i />
            <i />
          </span>
        </div>
        <div className={styles.pasteboard}>
          <div className={styles.canvas} style={{ aspectRatio: `${doc.w} / ${doc.h}` }}>
            {[...doc.layers].reverse().map((l, ri) => {
              const i = doc.layers.length - 1 - ri;
              return <Layer key={l.name} layer={l} hidden={hidden[key(i)]} />;
            })}
            {/* The selected layer's bounding box, Illustrator style. */}
            {!ps && !doc.layers[selected]?.locked && <span className={styles.selection} style={doc.layers[selected]?.style} aria-hidden />}
          </div>
        </div>
        <aside className={styles.panels}>
          <div className={styles.panelTabs}>
            <b>Layers</b>
            <span>{ps ? 'Channels' : 'Artboards'}</span>
            <span>{ps ? 'Paths' : 'Asset Export'}</span>
          </div>
          {ps && (
            <div className={styles.blend} aria-hidden>
              <span>Normal</span>
              <span>Opacity: 100%</span>
            </div>
          )}
          <ul className={styles.layers}>
            {doc.layers.map((l, i) => (
              <li key={l.name} className={i === selected ? styles.layerOn : ''}>
                <button type="button" className={styles.eye} aria-label={hidden[key(i)] ? `Show ${l.name}` : `Hide ${l.name}`} onClick={() => setHidden((h) => ({ ...h, [key(i)]: !h[key(i)] }))}>
                  {hidden[key(i)] ? '' : '●'}
                </button>
                <button type="button" className={styles.layerName} onClick={() => setSelected(i)}>
                  <span className={styles.thumb} aria-hidden>
                    {l.kind === 'text' ? 'T' : l.kind === 'image' ? <img src={l.src} alt="" /> : <i style={{ background: l.style.background }} />}
                  </span>
                  {l.name}
                  {l.locked && <span className={styles.lock} aria-label="locked">🔒</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.props}>
            <b>Properties</b>
            <p>
              {doc.layers[selected]?.name} · {doc.layers[selected]?.kind === 'text' ? 'Type layer' : doc.layers[selected]?.kind === 'image' ? (ps ? 'Smart Object' : 'Linked file') : ps ? 'Fill layer' : 'Group'}
            </p>
            <p>
              W {doc.w} px · H {doc.h} px
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
