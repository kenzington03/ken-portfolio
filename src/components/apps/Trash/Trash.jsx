import { useState } from 'react';
import styles from './Trash.module.css';

const TRASH_ITEMS = [
  {
    id: 'figma-v1',
    name: 'logo_final_v1.fig',
    hint: 'The one before “final_final”.',
  },
  {
    id: 'comic-sans',
    name: 'pitch_deck_comic_sans.ppt',
    hint: 'A brave experiment. Never again.',
  },
  {
    id: 'stock-photo',
    name: 'handshake_stock_4K.jpg',
    hint: 'Corporate synergy, circa 2016.',
  },
  {
    id: 'readme',
    name: 'README_do_not_open.txt',
    hint: 'You opened it anyway. Respect.',
  },
];

export default function Trash() {
  const [selectedId, setSelectedId] = useState(null);
  const selected = TRASH_ITEMS.find((item) => item.id === selectedId);

  return (
    <div className={styles.trash}>
      <p className={styles.subtitle}>4 items</p>
      <div className={styles.grid}>
        {TRASH_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`${styles.item} ${selectedId === item.id ? styles.itemSelected : ''}`}
            onClick={() => setSelectedId(item.id)}
            onDoubleClick={() => setSelectedId(item.id)}
          >
            <span className={styles.docIcon} aria-hidden>
              <span className={styles.docBody} />
              <span className={styles.docFold} />
            </span>
            <span className={styles.itemLabel}>{item.name}</span>
          </button>
        ))}
      </div>
      {selected && (
        <p className={styles.preview} role="status">
          {selected.hint}
        </p>
      )}
    </div>
  );
}
