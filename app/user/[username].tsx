import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Linking,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Instagram, Youtube, ProBadge } from '@/components/Icons'
import {
  fetchProfileByUsername,
  fetchUserBuilds,
  fetchFollowingCount,
  fetchFollowedBuildIds,
  fetchCreatorFollowerCount,
  fetchBuildsByIds,
  toggleBuildFollow,
} from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import { colors, formatFollowers } from '@/constants/throttlist'
import BuildCard from '@/components/BuildCard'
import FollowUserModal from '@/components/FollowUserModal'

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>()
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''
  const queryClient = useQueryClient()

  const [modalOpen, setModalOpen] = useState(false)

  const { data: user, isLoading } = useQuery({
    queryKey: ['profile-by-username', username],
    queryFn: () => fetchProfileByUsername(username!),
    enabled: !!username,
  })

  const { data: builds = [] } = useQuery({
    queryKey: ['user-builds', user?.id],
    queryFn: () => fetchUserBuilds(user!.id),
    enabled: !!user?.id,
  })

  const { data: followingCount = 0 } = useQuery({
    queryKey: ['following-count', user?.id],
    queryFn: () => fetchFollowingCount(user!.id),
    enabled: !!user?.id,
  })

  // Unique follower count: number of distinct users following any of their builds
  const { data: followerCount = 0 } = useQuery({
    queryKey: ['creator-followers', user?.id],
    queryFn: () => fetchCreatorFollowerCount(user!.id),
    enabled: !!user?.id,
  })

  const { data: followedBuildIds = new Set<string>() } = useQuery({
    queryKey: ['followed-builds', userId],
    queryFn: () => fetchFollowedBuildIds(userId),
    enabled: !!userId,
  })

  const { data: topBuilds = [] } = useQuery({
    queryKey: ['top-builds', user?.id],
    queryFn: () => fetchBuildsByIds(user!.topBuildIds ?? []),
    enabled: !!user?.id && (user.topBuildIds?.length ?? 0) > 0,
  })

  // ── Per-build follow (from BuildCard tap) ─────────────────────────────────
  async function handleFollowBuild(buildId: string) {
    if (!userId) return
    const wasFollowing = followedBuildIds.has(buildId)

    const prevFollowedIds = queryClient.getQueryData<Set<string>>(['followed-builds', userId])
    const prevBuilds     = queryClient.getQueryData<typeof builds>(['user-builds', user?.id])
    const prevCount      = queryClient.getQueryData<number>(['following-count', userId])
    const prevFollowers  = queryClient.getQueryData<number>(['creator-followers', user?.id])

    // Optimistic updates
    queryClient.setQueryData<Set<string>>(['followed-builds', userId], (old = new Set()) => {
      const next = new Set(old); wasFollowing ? next.delete(buildId) : next.add(buildId); return next
    })
    queryClient.setQueryData<typeof builds>(['user-builds', user?.id], (old = []) =>
      old.map(b => b.id === buildId
        ? { ...b, followerCount: Math.max(0, b.followerCount + (wasFollowing ? -1 : 1)) }
        : b)
    )
    queryClient.setQueryData<number>(['following-count', userId], (old = 0) =>
      Math.max(0, old + (wasFollowing ? -1 : 1))
    )

    try {
      await toggleBuildFollow(userId, buildId, wasFollowing)
      // Refresh the creator's deduplicated follower count after the change
      queryClient.invalidateQueries({ queryKey: ['creator-followers', user?.id] })
    } catch {
      queryClient.setQueryData(['followed-builds', userId], prevFollowedIds)
      queryClient.setQueryData(['user-builds', user?.id], prevBuilds)
      queryClient.setQueryData(['following-count', userId], prevCount)
      queryClient.setQueryData(['creator-followers', user?.id], prevFollowers)
    }
  }

  // ── Follow button state ───────────────────────────────────────────────────
  const activeBuilds = builds.filter(b => b.status === 'active')
  const followedCount = activeBuilds.filter(b => followedBuildIds.has(b.id)).length
  const followedAll  = activeBuilds.length > 0 && followedCount === activeBuilds.length
  const followedSome = followedCount > 0 && !followedAll
  const isAnyFollowing = followedAll || followedSome

  function followBtnLabel() {
    if (followedAll)  return 'Following'
    if (followedSome) return `Following ${followedCount}/${activeBuilds.length}`
    return 'Follow'
  }

  if (isLoading || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.navBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.textSecondary} />
          </Pressable>
        </View>
        <View style={styles.skeletonHeader} />
      </View>
    )
  }

  const isOwner = user.id === userId
  const isPro   = user.proTier === '1' || user.proTier === 1

  return (
    <View style={styles.container}>
      {/* Nav bar */}
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.navTitle}>@{user.username}</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* ── Profile header ── */}
        <View style={styles.profileSection}>
          <View style={styles.avatarRow}>
            {/* Avatar */}
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>
                  {(user.username || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}

            {/* Right column: name, stats, follow button, social */}
            <View style={styles.profileMeta}>
              {/* Display name + Pro badge */}
              <View style={styles.nameRow}>
                <Text style={styles.displayName} numberOfLines={1}>{user.displayName}</Text>
                {isPro && <ProBadge />}
              </View>

              {/* Followers · Following counts */}
              <View style={styles.statsRow}>
                <Pressable
                  style={styles.statPressable}
                  onPress={() => router.push(`/followers/${user.id}` as any)}
                >
                  <Text style={styles.statValue}>{formatFollowers(followerCount)}</Text>
                  <Text style={styles.statLabel}> followers</Text>
                </Pressable>
                <Text style={styles.statDot}> · </Text>
                <Text style={styles.statValue}>{followingCount}</Text>
                <Text style={styles.statLabel}> following</Text>
              </View>

              {/* Social links */}
              {(user.instagramHandle || user.youtubeHandle) && (
                <View style={styles.socialRow}>
                  {user.instagramHandle && (
                    <Pressable
                      style={styles.socialLink}
                      onPress={() => Linking.openURL(`https://instagram.com/${user.instagramHandle}`)}
                    >
                      <Instagram size={13} color={colors.textTertiary} />
                      <Text style={styles.socialHandle} numberOfLines={1}>
                        @{user.instagramHandle}
                      </Text>
                    </Pressable>
                  )}
                  {user.youtubeHandle && (
                    <Pressable
                      style={styles.socialLink}
                      onPress={() => Linking.openURL(`https://youtube.com/@${user.youtubeHandle}`)}
                    >
                      <Youtube size={13} color={colors.textTertiary} />
                      <Text style={styles.socialHandle} numberOfLines={1}>
                        {user.youtubeHandle}
                      </Text>
                    </Pressable>
                  )}
                </View>
              )}
            </View>

          {/* ── Follow button — top-right of avatar row ── */}
          {!isOwner && (
            <Pressable
              style={[styles.followBtn, isAnyFollowing && styles.followBtnActive]}
              onPress={() => setModalOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={isAnyFollowing ? 'Following' : 'Follow'}
              accessibilityHint={
                activeBuilds.length > 1
                  ? 'Opens a dialog to choose which builds to follow'
                  : isAnyFollowing ? 'Tap to manage' : 'Follow this creator'
              }
            >
              <Text style={[styles.followBtnText, isAnyFollowing && styles.followBtnTextActive]}>
                {isAnyFollowing ? 'Following' : 'Follow'}
              </Text>
            </Pressable>
          )}
          </View>

          {/* Bio — full width below the avatar row */}
          {user.bio ? <Text style={styles.bio}>{user.bio}</Text> : null}
        </View>

        {/* ── Top Builds ── */}
        {topBuilds.length > 0 && (
          <View style={styles.topBuildsSection}>
            <Text style={[styles.sectionLabel, { paddingHorizontal: 16 }]}>Top 8</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topBuildsRow}
            >
              {topBuilds.map(build => (
                <Pressable
                  key={build.id}
                  style={styles.topBuildItem}
                  onPress={() => build.username && router.push(`/build/${build.username}/${build.slug}`)}
                >
                  <View style={styles.topBuildCircle}>
                    {build.coverPhotoUrl ? (
                      <Image source={{ uri: build.coverPhotoUrl }} style={styles.topBuildPhoto} />
                    ) : (
                      <View style={[styles.topBuildPhoto, styles.topBuildPhotoFallback]} />
                    )}
                  </View>
                  <Text style={styles.topBuildName} numberOfLines={1}>
                    {build.nickname || `${build.year} ${build.make}`}
                  </Text>
                  <Text style={styles.topBuildUsername} numberOfLines={1}>
                    @{build.username}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* ── Builds list ── */}
        <View style={styles.buildsSectionHeader}>
          <Text style={styles.sectionLabel}>
            {builds.length === 1 ? '1 Build' : `${builds.length} Builds`}
          </Text>
        </View>

        {builds.length === 0 && (
          <View style={styles.buildItemWrap}>
            <Text style={styles.emptyText}>No builds yet</Text>
          </View>
        )}

        {builds.map(build => (
          <View key={build.id} style={styles.buildItemWrap}>
            <BuildCard
              build={{ ...build, username: user.username }}
              showFollowButton={!isOwner}
              isFollowing={followedBuildIds.has(build.id)}
              onFollow={() => handleFollowBuild(build.id)}
              onPress={() => router.push(`/build/${user.username}/${build.slug}`)}
            />
          </View>
        ))}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* ── Follow User modal ── */}
      <FollowUserModal
        visible={modalOpen}
        creator={user}
        builds={builds}
        followedBuildIds={followedBuildIds}
        onClose={() => setModalOpen(false)}
        onFollowComplete={() => {
          queryClient.invalidateQueries({ queryKey: ['creator-followers', user.id] })
        }}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backBtn: { padding: 4 },
  navTitle: { flex: 1, color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  navSpacer: { width: 28 },
  skeletonHeader: { height: 160, backgroundColor: colors.surface1, margin: 16, borderRadius: 8 },

  // Profile section
  profileSection: {
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: colors.surface3,
    flexShrink: 0,
  },
  avatarFallback: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: { color: colors.textPrimary, fontSize: 26, fontWeight: '700' },

  // Right column
  profileMeta: {
    flex: 1,
    gap: 6,
    paddingTop: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    flexShrink: 1,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  statPressable: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statValue: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  statDot: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  socialRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  socialLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  socialHandle: {
    color: colors.textTertiary,
    fontSize: 12,
  },

  // Follow button — top-right of avatar row
  followBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 82,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
    flexShrink: 0,
  },
  followBtnActive: {
    backgroundColor: colors.accent,
  },
  followBtnText: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  followBtnTextActive: {
    color: '#fff',
  },

  bio: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },

  // Top Builds + Builds
  topBuildsSection: {
    paddingTop: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBuildsRow: {
    paddingHorizontal: 16,
    gap: 16,
  },
  topBuildItem: {
    alignItems: 'center',
    width: 80,
  },
  topBuildCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.surface3,
    marginBottom: 6,
  },
  topBuildPhoto: {
    width: '100%',
    height: '100%',
  },
  topBuildPhotoFallback: {
    backgroundColor: colors.surface2,
  },
  topBuildName: {
    color: colors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    width: '100%',
  },
  topBuildUsername: {
    color: colors.textTertiary,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 1,
    width: '100%',
  },
  buildsSectionHeader: { paddingHorizontal: 16, paddingTop: 16 },
  buildItemWrap: { paddingHorizontal: 16 },
  sectionLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 14 },
  emptyText: { color: colors.textTertiary, fontSize: 14, textAlign: 'center', paddingVertical: 24 },
})
