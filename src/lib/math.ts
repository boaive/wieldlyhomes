export const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(min, v));

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** 0→1 as x travels a→b, clamped. */
export const ramp = (x: number, a: number, b: number) => clamp((x - a) / (b - a));

/** Smooth 0→1 as x travels a→b. */
export const smooth = (x: number, a: number, b: number) => {
  const t = ramp(x, a, b);
  return t * t * (3 - 2 * t);
};

/** 0→1→0 window: rises over [a,b], holds, falls over [c,d]. */
export const windowed = (x: number, a: number, b: number, c: number, d: number) =>
  Math.min(smooth(x, a, b), 1 - smooth(x, c, d));

export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Frame-rate independent exponential approach. */
export const damp = (current: number, target: number, lambda: number, dt: number) =>
  lerp(current, target, 1 - Math.exp(-lambda * dt));

/** Index of the beat that owns progress `p`, for `count` equal beats inside [start,end]. */
export const beatAt = (p: number, count: number, start = 0, end = 1) =>
  clamp(Math.floor(ramp(p, start, end) * count), 0, count - 1);

/** Local 0→1 progress inside beat `i`. */
export const beatLocal = (p: number, i: number, count: number, start = 0, end = 1) => {
  const span = (end - start) / count;
  return ramp(p, start + i * span, start + (i + 1) * span);
};
