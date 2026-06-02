import { useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import Wallpaper from './Wallpaper.jsx';
import WindowLayer from '../Window/WindowLayer.jsx';
import MacFolderIcon from '../icons/MacFolderIcon.jsx';
import {
  AboutIcon,
  ExperienceIcon,
  PdfIcon,
  ContactIcon,
} from '../icons/DesktopIconSprites.jsx';
import MacTrashIcon from '../icons/MacTrashIcon.jsx';
import styles from './Desktop.module.css';

const DESKTOP_ICONS = [
  { id: 'about', label: 'About', type: 'about', appId: 'about' },
  { id: 'work', label: 'Work', type: 'work', appId: 'finder' },
  { id: 'experience', label: 'Experience', type: 'experience', appId: 'experience' },
  { id: 'cv', label: 'cv.pdf', type: 'pdf', appId: 'pdfviewer' },
  { id: 'contact', label: 'Contact', type: 'contact', appId: 'contact' },
];

export default function Desktop() {
  const { launchApp } = useOS();
  const [selected, setSelected] = useState(null);

  const openIcon = (appId) => {
    launchApp(appId);
    setSelected(appId);
  };

  return (
    <div className={styles.desktop} onClick={() => setSelected(null)}>
      <Wallpaper />
      <div className={styles.surface}>
        <div className={styles.icons} onClick={(e) => e.stopPropagation()}>
          {DESKTOP_ICONS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`${styles.icon} ${selected === item.appId ? styles.iconSelected : ''}`}
              onDoubleClick={() => openIcon(item.appId)}
              onClick={() => setSelected(item.appId)}
            >
              <span className={styles.iconGraphic}>{renderIcon(item.type)}</span>
              <span className={styles.iconLabel}>{item.label}</span>
            </button>
          ))}
        </div>
        <button
          type="button"
          className={`${styles.trashIcon} ${selected === 'trash' ? styles.iconSelected : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            setSelected('trash');
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            openIcon('trash');
          }}
        >
          <span className={styles.iconGraphic}>
            <MacTrashIcon size={52} />
          </span>
          <span className={styles.iconLabel}>Trash</span>
        </button>
      </div>
      <div className={styles.windows}>
        <WindowLayer />
      </div>
    </div>
  );
}

function renderIcon(type) {
  switch (type) {
    case 'about':
      return <AboutIcon size={48} />;
    case 'work':
      return <MacFolderIcon size={48} variant="work" />;
    case 'experience':
      return <ExperienceIcon size={48} />;
    case 'pdf':
      return <PdfIcon size={48} />;
    case 'contact':
      return <ContactIcon size={48} />;
    default:
      return <MacFolderIcon size={48} />;
  }
}
