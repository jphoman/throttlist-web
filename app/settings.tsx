import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Image,
  Alert,
  Platform,
  Switch,
} from 'react-native'
import { router } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Edit2,
  Camera,
  ChevronRight,
  Trash,
  Globe,
  Instagram,
  Youtube,
  ProBadge,
} from '@/components/Icons'
import { fetchProfile, fetchUserBuilds, updateProfile } from '@/lib/supabaseQueries'
import { supabase } from '@/lib/supabase'
import { colors } from '@/constants/throttlist'
import { useAuth } from '@/lib/auth'
import InitialsAvatar from '@/components/InitialsAvatar'

type Section = 'main' | 'editProfile' | 'reorderProfile'

type OrderItem =
  | { type: 'build'; id: string; nickname?: string; year?: number; make?: string; model?: string }
  | { type: 'store' }
  | { type: 'topBuilds' }

export default function SettingsScreen() {
  const [section, setSection] = useState<Section>('main')
  const [saving, setSaving] = useState(false)
  const queryClient = useQueryClient()
  const { user: authUser, signOut } = useAuth()
  const userId = authUser?.id ?? ''

  const { data: user } = useQuery({
    queryKey: ['profile', userId],
    queryFn: () => fetchProfile(userId),
    enabled: !!userId,
  })

  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [location, setLocation] = useState('')
  const [instagram, setInstagram] = useState('')
  const [youtube, setYoutube] = useState('')

  const isPro = parseInt((user?.proTier ?? '0') as string) >= 1

  const [storeOn, setStoreOnState] = useState(false)
  function toggleStore(v: boolean) {
    setStoreOnState(v)
  }

  const [avatarUploading, setAvatarUploading] = useState(false)
  const [localAvatarUrl, setLocalAvatarUrl] = useState<string | null>(null)

  async function handleAvatarFileChange(e: any) {
    const file = e.target?.files?.[0]
    if (!file || !userId) return
    setAvatarUploading(true)
    try {
      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
      const path = `${userId}/avatar-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('posts')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path)
      setLocalAvatarUrl(publicUrl)
      await updateProfile(userId, { avatar_url: publicUrl })
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
    } catch (err: any) {
      console.error('Avatar upload failed', err)
      Alert.alert('Upload failed', err?.message ?? 'Could not upload photo. Please try again.')
    } finally {
      setAvatarUploading(false)
      e.target.value = ''
    }
  }

  const [profileOrder, setProfileOrder] = useState<OrderItem[]>([])

  async function openReorderProfile() {
    const builds = await fetchUserBuilds(userId)
    const buildItems: Extract<OrderItem, { type: 'build' }>[] = builds
      .map(b => ({ type: 'build' as const, id: b.id, nickname: b.nickname, year: b.year, make: b.make, model: b.model }))
    // Only include Store block for Pro users
    const order: OrderItem[] = [{ type: 'topBuilds' }, ...buildItems]
    if (isPro) order.push({ type: 'store' })
    setProfileOrder(order)
    setSection('reorderProfile')
  }

  function moveProfileItem(idx: number, dir: -1 | 1) {
    const next = [...profileOrder]
    const swap = idx + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    setProfileOrder(next)
  }

  function saveReorderProfile() {
    queryClient.invalidateQueries({ queryKey: ['profile'] })
    queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    setSection('main')
  }

  function openEditProfile() {
    setDisplayName(user?.displayName ?? '')
    setUsername(user?.username ?? '')
    setBio(user?.bio ?? '')
    setLocation(user?.location ?? '')
    setInstagram(user?.instagramHandle ?? '')
    setYoutube(user?.youtubeHandle ?? '')
    setLocalAvatarUrl(null)
    setSection('editProfile')
  }

  async function handleSave() {
    if (!userId) return
    setSaving(true)
    try {
      await updateProfile(userId, {
        display_name: displayName,
        bio,
        location,
        instagram_handle: instagram,
        youtube_handle: youtube,
      })
      queryClient.invalidateQueries({ queryKey: ['profile', userId] })
      queryClient.invalidateQueries({ queryKey: ['user-profile'] })
    } finally {
      setSaving(false)
      setSection('main')
    }
  }

  async function handleLogOut() {
    const confirmed = Platform.OS === 'web'
      ? window.confirm('Are you sure you want to log out?')
      : await new Promise<boolean>(resolve =>
          Alert.alert('Log out', 'Are you sure you want to log out?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            { text: 'Log out', style: 'destructive', onPress: () => resolve(true) },
          ])
        )
    if (!confirmed) return
    await signOut()
    router.replace('/login')
  }

  function handleDeleteContent() {
    Alert.alert(
      'Delete all content',
      'This will permanently delete all your posts, comments, and build data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete everything',
          style: 'destructive',
          onPress: () => Alert.alert('Content deleted', 'All content has been removed.'),
        },
      ]
    )
  }

  function handleExport() {
    Alert.alert(
      'Export your data',
      "We'll prepare a ZIP of all your posts, comments, and build data and email it to you within 24 hours.",
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Request export', onPress: () => Alert.alert('Export requested', 'Check your email within 24 hours.') },
      ]
    )
  }

  // ─── Reorder Profile Screen ──────────────────────────────────────────────────
  if (section === 'reorderProfile') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setSection('main')} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>Reorder Profile</Text>
          <Pressable onPress={saveReorderProfile} style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Save</Text>
          </Pressable>
        </View>
        <ScrollView showsVerticalScrollIndicator={false}>
          <View style={styles.reorderSectionHeader}>
            <Text style={styles.reorderSectionTitle}>PROFILE ORDER</Text>
          </View>
          {profileOrder.map((item, idx) => {
            if (item.type === 'store') {
              return (
                <View key="store" style={[styles.reorderRow, styles.reorderSectionRow]}>
                  <View style={styles.reorderRowLeft}>
                    <Text style={styles.reorderTitle}>Store</Text>
                  </View>
                  <View style={styles.reorderArrows}>
                    <Pressable onPress={() => moveProfileItem(idx, -1)} style={styles.reorderArrow} disabled={idx === 0}>
                      <Text style={[styles.reorderArrowText, idx === 0 && { opacity: 0.25 }]}>↑</Text>
                    </Pressable>
                    <Pressable onPress={() => moveProfileItem(idx, 1)} style={styles.reorderArrow} disabled={idx === profileOrder.length - 1}>
                      <Text style={[styles.reorderArrowText, idx === profileOrder.length - 1 && { opacity: 0.25 }]}>↓</Text>
                    </Pressable>
                  </View>
                </View>
              )
            }
            if (item.type === 'topBuilds') {
              return (
                <View key="topBuilds" style={[styles.reorderRow, styles.reorderSectionRow]}>
                  <View style={styles.reorderRowLeft}>
                    <Text style={styles.reorderTitle}>Top Builds</Text>
                  </View>
                  <View style={styles.reorderArrows}>
                    <Pressable onPress={() => moveProfileItem(idx, -1)} style={styles.reorderArrow} disabled={idx === 0}>
                      <Text style={[styles.reorderArrowText, idx === 0 && { opacity: 0.25 }]}>↑</Text>
                    </Pressable>
                    <Pressable onPress={() => moveProfileItem(idx, 1)} style={styles.reorderArrow} disabled={idx === profileOrder.length - 1}>
                      <Text style={[styles.reorderArrowText, idx === profileOrder.length - 1 && { opacity: 0.25 }]}>↓</Text>
                    </Pressable>
                  </View>
                </View>
              )
            }
            const b = item as Extract<OrderItem, { type: 'build' }>
            const buildLabel = b.nickname || `${b.year} ${b.make} ${b.model ?? ''}`.trim()
            const buildMeta = b.nickname ? `${b.year} ${b.make} ${b.model ?? ''}`.trim() : null
            return (
              <View key={b.id} style={styles.reorderRow}>
                <Text style={[styles.reorderTitle, { flex: 1 }]} numberOfLines={1}>
                  {buildLabel}
                  {buildMeta ? <Text style={styles.reorderBuildMeta}>{'  '}{buildMeta}</Text> : null}
                </Text>
                <View style={styles.reorderArrows}>
                  <Pressable onPress={() => moveProfileItem(idx, -1)} style={styles.reorderArrow} disabled={idx === 0}>
                    <Text style={[styles.reorderArrowText, idx === 0 && { opacity: 0.25 }]}>↑</Text>
                  </Pressable>
                  <Pressable onPress={() => moveProfileItem(idx, 1)} style={styles.reorderArrow} disabled={idx === profileOrder.length - 1}>
                    <Text style={[styles.reorderArrowText, idx === profileOrder.length - 1 && { opacity: 0.25 }]}>↓</Text>
                  </Pressable>
                </View>
              </View>
            )
          })}
          <View style={{ height: 48 }} />
        </ScrollView>
      </View>
    )
  }

  // ─── Edit Profile Screen ─────────────────────────────────────────────────────
  if (section === 'editProfile') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => setSection('main')} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.textSecondary} />
          </Pressable>
          <Text style={styles.headerTitle}>Edit Profile</Text>
          <Pressable onPress={handleSave} style={styles.saveBtn} disabled={saving}>
            <Text style={[styles.saveBtnText, saving && { opacity: 0.5 }]}>
              {saving ? 'Saving…' : 'Save'}
            </Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={styles.editContent} showsVerticalScrollIndicator={false}>
          <View style={styles.avatarSection}>
            {localAvatarUrl || user?.avatarUrl ? (
              <Image source={{ uri: localAvatarUrl || user?.avatarUrl }} style={[styles.editAvatar, avatarUploading && { opacity: 0.5 }]} />
            ) : (
              <InitialsAvatar name={user?.displayName ?? ''} size={80} />
            )}
            {Platform.OS === 'web' ? (
              <>
                <input
                  id="avatar-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFileChange}
                  style={{ display: 'none' }}
                  disabled={avatarUploading}
                />
                <label
                  htmlFor="avatar-file-input"
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 5,
                    cursor: avatarUploading ? 'not-allowed' : 'pointer',
                    opacity: avatarUploading ? 0.5 : 1,
                  } as any}
                >
                  <Camera size={14} color={colors.accent} />
                  <Text style={styles.changePhotoText}>
                    {avatarUploading ? 'Uploading…' : 'Change photo'}
                  </Text>
                </label>
              </>
            ) : (
              <Pressable style={styles.changePhotoBtn}>
                <Camera size={14} color={colors.accent} />
                <Text style={styles.changePhotoText}>Change photo</Text>
              </Pressable>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Display name</Text>
              <TextInput
                style={styles.fieldInput}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Username</Text>
              <TextInput
                style={styles.fieldInput}
                value={username}
                onChangeText={setUsername}
                placeholder="username"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMulti]}
                value={bio}
                onChangeText={setBio}
                placeholder="Tell riders about yourself…"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Location</Text>
              <View style={styles.fieldIconRow}>
                <Globe size={15} color={colors.textTertiary} />
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputFlex]}
                  value={location}
                  onChangeText={setLocation}
                  placeholder="City, State"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Instagram</Text>
              <View style={styles.fieldIconRow}>
                <Instagram size={15} color={colors.textTertiary} />
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputFlex]}
                  value={instagram}
                  onChangeText={setInstagram}
                  placeholder="@handle"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>YouTube</Text>
              <View style={styles.fieldIconRow}>
                <Youtube size={15} color={colors.textTertiary} />
                <TextInput
                  style={[styles.fieldInput, styles.fieldInputFlex]}
                  value={youtube}
                  onChangeText={setYoutube}
                  placeholder="channel name"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    )
  }

  // ─── Main Screen ─────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/profile')} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionLabel}>Account</Text>
        <View style={styles.group}>
          <Pressable style={styles.row} onPress={openEditProfile}>
            <Text style={styles.rowText}>Edit Profile</Text>
            <ChevronRight size={16} color={colors.textTertiary} />
          </Pressable>
          <View style={styles.separator} />
          <Pressable style={styles.row} onPress={() => Alert.alert('Change password', 'A reset link will be sent to your email.')}>
            <Text style={styles.rowText}>Change Password</Text>
            <ChevronRight size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Membership</Text>
        <View style={styles.group}>
          {isPro ? (
            <>
              <Pressable style={styles.row} onPress={() => router.push('/membership')}>
                <Text style={styles.rowText}>Pro Membership</Text>
                <View style={styles.rowRight}>
                  <ProBadge />
                  <ChevronRight size={16} color={colors.textTertiary} />
                </View>
              </Pressable>
              <View style={styles.separator} />
              <Pressable style={styles.row} onPress={() => router.push('/analytics')}>
                <Text style={styles.rowText}>Pro Member Analytics</Text>
                <ChevronRight size={16} color={colors.textTertiary} />
              </Pressable>
            </>
          ) : (
            <Pressable style={styles.row} onPress={() => router.push('/pro')}>
              <Text style={styles.rowText}>Upgrade to Pro</Text>
              <ProBadge />
            </Pressable>
          )}
        </View>

        <Text style={styles.sectionLabel}>Profile</Text>
        <View style={styles.group}>
          <Pressable style={styles.row} onPress={() => router.push('/top-builds-edit' as any)}>
            <Text style={styles.rowText}>Top Builds</Text>
            <ChevronRight size={16} color={colors.textTertiary} />
          </Pressable>
          <View style={styles.separator} />
          {isPro && (
            <>
              <View style={styles.row}>
                <Text style={styles.rowText}>Show Store</Text>
                <Switch
                  value={storeOn}
                  onValueChange={toggleStore}
                  trackColor={{ false: colors.surface3, true: colors.accent }}
                  thumbColor="#fff"
                />
              </View>
              <View style={styles.separator} />
              <Pressable style={styles.row} onPress={() => router.push('/store-items')}>
                <Text style={styles.rowText}>Store Items</Text>
                <ChevronRight size={16} color={colors.textTertiary} />
              </Pressable>
              <View style={styles.separator} />
            </>
          )}
          <Pressable style={styles.row} onPress={openReorderProfile}>
            <Text style={styles.rowText}>Reorder Profile</Text>
            <ChevronRight size={16} color={colors.textTertiary} />
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Your Data</Text>
        <View style={styles.group}>
          <Pressable style={styles.row} onPress={handleExport}>
            <Text style={styles.rowText}>Export Content</Text>
            <ChevronRight size={16} color={colors.textTertiary} />
          </Pressable>
          <View style={styles.separator} />
          <Pressable style={styles.row} onPress={handleDeleteContent}>
            <View style={styles.rowLeft}>
              <Trash size={16} color={colors.accent} />
              <Text style={[styles.rowText, { color: colors.accent }]}>Delete All Content</Text>
            </View>
          </Pressable>
        </View>

        <Text style={styles.sectionLabel}>Session</Text>
        <View style={styles.group}>
          <Pressable style={styles.row} onPress={handleLogOut}>
            <Text style={[styles.rowText, { color: colors.accent }]}>Log Out</Text>
          </Pressable>
        </View>

        <Text style={styles.versionText}>Throttlist v0.1.0 · Beta</Text>
        <View style={{ height: 48 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  backBtn: { padding: 4, width: 44 },
  saveBtn: { padding: 4, width: 44, alignItems: 'flex-end' },
  saveBtnText: { color: colors.accent, fontSize: 15, fontWeight: '700' },
  sectionLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  group: {
    backgroundColor: colors.surface1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  rowText: { color: colors.textPrimary, fontSize: 15 },
  separator: { height: 1, backgroundColor: colors.border, marginLeft: 16 },
  versionText: {
    color: colors.textTertiary,
    fontSize: 12,
    textAlign: 'center',
    paddingVertical: 24,
  },
  // Reorder
  reorderSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  reorderSectionTitle: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface1,
    gap: 10,
  },
  reorderSectionRow: { backgroundColor: colors.surface2 },
  reorderRowLeft: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  reorderThumb: { width: 34, height: 34, borderRadius: 6, backgroundColor: colors.surface2 },
  reorderTitle: { flex: 1, color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  reorderBuildRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, minWidth: 0 },
  reorderBuildMeta: { color: colors.textTertiary, fontSize: 13, fontWeight: '400', flexShrink: 1 },
  reorderArrows: { flexDirection: 'row', gap: 2, alignItems: 'center' },
  reorderArrow: { padding: 6 },
  reorderArrowText: { color: colors.textSecondary, fontSize: 18, fontWeight: '700' },
  // Edit profile
  editContent: { padding: 20 },
  avatarSection: { alignItems: 'center', marginBottom: 28, gap: 10 },
  editAvatar: { width: 80, height: 80, borderRadius: 40, borderWidth: 1, borderColor: colors.surface3 },
  changePhotoBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  changePhotoText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  fieldGroup: { gap: 16 },
  field: { gap: 6 },
  fieldLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontSize: 15,
  },
  fieldInputMulti: { minHeight: 72, textAlignVertical: 'top', paddingTop: 11 },
  fieldIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  fieldInputFlex: { flex: 1, backgroundColor: 'transparent', borderWidth: 0, paddingHorizontal: 0 },
})
