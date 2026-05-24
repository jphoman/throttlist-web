import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Dimensions,
  ScrollView,
  Linking,
  ActivityIndicator,
} from 'react-native'
import Svg, { Path as SvgPath } from 'react-native-svg'
import { Heart, MessageCircle, Share2, ExternalLink, X, ProBadge, Tag } from '@/components/Icons'
import { colors, timeAgo, formatFollowers } from '@/constants/throttlist'
import { router } from 'expo-router'
import InitialsAvatar from '@/components/InitialsAvatar'
import CommentSheet from '@/components/CommentSheet'
import { fetchBuildParts } from '@/lib/supabaseQueries'
import type { Post, Part } from '@/types'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PHOTO_HEIGHT = Math.round(SCREEN_WIDTH * (4 / 3))

interface PostCardProps {
  post: Post
  parts?: Part[]
  onPartPress?: (part: Part) => void
  onBuildPress?: () => void
  onLike?: () => void
  onComment?: () => void
  onShare?: () => void
  onShopPress?: (part: Part) => void
}

export default function PostCard({
  post,
  parts = [],
  onPartPress,
  onBuildPress,
  onLike,
  onComment,
  onShare,
  onShopPress,
}: PostCardProps) {
  const [liked, setLiked] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [tagsOpen, setTagsOpen] = useState(false)
  const [commentSheetOpen, setCommentSheetOpen] = useState(false)
  const [fetchedParts, setFetchedParts] = useState<Part[] | null>(null)
  const [partsLoading, setPartsLoading] = useState(false)

  const photos: string[] = (() => {
    try { return JSON.parse(post.photos) } catch { return [] }
  })()
  const taggedIds: string[] = (() => {
    try { return JSON.parse(post.taggedPartIds) } catch { return [] }
  })()

  // Use pre-passed parts if available, otherwise use lazily fetched ones
  const resolvedParts = fetchedParts ?? parts
  const taggedParts = resolvedParts.filter(p => taggedIds.includes(p.id))
  const tagCount = taggedIds.length

  async function handleTagBadgePress() {
    if (tagsOpen) { setTagsOpen(false); return }
    // Fetch parts on first open if not already loaded
    if (fetchedParts === null && post.buildId) {
      setPartsLoading(true)
      try {
        const loaded = await fetchBuildParts(post.buildId)
        setFetchedParts(loaded)
      } finally {
        setPartsLoading(false)
      }
    }
    setTagsOpen(true)
  }


  function handleLike() {
    setLiked(!liked)
    onLike?.()
  }

  function openComments() {
    setCommentSheetOpen(true)
    onComment?.()
  }

  return (
    <View style={styles.card}>
      {photos.length > 0 ? (
        <View style={styles.photoWrap}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={e => {
              const idx = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH)
              setPhotoIndex(idx)
            }}
          >
            {photos.map((uri, i) => (
              <Pressable key={i} onPress={onBuildPress}>
                <Image source={{ uri }} style={styles.photo} resizeMode="cover" />
              </Pressable>
            ))}
          </ScrollView>

          <View style={styles.topScrim} pointerEvents="none" />

          <Pressable style={styles.overlayHeader} onPress={onBuildPress}>
            <InitialsAvatar
              name={post.displayName || post.username || post.buildMake}
              photoUrl={post.avatarUrl || null}
              size={34}
            />
            <View>
              <View style={styles.usernameRow}>
                <Text style={styles.overlayHandle}>@{post.username}</Text>
                {post.isPro && <ProBadge size={12} />}
              </View>
              <Text style={styles.overlayBuild} numberOfLines={1}>
                {post.buildNickname || `${post.buildYear} ${post.buildMake} ${post.buildModel}`}
              </Text>
            </View>
          </Pressable>

          {tagCount > 0 && (
            <Pressable style={styles.partsBadge} onPress={handleTagBadgePress}>
              <Svg width={48} height={20} viewBox="0 0 48 20">
                <SvgPath
                  d="M 14 0 L 44 0 Q 48 0 48 4 L 48 16 Q 48 20 44 20 L 14 20 C 9 20 3 13 3 10 C 3 7 9 0 14 0 Z M 13 10 m -2.5 0 a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0"
                  fill={colors.accent}
                  fillRule="evenodd"
                />
              </Svg>
              <View style={styles.partsBadgeContent}>
                <Text style={styles.partsBadgeText}>{tagCount}</Text>
              </View>
            </Pressable>
          )}

          {photos.length > 1 && (
            <View style={styles.dotRow} pointerEvents="none">
              {photos.map((_, i) => (
                <View key={i} style={[styles.dot, photoIndex === i && styles.dotActive]} />
              ))}
            </View>
          )}

          <View style={styles.overlayActions}>
            <Pressable style={styles.overlayActionBtn} onPress={handleLike}>
              <Heart
                size={22}
                color={liked ? colors.accent : '#FFFFFF'}
                fill={liked ? colors.accent : 'none'}
              />
              <Text style={[styles.overlayActionCount, liked && { color: colors.accent }]}>
                {formatFollowers(post.likeCount + (liked ? 1 : 0))}
              </Text>
            </Pressable>
            <Pressable style={styles.overlayActionBtn} onPress={openComments}>
              <MessageCircle size={22} color="#FFFFFF" />
              <Text style={styles.overlayActionCount}>{formatFollowers(post.commentCount)}</Text>
            </Pressable>
            <Pressable style={styles.overlayActionBtn} onPress={onShare}>
              <Share2 size={22} color="#FFFFFF" />
            </Pressable>
          </View>

          <Text style={styles.overlayTimestamp} pointerEvents="none">
            {timeAgo(post.createdAt)}
          </Text>

          {tagsOpen && (
            <Pressable style={styles.tagsOverlay} onPress={() => setTagsOpen(false)}>
              <Pressable onPress={e => e.stopPropagation()}>
                <View style={styles.tagsPanel}>
                  <View style={styles.tagsPanelHeader}>
                    <Text style={styles.tagsPanelTitle}>Tagged Parts</Text>
                    <Pressable onPress={() => setTagsOpen(false)} style={styles.tagsPanelClose}>
                      <X size={16} color={colors.textSecondary} />
                    </Pressable>
                  </View>
                  {partsLoading ? (
                    <View style={styles.tagsLoading}>
                      <ActivityIndicator size="small" color={colors.accent} />
                    </View>
                  ) : taggedParts.length > 0 ? (
                    taggedParts.map(part => (
                      <Pressable
                        key={part.id}
                        style={styles.tagRow}
                        onPress={() => {
                          if (part.type === 'linkable' && part.sourceUrl) {
                            Linking.openURL(part.sourceUrl)
                            onShopPress?.(part)
                          } else {
                            onPartPress?.(part)
                          }
                          setTagsOpen(false)
                        }}
                      >
                        <View style={[
                          styles.tagDot,
                          part.type === 'linkable' && { backgroundColor: colors.accent },
                          part.type === 'reference' && { backgroundColor: colors.reference },
                        ]} />
                        <View style={styles.tagInfo}>
                          <Text
                            style={[styles.tagName, part.type === 'linkable' && { color: colors.accent }]}
                            numberOfLines={1}
                          >
                            {part.name}
                          </Text>
                          {part.category && <Text style={styles.tagCategory}>{part.category}</Text>}
                        </View>
                        {part.type === 'linkable' && part.sourceUrl && (
                          <ExternalLink size={13} color={colors.accent} />
                        )}
                      </Pressable>
                    ))
                  ) : (
                    <View style={styles.tagsLoading}>
                      <Text style={{ color: colors.textTertiary, fontSize: 13 }}>No parts found</Text>
                    </View>
                  )}
                </View>
              </Pressable>
            </Pressable>
          )}
        </View>
      ) : (
        <Pressable style={styles.header} onPress={onBuildPress}>
          <InitialsAvatar
            name={post.displayName || post.username || post.buildMake}
            photoUrl={post.avatarUrl || null}
            size={38}
          />
          <View style={styles.headerInfo}>
            <View style={styles.usernameRow}>
              <Text style={styles.handle}>@{post.username}</Text>
              {post.isPro && <ProBadge size={12} />}
            </View>
            <Text style={styles.buildName} numberOfLines={1}>
              {post.buildNickname || `${post.buildYear} ${post.buildMake} ${post.buildModel}`}
            </Text>
          </View>
          <Text style={styles.timestamp}>{timeAgo(post.createdAt)}</Text>
        </Pressable>
      )}

      {/* Caption + comments + timestamp */}
      <View style={styles.postMeta}>
        {!!post.caption && (
          <Text style={styles.captionLine}>
            <Text style={styles.metaUsername}>{post.username} </Text>
            {post.caption}
          </Text>
        )}


        {post.commentCount > 0 && (
          <Pressable onPress={openComments}>
            <Text style={styles.viewAllText}>View all {post.commentCount} comments</Text>
          </Pressable>
        )}

        <Text style={styles.metaTimestamp}>{timeAgo(post.createdAt)}</Text>
      </View>

      <CommentSheet
        visible={commentSheetOpen}
        postId={post.id}
        onClose={() => setCommentSheetOpen(false)}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg,
    marginBottom: 2,
  },
  photoWrap: {
    position: 'relative',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    backgroundColor: colors.surface2,
  },
  topScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 80,
    backgroundColor: 'transparent',
  },
  overlayHeader: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
  },
  overlayHandle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  overlayBuild: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 11,
    marginTop: 1,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    maxWidth: SCREEN_WIDTH * 0.5,
  },
  overlayActions: {
    position: 'absolute',
    bottom: 14,
    right: 12,
    alignItems: 'center',
    gap: 16,
  },
  overlayActionBtn: {
    alignItems: 'center',
    gap: 3,
  },
  overlayActionCount: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  overlayTimestamp: {
    position: 'absolute',
    bottom: 14,
    left: 14,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  partsBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 48,
    height: 20,
  },
  partsBadgeContent: {
    position: 'absolute',
    left: 17,
    right: 2,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  partsBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  dotRow: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 5,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  dotActive: {
    backgroundColor: '#FFFFFF',
  },
  tagsOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
  },
  tagsPanel: {
    backgroundColor: 'rgba(10,10,10,0.92)',
    borderTopWidth: 1,
    borderTopColor: colors.surface2,
    paddingBottom: 8,
  },
  tagsPanelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface2,
  },
  tagsPanelTitle: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  tagsPanelClose: {
    padding: 4,
  },
  tagsLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface2 + '88',
  },
  tagDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.surface2,
    flexShrink: 0,
  },
  tagInfo: {
    flex: 1,
  },
  tagName: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  tagCategory: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    gap: 10,
  },
  headerInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  handle: {
    color: colors.accent,
    fontSize: 13,
    fontWeight: '700',
  },
  buildName: {
    color: colors.textSecondary,
    fontSize: 12,
    marginTop: 1,
  },
  timestamp: {
    color: colors.textSecondary,
    fontSize: 12,
  },
  postMeta: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
  },
  captionLine: {
    fontSize: 13,
    lineHeight: 19,
    color: colors.textPrimary,
  },
  metaUsername: {
    fontWeight: '600',
    fontSize: 13,
    color: colors.textPrimary,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 19,
    color: colors.textSecondary,
    fontWeight: '400',
  },
  viewAllText: {
    color: colors.textTertiary,
    fontSize: 13,
    marginTop: 4,
  },
  metaTimestamp: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
})
