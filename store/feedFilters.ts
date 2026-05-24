import { create } from 'zustand'

type SortMode = 'for-you' | 'most-recent'

interface FeedFiltersState {
  sortMode: SortMode
  buildFilter: string    // build ID or '' for all
  buildTypeFilter: string // category ID or '' for all
  setSortMode: (mode: SortMode) => void
  setBuildFilter: (id: string) => void
  setBuildTypeFilter: (type: string) => void
}

export const useFeedFilters = create<FeedFiltersState>((set) => ({
  sortMode: 'most-recent',
  buildFilter: '',
  buildTypeFilter: '',
  setSortMode: (sortMode) => set({ sortMode }),
  setBuildFilter: (buildFilter) => set({ buildFilter }),
  setBuildTypeFilter: (buildTypeFilter) => set({ buildTypeFilter }),
}))
