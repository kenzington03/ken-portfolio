import { useId } from 'react';

/** macOS-style folder SVG — dark gray body, teal-tinted tab */
export default function MacFolderIcon({ size = 48, className, variant = 'default' }) {
  const uid = useId().replace(/:/g, '');
  const gradId = `folder-grad-${uid}`;
  const gridId = `work-grid-${uid}`;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={className}
      aria-hidden
    >
      <defs>
        {variant === 'work' && (
          <pattern id={gridId} width="4" height="4" patternUnits="userSpaceOnUse">
            <path
              d="M0 4 L4 0"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="0.5"
            />
          </pattern>
        )}
        <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#35353a" />
          <stop offset="100%" stopColor="#2a2a2e" />
        </linearGradient>
      </defs>
      {/* Tab */}
      <path
        d="M8 14 L8 11 Q8 9 10 9 L18 9 Q20 9 21 10 L24 14 Z"
        fill="rgba(13, 155, 168, 0.4)"
      />
      <path
        d="M8 14 L8 11.5 Q8 10 9.5 10 L17 10 Q18.5 10 19.5 11 L22 14 Z"
        fill="#3a3a3f"
      />
      {/* Body */}
      <path
        d="M6 14 H38 Q40 14 40 16 V38 Q40 40 38 40 H10 Q8 40 8 38 V14 Z"
        fill={`url(#${gradId})`}
      />
      <path
        d="M6 14 H38 Q40 14 40 16 V38 Q40 40 38 40 H10 Q8 40 8 38 V14 Z"
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="0.5"
      />
      {variant === 'work' && (
        <path
          d="M10 18 H36 V36 H10 Z"
          fill={`url(#${gridId})`}
          opacity="0.9"
        />
      )}
      {/* Front shine */}
      <path
        d="M10 16 H36 V17 H10 Z"
        fill="rgba(255,255,255,0.06)"
      />
    </svg>
  );
}
