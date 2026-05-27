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
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, ProBadge } from '@/components/Icons'
import { fetchCreatorFollowers } from '@/lib/supabaseQueries'
import { colors } from '@/constants/throttlist'
import type { User } from '@/types'

export default function FollowersScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>()

  const { data: followers = [], isLoading } = useQuery({
    queryKey: ['creator-follower-list', userId],
    queryFn: () => fetchCreatorFollowers(userId!),
    enabled: !!userId,
  })

  return (
    <View style={styles.container}>
      {/* Nav */}
      <View style={styles.navBar}>
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
          renderItem={({ item }) => <FollowerRow user={item} />}
        />
      )}
    </View>
  )
}

function FollowerRow({ user }: { user: User }) {
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push(`/user/${user.username}` as any)}
    >
      {user.avatarUrl ? (
        <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Text style={styles.avatarLetter}>
            {(user.username || 'U')[0].toUpperCase()}
          </Text>
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.displayName} numberOfLines={1}>
            {user.displayName || user.username}
          </Text>
          {(user.proTier === '1' || user.proTier === 1) && <ProBadge size={13} />}
        </View>
        <Text style={styles.username} numberOfLines={1}>
          @{user.username}
        </Text>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
  navTitle: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  navSpacer: { width: 28 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 15,
  },
  list: {
    paddingVertical: 8,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 72,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.surface3,
    flexShrink: 0,
  },
  avatarFallback: {
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarLetter: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  displayName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  username: {
    color: colors.textTertiary,
    fontSize: 13,
  },
})
