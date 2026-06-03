import React, { useEffect, useRef, useState, type ChangeEvent } from 'react'
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
import { CameraView, useCameraPermissions } from 'expo-camera'
import { useIsFocused } from '@react-navigation/native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useQuery } from '@tanstack/react-query'
import { X, Zap, Settings, Gallery, Plus, Clock, Crop, Grid, Sliders } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { fetchUserBuilds } from '@/lib/supabaseQueries'
import { useAuth } from '@/lib/auth'
import InitialsAvatar from '@/components/InitialsAvatar'


export default function CaptureScreen() {
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''
  const isFocused = useIsFocused()
  const insets = useSafeAreaInsets()
  const topOffset = insets.top + 6

  const [permission, requestPermission] = useCameraPermissions()
  const [flash, setFlash] = useState(false)
  const [selectedBuildId, setSelectedBuildId] = useState<string | null>(null)
  const cameraRef = useRef<any>(null)
  const streamRef = useRef<MediaStream | null>(null)

  // Once a photo is taken we switch the CameraView to inactive so the
  // green privacy indicator turns off while we navigate to compose.
  const [photoTaken, setPhotoTaken] = useState(false)

  // Settings panel state
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [activeSetting, setActiveSetting] = useState<'timer' | 'aspect' | 'grid' | 'hdr' | null>(null)
  const [timer, setTimer] = useState<'off' | '3' | '10'>('off')
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '4:3' | '16:9' | 'full'>('4:3')
  const [gridEnabled, setGridEnabled] = useState(false)
  const [hdrEnabled, setHdrEnabled] = useState(false)
  const [countdown, setCountdown] = useState<number | null>(null)
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const { data: myBuilds = [], isLoading: buildsLoading } = useQuery({
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

  // Request camera permission on native when screen mounts
  useEffect(() => {
    if (Platform.OS !== 'web' && permission && !permission.granted) {
      requestPermission()
    }
  }, [permission])

  // Reset photoTaken when the screen re-gains focus (user navigated back)
  useEffect(() => {
    if (isFocused) setPhotoTaken(false)
  }, [isFocused])

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

  function navigateWithPhoto(photoUri: string, photoBase64?: string | null) {
    if (myBuilds.length === 0) {
      router.push({
        pathname: '/add-build',
        params: { returnTo: 'compose', photoUri, photoBase64: photoBase64 ?? '' },
      })
    } else {
      router.push({
        pathname: '/compose',
        params: {
          photoUri,
          photoBase64: photoBase64 ?? '',
          buildId: selectedBuildId ?? '',
        },
      })
    }
  }

  function handleWebFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const uri = URL.createObjectURL(file)
    e.target.value = ''
    navigateWithPhoto(uri)
  }

  async function handlePickFromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
      // base64 required on native so uploadImage() can do a non-empty upload
      base64: Platform.OS !== 'web',
    })
    if (!result.canceled && result.assets[0]) {
      navigateWithPhoto(result.assets[0].uri, result.assets[0].base64 ?? null)
    }
  }

  async function captureNow() {
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
    // Native — take a photo with the camera
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.85,
          skipProcessing: false,
          // base64 required on native so uploadImage() can do a non-empty upload
          base64: true,
        })
        if (photo?.uri) {
          // Deactivate the camera before navigating so the green indicator turns off
          setPhotoTaken(true)
          navigateWithPhoto(photo.uri, photo.base64 ?? null)
          return
        }
      } catch {
        // fall through to gallery
      }
    }
    handlePickFromGallery()
  }

  async function handleShutter() {
    setSettingsOpen(false)
    setActiveSetting(null)

    const secs = timer === '3' ? 3 : timer === '10' ? 10 : 0
    if (secs > 0) {
      setCountdown(secs)
      let remaining = secs
      countdownRef.current = setInterval(() => {
        remaining -= 1
        if (remaining <= 0) {
          clearInterval(countdownRef.current!)
          countdownRef.current = null
          setCountdown(null)
          captureNow()
        } else {
          setCountdown(remaining)
        }
      }, 1000)
      return
    }
    captureNow()
  }

  function handleSettingsTap() {
    const next = !settingsOpen
    setSettingsOpen(next)
    if (!next) setActiveSetting(null)
  }

  function handleSettingKey(key: 'timer' | 'aspect' | 'grid' | 'hdr') {
    if (key === 'grid') { setGridEnabled(v => !v); setActiveSetting(null); return }
    if (key === 'hdr') { setHdrEnabled(v => !v); setActiveSetting(null); return }
    setActiveSetting(prev => prev === key ? null : key)
  }

  const hasNoBuilds = !buildsLoading && userId && myBuilds.length === 0

  if (hasNoBuilds) {
    return (
      <View style={styles.gate}>
        <Pressable style={[styles.closeGate, { top: topOffset }]} onPress={() => router.replace('/(tabs)/feed')}>
          <X size={22} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <Pressable
          style={styles.gateCard}
          onPress={() => router.push({ pathname: '/add-build', params: { returnTo: 'capture' } })}
        >
          <View style={styles.gatePlus}>
            <Plus size={26} color="#fff" />
          </View>
          <Text style={styles.gateTitle}>Add a build{'\n'}to start posting</Text>
          <Text style={styles.gateSub}>You need at least one build before you can share a post.</Text>
        </Pressable>
      </View>
    )
  }

  // Native: show permission prompt if not granted
  if (Platform.OS !== 'web' && permission && !permission.granted) {
    return (
      <View style={styles.gate}>
        <Pressable style={[styles.closeGate, { top: topOffset }]} onPress={() => router.replace('/(tabs)/feed')}>
          <X size={22} color="rgba(255,255,255,0.6)" />
        </Pressable>
        <View style={styles.gateCard}>
          <Text style={styles.gateTitle}>Camera access needed</Text>
          <Text style={styles.gateSub}>Throttlist needs camera access to take photos of your build.</Text>
          <Pressable
            style={[styles.gatePlus, { marginTop: 8, width: 'auto', paddingHorizontal: 24, borderRadius: 12 }]}
            onPress={requestPermission}
          >
            <Text style={{ color: '#fff', fontWeight: '700', fontSize: 15 }}>Allow Camera</Text>
          </Pressable>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.root}>
      {/* Camera viewfinder
          active={isFocused && !photoTaken} releases the native camera session
          as soon as we navigate away, turning off the green privacy indicator. */}
      {Platform.OS === 'web' ? (
        <View ref={cameraRef} style={styles.camera} />
      ) : (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          flash={flash ? 'on' : 'off'}
          active={isFocused && !photoTaken}
        />
      )}

      {/* Grid overlay */}
      {gridEnabled && (
        <View style={styles.gridOverlay} pointerEvents="none">
          <View style={[styles.gridLineH, { top: '33.3%' }]} />
          <View style={[styles.gridLineH, { top: '66.6%' }]} />
          <View style={[styles.gridLineV, { left: '33.3%' }]} />
          <View style={[styles.gridLineV, { left: '66.6%' }]} />
        </View>
      )}

      {/* Countdown overlay */}
      {countdown !== null && (
        <View style={styles.countdownOverlay} pointerEvents="none">
          <Text style={styles.countdownText}>{countdown}</Text>
        </View>
      )}

      {/* Top controls */}
      <View style={[styles.topBar, { top: topOffset }]}>
        <Pressable style={styles.iconBtn} onPress={() => router.replace('/(tabs)/feed')}>
          <X size={22} color="#fff" />
        </Pressable>
        <Pressable style={styles.iconBtn} onPress={() => setFlash(v => !v)}>
          <Zap size={22} color={flash ? '#FFD60A' : '#fff'} />
        </Pressable>
        <Pressable style={[styles.iconBtn, settingsOpen && styles.iconBtnActive]} onPress={handleSettingsTap}>
          <Settings size={22} color={settingsOpen ? colors.accent : '#fff'} />
        </Pressable>
      </View>

      {/* Settings panel */}
      {settingsOpen && (
        <View style={[styles.settingsPanel, { top: topOffset + 52 }]}>
          <View style={styles.settingsRow}>
            <Pressable
              style={[styles.settingBtn, activeSetting === 'timer' && styles.settingBtnActive]}
              onPress={() => handleSettingKey('timer')}
            >
              <Clock size={18} color={timer !== 'off' ? colors.accent : '#fff'} />
              <Text style={[styles.settingLabel, timer !== 'off' && styles.settingLabelActive]}>
                {timer === 'off' ? 'Timer' : `${timer}s`}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.settingBtn, activeSetting === 'aspect' && styles.settingBtnActive]}
              onPress={() => handleSettingKey('aspect')}
            >
              <Crop size={18} color={aspectRatio !== '4:3' ? colors.accent : '#fff'} />
              <Text style={[styles.settingLabel, aspectRatio !== '4:3' && styles.settingLabelActive]}>
                {aspectRatio}
              </Text>
            </Pressable>
            <Pressable
              style={[styles.settingBtn, gridEnabled && styles.settingBtnActive]}
              onPress={() => handleSettingKey('grid')}
            >
              <Grid size={18} color={gridEnabled ? colors.accent : '#fff'} />
              <Text style={[styles.settingLabel, gridEnabled && styles.settingLabelActive]}>Grid</Text>
            </Pressable>
            <Pressable
              style={[styles.settingBtn, hdrEnabled && styles.settingBtnActive]}
              onPress={() => handleSettingKey('hdr')}
            >
              <Sliders size={18} color={hdrEnabled ? colors.accent : '#fff'} />
              <Text style={[styles.settingLabel, hdrEnabled && styles.settingLabelActive]}>HDR</Text>
            </Pressable>
          </View>

          {activeSetting === 'timer' && (
            <View style={styles.subRow}>
              {(['off', '3', '10'] as const).map(v => (
                <Pressable
                  key={v}
                  style={[styles.chip, timer === v && styles.chipActive]}
                  onPress={() => { setTimer(v); setActiveSetting(null) }}
                >
                  <Text style={[styles.chipText, timer === v && styles.chipTextActive]}>
                    {v === 'off' ? 'Off' : `${v}s`}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}

          {activeSetting === 'aspect' && (
            <View style={styles.subRow}>
              {(['1:1', '4:3', '16:9', 'full'] as const).map(v => (
                <Pressable
                  key={v}
                  style={[styles.chip, aspectRatio === v && styles.chipActive]}
                  onPress={() => { setAspectRatio(v); setActiveSetting(null) }}
                >
                  <Text style={[styles.chipText, aspectRatio === v && styles.chipTextActive]}>
                    {v === 'full' ? 'Full' : v}
                  </Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>
      )}

      {/* Gallery */}
      {Platform.OS === 'web' ? (
        <>
          {/* @ts-ignore */}
          <input id="gallery-file-input" type="file" accept="image/*" onChange={handleWebFileChange} style={{ display: 'none' }} />
          {/* @ts-ignore */}
          <label htmlFor="gallery-file-input" style={{ position: 'absolute', bottom: 36, left: 32, padding: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
            <Gallery size={28} color="#fff" />
          </label>
        </>
      ) : (
        <Pressable style={styles.galleryBtn} onPress={handlePickFromGallery}>
          <Gallery size={28} color="#fff" />
        </Pressable>
      )}

      {/* Shutter */}
      <Pressable style={styles.shutter} onPress={handleShutter}>
        <View style={styles.shutterInner} />
      </Pressable>

      {/* Build selector */}
      <View style={styles.buildScrollWrap}>
        <ScrollView style={styles.buildScroll} contentContainerStyle={styles.buildList} showsVerticalScrollIndicator={false}>
          {myBuilds.map(build => {
            const isSelected = build.id === selectedBuildId
            return (
              <Pressable key={build.id} style={styles.buildItem} onPress={() => setSelectedBuildId(build.id)}>
                <View style={[styles.buildRing, isSelected && styles.buildRingSelected]}>
                  {build.coverPhotoUrl ? (
                    <Image source={{ uri: build.coverPhotoUrl }} style={[styles.buildThumbImg, !isSelected && styles.buildThumbDimmed]} />
                  ) : (
                    <View style={[styles.buildThumbFallback, !isSelected && styles.buildThumbDimmed]}>
                      <InitialsAvatar name={build.nickname || build.model} size={38} />
                    </View>
                  )}
                </View>
                <Text style={[styles.buildName, isSelected && styles.buildNameSelected]} numberOfLines={1}>
                  {build.nickname || build.model}
                </Text>
              </Pressable>
            )
          })}
          <Pressable style={styles.buildItem} onPress={() => router.push({ pathname: '/add-build', params: { returnTo: 'capture' } })}>
            <View style={styles.buildThumbAdd}>
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
  iconBtnActive: { backgroundColor: 'rgba(255,255,255,0.15)' },
  galleryBtn: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 56 : 36,
    left: 32, padding: 8, zIndex: 10,
  },
  shutter: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 28,
    alignSelf: 'center',
    width: 76, alignItems: 'center', zIndex: 5,
  },
  shutterInner: {
    width: 76, height: 76, borderRadius: 38,
    borderWidth: 4, borderColor: '#fff',
    backgroundColor: 'transparent',
  },
  buildScrollWrap: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 48 : 28,
    right: 16, maxHeight: 300, width: 68,
  },
  buildScroll: { width: 68 },
  buildList: { gap: 10, alignItems: 'flex-end', paddingBottom: 4 },
  buildItem: { alignItems: 'center', gap: 3 },
  buildRing: {
    width: 46, height: 46, borderRadius: 23,
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  buildRingSelected: { borderColor: colors.accent },
  buildThumbImg: { width: '100%', height: '100%' },
  buildThumbDimmed: { opacity: 0.5 },
  buildThumbFallback: {
    width: '100%', height: '100%',
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  buildThumbAdd: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center', justifyContent: 'center',
  },
  buildName: { color: 'rgba(255,255,255,0.5)', fontSize: 9, fontWeight: '600', textAlign: 'center', width: 58 },
  buildNameSelected: { color: '#fff' },
  settingsPanel: {
    position: 'absolute',
    left: 0, right: 0,
    paddingHorizontal: 16, gap: 10,
  },
  settingsRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12,
  },
  settingBtn: { flex: 1, alignItems: 'center', gap: 4, paddingVertical: 6, borderRadius: 8 },
  settingBtnActive: { backgroundColor: 'rgba(255,255,255,0.1)' },
  settingLabel: { color: '#fff', fontSize: 10, fontWeight: '600' },
  settingLabelActive: { color: colors.accent },
  subRow: {
    flexDirection: 'row', justifyContent: 'center', gap: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 14, paddingVertical: 10, paddingHorizontal: 12,
  },
  chip: {
    paddingHorizontal: 18, paddingVertical: 7, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)',
  },
  chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  chipText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  gridOverlay: { ...StyleSheet.absoluteFillObject, justifyContent: 'space-evenly', alignItems: 'center' },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.25)' },
  countdownOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.35)', zIndex: 20,
  },
  countdownText: {
    color: '#fff', fontSize: 96, fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  gate: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  closeGate: { position: 'absolute', left: 16, padding: 10 },
  gateCard: {
    alignItems: 'center', gap: 16,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 40, paddingHorizontal: 36,
    width: '100%', maxWidth: 320,
  },
  gatePlus: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  gateTitle: { color: '#fff', fontSize: 20, fontWeight: '700', textAlign: 'center', lineHeight: 28 },
  gateSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13, textAlign: 'center', lineHeight: 19 },
})
