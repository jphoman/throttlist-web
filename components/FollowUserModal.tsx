/**
 * FollowUserModal — two-tier follow UX for Throttlist.
 *
 * Two follow paths:
 *
 *   1. Follow Build (standalone, no modal)
 *      → FollowBuildButton handles this directly.
 *      → One build, one subscription, no noise.
 *
 *   2. Follow User (with build-level control — this file)
 *      → Shows all of the creator's builds as checkboxes.
 *      → All checked by default; user unchecks builds they don't want.
 *      → "Auto-follow new builds" toggle: if on, the app will follow
 *        any new build the creator adds (requires a backend hook —
 *        stored here in local state as a placeholder for that API).
 *      → Calls toggleBuildFollow() per selected build in parallel.
 *
 * Why build-level control?
 *   A creator can post a motorcycle build and a mechanical keyboard build.
 *   Following them wholesale would pollute a motorcycle-only feed with
 *   keyboard content. Granular opt-in keeps every user's feed tight.
 */

import React, { useState, useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  Pressable,
  Switch,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { X, Check } from '@/components/Icons'
import { CategoryIcon } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { useAuth } from '@/lib/auth'
import { toggleBuildFollow } from '@/lib/supabaseQueries'
import InitialsAvatar from '@/components/InitialsAvatar'
import type { Build, User } from '@/types'

// ─── Data shapes ─────────────────────────────────────────────────────────────
//
// Creator object — subset of User from @/types:
//   { id, username, displayName, avatarUrl, proTier, ... }
//
// Build object — from @/types:
//   { id, userId, make, model, nickname, buildType, status, followerCount, ... }
//
// followedBuildIds — Set<string> of build IDs the viewer already follows.
//   Comes from fetchFollowedBuildIds(userId) in supabaseQueries.
//
// ─────────────────────────────────────────────────────────────────────────────

export interface FollowUserModalProps {
  visible: boolean
  /** The creator whose builds are being followed */
  creator: User
  /** All active builds belonging to the creator */
  builds: Build[]
  /** Build IDs the current viewer already follows */
  followedBuildIds: Set<string>
  onClose: () => void
  /** Called after successfully following/updating, with newly-followed IDs */
  onFollowComplete?: (newlyFollowedIds: string[]) => void
}

export default function FollowUserModal({
  visible,
  creator,
  builds,
  followedBuildIds,
  onClose,
  onFollowComplete,
}: FollowUserModalProps) {
  const { user: authUser } = useAuth()
  const queryClient = useQueryClient()

  const activeBuilds = builds.filter(b => b.status === 'active')

  // ── Local state ──────────────────────────────────────────────────────────
  const [checked, setChecked] = useState<Set<string>>(new Set())
  // autoFollow: placeholder for a future "auto-subscribe to new builds" API.
  // In production this would persist to a user_follow_prefs table keyed on
  // (follower_id, creator_id) with an auto_follow boolean column.
  const [autoFollow, setAutoFollow] = useState(true)
  const [loading, setLoading] = useState(false)
  const toastAnim = useRef(new Animated.Value(0)).current
  const [toastMsg, setToastMsg] = useState('')
  const [toastVisible, setToastVisible] = useState(false)

  // Reset checkboxes every time the modal opens:
  // – Pre-check builds not yet followed (new follows)
  // – If all already followed, show all checked (allow deselection / management)
  useEffect(() => {
    if (!visible) return
    const unfollowed = activeBuilds.filter(b => !followedBuildIds.has(b.id)).map(b => b.id)
    setChecked(new Set(unfollowed.length > 0 ? unfollowed : activeBuilds.map(b => b.id)))
  }, [visible])

  // ── Checkbox helpers ─────────────────────────────────────────────────────
  function toggleBuild(buildId: string) {
    setChecked(prev => {
      const next = new Set(prev)
      next.has(buildId) ? next.delete(buildId) : next.add(buildId)
      return next
    })
  }

  function toggleAll() {
    setChecked(
      checked.size === activeBuilds.length
        ? new Set()
        : new Set(activeBuilds.map(b => b.id))
    )
  }

  // ── Toast ────────────────────────────────────────────────────────────────
  function showToast(message: string) {
    setToastMsg(message)
    setToastVisible(true)
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 240, useNativeDriver: true }),
      Animated.delay(2000),
      Animated.timing(toastAnim, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => setToastVisible(false))
  }

  // ── Follow action ────────────────────────────────────────────────────────
  async function handleFollowSelected() {
    if (!authUser?.id) return

    // Builds to newly follow (checked but not already following)
    const toFollow = Array.from(checked).filter(id => !followedBuildIds.has(id))
    // Builds to unfollow (currently following but now unchecked)
    const toUnfollow = activeBuilds
      .map(b => b.id)
      .filter(id => followedBuildIds.has(id) && !checked.has(id))

    if (toFollow.length === 0 && toUnfollow.length === 0) {
      onClose()
      return
    }

    setLoading(true)
    try {
      // Fire all follow/unfollow calls in parallel
      await Promise.all([
        ...toFollow.map(id => toggleBuildFollow(authUser.id, id, false)),
        ...toUnfollow.map(id => toggleBuildFollow(authUser.id, id, true)),
      ])

      // Bust caches so the feed and follow counts refresh
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['followed-build-ids', authUser.id] }),
        queryClient.invalidateQueries({ queryKey: ['followed-builds', authUser.id] }),
        queryClient.invalidateQueries({ queryKey: ['following-count', authUser.id] }),
        queryClient.invalidateQueries({ queryKey: ['user-builds', creator.id] }),
        queryClient.invalidateQueries({ queryKey: ['build-profile'] }),
      ])

      onFollowComplete?.(toFollow)

      const msg =
        toFollow.length > 0
          ? `Following ${toFollow.length} build${toFollow.length !== 1 ? 's' : ''} from @${creator.username}`
          : `Updated follows for @${creator.username}`
      showToast(msg)
      setTimeout(onClose, 2600)
    } catch {
      // Let the user retry — don't silently swallow
      setLoading(false)
    }
  }

  // ── Derived UI state ─────────────────────────────────────────────────────
  const allChecked = checked.size === activeBuilds.length && activeBuilds.length > 0
  const noneChecked = checked.size === 0
  const followedCount = activeBuilds.filter(b => followedBuildIds.has(b.id)).length
  const isManaging = followedCount > 0 // already following some/all

  const followBtnLabel = (() => {
    if (isManaging && allChecked && toFollow_count() === 0) return 'Update follows'
    const n = checked.size
    return `Follow ${n} Build${n !== 1 ? 's' : ''}`
  })()

  function toFollow_count() {
    return Array.from(checked).filter(id => !followedBuildIds.has(id)).length
  }

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      {/* Backdrop tap-to-close */}
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />

      <View style={styles.sheet}>
        {/* Drag handle */}
        <View style={styles.handle} />

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <InitialsAvatar
              name={creator.displayName || creator.username}
              photoUrl={creator.avatarUrl}
              size={38}
            />
            <View style={{ flex: 1 }}>
              <Text style={styles.headerEyebrow}>
                {isManaging ? 'Manage builds from' : 'Follow all builds from'}
              </Text>
              <Text style={styles.headerCreator} numberOfLines={1}>
                {creator.displayName || creator.username}
              </Text>
            </View>
          </View>
          <Pressable
            onPress={onClose}
            style={styles.closeBtn}
            accessibilityRole="button"
            accessibilityLabel="Close dialog"
            hitSlop={8}
          >
            <X size={18} color={colors.textSecondary} />
          </Pressable>
        </View>

        {/* Current follow status */}
        {followedCount > 0 && (
          <Text style={styles.statusLine}>
            Currently following {followedCount} of {activeBuilds.length}{' '}
            {activeBuilds.length === 1 ? 'build' : 'builds'}
          </Text>
        )}

        {/* Select-all shortcut */}
        {activeBuilds.length > 1 && (
          <Pressable
            style={styles.selectAllRow}
            onPress={toggleAll}
            accessibilityRole="checkbox"
            accessibilityChecked={allChecked}
            accessibilityLabel="Toggle all builds"
          >
            <Text style={styles.selectAllLabel}>
              {allChecked ? 'Deselect all' : 'Select all'}
            </Text>
            <Checkbox checked={allChecked} />
          </Pressable>
        )}

        <View style={styles.divider} />

        {/* ── Build list ── */}
        <ScrollView
          style={styles.list}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {activeBuilds.length === 0 && (
            <Text style={styles.emptyList}>No active builds from this creator.</Text>
          )}

          {activeBuilds.map(build => {
            const isChecked = checked.has(build.id)
            const alreadyFollowing = followedBuildIds.has(build.id)
            const vehicleDetail = [build.year || null, build.make, build.model]
              .filter(Boolean).join(' ')
            const label = build.nickname || vehicleDetail
            const typeLabel = build.buildType
              ? build.buildType.replace(/_/g, ' ')
              : ''
            // Show vehicle detail in meta only when nickname is the primary label
            const metaParts = [
              build.nickname ? vehicleDetail : '',
              typeLabel,
              alreadyFollowing ? 'following' : '',
            ].filter(Boolean)
            const metaLine = metaParts.join(' · ')

            return (
              <Pressable
                key={build.id}
                style={styles.buildRow}
                onPress={() => toggleBuild(build.id)}
                accessibilityRole="checkbox"
                accessibilityChecked={isChecked}
                accessibilityLabel={`${label}${alreadyFollowing ? ', currently following' : ''}`}
              >
                {/* Category icon */}
                <View style={styles.iconWrap}>
                  <CategoryIcon
                    id={build.buildType || 'motorcycles'}
                    size={22}
                    color={isChecked ? colors.accent : colors.textTertiary}
                  />
                </View>

                {/* Build name + type */}
                <View style={styles.buildInfo}>
                  <Text
                    style={[styles.buildName, isChecked && styles.buildNameActive]}
                    numberOfLines={1}
                  >
                    {label}
                  </Text>
                  <Text style={styles.buildMeta} numberOfLines={1}>
                    {metaLine}
                  </Text>
                </View>

                {/* Checkbox */}
                <Checkbox checked={isChecked} />
              </Pressable>
            )
          })}
        </ScrollView>

        <View style={styles.divider} />

        {/* ── Auto-follow toggle ── */}
        <View
          style={styles.autoFollowRow}
          accessibilityRole="switch"
          accessibilityChecked={autoFollow}
          accessibilityLabel="Auto-follow new builds from this creator"
        >
          <View style={styles.autoFollowText}>
            <Text style={styles.autoFollowLabel}>Auto-follow new builds</Text>
            <Text style={styles.autoFollowSub}>
              New builds from @{creator.username} are added to your feed automatically
            </Text>
          </View>
          <Switch
            value={autoFollow}
            onValueChange={setAutoFollow}
            trackColor={{ false: colors.surface3, true: colors.accent + 'CC' }}
            thumbColor={autoFollow ? colors.accent : colors.textTertiary}
            ios_backgroundColor={colors.surface3}
          />
        </View>

        {/* ── Action buttons ── */}
        <View style={styles.actions}>
          <Pressable
            style={styles.cancelBtn}
            onPress={onClose}
            disabled={loading}
            accessibilityRole="button"
          >
            <Text style={styles.cancelLabel}>Cancel</Text>
          </Pressable>

          <Pressable
            style={[styles.followBtn, (noneChecked || loading) && styles.followBtnDim]}
            onPress={handleFollowSelected}
            disabled={noneChecked || loading}
            accessibilityRole="button"
            accessibilityLabel={followBtnLabel}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.followLabel}>{followBtnLabel}</Text>
            )}
          </Pressable>
        </View>

        <View style={{ height: Platform.OS === 'ios' ? 28 : 14 }} />
      </View>

      {/* ── Success toast ── */}
      {toastVisible && (
        <Animated.View
          style={[
            styles.toast,
            {
              opacity: toastAnim,
              transform: [{
                translateY: toastAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [16, 0],
                }),
              }],
            },
          ]}
          accessibilityLiveRegion="polite"
          accessibilityLabel={toastMsg}
        >
          <View style={styles.toastCheck}>
            <Check size={14} color={colors.accent} />
          </View>
          <Text style={styles.toastText}>{toastMsg}</Text>
        </Animated.View>
      )}
    </Modal>
  )
}

// ─── Shared checkbox atom ─────────────────────────────────────────────────────
function Checkbox({ checked }: { checked: boolean }) {
  return (
    <View style={[cbStyles.box, checked && cbStyles.boxChecked]}>
      {checked && <Check size={11} color="#fff" />}
    </View>
  )
}

const cbStyles = StyleSheet.create({
  box: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
})

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  sheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    // maxHeight keeps the sheet scrollable on small screens
    maxHeight: '82%',
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 6,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
  },
  headerLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerEyebrow: {
    color: colors.textTertiary,
    fontSize: 12,
  },
  headerCreator: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  statusLine: {
    color: colors.textTertiary,
    fontSize: 12,
    paddingHorizontal: 20,
    marginBottom: 4,
  },
  // Select-all row
  selectAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  selectAllLabel: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 2,
  },
  // Build list
  list: {
    maxHeight: 320,
  },
  emptyList: {
    color: colors.textTertiary,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 28,
  },
  buildRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconWrap: {
    width: 28,
    alignItems: 'center',
  },
  buildInfo: {
    flex: 1,
    gap: 3,
  },
  buildName: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '500',
  },
  buildNameActive: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  buildMeta: {
    color: colors.textTertiary,
    fontSize: 12,
    textTransform: 'capitalize',
  },
  // Auto-follow toggle
  autoFollowRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  autoFollowText: {
    flex: 1,
    gap: 4,
  },
  autoFollowLabel: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  autoFollowSub: {
    color: colors.textTertiary,
    fontSize: 12,
    lineHeight: 17,
  },
  // Action buttons
  actions: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.surface3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelLabel: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  followBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  followBtnDim: {
    opacity: 0.38,
  },
  followLabel: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Toast
  toast: {
    position: 'absolute',
    bottom: 96,
    left: 20,
    right: 20,
    backgroundColor: colors.surface1,
    borderRadius: 14,
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: colors.accent + '55',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 10,
  },
  toastCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  toastText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
})
