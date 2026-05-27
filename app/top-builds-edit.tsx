import React, { useState, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  TextInput,
  Image,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Search, X, Plus } from '@/components/Icons'
import {
  fetchAllBuilds,
  fetchFollowedBuilds,
  fetchProfile,
  updateTopBuildIds,
} from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import { colors, formatFollowers } from '@/constants/throttlist'
import type { Build } from '@/types'

const MAX = 10

async function fetchEditorData(userId: string) {
  const [allBuilds, followedBuilds, profile] = await Promise.all([
    fetchAllBuilds(100),
    fetchFollowedBuilds(userId),
    fetchProfile(userId),
  ])
  const othersBuilds = allBuilds.filter(b => b.userId !== userId)
  const followedIds = new Set(followedBuilds.map(b => b.id))
  const initialIds: string[] = profile?.topBuildIds ?? []
  return { othersBuilds, followedIds, initialIds }
}

function BuildItem({
  build,
  selected,
  onAdd,
  onRemove,
}: {
  build: Build
  selected: boolean
  onAdd: () => void
  onRemove: () => void
}) {
  const label = build.nickname || `${build.year} ${build.make}`
  return (
    <View style={[styles.item, selected && styles.itemSelected]}>
      <View style={styles.itemThumb}>
        {build.coverPhotoUrl ? (
          <Image source={{ uri: build.coverPhotoUrl }} style={styles.thumbImg} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbImg, styles.thumbFallback]} />
        )}
        <View style={[styles.avatarRing, build.ownerIsPro ? styles.avatarPro : styles.avatarDefault]}>
          {build.avatarUrl ? (
            <Image source={{ uri: build.avatarUrl }} style={styles.avatarImg} />
          ) : (
            <Text style={styles.avatarLetter}>{(build.username || '?')[0].toUpperCase()}</Text>
          )}
        </View>
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{label}</Text>
        <Text style={styles.itemMeta} numberOfLines={1}>
          @{build.username} · {formatFollowers(build.followerCount)} followers
        </Text>
      </View>
      {selected ? (
        <Pressable style={styles.removeBtn} onPress={onRemove}>
          <X size={14} color="#fff" />
        </Pressable>
      ) : (
        <Pressable style={styles.addBtn} onPress={onAdd}>
          <Plus size={14} color={colors.accent} />
        </Pressable>
      )}
    </View>
  )
}

export default function TopBuildsEditScreen() {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''
  const queryClient = useQueryClient()
  const [query, setQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<string[] | null>(null)
  const [saving, setSaving] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['top-builds-edit', userId],
    queryFn: () => fetchEditorData(userId),
    enabled: !!userId,
  })

  // Initialise from fetched profile on first load
  const effectiveIds: string[] = selectedIds ?? data?.initialIds ?? []

  function add(id: string) {
    if (effectiveIds.length >= MAX) return
    setSelectedIds([...effectiveIds, id])
  }

  function remove(id: string) {
    setSelectedIds(effectiveIds.filter(x => x !== id))
  }

  async function save() {
    if (!userId) return
    setSaving(true)
    try {
      await updateTopBuildIds(userId, effectiveIds)
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
      queryClient.invalidateQueries({ queryKey: ['profile-by-username'] })
      queryClient.invalidateQueries({ queryKey: ['top-builds', userId] })
      router.back()
    } finally {
      setSaving(false)
    }
  }

  const q = query.trim().toLowerCase()
  const selectedSet = new Set(effectiveIds)

  // Build lookup map
  const buildMap = useMemo(() => {
    if (!data) return {} as Record<string, Build>
    return Object.fromEntries(data.othersBuilds.map(b => [b.id, b])) as Record<string, Build>
  }, [data])

  // Selected builds in order
  const selectedBuilds = effectiveIds.map(id => buildMap[id]).filter(Boolean) as Build[]

  // Suggested: followed first (by follower count), then top non-followed
  const suggestions = useMemo(() => {
    if (!data) return []
    const { othersBuilds, followedIds } = data
    const followed = othersBuilds
      .filter(b => followedIds.has(b.id) && !selectedSet.has(b.id))
      .sort((a, b) => b.followerCount - a.followerCount)
    const rest = othersBuilds
      .filter(b => !followedIds.has(b.id) && !selectedSet.has(b.id))
      .sort((a, b) => b.followerCount - a.followerCount)
    return [...followed, ...rest]
  }, [data, effectiveIds])

  // Search results
  const searchResults = useMemo(() => {
    if (!q || !data) return []
    return data.othersBuilds
      .filter(b => {
        const label = `${b.nickname ?? ''} ${b.year ?? ''} ${b.make ?? ''} ${b.model ?? ''} ${b.username ?? ''}`.toLowerCase()
        return label.includes(q)
      })
      .sort((a, b) => b.followerCount - a.followerCount)
  }, [q, data])

  const atMax = effectiveIds.length >= MAX

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Edit Top Builds</Text>
        <Pressable onPress={save} style={styles.saveBtn} disabled={saving}>
          <Text style={[styles.saveBtnText, saving && { opacity: 0.5 }]}>
            {saving ? 'Saving…' : 'Save'}
          </Text>
        </Pressable>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <View style={styles.searchBox}>
          <Search size={16} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search builds, makes, usernames…"
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

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Selected section */}
          {selectedBuilds.length > 0 && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>
                  SELECTED ({effectiveIds.length}/{MAX})
                </Text>
                {atMax && <Text style={styles.sectionNote}>Max reached</Text>}
              </View>
              {selectedBuilds.map(build => (
                <BuildItem
                  key={build.id}
                  build={build}
                  selected
                  onAdd={() => {}}
                  onRemove={() => remove(build.id)}
                />
              ))}
            </>
          )}

          {/* No query: show suggestions */}
          {!q && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>SUGGESTED</Text>
                {(data?.followedIds.size ?? 0) > 0 ? (
                  <Text style={styles.sectionNote}>Follows first</Text>
                ) : null}
              </View>
              {suggestions.length === 0 && (
                <Text style={styles.emptyNote}>No more builds to suggest.</Text>
              )}
              {suggestions.map(build => (
                <BuildItem
                  key={build.id}
                  build={build}
                  selected={false}
                  onAdd={() => add(build.id)}
                  onRemove={() => {}}
                />
              ))}
            </>
          )}

          {/* Query: show search results */}
          {!!q && (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>RESULTS ({searchResults.length})</Text>
              </View>
              {searchResults.length === 0 && (
                <Text style={styles.emptyNote}>No builds match "{query}".</Text>
              )}
              {searchResults.map(build => {
                const sel = selectedSet.has(build.id)
                return (
                  <BuildItem
                    key={build.id}
                    build={build}
                    selected={sel}
                    onAdd={() => add(build.id)}
                    onRemove={() => remove(build.id)}
                  />
                )
              })}
            </>
          )}

          <View style={{ height: 48 }} />
        </ScrollView>
      )}
    </View>
  )
}

const THUMB = 56

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
  saveBtn: { padding: 4, width: 44, alignItems: 'flex-end' },
  saveBtnText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    padding: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  sectionLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.7,
    textTransform: 'uppercase',
  },
  sectionNote: {
    color: colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  emptyNote: {
    color: colors.textTertiary,
    fontSize: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  itemSelected: {
    backgroundColor: colors.surface1,
  },
  itemThumb: {
    width: THUMB,
    height: THUMB,
    position: 'relative',
    flexShrink: 0,
  },
  thumbImg: {
    width: THUMB,
    height: THUMB,
    backgroundColor: colors.surface2,
  },
  thumbFallback: {
    backgroundColor: colors.surface2,
  },
  avatarRing: {
    position: 'absolute',
    bottom: -4,
    left: -4,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface2,
  },
  avatarPro: { borderColor: colors.accent },
  avatarDefault: { borderColor: 'rgba(255,255,255,0.75)' },
  avatarImg: { width: '100%', height: '100%' },
  avatarLetter: { color: '#fff', fontSize: 9, fontWeight: '700' },
  itemInfo: { flex: 1, minWidth: 0 },
  itemName: { color: colors.textPrimary, fontSize: 14, fontWeight: '700' },
  itemMeta: { color: colors.textTertiary, fontSize: 12, marginTop: 2 },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
})
