import AppIcon from './AppIcon.jsx';
import { DOCK_APPS } from './appData.jsx';
import styles from './MobileDock.module.css';

export default function MobileDock({ onTap }) {
  return (
    <div className={styles.dockWrap}>
      <div className={styles.dock}>
        {DOCK_APPS.map((app) => (
          <AppIcon
            key={app.id}
            app={{ ...app, label: '' }}
            wiggle={false}
            showBadge={false}
            onTap={() => onTap(app)}
          />
        ))}
      </div>
      <div className={styles.homeIndicator} aria-hidden="true" />
    </div>
  );
}
