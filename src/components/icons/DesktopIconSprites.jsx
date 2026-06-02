export function AboutIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect width="48" height="48" rx="10" fill="#1c1c1e" />
      <circle cx="24" cy="18" r="7" fill="#8e8e93" />
      <path
        d="M12 38 Q12 28 24 28 Q36 28 36 38"
        fill="#8e8e93"
      />
    </svg>
  );
}

export function ExperienceIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect width="48" height="48" rx="10" fill="#1c1c1e" />
      <rect x="12" y="16" width="24" height="18" rx="3" fill="#c4a574" />
      <path d="M12 20 H36" stroke="#8b7355" strokeWidth="1" />
      <rect x="22" y="14" width="4" height="6" rx="1" fill="#c4a574" />
      <path d="M20 14 H28 V12 Q24 10 20 12 Z" fill="#c4a574" />
    </svg>
  );
}

export function PdfIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect width="48" height="48" rx="10" fill="#1c1c1e" />
      <rect x="14" y="8" width="20" height="28" rx="2" fill="#2a2a2e" stroke="rgba(255,255,255,0.12)" />
      <rect x="14" y="28" width="20" height="8" fill="#e74c3c" />
      <text
        x="24"
        y="34"
        textAnchor="middle"
        fill="#fff"
        fontSize="7"
        fontWeight="700"
        fontFamily="system-ui, sans-serif"
      >
        PDF
      </text>
      <path d="M18 14 H30 M18 18 H28 M18 22 H26" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
    </svg>
  );
}

export function ContactIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect width="48" height="48" rx="10" fill="#1c1c1e" />
      <rect x="10" y="14" width="28" height="20" rx="3" fill="#0d9ba8" opacity="0.9" />
      <path
        d="M10 14 L24 26 L38 14"
        fill="none"
        stroke="#1c1c1e"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrashDesktopIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <rect width="48" height="48" rx="10" fill="transparent" />
      {/* Lid */}
      <path
        d="M10 16 H38 L36 13 H12 Z"
        fill="#6b6b70"
        stroke="#8e8e93"
        strokeWidth="0.5"
      />
      {/* Can */}
      <path
        d="M14 16 V36 Q14 38 16 38 H32 Q34 38 34 36 V16"
        fill="#4a4a4e"
        stroke="#8e8e93"
        strokeWidth="0.75"
      />
      {/* Papers inside */}
      <rect x="17" y="20" width="8" height="10" rx="1" fill="#f5f5f5" opacity="0.85" transform="rotate(-6 21 25)" />
      <rect x="23" y="22" width="7" height="9" rx="1" fill="#e8e8e8" opacity="0.75" transform="rotate(4 26 26)" />
      <rect x="19" y="28" width="9" height="6" rx="1" fill="#d4d4d4" opacity="0.7" />
    </svg>
  );
}
