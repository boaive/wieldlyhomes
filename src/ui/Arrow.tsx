/** Thin arrow used inside buttons. */
export function Arrow({ down = false }: { down?: boolean }) {
  return (
    <svg viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true" style={down ? { transform: 'rotate(90deg)' } : undefined}>
      <path d="M1 7h12M8.5 2.5 13 7l-4.5 4.5" />
    </svg>
  );
}
