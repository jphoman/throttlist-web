import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  Pressable,
  Platform,
  Linking,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Instagram, Youtube, ProBadge } from '@/components/Icons'
import {
  fetchProfileByUsername,
  fetchUserBuilds,
  fetchFollowingCount,
  fetchFollowedBuildIds,
  toggleBuildFollow,
} from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import { colors, formatFollowers } from '@/constants/throttlist'
import BuildCard from '@/components/BuildCard'

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>()
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''
  const queryClient = useQueryClient()

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

  const { data: followedBuildIds = new Set<string>() } = useQuery({
    queryKey: ['followed-builds', userId],
    queryFn: () => fetchFollowedBuildIds(userId),
    enabled: !!userId,
  })

  async function handleFollowBuild(buildId: string) {
    if (!userId) return
    const wasFollowing = followedBuildIds.has(buildId)

    // Snapshot for rollback
    const prevFollowedIds = queryClient.getQueryData<Set<string>>(['followed-builds', userId])
    const prevBuilds = queryClient.getQueryData<typeof builds>(['user-builds', user?.id])
    const prevCount = queryClient.getQueryData<number>(['following-count', userId])

    // Optimistic: toggle the Set so button flips instantly
    queryClient.setQueryData<Set<string>>(['followed-builds', userId], (old = new Set()) => {
      const next = new Set(old)
      wasFollowing ? next.delete(buildId) : next.add(buildId)
      return next
    })

    // Optimistic: update follower count on the build card
    queryClient.setQueryData<typeof builds>(['user-builds', user?.id], (old = []) =>
      old.map(b =>
        b.id === buildId
          ? { ...b, followerCount: Math.max(0, b.followerCount + (wasFollowing ? -1 : 1)) }
          : b
      )
    )

    // Optimistic: update the logged-in user's own following count
    queryClient.setQueryData<number>(['following-count', userId], (old = 0) =>
      Math.max(0, old + (wasFollowing ? -1 : 1))
    )

    try {
      await toggleBuildFollow(userId, buildId, wasFollowing)
    } catch {
      // Rollback everything on failure
      queryClient.setQueryData(['followed-builds', userId], prevFollowedIds)
      queryClient.setQueryData(['user-builds', user?.id], prevBuilds)
      queryClient.setQueryData(['following-count', userId], prevCount)
    }
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
  const isPro = user.proTier === '1' || user.proTier === 1

  return (
    <View style={styles.container}>
      <View style={styles.navBar}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.navTitle}>@{user.username}</Text>
        <View style={styles.navSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.profileSection}>
          <View style={styles.avatarRow}>
            {user.avatarUrl ? (
              <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Text style={styles.avatarLetter}>
                  {(user.username || 'U')[0].toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.profileMeta}>
              <View style={styles.displayNameRow}>
                <Text style={styles.displayName}>{user.displayName}</Text>
                {isPro && <ProBadge />}
              </View>
              <View style={styles.statsRow}>
                <Text style={styles.statCount}>{followingCount}</Text>
                <Text style={styles.statLabel}> following</Text>
              </View>
              <View style={styles.socialRow}>
                {user.instagramHandle && (
                  <Pressable
                    style={styles.socialLink}
                    onPress={() => Linking.openURL(`https://instagram.com/${user.instagramHandle}`)}
                  >
                    <Instagram size={14} color={colors.textTertiary} />
                    <Text style={styles.socialHandle}>@{user.instagramHandle}</Text>
                  </Pressable>
                )}
                {user.youtubeHandle && (
                  <Pressable
                    style={styles.socialLink}
                    onPress={() => Linking.openURL(`https://youtube.com/@${user.youtubeHandle}`)}
                  >
                    <Youtube size={14} color={colors.textTertiary} />
                    <Text style={styles.socialHandle}>{user.youtubeHandle}</Text>
                  </Pressable>
                )}
              </View>
            </View>
          </View>
          {user.bio && <Text style={styles.bio}>{user.bio}</Text>}
        </View>

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
  profileSection: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatarRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 14, marginBottom: 12 },
  avatar: { width: 64, height: 64, borderRadius: 32, borderWidth: 1, borderColor: colors.surface3 },
  avatarFallback: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.textPrimary, fontSize: 24, fontWeight: '700' },
  profileMeta: { flex: 1, paddingTop: 4 },
  displayNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  displayName: { color: colors.textPrimary, fontSize: 17, fontWeight: '700' },
  statsRow: { flexDirection: 'row', alignItems: 'baseline', marginTop: 3 },
  statCount: { color: colors.textPrimary, fontSize: 13, fontWeight: '700' },
  statLabel: { color: colors.textSecondary, fontSize: 13 },
  socialRow: { flexDirection: 'row', gap: 12, marginTop: 6 },
  socialLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  socialHandle: { color: colors.textTertiary, fontSize: 12 },
  bio: { color: colors.textSecondary, fontSize: 14, lineHeight: 20 },
  buildsSectionHeader: { paddingHorizontal: 16, paddingTop: 16 },
  buildItemWrap: { paddingHorizontal: 16 },
  sectionLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: '700', marginBottom: 14 },
  emptyText: { color: colors.textTertiary, fontSize: 14, textAlign: 'center', paddingVertical: 24 },
})
