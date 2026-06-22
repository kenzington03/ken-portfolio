import styles from './IllustratorIcon.module.css';

export default function IllustratorIcon() {
  return (
    <svg
      className={styles.icon}
      viewBox="0 0 48 48"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width="48" height="48" rx="10" fill="#330000" />
      <text
        x="24"
        y="31"
        textAnchor="middle"
        fill="#FF9A00"
        fontSize="18"
        fontWeight="700"
        fontFamily="'Helvetica Neue', Arial, sans-serif"
      >
        Ai
      </text>
    </svg>
  );
}
