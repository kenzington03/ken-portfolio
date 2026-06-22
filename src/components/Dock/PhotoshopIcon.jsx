import styles from './PhotoshopIcon.module.css';

export default function PhotoshopIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="48" rx="10" fill="#001e36" />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fill="#31a8ff"
        fontSize="17"
        fontWeight="700"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
      >
        Ps
      </text>
    </svg>
  );
}
