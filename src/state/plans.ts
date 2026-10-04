import { create } from 'zustand';
import { PLAN_GROUPS, type PlanGroup } from '../content/plans';

interface PlansState {
  area: PlanGroup['area'];
  option: number;
  setArea: (area: PlanGroup['area']) => void;
  setOption: (option: number) => void;
}

/** Selection in the catalogue-layouts section — read by both the plan sheet and the 3D view. */
export const usePlans = create<PlansState>((set) => ({
  area: 200,
  option: 1,
  setArea: (area) => set({ area, option: 1 }),
  setOption: (option) => set({ option }),
}));

export const groupFor = (area: PlanGroup['area']) => PLAN_GROUPS.find((g) => g.area === area) ?? PLAN_GROUPS[0];
