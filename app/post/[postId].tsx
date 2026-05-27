import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  Dimensions,
  Platform,
} from 'react-native'
import * as WebBrowser from 'expo-web-browser'
import { useLocalSearchParams, router } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import Svg, { Path as SvgPath } from 'react-native-svg'
import { ArrowLeft, Heart, MessageCircle, Share2, ExternalLink, MoreHorizontal, ProBadge, X as XIcon } from '@/components/Icons'
import { fetchPost, fetchComments, toggleLike, updatePost, deletePost } from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import { colors, timeAgo, formatFollowers } from '@/constants/throttlist'
import { BUILD_CATEGORIES } from '@/constants/buildTypes'
import InitialsAvatar from '@/components/InitialsAvatar'
import CommentSheet from '@/components/CommentSheet'
import PostEditSheet from '@/components/PostEditSheet'
import ShareSheet from '@/components/ShareSheet'

const { width: SCREEN_WIDTH } = Dimensions.get('window')
const PHOTO_HEIGHT = Math.round(SCREEN_WIDTH * 0.9)

export default function PostDetailScreen() {
  const { postId } = useLocalSearchParams<{ postId: string }>()
  const [liked, setLiked] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [commentSheetOpen, setCommentSheetOpen] = useState(false)
  const [shareSheetOpen, setShareSheetOpen] = useState(false)
  const [editSheetOpen, setEditSheetOpen] = useState(false)
  const [isPinned, setIsPinned] = useState(false)
  const [localCaption, setLocalCaption] = useState<string | null>(null)
  const [localPhotos, setLocalPhotos] = useState<string[] | null>(null)
  const [deleted, setDeleted] = useState(false)
  const [tagsSheetOpen, setTagsSheetOpen] = useState(false)

  const { user: authUser } = useAuth()
  const queryClient = useQueryClient()

  const { data: post, isLoading } = useQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId!),
    enabled: !!postId,
  })

  const { data: fetchedComments = [] } = useQuery({
    queryKey: ['comments', postId],
    queryFn: () => fetchComments(postId!),
    enabled: !!postId,
  })

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.photoSkeleton} />
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>
      </View>
    )
  }

  if (!post) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>
        <Text style={styles.notFound}>Post not found</Text>
      </View>
    )
  }

  const isOwner = post.userId === authUser?.id
  const displayCaption = localCaption ?? post.caption
  const photos: string[] = localPhotos ?? (() => { try { return JSON.parse(post.photos) } catch { return [] } })()
  const linkedProducts: import('@/types').LinkedProduct[] = (() => { try { return JSON.parse(post.linkedProducts) } catch { return [] } })()

  const topComments = [...fetchedComments]
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3)
  const totalCommentCount = fetchedComments.length || post.commentCount

  if (deleted) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>
        <Text style={styles.notFound}>Post deleted</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Floating nav */}
      <View style={styles.navRow}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color="rgba(255,255,255,0.5)" />
        </Pressable>
        {isOwner && (
          <Pressable onPress={() => setEditSheetOpen(true)} style={styles.backBtn}>
            <MoreHorizontal size={20} color={colors.textSecondary} />
          </Pressable>
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Photo carousel */}
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
                <Image key={i} source={{ uri }} style={styles.photo} resizeMode="cover" />
              ))}
            </ScrollView>

            {/* Overlaid author row */}
            <View style={styles.overlayAuthor}>
              <Pressable onPress={() => post.username && router.push(`/user/${post.username}`)}>
                <InitialsAvatar
                  name={post.buildNickname ?? post.buildMake ?? ''}
                  photoUrl={post.buildCoverPhotoUrl ?? null}
                  size={34}
                />
              </Pressable>
              <View>
                <Pressable
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                  onPress={() => post.username && router.push(`/user/${post.username}`)}
                >
                  <Text style={styles.overlayHandle}>@{post.username}</Text>
                  {post.isPro && <ProBadge size={12} />}
                </Pressable>
                <Pressable onPress={() => {
                  if (post.username && post.buildSlug) {
                    router.push(`/build/${post.username}/${post.buildSlug}`)
                  }
                }}>
                  <Text style={styles.overlayBuild} numberOfLines={1}>
                    {post.buildNickname || `${post.buildYear} ${post.buildMake} ${post.buildModel}`}
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Dot indicators */}
            {photos.length > 1 && (
              <View style={styles.dotRow} pointerEvents="none">
                {photos.map((_, i) => (
                  <View key={i} style={[styles.dot, photoIndex === i && styles.dotActive]} />
                ))}
              </View>
            )}

            {/* Timestamp */}
            <Text style={styles.overlayTime} pointerEvents="none">
              {timeAgo(post.createdAt)}
            </Text>
          </View>
        ) : (
          <View style={[styles.photoSkeleton, { backgroundColor: colors.surface2 }]}>
            <View style={styles.overlayAuthor}>
              <Pressable onPress={() => post.username && router.push(`/user/${post.username}`)}>
                <InitialsAvatar name={post.buildNickname ?? ''} size={34} />
              </Pressable>
              <Pressable
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}
                onPress={() => post.username && router.push(`/user/${post.username}`)}
              >
                <Text style={styles.overlayHandle}>@{post.username}</Text>
                {post.isPro && <ProBadge size={12} />}
              </Pressable>
            </View>
          </View>
        )}

        {/* Action bar */}
        <View style={styles.actionBar}>
          <Pressable style={styles.actionBtn} onPress={() => {
            if (!authUser) return
            const next = !liked
            setLiked(next)
            toggleLike(authUser.id, post.id, liked).catch(() => setLiked(liked))
          }}>
            <Heart
              size={24}
              color={liked ? colors.accent : colors.textPrimary}
              fill={liked ? colors.accent : 'none'}
            />
            <Text style={[styles.actionCount, liked && { color: colors.accent }]}>
              {formatFollowers(post.likeCount + (liked ? 1 : 0))}
            </Text>
          </Pressable>

          <Pressable style={styles.actionBtn} onPress={() => setCommentSheetOpen(true)}>
            <MessageCircle size={24} color={colors.textPrimary} />
            <Text style={styles.actionCount}>{post.commentCount}</Text>
          </Pressable>

          {linkedProducts.length > 0 && (
            <Pressable style={styles.actionBtn} onPress={() => setTagsSheetOpen(v => !v)}>
              <View style={styles.tagBadge}>
                <Svg width={36} height={16} viewBox="0 0 48 20">
                  <SvgPath
                    d="M 14 0 L 44 0 Q 48 0 48 4 L 48 16 Q 48 20 44 20 L 14 20 C 9 20 3 13 3 10 C 3 7 9 0 14 0 Z M 13 10 m -2.5 0 a 2.5 2.5 0 1 0 5 0 a 2.5 2.5 0 1 0 -5 0"
                    fill={colors.accent}
                    fillRule="evenodd"
                  />
                </Svg>
                <Text style={styles.tagBadgeText}>{linkedProducts.length}</Text>
              </View>
            </Pressable>
          )}

          <Pressable style={[styles.actionBtn, { marginLeft: 'auto' }]} onPress={() => setShareSheetOpen(true)}>
            <Share2 size={24} color={colors.textPrimary} />
          </Pressable>
        </View>

        {/* Caption */}
        {!!displayCaption && (
          <View style={styles.captionWrap}>
            <Text style={styles.caption}>{displayCaption}</Text>
          </View>
        )}

        {/* Top comments — inline preview */}
        <View style={styles.commentsSection}>
          {topComments.length === 0 ? (
            <Pressable style={styles.noCommentsRow} onPress={() => setCommentSheetOpen(true)}>
              <Text style={styles.noCommentsText}>Be the first to comment</Text>
            </Pressable>
          ) : (
            <>
              {topComments.map(comment => (
                <Pressable
                  key={comment.id}
                  style={styles.inlineComment}
                  onPress={() => setCommentSheetOpen(true)}
                >
                  {comment.avatarUrl ? (
                    <Image source={{ uri: comment.avatarUrl }} style={styles.inlineAvatar} />
                  ) : (
                    <InitialsAvatar name={comment.displayName ?? comment.username ?? '?'} size={28} />
                  )}
                  <View style={styles.inlineCommentBody}>
                    <Text style={styles.inlineCommentText} numberOfLines={2}>
                      <Text style={styles.inlineCommentUser}>@{comment.username} </Text>
                      {comment.body}
                    </Text>
                  </View>
                  <View style={styles.inlineLikeCol}>
                    <Heart size={13} color={colors.textTertiary} />
                    <Text style={styles.inlineLikeCount}>{comment.likes}</Text>
                  </View>
                </Pressable>
              ))}

              {totalCommentCount > 3 && (
                <Pressable style={styles.moreDots} onPress={() => setCommentSheetOpen(true)}>
                  <View style={styles.dot3} />
                  <View style={styles.dot3} />
                  <View style={styles.dot3} />
                </Pressable>
              )}
            </>
          )}
        </View>

        {/* Tagged products */}
        {linkedProducts.length > 0 && (
          <View style={styles.partsSection}>
            {linkedProducts.map(product => (
              <Pressable
                key={product.id}
                style={styles.partRow}
                onPress={() => product.trackingUrl ? WebBrowser.openBrowserAsync(product.trackingUrl) : undefined}
                disabled={!product.trackingUrl}
              >
                <View style={[
                  styles.sourceBadge,
                  product.source === 'amazon' && styles.sourceBadgeAmazon,
                  product.source === 'manual' && styles.sourceBadgeManual,
                ]}>
                  <Text style={[
                    styles.sourceBadgeText,
                    product.source === 'amazon' && styles.sourceBadgeTextAmazon,
                    product.source === 'manual' && styles.sourceBadgeTextManual,
                  ]}>
                    {product.source === 'amazon' ? 'AMZ' : product.source === 'manual' ? 'MAN' : 'WEB'}
                  </Text>
                </View>
                <View style={styles.partInfo}>
                  <Text style={[styles.partName, !!product.trackingUrl && { color: colors.accent }]}>
                    {product.title}
                  </Text>
                  {(product.category || product.brand) ? (
                    <Text style={styles.partCategory}>
                      {[product.category, product.brand].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
                {!!product.trackingUrl && (
                  <ExternalLink size={14} color={colors.accent} />
                )}
              </Pressable>
            ))}
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>

      {/* Tags sheet */}
      {tagsSheetOpen && linkedProducts.length > 0 && (
        <Pressable style={styles.tagsOverlay} onPress={() => setTagsSheetOpen(false)}>
          <Pressable onPress={e => e.stopPropagation()}>
            <View style={styles.tagsSheet}>
              <View style={styles.tagsSheetHeader}>
                <Text style={styles.tagsSheetTitle}>Tagged Products</Text>
                <Pressable onPress={() => setTagsSheetOpen(false)} style={styles.tagsSheetClose}>
                  <XIcon size={16} color={colors.textSecondary} />
                </Pressable>
              </View>
              {linkedProducts.map(product => (
                <Pressable
                  key={product.id}
                  style={styles.tagsSheetRow}
                  onPress={() => {
                    if (product.trackingUrl) WebBrowser.openBrowserAsync(product.trackingUrl)
                    setTagsSheetOpen(false)
                  }}
                >
                  <View style={[
                    styles.sourceBadge,
                    product.source === 'amazon' && styles.sourceBadgeAmazon,
                    product.source === 'manual' && styles.sourceBadgeManual,
                  ]}>
                    <Text style={[
                      styles.sourceBadgeText,
                      product.source === 'amazon' && styles.sourceBadgeTextAmazon,
                      product.source === 'manual' && styles.sourceBadgeTextManual,
                    ]}>
                      {product.source === 'amazon' ? 'AMZ' : product.source === 'manual' ? 'MAN' : 'WEB'}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tagsSheetPartName, !!product.trackingUrl && { color: colors.accent }]} numberOfLines={1}>
                      {product.title}
                    </Text>
                    {(product.category || product.brand) ? (
                      <Text style={styles.tagsSheetCategory}>
                        {[product.category, product.brand].filter(Boolean).join(' · ')}
                      </Text>
                    ) : null}
                  </View>
                  {!!product.trackingUrl && (
                    <ExternalLink size={14} color={colors.accent} />
                  )}
                </Pressable>
              ))}
            </View>
          </Pressable>
        </Pressable>
      )}

      <CommentSheet
        visible={commentSheetOpen}
        postId={post.id}
        onClose={() => setCommentSheetOpen(false)}
      />

      <ShareSheet
        visible={shareSheetOpen}
        postUrl={`https://throttlist.com/post/${post.id}`}
        onClose={() => setShareSheetOpen(false)}
      />

      {isOwner && (
        <PostEditSheet
          visible={editSheetOpen}
          post={post}
          userId={authUser?.id ?? ''}
          isPro={!!post.isPro}
          partCategories={BUILD_CATEGORIES.find(c => c.id === post.buildType)?.partCategories ?? []}
          isPinned={isPinned}
          onClose={() => setEditSheetOpen(false)}
          onSave={async (updates) => {
            setLocalCaption(updates.caption)
            setLocalPhotos(updates.photos)
            await updatePost(post.id, {
              caption: updates.caption,
              linked_products: updates.linkedProducts,
              photos: updates.photos,
            })
            queryClient.invalidateQueries({ queryKey: ['post', postId] })
          }}
          onTogglePin={async () => {
            const next = !isPinned
            setIsPinned(next)
            await updatePost(post.id, { isPinned: next })
          }}
          onDelete={async () => {
            setDeleted(true)
            await deletePost(post.id)
            queryClient.invalidateQueries({ queryKey: ['feed-posts'] })
          }}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  navRow: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 16,
    left: 16,
    right: 16,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
  },
  photoSkeleton: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    backgroundColor: colors.surface2,
  },
  photoWrap: {
    position: 'relative',
  },
  photo: {
    width: SCREEN_WIDTH,
    height: PHOTO_HEIGHT,
    backgroundColor: colors.surface2,
  },
  overlayAuthor: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 22,
    left: 60,
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
    maxWidth: SCREEN_WIDTH * 0.55,
  },
  overlayTime: {
    position: 'absolute',
    bottom: 12,
    left: 14,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
  // Action bar
  actionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionCount: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  // Caption
  captionWrap: {
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 4,
  },
  caption: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
  },
  // Parts
  partsSection: {
    marginTop: 8,
    paddingBottom: 4,
  },
  partRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  sourceBadge: {
    backgroundColor: colors.surface3,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
    flexShrink: 0,
  },
  sourceBadgeAmazon: { backgroundColor: '#FF990022', borderWidth: 1, borderColor: '#FF990055' },
  sourceBadgeManual: { backgroundColor: colors.accent + '22', borderWidth: 1, borderColor: colors.accent + '55' },
  sourceBadgeText: { color: colors.textTertiary, fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  sourceBadgeTextAmazon: { color: '#FF9900' },
  sourceBadgeTextManual: { color: colors.accent },
  partInfo: {
    flex: 1,
  },
  partName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  partCategory: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 1,
  },
  notFound: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  // Inline top comments
  commentsSection: {
    marginTop: 12,
    paddingBottom: 4,
  },
  noCommentsRow: {
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  noCommentsText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  inlineComment: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 9,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  inlineAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    flexShrink: 0,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  inlineCommentBody: {
    flex: 1,
  },
  inlineCommentText: {
    color: colors.textPrimary,
    fontSize: 13,
    lineHeight: 18,
  },
  inlineCommentUser: {
    fontWeight: '700',
    color: colors.textPrimary,
  },
  inlineLikeCol: {
    alignItems: 'center',
    gap: 3,
    paddingTop: 2,
    width: 28,
    flexShrink: 0,
  },
  inlineLikeCount: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '600',
  },
  moreDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingTop: 8,
    paddingBottom: 4,
  },
  dot3: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface3,
  },
  // Tag badge in action bar
  tagBadge: {
    position: 'relative',
    width: 36,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagBadgeText: {
    position: 'absolute',
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
    right: 4,
    top: 0,
    bottom: 0,
    textAlignVertical: 'center',
    lineHeight: 16,
  },
  // Tags bottom sheet
  tagsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    top: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  tagsSheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: colors.surface2,
  },
  tagsSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface2,
  },
  tagsSheetTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  tagsSheetClose: {
    padding: 4,
  },
  tagsSheetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface2 + '66',
  },
  tagsSheetPartName: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
  },
  tagsSheetCategory: {
    color: colors.textTertiary,
    fontSize: 11,
    marginTop: 2,
  },
})
