import { create } from 'zustand'
import type { FilterState } from './types'

interface FilterStore extends FilterState {
  setFilter: (update: Partial<FilterState>) => void
  reset: () => void
}

const DEFAULT: FilterState = {
  categories: [],
  dateRange: 'all',
  isFree: null,
  tags: [],
  search: '',
}

export const useFilterStore = create<FilterStore>((set) => ({
  ...DEFAULT,
  setFilter: (update) => set((state) => ({ ...state, ...update })),
  reset: () => set(DEFAULT),
}))
