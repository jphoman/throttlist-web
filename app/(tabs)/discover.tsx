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
  Dimensions,
} from 'react-native'
import Svg, { Path as SvgPath } from 'react-native-svg'
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Search, MessageCircle, Heart, TrendingUp } from '@/components/Icons'
import { fetchAllBuilds, fetchAllProfiles, fetchFeed } from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import { colors, formatFollowers } from '@/constants/throttlist'
import InitialsAvatar from '@/components/InitialsAvatar'
import type { Post } from '@/types'

const SCREEN_WIDTH = Dimensions.get('window').width
const GRID_GAP = 2
const GRID_ITEM_SIZE = (SCREEN_WIDTH - GRID_GAP * 2) / 3
const BUILD_SCROLL_SIZE = Math.round(SCREEN_WIDTH * 0.42)

type PostSort = 'trending' | 'recent' | 'discussed'

const SORT_OPTIONS: { key: PostSort; label: string }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'recent', label: 'Recent' },
  { key: 'discussed', label: 'Most Discussed' },
]

const TAGS = [
  { name: 'cafe-racer', buildCount: 87 },
  { name: 'scrambler', buildCount: 62 },
  { name: 'yamaha', buildCount: 143 },
  { name: 'xsr700', buildCount: 28 },
  { name: 'xsr900', buildCount: 44 },
  { name: 'bmw', buildCount: 119 },
  { name: 'ninet', buildCount: 74 },
  { name: 'triumph', buildCount: 91 },
  { name: 'honda', buildCount: 134 },
  { name: 'indian', buildCount: 58 },
  { name: 'tracker', buildCount: 41 },
  { name: 'adventure', buildCount: 98 },
]

export default function DiscoverScreen() {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''

  const [query, setQuery] = useState('')
  const [postSort, setPostSort] = useState<PostSort>('trending')

  const { data: builds = [] } = useQuery({
    queryKey: ['discover-builds'],
    queryFn: () => fetchAllBuilds(20),
  })

  const { data: recommendedUsers = [] } = useQuery({
    queryKey: ['discover-users', userId],
    queryFn: () => fetchAllProfiles(10, userId || undefined),
  })

  const { data: posts = [] } = useQuery({
    queryKey: ['discover-posts'],
    queryFn: () => fetchFeed(30, 0),
  })

  const q = query.trim().toLowerCase()
  const isSearching = q.length > 0

  const filteredBuilds = useMemo(() => {
    if (!q) return builds
    return builds.filter(b =>
      b.nickname?.toLowerCase().includes(q) ||
      b.make?.toLowerCase().includes(q) ||
      b.model?.toLowerCase().includes(q) ||
      b.username?.toLowerCase().includes(q),
    )
  }, [builds, q])

  const filteredTags = useMemo(() => {
    if (!q) return TAGS
    return TAGS.filter(t => t.name.toLowerCase().includes(q))
  }, [q])

  const filteredPosts = useMemo(() => {
    let result = q
      ? posts.filter(p =>
          p.username?.toLowerCase().includes(q) ||
          p.buildNickname?.toLowerCase().includes(q),
        )
      : [...posts]

    if (postSort === 'trending') result.sort((a, b) => b.likeCount - a.likeCount)
    else if (postSort === 'recent') result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    else if (postSort === 'discussed') result.sort((a, b) => b.commentCount - a.commentCount)

    return result
  }, [posts, q, postSort])

  return (
    <View style={styles.container}>

      {/* Search bar */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Search size={16} color={colors.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search builds, makes, riders…"
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            returnKeyType="search"
            clearButtonMode="while-editing"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
      </View>

      <ScrollView
        stickyHeaderIndices={[1]}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >

        {/* [0] Collapses on scroll */}
        <View>
          {/* Recommended users */}
          {!isSearching && recommendedUsers.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.usersRow}
            >
              {recommendedUsers.map(user => (
                <Pressable
                  key={user.id}
                  style={styles.userItem}
                  onPress={() => router.push(`/user/${user.username}`)}
                >
                  <InitialsAvatar name={user.displayName} photoUrl={user.avatarUrl} size={58} />
                  <Text style={styles.userHandle} numberOfLines={1}>@{user.username}</Text>
                </Pressable>
              ))}
            </ScrollView>
          )}

          {/* Trending builds */}
          {filteredBuilds.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.buildsRow}
            >
              {filteredBuilds.map(build => {
                const pc = build.partCount ?? 0
                return (
                  <Pressable
                    key={build.id}
                    style={styles.buildItem}
                    onPress={() => {
                      if (build.username && build.slug) {
                        router.push(`/build/${build.username}/${build.slug}`)
                      }
                    }}
                  >
                    {build.coverPhotoUrl ? (
                      <Image source={{ uri: build.coverPhotoUrl }} style={styles.buildPhoto} resizeMode="cover" />
                    ) : (
                      <View style={[styles.buildPhoto, styles.fallback]} />
                    )}
                    {pc > 0 ? (
                      <View style={styles.buildTagBadge} pointerEvents="none">
                        <Svg width={48} height={20} viewBox="0 0 48 20">
                          <SvgPath
                            d="M 14 0 L 44 0 Q 48 0 48 4 L 48 16 Q 48 20 44 20 L 14 20 C 9 20 3 13 3 10 C 3 7 9 0 14 0 Z M 13 10 m -2.5 0 a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0"
                            fill={colors.accent}
                            fillRule="evenodd"
                          />
                        </Svg>
                        <Text style={styles.buildTagBadgeText}>{pc}</Text>
                      </View>
                    ) : (
                      <View style={styles.trendingBadge} pointerEvents="none">
                        <TrendingUp size={11} color="#fff" />
                      </View>
                    )}
                    <View style={styles.buildOverlay} pointerEvents="none">
                      <Text style={styles.buildLabel} numberOfLines={1}>
                        {build.nickname || build.model}
                      </Text>
                    </View>
                  </Pressable>
                )
              })}
            </ScrollView>
          )}

          {/* Tags */}
          {filteredTags.length > 0 && (
            <View style={styles.tagsWrap}>
              {filteredTags.map(tag => (
                <Pressable key={tag.name} style={styles.tagPill}>
                  <Text style={styles.tagPillName}>#{tag.name}</Text>
                  <Text style={styles.tagPillCount}>{tag.buildCount}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* [1] Sticky sort bar */}
        <View style={styles.sortBarSticky}>
          {SORT_OPTIONS.map(opt => (
            <Pressable
              key={opt.key}
              style={[styles.sortBtn, postSort === opt.key && styles.sortBtnActive]}
              onPress={() => setPostSort(opt.key)}
            >
              <Text style={[styles.sortBtnText, postSort === opt.key && styles.sortBtnTextActive]}>
                {opt.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* [2] Posts grid */}
        <View style={styles.photoGrid}>
          {filteredPosts.map(post => {
            const photos: string[] = (() => { try { return JSON.parse(post.photos) } catch { return [] } })()
            const thumb = photos[0]
            const tagCount: number = (() => { try { return (JSON.parse(post.taggedPartIds) as string[]).length } catch { return 0 } })()
            return (
              <Pressable
                key={post.id}
                style={styles.gridItem}
                onPress={() => router.push(`/post/${post.id}`)}
              >
                {thumb ? (
                  <Image source={{ uri: thumb }} style={styles.gridPhoto} resizeMode="cover" />
                ) : (
                  <View style={[styles.gridPhoto, styles.fallback]} />
                )}
                {tagCount > 0 && (
                  <View style={styles.gridTagBadge} pointerEvents="none">
                    <Svg width={38} height={16} viewBox="0 0 48 20">
                      <SvgPath
                        d="M 14 0 L 44 0 Q 48 0 48 4 L 48 16 Q 48 20 44 20 L 14 20 C 9 20 3 13 3 10 C 3 7 9 0 14 0 Z M 13 10 m -2.5 0 a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0"
                        fill={colors.accent}
                        fillRule="evenodd"
                      />
                    </Svg>
                    <Text style={styles.gridTagBadgeText}>{tagCount}</Text>
                  </View>
                )}
                <View style={styles.gridOverlay} pointerEvents="none">
                  <View style={styles.gridStat}>
                    <Heart size={11} color="#fff" />
                    <Text style={styles.gridStatText}>{formatFollowers(post.likeCount)}</Text>
                  </View>
                  <View style={styles.gridStat}>
                    <MessageCircle size={11} color="#fff" />
                    <Text style={styles.gridStatText}>{post.commentCount}</Text>
                  </View>
                </View>
              </Pressable>
            )
          })}

          {isSearching && filteredPosts.length === 0 && (
            <View style={styles.noResults}>
              <Text style={styles.noResultsText}>No results for "{query}"</Text>
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 12,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.surface2,
  },
  searchInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    padding: 0,
    margin: 0,
  },
  scroll: {},
  usersRow: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 20,
    flexDirection: 'row',
  },
  userItem: {
    alignItems: 'center',
    gap: 6,
    width: 68,
  },
  userHandle: {
    color: colors.textSecondary,
    fontSize: 11,
    textAlign: 'center',
    width: 68,
  },
  buildsRow: {
    paddingLeft: 16,
    paddingRight: 8,
    paddingBottom: 4,
    gap: 8,
    flexDirection: 'row',
  },
  buildItem: {
    width: BUILD_SCROLL_SIZE,
    height: BUILD_SCROLL_SIZE,
    borderRadius: 10,
    overflow: 'hidden',
    position: 'relative',
  },
  buildPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface2,
  },
  trendingBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    padding: 4,
  },
  buildTagBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 48,
    height: 20,
  },
  buildTagBadgeText: {
    position: 'absolute',
    left: 17,
    right: 2,
    top: 0,
    bottom: 0,
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 20,
  },
  gridTagBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 38,
    height: 16,
  },
  gridTagBadgeText: {
    position: 'absolute',
    left: 13,
    right: 1,
    top: 0,
    bottom: 0,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 16,
  },
  buildOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  buildLabel: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.surface2,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  tagPillName: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
  },
  tagPillCount: {
    color: colors.textTertiary,
    fontSize: 10,
  },
  sortBarSticky: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sortBtn: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.surface2,
  },
  sortBtnActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  sortBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  sortBtnTextActive: {
    color: '#fff',
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: GRID_GAP,
  },
  gridItem: {
    width: GRID_ITEM_SIZE,
    height: GRID_ITEM_SIZE,
    position: 'relative',
  },
  gridPhoto: {
    width: '100%',
    height: '100%',
    backgroundColor: colors.surface2,
  },
  fallback: {
    backgroundColor: '#1C1C1C',
  },
  gridOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 6,
    paddingVertical: 5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 6,
  },
  gridStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  gridStatText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  noResults: {
    width: SCREEN_WIDTH,
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
})
