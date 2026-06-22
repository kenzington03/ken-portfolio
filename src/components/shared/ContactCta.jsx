import { useOS } from '../../context/OSContext.jsx';
import styles from './ContactCta.module.css';

export default function ContactCta() {
  const { launchApp } = useOS();

  const handleClick = () => {
    launchApp('contact');
  };

  return (
    <button type="button" className={styles.contactCta} onClick={handleClick}>
      Let&apos;s talk →
    </button>
  );
}
