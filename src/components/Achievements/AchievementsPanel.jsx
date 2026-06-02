import { useOS } from '../../context/OSContext.jsx';
import styles from './Achievements.module.css';

export default function AchievementsPanel() {
  const { achievements, unlockedIds, resetAchievements } = useOS();
  const total = achievements.length;
  const unlocked = unlockedIds.length;

  return (
    <div>
      <p className={styles.progress}>
        Unlocked <strong>{unlocked}</strong> of <strong>{total}</strong>
      </p>
      <ul className={styles.list}>
        {achievements.map((a) => {
          const isUnlocked = unlockedIds.includes(a.id);
          return (
            <li
              key={a.id}
              className={`${styles.item} ${isUnlocked ? styles.itemUnlocked : ''}`}
            >
              <span className={styles.icon}>{isUnlocked ? a.icon : '🔒'}</span>
              <div className={styles.info}>
                <h3>{a.title}</h3>
                <p>{a.description}</p>
              </div>
            </li>
          );
        })}
      </ul>
      <button type="button" className={styles.reset} onClick={resetAchievements}>
        Reset achievements
      </button>
    </div>
  );
}
