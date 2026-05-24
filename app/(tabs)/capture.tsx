import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
  Image,
} from 'react-native'
import { router } from 'expo-router'
import * as ImagePicker from 'expo-image-picker'
import { useQuery } from '@tanstack/react-query'
import { X, Zap, Settings, Gallery, Plus } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { fetchUserBuilds } from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import InitialsAvatar from '@/components/InitialsAvatar'

// Web-only hidden file input for photo library access
let webFileInput: HTMLInputElement | null = null
function getWebFileInput(): HTMLInputElement {
  if (!webFileInput) {
    webFileInput = document.createElement('input')
    webFileInput.type = 'file'
    webFileInput.accept = 'image/*'
    webFileInput.multiple = false
    webFileInput.style.display = 'none'
    document.body.appendChild(webFileInput)
  }
  return webFileInput
}

export default function CaptureScreen() {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''

  const [flash, setFlash] = useState(false)
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null)
  const cameraRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const { data: myBuilds = [] } = useQuery({
    queryKey: ['my-builds', userId],
    queryFn: () => fetchUserBuilds(userId),
    enabled: !!userId,
  })

  // Auto-select first build once loaded
  useEffect(() => {
    if (myBuilds.length > 0 && !selectedBuildId) {
      setSelectedBuildId(myBuilds[0].id)
    }
  }, [myBuilds])

  // Start rear camera on web
  useEffect(() => {
    if (Platform.OS !== 'web') return
    const el = cameraRef.current
    if (!el) return

    const video = document.createElement('video')
    video.setAttribute('autoplay', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('muted', '')
    Object.assign(video.style, {
      position: 'absolute', inset: '0', width: '100%', height: '100%', objectFit: 'cover',
    })
    el.appendChild(video)

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(stream => { streamRef.current = stream; video.srcObject = stream })
      .catch(() => {})

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (el.contains(video)) el.removeChild(video)
    }
  }, [])

  function navigateWithPhoto(photoUri: string) {
    if (myBuilds.length === 0) {
      // No builds yet — go create one first, passing the photo along
      router.push({
        pathname: '/add-build',
        params: { returnTo: 'compose', photoUri },
      })
    } else {
      router.push({
        pathname: '/compose',
        params: { photoUri, buildId: selectedBuildId ?? '' },
      })
    }
  }

  async function handlePickFromGallery() {
    if (Platform.OS === 'web') {
      const input = getWebFileInput()
      // Remove any previous listener before adding a fresh one
      const fresh = input.cloneNode() as HTMLInputElement
      fresh.accept = 'image/*'
      fresh.multiple = false
      fresh.style.display = 'none'
      webFileInput = fresh
      document.body.appendChild(fresh)

      fresh.onchange = () => {
        const file = fresh.files?.[0]
        if (!file) return
        const uri = URL.createObjectURL(file)
        navigateWithPhoto(uri)
      }
      fresh.click()
      return
    }

    // Native (iOS/Android)
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    })
    if (!result.canceled && result.assets[0]) {
      navigateWithPhoto(result.assets[0].uri)
    }
  }

  async function handleShutter() {
    // On web: capture a frame from the live video stream
    if (Platform.OS === 'web') {
      const video = cameraRef.current?.querySelector('video') as HTMLVideoElement | null
      if (!video) { handlePickFromGallery(); return }
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
      navigateWithPhoto(dataUrl)
      return
    }
    handlePickFromGallery()
  }

  return (
    <View style={styles.root}>
      <View ref={cameraRef} style={styles.camera} />

      {/* Top controls */}
      <View style={styles.topBar}>
        <Pressable style={styles.iconBtn} onPress={() => router.replace('/(tabs)/feed')}>
          <X size={22} color="#fff" />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={() => setFlash(v => !v)}>
          <Zap size={22} color={flash ? '#FFD60A' : '#fff'} />
        </Pressable>
        <Pressable style={styles.iconBtn}>
          <Settings size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Gallery — bottom left */}
      <Pressable style={styles.galleryBtn} onPress={handlePickFromGallery}>
        <Gallery size={28} color="#fff" />
      </Pressable>

      {/* Shutter — centered */}
      <Pressable style={styles.shutter} onPress={handleShutter}>
        <View style={styles.shutterInner} />
      </Pressable>

      {/* No-builds overlay */}
      {myBuilds.length === 0 && (
        <Pressable
          style={styles.noBuildsOverlay}
          onPress={() => router.push({ pathname: '/add-build', params: { returnTo: 'capture' } })}
        >
          <View style={styles.noBuildsCard}>
            <View style={styles.noBuildsPlus}>
              <Plus size={22} color="#fff" />
            </View>
            <Text style={styles.noBuildsText}>Add a build{'\n'}to start posting</Text>
          </View>
        </Pressable>
      )}

      {/* Build selector — bottom right */}
      <View style={styles.buildScrollWrap}>
        <ScrollView
          style={styles.buildScroll}
          contentContainerStyle={styles.buildList}
          showsVerticalScrollIndicator={false}
        >
          {myBuilds.map(build => {
            const isSelected = build.id === selectedBuildId
            return (
              <Pressable
                key={build.id}
                style={styles.buildItem}
                onPress={() => setSelectedBuildId(build.id)}
              >
                {build.coverPhotoUrl ? (
                  <Image
                    source={{ uri: build.coverPhotoUrl }}
                    style={[styles.buildThumb, isSelected && styles.buildThumbSelected]}
                  />
                ) : (
                  <View style={[styles.buildThumb, styles.buildThumbFallback, isSelected && styles.buildThumbSelected]}>
                    <InitialsAvatar name={build.nickname || build.model} size={40} />
                  </View>
                )}
                <Text style={[styles.buildName, isSelected && styles.buildNameSelected]} numberOfLines={1}>
                  {build.nickname || build.model}
                </Text>
              </Pressable>
            )
          })}
          {/* Always show + to add another build */}
          <Pressable
            style={styles.buildItem}
            onPress={() => router.push({ pathname: '/add-build', params: { returnTo: 'capture' } })}
          >
            <View style={[styles.buildThumb, styles.buildThumbAdd]}>
              <Plus size={20} color={colors.textTertiary} />
            </View>
            <Text style={styles.buildName} numberOfLines={1}>Add</Text>
          </Pressable>
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000' },
  camera: { ...StyleSheet.absoluteFillObject, overflow: 'hidden' },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 20,
    left: 0, right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center', justifyContent: 'center',
  },
  galleryBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 56 : 36,
    left: 32,
    padding: 8,
  },
  shutter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 28,
    alignSelf: 'center',
    left: 0, right: 0,
    alignItems: 'center',
  },
  shutterInner: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  buildScrollWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 28,
    right: 16,
    maxHeight: 200,
    width: 68,
  },
  buildScroll: { width: 68 },
  buildList: { gap: 10, alignItems: 'flex-end', paddingBottom: 4 },
  buildItem: { alignItems: 'center', gap: 3 },
  buildThumb: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, borderColor: 'transparent',
    opacity: 0.45,
  },
  buildThumbFallback: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  buildThumbAdd: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 1,
  },
  buildThumbSelected: { borderColor: colors.accent, opacity: 1 },
  buildName: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '600', textAlign: 'center', width: 58 },
  buildNameSelected: { color: '#fff' },
  noBuildsOverlay: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 56 : 36,
    right: 80,
  },
  noBuildsCard: {
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  noBuildsPlus: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  noBuildsText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 16,
  },
})
