import styles from './HeroVideo.module.css';

export default function HeroVideo({
  src,
  className = '',
  onClick,
  muted = true,
  loop = true,
  videoRef,
}) {
  return (
    <div
      className={`${styles.hero} ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick(e);
              }
            }
          : undefined
      }
    >
      <video
        ref={videoRef}
        src={src}
        autoPlay
        muted={muted}
        loop={loop}
        playsInline
        crossOrigin="anonymous"
        className={styles.video}
      />
    </div>
  );
}
