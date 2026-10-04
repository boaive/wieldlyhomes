/**
 * Scroll timelines, shared by the DOM overlays and the 3D scenes so text and
 * camera always agree. Every value is a 0→1 progress within its chapter.
 */

/** Chapter `enter`: facility exterior → door → five factory stations. */
export const ENTER = {
  hero: [0, 0.075] as const,
  title: [0.165, 0.29] as const,
  stations: [0.36, 0.49, 0.62, 0.75, 0.89] as const,
  half: 0.06,
};

/** Chapter `reveal`: sectional cut through the finished module. */
export const REVEAL = {
  title: [0, 0.17] as const,
  cut: [0.14, 0.58] as const,
  layers: { start: 0.2, end: 1, count: 4 },
};

/** Chapter `why`: six advantages. */
export const WHY = { start: 0.05, end: 1, count: 6 };

/** Chapter `story`: nine construction stages. */
export const STORY = { start: 0.035, end: 1, count: 9 };

/** Chapter `precast`: title, then base / extended / combined. */
export const PRECAST = { title: [0, 0.22] as const, start: 0.24, end: 1, count: 3 };

/** Chapter `journey`: beat boundaries (lift, transport, site, placement, finish). */
export const JOURNEY_BEATS = [0, 0.28, 0.48, 0.56, 0.84, 1] as const;

/** Chapter `habitat`: five interior stops. */
export const HABITAT = { start: 0.08, end: 1, count: 5 };

/** Heights of the sticky chapters, in viewport heights. */
export const LENGTH = {
  enter: 760,
  reveal: 380,
  why: 520,
  story: 820,
  precast: 380,
  journey: 640,
  habitat: 460,
  precamp: 220,
  capsule: 220,
} as const;
