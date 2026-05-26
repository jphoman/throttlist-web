/**
 * ProductSheet — shared bottom-sheet for tagging products in a post.
 * Used identically during post creation (compose) and post editing (PostEditSheet).
 * Edit this ONE file; both surfaces update automatically.
 */
import React, { useState, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  Modal,
  Linking,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { X, ExternalLink, Tag } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import type { LinkedProduct } from '@/types'

// ─── Affiliate config ─────────────────────────────────────────────────────────
const AMAZON_TAG = 'throttlist-20'

export function buildTrackingUrl(rawUrl: string, userId: string): string {
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

function parseUrl(rawUrl: string): { source: 'amazon' | 'web'; domain: string } {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    const isAmazon = url.hostname.includes('amazon.')
    const domain = url.hostname.replace(/^www\./, '')
    return { source: isAmazon ? 'amazon' : 'web', domain }
  } catch {
    return { source: 'web', domain: '' }
  }
}

/**
 * Immediately extract a readable title from the URL slug — no network needed.
 * Works for Amazon, eBay, RevZilla, and most e-commerce slugs.
 */
function extractTitleFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    const { hostname, pathname } = url

    const toTitle = (s: string) =>
      s.replace(/[-_+]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim()

    // Amazon: /Product-Slug/dp/ASIN  or  /Product-Slug/gp/product/ASIN
    if (hostname.includes('amazon.')) {
      const m = pathname.match(/^\/([^/]+)\/(?:dp|gp)\//)
      if (m?.[1]) return toTitle(m[1])
    }

    // eBay: /itm/product-slug  or  /itm/product-slug/ITEMID
    if (hostname.includes('ebay.')) {
      const m = pathname.match(/\/itm\/([^/]+)/)
      if (m?.[1]) return toTitle(m[1]).replace(/\s+\d{7,}$/, '').trim()
    }

    // Generic: walk path segments right-to-left, pick the first that looks like
    // a product name (not a pure number, not a short ID, not a known non-name segment)
    const SKIP = /^(dp|gp|product|products|item|items|p|buy|shop|detail|details|pd|sku|ref|\d+)$/i
    const segments = pathname.split('/').filter(Boolean)
    for (let i = segments.length - 1; i >= 0; i--) {
      const s = segments[i]
      if (s.length > 5 && !SKIP.test(s) && !/^\d+$/.test(s)) {
        // Strip trailing numeric ID that some sites append to slugs (e.g. "akrapovic-exhaust-12345")
        return toTitle(s.replace(/-\d{4,}$/, ''))
      }
    }

    return ''
  } catch {
    return ''
  }
}

/** Strip boilerplate site-name suffixes from a fetched page <title>. */
function cleanTitle(raw: string): string {
  return raw
    .replace(/^amazon\.com\s*:\s*/i, '')
    .replace(/,?\s*(automotive|powersports|sports & outdoors|electronics|tools & home improvement|clothing|shoes & jewelry).*$/i, '')
    .replace(/\s*\|\s*.+$/, '')
    .replace(/\s*[-–—]\s*(amazon|ebay|revzilla|walmart|target|fortnine|partzilla|rocky mountain atv).*$/i, '')
    .trim()
}

// ─── Types ────────────────────────────────────────────────────────────────────
export type SheetMode = 'link' | 'manual'

export interface ProductSheetProps {
  visible: boolean
  userId: string
  isPro: boolean
  partCategories: string[]
  onConfirm: (product: Omit<LinkedProduct, 'x' | 'y'>) => void
  onClose: () => void
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function ProductSheet({
  visible,
  userId,
  isPro,
  partCategories,
  onConfirm,
  onClose,
}: ProductSheetProps) {
  const [mode, setMode] = useState<SheetMode>('link')
  const [searchQuery, setSearchQuery] = useState('')
  const [pastedUrl, setPastedUrl] = useState('')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [urlStep, setUrlStep] = useState<'search' | 'confirm'>('search')
  const [urlInfo, setUrlInfo] = useState<{ source: 'amazon' | 'web'; domain: string } | null>(null)
  const [fetchingTitle, setFetchingTitle] = useState(false)

  // Ref: true when user has manually typed in the title field — prevents auto-fetch from overwriting
  const userEditedTitleRef = useRef(false)
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  function reset() {
    setSearchQuery('')
    setPastedUrl('')
    setTitle('')
    setCategory('')
    setUrlStep('search')
    setUrlInfo(null)
    setFetchingTitle(false)
    userEditedTitleRef.current = false
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
  }

  async function fetchTitleFromUrl(url: string) {
    setFetchingTitle(true)
    try {
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (data.status === 'success' && data.data?.title) {
        const fetched = cleanTitle(data.data.title)
        if (fetched && !userEditedTitleRef.current) {
          setTitle(fetched)
        }
      }
    } catch {
      // silently fail — user can type title manually
    } finally {
      setFetchingTitle(false)
    }
  }

  function handleUrlChange(text: string) {
    setPastedUrl(text)
    // Reset manual-edit flag whenever the URL changes
    userEditedTitleRef.current = false

    const looksLikeUrl = text.length > 10 && (
      text.includes('http') || text.includes('www.') || /\.[a-z]{2,}\//.test(text)
    )

    if (looksLikeUrl) {
      const info = parseUrl(text)
      setUrlInfo(info)
      if (info.domain) setUrlStep('confirm')

      // ① Instant title from URL slug — zero network, works immediately
      const slugTitle = extractTitleFromUrl(text)
      if (slugTitle) setTitle(slugTitle)

      // ② Microlink fetch as secondary enhancement (debounced 800ms)
      //    Overwrites slug title only if user hasn't manually edited yet
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
      fetchTimerRef.current = setTimeout(() => fetchTitleFromUrl(text), 800)
    } else {
      setUrlInfo(null)
      setUrlStep('search')
      setTitle('')
      setFetchingTitle(false)
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    }
  }

  function handleTitleChange(text: string) {
    setTitle(text)
    userEditedTitleRef.current = true
  }

  function handleOpenAmazon() {
    const q = encodeURIComponent(searchQuery || 'parts accessories')
    WebBrowser.openBrowserAsync(`https://www.amazon.com/s?k=${q}&tag=${AMAZON_TAG}`)
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

          {/* Pro upsell banner — only for non-pro users */}
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
                    <View style={sh.sectionLabelRow}>
                      <Text style={sh.sectionLabel}>PRODUCT TITLE</Text>
                      {fetchingTitle && (
                        <View style={sh.fetchingBadge}>
                          <ActivityIndicator size="small" color={colors.textTertiary} style={{ transform: [{ scale: 0.65 }] }} />
                          <Text style={sh.fetchingBadgeText}>fetching…</Text>
                        </View>
                      )}
                    </View>
                    <TextInput
                      style={[sh.input, sh.fullInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                      placeholder={fetchingTitle ? 'Fetching title…' : 'Enter or edit product name'}
                      placeholderTextColor={colors.textTertiary}
                      value={title}
                      onChangeText={handleTitleChange}
                      autoCapitalize="words"
                    />
                  </View>
                )}

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

// ─── Styles (exported so ProductTagList can import source-badge styles) ────────
export const sh = StyleSheet.create({
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
  proBanner: {
    marginHorizontal: 20,
    marginTop: 10,
    backgroundColor: '#3A0000',
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  proBannerText: {
    color: '#FFCCCC',
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  proBannerLink: {
    color: '#FF6666',
    fontWeight: '700',
    textDecorationLine: 'underline',
  },
  section: { paddingHorizontal: 20, paddingTop: 16 },
  sectionLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  fetchingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fetchingBadgeText: {
    color: colors.textTertiary,
    fontSize: 10,
    fontWeight: '500',
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
  fullInput: { flex: 0, width: '100%' },
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
  catRow: { flexDirection: 'row', gap: 7, paddingBottom: 4 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
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
