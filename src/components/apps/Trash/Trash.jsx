import { useState } from 'react';
import styles from './Trash.module.css';

// The Trash, like a designer's: old versions, a stock clip never used, dead
// apps, a font best forgotten. Select one to look at it; Empty empties it
// (for this visit).
const ITEMS = [
  { id: 'me', name: 'me_2016.jpg', kind: 'image', src: '/assets/hero/art/ken-sm.webp', note: 'The haircut was a phase.' },
  { id: 'stock', name: 'stock_man_posing_4K.mp4', kind: 'video', src: '/assets/hero/walkin/stock-walkin.mp4', note: 'Paid for it. Never used it.' },
  { id: 'logo', name: 'logo_final_FINAL_v12.png', kind: 'image', src: '/assets/projects/01-fluidai/rebranding/rebranding__fluid-rebrand-04-brain-logo-lockup.png', note: 'Twelve finals. The thirteenth shipped.' },
  { id: 'court', name: 'court_reference.jpg', kind: 'image', src: '/assets/me/placeholder/court.webp', note: 'Reference for a poster that never happened.' },
  { id: 'flash', name: 'Flash Player.app', kind: 'app', glyph: 'f', tint: '#c8102e', note: 'RIP, 1996 to 2020.' },
  { id: 'comic', name: 'Comic Sans.ttf', kind: 'font', glyph: 'Aa', note: 'Installed. Regretted. Removed.' },
  { id: 'psd', name: 'Untitled-1.psd', kind: 'app', glyph: 'Ps', tint: '#001e36', fg: '#31a8ff', note: 'Every designer has four hundred of these.' },
  { id: 'brief', name: 'brief_v1_before_feedback.docx', kind: 'doc', glyph: 'W', tint: '#185abd', note: 'Before the client "had a thought".' },
];

function Thumb({ item, big = false }) {
  if (item.kind === 'image') return <img className={styles.img} src={item.src} alt="" draggable={false} />;
  if (item.kind === 'video')
    return big ? (
      <video className={styles.img} src={item.src} autoPlay muted loop playsInline />
    ) : (
      <span className={styles.video}>
        <i />
      </span>
    );
  return (
    <span className={`${styles.glyph} ${item.kind === 'font' ? styles.font : ''}`} style={{ background: item.tint, color: item.fg }}>
      {item.glyph}
    </span>
  );
}

export default function Trash() {
  const [items, setItems] = useState(ITEMS);
  const [sel, setSel] = useState(null);
  const selected = items.find((i) => i.id === sel);

  return (
    <div className={styles.trash}>
      <div className={styles.bar}>
        <span>{items.length ? `${items.length} items` : 'Trash'}</span>
        <button type="button" disabled={!items.length} onClick={() => (setItems([]), setSel(null))}>
          Empty
        </button>
      </div>
      {items.length ? (
        <div className={styles.body}>
          <div className={styles.grid}>
            {items.map((item) => (
              <button key={item.id} type="button" className={`${styles.item} ${sel === item.id ? styles.on : ''}`} onClick={() => setSel(item.id)}>
                <span className={styles.thumb}>
                  <Thumb item={item} />
                </span>
                <span className={styles.label}>{item.name}</span>
              </button>
            ))}
          </div>
          {selected && (
            <aside className={styles.preview}>
              <span className={styles.big}>
                <Thumb item={selected} big />
              </span>
              <b>{selected.name}</b>
              <p>{selected.note}</p>
            </aside>
          )}
        </div>
      ) : (
        <p className={styles.empty}>Trash is empty. Clean slate.</p>
      )}
    </div>
  );
}
