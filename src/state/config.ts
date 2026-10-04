import { create } from 'zustand';
import gsap from 'gsap';
import {
  type ModuleType,
  type PlacedModule,
  type Rot,
  type Slot,
  CELL,
  GRID_W,
  MAX_MODULES,
  canPlace,
  centred,
  footprint,
  isLoaded,
  recommendedSlot,
  rotationY,
  validSlots,
  worldCenter,
} from '../lib/grid';
import { useStage } from './stage';

export interface Pose3 {
  x: number;
  y: number;
  z: number;
  ry: number;
}

/** A module in transit on the hoist. `t` is tweened 0→1 and read by the render loop. */
export interface Flight {
  module: PlacedModule;
  from: Pose3;
  to: Pose3;
  t: number;
  clearance: number;
}

/** View state the visitor controls by dragging the configurator viewport. */
export const configView = {
  yaw: 0.66,
  /** Limits of the horizontal orbit, radians. */
  min: -0.5,
  max: 1.9,
};

/** Live flights, keyed by module id. Mutable on purpose — read every frame, never rendered by React. */
export const flights = new Map<string, Flight>();

/** Where each module type waits before it is picked. */
const DOCK_X = -(GRID_W / 2) * CELL - 4.5;
export const DOCK: Record<ModuleType, Pose3> = {
  base: { x: DOCK_X, y: 0.35, z: -4.2, ry: 0 },
  extended: { x: DOCK_X, y: 0.35, z: 1.2, ry: Math.PI / 2 },
};

export const restPose = (m: PlacedModule): Pose3 => {
  const [x, y, z] = worldCenter(m);
  return { x, y, z, ry: rotationY(m.rot) };
};

interface ConfigState {
  modules: PlacedModule[];
  /** Modules that have been removed from the plan but are still being lifted away. */
  departing: PlacedModule[];
  selectedId: string | null;
  tool: ModuleType;
  toolRot: Rot;
  level: number;
  busy: number;
  notice: string | null;
  /** True once the visitor has placed something themselves. */
  touched: boolean;
  hoverSlot: string | null;

  setTool: (type: ModuleType) => void;
  setLevel: (level: number) => void;
  setHoverSlot: (key: string | null) => void;
  select: (id: string | null) => void;
  applySlot: (slot: Slot) => void;
  addRecommended: () => void;
  rotate: () => void;
  remove: () => void;
  reset: () => void;
  load: (modules: Omit<PlacedModule, 'id'>[]) => void;
}

let seq = 0;
const nextId = () => `m${++seq}`;

const duration = (seconds: number) => (useStage.getState().reducedMotion ? 0.01 : seconds);

export const useConfig = create<ConfigState>((set, get) => {
  const fly = (
    module: PlacedModule,
    from: Pose3,
    to: Pose3,
    opts: { seconds: number; clearance: number; delay?: number; onDone?: () => void },
  ) => {
    const flight: Flight = { module, from, to, t: 0, clearance: opts.clearance };
    flights.set(module.id, flight);
    set((s) => ({ busy: s.busy + 1 }));
    gsap.to(flight, {
      t: 1,
      duration: duration(opts.seconds),
      delay: useStage.getState().reducedMotion ? 0 : (opts.delay ?? 0),
      ease: 'none',
      onComplete: () => {
        flights.delete(module.id);
        opts.onDone?.();
        set((s) => ({ busy: Math.max(0, s.busy - 1) }));
      },
    });
  };

  const depart = (module: PlacedModule, delay = 0, seconds = 1.7) => {
    set((s) => ({ departing: [...s.departing, module] }));
    fly(module, restPose(module), DOCK[module.type], {
      seconds,
      clearance: 3.4,
      delay,
      onDone: () => set((s) => ({ departing: s.departing.filter((d) => d.id !== module.id) })),
    });
  };

  const notify = (notice: string | null) => set({ notice });

  return {
    modules: [],
    departing: [],
    selectedId: null,
    tool: 'extended',
    toolRot: 0,
    level: 0,
    busy: 0,
    notice: null,
    touched: false,
    hoverSlot: null,

    setTool: (tool) => set({ tool, selectedId: null, notice: null }),
    setLevel: (level) => set({ level, selectedId: null, notice: null }),
    setHoverSlot: (hoverSlot) => {
      if (get().hoverSlot !== hoverSlot) set({ hoverSlot });
    },
    select: (selectedId) => {
      if (get().busy) return;
      const m = get().modules.find((o) => o.id === selectedId);
      set({ selectedId, notice: null, ...(m ? { level: m.level } : {}) });
    },

    applySlot: (slot) => {
      const s = get();
      if (s.busy) return;
      const selected = s.modules.find((m) => m.id === s.selectedId);

      if (selected) {
        // Reposition the selected module.
        if (isLoaded(s.modules, selected)) return notify('Remove the module above first.');
        const moved: PlacedModule = { ...selected, x: slot.x, z: slot.z, level: slot.level, rot: slot.rot };
        if (!canPlace(s.modules, moved, selected.id)) return;
        set({ modules: s.modules.map((m) => (m.id === selected.id ? moved : m)), notice: null, touched: true });
        fly(moved, restPose(selected), restPose(moved), { seconds: 1.9, clearance: 3.6 });
        return;
      }

      if (s.modules.length >= MAX_MODULES) return notify(`This configurator holds up to ${MAX_MODULES} modules.`);
      const placed: PlacedModule = { id: nextId(), type: slot.type, x: slot.x, z: slot.z, rot: slot.rot, level: slot.level };
      if (!canPlace(s.modules, placed)) return;
      set({ modules: [...s.modules, placed], notice: null, touched: true });
      fly(placed, DOCK[placed.type], restPose(placed), { seconds: 2.4, clearance: 4.2 });
    },

    addRecommended: () => {
      const s = get();
      if (s.busy) return;
      const slots = validSlots(s.modules, s.tool, s.toolRot, s.level);
      const slot = recommendedSlot(slots, s.modules.filter((m) => m.level === s.level));
      if (!slot) return notify('No connection point is free on this level.');
      set({ selectedId: null });
      get().applySlot(slot);
    },

    rotate: () => {
      const s = get();
      if (s.busy) return;
      const selected = s.modules.find((m) => m.id === s.selectedId);
      if (!selected) {
        set({ toolRot: ((s.toolRot + 1) % 4) as Rot, notice: null });
        return;
      }
      if (isLoaded(s.modules, selected)) return notify('Remove the module above first.');
      const rot = ((selected.rot + 1) % 4) as Rot;
      // Try to keep the module on its own cells first, then pivot about either end.
      const [w, d] = footprint(selected.type, rot);
      const anchors: [number, number][] = [
        [selected.x, selected.z],
        [selected.x - (w - 1), selected.z],
        [selected.x, selected.z - (d - 1)],
        [selected.x + 1, selected.z],
        [selected.x, selected.z + 1],
      ];
      for (const [x, z] of anchors) {
        const turned: PlacedModule = { ...selected, rot, x, z };
        if (canPlace(s.modules, turned, selected.id)) {
          set({ modules: s.modules.map((m) => (m.id === selected.id ? turned : m)), notice: null, touched: true });
          fly(turned, restPose(selected), restPose(turned), { seconds: 1.5, clearance: 1.4 });
          return;
        }
      }
      notify('No clearance to rotate here.');
    },

    remove: () => {
      const s = get();
      if (s.busy) return;
      const selected = s.modules.find((m) => m.id === s.selectedId);
      if (!selected) return;
      if (isLoaded(s.modules, selected)) return notify('Remove the module above first.');
      set({ modules: s.modules.filter((m) => m.id !== selected.id), selectedId: null, notice: null });
      depart(selected);
    },

    reset: () => {
      const s = get();
      if (s.busy) return;
      const leaving = [...s.modules].sort((a, b) => b.level - a.level);
      set({ modules: [], selectedId: null, level: 0, toolRot: 0, notice: null, touched: false });
      leaving.forEach((m, i) => depart(m, i * 0.09, 1.2));
    },

    load: (preset) => {
      const s = get();
      if (s.busy) return;
      const leaving = [...s.modules];
      const next = centred(preset).map((m) => ({ ...m, id: nextId() }));
      set({ modules: next, selectedId: null, level: 0, notice: null, touched: true });
      leaving.forEach((m) => depart(m, 0, 1.0));
      [...next]
        .sort((a, b) => a.level - b.level)
        .forEach((m, i) => fly(m, DOCK[m.type], restPose(m), { seconds: 2.0, clearance: 4.2, delay: 0.3 + i * 0.35 }));
    },
  };
});

/** Slots shown for the current tool, or for moving the selected module. */
export function currentSlots(s: Pick<ConfigState, 'modules' | 'selectedId' | 'tool' | 'toolRot' | 'level'>): Slot[] {
  const selected = s.modules.find((m) => m.id === s.selectedId);
  if (selected) {
    if (isLoaded(s.modules, selected)) return [];
    return validSlots(s.modules, selected.type, selected.rot, s.level, selected.id).filter(
      (slot) => !(slot.x === selected.x && slot.z === selected.z && slot.level === selected.level),
    );
  }
  if (s.modules.length >= MAX_MODULES) return [];
  return validSlots(s.modules, s.tool, s.toolRot, s.level);
}

/** The configuration shown when the visitor reaches transport without placing anything. */
export const SAMPLE_CONFIGURATION: PlacedModule[] = centred([
  { type: 'extended', x: 0, z: 0, rot: 0, level: 0 },
  { type: 'extended', x: 0, z: 1, rot: 0, level: 0 },
]).map((m, i) => ({ ...m, id: `sample-${i + 1}` }));

/** What the journey chapter ships: the visitor's build, or the sample if the grid is empty. */
export const shippedModules = (modules: PlacedModule[]) => (modules.length ? modules : SAMPLE_CONFIGURATION);
