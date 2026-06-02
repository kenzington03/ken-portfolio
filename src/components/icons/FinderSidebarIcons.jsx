export function IconHeart({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path
        d="M7 12.5 S1.5 9 1.5 5.25 C1.5 3.5 2.75 2.25 4.5 2.25 C5.6 2.25 6.5 2.85 7 3.65 C7.5 2.85 8.4 2.25 9.5 2.25 C11.25 2.25 12.5 3.5 12.5 5.25 C12.5 9 7 12.5 7 12.5Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconFolder({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <path
        d="M2 4.5 V11 Q2 11.5 2.5 11.5 H11.5 Q12 11.5 12 11 V5.5 Q12 5 11.5 5 H7 L5.5 3.5 H2.5 Q2 3.5 2 4 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function IconChevronLeft({ className }) {
  return (
    <svg className={className} width="10" height="14" viewBox="0 0 10 14" aria-hidden>
      <path d="M7 2 L3 7 L7 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconChevronRight({ className }) {
  return (
    <svg className={className} width="10" height="14" viewBox="0 0 10 14" aria-hidden>
      <path d="M3 2 L7 7 L3 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGridView({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
      <rect x="8" y="1.5" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
      <rect x="1.5" y="8" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
      <rect x="8" y="8" width="4.5" height="4.5" rx="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconListView({ className }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" aria-hidden>
      <rect x="1.5" y="2" width="11" height="2" rx="0.5" fill="currentColor" />
      <rect x="1.5" y="6" width="11" height="2" rx="0.5" fill="currentColor" />
      <rect x="1.5" y="10" width="11" height="2" rx="0.5" fill="currentColor" />
    </svg>
  );
}

export function IconSearch({ className }) {
  return (
    <svg className={className} width="12" height="12" viewBox="0 0 12 12" aria-hidden>
      <circle cx="5" cy="5" r="3.25" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M7.5 7.5 L10 10" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
