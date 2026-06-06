import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  TextInput,
  Keyboard,
  Dimensions,
  Platform,
  Image,
} from 'react-native'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { X, Heart, Send, ProBadge } from '@/components/Icons'
import {
  fetchComments, addComment, deleteComment,
  toggleCommentLike, fetchLikedCommentIds, fetchProfile,
} from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import { colors, timeAgo } from '@/constants/throttlist'
import { router } from 'expo-router'
import InitialsAvatar from '@/components/InitialsAvatar'
import type { Comment } from '@/types'

interface CommentSheetProps {
  visible: boolean
  postId: string
  onClose: () => void
}

interface CommentRowProps {
  comment: Comment
  isMine: boolean
  isReply?: boolean
  isLiked: boolean
  onDelete: (id: string) => void
  onReport: (id: string) => void
  onReply: (comment: Comment) => void
  onToggleLike: (comment: Comment) => void
}

function CommentRow({ comment, isMine, isReply, isLiked, onDelete, onReport, onReply, onToggleLike }: CommentRowProps) {
  const [actionsOpen, setActionsOpen] = useState(false)

  return (
    <View style={[styles.commentRow, isReply && styles.commentRowReply]}>
      {isReply && <View style={styles.replyLine} />}

      <View style={styles.avatarCol}>
        {comment.avatarUrl ? (
          <Image source={{ uri: comment.avatarUrl }} style={[styles.avatar, isReply && styles.avatarSmall]} />
        ) : (
          <InitialsAvatar name={comment.displayName ?? comment.username ?? '?'} size={isReply ? 28 : 34} />
        )}
        {!isReply && (comment.isPinned === '1' || comment.isPinned === 1) ? (
          <View style={styles.pinnedDot} />
        ) : null}
      </View>

      <Pressable
        style={styles.commentBody}
        onLongPress={() => setActionsOpen(v => !v)}
        delayLongPress={400}
      >
        <View style={styles.commentTop}>
          <View style={styles.usernameRow}>
            <Text
              style={[styles.commentUsername, isReply && styles.commentUsernameSmall]}
              onPress={() => router.push(`/user/${comment.username}`)}
            >
              @{comment.username}
            </Text>
            {comment.isPro && <ProBadge size={11} />}
          </View>
          <Text style={styles.commentTime}>{timeAgo(comment.createdAt)}</Text>
        </View>
        <Text style={[styles.commentText, isReply && styles.commentTextSmall]}>
          {comment.body}
        </Text>

        <View style={styles.commentMeta}>
          {actionsOpen ? (
            <View style={styles.actionRow}>
              {isMine ? (
                <Pressable
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => { onDelete(comment.id); setActionsOpen(false) }}
                >
                  <Text style={styles.deleteBtnText}>Delete</Text>
                </Pressable>
              ) : (
                <Pressable
                  style={[styles.actionBtn, styles.reportBtn]}
                  onPress={() => { onReport(comment.id); setActionsOpen(false) }}
                >
                  <Text style={styles.reportBtnText}>Report</Text>
                </Pressable>
              )}
              <Pressable style={styles.actionBtn} onPress={() => setActionsOpen(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
            </View>
          ) : (
            <Text onPress={() => onReply(comment)} style={styles.replyBtnText}>
              Reply
            </Text>
          )}
        </View>
      </Pressable>

      <Pressable style={styles.likeCol} onPress={() => onToggleLike(comment)}>
        <Heart
          size={isReply ? 14 : 16}
          color={isLiked ? colors.accent : colors.textTertiary}
          fill={isLiked ? colors.accent : 'none'}
        />
        <Text style={[styles.likeCount, isLiked && { color: colors.accent }]}>
          {comment.likes + (isLiked ? 1 : 0)}
        </Text>
      </Pressable>
    </View>
  )
}

const SCREEN_HEIGHT = Dimensions.get('window').height
const DEFAULT_SHEET_HEIGHT = SCREEN_HEIGHT * 0.70

export default function CommentSheet({ visible, postId, onClose }: CommentSheetProps) {
  const { user: authUser } = useAuth()

  const { data: myProfile } = useQuery({
    queryKey: ['profile', authUser?.id],
    queryFn: () => fetchProfile(authUser!.id),
    enabled: !!authUser?.id,
    staleTime: 5 * 60_000,
  })

  const queryClient = useQueryClient()
  const [draft, setDraft] = useState('')
  const [sending, setSending] = useState(false)
  const [localComments, setLocalComments] = useState<Comment[]>([])
  const [deletedIds, setDeletedIds] = useState<Set<string>>(new Set())
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const [sendError, setSendError] = useState<string | null>(null)
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set())
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const inputRef = useRef<TextInput>(null)

  // Track keyboard height to expand the sheet and eliminate the gap
  useEffect(() => {
    if (Platform.OS === 'web') return
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow'
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide'
    const onShow = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height))
    const onHide = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0))
    return () => { onShow.remove(); onHide.remove() }
  }, [])

  // Reset state when sheet closes
  useEffect(() => {
    if (!visible) {
      setKeyboardHeight(0)
      setDraft('')
      setReplyingTo(null)
      setSendError(null)
      setLocalComments([])
      setDeletedIds(new Set())
    }
  }, [visible])

  const { data: fetched = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId),
    enabled: visible && !!postId,
  })

  useEffect(() => {
    if (!authUser?.id || fetched.length === 0) return
    const ids = fetched.map(c => c.id)
    fetchLikedCommentIds(authUser.id, ids).then(liked => setLikedIds(liked))
  }, [authUser?.id, fetched.length])

  const allComments = [
    ...fetched.filter(c => !deletedIds.has(c.id)),
    ...localComments.filter(c => !deletedIds.has(c.id)),
  ]
  const topLevel = allComments
    .filter(c => !c.parentId)
    .sort((a, b) => {
      const ap = a.isPinned === '1' || a.isPinned === 1 ? 1 : 0
      const bp = b.isPinned === '1' || b.isPinned === 1 ? 1 : 0
      return bp - ap
    })
  const repliesById: Record<string, Comment[]> = {}
  allComments.filter(c => c.parentId).forEach(c => {
    const key = c.parentId!
    if (!repliesById[key]) repliesById[key] = []
    repliesById[key].push(c)
  })

  type ListItem = { comment: Comment; isReply: boolean }
  const listItems: ListItem[] = []
  topLevel.forEach(parent => {
    listItems.push({ comment: parent, isReply: false })
    ;(repliesById[parent.id] ?? []).forEach(reply => {
      listItems.push({ comment: reply, isReply: true })
    })
  })

  function handleReply(comment: Comment) {
    setReplyingTo(comment)
    setTimeout(() => inputRef.current?.focus(), 50)
  }

  async function handleSend() {
    const body = draft.trim()
    if (!body || !authUser) return
    setSending(true)
    setDraft('')
    setReplyingTo(null)

    const parentId = replyingTo
      ? (replyingTo.parentId ?? replyingTo.id)
      : undefined

    const tempId = `local_${Date.now()}`
    const optimistic: Comment = {
      id: tempId,
      body,
      authorUserId: authUser.id,
      parentId,
      targetType: 'post',
      targetId: postId,
      likes: 0,
      isPinned: '0',
      createdAt: new Date().toISOString(),
      username: myProfile?.username ?? authUser.email?.split('@')[0],
      displayName: myProfile?.displayName ?? myProfile?.username ?? authUser.email?.split('@')[0],
      avatarUrl: myProfile?.avatarUrl ?? '',
    }
    setLocalComments(prev => [...prev, optimistic])

    setSendError(null)
    try {
      await addComment(authUser.id, postId, body, parentId)
      setLocalComments(prev => prev.filter(c => c.id !== tempId))
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })

      const bumpPost = (old: any) => {
        if (!old) return old
        if (Array.isArray(old))
          return old.map((p: any) =>
            p.id === postId ? { ...p, commentCount: (p.commentCount ?? 0) + 1 } : p
          )
        if (old.id === postId) return { ...old, commentCount: (old.commentCount ?? 0) + 1 }
        return old
      }
      queryClient.setQueriesData({ queryKey: ['feed-posts'] }, bumpPost)
      queryClient.setQueriesData({ queryKey: ['post', postId] }, bumpPost)
    } catch (e: any) {
      const msg = e?.message ?? JSON.stringify(e) ?? 'Failed to save comment'
      setSendError(msg)
      console.error('[CommentSheet] addComment failed:', e)
    } finally {
      setSending(false)
    }
  }

  function handleToggleCommentLike(comment: Comment) {
    if (!authUser?.id) return
    const wasLiked = likedIds.has(comment.id)
    setLikedIds(prev => {
      const next = new Set(prev)
      if (wasLiked) next.delete(comment.id)
      else next.add(comment.id)
      return next
    })
    toggleCommentLike(authUser.id, comment.id, wasLiked).catch(() => {
      setLikedIds(prev => {
        const next = new Set(prev)
        if (wasLiked) next.add(comment.id)
        else next.delete(comment.id)
        return next
      })
    })
  }

  async function handleDelete(id: string) {
    setDeletedIds(prev => new Set([...prev, id]))
    try {
      await deleteComment(id, postId)
      queryClient.invalidateQueries({ queryKey: ['comments', postId] })
      const dropPost = (old: any) => {
        if (!old) return old
        if (Array.isArray(old))
          return old.map((p: any) =>
            p.id === postId ? { ...p, commentCount: Math.max(0, (p.commentCount ?? 1) - 1) } : p
          )
        if (old.id === postId) return { ...old, commentCount: Math.max(0, (old.commentCount ?? 1) - 1) }
        return old
      }
      queryClient.setQueriesData({ queryKey: ['feed-posts'] }, dropPost)
      queryClient.setQueriesData({ queryKey: ['post', postId] }, dropPost)
    } catch {
      setDeletedIds(prev => { const s = new Set(prev); s.delete(id); return s })
    }
  }

  function handleReport(_id: string) {
    // TODO: report flow
  }

  const isKeyboardOpen = keyboardHeight > 0
  const totalCount = listItems.length

  // Sheet sits directly above the keyboard with no gap.
  // When keyboard is open: sheet fills exactly the space above it (full screen appearance).
  // When keyboard is closed: sheet is 70% of screen height.
  const sheetStyle = Platform.OS !== 'web'
    ? {
        height: isKeyboardOpen ? SCREEN_HEIGHT - keyboardHeight : DEFAULT_SHEET_HEIGHT,
        bottom: keyboardHeight,
        borderTopLeftRadius: isKeyboardOpen ? 0 : 18,
        borderTopRightRadius: isKeyboardOpen ? 0 : 18,
      }
    : {}

  const inputBottomPad = isKeyboardOpen ? 10 : (Platform.OS === 'ios' ? 28 : 10)

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Full-screen backdrop */}
      <View style={styles.modalRoot}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} />

        <View style={[styles.sheet, sheetStyle]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              Comments{totalCount > 0 ? ` (${totalCount})` : ''}
            </Text>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Comment list fills remaining space */}
          <FlatList
            data={listItems}
            keyExtractor={item => item.comment.id}
            renderItem={({ item }) => (
              <CommentRow
                comment={item.comment}
                isMine={item.comment.authorUserId === authUser?.id}
                isReply={item.isReply}
                isLiked={likedIds.has(item.comment.id)}
                onDelete={handleDelete}
                onReport={handleReport}
                onReply={handleReply}
                onToggleLike={handleToggleCommentLike}
              />
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Text style={styles.emptyText}>No comments yet. Be the first.</Text>
              </View>
            }
            contentContainerStyle={styles.listContent}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />

          {/* Reply banner */}
          {replyingTo && (
            <View style={styles.replyBanner}>
              <Text style={styles.replyBannerText}>
                Replying to{' '}
                <Text style={styles.replyBannerUsername}>@{replyingTo.username}</Text>
              </Text>
              <Pressable onPress={() => setReplyingTo(null)} hitSlop={8}>
                <X size={14} color={colors.textTertiary} />
              </Pressable>
            </View>
          )}

          {/* Error banner */}
          {sendError && (
            <View style={styles.errorBanner}>
              <Text style={styles.errorBannerText}>⚠ {sendError}</Text>
            </View>
          )}

          {/* Input row: avatar + input field with send pill inside */}
          <View style={[styles.inputRow, { paddingBottom: inputBottomPad }]}>
            <InitialsAvatar
              name={myProfile?.displayName ?? myProfile?.username ?? authUser?.email?.split('@')[0] ?? '?'}
              photoUrl={myProfile?.avatarUrl}
              size={34}
            />
            <View style={styles.inputWrap}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                placeholder={
                  !authUser
                    ? 'Sign in to comment…'
                    : replyingTo
                    ? `Reply to @${replyingTo.username}…`
                    : 'Add a comment…'
                }
                placeholderTextColor={colors.textTertiary}
                value={draft}
                onChangeText={setDraft}
                multiline
                maxLength={500}
                returnKeyType="send"
                onSubmitEditing={handleSend}
                editable={!!authUser}
              />
              {!!draft.trim() && (
                <Pressable
                  onPress={handleSend}
                  style={[styles.sendPill, sending && styles.sendPillDisabled]}
                  disabled={sending}
                >
                  <Send size={15} color="#fff" />
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  // Full-screen overlay — backdrop covers everything, sheet is absolute at bottom
  modalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.surface1,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    // Web fallback (no keyboard events)
    ...(Platform.OS === 'web' ? { maxHeight: '80%', minHeight: 300 } : {}),
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    color: colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: { padding: 4 },
  // FlatList fills all space between header and input bar
  list: {
    flex: 1,
  },
  listContent: {
    paddingVertical: 2,
    flexGrow: 1,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  commentRowReply: {
    paddingLeft: 28,
    backgroundColor: colors.surface1,
  },
  replyLine: {
    position: 'absolute',
    left: 40,
    top: 0,
    bottom: 0,
    width: 2,
    backgroundColor: colors.surface3,
  },
  avatarCol: { position: 'relative' },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  avatarSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  pinnedDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.accent,
    borderWidth: 1.5,
    borderColor: colors.surface1,
  },
  commentBody: { flex: 1 },
  commentTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  commentUsername: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  commentUsernameSmall: {
    fontSize: 12,
  },
  commentTime: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  commentText: {
    color: colors.textPrimary,
    fontSize: 14,
    lineHeight: 19,
  },
  commentTextSmall: {
    fontSize: 13,
    lineHeight: 18,
  },
  commentMeta: {
    marginTop: 5,
  },
  replyBtnText: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: colors.surface2,
  },
  deleteBtn: {
    backgroundColor: colors.accent + '22',
  },
  deleteBtnText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '600',
  },
  reportBtn: {
    backgroundColor: colors.surface2,
  },
  reportBtnText: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  cancelBtnText: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  likeCol: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
    width: 32,
  },
  likeCount: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
  },
  replyBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: colors.surface2,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  replyBannerText: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  replyBannerUsername: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  errorBanner: {
    backgroundColor: '#7f1d1d',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#ef4444',
  },
  errorBannerText: {
    color: '#fca5a5',
    fontSize: 12,
    lineHeight: 16,
  },
  // Input bar at the bottom
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  // Text field + send pill wrapper
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface2,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  input: {
    flex: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    color: colors.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  // Red send pill lives inside the input wrapper (only visible when text is present)
  sendPill: {
    margin: 4,
    backgroundColor: colors.accent,
    borderRadius: 17,
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPillDisabled: {
    opacity: 0.5,
  },
  empty: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
})
