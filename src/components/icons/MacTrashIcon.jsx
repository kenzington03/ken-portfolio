/** macOS-style trash can — full with crumpled papers */
export default function MacTrashIcon({ size = 48 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden>
      <defs>
        <linearGradient id="trash-can-grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#c4c4c9" />
          <stop offset="100%" stopColor="#8e8e93" />
        </linearGradient>
      </defs>
      <ellipse cx="24" cy="44" rx="14" ry="2" fill="rgba(0,0,0,0.25)" />
      <path d="M8 18 H40 L38 14 H10 Z" fill="#9a9aa0" />
      <path d="M8 18 H40" stroke="#b8b8bd" strokeWidth="0.5" />
      <path
        d="M12 18 L14 40 Q14 42 16 42 H32 Q34 42 34 40 L36 18 Z"
        fill="url(#trash-can-grad)"
      />
      <path d="M18 20 V38 M24 20 V38 M30 20 V38" stroke="rgba(0,0,0,0.12)" strokeWidth="0.75" />
      <path
        d="M16 24 L22 22 L20 32 L14 33 Z"
        fill="#f0f0f2"
        stroke="#d8d8dc"
        strokeWidth="0.4"
      />
      <path
        d="M22 23 L28 25 L26 34 L20 33 Z"
        fill="#e8e8ec"
        stroke="#d0d0d4"
        strokeWidth="0.4"
      />
      <path
        d="M19 30 L25 28 L24 36 L18 35 Z"
        fill="#fafafa"
        stroke="#e0e0e4"
        strokeWidth="0.4"
      />
      <path d="M12 18 H36" stroke="rgba(255,255,255,0.35)" strokeWidth="0.75" />
    </svg>
  );
}
