import React, { useState, useRef, useEffect, useCallback } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { ArrowLeft, Send as SendIcon } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import InitialsAvatar from '@/components/InitialsAvatar'
import { useAuth } from '@/lib/auth'
import {
  fetchProfile,
  fetchDirectMessages,
  sendDirectMessage,
  markMessagesRead,
  type DirectMessage,
} from '@/lib/supabaseQueries'
import { supabase } from '@/lib/supabase'
import type { User } from '@/types'

function formatTime(iso: string): string {
  const d = new Date(iso)
  const diff = Date.now() - d.getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
  if (h < 168) return d.toLocaleDateString('en-US', { weekday: 'short' })
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function ConversationScreen() {
  const { id: otherUserId } = useLocalSearchParams<{ id: string }>()
  const { user: authUser } = useAuth()
  const myId = authUser?.id ?? ''

  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [messages, setMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const listRef = useRef<FlatList>(null)

  // Load other user's profile + message history
  useEffect(() => {
    if (!otherUserId || !myId) return
    let active = true

    Promise.all([
      fetchProfile(otherUserId),
      fetchDirectMessages(myId, otherUserId),
    ]).then(([profile, msgs]) => {
      if (!active) return
      setOtherUser(profile)
      setMessages(msgs)
      setLoading(false)
    })

    // Mark incoming messages as read
    markMessagesRead(myId, otherUserId)

    return () => { active = false }
  }, [myId, otherUserId])

  // Supabase Realtime — listen for new incoming messages
  useEffect(() => {
    if (!myId || !otherUserId) return

    const channel = supabase
      .channel(`dm-${[myId, otherUserId].sort().join('-')}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `recipient_id=eq.${myId}`,
        },
        (payload) => {
          const msg = payload.new as any
          // Only care about messages from our current conversation partner
          if (msg.sender_id !== otherUserId) return
          setMessages(prev => {
            // Avoid duplicates
            if (prev.some(m => m.id === msg.id)) return prev
            return [...prev, {
              id: msg.id,
              senderId: msg.sender_id,
              recipientId: msg.recipient_id,
              body: msg.body,
              isRead: msg.is_read,
              createdAt: msg.created_at,
            }]
          })
          markMessagesRead(myId, otherUserId)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [myId, otherUserId])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80)
    }
  }, [messages.length])

  async function handleSend() {
    const body = text.trim()
    if (!body || !myId || !otherUserId) return
    setText('')
    setSending(true)

    // Optimistic update
    const optimisticId = `opt-${Date.now()}`
    const optimistic: DirectMessage = {
      id: optimisticId,
      senderId: myId,
      recipientId: otherUserId,
      body,
      isRead: false,
      createdAt: new Date().toISOString(),
    }
    setMessages(prev => [...prev, optimistic])

    const sent = await sendDirectMessage(myId, otherUserId, body)
    setSending(false)
    if (sent) {
      // Replace optimistic with real message
      setMessages(prev => prev.map(m => m.id === optimisticId ? sent : m))
    } else {
      // Remove optimistic on failure
      setMessages(prev => prev.filter(m => m.id !== optimisticId))
      setText(body)
    }
  }

  if (loading) {
    return (
      <View style={[styles.root, styles.centered]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    )
  }

  if (!otherUser) {
    return (
      <View style={[styles.root, styles.centered]}>
        <Pressable onPress={() => router.back()} style={styles.backBtnAbs}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.notFound}>User not found</Text>
      </View>
    )
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Pressable
          style={styles.headerCenter}
          onPress={() => router.push(`/user/${otherUser.username}` as any)}
        >
          <InitialsAvatar
            name={otherUser.displayName || otherUser.username}
            photoUrl={otherUser.avatarUrl}
            size={36}
          />
          <View style={styles.headerInfo}>
            <Text style={styles.headerName}>
              {otherUser.displayName || otherUser.username}
            </Text>
            <Text style={styles.headerHandle}>@{otherUser.username}</Text>
          </View>
        </Pressable>
        <View style={styles.headerSpacer} />
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: false })}
        ListEmptyComponent={
          <View style={styles.emptyThread}>
            <InitialsAvatar
              name={otherUser.displayName || otherUser.username}
              photoUrl={otherUser.avatarUrl}
              size={64}
            />
            <Text style={styles.emptyThreadName}>
              {otherUser.displayName || otherUser.username}
            </Text>
            <Text style={styles.emptyThreadSub}>@{otherUser.username}</Text>
            <Text style={styles.emptyThreadHint}>
              Send a message to start the conversation
            </Text>
          </View>
        }
        renderItem={({ item, index }) => {
          const isMe = item.senderId === myId
          const prevMsg = index > 0 ? messages[index - 1] : null
          const prevSameSender = prevMsg?.senderId === item.senderId
          const showAvatar = !isMe && !prevSameSender

          // Show timestamp if first message or >10 min gap from previous
          const showTime = !prevMsg ||
            (new Date(item.createdAt).getTime() - new Date(prevMsg.createdAt).getTime()) > 10 * 60 * 1000

          return (
            <View>
              {showTime && (
                <Text style={styles.timeSeparator}>{formatTime(item.createdAt)}</Text>
              )}
              <View style={[styles.msgRow, isMe && styles.msgRowMe]}>
                {!isMe && (
                  <View style={styles.msgAvatarSlot}>
                    {showAvatar && (
                      <InitialsAvatar
                        name={otherUser.displayName || otherUser.username}
                        photoUrl={otherUser.avatarUrl}
                        size={28}
                      />
                    )}
                  </View>
                )}
                <View style={[
                  styles.bubble,
                  isMe ? styles.bubbleMe : styles.bubbleThem,
                  prevSameSender && isMe && styles.bubbleMeGrouped,
                  prevSameSender && !isMe && styles.bubbleThemGrouped,
                ]}>
                  <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
                    {item.body}
                  </Text>
                </View>
              </View>
            </View>
          )
        }}
      />

      {/* Compose bar */}
      <View style={styles.compose}>
        <TextInput
          style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
          placeholder="Message…"
          placeholderTextColor={colors.textTertiary}
          value={text}
          onChangeText={setText}
          multiline
          returnKeyType="send"
          blurOnSubmit={false}
          onSubmitEditing={handleSend}
        />
        <Pressable
          style={[styles.sendBtn, (!text.trim() || sending) && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!text.trim() || sending}
        >
          {sending
            ? <ActivityIndicator size="small" color="#fff" />
            : <SendIcon size={18} color={text.trim() ? '#fff' : colors.textTertiary} />
          }
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnAbs: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    left: 16,
    padding: 4,
  },
  notFound: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 8,
  },
  backBtn: { padding: 4 },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerInfo: { gap: 1 },
  headerName: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  headerHandle: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  headerSpacer: { width: 28 },
  messageList: {
    padding: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  timeSeparator: {
    color: colors.textTertiary,
    fontSize: 11,
    textAlign: 'center',
    marginVertical: 12,
  },
  emptyThread: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    gap: 8,
  },
  emptyThreadName: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 12,
  },
  emptyThreadSub: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyThreadHint: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: 8,
    textAlign: 'center',
  },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    marginVertical: 1,
  },
  msgRowMe: {
    justifyContent: 'flex-end',
  },
  msgAvatarSlot: {
    width: 28,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '72%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
  },
  bubbleMe: {
    backgroundColor: colors.accent,
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: colors.surface1,
    borderBottomLeftRadius: 4,
  },
  bubbleMeGrouped: {
    borderBottomRightRadius: 18,
    borderTopRightRadius: 4,
  },
  bubbleThemGrouped: {
    borderBottomLeftRadius: 18,
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 21,
  },
  bubbleTextMe: {
    color: '#fff',
  },
  compose: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface1,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 9,
    color: colors.textPrimary,
    fontSize: 15,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.surface2,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: colors.surface2,
  },
})
