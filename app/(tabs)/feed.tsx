import React, { useState, useCallback, useRef, useMemo, useEffect } from 'react'
import {
  View,
  StyleSheet,
  Animated,
  Pressable,
  Text,
  Platform,
  RefreshControl,
  Modal,
  TouchableWithoutFeedback,
  TextInput,
  ScrollView,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Bell, Compass, ChevronDown, X as XIcon } from '@/components/Icons'
import { ThrottlistIcon } from '@/components/ThrottlistLogo'
import { fetchFeed as fetchFeedFromSupabase, fetchFollowedFeed, fetchFollowedBuilds } from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import { colors } from '@/constants/throttlist'
import { BUILD_CATEGORIES } from '@/constants/buildTypes'
import { useFeedFilters } from '@/store/feedFilters'
import PostCard from '@/components/PostCard'
import type { Part } from '@/types'

const HEADER_HEIGHT = Platform.OS === 'ios' ? 62 : 50
const SORT_HEADER_HEIGHT = 36
const COMBINED_HEADER_HEIGHT = HEADER_HEIGHT + SORT_HEADER_HEIGHT


export default function FeedScreen() {
  const queryClient = useQueryClient()
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''

  const [refreshing, setRefreshing] = useState(false)
  const [typePickerOpen, setTypePickerOpen] = useState(false)
  const [typeSearch, setTypeSearch] = useState('')
  const [buildPickerOpen, setBuildPickerOpen] = useState(false)
  const [buildSearch, setBuildSearch] = useState('')
  const scrollY = useRef(new Animated.Value(0)).current

  // Persistent filter state — survives navigation via Zustand
  const { sortMode, buildFilter, buildTypeFilter, setSortMode, setBuildFilter, setBuildTypeFilter } = useFeedFilters()

  // Normalize: if the stored value isn't a known category, treat as unset (no flash)
  const effectiveTypeFilter = BUILD_CATEGORIES.some(c => c.id === buildTypeFilter) ? buildTypeFilter : ''

  // Keep the store clean — clear any stale/unknown value after render
  useEffect(() => {
    if (buildTypeFilter !== effectiveTypeFilter) {
      setBuildTypeFilter('')
    }
  }, [buildTypeFilter, effectiveTypeFilter, setBuildTypeFilter])

  const { data: posts = [], isLoading: postsLoading } = useQuery({
    queryKey: ['feed-posts', sortMode, userId],
    queryFn: () =>
      sortMode === 'for-you' && userId
        ? fetchFollowedFeed(userId, 40)
        : fetchFeedFromSupabase(40, 0, userId || undefined),
    enabled: sortMode === 'most-recent' || !!userId,
  })

  const { data: myBuilds = [] } = useQuery({
    queryKey: ['followed-builds-list', userId],
    queryFn: () => fetchFollowedBuilds(userId),
    enabled: !!userId,
  })

  const onRefresh = useCallback(async () => {
    setRefreshing(true)
    await queryClient.invalidateQueries({ queryKey: ['feed-posts', sortMode, userId] })
    setRefreshing(false)
  }, [queryClient, sortMode, userId])

  const filteredBuilds = useMemo(() => {
    const q = buildSearch.toLowerCase()
    return myBuilds.filter(b =>
      !q ||
      (b.nickname ?? '').toLowerCase().includes(q) ||
      b.make.toLowerCase().includes(q) ||
      b.model.toLowerCase().includes(q)
    ).slice(0, 10)
  }, [myBuilds, buildSearch])

  // Derive available categories from posts currently in the feed
  const availableCategories = useMemo(() => {
    const typesInFeed = new Set(posts.map(p => p.buildType).filter(Boolean))
    return BUILD_CATEGORIES.filter(c => typesInFeed.has(c.id))
  }, [posts])

  const displayedPosts = useMemo(() => {
    let result = [...posts]
    if (buildFilter) result = result.filter(p => p.buildId === buildFilter)
    if (effectiveTypeFilter) result = result.filter(p => p.buildType === effectiveTypeFilter)
    if (sortMode === 'most-recent') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }
    return result
  }, [posts, sortMode, effectiveTypeFilter, buildFilter])

  const headerTranslate = scrollY.interpolate({
    inputRange: [0, 70],
    outputRange: [0, -COMBINED_HEADER_HEIGHT],
    extrapolate: 'clamp',
  })
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 50],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  })

  const selectedTypeDef = BUILD_CATEGORIES.find(t => t.id === effectiveTypeFilter)
  const isTypeFiltered = !!effectiveTypeFilter
  const selectedBuildDef = myBuilds.find(b => b.id === buildFilter)
  const isBuildFiltered = !!buildFilter

  const filteredTypes = useMemo(() => {
    const q = typeSearch.toLowerCase()
    return availableCategories.filter(t => !q || t.label.toLowerCase().includes(q))
  }, [typeSearch, availableCategories])

  function renderEmptyState() {
    const isForYouEmpty = sortMode === 'for-you' && !isTypeFiltered && !isBuildFiltered
    return (
      <View style={styles.emptyState}>
        <Compass size={48} color={colors.textTertiary} />
        <Text style={styles.emptyTitle}>
          {isForYouEmpty
            ? 'Follow some builds'
            : isTypeFiltered
            ? `No ${selectedTypeDef?.label ?? ''} posts yet`
            : 'No posts yet'}
        </Text>
        <Text style={styles.emptyBody}>
          {isForYouEmpty
            ? 'Tap Follow on any build to see their posts here'
            : isTypeFiltered
            ? 'Try a different build type or check back later'
            : 'Be the first — tap + to share your build'}
        </Text>
        {isForYouEmpty && (
          <Pressable style={styles.discoverBtn} onPress={() => router.push('/discover')}>
            <Text style={styles.discoverBtnText}>Discover builds</Text>
          </Pressable>
        )}
        {!isTypeFiltered && !isForYouEmpty && (
          <Pressable style={styles.discoverBtn} onPress={() => router.push('/capture')}>
            <Text style={styles.discoverBtnText}>Create a post</Text>
          </Pressable>
        )}
      </View>
    )
  }

  function renderSkeleton() {
    return Array.from({ length: 3 }).map((_, i) => (
      <View key={i} style={styles.skeletonCard}>
        <View style={styles.skeletonHeader}>
          <View style={styles.skeletonAvatar} />
          <View style={styles.skeletonHeaderInfo}>
            <View style={[styles.skeletonLine, { width: 100 }]} />
            <View style={[styles.skeletonLine, { width: 140, marginTop: 6 }]} />
          </View>
        </View>
        <View style={styles.skeletonPhoto} />
        <View style={styles.skeletonFooter}>
          <View style={[styles.skeletonLine, { width: '80%' }]} />
          <View style={[styles.skeletonLine, { width: '60%', marginTop: 8 }]} />
        </View>
      </View>
    ))
  }

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.headersWrap,
          { opacity: headerOpacity, transform: [{ translateY: headerTranslate }] },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.mainHeader} pointerEvents="box-none">
          <View style={styles.headerInner} pointerEvents="box-none">
            <View style={styles.headerSpacer} />
            <ThrottlistIcon size={60} color={colors.accent} />
            <Pressable style={styles.bellBtn} onPress={() => router.push('/alerts')}>
              <Bell size={22} color={colors.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={styles.sortHeader} pointerEvents="box-none">
          <Pressable
            style={[styles.sortPill, sortMode === 'for-you' && styles.sortPillActive]}
            onPress={() => setSortMode('for-you')}
          >
            <Text style={[styles.sortPillText, sortMode === 'for-you' && styles.sortPillTextActive]}>
              For You
            </Text>
          </Pressable>
          <Pressable
            style={[styles.sortPill, sortMode === 'most-recent' && styles.sortPillActive]}
            onPress={() => setSortMode('most-recent')}
          >
            <Text style={[styles.sortPillText, sortMode === 'most-recent' && styles.sortPillTextActive]}>
              Most Recent
            </Text>
          </Pressable>
          {myBuilds.length > 0 && (
            <Pressable
              style={[styles.sortPill, isBuildFiltered && styles.sortPillActive]}
              onPress={() => isBuildFiltered ? setBuildFilter('') : setBuildPickerOpen(true)}
            >
              <Text style={[styles.sortPillText, isBuildFiltered && styles.sortPillTextActive]}>
                {isBuildFiltered ? (selectedBuildDef?.nickname || selectedBuildDef?.model || 'Build') : 'Builds'}
              </Text>
              {isBuildFiltered
                ? <XIcon size={11} color="#fff" />
                : <ChevronDown size={11} color={colors.textTertiary} />}
            </Pressable>
          )}
          {availableCategories.length > 0 && (
            <Pressable
              style={[styles.sortPill, isTypeFiltered && styles.sortPillActive]}
              onPress={() => effectiveTypeFilter ? setBuildTypeFilter('') : setTypePickerOpen(true)}
            >
              <Text style={[styles.sortPillText, isTypeFiltered && styles.sortPillTextActive]}>
                {isTypeFiltered
                  ? `${selectedTypeDef?.icon ?? ''} ${selectedTypeDef?.label ?? 'Build Type'}`.trim()
                  : 'Build Type'}
              </Text>
              {isTypeFiltered
                ? <XIcon size={11} color="#fff" />
                : <ChevronDown size={11} color={colors.textTertiary} />}
            </Pressable>
          )}
        </View>
      </Animated.View>

      {/* Build type picker */}
      <Modal
        visible={typePickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => { setTypePickerOpen(false); setTypeSearch('') }}
      >
        <TouchableWithoutFeedback onPress={() => { setTypePickerOpen(false); setTypeSearch('') }}>
          <View style={styles.pickerBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerMenu}>
                <Text style={styles.pickerTitle}>BUILD TYPE</Text>
                <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
                  {effectiveTypeFilter && (
                    <Pressable
                      style={styles.pickerRow}
                      onPress={() => { setBuildTypeFilter(''); setTypePickerOpen(false); setTypeSearch('') }}
                    >
                      <Text style={[styles.pickerRowText, { color: colors.textTertiary }]}>All Types</Text>
                    </Pressable>
                  )}
                  {filteredTypes.map(type => (
                    <Pressable
                      key={type.id}
                      style={[styles.pickerRow, effectiveTypeFilter === type.id && styles.pickerRowActive]}
                      onPress={() => { setBuildTypeFilter(type.id); setTypePickerOpen(false); setTypeSearch('') }}
                    >
                      <Text style={[styles.pickerRowText, effectiveTypeFilter === type.id && styles.pickerRowTextActive]}>
                        {type.icon}{'  '}{type.label}
                      </Text>
                      {effectiveTypeFilter === type.id && <Text style={styles.pickerCheck}>✓</Text>}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* My builds picker */}
      <Modal
        visible={buildPickerOpen}
        transparent
        animationType="fade"
        onRequestClose={() => { setBuildPickerOpen(false); setBuildSearch('') }}
      >
        <TouchableWithoutFeedback onPress={() => { setBuildPickerOpen(false); setBuildSearch('') }}>
          <View style={styles.pickerBackdrop}>
            <TouchableWithoutFeedback>
              <View style={styles.pickerMenu}>
                <Text style={styles.pickerTitle}>BUILDS I FOLLOW</Text>
                <TextInput
                  style={styles.pickerSearch}
                  placeholder="Search builds…"
                  placeholderTextColor={colors.textTertiary}
                  value={buildSearch}
                  onChangeText={setBuildSearch}
                  autoCorrect={false}
                />
                <ScrollView bounces={false} keyboardShouldPersistTaps="handled">
                  {buildFilter && (
                    <Pressable
                      style={styles.pickerRow}
                      onPress={() => { setBuildFilter(''); setBuildPickerOpen(false); setBuildSearch('') }}
                    >
                      <Text style={[styles.pickerRowText, { color: colors.textTertiary }]}>All Builds</Text>
                    </Pressable>
                  )}
                  {filteredBuilds.map(build => (
                    <Pressable
                      key={build.id}
                      style={[styles.pickerRow, buildFilter === build.id && styles.pickerRowActive]}
                      onPress={() => { setBuildFilter(build.id); setBuildPickerOpen(false); setBuildSearch('') }}
                    >
                      <View style={styles.buildPickerRowInner}>
                        <Text style={[styles.pickerRowText, buildFilter === build.id && styles.pickerRowTextActive]}>
                          {build.nickname || build.model}
                        </Text>
                        <Text style={styles.buildPickerSub}>{build.year} {build.make} {build.model}</Text>
                      </View>
                      {buildFilter === build.id && <Text style={styles.pickerCheck}>✓</Text>}
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {postsLoading ? (
        <View style={[styles.skeletonWrap, { paddingTop: COMBINED_HEADER_HEIGHT }]}>
          {renderSkeleton()}
        </View>
      ) : (
        <Animated.FlatList
          data={displayedPosts}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <PostCard
              post={item}
              parts={[]}
              onBuildPress={() => {
                if (item.username && item.buildSlug) {
                  router.push(`/build/${item.username}/${item.buildSlug}`)
                }
              }}
            />
          )}
          ListEmptyComponent={renderEmptyState()}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false },
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
              progressViewOffset={COMBINED_HEADER_HEIGHT}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            displayedPosts.length === 0
              ? [styles.emptyContainer, { paddingTop: COMBINED_HEADER_HEIGHT }]
              : { paddingTop: COMBINED_HEADER_HEIGHT }
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  headersWrap: { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: colors.bg },
  mainHeader: { height: HEADER_HEIGHT },
  headerInner: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 },
  headerSpacer: { width: 30 },
  bellBtn: { padding: 4, width: 30, alignItems: 'center' },
  sortHeader: {
    height: SORT_HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 7,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface1,
  },
  sortPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  sortPillText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  sortPillTextActive: { color: '#fff' },
  pickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: COMBINED_HEADER_HEIGHT + 8,
    paddingRight: 14,
  },
  pickerMenu: {
    backgroundColor: colors.surface1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    minWidth: 180,
    maxHeight: 300,
    overflow: 'hidden',
  },
  pickerTitle: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.7,
    color: colors.textTertiary,
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 6,
  },
  pickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  pickerRowActive: { backgroundColor: colors.surface2 },
  pickerRowText: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  pickerRowTextActive: { color: colors.accent, fontWeight: '700' },
  pickerCheck: { fontSize: 14, color: colors.accent, fontWeight: '700' },
  pickerSearch: {
    fontSize: 13,
    color: colors.textPrimary,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  buildPickerRowInner: { flex: 1 },
  buildPickerSub: { fontSize: 11, color: colors.textTertiary, marginTop: 2 },
  emptyContainer: { flex: 1 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32, paddingVertical: 60 },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: '700', marginTop: 16, marginBottom: 8 },
  emptyBody: { color: colors.textSecondary, fontSize: 14, textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  discoverBtn: { backgroundColor: colors.accent, borderRadius: 8, paddingHorizontal: 24, paddingVertical: 12 },
  discoverBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  skeletonWrap: {},
  skeletonCard: { backgroundColor: colors.surface1, marginBottom: 8, borderBottomWidth: 1, borderBottomColor: colors.border },
  skeletonHeader: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 10 },
  skeletonAvatar: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.surface3 },
  skeletonHeaderInfo: { flex: 1 },
  skeletonLine: { height: 12, borderRadius: 6, backgroundColor: colors.surface3 },
  skeletonPhoto: { width: '100%', height: 300, backgroundColor: colors.surface2 },
  skeletonFooter: { padding: 16, gap: 8 },
})
