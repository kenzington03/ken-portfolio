import { useOS } from '../../context/OSContext.jsx';
import styles from './SocialProof.module.css';

export default function SocialProof() {
  const { portfolioOpened } = useOS();

  return (
    <p
      className={`${styles.socialProof} ${portfolioOpened ? styles.hidden : ''}`}
      aria-live="polite"
    >
      Design Lead at Milestone Technologies · Hyderabad, India · 10 years experience
    </p>
  );
}
