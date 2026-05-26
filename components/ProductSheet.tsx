/**
 * ProductSheet — shared bottom-sheet for tagging products in a post.
 * Used identically during post creation (compose) and post editing (PostEditSheet).
 * Edit this ONE file; both surfaces update automatically.
 */
import React, { useState } from 'react'
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
} from 'react-native'
import { router } from 'expo-router'
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

function parseUrl(rawUrl: string): { title: string; source: 'amazon' | 'web'; domain: string } {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    const isAmazon = url.hostname.includes('amazon.')
    const domain = url.hostname.replace(/^www\./, '')
    if (isAmazon) {
      const match = url.pathname.match(/^\/([^/]+)\/dp\//)
      const slug = match?.[1]?.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) ?? ''
      return { title: slug, source: 'amazon', domain }
    }
    return { title: '', source: 'web', domain }
  } catch {
    return { title: '', source: 'web', domain: '' }
  }
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
