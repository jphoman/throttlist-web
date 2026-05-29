import { create } from 'zustand'

type SortMode = 'for-you' | 'most-recent'

interface FeedFiltersState {
  sortMode: SortMode
  buildFilter: string     // build ID or '' for all
  buildTypeFilter: string // category ID or '' for all
  scrollOffset: number    // saved FlatList scroll position
  setSortMode: (mode: SortMode) => void
  setBuildFilter: (id: string) => void
  setBuildTypeFilter: (type: string) => void
  setScrollOffset: (offset: number) => void
}

export const useFeedFilters = create<FeedFiltersState>((set) => ({
  sortMode: 'most-recent',
  buildFilter: '',
  buildTypeFilter: '',
  scrollOffset: 0,
  setSortMode: (sortMode) => set({ sortMode, scrollOffset: 0 }),
  setBuildFilter: (buildFilter) => set({ buildFilter, scrollOffset: 0 }),
  setBuildTypeFilter: (buildTypeFilter) => set({ buildTypeFilter, scrollOffset: 0 }),
  setScrollOffset: (scrollOffset) => set({ scrollOffset }),
}))
