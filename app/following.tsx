import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  Dimensions,
} from 'react-native'
import { router } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Search, X } from '@/components/Icons'
import { fetchFollowedBuilds, fetchAllBuilds, toggleBuildFollow, fetchFollowedBuildIds } from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import { colors } from '@/constants/throttlist'
import BuildTile from '@/components/BuildTile'
import type { Build } from '@/types'

const SCREEN_W = Dimensions.get('window').width
const TILE_SIZE = Math.floor(SCREEN_W / 3)

export default function FollowingScreen() {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [localFollowedIds, setLocalFollowedIds] = useState<Set<string> | null>(null)

  const { data: followedBuilds = [], isLoading: loadingFollowed } = useQuery({
    queryKey: ['followed-builds', userId],
    queryFn: () => fetchFollowedBuilds(userId),
    enabled: !!userId,
  })

  const { data: allBuilds = [], isLoading: loadingAll } = useQuery({
    queryKey: ['all-builds-discover'],
    queryFn: () => fetchAllBuilds(50),
    enabled: !!query.trim(),
  })

  const { data: followedIdSet } = useQuery({
    queryKey: ['followed-build-ids', userId],
    queryFn: () => fetchFollowedBuildIds(userId),
    enabled: !!userId,
  })

  const isLoading = loadingFollowed

  const followedIds: Set<string> = useMemo(() => {
    if (localFollowedIds !== null) return localFollowedIds
    return followedIdSet ?? new Set(followedBuilds.map(b => b.id))
  }, [localFollowedIds, followedBuilds, followedIdSet])

  async function handleToggleFollow(buildId: string) {
    const currently = followedIds.has(buildId)
    // Optimistic
    setLocalFollowedIds(prev => {
      const base = prev ?? new Set(followedIds)
      const next = new Set(base)
      if (next.has(buildId)) next.delete(buildId)
      else next.add(buildId)
      return next
    })
    try {
      await toggleBuildFollow(userId, buildId, currently)
      queryClient.invalidateQueries({ queryKey: ['followed-builds', userId] })
      queryClient.invalidateQueries({ queryKey: ['followed-build-ids', userId] })
    } catch {
      // rollback
      setLocalFollowedIds(prev => {
        const base = prev ?? new Set(followedIds)
        const next = new Set(base)
        if (currently) next.add(buildId)
        else next.delete(buildId)
        return next
      })
    }
  }

  const q = query.trim().toLowerCase()

  const currentFollowed: Build[] = useMemo(
    () => followedBuilds.filter(b => followedIds.has(b.id)),
    [followedBuilds, followedIds],
  )

  const filteredFollowed: Build[] = useMemo(() => {
    if (!q) return currentFollowed
    return currentFollowed.filter(
      b =>
        b.nickname?.toLowerCase().includes(q) ||
        b.make?.toLowerCase().includes(q) ||
        b.model?.toLowerCase().includes(q),
    )
  }, [currentFollowed, q])

  const discoverBuilds: Build[] = useMemo(() => {
    if (!q) return []
    const unfollowed = allBuilds.filter(b => !followedIds.has(b.id) && b.userId !== userId)
    const matched = unfollowed.filter(
      b =>
        b.nickname?.toLowerCase().includes(q) ||
        b.make?.toLowerCase().includes(q) ||
        b.model?.toLowerCase().includes(q),
    )
    return matched.sort((a, b) => b.followerCount - a.followerCount).slice(0, 10)
  }, [allBuilds, followedIds, q, userId])

  const showDiscover = discoverBuilds.length > 0
  const showFollowed = filteredFollowed.length > 0
  const showEmpty = !isLoading && !showFollowed && !showDiscover

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Following</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search builds..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query.length > 0 && (
            <Pressable onPress={() => setQuery('')}>
              <X size={14} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Loading…</Text>
          </View>
        ) : showEmpty ? (
          <View style={styles.empty}>
            {q ? (
              <>
                <Text style={styles.emptyText}>No results for "{query}"</Text>
                <Text style={styles.emptySubText}>Try a different make, model, or build name.</Text>
              </>
            ) : (
              <>
                <Text style={styles.emptyText}>You're not following any builds yet.</Text>
                <Text style={styles.emptySubText}>Search above to find builds to follow.</Text>
              </>
            )}
          </View>
        ) : !q ? (
          <View style={styles.grid}>
            {currentFollowed.map(build => (
              <BuildTile
                key={build.id}
                build={build}
                size={TILE_SIZE}
                onPress={() => router.push(`/build/${build.username ?? ''}/${build.slug}`)}
              />
            ))}
          </View>
        ) : (
          <View style={styles.sections}>
            {showFollowed && (
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>
                  FOLLOWING ({filteredFollowed.length})
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tileRow}
                >
                  {filteredFollowed.map(build => (
                    <BuildTile
                      key={build.id}
                      build={build}
                      size={120}
                      onPress={() => router.push(`/build/${build.username ?? ''}/${build.slug}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}

            {showDiscover && (
              <View style={[styles.section, showFollowed && styles.sectionGap]}>
                <Text style={styles.sectionLabel}>DISCOVER</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tileRow}
                >
                  {discoverBuilds.map(build => (
                    <BuildTile
                      key={build.id}
                      build={build}
                      size={120}
                      isFollowing={followedIds.has(build.id)}
                      onFollow={() => handleToggleFollow(build.id)}
                      onPress={() => router.push(`/build/${build.username ?? ''}/${build.slug}`)}
                    />
                  ))}
                </ScrollView>
              </View>
            )}
          </View>
        )}
        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  backBtn: { padding: 4, width: 44 },
  searchWrap: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.surface2,
  },
  searchInput: { flex: 1, color: colors.textPrimary, fontSize: 14, padding: 0 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  sections: { padding: 16 },
  section: {},
  sectionGap: { marginTop: 24 },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  tileRow: { gap: 0, flexDirection: 'row' },
  empty: { padding: 48, alignItems: 'center', gap: 8 },
  emptyText: { color: colors.textSecondary, fontSize: 15, textAlign: 'center' },
  emptySubText: { color: colors.textTertiary, fontSize: 13, textAlign: 'center' },
})
