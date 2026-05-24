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
import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import { Instagram, Youtube, Settings, ChevronRight, Star, ProBadge, Plus } from '@/components/Icons'
import { fetchProfile, fetchUserBuilds, fetchFollowingCount, fetchCreatorFollowerCount } from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import { colors, formatFollowers } from '@/constants/throttlist'
import BuildCard from '@/components/BuildCard'

export default function ProfileScreen() {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''

  const { data, isLoading } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => Promise.all([fetchProfile(userId), fetchUserBuilds(userId)]),
    enabled: !!userId,
  })

  const { data: followingCount = 0 } = useQuery({
    queryKey: ['following-count', userId],
    queryFn: () => fetchFollowingCount(userId),
    enabled: !!userId,
  })

  const { data: followerCount = 0 } = useQuery({
    queryKey: ['creator-followers', userId],
    queryFn: () => fetchCreatorFollowerCount(userId),
    enabled: !!userId,
  })

  const user = data?.[0] ?? null
  const builds = data?.[1] ?? []

  if (isLoading || !user) {
    return (
      <View style={styles.container}>
        <View style={styles.skeletonHeader} />
      </View>
    )
  }

  const isPro = user.proTier === '1' || user.proTier === 1

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Top bar */}
      <View style={styles.topBar}>
        <Text style={styles.topUsername}>@{user.username}</Text>
        <Pressable style={styles.settingsBtn} onPress={() => router.push('/settings')}>
          <Settings size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Profile info */}
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
            <View style={styles.statsInline}>
              <Pressable onPress={() => router.push(`/followers/${userId}` as any)} style={styles.statChip}>
                <Text style={styles.statChipCount}>{formatFollowers(followerCount)}</Text>
                <Text style={styles.statChipLabel}> followers</Text>
              </Pressable>
              <Text style={styles.statDivider}> · </Text>
              <Pressable onPress={() => router.push('/following')} style={styles.statChip}>
                <Text style={styles.statChipCount}>{followingCount}</Text>
                <Text style={styles.statChipLabel}> following</Text>
              </Pressable>
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

        {!isPro && (
          <Pressable
            style={styles.proBanner}
            onPress={() => router.push('/pro')}
          >
            <Star size={14} color={colors.accent} fill={colors.accent} />
            <Text style={styles.proBannerText}>
              Pro coming soon — earn affiliate commissions
            </Text>
            <ChevronRight size={14} color={colors.accent} />
          </Pressable>
        )}
      </View>

      {/* Builds */}
      <View style={styles.buildsSectionHeader}>
        <Text style={styles.sectionLabel}>
          {builds.length === 1 ? '1 Build' : `${builds.length} Builds`}
        </Text>
      </View>
      {builds.length === 0 && (
        <View style={styles.emptyBuilds}>
          <Pressable
            style={styles.emptyAddBtn}
            onPress={() => router.push({ pathname: '/add-build', params: { returnTo: 'capture' } })}
          >
            <View style={styles.emptyAddCircle}>
              <Plus size={28} color="#fff" />
            </View>
          </Pressable>
          <Text style={styles.emptyBuildsText}>Add your first build</Text>
          <Text style={styles.emptyBuildsSubText}>
            Then capture a photo to make your first post
          </Text>
        </View>
      )}
      {builds.map(build => (
        <View key={build.id} style={styles.buildItemWrap}>
          <BuildCard
            build={{ ...build, username: user.username }}
            showFollowButton={false}
            onPress={() => router.push(`/build/${user.username}/${build.slug}`)}
          />
        </View>
      ))}

      <View style={{ height: 48 }} />
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topUsername: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  settingsBtn: {
    padding: 4,
  },
  profileSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 12,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  avatarFallback: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
  },
  profileMeta: {
    flex: 1,
    paddingTop: 4,
  },
  displayNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  statsInline: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
    gap: 6,
  },
  statChip: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  statChipCount: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  statChipLabel: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  statDivider: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  socialRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
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
  bio: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.accent + '44',
    borderRadius: 8,
    padding: 12,
  },
  proBannerText: {
    color: colors.textSecondary,
    fontSize: 12,
    flex: 1,
  },
  buildsSectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  buildItemWrap: {
    paddingHorizontal: 16,
  },
  emptyBuilds: {
    paddingHorizontal: 16,
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyAddBtn: {
    marginBottom: 4,
  },
  emptyAddCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBuildsText: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptyBuildsSubText: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 14,
  },
  skeletonHeader: {
    height: 200,
    backgroundColor: colors.surface1,
  },
})
