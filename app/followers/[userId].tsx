import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
  ActivityIndicator,
  Image,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ProBadge } from '@/components/Icons'
import { fetchCreatorFollowersWithBuilds, type FollowerWithBuilds } from '@/lib/supabaseQueries'
import { colors } from '@/constants/throttlist'

export default function FollowersScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()
  const insets = useSafeAreaInsets()

  const { data: followers = [], isLoading } = useQuery({
    queryKey: ['creator-follower-list', userId],
    queryFn: () => fetchCreatorFollowersWithBuilds(userId!),
    enabled: !!userId,
  })

  return (
    <View style={styles.container}>
      <View style={[styles.navBar, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.navTitle}>Followers</Text>
        <View style={styles.navSpacer} />
      </View>

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : followers.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No followers yet</Text>
        </View>
      ) : (
        <FlatList
          data={followers}
          keyExtractor={u => u.id}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item }) => <FollowerRow follower={item} />}
        />
      )}
    </View>
  )
}

function FollowerRow({ follower }: { follower: FollowerWithBuilds }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/user/${follower.username}` as any)}
    >
      {/* User avatar */}
      {follower.avatarUrl ? (
        <Image source={{ uri: follower.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>
            {(follower.username || 'U')[0].toUpperCase()}
          </Text>
        </View>
      )}

      {/* Name + username */}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {follower.displayName || follower.username}
          </Text>
          {(follower.proTier === '1' || follower.proTier === 1) && <ProBadge size={13} />}
        </View>
        <Text style={styles.username} numberOfLines={1}>
          @{follower.username}
        </Text>
      </View>

      {/* Circular build cover photos + optional "+" for future-builds follower */}
      <View style={styles.buildThumbs}>
        {follower.followedBuildCovers.map((url, i) => (
          <Image
            key={i}
            source={{ uri: url }}
            style={[styles.buildThumb, i > 0 && styles.buildThumbOverlap]}
          />
        ))}
        {follower.followsFuture && (
          <View style={[styles.buildThumb, styles.futureBadge, follower.followedBuildCovers.length > 0 && styles.buildThumbOverlap]}>
            <Text style={styles.futurePlus}>+</Text>
          </View>
        )}
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  backBtn: { padding: 4 },
  navTitle: { flex: 1, color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  navSpacer: { width: 28 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.textTertiary, fontSize: 15 },
  list: { paddingVertical: 8 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 72 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    borderWidth: 1, borderColor: colors.surface3, flexShrink: 0,
  },
  avatarFallback: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  avatarLetter: { color: colors.textPrimary, fontSize: 18, fontWeight: '700' },
  info: { flex: 1, gap: 2 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  displayName: { color: colors.textPrimary, fontSize: 15, fontWeight: '600' },
  username: { color: colors.textTertiary, fontSize: 13 },
  // Build avatar circles stacked with overlap
  buildThumbs: { flexDirection: 'row', alignItems: 'center' },
  buildThumb: {
    width: 30, height: 30, borderRadius: 15,   // circle
    borderWidth: 2, borderColor: colors.bg,
    backgroundColor: colors.surface2,
  },
  buildThumbOverlap: { marginLeft: -10 },
  futureBadge: {
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  futurePlus: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 18,
  },
})
