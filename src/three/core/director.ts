import { scroll, type ChapterId, CHAPTERS } from '../../state/stage';
import type { SceneId } from './types';

/**
 * Live director state, readable from any scene's render loop.
 * `scene` is the scene currently on screen.
 */
export const director = {
  scene: 'factory' as SceneId,
  time: 0,
  /** Narrow / portrait viewport. */
  compact: false,
};

/** Journey chapter timeline: yard loading → road → site. */
export const JOURNEY = { roadAt: 0.28, siteAt: 0.48 } as const;

/** Which scene a chapter shows at progress `p`. */
export function sceneFor(chapter: ChapterId, p: number): SceneId {
  switch (chapter) {
    case 'enter':
    case 'reveal':
      return 'factory';
    case 'why':
      return 'module';
    case 'ledger':
      // Solid section: swap scenes while the canvas is fully covered.
      return p < 0.5 ? 'module' : 'story';
    case 'story':
      return 'story';
    case 'precast':
    case 'plans':
      return 'system';
    case 'configure':
      return 'config';
    case 'journey':
      return p < JOURNEY.roadAt ? 'config' : 'route';
    case 'habitat':
      return 'habitat';
    default:
      return 'future';
  }
}

/** Chapter boundaries where the scene changes on screen and the canvas dips to dark. */
const CUTS: ChapterId[] = ['reveal', 'story', 'plans', 'journey', 'habitat'];

/** 0–1 dip for the chapter boundaries, from raw scroll position. */
export function boundaryVeil(): number {
  let veil = 0;
  const reach = scroll.vh * 0.46;
  for (const c of CUTS) {
    const boundary = scroll.end[c];
    if (!boundary) continue;
    const d = Math.abs(scroll.y - boundary) / reach;
    if (d < 1) veil = Math.max(veil, Math.min(1, (1 - d) * 1.7));
  }
  return veil;
}

export const neighbours = (chapter: ChapterId): [ChapterId | null, ChapterId | null] => {
  const i = CHAPTERS.indexOf(chapter);
  return [CHAPTERS[i - 1] ?? null, CHAPTERS[i + 1] ?? null];
};

/** True while `id` is the scene on screen — scenes skip their animation work otherwise. */
export const onScreen = (id: SceneId) => director.scene === id;
