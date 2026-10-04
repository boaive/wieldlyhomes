import { create } from 'zustand';
import { detectTier, detectWebgl, prefersReducedMotion } from '../lib/device';

/**
 * Chapters are the DOM sections of the page, in narrative order.
 * The 3D director maps the active chapter + its scroll progress to a scene.
 */
export const CHAPTERS = [
  'enter',
  'reveal',
  'why',
  'ledger',
  'story',
  'precast',
  'plans',
  'configure',
  'journey',
  'habitat',
  'precamp',
  'capsule',
  'contact',
] as const;

export type ChapterId = (typeof CHAPTERS)[number];

export type Tier = 'low' | 'mid' | 'high';

const zeroes = () => Object.fromEntries(CHAPTERS.map((c) => [c, 0])) as Record<ChapterId, number>;

/**
 * Per-frame scroll state. Deliberately mutable and non-reactive: it is written
 * by ScrollTrigger and read inside the render loop, so nothing re-renders on scroll.
 */
export const scroll = {
  y: 0,
  vh: 1,
  chapter: 'enter' as ChapterId,
  /** 0→1 travel of each chapter's sticky stage. */
  p: zeroes(),
  /** Scroll offsets at which each chapter's top / bottom cross the viewport centre. */
  start: zeroes(),
  end: zeroes(),
};

interface StageState {
  chapter: ChapterId;
  /** True while the hero (step 01) of the first chapter is on screen. */
  atStart: boolean;
  /** Loader milestones that have completed. */
  loaded: Record<'type' | 'engine' | 'scene' | 'frame', boolean>;
  ready: boolean;
  webgl: boolean;
  tier: Tier;
  reducedMotion: boolean;
  setChapter: (c: ChapterId) => void;
  setAtStart: (v: boolean) => void;
  markLoaded: (k: keyof StageState['loaded']) => void;
  setReady: () => void;
  setWebgl: (ok: boolean) => void;
}

export const useStage = create<StageState>((set, get) => ({
  chapter: 'enter',
  atStart: true,
  loaded: { type: false, engine: false, scene: false, frame: false },
  ready: false,
  webgl: detectWebgl(),
  tier: detectTier(),
  reducedMotion: prefersReducedMotion(),
  setChapter: (chapter) => {
    scroll.chapter = chapter;
    if (get().chapter !== chapter) set({ chapter });
  },
  setAtStart: (atStart) => {
    if (get().atStart !== atStart) set({ atStart });
  },
  markLoaded: (k) => {
    if (!get().loaded[k]) set({ loaded: { ...get().loaded, [k]: true } });
  },
  setReady: () => set({ ready: true }),
  setWebgl: (webgl) => set({ webgl }),
}));
