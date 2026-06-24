import AppIcon from './AppIcon.jsx';
import { DOCK_APPS } from './appData.jsx';
import styles from './MobileDock.module.css';

export default function MobileDock({ onTap }) {
  return (
    <div className={styles.dockOuter}>
      <div className={styles.dockInner}>
        {DOCK_APPS.map((app) => (
          <AppIcon
            key={app.id}
            app={app}
            dockMode
            wiggle={false}
            showBadge={false}
            onTap={() => onTap(app)}
          />
        ))}
      </div>
      {/* iOS home indicator */}
      <div className={styles.homeBar} />
    </div>
  );
}
