/**
 * ProductSheet — shared bottom-sheet for tagging products in a post.
 * Used identically during post creation (compose) and post editing (PostEditSheet).
 * Edit this ONE file; both surfaces update automatically.
 *
 * Tabs
 * ────
 *  🔍 Amazon  — opens Amazon search in in-app browser; user copies URL, pastes back
 *  🔍 Google  — opens Google Shopping in in-app browser; same paste-back flow
 *  🔗 Link    — paste any product URL directly (existing flow)
 *  ✍️ Manual  — no URL; for custom / handmade parts (accessible via small link)
 *
 * Affiliate tracking
 * ──────────────────
 * Every confirmed tag gets a unique tracking ID (tl_{user}_{build}_{rand})
 * appended as the `ref` param. Amazon links also get tag=throttlist-20.
 * A row is saved to product_tags in Supabase for future payout attribution.
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
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import { X, ExternalLink, Tag, Search } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import type { LinkedProduct } from '@/types'
import { AMAZON_TAG, generateTrackingId, appendAffiliateTag, extractDomain, isAmazonUrl } from '@/lib/affiliateUtils'
import { saveProductTag } from '@/lib/supabaseQueries'

// ─── Types ────────────────────────────────────────────────────────────────────

/** @deprecated Use affiliateUtils.buildTrackingUrl instead — kept for any callers. */
export function buildTrackingUrl(rawUrl: string, userId: string): string {
  return appendAffiliateTag(rawUrl, generateTrackingId(userId))
}

export type SheetMode = 'amazon' | 'google' | 'link' | 'manual'

export interface ProductSheetProps {
  visible: boolean
  userId: string
  buildId?: string
  isPro: boolean
  partCategories: string[]
  onConfirm: (product: Omit<LinkedProduct, 'x' | 'y'>) => void
  onClose: () => void
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseUrl(rawUrl: string): { source: 'amazon' | 'web'; domain: string } {
  const domain = extractDomain(rawUrl)
  return { source: isAmazonUrl(rawUrl) ? 'amazon' : 'web', domain }
}

function looksLikeUrl(s: string): boolean {
  return s.length > 10 && (
    s.includes('http') || s.includes('www.') || /\.[a-z]{2,}\//.test(s)
  )
}

function extractTitleFromUrl(rawUrl: string): string {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    const { hostname, pathname } = url
    const toTitle = (s: string) =>
      s.replace(/[-_+]/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).trim()
    if (hostname.includes('amazon.')) {
      const m = pathname.match(/^\/([^/]+)\/(?:dp|gp)\//)
      if (m?.[1]) return toTitle(m[1])
    }
    if (hostname.includes('ebay.')) {
      const m = pathname.match(/\/itm\/([^/]+)/)
      if (m?.[1]) return toTitle(m[1]).replace(/\s+\d{7,}$/, '').trim()
    }
    const SKIP = /^(dp|gp|product|products|item|items|p|buy|shop|detail|details|pd|sku|ref|\d+)$/i
    const segments = pathname.split('/').filter(Boolean)
    for (let i = segments.length - 1; i >= 0; i--) {
      const s = segments[i]
      if (s.length > 5 && !SKIP.test(s) && !/^\d+$/.test(s)) {
        return toTitle(s.replace(/-\d{4,}$/, ''))
      }
    }
    return ''
  } catch { return '' }
}

function cleanTitle(raw: string): string {
  return raw
    .replace(/^amazon\.com\s*:\s*/i, '')
    .replace(/,?\s*(automotive|powersports|sports & outdoors|electronics|tools & home improvement|clothing|shoes & jewelry).*$/i, '')
    .replace(/\s*\|\s*.+$/, '')
    .replace(/\s*[-–—]\s*(amazon|ebay|revzilla|walmart|target|fortnine|partzilla|rocky mountain atv).*$/i, '')
    .trim()
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ProductSheet({
  visible,
  userId,
  buildId,
  isPro,
  partCategories,
  onConfirm,
  onClose,
}: ProductSheetProps) {
  const [mode, setMode] = useState<SheetMode>('link')

  // Search state (amazon / google tabs)
  const [searchQuery, setSearchQuery] = useState('')
  const [browserOpened, setBrowserOpened] = useState(false)

  // URL / confirm state (link, amazon, google)
  const [pastedUrl, setPastedUrl] = useState('')
  const [urlInfo, setUrlInfo] = useState<{ source: 'amazon' | 'web'; domain: string } | null>(null)
  const [urlStep, setUrlStep] = useState<'input' | 'confirm'>('input')
  const [fetchingTitle, setFetchingTitle] = useState(false)

  // Shared confirm state
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')

  const userEditedTitleRef = useRef(false)
  const fetchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Reset ──────────────────────────────────────────────────────────────────

  function reset() {
    setSearchQuery('')
    setBrowserOpened(false)
    setPastedUrl('')
    setUrlInfo(null)
    setUrlStep('input')
    setFetchingTitle(false)
    setTitle('')
    setCategory('')
    userEditedTitleRef.current = false
    if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
  }

  function switchMode(m: SheetMode) {
    setMode(m)
    reset()
  }

  // ─── URL processing (shared by all URL-based tabs) ───────────────────────────

  async function fetchTitleFromUrl(url: string) {
    setFetchingTitle(true)
    try {
      const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      const data = await res.json()
      if (data.status === 'success' && data.data?.title) {
        const fetched = cleanTitle(data.data.title)
        if (fetched && !userEditedTitleRef.current) setTitle(fetched)
      }
    } catch { /* silently fail */ } finally {
      setFetchingTitle(false)
    }
  }

  function handleUrlChange(text: string) {
    setPastedUrl(text)
    userEditedTitleRef.current = false
    if (looksLikeUrl(text)) {
      const info = parseUrl(text)
      setUrlInfo(info)
      if (info.domain) setUrlStep('confirm')
      const slugTitle = extractTitleFromUrl(text)
      if (slugTitle) setTitle(slugTitle)
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
      fetchTimerRef.current = setTimeout(() => fetchTitleFromUrl(text), 800)
    } else {
      setUrlInfo(null)
      setUrlStep('input')
      setTitle('')
      setFetchingTitle(false)
      if (fetchTimerRef.current) clearTimeout(fetchTimerRef.current)
    }
  }

  // ─── Amazon / Google search open ─────────────────────────────────────────────

  async function handleOpenSearch() {
    const q = encodeURIComponent(searchQuery.trim() || 'parts accessories')
    const url = mode === 'amazon'
      ? `https://www.amazon.com/s?k=${q}&tag=${AMAZON_TAG}`
      : `https://www.google.com/search?tbm=shop&q=${q}`
    await WebBrowser.openBrowserAsync(url)
    setBrowserOpened(true)

    // On web, try reading clipboard automatically after browser closes.
    // This only works if the user has already granted clipboard-read permission.
    if (Platform.OS === 'web' && typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        const clip = await navigator.clipboard.readText()
        if (clip && looksLikeUrl(clip)) handleUrlChange(clip)
      } catch { /* permission not granted — user will paste manually */ }
    }
  }

  // ─── Confirm ──────────────────────────────────────────────────────────────────

  function handleConfirm() {
    if (!title.trim()) return

    // Link/manual tabs both allow an empty URL — treat any empty-URL submission as 'manual'
    const isUrlless = mode === 'manual' || ((mode === 'link') && !pastedUrl.trim())

    const trackingId = generateTrackingId(userId, buildId)
    const raw = isUrlless ? '' : pastedUrl.trim()
    const affiliateUrl = isUrlless ? '' : appendAffiliateTag(raw, trackingId)
    const domain = isUrlless ? undefined : (urlInfo?.domain || extractDomain(raw) || undefined)
    const source: LinkedProduct['source'] = isUrlless ? 'manual' : (urlInfo?.source ?? 'web')

    const product: Omit<LinkedProduct, 'x' | 'y'> = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title: title.trim(),
      brand: domain,
      rawUrl: raw,
      trackingUrl: affiliateUrl,
      source,
      category: category || undefined,
    }

    onConfirm(product)

    // Fire-and-forget analytics save — never blocks the UI
    if (!isUrlless && raw) {
      saveProductTag({
        userId,
        buildId,
        trackingId,
        productUrl: raw,
        affiliateUrl,
        productTitle: title.trim(),
        sourceDomain: domain,
        category: category || undefined,
      }).catch(err => console.warn('[ProductSheet] product_tags save failed', err))
    }

    reset()
  }

  function handleClose() {
    reset()
    onClose()
  }

  // For the Manual tab (link/manual modes), URL is optional — only title is required.
  // For Amazon/Google tabs, a URL must be recognised before confirm is allowed (urlStep === 'confirm').
  const canConfirm = title.trim().length > 0

  // ─── Render ───────────────────────────────────────────────────────────────────

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

          {/* 3-tab bar */}
          <View style={sh.modeTabs}>
            <Pressable
              style={[sh.modeTab, mode === 'amazon' && sh.modeTabActive]}
              onPress={() => switchMode('amazon')}
            >
              <Search size={12} color={mode === 'amazon' ? '#fff' : colors.textSecondary} />
              <Text style={[sh.modeTabText, mode === 'amazon' && sh.modeTabTextActive]}>Amazon</Text>
            </Pressable>
            <Pressable
              style={[sh.modeTab, mode === 'google' && sh.modeTabActive]}
              onPress={() => switchMode('google')}
            >
              <Search size={12} color={mode === 'google' ? '#fff' : colors.textSecondary} />
              <Text style={[sh.modeTabText, mode === 'google' && sh.modeTabTextActive]}>Google</Text>
            </Pressable>
            <Pressable
              style={[sh.modeTab, (mode === 'link' || mode === 'manual') && sh.modeTabActive]}
              onPress={() => switchMode('link')}
            >
              <Tag size={12} color={(mode === 'link' || mode === 'manual') ? '#fff' : colors.textSecondary} />
              <Text style={[sh.modeTabText, (mode === 'link' || mode === 'manual') && sh.modeTabTextActive]}>Manual</Text>
            </Pressable>
          </View>

          {/* Pro upsell — shown only on search tabs, not Manual */}
          {!isPro && (mode === 'amazon' || mode === 'google') && (
            <Pressable
              style={sh.proBanner}
              onPress={() => { handleClose(); router.push('/pro-signup') }}
            >
              <Text style={sh.proBannerText}>
                Pro users earn commission on every product tag —{' '}
                <Text style={sh.proBannerLink}>upgrade now</Text>
              </Text>
            </Pressable>
          )}

          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

            {/* ── AMAZON / GOOGLE search tabs ── */}
            {(mode === 'amazon' || mode === 'google') && (
              <>
                {!browserOpened ? (
                  /* Phase 1 — search + open browser */
                  <View style={sh.section}>
                    <Text style={sh.sectionLabel}>
                      {mode === 'amazon' ? 'SEARCH AMAZON' : 'SEARCH GOOGLE SHOPPING'}
                    </Text>
                    <View style={sh.searchRow}>
                      <TextInput
                        style={[sh.input, { flex: 1 }, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                        placeholder={mode === 'amazon' ? 'e.g. SC Project exhaust, SHOEI helmet…' : 'e.g. Biltwell grips, RevZilla jacket…'}
                        placeholderTextColor={colors.textTertiary}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        returnKeyType="search"
                        onSubmitEditing={handleOpenSearch}
                        autoCapitalize="none"
                        autoCorrect={false}
                      />
                      <Pressable
                        style={[sh.searchBtn, mode === 'google' && sh.searchBtnGoogle]}
                        onPress={handleOpenSearch}
                      >
                        <Search size={14} color="#fff" />
                        <Text style={sh.searchBtnText}>
                          {mode === 'amazon' ? 'Amazon' : 'Google'}
                        </Text>
                      </Pressable>
                    </View>
                    <Text style={sh.hint}>
                      {mode === 'amazon'
                        ? `Opens Amazon with your affiliate tag pre-loaded. Find a product, copy its URL, then come back here.`
                        : `Opens Google Shopping. Find a product at any retailer, copy the URL, then come back here.`}
                    </Text>
                  </View>
                ) : (
                  /* Phase 2 — paste URL after browser returned */
                  <View style={sh.section}>
                    <View style={sh.returnBanner}>
                      <Text style={sh.returnBannerTitle}>Found something?</Text>
                      <Text style={sh.returnBannerHint}>
                        Copy the product URL from {mode === 'amazon' ? 'Amazon' : 'the product page'} and paste it below.
                      </Text>
                    </View>
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
                      autoFocus
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
                    <Pressable onPress={() => { setBrowserOpened(false); setPastedUrl(''); setUrlInfo(null); setUrlStep('input') }} style={sh.searchAgainLink}>
                      <Text style={sh.searchAgainText}>← Search again</Text>
                    </Pressable>
                  </View>
                )}

                {/* Phase 3 — title + category (after URL recognised) */}
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
                      onChangeText={t => { setTitle(t); userEditedTitleRef.current = true }}
                      autoCapitalize="words"
                    />
                  </View>
                )}
              </>
            )}

            {/* ── MANUAL tab (formerly Link) ── */}
            {/* Title is the primary field; URL is optional for affiliate tracking */}
            {(mode === 'link' || mode === 'manual') && (
              <>
                {/* Item Description — always shown, required */}
                <View style={sh.section}>
                  <View style={sh.sectionLabelRow}>
                    <Text style={sh.sectionLabel}>ITEM DESCRIPTION</Text>
                    {fetchingTitle && (
                      <View style={sh.fetchingBadge}>
                        <ActivityIndicator size="small" color={colors.textTertiary} style={{ transform: [{ scale: 0.65 }] }} />
                        <Text style={sh.fetchingBadgeText}>fetching…</Text>
                      </View>
                    )}
                  </View>
                  <TextInput
                    style={[sh.input, sh.fullInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                    placeholder="Product name, brand, model…"
                    placeholderTextColor={colors.textTertiary}
                    value={title}
                    onChangeText={t => { setTitle(t); userEditedTitleRef.current = true }}
                    autoCapitalize="words"
                  />
                </View>

                {/* Product URL — optional */}
                <View style={sh.section}>
                  <Text style={sh.sectionLabel}>PRODUCT URL (OPTIONAL)</Text>
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
              </>
            )}

            {/* Category picker (all modes except initial search phase) */}
            {partCategories.length > 0 && (mode === 'manual' || mode === 'link' || urlStep === 'confirm') && (
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

            {/* Confirm button */}
            {(mode === 'manual' || mode === 'link' || urlStep === 'confirm') && (
              <Pressable
                style={[sh.confirmBtn, !canConfirm && sh.confirmBtnDim]}
                onPress={handleConfirm}
                disabled={!canConfirm}
              >
                <Tag size={16} color="#fff" />
                <Text style={sh.confirmBtnText}>Tag This Product</Text>
              </Pressable>
            )}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────
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
    gap: 5,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modeTabActive: { backgroundColor: colors.accent },
  modeTabText: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
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
  proBannerLink: { color: '#FF6666', fontWeight: '700', textDecorationLine: 'underline' },
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
  fetchingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fetchingBadgeText: { color: colors.textTertiary, fontSize: 10, fontWeight: '500' },
  searchRow: { flexDirection: 'row', gap: 8 },
  input: {
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
  searchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FF9900',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexShrink: 0,
  },
  searchBtnGoogle: { backgroundColor: '#4285F4' },
  searchBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  hint: { color: colors.textTertiary, fontSize: 11, marginTop: 7, lineHeight: 16 },
  returnBanner: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  returnBannerTitle: { color: colors.textPrimary, fontSize: 13, fontWeight: '700', marginBottom: 2 },
  returnBannerHint: { color: colors.textSecondary, fontSize: 12, lineHeight: 17 },
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
  searchAgainLink: { marginTop: 10 },
  searchAgainText: { color: colors.textTertiary, fontSize: 12 },
  manualFallbackLink: { paddingHorizontal: 20, paddingTop: 10 },
  manualFallbackText: { color: colors.textTertiary, fontSize: 12 },
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
