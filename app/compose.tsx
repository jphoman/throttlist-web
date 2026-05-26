import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  Platform,
  ActivityIndicator,
  Modal,
  Linking,
  LayoutChangeEvent,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown, X, Tag, ExternalLink, Plus } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { fetchUserBuilds, createPost } from '@/lib/supabaseQueries'
import { BUILD_CATEGORIES } from '@/constants/buildTypes'
import type { LinkedProduct } from '@/types'

// ─── Affiliate config ─────────────────────────────────────────────────────────
const AMAZON_TAG = 'throttlist-20'

function buildTrackingUrl(rawUrl: string, userId: string): string {
  try {
    const uid = userId.slice(0, 12)
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    if (url.hostname.includes('amazon.')) {
      url.searchParams.set('tag', AMAZON_TAG)
      url.searchParams.set('ref', `tl_${uid}`)
    } else {
      url.searchParams.set('ref', `tl_${uid}`)
    }
    return url.toString()
  } catch {
    return rawUrl
  }
}

function parseUrl(rawUrl: string): { title: string; source: 'amazon' | 'web'; domain: string } {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    const isAmazon = url.hostname.includes('amazon.')
    const domain = url.hostname.replace(/^www\./, '')

    if (isAmazon) {
      // Extract title from path slug: /Product-Name/dp/ASIN
      const match = url.pathname.match(/^\/([^/]+)\/dp\//)
      const slug = match?.[1]?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? ''
      return { title: slug, source: 'amazon', domain }
    }

    return { title: '', source: 'web', domain }
  } catch {
    return { title: '', source: 'web', domain: '' }
  }
}

// ─── Product tag sheet ────────────────────────────────────────────────────────
interface ProductSheetProps {
  visible: boolean
  userId: string
  isPro: boolean
  partCategories: string[]
  onConfirm: (product: Omit<LinkedProduct, 'x' | 'y'>) => void
  onClose: () => void
}

type SheetMode = 'link' | 'manual'

function ProductSheet({ visible, userId, isPro, partCategories, onConfirm, onClose }: ProductSheetProps) {
  const [mode, setMode] = useState<SheetMode>('link')
  const [searchQuery, setSearchQuery] = useState('')
  const [pastedUrl, setPastedUrl] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [urlStep, setUrlStep] = useState<'search' | 'confirm'>('search')
  const [urlInfo, setUrlInfo] = useState<{ title: string; source: 'amazon' | 'web'; domain: string } | null>(null)

  function reset() {
    setSearchQuery('')
    setPastedUrl('')
    setTitle('')
    setCategory('')
    setUrlStep('search')
    setUrlInfo(null)
  }

  function handleUrlChange(text: string) {
    setPastedUrl(text)
    if (text.length > 10 && (text.includes('amazon.') || text.includes('http'))) {
      const info = parseUrl(text)
      setUrlInfo(info)
      if (info.title && !title) setTitle(info.title)
      if (info.domain) setUrlStep('confirm')
    } else {
      setUrlInfo(null)
      setUrlStep('search')
    }
  }

  function handleOpenAmazon() {
    const q = encodeURIComponent(searchQuery || 'parts accessories')
    Linking.openURL(`https://www.amazon.com/s?k=${q}&tag=${AMAZON_TAG}`)
  }

  function handleConfirm() {
    if (!title.trim()) return
    if (mode === 'link' && !pastedUrl.trim()) return

    const product: Omit<LinkedProduct, 'x' | 'y'> = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      brand: mode === 'link' ? (urlInfo?.domain ?? undefined) : undefined,
      rawUrl: mode === 'link' ? pastedUrl.trim() : '',
      trackingUrl: mode === 'link' ? buildTrackingUrl(pastedUrl.trim(), userId) : '',
      source: mode === 'manual' ? 'manual' : (urlInfo?.source ?? 'web'),
      category: category || undefined,
    }
    onConfirm(product)
    reset()
  }

  function handleClose() {
    reset()
    onClose()
  }

  function switchMode(m: SheetMode) {
    setMode(m)
    reset()
  }

  const canConfirm = title.trim().length > 0 && (mode === 'manual' || pastedUrl.trim().length > 0)

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <Pressable style={sh.backdrop} onPress={handleClose}>
        <Pressable style={sh.sheet} onPress={e => e.stopPropagation()}>
          <View style={sh.handle} />

          {/* Header */}
          <View style={sh.header}>
            <Text style={sh.headerTitle}>Tag a Product</Text>
            <Pressable onPress={handleClose} style={sh.closeBtn}>
              <X size={18} color={colors.textSecondary} />
            </Pressable>
          </View>

          {/* Mode tabs */}
          <View style={sh.modeTabs}>
            <Pressable
              style={[sh.modeTab, mode === 'link' && sh.modeTabActive]}
              onPress={() => switchMode('link')}
            >
              <ExternalLink size={13} color={mode === 'link' ? '#fff' : colors.textSecondary} />
              <Text style={[sh.modeTabText, mode === 'link' && sh.modeTabTextActive]}>Link Product</Text>
            </Pressable>
            <Pressable
              style={[sh.modeTab, mode === 'manual' && sh.modeTabActive]}
              onPress={() => switchMode('manual')}
            >
              <Tag size={13} color={mode === 'manual' ? '#fff' : colors.textSecondary} />
              <Text style={[sh.modeTabText, mode === 'manual' && sh.modeTabTextActive]}>Manual Tag</Text>
            </Pressable>
          </View>

          {/* Pro upsell banner */}
          {!isPro && (
            <Pressable
              style={sh.proBanner}
              onPress={() => { handleClose(); router.push('/pro-signup') }}
            >
              <Text style={sh.proBannerText}>
                Pro users can earn commission on tags —{' '}
                <Text style={sh.proBannerLink}>sign up now</Text>
              </Text>
            </Pressable>
          )}

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* ── LINK mode ── */}
            {mode === 'link' && (
              <>
                <View style={sh.section}>
                  <Text style={sh.sectionLabel}>SEARCH</Text>
                  <View style={sh.row}>
                    <TextInput
                      style={[sh.input, { flex: 1 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                      placeholder="Product name, brand, model…"
                      placeholderTextColor={colors.textTertiary}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      returnKeyType="search"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <Pressable style={sh.amazonBtn} onPress={handleOpenAmazon}>
                      <ExternalLink size={14} color="#fff" />
                      <Text style={sh.amazonBtnText}>Amazon</Text>
                    </Pressable>
                  </View>
                  <Text style={sh.hint}>Opens Amazon in your browser — copy the URL, then paste below.</Text>
                </View>

                <View style={sh.section}>
                  <Text style={sh.sectionLabel}>PASTE PRODUCT URL</Text>
                  <TextInput
                    style={[sh.input, sh.fullInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                    placeholder="https://www.amazon.com/…"
                    placeholderTextColor={colors.textTertiary}
                    value={pastedUrl}
                    onChangeText={handleUrlChange}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                  />
                  {urlInfo && (
                    <View style={sh.urlPreview}>
                      <View style={[sh.sourceDot, urlInfo.source === 'amazon' && sh.sourceDotAmazon]} />
                      <Text style={sh.urlDomain}>{urlInfo.domain}</Text>
                      {urlInfo.source === 'amazon' && (
                        <View style={sh.affiliatePill}>
                          <Text style={sh.affiliatePillText}>affiliate tracked</Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>

                {urlStep === 'confirm' && (
                  <View style={sh.section}>
                    <Text style={sh.sectionLabel}>PRODUCT TITLE</Text>
                    <TextInput
                      style={[sh.input, sh.fullInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                      placeholder="Enter or edit product name"
                      placeholderTextColor={colors.textTertiary}
                      value={title}
                      onChangeText={setTitle}
                      autoCapitalize="words"
                    />
                  </View>
                )}

                <View style={sh.affiliateNote}>
                  <Text style={sh.affiliateNoteText}>
                    🔗 A unique tracking link is generated per tag. Throttlist earns a commission when followers purchase — revenue is shared monthly with contributing members.
                  </Text>
                </View>
              </>
            )}

            {/* ── MANUAL mode ── */}
            {mode === 'manual' && (
              <>
                <View style={sh.section}>
                  <Text style={sh.sectionLabel}>PRODUCT / PART NAME</Text>
                  <TextInput
                    style={[sh.input, sh.fullInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                    placeholder="e.g. Custom powder coat, Vintage seat, Hand-stitched grips…"
                    placeholderTextColor={colors.textTertiary}
                    value={title}
                    onChangeText={setTitle}
                    autoCapitalize="words"
                  />
                </View>
                <View style={sh.manualNote}>
                  <Text style={sh.manualNoteText}>
                    Use this for custom fabrication, one-off parts, vintage finds, or anything without a purchase link.
                  </Text>
                </View>
              </>
            )}

            {/* ── Category picker (both modes) ── */}
            {partCategories.length > 0 && (
              <View style={sh.section}>
                <Text style={sh.sectionLabel}>CATEGORY</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={sh.catRow}>
                  {partCategories.map(cat => (
                    <Pressable
                      key={cat}
                      style={[sh.catChip, category === cat && sh.catChipActive]}
                      onPress={() => setCategory(prev => prev === cat ? '' : cat)}
                    >
                      <Text style={[sh.catChipText, category === cat && sh.catChipTextActive]}>
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Confirm */}
            <Pressable
              style={[sh.confirmBtn, !canConfirm && sh.confirmBtnDim]}
              onPress={handleConfirm}
              disabled={!canConfirm}
            >
              <Tag size={16} color="#fff" />
              <Text style={sh.confirmBtnText}>
                {mode === 'manual' ? 'Add Manual Tag' : 'Tag This Product'}
              </Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

const sh = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
    maxHeight: '85%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: colors.surface3,
    alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  closeBtn: { padding: 4 },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  row: { flexDirection: 'row', gap: 8 },
  input: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.textPrimary,
    fontSize: 14,
  },
  urlInput: { flex: 0, width: '100%' },
  amazonBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FF9900',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexShrink: 0,
  },
  amazonBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  hint: { color: colors.textTertiary, fontSize: 11, marginTop: 7, lineHeight: 16 },
  urlPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  sourceDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.textTertiary },
  sourceDotAmazon: { backgroundColor: '#FF9900' },
  urlDomain: { color: colors.textSecondary, fontSize: 12 },
  affiliatePill: {
    backgroundColor: colors.accent + '22',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.accent + '55',
  },
  affiliatePillText: { color: colors.accent, fontSize: 10, fontWeight: '600' },
  affiliateNote: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  affiliateNoteText: { color: colors.textTertiary, fontSize: 12, lineHeight: 18 },
  proBanner: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: colors.accent + '15',
    borderWidth: 1,
    borderColor: colors.accent + '40',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  proBannerText: {
    color: colors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  proBannerLink: {
    color: colors.accent,
    fontWeight: '700',
  },
  modeTabs: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 4,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 3,
    gap: 3,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabActive: { backgroundColor: colors.accent },
  modeTabText: { color: colors.textSecondary, fontSize: 13, fontWeight: '600' },
  modeTabTextActive: { color: '#fff' },
  fullInput: { flex: 0, width: '100%' },
  manualNote: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manualNoteText: { color: colors.textTertiary, fontSize: 12, lineHeight: 18 },
  catRow: {
    flexDirection: 'row',
    gap: 7,
    paddingBottom: 4,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  catChipText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
  catChipTextActive: { color: '#fff' },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 4,
  },
  confirmBtnDim: { opacity: 0.4 },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
})

// ─── Main compose screen ──────────────────────────────────────────────────────
export default function ComposeScreen() {
  const { photoUri, buildId: initialBuildId } = useLocalSearchParams<{ photoUri: string; buildId: string }>()
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''
  const queryClient = useQueryClient()

  const [caption, setCaption] = useState('')
  const [selectedBuildId, setSelectedBuildId] = useState(initialBuildId ?? '')
  const [buildPickerOpen, setBuildPickerOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Product tagging
  const [productTags, setProductTags] = useState<LinkedProduct[]>([])
  const [productSheetOpen, setProductSheetOpen] = useState(false)
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null)
  const [imageLayout, setImageLayout] = useState({ width: 1, height: 1 })
  const [tapMode, setTapMode] = useState(false) // when true, next tap places a pin

  const { data: myBuilds = [] } = useQuery({
    queryKey: ['my-builds', userId],
    queryFn: () => fetchUserBuilds(userId),
    enabled: !!userId,
  })

  const selectedBuild = myBuilds.find(b => b.id === selectedBuildId)
  const buildCategoryDef = BUILD_CATEGORIES.find(c => c.id === selectedBuild?.buildType)
  const partCategories = buildCategoryDef?.partCategories ?? []
  const isPro = myBuilds.some(b => b.ownerIsPro)

  async function uploadPhoto(uri: string): Promise<string | null> {
    try {
      const resp = await fetch(uri)
      const blob = await resp.blob()
      const ext = blob.type.includes('png') ? 'png' : 'jpg'
      const path = `${userId}/${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('posts')
        .upload(path, blob, { contentType: blob.type, upsert: false })
      if (uploadError) throw uploadError
      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path)
      return publicUrl
    } catch {
      return null
    }
  }

  async function handlePost() {
    if (!photoUri || !userId) return
    setSubmitting(true)
    setError(null)
    try {
      const photoUrl = await uploadPhoto(photoUri)
      if (!photoUrl) throw new Error('Photo upload failed. Check that the "posts" storage bucket exists.')

      const newPost = await createPost({
        user_id: userId,
        build_id: selectedBuildId || null,
        photos: [photoUrl],
        caption: caption.trim() || null,
        linked_products: productTags.length > 0 ? productTags : undefined,
      })
      if (!newPost) throw new Error('Failed to save post. Check the posts table RLS policies.')

      await queryClient.invalidateQueries({ queryKey: ['feed-posts'] })
      router.replace('/feed')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleImageLayout(e: LayoutChangeEvent) {
    const { width, height } = e.nativeEvent.layout
    setImageLayout({ width, height })
  }

  function handleImagePress(e: any) {
    if (!tapMode) return
    const { locationX, locationY } = e.nativeEvent
    const x = Math.max(0.05, Math.min(0.95, locationX / imageLayout.width))
    const y = Math.max(0.05, Math.min(0.95, locationY / imageLayout.height))
    setPendingPin({ x, y })
    setTapMode(false)
    setProductSheetOpen(true)
  }

  function handleProductConfirm(partial: Omit<LinkedProduct, 'x' | 'y'>) {
    const pin = pendingPin ?? { x: 0.5, y: 0.5 }
    setProductTags(prev => [...prev, { ...partial, x: pin.x, y: pin.y }])
    setPendingPin(null)
    setProductSheetOpen(false)
  }

  function handleRemoveTag(id: string) {
    setProductTags(prev => prev.filter(t => t.id !== id))
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>New Post</Text>
        <Pressable
          style={[styles.postBtn, (!photoUri || submitting) && styles.postBtnDim]}
          onPress={handlePost}
          disabled={!photoUri || submitting}
        >
          {submitting
            ? <ActivityIndicator size="small" color="#fff" />
            : <Text style={styles.postBtnText}>Post</Text>
          }
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Photo + tap-to-tag */}
        <View style={styles.photoWrap}>
          {photoUri ? (
            <Pressable
              onPress={handleImagePress}
              onLayout={handleImageLayout}
              style={[styles.photoTouchable, tapMode && styles.photoTouchableTap]}
            >
              <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />

              {/* Tap-mode crosshair hint */}
              {tapMode && (
                <View style={styles.tapHint} pointerEvents="none">
                  <View style={styles.tapCrosshair}>
                    <Text style={styles.tapHintText}>Tap to place tag</Text>
                  </View>
                </View>
              )}

              {/* Existing product tag pins */}
              {productTags.map((tag, i) => (
                <Pressable
                  key={tag.id}
                  style={[
                    styles.tagPin,
                    {
                      left: tag.x * imageLayout.width - 16,
                      top: tag.y * imageLayout.height - 16,
                    },
                  ]}
                  onPress={(e) => { e.stopPropagation(); handleRemoveTag(tag.id) }}
                >
                  <View style={styles.tagPinBubble}>
                    <Tag size={12} color="#fff" />
                  </View>
                  <View style={styles.tagPinLabel}>
                    <Text style={styles.tagPinLabelText} numberOfLines={1}>{tag.title}</Text>
                  </View>
                </Pressable>
              ))}
            </Pressable>
          ) : (
            <View style={[styles.photo, styles.photoPlaceholder]}>
              <Text style={{ color: colors.textTertiary }}>No photo selected</Text>
            </View>
          )}

          {/* Tag product floating button on photo */}
          {photoUri && !tapMode && (
            <Pressable
              style={styles.tagPhotoBtn}
              onPress={() => setTapMode(true)}
            >
              <Tag size={14} color="#fff" />
              <Text style={styles.tagPhotoBtnText}>
                {productTags.length > 0 ? `${productTags.length} tagged` : 'Tag products'}
              </Text>
            </Pressable>
          )}

          {/* Cancel tap mode */}
          {tapMode && (
            <Pressable style={styles.cancelTapBtn} onPress={() => setTapMode(false)}>
              <X size={16} color="#fff" />
              <Text style={styles.cancelTapText}>Cancel</Text>
            </Pressable>
          )}
        </View>

        {/* Caption */}
        <View style={styles.section}>
          <TextInput
            style={[styles.captionInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            value={caption}
            onChangeText={setCaption}
            placeholder="Write a caption…"
            placeholderTextColor={colors.textTertiary}
            multiline
            maxLength={500}
            autoFocus
          />
          <Text style={styles.charCount}>{caption.length}/500</Text>
        </View>

        {/* Build selector */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tag a Build</Text>
          <Pressable style={styles.buildSelector} onPress={() => setBuildPickerOpen(v => !v)}>
            <Text style={selectedBuild ? styles.buildSelectorValue : styles.buildSelectorPlaceholder}>
              {selectedBuild
                ? `${selectedBuild.nickname || selectedBuild.model} — ${selectedBuild.year} ${selectedBuild.make} ${selectedBuild.model}`
                : 'Select a build (optional)'}
            </Text>
            <ChevronDown size={16} color={colors.textTertiary} />
          </Pressable>
          {buildPickerOpen && (
            <View style={styles.buildList}>
              <Pressable
                style={styles.buildOption}
                onPress={() => { setSelectedBuildId(''); setBuildPickerOpen(false) }}
              >
                <Text style={[styles.buildOptionText, { color: colors.textTertiary }]}>None</Text>
              </Pressable>
              {myBuilds.map(build => (
                <Pressable
                  key={build.id}
                  style={[styles.buildOption, selectedBuildId === build.id && styles.buildOptionActive]}
                  onPress={() => { setSelectedBuildId(build.id); setBuildPickerOpen(false) }}
                >
                  <Text style={[styles.buildOptionText, selectedBuildId === build.id && styles.buildOptionTextActive]}>
                    {build.nickname || build.model}
                  </Text>
                  <Text style={styles.buildOptionSub}>{build.year} {build.make} {build.model}</Text>
                </Pressable>
              ))}
              {myBuilds.length === 0 && (
                <Text style={styles.noBuildsText}>No builds yet — add one from your profile.</Text>
              )}
            </View>
          )}
        </View>

        {/* Tagged products list */}
        {productTags.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Tagged Products ({productTags.length})</Text>
            <View style={styles.productList}>
              {productTags.map(tag => (
                <View key={tag.id} style={styles.productRow}>
                  <View style={styles.productRowInfo}>
                    <View style={[
                      styles.productSource,
                      tag.source === 'amazon' && styles.productSourceAmazon,
                      tag.source === 'manual' && styles.productSourceManual,
                    ]}>
                      <Text style={[
                        styles.productSourceText,
                        tag.source === 'manual' && styles.productSourceTextManual,
                      ]}>
                        {tag.source === 'amazon' ? 'AMZ' : tag.source === 'manual' ? 'MAN' : 'WEB'}
                      </Text>
                    </View>
                    <View style={styles.productRowText}>
                      <Text style={styles.productTitle} numberOfLines={1}>{tag.title}</Text>
                      <Text style={styles.productDomain} numberOfLines={1}>
                        {[tag.category, tag.brand].filter(Boolean).join(' · ')}
                      </Text>
                    </View>
                  </View>
                  <Pressable onPress={() => handleRemoveTag(tag.id)} style={styles.productRemove}>
                    <X size={14} color={colors.textTertiary} />
                  </Pressable>
                </View>
              ))}

              {/* Add another */}
              <Pressable
                style={styles.addProductRow}
                onPress={() => {
                  setPendingPin({ x: 0.5, y: 0.5 })
                  setProductSheetOpen(true)
                }}
              >
                <Plus size={14} color={colors.accent} />
                <Text style={styles.addProductText}>Add another product</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Empty tag CTA */}
        {productTags.length === 0 && photoUri && (
          <Pressable
            style={styles.emptyTagCta}
            onPress={() => {
              setPendingPin({ x: 0.5, y: 0.5 })
              setProductSheetOpen(true)
            }}
          >
            <Tag size={16} color={colors.accent} />
            <View>
              <Text style={styles.emptyTagTitle}>Tag Products</Text>
              <Text style={styles.emptyTagSub}>Link mods, gear, or accessories from Amazon and earn affiliate revenue</Text>
            </View>
          </Pressable>
        )}

        {error && <Text style={styles.errorText}>{error}</Text>}
      </ScrollView>

      <ProductSheet
        visible={productSheetOpen}
        userId={userId}
        isPro={isPro}
        partCategories={partCategories}
        onConfirm={handleProductConfirm}
        onClose={() => { setProductSheetOpen(false); setPendingPin(null) }}
      />
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
  backBtn: { padding: 4, width: 44 },
  headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  postBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 18,
    paddingVertical: 7,
    borderRadius: 20,
    minWidth: 60,
    alignItems: 'center',
  },
  postBtnDim: { opacity: 0.4 },
  postBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  content: { paddingBottom: 48 },

  // Photo
  photoWrap: { position: 'relative' },
  photoTouchable: { width: '100%', aspectRatio: 4 / 3 },
  photoTouchableTap: { borderWidth: 2, borderColor: colors.accent },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.surface1 },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },

  // Tap mode overlay
  tapHint: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  tapCrosshair: {
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.7)',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  tapHintText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },

  // Tag pins on image
  tagPin: {
    position: 'absolute',
    alignItems: 'flex-start',
  },
  tagPinBubble: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: '#fff',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.4, shadowRadius: 4,
  },
  tagPinLabel: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginTop: 3,
    maxWidth: 120,
  },
  tagPinLabelText: { color: '#fff', fontSize: 10, fontWeight: '600' },

  // Tag photo button (bottom of photo)
  tagPhotoBtn: {
    position: 'absolute',
    bottom: 10,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  tagPhotoBtnText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  cancelTapBtn: {
    position: 'absolute',
    bottom: 10,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cancelTapText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Sections
  section: { paddingHorizontal: 16, paddingTop: 16 },
  captionInput: {
    color: colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 80,
    textAlignVertical: 'top',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingBottom: 8,
  },
  charCount: { color: colors.textTertiary, fontSize: 11, textAlign: 'right', marginTop: 4 },
  sectionLabel: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },

  // Build selector
  buildSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  buildSelectorValue: { color: colors.textPrimary, fontSize: 14, flex: 1 },
  buildSelectorPlaceholder: { color: colors.textTertiary, fontSize: 14, flex: 1 },
  buildList: {
    marginTop: 4,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  buildOption: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  buildOptionActive: { backgroundColor: colors.surface2 },
  buildOptionText: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  buildOptionTextActive: { color: colors.accent },
  buildOptionSub: { color: colors.textTertiary, fontSize: 11, marginTop: 2 },
  noBuildsText: { color: colors.textTertiary, fontSize: 13, padding: 14 },

  // Product list
  productList: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    overflow: 'hidden',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 10,
  },
  productRowInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  productSource: {
    backgroundColor: colors.surface3,
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  productSourceAmazon: { backgroundColor: '#FF990022', borderWidth: 1, borderColor: '#FF990044' },
  productSourceManual: { backgroundColor: colors.accent + '22', borderWidth: 1, borderColor: colors.accent + '44' },
  productSourceText: { color: '#FF9900', fontSize: 9, fontWeight: '700', letterSpacing: 0.5 },
  productSourceTextManual: { color: colors.accent },
  productRowText: { flex: 1 },
  productTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '500' },
  productDomain: { color: colors.textTertiary, fontSize: 11, marginTop: 1 },
  productRemove: { padding: 4 },
  addProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addProductText: { color: colors.accent, fontSize: 13, fontWeight: '600' },

  // Empty tag CTA
  emptyTagCta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: colors.surface1,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTagTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  emptyTagSub: { color: colors.textTertiary, fontSize: 12, lineHeight: 17 },

  errorText: { color: '#f87171', fontSize: 13, marginHorizontal: 16, marginTop: 12, textAlign: 'center' },
})
