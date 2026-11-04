import { useEffect, useRef, useState } from 'react';
import styles from './AdobeApp.module.css';

// Photoshop and Illustrator, a light version of each. They open on the
// app's Home screen: New file (the New Document dialog, with its presets)
// or one of Ken's recent files. In a document the layers are real (each eye
// shows or hides one), and a handful of tools work: select and move,
// rectangle, ellipse, line, brush, type, and the eraser; each shape drawn
// becomes a layer. Nothing is saved: it is there to play with.

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

// What each tool does here (the rest are for show).
const ACT = { move: 'select', select: 'select', direct: 'select', shape: 'rect', rect: 'rect', marquee: 'rect', shaper: 'ellipse', lasso: 'ellipse', line: 'line', pen: 'line', curvature: 'line', brush: 'brush', type: 'type', eraser: 'erase' };
const SWATCHES = ['#ff3b5c', '#ff9f0a', '#ffd60a', '#30d158', '#0a84ff', '#5e5ce6', '#ffffff', '#111111'];
const PRESETS = {
  Print: [['Letter', 612, 792, 'pt'], ['A4', 595, 842, 'pt'], ['Legal', 612, 1008, 'pt'], ['Tabloid', 792, 1224, 'pt'], ['A3', 842, 1191, 'pt']],
  Web: [['Web', 1920, 1080, 'px'], ['Web Large', 2560, 1440, 'px'], ['MacBook Pro', 1728, 1117, 'px']],
  Mobile: [['iPhone 16', 393, 852, 'px'], ['iPad', 820, 1180, 'px'], ['Android', 360, 800, 'px']],
  'Film & Video': [['HDTV 1080p', 1920, 1080, 'px'], ['4K UHD', 3840, 2160, 'px']],
  'Art & Illustration': [['Square', 1080, 1080, 'px'], ['Instagram Post', 1080, 1350, 'px'], ['Story', 1080, 1920, 'px']],
};

function Tool({ name, on, onClick }) {
  return (
    <button type="button" className={`${styles.tool} ${on ? styles.toolOn : ''}`} onClick={onClick} aria-label={name} title={name}>
      <svg viewBox="0 0 20 20" aria-hidden>
        <path d={GLYPH[name] ?? GLYPH.shape} />
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

/** A shape drawn here, as SVG in the document's own units. */
function Shape({ s, selected }) {
  const common = { fill: s.kind === 'line' || s.kind === 'brush' ? 'none' : s.fill, stroke: s.kind === 'line' || s.kind === 'brush' ? s.fill : 'none', strokeWidth: s.kind === 'brush' ? 14 : 10, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const sel = selected ? { filter: 'drop-shadow(0 0 2px #4b8cff)', outline: 'none' } : undefined;
  if (s.kind === 'rect') return <rect x={Math.min(s.x, s.x + s.w)} y={Math.min(s.y, s.y + s.h)} width={Math.abs(s.w)} height={Math.abs(s.h)} {...common} style={sel} />;
  if (s.kind === 'ellipse') return <ellipse cx={s.x + s.w / 2} cy={s.y + s.h / 2} rx={Math.abs(s.w / 2)} ry={Math.abs(s.h / 2)} {...common} style={sel} />;
  if (s.kind === 'line') return <line x1={s.x} y1={s.y} x2={s.x + s.w} y2={s.y + s.h} {...common} style={sel} />;
  if (s.kind === 'brush') return <polyline points={s.pts.map((p) => p.join(',')).join(' ')} {...common} style={sel} />;
  if (s.kind === 'type')
    return (
      <text x={s.x} y={s.y} fill={s.fill} fontSize={s.size} fontFamily="-apple-system, Helvetica, sans-serif" fontWeight="700" style={sel}>
        {s.text}
      </text>
    );
  return null;
}

export default function AdobeApp({ data }) {
  const which = data?.app === 'illustrator' ? 'illustrator' : 'photoshop';
  const app = APPS[which];
  const ps = which === 'photoshop';
  const ext = ps ? 'psd' : 'ai';
  const [docs, setDocs] = useState([]); // the open documents
  const [docAt, setDocAt] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [tool, setTool] = useState(app.tools[0]);
  const [color, setColor] = useState(SWATCHES[0]);
  const [selected, setSelected] = useState(null); // a layer index or 's' + shape id
  const svgRef = useRef(null);
  const drag = useRef(null);
  const doc = docs[docAt];

  const open = (template) => {
    const d = { ...template, shapes: [], hidden: {}, id: Date.now() };
    setDocs((ds) => [...ds, d]);
    setDocAt(docs.length);
    setSelected(null);
  };
  const close = (i) => {
    setDocs((ds) => ds.filter((_, k) => k !== i));
    setDocAt(0);
  };
  const update = (fn) => setDocs((ds) => ds.map((d, k) => (k === docAt ? fn(d) : d)));

  // Delete removes the selected shape.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && typeof selected === 'string' && !e.target.closest('input')) {
        update((d) => ({ ...d, shapes: d.shapes.filter((s) => `s${s.id}` !== selected) }));
        setSelected(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  // Drawing: pointer positions in the document's own units.
  const at = (e) => {
    const r = svgRef.current.getBoundingClientRect();
    return [((e.clientX - r.left) / r.width) * doc.w, ((e.clientY - r.top) / r.height) * doc.h];
  };
  const onDown = (e) => {
    const act = ACT[tool];
    if (!act || e.button !== 0) return;
    const [x, y] = at(e);
    const hit = e.target.closest('[data-shape]')?.dataset.shape;
    if (act === 'erase') {
      if (hit) update((d) => ({ ...d, shapes: d.shapes.filter((s) => String(s.id) !== hit) }));
      return;
    }
    if (act === 'select') {
      if (hit) {
        setSelected(`s${hit}`);
        drag.current = { move: hit, x, y };
      } else setSelected(null);
      return;
    }
    const id = Date.now();
    const shape =
      act === 'type'
        ? { id, kind: 'type', x, y, text: 'Your words', size: doc.w / 14, fill: color }
        : act === 'brush'
          ? { id, kind: 'brush', pts: [[x, y]], fill: color }
          : { id, kind: act, x, y, w: 0, h: 0, fill: color };
    update((d) => ({ ...d, shapes: [...d.shapes, shape] }));
    setSelected(`s${id}`);
    drag.current = act === 'type' ? null : { draw: id };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onMove = (e) => {
    const g = drag.current;
    if (!g) return;
    const [x, y] = at(e);
    update((d) => ({
      ...d,
      shapes: d.shapes.map((s) => {
        if (g.draw === s.id) return s.kind === 'brush' ? { ...s, pts: [...s.pts, [x, y]] } : { ...s, w: x - s.x, h: y - s.y };
        if (String(s.id) === g.move) {
          const dx = x - g.x;
          const dy = y - g.y;
          return s.kind === 'brush' ? { ...s, pts: s.pts.map(([px, py]) => [px + dx, py + dy]) } : { ...s, x: s.x + dx, y: s.y + dy };
        }
        return s;
      }),
    }));
    if (g.move) {
      g.x = x;
      g.y = y;
    }
  };
  const onUp = () => {
    drag.current = null;
  };
  const selShape = doc && typeof selected === 'string' ? doc.shapes.find((s) => `s${s.id}` === selected) : null;

  // ---------- Home ----------
  if (!doc) {
    const recents = app.docs;
    return (
      <div className={`${styles.app} ${ps ? styles.ps : styles.ai}`}>
        <nav className={styles.menus} aria-hidden>
          <span className={styles.badge}>{ps ? 'Ps' : 'Ai'}</span>
          {app.menus.map((m) => (
            <span key={m}>{m}</span>
          ))}
        </nav>
        <div className={styles.home}>
          <aside className={styles.homeNav}>
            <button type="button" className={styles.primary} onClick={() => setShowNew(true)}>
              New file
            </button>
            <button type="button" className={styles.secondary} onClick={() => open(recents[0])}>
              Open
            </button>
            <span className={styles.homeLink}>Home</span>
            <span className={styles.homeLinkDim}>Learn</span>
            <span className={styles.homeLinkDim}>Your files</span>
          </aside>
          <main className={styles.homeMain}>
            <h2>Welcome to {ps ? 'Photoshop' : 'Illustrator'}, Ken</h2>
            <div className={styles.quick}>
              {(ps ? PRESETS.Web : PRESETS.Print).slice(0, 3).map(([n, w, h, u]) => (
                <button key={n} type="button" onClick={() => open({ name: `Untitled-1.${ext}`, zoom: '50%', w, h, artboard: true, layers: [{ name: ps ? 'Background' : 'Artboard 1', kind: 'fill', locked: true, style: { inset: 0, background: '#fff' } }] })}>
                  <i style={{ aspectRatio: `${w} / ${h}` }} />
                  <b>{n}</b>
                  <small>
                    {w} × {h} {u}
                  </small>
                </button>
              ))}
            </div>
            <h3>Recent</h3>
            <div className={styles.recent}>
              {recents.map((d) => {
                const img = [...d.layers].reverse().find((l) => l.kind === 'image');
                return (
                  <button key={d.name} type="button" onClick={() => open(d)}>
                    <span className={styles.thumbBig}>{img && <img src={img.src} alt="" />}</span>
                    <b>{d.name}</b>
                    <small>Edited by Ken</small>
                  </button>
                );
              })}
            </div>
          </main>
        </div>
        {showNew && <NewDoc ext={ext} onClose={() => setShowNew(false)} onCreate={(d) => (setShowNew(false), open(d))} ps={ps} />}
      </div>
    );
  }

  // ---------- A document ----------
  const k = (i) => `${i}`;
  return (
    <div className={`${styles.app} ${ps ? styles.ps : styles.ai}`}>
      <nav className={styles.menus} aria-hidden>
        <span className={styles.badge}>{ps ? 'Ps' : 'Ai'}</span>
        {app.menus.map((m) => (
          <span key={m}>{m}</span>
        ))}
      </nav>
      <div className={styles.tabs} role="tablist">
        <button type="button" className={styles.homeTab} onClick={() => setDocs([])} aria-label="Home">
          ⌂
        </button>
        {docs.map((d, i) => (
          <button key={d.id} type="button" role="tab" aria-selected={i === docAt} className={i === docAt ? styles.tabOn : ''} onClick={() => setDocAt(i)}>
            {d.name} @ {d.zoom}
            <i
              aria-label="Close document"
              onClick={(e) => {
                e.stopPropagation();
                close(i);
              }}
            >
              ×
            </i>
          </button>
        ))}
      </div>
      <div className={styles.body}>
        <div className={styles.tools}>
          {app.tools.map((t) => (
            <Tool key={t} name={t} on={t === tool} onClick={() => setTool(t)} />
          ))}
          <span className={styles.swatches} aria-hidden>
            <i style={{ background: color }} />
            <i />
          </span>
        </div>
        <div className={styles.pasteboard}>
          <div className={styles.canvas} style={{ aspectRatio: `${doc.w} / ${doc.h}`, maxWidth: `min(100%, ${(doc.w / doc.h) * 72}vh)` }}>
            {[...doc.layers].reverse().map((l, ri) => {
              const i = doc.layers.length - 1 - ri;
              return <Layer key={l.name} layer={l} hidden={doc.hidden[k(i)]} />;
            })}
            <svg
              ref={svgRef}
              className={`${styles.draw} ${ACT[tool] && ACT[tool] !== 'select' ? styles.drawing : ''}`}
              viewBox={`0 0 ${doc.w} ${doc.h}`}
              preserveAspectRatio="none"
              onPointerDown={onDown}
              onPointerMove={onMove}
              onPointerUp={onUp}
            >
              {doc.shapes
                .filter((s) => !doc.hidden[`s${s.id}`])
                .map((s) => (
                  <g key={s.id} data-shape={s.id}>
                    <Shape s={s} selected={selected === `s${s.id}`} />
                  </g>
                ))}
            </svg>
          </div>
        </div>
        <aside className={styles.panels}>
          <div className={styles.panelTabs}>
            <b>Layers</b>
            <span>{ps ? 'Channels' : 'Artboards'}</span>
            <span>{ps ? 'Paths' : 'Asset Export'}</span>
          </div>
          <ul className={styles.layers}>
            {[...doc.shapes].reverse().map((s) => {
              const key = `s${s.id}`;
              return (
                <li key={key} className={selected === key ? styles.layerOn : ''}>
                  <button type="button" className={styles.eye} onClick={() => update((d) => ({ ...d, hidden: { ...d.hidden, [key]: !d.hidden[key] } }))}>
                    {doc.hidden[key] ? '' : '●'}
                  </button>
                  <button type="button" className={styles.layerName} onClick={() => setSelected(key)}>
                    <span className={styles.thumb} aria-hidden>
                      <i style={{ background: s.fill }} />
                    </span>
                    {s.kind === 'type' ? s.text : { rect: 'Rectangle', ellipse: 'Ellipse', line: 'Line', brush: 'Brush stroke' }[s.kind]}
                  </button>
                </li>
              );
            })}
            {doc.layers.map((l, i) => (
              <li key={l.name} className={selected === i ? styles.layerOn : ''}>
                <button type="button" className={styles.eye} onClick={() => update((d) => ({ ...d, hidden: { ...d.hidden, [k(i)]: !d.hidden[k(i)] } }))}>
                  {doc.hidden[k(i)] ? '' : '●'}
                </button>
                <button type="button" className={styles.layerName} onClick={() => setSelected(i)}>
                  <span className={styles.thumb} aria-hidden>
                    {l.kind === 'text' ? 'T' : l.kind === 'image' ? <img src={l.src} alt="" /> : <i style={{ background: l.style.background }} />}
                  </span>
                  {l.name}
                  {l.locked && <span className={styles.lock}>🔒</span>}
                </button>
              </li>
            ))}
          </ul>
          <div className={styles.props}>
            <b>Properties</b>
            <div className={styles.colors}>
              {SWATCHES.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={c}
                  className={c === color ? styles.colorOn : ''}
                  style={{ background: c }}
                  onClick={() => {
                    setColor(c);
                    if (selShape) update((d) => ({ ...d, shapes: d.shapes.map((s) => (s === selShape ? { ...s, fill: c } : s)) }));
                  }}
                />
              ))}
            </div>
            {selShape?.kind === 'type' && (
              <input className={styles.textEdit} value={selShape.text} onChange={(e) => update((d) => ({ ...d, shapes: d.shapes.map((s) => (s.id === selShape.id ? { ...s, text: e.target.value } : s)) }))} aria-label="Text" />
            )}
            <p>
              {doc.w} × {doc.h} · {ACT[tool] ? `${tool} tool` : 'pick a tool: shapes, brush, type'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** The New Document dialog: categories, presets, the details. */
function NewDoc({ ext, onClose, onCreate, ps }) {
  const [cat, setCat] = useState(ps ? 'Web' : 'Print');
  const [pick, setPick] = useState(0);
  const [name, setName] = useState(`Untitled-1`);
  const [w, setW] = useState(PRESETS[cat][0][1]);
  const [h, setH] = useState(PRESETS[cat][0][2]);
  const choose = (c, i) => {
    setCat(c);
    setPick(i);
    setW(PRESETS[c][i][1]);
    setH(PRESETS[c][i][2]);
  };
  return (
    <div className={styles.dialogBack}>
      <div className={styles.dialog} role="dialog" aria-label="New Document">
        <header>New Document</header>
        <nav>
          {Object.keys(PRESETS).map((c) => (
            <button key={c} type="button" className={c === cat ? styles.catOn : ''} onClick={() => choose(c, 0)}>
              {c}
            </button>
          ))}
        </nav>
        <div className={styles.dialogBody}>
          <section>
            <small>BLANK DOCUMENT PRESETS ({PRESETS[cat].length})</small>
            <div className={styles.presets}>
              {PRESETS[cat].map(([n, pw, ph, u], i) => (
                <button key={n} type="button" className={i === pick ? styles.presetOn : ''} onClick={() => choose(cat, i)} onDoubleClick={() => onCreate(blank(`${name}.${ext}`, pw, ph, ps))}>
                  <i style={{ aspectRatio: `${pw} / ${ph}` }} />
                  <b>{n}</b>
                  <small>
                    {pw} × {ph} {u}
                  </small>
                </button>
              ))}
            </div>
          </section>
          <aside>
            <small>PRESET DETAILS</small>
            <input className={styles.nameInput} value={name} onChange={(e) => setName(e.target.value)} aria-label="Name" />
            <label>
              Width
              <input type="number" value={w} onChange={(e) => setW(Number(e.target.value) || 1)} />
            </label>
            <label>
              Height
              <input type="number" value={h} onChange={(e) => setH(Number(e.target.value) || 1)} />
            </label>
            <label>
              Colour Mode
              <select defaultValue={ps ? 'RGB' : 'CMYK'}>
                <option>RGB Color</option>
                <option>CMYK Color</option>
              </select>
            </label>
            <span className={styles.dialogActions}>
              <button type="button" className={styles.secondary} onClick={onClose}>
                Close
              </button>
              <button type="button" className={styles.primary} onClick={() => onCreate(blank(`${name}.${ext}`, w, h, ps))}>
                Create
              </button>
            </span>
          </aside>
        </div>
      </div>
    </div>
  );
}

const blank = (name, w, h, ps) => ({
  name,
  zoom: '50%',
  w,
  h,
  artboard: true,
  layers: [{ name: ps ? 'Background' : 'Artboard 1', kind: 'fill', locked: true, style: { inset: 0, background: '#fff' } }],
});
