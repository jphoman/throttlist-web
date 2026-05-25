import React from 'react'
import { View, Text, StyleSheet, Platform, Image, ScrollView, Pressable, ActivityIndicator } from 'react-native'
import { Bell, Heart, MessageCircle, UserPlus } from '@/components/Icons'
import { colors, timeAgo } from '@/constants/throttlist'
import { useQuery } from '@tanstack/react-query'
import { fetchNotifications } from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import { router } from 'expo-router'
import InitialsAvatar from '@/components/InitialsAvatar'
import type { Notification } from '@/lib/supabaseQueries'

function AlertIcon({ type }: { type: string }) {
  if (type === 'like') return <Heart size={16} color={colors.accent} fill={colors.accent} />
  if (type === 'comment') return <MessageCircle size={16} color={colors.accent} />
  if (type === 'follow') return <UserPlus size={16} color={colors.accent} />
  return <Bell size={16} color={colors.accent} />
}

export default function AlertsScreen() {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(userId),
    enabled: !!userId,
    staleTime: 30_000,
  })

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Bell size={20} color={colors.accent} />
        <Text style={styles.headerTitle}>Alerts</Text>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : notifications.length === 0 ? (
        <View style={styles.empty}>
          <Bell size={32} color={colors.textTertiary} />
          <Text style={styles.emptyText}>No notifications yet</Text>
          <Text style={styles.emptySubText}>
            Likes, comments, and new followers will appear here.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {notifications.map(alert => (
            <Pressable
              key={alert.id}
              style={[styles.alertRow, !alert.read && styles.alertRowUnread]}
              onPress={() => {
                if (alert.postId) router.push(`/post/${alert.postId}`)
              }}
            >
              <View style={styles.avatarWrap}>
                {alert.actorAvatarUrl ? (
                  <Image source={{ uri: alert.actorAvatarUrl }} style={styles.avatar} />
                ) : (
                  <InitialsAvatar name={alert.actorDisplayName || alert.actorUsername || '?'} size={42} />
                )}
                <View style={styles.iconBadge}>
                  <AlertIcon type={alert.type} />
                </View>
              </View>
              <View style={styles.alertInfo}>
                <Text style={styles.alertText}>
                  <Text style={styles.alertActor}>@{alert.actorUsername}</Text>
                  {' '}{alert.content}
                </Text>
                <Text style={styles.alertTime}>{timeAgo(alert.createdAt)}</Text>
              </View>
              {!alert.read && <View style={styles.unreadDot} />}
            </Pressable>
          ))}
          <View style={{ height: 48 }} />
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  badge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32 },
  emptyText: { color: colors.textSecondary, fontSize: 16, fontWeight: '600', textAlign: 'center' },
  emptySubText: { color: colors.textTertiary, fontSize: 13, textAlign: 'center', lineHeight: 19 },
  alertRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 12,
  },
  alertRowUnread: { backgroundColor: colors.surface1 },
  avatarWrap: { position: 'relative', flexShrink: 0 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  iconBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  alertInfo: { flex: 1 },
  alertText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  alertActor: { color: colors.textPrimary, fontWeight: '700' },
  alertTime: { color: colors.textTertiary, fontSize: 12, marginTop: 3 },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.accent,
    flexShrink: 0,
  },
})
