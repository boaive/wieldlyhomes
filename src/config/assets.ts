/**
 * ASSET MAP — the single place where real Wieldy assets are wired in.
 *
 * Every 3D object in V1 is procedural placeholder geometry. To replace one with
 * a real model, drop the .glb into the matching /public/assets/<folder>/ and set
 * its path here. `ModelSlot` loads the file and falls back to the procedural
 * geometry if the path is null or the file fails to load, so a missing asset
 * can never break the page.
 *
 * Paths are relative to /public (e.g. '/assets/modules/base-capsule.glb').
 */

export type AssetPath = string | null;

export const brandAssets = {
  mark: '/assets/brand/wieldy-mark.png',
} as const;

export const moduleAssets: Record<'base' | 'extended', AssetPath> = {
  base: null,
  extended: null,
};

export const factoryAssets: Record<'exterior' | 'interior', AssetPath> = {
  exterior: null,
  interior: null,
};

export const constructionAssets: Record<
  | 'foundation'
  | 'shell'
  | 'insulation'
  | 'services'
  | 'forming'
  | 'casting'
  | 'finishing'
  | 'installation'
  | 'habitat',
  AssetPath
> = {
  foundation: null,
  shell: null,
  insulation: null,
  services: null,
  forming: null,
  casting: null,
  finishing: null,
  installation: null,
  habitat: null,
};

export const interiorAssets: Record<'habitat', AssetPath> = {
  habitat: null,
};

export const futureAssets: Record<'labourPrecamp' | 'capsuleHouse', AssetPath> = {
  labourPrecamp: null,
  capsuleHouse: null,
};

export const vehicleAssets: Record<'truck' | 'crane', AssetPath> = {
  truck: null,
  crane: null,
};
