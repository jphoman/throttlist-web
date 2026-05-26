/**
 * PostEditSheet — edit an existing post.
 * Product tagging uses the shared <ProductSheet> component — identical UI and
 * logic as the compose (creation) screen. Edit ProductSheet.tsx and both
 * surfaces update automatically.
 */
import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  Image,
  Platform,
  KeyboardAvoidingView,
  Alert,
} from 'react-native'
import { X, Pin, Lock, Globe, Trash, Camera, Tag, Plus } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import type { Post, LinkedProduct } from '@/types'
// Shared product tag sheet — single source of truth with compose screen
import ProductSheet from '@/components/ProductSheet'

interface PostEditSheetProps {
  visible: boolean
  post: Post
  /** Auth user ID — used for affiliate tracking URL generation */
  userId: string
  /** Whether the viewing user has a Pro subscription */
  isPro: boolean
  /** Part categories for the build associated with this post */
  partCategories: string[]
  isPinned: boolean
  onClose: () => void
  onSave: (updates: {
    caption: string
    isPrivate: boolean
    linkedProducts: LinkedProduct[]
  }) => void
  onTogglePin: () => void
  onDelete: () => void
}

export default function PostEditSheet({
  visible,
  post,
  userId,
  isPro,
  partCategories,
  isPinned,
  onClose,
  onSave,
  onTogglePin,
  onDelete,
}: PostEditSheetProps) {
  const [caption, setCaption] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [photos, setPhotos] = useState<string[]>([])
  const [linkedProducts, setLinkedProducts] = useState<LinkedProduct[]>([])
  const [productSheetOpen, setProductSheetOpen] = useState(false)

  // Seed state when the sheet opens
  useEffect(() => {
    if (visible) {
      setCaption(post.caption ?? '')
      setIsPrivate(false)
      setPhotos((() => { try { return JSON.parse(post.photos) } catch { return [] } })())
      setLinkedProducts((() => { try { return JSON.parse(post.linkedProducts ?? '[]') } catch { return [] } })())
      setProductSheetOpen(false)
    }
  }, [visible, post])

  function removePhoto(uri: string) {
    setPhotos(prev => prev.filter(p => p !== uri))
  }

  function handleProductConfirm(partial: Omit<LinkedProduct, 'x' | 'y'>) {
    // Edit mode: no image tap to place pin, pin at centre (0.5, 0.5)
    setLinkedProducts(prev => [...prev, { ...partial, x: 0.5, y: 0.5 }])
    setProductSheetOpen(false)
  }

  function handleRemoveProduct(id: string) {
    setLinkedProducts(prev => prev.filter(p => p.id !== id))
  }

  function handleSave() {
    onSave({ caption: caption.trim(), isPrivate, linkedProducts })
    onClose()
  }

  function handleDelete() {
    Alert.alert(
      'Delete Post',
      'This post will be permanently removed. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => { onDelete(); onClose() } },
      ],
    )
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.sheetWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.sheet}>
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Edit Post</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textSecondary} />
              </Pressable>
            </View>

            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Photos */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Photos</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.photosRow}
                >
                  {photos.map((uri, i) => (
                    <View key={i} style={styles.photoWrap}>
                      <Image source={{ uri }} style={styles.photoThumb} resizeMode="cover" />
                      <Pressable style={styles.photoRemove} onPress={() => removePhoto(uri)}>
                        <X size={11} color="#fff" />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable style={styles.addPhotoBtn}>
                    <Camera size={20} color={colors.textTertiary} />
                    <Text style={styles.addPhotoBtnText}>Add</Text>
                  </Pressable>
                </ScrollView>
              </View>

              {/* Caption */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Caption</Text>
                <TextInput
                  style={[styles.input, styles.captionInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  value={caption}
                  onChangeText={setCaption}
                  placeholder="Write a caption…"
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  maxLength={1000}
                />
              </View>

              {/* ── Tagged Products — identical list UI as compose screen ── */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Tagged Products</Text>

                {linkedProducts.length > 0 ? (
                  <View style={styles.productList}>
                    {linkedProducts.map(tag => (
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
                            <Text style={styles.productMeta} numberOfLines={1}>
                              {[tag.category, tag.brand].filter(Boolean).join(' · ')}
                            </Text>
                          </View>
                        </View>
                        <Pressable onPress={() => handleRemoveProduct(tag.id)} style={styles.productRemove}>
                          <X size={14} color={colors.textTertiary} />
                        </Pressable>
                      </View>
                    ))}

                    {/* Add another */}
                    <Pressable
                      style={styles.addProductRow}
                      onPress={() => setProductSheetOpen(true)}
                    >
                      <Plus size={14} color={colors.accent} />
                      <Text style={styles.addProductText}>Add another product</Text>
                    </Pressable>
                  </View>
                ) : (
                  /* Empty CTA — same look as compose */
                  <Pressable
                    style={styles.emptyTagCta}
                    onPress={() => setProductSheetOpen(true)}
                  >
                    <Tag size={16} color={colors.accent} />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emptyTagTitle}>Tag Products</Text>
                      <Text style={styles.emptyTagSub}>
                        Link mods, gear, or accessories from Amazon and earn affiliate revenue
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>

              {/* Pin to top */}
              <View style={styles.section}>
                <Pressable style={styles.toggleRow} onPress={onTogglePin}>
                  <Pin size={16} color={isPinned ? colors.accent : colors.textSecondary} />
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>Pin to Top</Text>
                    <Text style={styles.toggleHint}>Pinned post stays at the top of your build page</Text>
                  </View>
                  <Switch
                    value={isPinned}
                    onValueChange={onTogglePin}
                    trackColor={{ false: colors.surface3, true: colors.accent }}
                    thumbColor="#fff"
                  />
                </Pressable>
              </View>

              {/* Privacy */}
              <View style={styles.section}>
                <View style={styles.toggleRow}>
                  {isPrivate
                    ? <Lock size={16} color={colors.textSecondary} />
                    : <Globe size={16} color={colors.green} />
                  }
                  <View style={styles.toggleInfo}>
                    <Text style={styles.toggleLabel}>{isPrivate ? 'Private' : 'Public'}</Text>
                    <Text style={styles.toggleHint}>
                      {isPrivate ? 'Only you can see this post' : 'Visible to everyone who follows this build'}
                    </Text>
                  </View>
                  <Switch
                    value={isPrivate}
                    onValueChange={setIsPrivate}
                    trackColor={{ false: colors.surface3, true: colors.accent }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              {/* Delete */}
              <View style={[styles.section, { borderBottomWidth: 0, paddingBottom: 16 }]}>
                <Pressable style={styles.deleteBtn} onPress={handleDelete}>
                  <Trash size={16} color={colors.accent} />
                  <Text style={styles.deleteBtnText}>Delete Post</Text>
                </Pressable>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={styles.footer}>
              <Pressable style={styles.cancelBtn} onPress={onClose}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Changes</Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>

      {/* Shared ProductSheet — same component as compose */}
      <ProductSheet
        visible={productSheetOpen}
        userId={userId}
        isPro={isPro}
        partCategories={partCategories}
        onConfirm={handleProductConfirm}
        onClose={() => setProductSheetOpen(false)}
      />
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetWrap: { maxHeight: '92%' },
  sheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  handle: {
    width: 38, height: 4, borderRadius: 2,
    backgroundColor: colors.surface3,
    alignSelf: 'center',
    marginTop: 10, marginBottom: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  closeBtn: { padding: 4 },
  scroll: { maxHeight: 520 },
  scrollContent: { paddingBottom: 8 },
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionLabel: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  // Photos
  photosRow: { flexDirection: 'row', gap: 10, paddingBottom: 4 },
  photoWrap: { position: 'relative', width: 76, height: 76, borderRadius: 10, overflow: 'hidden' },
  photoThumb: { width: '100%', height: '100%', backgroundColor: colors.surface2 },
  photoRemove: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.65)',
    borderRadius: 10, width: 20, height: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 76, height: 76, borderRadius: 10,
    backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.surface3, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 4,
  },
  addPhotoBtnText: { color: colors.textTertiary, fontSize: 11 },
  // Caption
  input: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  captionInput: { minHeight: 90, textAlignVertical: 'top' },
  // Product list — mirrors compose.tsx productList styles
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
  productMeta: { color: colors.textTertiary, fontSize: 11, marginTop: 1 },
  productRemove: { padding: 4 },
  addProductRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  addProductText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  // Empty CTA — mirrors compose.tsx emptyTagCta
  emptyTagCta: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.surface1,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTagTitle: { color: colors.textPrimary, fontSize: 14, fontWeight: '600', marginBottom: 2 },
  emptyTagSub: { color: colors.textTertiary, fontSize: 12, lineHeight: 17 },
  // Toggle rows
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  toggleInfo: { flex: 1 },
  toggleLabel: { color: colors.textPrimary, fontSize: 14, fontWeight: '500' },
  toggleHint: { color: colors.textTertiary, fontSize: 11, marginTop: 2 },
  // Delete
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    backgroundColor: colors.accent + '18',
    borderWidth: 1,
    borderColor: colors.accent + '44',
    marginTop: 4,
  },
  deleteBtnText: { color: colors.accent, fontSize: 14, fontWeight: '600' },
  // Footer
  footer: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  cancelBtn: {
    flex: 1, borderRadius: 12, paddingVertical: 13, alignItems: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1, borderColor: colors.surface3,
  },
  cancelBtnText: { color: colors.textSecondary, fontSize: 15, fontWeight: '600' },
  saveBtn: { flex: 2, borderRadius: 12, paddingVertical: 13, alignItems: 'center', backgroundColor: colors.accent },
  saveBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
})
