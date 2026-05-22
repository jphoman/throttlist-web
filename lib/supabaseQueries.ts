import { supabase } from './supabase'
import type { User, Build, Post, Comment } from '@/types'

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
    buildType: row.build_type ?? '',
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
    taggedPartIds: '[]',
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
    buildType: row.builds?.build_type,
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

export async function fetchFeed(limit = 20, offset = 0): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(username, display_name, avatar_url), builds(nickname, slug, year, make, model, cover_photo_url, build_type)')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)
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
    .select('*, profiles(username, display_name, avatar_url), builds(nickname, slug, year, make, model, cover_photo_url, build_type)')
    .in('build_id', buildIds)
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error || !data) return []
  return data.map(mapPost)
}

export async function fetchUserPosts(userId: string): Promise<Post[]> {
  const { data, error } = await supabase
    .from('posts')
    .select('*, profiles(username, display_name, avatar_url), builds(nickname, slug, year, make, model, cover_photo_url, build_type)')
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

export async function toggleBuildFollow(userId: string, buildId: string, currentlyFollowing: boolean) {
  if (currentlyFollowing) {
    await supabase.from('build_follows').delete().eq('follower_id', userId).eq('build_id', buildId)
    await supabase.rpc('decrement_build_follower', { bid: buildId })
  } else {
    await supabase.from('build_follows').insert({ follower_id: userId, build_id: buildId })
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
