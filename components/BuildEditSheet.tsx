import React, { useState, useEffect, useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  Switch,
  Platform,
  KeyboardAvoidingView,
  Image,
  ActivityIndicator,
} from 'react-native'
import { X, Camera, Plus, Lock, Globe } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { supabase } from '@/lib/supabase'
import type { Build, Post } from '@/types'

interface BuildEditSheetProps {
  visible: boolean
  build: Build
  posts?: Post[]
  userId?: string
  onClose: () => void
  onSave: (updates: {
    nickname?: string
    tags?: string[]
    isPrivate?: boolean
    coverPhotoUrl?: string
  }) => void
}

export default function BuildEditSheet({ visible, build, posts = [], userId, onClose, onSave }: BuildEditSheetProps) {
  const [nickname, setNickname] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [isPrivate, setIsPrivate] = useState(false)
  const [selectedCoverUrl, setSelectedCoverUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)

  useEffect(() => {
    if (visible) {
      setNickname(build.nickname ?? '')
      const parsed: string[] = (() => { try { return JSON.parse(build.tags) } catch { return [] } })()
      setTags(parsed)
      setIsPrivate(build.status === 'private')
      setSelectedCoverUrl(null) // reset selection each time sheet opens
      setUploadError(null)
      setSaveError(null)
    }
  }, [visible, build])

  // Collect all unique photo URLs from posts
  const postPhotos = useMemo(() => {
    const seen = new Set<string>()
    const result: string[] = []
    posts.forEach(p => {
      try {
        const photos: string[] = JSON.parse(p.photos)
        photos.forEach(url => {
          if (url && !seen.has(url)) {
            seen.add(url)
            result.push(url)
          }
        })
      } catch {}
    })
    return result
  }, [posts])

  async function handleFileChange(e: any) {
    const file = e.target?.files?.[0]
    if (!file) return
    setUploadError(null)
    setUploading(true)
    try {
      const ext = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
      const path = `${userId}/cover-${Date.now()}.${ext}`
      const { error } = await supabase.storage
        .from('posts')
        .upload(path, file, { contentType: file.type, upsert: true })
      if (error) throw error
      const { data: { publicUrl } } = supabase.storage.from('posts').getPublicUrl(path)
      setSelectedCoverUrl(publicUrl)
      // Reset the input so the same file can be re-selected if needed
      e.target.value = ''
    } catch (err: any) {
      console.error('Cover upload failed', err)
      setUploadError(err?.message ?? 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  function addTag() {
    const raw = tagInput.trim().toLowerCase().replace(/^#/, '').replace(/\s+/g, '-')
    if (!raw || tags.includes(raw)) { setTagInput(''); return }
    setTags(prev => [...prev, raw])
    setTagInput('')
  }

  function removeTag(tag: string) {
    setTags(prev => prev.filter(t => t !== tag))
  }

  async function handleSave() {
    setSaving(true)
    setSaveError(null)
    try {
      await onSave({
        nickname: nickname.trim(),
        tags,
        isPrivate,
        ...(selectedCoverUrl ? { coverPhotoUrl: selectedCoverUrl } : {}),
      })
      onClose()
    } catch (err: any) {
      console.error('Save failed', err)
      setSaveError(err?.message ?? 'Save failed. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const displayCoverUrl = selectedCoverUrl || build.coverPhotoUrl || null

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.sheetWrap}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={styles.sheet}>
            {/* Handle */}
            <View style={styles.handle} />

            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Edit Build</Text>
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
              {/* Cover photo */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Cover Photo</Text>

                {/* Current cover preview */}
                {displayCoverUrl ? (
                  <View style={styles.currentCoverWrap}>
                    <Image
                      source={{ uri: displayCoverUrl }}
                      style={styles.currentCover}
                      resizeMode="cover"
                    />
                    {selectedCoverUrl && (
                      <View style={styles.selectedBadge}>
                        <Text style={styles.selectedBadgeText}>New selection</Text>
                      </View>
                    )}
                  </View>
                ) : (
                  <View style={[styles.currentCover, styles.currentCoverEmpty]}>
                    <Camera size={22} color={colors.textTertiary} />
                    <Text style={styles.noCoverText}>No cover photo yet</Text>
                  </View>
                )}

                {/* Selectable post thumbnails */}
                {postPhotos.length > 0 && (
                  <>
                    <Text style={styles.coverPickerLabel}>Choose from posts</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.thumbScrollContent}
                      style={styles.thumbScroll}
                    >
                      {postPhotos.map((url, i) => {
                        const isSelected = selectedCoverUrl === url
                        return (
                          <Pressable
                            key={url + i}
                            onPress={() => setSelectedCoverUrl(isSelected ? null : url)}
                            style={[styles.thumbOption, isSelected && styles.thumbOptionSelected]}
                          >
                            <Image source={{ uri: url }} style={styles.thumbOptionImg} resizeMode="cover" />
                            {isSelected && (
                              <View style={styles.thumbCheckOverlay}>
                                <Text style={styles.thumbCheckText}>✓</Text>
                              </View>
                            )}
                          </Pressable>
                        )
                      })}
                    </ScrollView>
                  </>
                )}

                {/* Upload error */}
                {uploadError && (
                  <Text style={styles.uploadError}>{uploadError}</Text>
                )}

                {/* Upload new image */}
                {Platform.OS === 'web' ? (
                  <>
                    <input
                      id="cover-photo-file-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      disabled={uploading}
                    />
                    <label
                      htmlFor="cover-photo-file-input"
                      style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 10,
                        backgroundColor: colors.surface2,
                        borderRadius: 10,
                        paddingLeft: 14,
                        paddingRight: 14,
                        paddingTop: 12,
                        paddingBottom: 12,
                        border: `1px dashed ${colors.surface3}`,
                        marginBottom: 8,
                        cursor: uploading ? 'not-allowed' : 'pointer',
                        opacity: uploading ? 0.5 : 1,
                      } as any}
                    >
                      {uploading ? (
                        <ActivityIndicator size="small" color={colors.textSecondary} />
                      ) : (
                        <>
                          <Camera size={18} color={colors.textSecondary} />
                          <Text style={styles.coverPhotoBtnText}>Upload new image</Text>
                        </>
                      )}
                    </label>
                  </>
                ) : (
                  <Pressable
                    style={styles.coverPhotoBtn}
                    disabled={uploading || !userId}
                  >
                    {uploading ? (
                      <ActivityIndicator size="small" color={colors.textSecondary} />
                    ) : (
                      <>
                        <Camera size={18} color={colors.textSecondary} />
                        <Text style={styles.coverPhotoBtnText}>Upload new image</Text>
                      </>
                    )}
                  </Pressable>
                )}
              </View>

              {/* Nickname */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Build Nickname</Text>
                <TextInput
                  style={styles.input}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder="e.g. The Cappuccino"
                  placeholderTextColor={colors.textTertiary}
                  returnKeyType="done"
                  maxLength={60}
                />
              </View>

              {/* Year / Make / Model — display only for now */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Bike</Text>
                <View style={styles.readonlyRow}>
                  <Text style={styles.readonlyValue}>
                    {build.year} {build.make} {build.model}
                  </Text>
                  <Text style={styles.readonlyHint}>Contact support to update</Text>
                </View>
              </View>

              {/* Hashtags */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Hashtags</Text>
                <View style={styles.tagWrap}>
                  {tags.map(tag => (
                    <View key={tag} style={styles.tagPill}>
                      <Text style={styles.tagPillText}>#{tag}</Text>
                      <Pressable onPress={() => removeTag(tag)} style={styles.tagRemove}>
                        <X size={11} color={colors.textSecondary} />
                      </Pressable>
                    </View>
                  ))}
                </View>
                <View style={styles.tagInputRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={tagInput}
                    onChangeText={setTagInput}
                    placeholder="#add-tag"
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    onSubmitEditing={addTag}
                    maxLength={40}
                  />
                  <Pressable
                    style={[styles.addTagBtn, !tagInput.trim() && styles.addTagBtnDisabled]}
                    onPress={addTag}
                    disabled={!tagInput.trim()}
                  >
                    <Plus size={16} color={tagInput.trim() ? colors.accent : colors.textTertiary} />
                  </Pressable>
                </View>
              </View>

              {/* Privacy */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Visibility</Text>
                <View style={styles.toggleRow}>
                  {isPrivate
                    ? <Lock size={16} color={colors.textSecondary} />
                    : <Globe size={16} color={colors.green} />
                  }
                  <Text style={styles.toggleLabel}>
                    {isPrivate ? 'Private — only you can see this build' : 'Public — visible to everyone'}
                  </Text>
                  <Switch
                    value={isPrivate}
                    onValueChange={setIsPrivate}
                    trackColor={{ false: colors.surface3, true: colors.accent }}
                    thumbColor="#fff"
                  />
                </View>
              </View>

              <View style={{ height: 24 }} />
            </ScrollView>

            {/* Save */}
            {saveError ? (
              <Text style={styles.saveError}>{saveError}</Text>
            ) : null}
            <View style={styles.footer}>
              <Pressable style={styles.cancelBtn} onPress={onClose} disabled={saving}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </Pressable>
              <Pressable
                style={[styles.saveBtn, (uploading || saving) && { opacity: 0.5 }]}
                onPress={handleSave}
                disabled={uploading || saving}
              >
                <Text style={styles.saveBtnText}>
                  {uploading ? 'Uploading…' : saving ? 'Saving…' : 'Save Changes'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheetWrap: {
    maxHeight: '90%',
  },
  sheet: {
    backgroundColor: colors.surface1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: Platform.OS === 'ios' ? 32 : 16,
  },
  handle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surface3,
    alignSelf: 'center',
    marginTop: 10,
    marginBottom: 4,
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
  title: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: { padding: 4 },
  scroll: { maxHeight: 520 },
  scrollContent: { paddingBottom: 8 },
  // Sections
  section: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 4,
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
  // Cover photo
  currentCoverWrap: {
    position: 'relative',
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
  },
  currentCover: {
    width: '100%',
    height: 140,
    borderRadius: 10,
    backgroundColor: colors.surface2,
  },
  currentCoverEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: colors.surface3,
    borderStyle: 'dashed',
    marginBottom: 10,
  },
  noCoverText: {
    color: colors.textTertiary,
    fontSize: 13,
  },
  uploadError: {
    color: colors.accent,
    fontSize: 12,
    marginBottom: 8,
  },
  selectedBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  selectedBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  coverPickerLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  thumbScroll: {
    marginBottom: 10,
  },
  thumbScrollContent: {
    gap: 8,
    paddingRight: 4,
  },
  thumbOption: {
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbOptionSelected: {
    borderColor: colors.accent,
  },
  thumbOptionImg: {
    width: '100%',
    height: '100%',
  },
  thumbCheckOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbCheckText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '800',
  },
  coverPhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.surface3,
    borderStyle: 'dashed',
    marginBottom: 8,
  },
  coverPhotoBtnText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  // Input
  input: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: colors.textPrimary,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.surface3,
    marginBottom: 8,
  },
  // Readonly
  readonlyRow: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readonlyValue: {
    color: colors.textPrimary,
    fontSize: 15,
  },
  readonlyHint: {
    color: colors.textTertiary,
    fontSize: 11,
  },
  // Tags
  tagWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginBottom: 10,
  },
  tagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.surface3,
    borderRadius: 20,
    paddingLeft: 10,
    paddingRight: 6,
    paddingVertical: 5,
  },
  tagPillText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '500',
  },
  tagRemove: {
    padding: 2,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    marginBottom: 8,
  },
  addTagBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addTagBtnDisabled: {
    backgroundColor: colors.surface2,
  },
  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  toggleLabel: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  saveError: {
    color: colors.accent,
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
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
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  cancelBtnText: {
    color: colors.textSecondary,
    fontSize: 15,
    fontWeight: '600',
  },
  saveBtn: {
    flex: 2,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: colors.accent,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})
