import AppIcon from './AppIcon.jsx';
import { HOME_APPS } from './appData.jsx';
import styles from './AppGrid.module.css';

export default function AppGrid({ wiggle, onTap, onLongPress }) {
  return (
    <div className={styles.grid}>
      {HOME_APPS.map((app) => (
        <AppIcon
          key={app.id}
          app={app}
          wiggle={wiggle}
          showBadge={wiggle}
          onTap={() => onTap(app)}
          onLongPress={onLongPress}
        />
      ))}
    </div>
  );
}
