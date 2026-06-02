import { useId } from 'react';

/** macOS Finder-style blue folder with teal tint */
export default function FinderFolderIcon({ size = 64 }) {
  const uid = useId().replace(/:/g, '');
  const bodyGrad = `finder-body-${uid}`;
  const tabGrad = `finder-tab-${uid}`;

  return (
    <svg width={size} height={size * 0.82} viewBox="0 0 64 52" aria-hidden>
      <defs>
        <linearGradient id={bodyGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4a8fd4" />
          <stop offset="45%" stopColor="#2b6cb0" />
          <stop offset="100%" stopColor="#1e5088" />
        </linearGradient>
        <linearGradient id={tabGrad} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#5a9ee0" />
          <stop offset="100%" stopColor="#3a7fc8" />
        </linearGradient>
      </defs>
      {/* Tab */}
      <path
        d="M6 18 L6 13 Q6 10 9 10 L22 10 Q25 10 27 12 L32 18 Z"
        fill={`url(#${tabGrad})`}
      />
      {/* Body */}
      <path
        d="M4 18 H56 Q58 18 58 20 V44 Q58 47 55 47 H9 Q6 47 6 44 V18 Z"
        fill={`url(#${bodyGrad})`}
      />
      {/* Teal overlay 30% */}
      <path
        d="M4 18 H56 Q58 18 58 20 V44 Q58 47 55 47 H9 Q6 47 6 44 V18 Z"
        fill="#0d9ba8"
        opacity="0.3"
      />
      {/* Highlight edge */}
      <path
        d="M8 20 H54"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="0.75"
      />
      <path
        d="M4 18 H56 Q58 18 58 20 V44 Q58 47 55 47 H9 Q6 47 6 44 V18 Z"
        fill="none"
        stroke="rgba(0,0,0,0.15)"
        strokeWidth="0.5"
      />
    </svg>
  );
}
