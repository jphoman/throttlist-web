import React, { useState } from 'react'
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
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, ChevronDown } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { useAuth } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import { fetchUserBuilds, createPost } from '@/lib/supabaseQueries'

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

  const { data: myBuilds = [] } = useQuery({
    queryKey: ['my-builds', userId],
    queryFn: () => fetchUserBuilds(userId),
    enabled: !!userId,
  })

  const selectedBuild = myBuilds.find(b => b.id === selectedBuildId)

  async function uploadPhoto(uri: string): Promise<string | null> {
    try {
      // Works for data URLs (camera capture) and blob URLs (image picker on web)
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
      if (!photoUrl) throw new Error('Photo upload failed. Make sure the "posts" storage bucket exists.')

      await createPost({
        user_id: userId,
        build_id: selectedBuildId || null,
        photos: [photoUrl],
        caption: caption.trim() || null,
      })

      await queryClient.invalidateQueries({ queryKey: ['feed-posts'] })
      router.replace('/feed')
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong.')
    } finally {
      setSubmitting(false)
    }
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
        {/* Photo preview */}
        {photoUri ? (
          <Image source={{ uri: photoUri }} style={styles.photo} resizeMode="cover" />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={{ color: colors.textTertiary }}>No photo selected</Text>
          </View>
        )}

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

        {error && <Text style={styles.errorText}>{error}</Text>}
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
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: colors.surface1,
  },
  photoPlaceholder: { alignItems: 'center', justifyContent: 'center' },
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
  errorText: { color: '#f87171', fontSize: 13, marginHorizontal: 16, marginTop: 12, textAlign: 'center' },
})
