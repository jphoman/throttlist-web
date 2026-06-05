import React from 'react'
import { View, Text, Pressable, StyleSheet, Platform } from 'react-native'
import { router, usePathname } from 'expo-router'
import { useQuery } from '@tanstack/react-query'
import { Home, Compass, Plus, Send, User } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { useAuth } from '@/lib/auth'
import { fetchTotalUnreadMessageCount } from '@/lib/supabaseQueries'

export default function TabBar() {
  const pathname = usePathname()
  const seg = pathname.replace(/^\//, '').split('/')[0] || 'feed'
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''

  // Unread DM count — drives the badge on the Send icon
  const { data: unreadDMs = 0 } = useQuery({
    queryKey: ['unread-dms', userId],
    queryFn: () => fetchTotalUnreadMessageCount(userId),
    enabled: !!userId,
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  })

  const nav = (path: string) => {
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
      window.location.href = path
    } else {
      router.push(path as any)
    }
  }

  return (
    <View style={styles.bar}>
      <Pressable style={styles.item} onPress={() => nav('/feed')}>
        <Home size={22} color={seg === 'feed' ? '#FFFFFF' : colors.textSecondary} />
      </Pressable>
      <Pressable style={styles.item} onPress={() => nav('/discover')}>
        <Compass size={22} color={seg === 'discover' ? '#FFFFFF' : colors.textSecondary} />
      </Pressable>
      <Pressable style={styles.item} onPress={() => nav('/capture')}>
        <View style={styles.addCircle}>
          <Plus size={22} color="#FFFFFF" />
        </View>
      </Pressable>
      <Pressable style={styles.item} onPress={() => nav('/messages')}>
        <View style={styles.iconWrap}>
          <Send size={22} color={seg === 'messages' ? '#FFFFFF' : colors.textSecondary} />
          {unreadDMs > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadDMs > 9 ? '9+' : unreadDMs}</Text>
            </View>
          )}
        </View>
      </Pressable>
      <Pressable style={styles.item} onPress={() => nav('/profile')}>
        <User size={22} color={seg === 'profile' ? '#FFFFFF' : colors.textSecondary} />
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.bg,
    borderTopColor: colors.surface1,
    borderTopWidth: 1,
    height: Platform.OS === 'ios' ? 80 : 60,
    paddingBottom: Platform.OS === 'ios' ? 24 : 6,
    paddingTop: 8,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCircle: {
    backgroundColor: colors.accent,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Platform.OS === 'ios' ? 8 : 2,
  },
  iconWrap: {
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -8,
    backgroundColor: colors.accent,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: colors.bg,
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: '700',
    lineHeight: 11,
  },
})
