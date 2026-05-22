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
import { X, Zap, Settings, Gallery } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { fetchUserBuilds } from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import InitialsAvatar from '@/components/InitialsAvatar'

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

  async function handlePickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    })
    if (!result.canceled && result.assets[0]) {
      router.push({
        pathname: '/compose',
        params: { photoUri: result.assets[0].uri, buildId: selectedBuildId ?? '' },
      })
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
      router.push({
        pathname: '/compose',
        params: { photoUri: dataUrl, buildId: selectedBuildId ?? '' },
      })
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

      {/* Build selector — bottom right */}
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
      </ScrollView>
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
  buildScroll: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 28,
    right: 16,
    maxHeight: 160,
    width: 68,
  },
  buildList: { gap: 10, alignItems: 'flex-end', paddingBottom: 4 },
  buildItem: { alignItems: 'center', gap: 3 },
  buildThumb: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, borderColor: 'transparent',
    opacity: 0.45,
  },
  buildThumbFallback: { backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center' },
  buildThumbSelected: { borderColor: colors.accent, opacity: 1 },
  buildName: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '600', textAlign: 'center', width: 58 },
  buildNameSelected: { color: '#fff' },
})
