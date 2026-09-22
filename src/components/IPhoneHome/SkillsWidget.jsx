import styles from './SkillsWidget.module.css';

/* ─── Minimal glyphs, one per skill area (weather-condition-icon scale) ─── */
const BrandGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M9 1l3.5 7L18 9l-5.5 1L9 17l-3.5-7L0 9l5.5-1z" fill="white" fillOpacity="0.92" />
  </svg>
);
const MotionGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <circle cx="9" cy="9" r="8.5" stroke="white" strokeOpacity="0.5" />
    <path d="M7 5.5l6 3.5-6 3.5z" fill="white" fillOpacity="0.92" />
  </svg>
);
const VideoGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="4" width="12" height="10" rx="2" fill="white" fillOpacity="0.92" />
    <path d="M13 7.5l4-2.5v8l-4-2.5z" fill="white" fillOpacity="0.7" />
  </svg>
);
const UxGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="1" y="1" width="16" height="16" rx="4" stroke="white" strokeOpacity="0.55" strokeWidth="1.4" />
    <path d="M6 5l7 3-3 1-1 3z" fill="white" fillOpacity="0.92" />
  </svg>
);
const PrintGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <rect x="3" y="1" width="12" height="8" rx="1" fill="white" fillOpacity="0.55" />
    <rect x="1" y="6" width="16" height="7" rx="1.5" fill="white" fillOpacity="0.92" />
  </svg>
);
const CampaignGlyph = () => (
  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
    <path d="M1 7v4h3l6 4V3L4 7z" fill="white" fillOpacity="0.92" />
    <path d="M13 6.5a4 4 0 010 5" stroke="white" strokeOpacity="0.6" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

const SKILL_FORECAST = [
  { label: 'Brand', Glyph: BrandGlyph },
  { label: 'Motion', Glyph: MotionGlyph },
  { label: 'Video', Glyph: VideoGlyph },
  { label: 'UI/UX', Glyph: UxGlyph },
  { label: 'Print', Glyph: PrintGlyph },
  { label: 'Campaigns', Glyph: CampaignGlyph },
];

/** Home-screen widget, styled after the iOS Weather app, repurposed to
 * showcase Ken's skill areas instead of a forecast. */
export default function SkillsWidget() {
  return (
    <div className={styles.widget}>
      <div className={styles.top}>
        <div>
          <p className={styles.eyebrow}>Skills</p>
          <p className={styles.subtitle}>Design Lead · Milestone</p>
        </div>
        <MotionGlyph />
      </div>

      <div className={styles.current}>
        <span className={styles.currentValue}>All-Round Creative</span>
        <p className={styles.currentDesc}>10 years across brand, motion &amp; video</p>
      </div>

      <div className={styles.forecastRow}>
        {SKILL_FORECAST.map(({ label, Glyph }) => (
          <div key={label} className={styles.forecastItem}>
            <span className={styles.forecastLabel}>{label}</span>
            <Glyph />
          </div>
        ))}
      </div>
    </div>
  );
}
