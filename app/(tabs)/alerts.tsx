import React from 'react'
import { View, Text, StyleSheet, Platform, Image, ScrollView, Pressable, ActivityIndicator, Modal, Switch } from 'react-native'
import { Bell, Heart, MessageCircle, UserPlus, UserMinus, Settings, ProBadge, X } from '@/components/Icons'
import { colors, timeAgo } from '@/constants/throttlist'
import { useQuery } from '@tanstack/react-query'
import { fetchNotifications } from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import { router } from 'expo-router'
import InitialsAvatar from '@/components/InitialsAvatar'
import type { Notification } from '@/lib/supabaseQueries'

const now = Date.now()
const mins  = (n: number) => new Date(now - n * 60_000).toISOString()
const hours = (n: number) => new Date(now - n * 3_600_000).toISOString()
const days  = (n: number) => new Date(now - n * 86_400_000).toISOString()

const MOCK_THUMB_POST = 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=120&q=80'
const MOCK_THUMB_BUILD = 'https://images.unsplash.com/photo-1609630875171-b1321377ee65?w=120&q=80'
const MOCK_THUMB_BUILD2 = 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=120&q=80'

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'mock_1',
    type: 'like',
    actorUsername: 'cappuccinomoto',
    actorDisplayName: 'Cappuccino Moto',
    actorAvatarUrl: '',
    actorIsPro: true,
    content: 'liked your post',
    postId: 'mock-post-1',
    thumbUrl: MOCK_THUMB_POST,
    navPath: '/feed',
    createdAt: mins(2),
    read: false,
  },
  {
    id: 'mock_2',
    type: 'comment',
    actorUsername: 'rideandwrench',
    actorDisplayName: 'Ride & Wrench',
    actorAvatarUrl: '',
    content: 'commented: "That exhaust setup is clean 🔥"',
    postId: 'mock-post-1',
    thumbUrl: MOCK_THUMB_POST,
    navPath: '/feed',
    createdAt: mins(9),
    read: false,
  },
  {
    id: 'mock_3',
    type: 'follow',
    actorUsername: 'seven11moto',
    actorDisplayName: 'Seven11Moto',
    actorAvatarUrl: '',
    content: 'started following 2019 Honda CB650R',
    buildId: 'mock-build-1',
    thumbUrl: MOCK_THUMB_BUILD,
    navPath: '/feed',
    createdAt: mins(24),
    read: false,
  },
  {
    id: 'mock_4',
    type: 'like',
    actorUsername: 'investomoto',
    actorDisplayName: 'InvestoMoto',
    actorAvatarUrl: '',
    actorIsPro: true,
    content: 'liked your post',
    postId: 'mock-post-2',
    thumbUrl: MOCK_THUMB_BUILD2,
    navPath: '/feed',
    createdAt: hours(1),
    read: false,
  },
  {
    id: 'mock_5',
    type: 'comment',
    actorUsername: 'moto_feelz',
    actorDisplayName: 'Moto Feelz',
    actorAvatarUrl: '',
    content: 'commented: "What bars are those? Been looking for something similar for mine"',
    postId: 'mock-post-2',
    thumbUrl: MOCK_THUMB_BUILD2,
    navPath: '/feed',
    createdAt: hours(3),
    read: false,
  },
  {
    id: 'mock_6',
    type: 'follow',
    actorUsername: 'coldbrewmoto',
    actorDisplayName: 'Cold Brew Moto',
    actorAvatarUrl: '',
    actorIsPro: true,
    content: 'started following 2021 Yamaha MT-07',
    buildId: 'mock-build-2',
    thumbUrl: MOCK_THUMB_BUILD,
    navPath: '/feed',
    createdAt: hours(6),
    read: true,
  },
  {
    id: 'mock_7',
    type: 'like',
    actorUsername: 'dirtbagcycles',
    actorDisplayName: 'Dirtbag Cycles',
    actorAvatarUrl: '',
    content: 'liked your post',
    postId: 'mock-post-1',
    thumbUrl: MOCK_THUMB_POST,
    navPath: '/feed',
    createdAt: days(1),
    read: true,
  },
  {
    id: 'mock_8',
    type: 'comment',
    actorUsername: 'builtnotbought',
    actorDisplayName: 'Built Not Bought',
    actorAvatarUrl: '',
    content: 'commented: "Love the color combo on this — what paint did you use?"',
    postId: 'mock-post-2',
    thumbUrl: MOCK_THUMB_BUILD2,
    navPath: '/feed',
    createdAt: days(2),
    read: true,
  },
  {
    id: 'mock_9',
    type: 'follow',
    actorUsername: 'wrenchmonkees',
    actorDisplayName: 'Wrench Monkees',
    actorAvatarUrl: '',
    content: 'started following Scrambler Project',
    buildId: 'mock-build-1',
    thumbUrl: MOCK_THUMB_BUILD,
    navPath: '/feed',
    createdAt: days(4),
    read: true,
  },
  {
    id: 'mock_10',
    type: 'like',
    actorUsername: 'garage.jpg',
    actorDisplayName: 'garage.jpg',
    actorAvatarUrl: '',
    content: 'liked your post',
    postId: 'mock-post-1',
    thumbUrl: MOCK_THUMB_POST,
    navPath: '/feed',
    createdAt: days(7),
    read: true,
  },
  {
    id: 'mock_11',
    type: 'unfollow',
    actorUsername: 'oldschoolmoto',
    actorDisplayName: 'Old School Moto',
    actorAvatarUrl: '',
    content: 'unfollowed Scrambler Project',
    buildId: 'mock-build-1',
    thumbUrl: MOCK_THUMB_BUILD,
    navPath: '/feed',
    createdAt: hours(4),
    read: false,
  },
  {
    id: 'mock_12',
    type: 'unfollow',
    actorUsername: 'trackdaykid',
    actorDisplayName: 'Track Day Kid',
    actorAvatarUrl: '',
    content: 'unfollowed 2019 Honda CB650R',
    buildId: 'mock-build-2',
    thumbUrl: MOCK_THUMB_BUILD2,
    navPath: '/feed',
    createdAt: days(3),
    read: true,
  },
]

function AlertIcon({ type }: { type: string }) {
  if (type === 'like')     return <Heart size={16} color={colors.accent} fill={colors.accent} />
  if (type === 'comment')  return <MessageCircle size={16} color={colors.accent} />
  if (type === 'follow')   return <UserPlus size={16} color={colors.accent} />
  if (type === 'unfollow') return <UserMinus size={16} color={colors.textTertiary} />
  return <Bell size={16} color={colors.accent} />
}

type AlertFilter = 'all' | 'like' | 'comment' | 'follow' | 'unfollow'

const FILTERS: { id: AlertFilter; label: string }[] = [
  { id: 'all',      label: 'All' },
  { id: 'like',     label: 'Likes' },
  { id: 'comment',  label: 'Comments' },
  { id: 'follow',   label: 'Follows' },
  { id: 'unfollow', label: 'Unfollows' },
]

export default function AlertsScreen() {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''
  const [activeFilter, setActiveFilter] = React.useState<AlertFilter>('all')
  const [settingsOpen, setSettingsOpen] = React.useState(false)
  const [dismissedIds, setDismissedIds] = React.useState<Set<string>>(new Set())

  function dismissOne(id: string) {
    setDismissedIds(prev => new Set([...prev, id]))
  }
  function clearAll() {
    setDismissedIds(new Set(allNotifications.map(n => n.id)))
  }
  const [muteLikes,      setMuteLikes]      = React.useState(false)
  const [muteComments,   setMuteComments]   = React.useState(false)
  const [muteFollows,    setMuteFollows]    = React.useState(false)
  const [muteUnfollows,  setMuteUnfollows]  = React.useState(false)

  const { data: rawNotifications = [], isLoading } = useQuery({
    queryKey: ['notifications', userId],
    queryFn: () => fetchNotifications(userId),
    enabled: !!userId,
    staleTime: 30_000,
  })

  const allNotifications = (rawNotifications.length > 0 ? rawNotifications : MOCK_NOTIFICATIONS)
    .filter(n => {
      if (dismissedIds.has(n.id))               return false
      if (n.type === 'like'     && muteLikes)    return false
      if (n.type === 'comment'  && muteComments) return false
      if (n.type === 'follow'   && muteFollows)  return false
      if (n.type === 'unfollow' && muteUnfollows) return false
      return true
    })
  const notifications = activeFilter === 'all'
    ? allNotifications
    : allNotifications.filter(n => n.type === activeFilter)
  const unreadCount = allNotifications.filter(n => !n.read).length

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
        {allNotifications.length > 0 && (
          <Pressable style={styles.clearAllBtn} onPress={clearAll}>
            <Text style={styles.clearAllText}>Clear All</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.filterBar}>
        {FILTERS.map(f => {
          const active = activeFilter === f.id
          return (
            <Pressable
              key={f.id}
              style={[styles.filterPill, active && styles.filterPillActive]}
              onPress={() => setActiveFilter(f.id)}
            >
              <Text style={[styles.filterPillText, active && styles.filterPillTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          )
        })}
        <Pressable style={styles.settingsBtn} onPress={() => setSettingsOpen(true)}>
          <Settings size={16} color={colors.textTertiary} />
        </Pressable>
      </View>

      {/* Alert Settings Modal */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSettingsOpen(false)} />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <Text style={styles.modalTitle}>Alert Settings</Text>
          <Text style={styles.modalSubtitle}>Mute alert types you don't want to see</Text>

          <View style={styles.toggleGroup}>
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <Heart size={16} color={muteLikes ? colors.textTertiary : colors.accent} fill={muteLikes ? undefined : colors.accent} />
                <View>
                  <Text style={styles.toggleLabel}>Likes</Text>
                  <Text style={styles.toggleSub}>When someone likes your post</Text>
                </View>
              </View>
              <Switch
                value={!muteLikes}
                onValueChange={v => setMuteLikes(!v)}
                trackColor={{ false: colors.surface3, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.toggleDivider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <MessageCircle size={16} color={muteComments ? colors.textTertiary : colors.accent} />
                <View>
                  <Text style={styles.toggleLabel}>Comments</Text>
                  <Text style={styles.toggleSub}>When someone comments on your post</Text>
                </View>
              </View>
              <Switch
                value={!muteComments}
                onValueChange={v => setMuteComments(!v)}
                trackColor={{ false: colors.surface3, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.toggleDivider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <UserPlus size={16} color={muteFollows ? colors.textTertiary : colors.accent} />
                <View>
                  <Text style={styles.toggleLabel}>Follows</Text>
                  <Text style={styles.toggleSub}>When someone follows one of your builds</Text>
                </View>
              </View>
              <Switch
                value={!muteFollows}
                onValueChange={v => setMuteFollows(!v)}
                trackColor={{ false: colors.surface3, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
            <View style={styles.toggleDivider} />
            <View style={styles.toggleRow}>
              <View style={styles.toggleLeft}>
                <UserMinus size={16} color={muteUnfollows ? colors.textTertiary : colors.textSecondary} />
                <View>
                  <Text style={styles.toggleLabel}>Unfollows</Text>
                  <Text style={styles.toggleSub}>When someone unfollows one of your builds</Text>
                </View>
              </View>
              <Switch
                value={!muteUnfollows}
                onValueChange={v => setMuteUnfollows(!v)}
                trackColor={{ false: colors.surface3, true: colors.accent }}
                thumbColor="#fff"
              />
            </View>
          </View>

          <Pressable style={styles.modalDoneBtn} onPress={() => setSettingsOpen(false)}>
            <Text style={styles.modalDoneBtnText}>Done</Text>
          </Pressable>
        </View>
      </Modal>

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
          {notifications.map(alert => {
            const goToActor = () => router.push(`/user/${alert.actorUsername}` as any)
            const goToContent = () => { if (alert.navPath) router.push(alert.navPath as any) }
            return (
            <View
              key={alert.id}
              style={[styles.alertRow, !alert.read && styles.alertRowUnread]}
            >
              {/* Avatar → actor profile */}
              <Pressable onPress={goToActor} style={styles.avatarWrap}>
                {alert.actorAvatarUrl ? (
                  <Image source={{ uri: alert.actorAvatarUrl }} style={styles.avatar} />
                ) : (
                  <InitialsAvatar name={alert.actorDisplayName || alert.actorUsername || '?'} size={42} />
                )}
                <View style={styles.iconBadge}>
                  <AlertIcon type={alert.type} />
                </View>
              </Pressable>

              {/* Info → post/build, with username independently → actor profile */}
              <Pressable onPress={goToContent} style={styles.alertInfo}>
                <View style={styles.alertActorRow}>
                  <Pressable onPress={goToActor}>
                    <Text style={styles.alertActor}>@{alert.actorUsername}</Text>
                  </Pressable>
                  {alert.actorIsPro && <ProBadge size={12} />}
                  <Text style={styles.alertText}> {alert.content}</Text>
                </View>
                <Text style={styles.alertTime}>{timeAgo(alert.createdAt)}</Text>
              </Pressable>

              {/* Thumbnail → post/build */}
              <Pressable onPress={goToContent} style={styles.thumbWrap}>
                {alert.thumbUrl ? (
                  <Image source={{ uri: alert.thumbUrl }} style={styles.thumb} />
                ) : (
                  <View style={[styles.thumb, styles.thumbFallback]} />
                )}
                {!alert.read && <View style={styles.thumbUnreadDot} />}
              </Pressable>

              <Pressable style={styles.dismissBtn} onPress={() => dismissOne(alert.id)} hitSlop={8}>
                <X size={12} color={colors.textTertiary} />
              </Pressable>
            </View>
            )
          })}
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
  clearAllBtn: {
    marginLeft: 'auto' as any,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  clearAllText: {
    color: colors.textTertiary,
    fontSize: 13,
    fontWeight: '600',
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
  filterBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    gap: 7,
    height: 44,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  filterPill: {
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
  filterPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  filterPillText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  filterPillTextActive: { color: '#fff' },
  settingsBtn: {
    marginLeft: 'auto' as any,
    padding: 6,
  },
  // Modal
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalSheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderTopWidth: 1,
    borderColor: colors.border,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface3,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 20,
  },
  modalTitle: {
    color: colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  modalSubtitle: {
    color: colors.textTertiary,
    fontSize: 13,
    marginBottom: 20,
  },
  toggleGroup: {
    backgroundColor: colors.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
    overflow: 'hidden',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  toggleLabel: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
  },
  toggleSub: {
    color: colors.textTertiary,
    fontSize: 12,
    marginTop: 1,
  },
  toggleDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
  modalDoneBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  modalDoneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
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
  alertActorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  alertText: { color: colors.textSecondary, fontSize: 13, lineHeight: 19 },
  alertActor: { color: colors.textPrimary, fontWeight: '700' },
  alertTime: { color: colors.textTertiary, fontSize: 12, marginTop: 3 },
  thumbWrap: {
    position: 'relative',
    flexShrink: 0,
  },
  thumb: {
    width: 46,
    height: 46,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  thumbFallback: {
    backgroundColor: colors.surface2,
  },
  thumbUnreadDot: {
    position: 'absolute',
    top: -3,
    right: -3,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 2,
    borderColor: colors.bg,
  },
  dismissBtn: {
    padding: 4,
    flexShrink: 0,
  },
})
