/**
 * FollowBuildButton — standalone follow control for a single build.
 *
 * Feed pollution rationale:
 *   Throttlist follows are per-build, not per-creator. A creator can have
 *   a motorcycle build AND a keyboard build — subscribing at the creator
 *   level would surface unrelated content in followers' feeds. By following
 *   individual builds, each user's feed stays relevant to what they care
 *   about regardless of how many categories a creator covers.
 */
import React, { useState } from 'react'
import {
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native'
import { useQueryClient } from '@tanstack/react-query'
import { colors } from '@/constants/throttlist'
import { useAuth } from '@/lib/auth'
import { toggleBuildFollow } from '@/lib/supabaseQueries'

interface FollowBuildButtonProps {
  buildId: string
  /** Build owner's userId — used to invalidate their cached build list */
  ownerId: string
  isFollowing: boolean
  size?: 'sm' | 'md'
  onToggle?: (nowFollowing: boolean) => void
}

export default function FollowBuildButton({
  buildId,
  ownerId,
  isFollowing,
  size = 'md',
  onToggle,
}: FollowBuildButtonProps) {
  const { user: authUser } = useAuth()
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const [localFollowing, setLocalFollowing] = useState(isFollowing)

  async function handlePress() {
    if (!authUser?.id || loading) return
    const prev = localFollowing

    // Optimistic flip — button responds immediately
    setLocalFollowing(!prev)
    setLoading(true)

    try {
      await toggleBuildFollow(authUser.id, buildId, prev)

      // Invalidate all follow-related caches so counts and feed update
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['followed-build-ids', authUser.id] }),
        queryClient.invalidateQueries({ queryKey: ['followed-builds', authUser.id] }),
        queryClient.invalidateQueries({ queryKey: ['following-count', authUser.id] }),
        queryClient.invalidateQueries({ queryKey: ['user-builds', ownerId] }),
        queryClient.invalidateQueries({ queryKey: ['build-profile'] }),
      ])

      onToggle?.(!prev)
    } catch {
      setLocalFollowing(prev) // revert on failure
    } finally {
      setLoading(false)
    }
  }

  const sm = size === 'sm'

  return (
    <Pressable
      style={[styles.btn, localFollowing && styles.btnActive, sm && styles.btnSm]}
      onPress={handlePress}
      disabled={loading || !authUser?.id}
      accessibilityRole="button"
      accessibilityLabel={localFollowing ? 'Unfollow this build' : 'Follow this build'}
      accessibilityState={{ selected: localFollowing }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={localFollowing ? '#fff' : colors.accent}
        />
      ) : (
        <Text style={[styles.label, localFollowing && styles.labelActive, sm && styles.labelSm]}>
          {localFollowing ? 'Following' : 'Follow'}
        </Text>
      )}
    </Pressable>
  )
}

const styles = StyleSheet.create({
  btn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minWidth: 82,
    minHeight: 34,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  btnActive: {
    backgroundColor: colors.accent,
  },
  btnSm: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    minWidth: 66,
    minHeight: 28,
  },
  label: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  labelActive: {
    color: '#fff',
  },
  labelSm: {
    fontSize: 11,
  },
})
