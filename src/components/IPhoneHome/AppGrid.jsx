import AppIcon from './AppIcon.jsx';
import styles from './AppGrid.module.css';

export default function AppGrid({ apps, wiggle, onTap, onLongPress }) {
  return (
    <div className={styles.grid}>
      {apps.map((app) => (
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
