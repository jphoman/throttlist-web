import { supabase } from './supabase'
import type { User, Build, Post, Comment, Part } from '@/types'

// ─── Build type normaliser ────────────────────────────────────────────────────
// Legacy seed data used short-form types ('moto'). Normalise to canonical ids.
const BUILD_TYPE_ALIASES: Record<string, string> = {
  moto: 'motorcycles',
  motorcycle: 'motorcycles',
  car: 'cars',
  bike: 'bicycles',
  bicycle: 'bicycles',
  drone: 'drones',
  gaming: 'pc_gaming',
  pc: 'pc_gaming',
  audio: 'audio_hifi',
  hifi: 'audio_hifi',
  keyboard: 'keyboards',
  guitar: 'guitars',
  printing: '3d_printing',
  outdoor: 'camping',
}
function normBuildType(raw: string | undefined | null): string {
  if (!raw) return ''
  const lower = raw.toLowerCase()
  return BUILD_TYPE_ALIASES[lower] ?? lower
}

// ─── Mappers ─────────────────────────────────────────────────────────────────

function mapProfile(row: any): User {
  return {
    id: row.id,
    username: row.username,
    displayName: row.display_name,
    avatarUrl: row.avatar_url ?? '',
    bio: row.bio ?? undefined,
    location: row.location ?? undefined,
    instagramHandle: row.instagram_handle ?? undefined,
    youtubeHandle: row.youtube_handle ?? undefined,
    proTier: row.is_pro ? '1' : '0',
    affiliateDisclosureDismissed: '0',
    createdAt: row.created_at,
  }
}

function mapBuild(row: any): Build {
  return {
    id: row.id,
    userId: row.user_id,
    year: row.year ?? 0,
    make: row.make,
    model: row.model,
    nickname: row.nickname ?? '',
    slug: row.slug ?? `${row.make}-${row.model}`.toLowerCase().replace(/\s+/g, '-'),
    coverPhotoUrl: row.cover_photo_url ?? '',
    tags: '[]',
    followerCount: row.follower_count ?? 0,
    tagVisibility: '{}',
    status: row.status ?? 'active',
    archivedPublic: '0',
    buildType: normBuildType(row.build_type),
    createdAt: row.created_at,
    username: row.profiles?.username,
    displayName: row.profiles?.display_name,
    avatarUrl: row.profiles?.avatar_url ?? '',
    ownerIsPro: row.profiles?.is_pro ?? false,
  }
}

function mapPost(row: any): Post {
  return {
    id: row.id,
    buildId: row.build_id ?? '',
    userId: row.user_id,
    photos: JSON.stringify(row.photos ?? []),
    caption: row.caption ?? '',
    taggedPartIds: JSON.stringify(row.tagged_part_ids ?? []),
    likeCount: row.like_count ?? 0,
    commentCount: row.comment_count ?? 0,
    createdAt: row.created_at,
    username: row.profiles?.username,
    displayName: row.profiles?.display_name,
    avatarUrl: row.profiles?.avatar_url ?? '',
    buildNickname: row.builds?.nickname,
    buildSlug: row.builds?.slug,
    buildYear: row.builds?.year,
    buildMake: row.builds?.make,
    buildModel: row.builds?.model,
    buildCoverPhotoUrl: row.builds?.cover_photo_url,
    buildType: normBuildType(row.builds?.build_type),
    isPro: !!(row.profiles?.is_pro),
  }
}

// ─── Profile queries ─────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error || !data) return null
  return mapProfile(data)
}

export async function fetchProfileByUsername(username: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('username', username)
    .single()
  if (error || !data) return null
  return mapProfile(data)
}

export async function updateProfile(userId: string, updates: {
  display_name?: string
  bio?: string
  avatar_url?: string
  location?: string
  instagram_handle?: string
  youtube_handle?: string
  build_style?: string
}): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error || !data) return null
  return mapProfile(data)
}

// ─── Build queries ────────────────────────────────────────────────────────────

export async function fetchUserBuilds(userId: string): Promise<Build[]> {
  const { data, error } = await supabase
    .from('builds')
    .select('*, profiles(username, display_name, avatar_url, is_pro)')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(mapBuild)
}

export async function fetchBuild(username: string, slug: string): Promise<Build | null> {
  const { data, error } = await supabase
    .from('builds')
    .select('*, profiles!inner(username, display_name, avatar_url, is_pro)')
    .eq('profiles.username', username)
    .eq('slug', slug)
    .single()
  if (error || !data) return null
  return mapBuild(data)
}

export async function createBuild(build: {
  user_id: string
  year?: number | null
  make: string
  model: string
  nickname?: string | null
  slug?: string | null
  build_type?: string | null
  cover_photo_url?: string | null
}): Promise<Build | null> {
  const { data, error } = await supabase
    .from('builds')
    .insert(build)
    .select()
    .single()
  if (error || !data) return null
  return mapBuild(data)
}

// ─── Post queries ─────────────────────────────────────────────────────────────

export async function fetchPost(postId: string): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(username, display_name, avatar_url, is_pro), builds(nickname, slug, year, make, model, cover_photo_url, build_type)')
    .eq('id', postId)
    .single()
  if (error || !data) return null
  return mapPost(data)
}

export async function fetchFeed(limit = 20, offset = 0, excludeUserId?: string): Promise<Post[]> {
  let query = supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(username, display_name, avatar_url, is_pro), builds(nickname, slug, year, make, model, cover_photo_url, build_type)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
  if (excludeUserId) query = query.neq('user_id', excludeUserId)
  const { data, error } = await query
  if (error || !data) return []
  return data.map(mapPost)
}

export async function fetchFollowedFeed(userId: string, limit = 20): Promise<Post[]> {
  const { data: follows } = await supabase
    .from('build_follows')
    .select('build_id')
    .eq('follower_id', userId)
  const buildIds = (follows ?? []).map((r: any) => r.build_id)
  if (buildIds.length === 0) return []
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(username, display_name, avatar_url, is_pro), builds(nickname, slug, year, make, model, cover_photo_url, build_type)')
    .in('build_id', buildIds)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map(mapPost)
}

export async function fetchUserPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(username, display_name, avatar_url, is_pro), builds(nickname, slug, year, make, model, cover_photo_url, build_type)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(mapPost)
}

export async function createPost(post: {
  user_id: string
  build_id?: string | null
  photos: string[]
  caption?: string | null
}): Promise<Post | null> {
  const { data, error } = await supabase
    .from('posts')
    .insert(post)
    .select()
    .single()
  if (error || !data) return null
  return mapPost(data)
}

// ─── Like queries ─────────────────────────────────────────────────────────────

export async function toggleLike(userId: string, postId: string, currentlyLiked: boolean) {
  if (currentlyLiked) {
    await supabase.from('likes').delete().eq('user_id', userId).eq('post_id', postId)
    await supabase.from('posts').update({ like_count: supabase.rpc('decrement', { x: 1 }) }).eq('id', postId)
  } else {
    await supabase.from('likes').insert({ user_id: userId, post_id: postId })
    await supabase.from('posts').update({ like_count: supabase.rpc('increment', { x: 1 }) }).eq('id', postId)
  }
}

export async function fetchLikedPostIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from('likes').select('post_id').eq('user_id', userId)
  return new Set((data ?? []).map((r: any) => r.post_id))
}

// ─── Follow queries ───────────────────────────────────────────────────────────

export async function fetchFollowingCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('build_follows')
    .select('*', { count: 'exact', head: true })
    .eq('follower_id', userId)
  return count ?? 0
}

/**
 * Count unique users who follow at least one of a creator's builds.
 * A person who follows 3 builds from the same creator still counts as 1 follower.
 */
export async function fetchCreatorFollowerCount(creatorId: string): Promise<number> {
  // 1. Get all active build IDs for this creator
  const { data: buildRows } = await supabase
    .from('builds')
    .select('id')
    .eq('user_id', creatorId)
    .eq('status', 'active')

  if (!buildRows || buildRows.length === 0) return 0

  const buildIds = buildRows.map((b: any) => b.id)

  // 2. Fetch all follower_ids across those builds
  const { data: follows } = await supabase
    .from('build_follows')
    .select('follower_id')
    .in('build_id', buildIds)

  if (!follows) return 0

  // 3. Deduplicate — one person following multiple builds = 1 creator follower
  return new Set(follows.map((f: any) => f.follower_id)).size
}

export async function fetchCreatorFollowers(creatorId: string): Promise<User[]> {
  // 1. Get all active build IDs for this creator
  const { data: buildRows } = await supabase
    .from('builds')
    .select('id')
    .eq('user_id', creatorId)
    .eq('status', 'active')

  if (!buildRows || buildRows.length === 0) return []

  const buildIds = buildRows.map((b: any) => b.id)

  // 2. Fetch all follower_ids across those builds (deduplicate client-side)
  const { data: follows } = await supabase
    .from('build_follows')
    .select('follower_id')
    .in('build_id', buildIds)

  if (!follows || follows.length === 0) return []

  const uniqueIds = [...new Set(follows.map((f: any) => f.follower_id))]

  // 3. Fetch profiles for those unique follower IDs
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', uniqueIds)

  if (!profiles) return []
  return profiles.map(mapProfile)
}

export async function fetchFollowerCount(userId: string): Promise<number> {
  const { count } = await supabase
    .from('follows')
    .select('*', { count: 'exact', head: true })
    .eq('following_id', userId)
  return count ?? 0
}

export async function isFollowing(followerId: string, followingId: string): Promise<boolean> {
  const { data } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('follower_id', followerId)
    .eq('following_id', followingId)
    .single()
  return !!data
}

export async function toggleFollow(followerId: string, followingId: string, currentlyFollowing: boolean) {
  if (currentlyFollowing) {
    await supabase.from('follows').delete().eq('follower_id', followerId).eq('following_id', followingId)
  } else {
    await supabase.from('follows').insert({ follower_id: followerId, following_id: followingId })
  }
}

// ─── Build follow queries ─────────────────────────────────────────────────────

export async function fetchFollowedBuildIds(userId: string): Promise<Set<string>> {
  const { data } = await supabase.from('build_follows').select('build_id').eq('follower_id', userId)
  return new Set((data ?? []).map((r: any) => r.build_id))
}

export async function fetchFollowedBuilds(userId: string): Promise<Build[]> {
  const { data: follows } = await supabase
    .from('build_follows')
    .select('build_id')
    .eq('follower_id', userId)
  const buildIds = (follows ?? []).map((r: any) => r.build_id)
  if (buildIds.length === 0) return []
  const { data, error } = await supabase
    .from('builds')
    .select('*, profiles(username, display_name, avatar_url, is_pro)')
    .in('id', buildIds)
    .eq('status', 'active')
  if (error || !data) return []
  return data.map(mapBuild)
}

export async function toggleBuildFollow(userId: string, buildId: string, currentlyFollowing: boolean): Promise<void> {
  if (currentlyFollowing) {
    const { error } = await supabase.from('build_follows').delete().eq('follower_id', userId).eq('build_id', buildId)
    if (error) throw error
    await supabase.rpc('decrement_build_follower', { bid: buildId })
  } else {
    const { error } = await supabase.from('build_follows').insert({ follower_id: userId, build_id: buildId })
    if (error) throw error
    await supabase.rpc('increment_build_follower', { bid: buildId })
  }
}

// ─── Discover queries ─────────────────────────────────────────────────────────

export async function fetchAllBuilds(limit = 20): Promise<Build[]> {
  const { data, error } = await supabase
    .from('builds')
    .select('*, profiles(username, display_name, avatar_url, is_pro)')
    .eq('status', 'active')
    .order('follower_count', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map(mapBuild)
}

export async function fetchAllProfiles(limit = 10, excludeUserId?: string): Promise<User[]> {
  let query = supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (excludeUserId) {
    query = query.neq('id', excludeUserId)
  }
  const { data, error } = await query
  if (error || !data) return []
  return data.map(mapProfile)
}

// ─── Comment queries ──────────────────────────────────────────────────────────

export async function fetchComments(postId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('*, profiles(username, display_name, avatar_url)')
    .eq('post_id', postId)
    .is('parent_id', null)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map((row: any) => ({
    id: row.id,
    body: row.body,
    authorUserId: row.user_id,
    likes: row.likes ?? 0,
    targetType: 'post',
    targetId: row.post_id,
    isPinned: row.is_pinned ? '1' : '0',
    createdAt: row.created_at,
    username: row.profiles?.username,
    displayName: row.profiles?.display_name,
    avatarUrl: row.profiles?.avatar_url ?? '',
  }))
}

export async function addComment(userId: string, postId: string, body: string): Promise<void> {
  await supabase.from('comments').insert({ user_id: userId, post_id: postId, body })
  await supabase.from('posts').update({ comment_count: supabase.rpc('increment', { x: 1 }) }).eq('id', postId)
}

// ─── Search ───────────────────────────────────────────────────────────────────

export async function searchProfiles(query: string, excludeUserId?: string): Promise<User[]> {
  let q = supabase
    .from('profiles')
    .select('*')
    .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
    .limit(20)
  if (excludeUserId) q = q.neq('id', excludeUserId)
  const { data, error } = await q
  if (error || !data) return []
  return data.map(mapProfile)
}

// ─── Direct Messages ──────────────────────────────────────────────────────────

export type DMConversation = {
  otherUserId: string
  otherUsername: string
  otherDisplayName: string
  otherAvatarUrl: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  isFromMe: boolean
}

export type DirectMessage = {
  id: string
  senderId: string
  recipientId: string
  body: string
  isRead: boolean
  createdAt: string
}

export async function fetchConversations(userId: string): Promise<DMConversation[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(`sender_id.eq.${userId},recipient_id.eq.${userId}`)
    .order('created_at', { ascending: false })
  if (error || !data || data.length === 0) return []

  // Collect unique partner IDs
  const otherIds = new Set<string>()
  data.forEach(m => {
    otherIds.add(m.sender_id === userId ? m.recipient_id : m.sender_id)
  })

  // Batch-fetch profiles
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, username, display_name, avatar_url')
    .in('id', Array.from(otherIds))
  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]))

  // One entry per partner (first message = most recent due to desc order)
  const byPartner = new Map<string, DMConversation>()
  for (const msg of data) {
    const isFromMe = msg.sender_id === userId
    const otherId = isFromMe ? msg.recipient_id : msg.sender_id
    if (byPartner.has(otherId)) continue
    const profile = profileMap.get(otherId)
    if (!profile) continue
    const unreadCount = data.filter(
      m => m.sender_id === otherId && m.recipient_id === userId && !m.is_read
    ).length
    byPartner.set(otherId, {
      otherUserId: otherId,
      otherUsername: profile.username,
      otherDisplayName: profile.display_name,
      otherAvatarUrl: profile.avatar_url ?? '',
      lastMessage: msg.body,
      lastMessageAt: msg.created_at,
      unreadCount,
      isFromMe,
    })
  }
  return Array.from(byPartner.values())
}

export async function fetchDirectMessages(userId: string, otherUserId: string): Promise<DirectMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .or(
      `and(sender_id.eq.${userId},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${userId})`
    )
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map(row => ({
    id: row.id,
    senderId: row.sender_id,
    recipientId: row.recipient_id,
    body: row.body,
    isRead: row.is_read,
    createdAt: row.created_at,
  }))
}

export async function sendDirectMessage(
  senderId: string,
  recipientId: string,
  body: string
): Promise<DirectMessage | null> {
  const { data, error } = await supabase
    .from('messages')
    .insert({ sender_id: senderId, recipient_id: recipientId, body, is_read: false })
    .select()
    .single()
  if (error || !data) return null
  return {
    id: data.id,
    senderId: data.sender_id,
    recipientId: data.recipient_id,
    body: data.body,
    isRead: data.is_read,
    createdAt: data.created_at,
  }
}

export async function markMessagesRead(userId: string, otherUserId: string): Promise<void> {
  await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('recipient_id', userId)
    .eq('sender_id', otherUserId)
    .eq('is_read', false)
}

// ─── Build-specific queries ───────────────────────────────────────────────────

export async function fetchBuildPosts(buildId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles!posts_user_id_fkey(username, display_name, avatar_url, is_pro), builds(nickname, slug, year, make, model, cover_photo_url, build_type)')
    .eq('build_id', buildId)
    .order('created_at', { ascending: false })
  if (error || !data) return []
  return data.map(mapPost)
}

export async function fetchBuildParts(buildId: string): Promise<Part[]> {
  const { data, error } = await supabase
    .from('parts')
    .select('*')
    .eq('build_id', buildId)
    .order('created_at', { ascending: true })
  if (error || !data) return []
  return data.map((row: any) => ({
    id: row.id,
    buildId: row.build_id,
    name: row.name,
    category: row.category ?? '',
    type: row.type ?? 'reference',
    sourceUrl: row.source_url ?? undefined,
    notes: row.notes ?? undefined,
    isCurrent: row.is_current,
    replacedByPartId: row.replaced_by_part_id ?? undefined,
    createdAt: row.created_at,
  }))
}

export async function fetchBuildFollowers(buildId: string): Promise<User[]> {
  const { data, error } = await supabase
    .from('build_follows')
    .select('profiles!inner(id, username, display_name, avatar_url, is_pro, bio, location, instagram_handle, youtube_handle, created_at)')
    .eq('build_id', buildId)
  if (error || !data) return []
  return data.map((row: any) => mapProfile(row.profiles))
}
