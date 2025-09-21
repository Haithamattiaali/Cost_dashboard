// Period scope state management for Normal Mode and Comparison Mode
import { create } from 'zustand';

export type Quarter = 1 | 2 | 3 | 4;
export type NormalScope =
  | { kind: 'all'; year: number; quarters: Set<Quarter> }    // All available quarters for the year
  | { kind: 'single'; year: number; quarter: Quarter };      // Single quarter

export type ComparisonPeriod = {
  year: number;
  quarter: Quarter;
};

export type Mode = 'normal' | 'comparison';

export interface PeriodState {
  // Current mode
  mode: Mode;

  // Normal mode state
  normal: NormalScope;

  // Comparison mode state (existing)
  comparison: {
    p1: ComparisonPeriod | null;  // Period 1 (baseline)
    p2: ComparisonPeriod | null;  // Period 2 (comparison)
  };

  // Actions
  setNormalAll: (year: number, quarters: Set<Quarter>) => void;
  setNormalSingle: (year: number, quarter: Quarter) => void;
  setMode: (mode: Mode) => void;
  setComparisonPeriods: (p1: ComparisonPeriod | null, p2: ComparisonPeriod | null) => void;
}

export const usePeriodStore = create<PeriodState>((set, get) => ({
  mode: 'normal',

  normal: {
    kind: 'all',
    year: new Date().getFullYear(),
    quarters: new Set<Quarter>()  // Will be filled after data loads
  },

  comparison: {
    p1: null,
    p2: null
  },

  setNormalAll: (year: number, quarters: Set<Quarter>) => {
    set({ normal: { kind: 'all', year, quarters } });
  },

  setNormalSingle: (year: number, quarter: Quarter) => {
    set({ normal: { kind: 'single', year, quarter } });
  },

  setMode: (mode: Mode) => {
    set({ mode });
  },

  setComparisonPeriods: (p1: ComparisonPeriod | null, p2: ComparisonPeriod | null) => {
    set({ comparison: { p1, p2 } });
  }
}));