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
import { X, Zap, Settings, Gallery } from '@/components/Icons'
import { colors, MOCK_USER_ID } from '@/constants/throttlist'
import { MOCK_BUILDS } from '@/lib/data'
import InitialsAvatar from '@/components/InitialsAvatar'

const MY_BUILDS = MOCK_BUILDS.filter(b => b.userId === MOCK_USER_ID)

export default function CaptureScreen() {
  const [flash, setFlash] = useState(false)
  const [selectedBuildId, setSelectedBuildId] = useState(MY_BUILDS[0]?.id ?? null)
  const cameraRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)

  useEffect(() => {
    if (Platform.OS !== 'web') return
    const el = cameraRef.current
    if (!el) return

    const video = document.createElement('video')
    video.setAttribute('autoplay', '')
    video.setAttribute('playsinline', '')
    video.setAttribute('muted', '')
    Object.assign(video.style, {
      position: 'absolute',
      inset: '0',
      width: '100%',
      height: '100%',
      objectFit: 'cover',
    })
    el.appendChild(video)

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false })
      .then(stream => {
        streamRef.current = stream
        video.srcObject = stream
      })
      .catch(() => {})

    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop())
      if (el.contains(video)) el.removeChild(video)
    }
  }, [])

  return (
    <View style={styles.root}>
      {/* Live camera viewfinder */}
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

      {/* Bottom row: gallery | shutter | build picker */}
      <View style={styles.bottomBar}>
        {/* Gallery picker */}
        <Pressable style={styles.galleryBtn}>
          <Gallery size={26} color="#fff" />
        </Pressable>

        {/* Shutter */}
        <Pressable style={styles.shutter}>
          <View style={styles.shutterInner} />
        </Pressable>

        {/* Build selector — vertical stack bottom-right */}
        <ScrollView
          style={styles.buildScroll}
          contentContainerStyle={styles.buildList}
          showsVerticalScrollIndicator={false}
        >
          {MY_BUILDS.map(build => {
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
                  <View style={[styles.buildThumb, isSelected && styles.buildThumbSelected]}>
                    <InitialsAvatar name={build.nickname ?? build.model} size={40} />
                  </View>
                )}
                <Text
                  style={[styles.buildName, isSelected && styles.buildNameSelected]}
                  numberOfLines={1}
                >
                  {build.nickname ?? build.model}
                </Text>
              </Pressable>
            )
          })}
        </ScrollView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  topBar: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 28,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 28,
    gap: 0,
  },
  // Gallery
  galleryBtn: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  // Shutter
  shutter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 4,
  },
  shutterRing: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 4,
    borderColor: '#fff',
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Build picker
  buildScroll: {
    maxHeight: 160,
    width: 64,
  },
  buildList: {
    gap: 10,
    alignItems: 'center',
    paddingBottom: 4,
  },
  buildItem: {
    alignItems: 'center',
    gap: 3,
  },
  buildThumb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: 'transparent',
    opacity: 0.45,
  },
  buildThumbSelected: {
    borderColor: colors.accent,
    opacity: 1,
  },
  buildName: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 9,
    fontWeight: '600',
    textAlign: 'center',
    width: 58,
  },
  buildNameSelected: {
    color: '#fff',
  },
})
