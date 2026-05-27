import React, { useState, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Platform,
  Modal,
  ActivityIndicator,
} from 'react-native'
import { Edit2, Search, X, ArrowLeft, ProBadge } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { router, useFocusEffect } from 'expo-router'
import InitialsAvatar from '@/components/InitialsAvatar'
import { useAuth } from '@/lib/auth'
import {
  fetchConversations,
  searchProfiles,
  type DMConversation,
} from '@/lib/supabaseQueries'
import type { User } from '@/types'

// ─── Helpers ───────────────────────────────────────────────────────────────────

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d`
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// ─── Main Screen ───────────────────────────────────────────────────────────────

export default function MessagesScreen() {
  const { user: authUser } = useAuth()
  const [search, setSearch] = useState('')
  const [conversations, setConversations] = useState<DMConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [composeOpen, setComposeOpen] = useState(false)
  const [userSearch, setUserSearch] = useState('')
  const [userResults, setUserResults] = useState<User[]>([])
  const [searching, setSearching] = useState(false)

  // Reload conversations every time the tab is focused
  useFocusEffect(
    useCallback(() => {
      if (!authUser?.id) return
      let active = true
      setLoading(true)
      fetchConversations(authUser.id).then(data => {
        if (active) {
          setConversations(data)
          setLoading(false)
        }
      })
      return () => { active = false }
    }, [authUser?.id])
  )

  const q = search.trim().toLowerCase()
  const filteredConvos = q
    ? conversations.filter(c =>
        c.otherUsername.toLowerCase().includes(q) ||
        c.otherDisplayName.toLowerCase().includes(q)
      )
    : conversations

  async function handleUserSearch(text: string) {
    setUserSearch(text)
    const trimmed = text.trim()
    if (trimmed.length < 1) {
      setUserResults([])
      return
    }
    setSearching(true)
    const results = await searchProfiles(trimmed, authUser?.id)
    setUserResults(results)
    setSearching(false)
  }

  function openConversation(otherUserId: string) {
    setComposeOpen(false)
    setUserSearch('')
    setUserResults([])
    router.push(`/conversation/${otherUserId}` as any)
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Direct Messages</Text>
        <Pressable style={styles.composeBtn} onPress={() => setComposeOpen(true)}>
          <Edit2 size={20} color={colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Search */}
        <View style={styles.searchWrap}>
          <View style={styles.searchBar}>
            <Search size={15} color={colors.textTertiary} />
            <TextInput
              style={[styles.searchInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              placeholder="Search messages"
              placeholderTextColor={colors.textTertiary}
              value={search}
              onChangeText={setSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch('')} hitSlop={8}>
                <X size={14} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Loading skeleton */}
        {loading && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}

        {/* Conversation list */}
        {!loading && filteredConvos.map(convo => (
          <Pressable
            key={convo.otherUserId}
            style={styles.convoRow}
            onPress={() => openConversation(convo.otherUserId)}
          >
            <View style={styles.avatarCol}>
              <InitialsAvatar
                name={convo.otherDisplayName || convo.otherUsername}
                photoUrl={convo.otherAvatarUrl}
                size={52}
              />
            </View>
            <View style={styles.convoText}>
              <View style={styles.convoTopRow}>
                <Text style={[styles.convoName, convo.unreadCount > 0 && styles.convoNameUnread]}>
                  {convo.otherDisplayName || convo.otherUsername}
                </Text>
                <Text style={[styles.convoTime, convo.unreadCount > 0 && styles.convoTimeUnread]}>
                  {relativeTime(convo.lastMessageAt)}
                </Text>
              </View>
              <View style={styles.convoBottomRow}>
                <Text
                  style={[styles.convoPreview, convo.unreadCount > 0 && styles.convoPreviewUnread]}
                  numberOfLines={1}
                >
                  {convo.isFromMe ? `You: ${convo.lastMessage}` : convo.lastMessage}
                </Text>
                {convo.unreadCount > 0 && (
                  <View style={styles.unreadBadge}>
                    <Text style={styles.unreadText}>{convo.unreadCount}</Text>
                  </View>
                )}
              </View>
            </View>
          </Pressable>
        ))}

        {/* Empty state — no conversations yet */}
        {!loading && conversations.length === 0 && !q && (
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No messages yet</Text>
            <Text style={styles.emptySubtitle}>
              Tap the compose icon above to start a conversation.
            </Text>
          </View>
        )}

        {/* No search results */}
        {!loading && q && filteredConvos.length === 0 && (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No conversations matching "{search}"</Text>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Compose modal — search users to start new DM */}
      <Modal
        visible={composeOpen}
        animationType="slide"
        transparent={false}
        onRequestClose={() => setComposeOpen(false)}
      >
        <View style={styles.composeModal}>
          {/* Compose header */}
          <View style={styles.composeHeader}>
            <Pressable onPress={() => { setComposeOpen(false); setUserSearch(''); setUserResults([]) }} style={styles.composeBack}>
              <ArrowLeft size={20} color={colors.textSecondary} />
            </Pressable>
            <Text style={styles.composeTitle}>New Message</Text>
            <View style={{ width: 36 }} />
          </View>

          {/* To: search */}
          <View style={styles.composeToRow}>
            <Text style={styles.composeToLabel}>To:</Text>
            <TextInput
              style={[styles.composeToInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              placeholder="Search users…"
              placeholderTextColor={colors.textTertiary}
              value={userSearch}
              onChangeText={handleUserSearch}
              autoFocus
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searching && <ActivityIndicator size="small" color={colors.textTertiary} />}
          </View>

          <View style={styles.composeDivider} />

          {/* User results */}
          <ScrollView keyboardShouldPersistTaps="handled">
            {userResults.map(user => (
              <Pressable
                key={user.id}
                style={styles.userResultRow}
                onPress={() => openConversation(user.id)}
              >
                <InitialsAvatar
                  name={user.displayName || user.username}
                  photoUrl={user.avatarUrl}
                  size={44}
                />
                <View style={styles.userResultInfo}>
                  <View style={styles.userResultNameRow}>
                    <Text style={styles.userResultName}>{user.displayName}</Text>
                    {(user.proTier === '1' || user.proTier === 1) && <ProBadge size={13} />}
                  </View>
                  <Text style={styles.userResultHandle}>@{user.username}</Text>
                </View>
              </Pressable>
            ))}
            {userSearch.trim().length > 0 && !searching && userResults.length === 0 && (
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No users found for "{userSearch}"</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
  },
  composeBtn: {
    padding: 4,
  },
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
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
  loadingWrap: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  convoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  avatarCol: {
    width: 52,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  convoText: {
    flex: 1,
    gap: 3,
  },
  convoTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  convoName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  convoNameUnread: {
    fontWeight: '700',
  },
  convoTime: {
    color: colors.textTertiary,
    fontSize: 12,
    marginLeft: 8,
  },
  convoTimeUnread: {
    color: colors.accent,
    fontWeight: '600',
  },
  convoBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  convoPreview: {
    color: colors.textSecondary,
    fontSize: 13,
    flex: 1,
  },
  convoPreviewUnread: {
    color: colors.textPrimary,
    fontWeight: '500',
  },
  unreadBadge: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  empty: {
    padding: 40,
    alignItems: 'center',
    gap: 8,
  },
  emptyTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
  },
  // Compose modal
  composeModal: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
  },
  composeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  composeBack: {
    padding: 4,
    width: 36,
  },
  composeTitle: {
    flex: 1,
    textAlign: 'center',
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  composeToRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  composeToLabel: {
    color: colors.textTertiary,
    fontSize: 15,
    fontWeight: '600',
    width: 28,
  },
  composeToInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    padding: 0,
  },
  composeDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  userResultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 12,
  },
  userResultInfo: {
    flex: 1,
    gap: 2,
  },
  userResultNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  userResultName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  userResultHandle: {
    color: colors.textSecondary,
    fontSize: 13,
  },
})
