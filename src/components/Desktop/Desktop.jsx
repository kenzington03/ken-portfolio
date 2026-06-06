import { useState } from 'react';
import { useOS } from '../../context/OSContext.jsx';
import Wallpaper from './Wallpaper.jsx';
import WindowLayer from '../Window/WindowLayer.jsx';
import styles from './Desktop.module.css';

const DESKTOP_ICONS = [
  { id: 'about', label: 'About', appId: 'about', icon: '/assets/icons/desktop-Resume.png' },
  { id: 'work', label: 'Work', appId: 'finder', icon: '/assets/icons/desktop-branding.png' },
  {
    id: 'experience',
    label: 'Experience',
    appId: 'experience',
    icon: '/assets/icons/desktop-milestone.png',
  },
  { id: 'cv', label: 'cv.pdf', appId: 'pdfviewer', icon: '/assets/icons/desktop-print.png' },
  { id: 'contact', label: 'Contact', appId: 'contact', icon: '/assets/icons/dock-mail.png' },
];

const TRASH_ICON = '/assets/icons/dock-trash.png';

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
              <span className={styles.iconGraphic}>
                <img
                  src={item.icon}
                  alt=""
                  width={48}
                  height={48}
                  className={styles.iconImg}
                  draggable={false}
                />
              </span>
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
            <img
              src={TRASH_ICON}
              alt=""
              width={48}
              height={48}
              className={styles.iconImg}
              draggable={false}
            />
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
