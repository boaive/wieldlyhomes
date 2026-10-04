import type { ModuleType } from './grid';

/**
 * Physical dimensions shared by the 3D objects and the choreography code.
 * Kept free of any three.js import so UI code can use them without pulling
 * the 3D engine into the initial bundle.
 */

/** Capsule envelope, metres. Base capsule 3×3×3, extended capsule 6×3×3. */
export const DEPTH = 3;
export const HEIGHT = 3;
export const widthOf = (type: ModuleType) => (type === 'extended' ? 6 : 3);

/** Height of the module base above ground once it sits on its piers. */
export const PIER_H = 0.62;

/** Height of the hoist spreader above the roof of the module it carries. */
export const SPREADER_H = 1.5;

/** Trailer deck in the truck's local frame (x forward). */
export const TRAILER = { deckY: 1.26, backX: -9.3, length: 12.2 } as const;
