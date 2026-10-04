import type { Tier } from '../state/stage';

const params = new URLSearchParams(typeof window === 'undefined' ? '' : window.location.search);

/** `?nowebgl` forces the static fallback — used for QA. */
export const forceNoWebgl = params.has('nowebgl');

export function detectWebgl(): boolean {
  if (forceNoWebgl) return false;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
    return !!gl;
  } catch {
    return false;
  }
}

/** Quality tier. `?quality=low|mid|high` overrides detection. */
export function detectTier(): Tier {
  const forced = params.get('quality');
  if (forced === 'low' || forced === 'mid' || forced === 'high') return forced;
  const width = window.innerWidth;
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const cores = navigator.hardwareConcurrency ?? 4;
  if (width < 768 || (coarse && cores <= 4)) return 'low';
  if (width < 1200 || coarse || cores <= 4) return 'mid';
  return 'high';
}

export const prefersReducedMotion = () =>
  params.has('reduced') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** `?still` disables camera damping and idle drift — used for QA captures. */
export const stillCamera = params.has('still');
