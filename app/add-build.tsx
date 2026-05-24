import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, CategoryIcon } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { BUILD_CATEGORIES } from '@/constants/buildTypes'
import { useAuth } from '@/lib/auth'
import { createBuild } from '@/lib/supabaseQueries'

type FieldConfig = {
  showYear: boolean
  yearLabel: string
  makeLabel: string
  makePlaceholder: string
  modelLabel: string
  modelPlaceholder: string
  nicknameLabel: string
  nicknamePlaceholder: string
  popularBuilds: string[]
}

const TYPE_CONFIG: Record<string, FieldConfig> = {
  motorcycles: {
    showYear: true,
    yearLabel: 'YEAR',
    makeLabel: 'MAKE',
    makePlaceholder: 'e.g. Honda, Yamaha, Triumph',
    modelLabel: 'MODEL',
    modelPlaceholder: 'e.g. CB550, XS650, Bonneville',
    nicknameLabel: 'NICKNAME',
    nicknamePlaceholder: 'e.g. The Rat',
    popularBuilds: ['Honda CB550', 'Yamaha XS650', 'Triumph Bonneville', 'BMW R nineT'],
  },
  cars: {
    showYear: true,
    yearLabel: 'YEAR',
    makeLabel: 'MAKE',
    makePlaceholder: 'e.g. Toyota, Ford, Porsche',
    modelLabel: 'MODEL',
    modelPlaceholder: 'e.g. AE86, Mustang, 911',
    nicknameLabel: 'NICKNAME',
    nicknamePlaceholder: 'e.g. The Track Car',
    popularBuilds: ['Toyota AE86', 'Ford Mustang', 'Porsche 911', 'Honda Civic EG'],
  },
  bicycles: {
    showYear: false,
    yearLabel: 'YEAR',
    makeLabel: 'BRAND',
    makePlaceholder: 'e.g. Trek, Santa Cruz, Specialized',
    modelLabel: 'MODEL / FRAME',
    modelPlaceholder: 'e.g. Slash, Hightower, Enduro',
    nicknameLabel: 'BUILD NAME',
    nicknamePlaceholder: 'e.g. Trail Shredder',
    popularBuilds: ['Trek Slash', 'Santa Cruz Hightower', 'Specialized Enduro', 'Canyon Strive'],
  },
  drones: {
    showYear: false,
    yearLabel: 'YEAR',
    makeLabel: 'FRAME / KIT',
    makePlaceholder: 'e.g. iFlight, TBS, Armattan',
    modelLabel: 'PURPOSE',
    modelPlaceholder: 'e.g. FPV Racing, Cinematic, Long Range',
    nicknameLabel: 'BUILD NAME',
    nicknamePlaceholder: 'e.g. Rip Machine',
    popularBuilds: ['iFlight Nazgul5', 'TBS Source One', 'Armattan Marmotte', 'DJI FPV'],
  },
  pc_gaming: {
    showYear: false,
    yearLabel: 'YEAR',
    makeLabel: 'CPU',
    makePlaceholder: 'e.g. AMD Ryzen 9 7950X, Intel i9-14900K',
    modelLabel: 'GPU',
    modelPlaceholder: 'e.g. RTX 4090, RX 7900 XTX',
    nicknameLabel: 'BUILD NAME',
    nicknamePlaceholder: 'e.g. The Beast, Studio Rig',
    popularBuilds: ['Ryzen 9 + RTX 4090', 'i9 + RTX 4080', 'Ryzen 7 + RX 7800 XT', 'i5 + RTX 4070'],
  },
  audio_hifi: {
    showYear: false,
    yearLabel: 'YEAR',
    makeLabel: 'PRIMARY BRAND',
    makePlaceholder: 'e.g. Klipsch, Schiit, Focal',
    modelLabel: 'KEY COMPONENT',
    modelPlaceholder: 'e.g. Forte IV, Bifrost 2, Utopia',
    nicknameLabel: 'SYSTEM NAME',
    nicknamePlaceholder: 'e.g. The Listening Room',
    popularBuilds: ['Klipsch Forte IV', 'Schiit Bifrost 2', 'Focal Utopia', 'Harbeth M30.2'],
  },
  keyboards: {
    showYear: false,
    yearLabel: 'YEAR',
    makeLabel: 'BOARD / KIT',
    makePlaceholder: 'e.g. Keychron Q1, GMMK Pro, Holy Panda',
    modelLabel: 'SWITCHES',
    modelPlaceholder: 'e.g. Gateron Yellow, Boba U4T, Holy Panda',
    nicknameLabel: 'BUILD NAME',
    nicknamePlaceholder: 'e.g. Daily Driver',
    popularBuilds: ['Keychron Q1 + Boba U4T', 'GMMK Pro + Holy Panda', 'KBD67 + Gateron Yellow', 'Discipline65'],
  },
  guitars: {
    showYear: true,
    yearLabel: 'YEAR',
    makeLabel: 'BRAND',
    makePlaceholder: 'e.g. Fender, Gibson, PRS',
    modelLabel: 'MODEL',
    modelPlaceholder: 'e.g. Stratocaster, Les Paul, Custom 24',
    nicknameLabel: 'NICKNAME',
    nicknamePlaceholder: 'e.g. Old Reliable',
    popularBuilds: ['Fender Stratocaster', 'Gibson Les Paul', 'PRS Custom 24', 'Telecaster Build'],
  },
  '3d_printing': {
    showYear: false,
    yearLabel: 'YEAR',
    makeLabel: 'PRINTER BRAND',
    makePlaceholder: 'e.g. Bambu Lab, Prusa, Creality',
    modelLabel: 'PRINTER MODEL',
    modelPlaceholder: 'e.g. X1 Carbon, MK4, Ender 3',
    nicknameLabel: 'BUILD / PROJECT NAME',
    nicknamePlaceholder: 'e.g. Parts Farm, Resin Station',
    popularBuilds: ['Bambu Lab X1 Carbon', 'Prusa MK4', 'Creality Ender 3 V3', 'Voron 2.4'],
  },
  camping: {
    showYear: false,
    yearLabel: 'YEAR',
    makeLabel: 'SETUP TYPE',
    makePlaceholder: 'e.g. Van Life, Overlanding, Ultralight',
    modelLabel: 'RIG / VEHICLE / MAIN GEAR',
    modelPlaceholder: 'e.g. Ford Transit, Tacoma, UL Tent',
    nicknameLabel: 'SETUP NAME',
    nicknamePlaceholder: 'e.g. The Wanderer, Base Camp',
    popularBuilds: ['Ford Transit Van Build', 'Tacoma Overlander', 'Backpacking UL Kit', 'Sprinter Camper'],
  },
}

function generateSlug(make: string, model: string, nickname: string): string {
  const base = nickname || `${make} ${model}`
  return base
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') +
    '-' + Date.now().toString(36)
}

export default function AddBuildScreen() {
  const { user: authUser } = useAuth()
  const queryClient = useQueryClient()
  const { returnTo, photoUri } = useLocalSearchParams<{ returnTo?: string; photoUri?: string }>()

  const [step, setStep] = useState<1 | 2>(1)
  const [buildType, setBuildType] = useState('')
  const [year, setYear] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [nickname, setNickname] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cfg: FieldConfig = TYPE_CONFIG[buildType] ?? TYPE_CONFIG.motorcycles
  const detailsValid = make.trim().length > 0 && model.trim().length > 0

  async function handleSave() {
    if (!authUser?.id || !detailsValid) return
    setSaving(true)
    setError(null)
    try {
      const newBuild = await createBuild({
        user_id: authUser.id,
        year: year ? parseInt(year, 10) : null,
        make: make.trim(),
        model: model.trim(),
        nickname: nickname.trim() || null,
        slug: generateSlug(make.trim(), model.trim(), nickname.trim()),
        build_type: buildType || null,
      })
      if (!newBuild) throw new Error('Failed to create build. Please try again.')

      await queryClient.invalidateQueries({ queryKey: ['my-builds', authUser.id] })
      await queryClient.invalidateQueries({ queryKey: ['profile', authUser.id] })

      if (returnTo === 'compose' && photoUri) {
        router.replace({ pathname: '/compose', params: { photoUri, buildId: newBuild.id } })
      } else if (returnTo === 'capture') {
        router.replace('/(tabs)/capture')
      } else {
        router.back()
      }
    } catch (e: any) {
      setError(e.message ?? 'Something went wrong.')
      setSaving(false)
    }
  }

  const selectedCategory = BUILD_CATEGORIES.find(t => t.id === buildType)

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              if (step === 2) setStep(1)
              else router.back()
            }}
          >
            <ArrowLeft size={20} color={colors.textSecondary} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>
              {step === 1 ? 'Build Category' : (selectedCategory?.label ?? 'Build Details')}
            </Text>
            <View style={styles.stepDots}>
              <View style={[styles.dot, styles.dotActive]} />
              <View style={[styles.dot, step === 2 && styles.dotActive]} />
            </View>
          </View>
          <View style={{ width: 36 }} />
        </View>

        {/* Step 1 — Category picker */}
        {step === 1 && (
          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>What's your build?</Text>
            <Text style={styles.sectionSub}>
              Pick a category — we'll tailor the details to your build.
            </Text>

            <View style={styles.typeGrid}>
              {BUILD_CATEGORIES.map(t => (
                <Pressable
                  key={t.id}
                  style={[styles.typeCard, buildType === t.id && styles.typeCardSelected]}
                  onPress={() => {
                    setBuildType(t.id)
                    setYear('')
                    setMake('')
                    setModel('')
                    setNickname('')
                    setStep(2)
                  }}
                >
                  <CategoryIcon
                    id={t.id}
                    size={26}
                    color={buildType === t.id ? colors.accent : colors.textSecondary}
                  />
                  <Text style={[styles.typeLabel, buildType === t.id && styles.typeLabelSelected]}>
                    {t.label}
                  </Text>
                  {buildType === t.id && (
                    <View style={styles.typeCheck}>
                      <Check size={10} color="#fff" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Step 2 — Build details */}
        {step === 2 && (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Text style={styles.sectionTitle}>
              {selectedCategory?.label} build
            </Text>
            <Text style={styles.sectionSub}>
              {cfg.makeLabel.toLowerCase() === 'make' ? 'Tell us about your build.' : `Fill in your ${selectedCategory?.label?.toLowerCase()} details.`}
            </Text>

            {cfg.popularBuilds.length > 0 && (
              <View style={styles.popularWrap}>
                <Text style={styles.popularLabel}>POPULAR BUILDS</Text>
                <View style={styles.popularList}>
                  {cfg.popularBuilds.map(b => (
                    <Pressable
                      key={b}
                      style={styles.popularChip}
                      onPress={() => {
                        const parts = b.split(' ')
                        setMake(parts[0])
                        setModel(parts.slice(1).join(' '))
                      }}
                    >
                      <Text style={styles.popularChipText}>{b}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.fields}>
              {cfg.showYear ? (
                <View style={styles.fieldRow}>
                  <View style={[styles.field, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>{cfg.yearLabel}</Text>
                    <TextInput
                      style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                      value={year}
                      onChangeText={setYear}
                      placeholder="e.g. 1975"
                      placeholderTextColor={colors.textTertiary}
                      keyboardType="numeric"
                      maxLength={4}
                    />
                  </View>
                  <View style={[styles.field, { flex: 2 }]}>
                    <Text style={styles.fieldLabel}>{cfg.makeLabel} *</Text>
                    <TextInput
                      style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                      value={make}
                      onChangeText={setMake}
                      placeholder={cfg.makePlaceholder}
                      placeholderTextColor={colors.textTertiary}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              ) : (
                <View style={styles.field}>
                  <Text style={styles.fieldLabel}>{cfg.makeLabel} *</Text>
                  <TextInput
                    style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                    value={make}
                    onChangeText={setMake}
                    placeholder={cfg.makePlaceholder}
                    placeholderTextColor={colors.textTertiary}
                    autoCapitalize="words"
                  />
                </View>
              )}

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{cfg.modelLabel} *</Text>
                <TextInput
                  style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  value={model}
                  onChangeText={setModel}
                  placeholder={cfg.modelPlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.field}>
                <Text style={styles.fieldLabel}>{cfg.nicknameLabel}</Text>
                <TextInput
                  style={[styles.input, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
                  value={nickname}
                  onChangeText={setNickname}
                  placeholder={cfg.nicknamePlaceholder}
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={[styles.btn, (!detailsValid || saving) && styles.btnDim]}
              onPress={handleSave}
              disabled={!detailsValid || saving}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.btnText}>
                    {returnTo === 'compose' ? 'Save & Continue to Post' : 'Save Build'}
                  </Text>
              }
            </Pressable>
          </ScrollView>
        )}
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4, width: 36 },
  headerCenter: { flex: 1, alignItems: 'center', gap: 6 },
  headerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: '700' },
  stepDots: { flexDirection: 'row', gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.surface3 },
  dotActive: { backgroundColor: colors.accent },
  content: { padding: 24, paddingBottom: 60 },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  sectionSub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  typeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  typeCard: {
    width: '47%',
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingVertical: 18,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
    position: 'relative',
  },
  typeCardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accentDim + '22',
  },
  typeLabel: { color: colors.textSecondary, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  typeLabelSelected: { color: colors.textPrimary },
  typeCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  popularWrap: { marginBottom: 20 },
  popularLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  popularList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  popularChip: {
    backgroundColor: colors.surface2,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: colors.surface3,
  },
  popularChipText: { color: colors.textSecondary, fontSize: 12 },
  fields: { gap: 16, marginBottom: 28 },
  fieldRow: { flexDirection: 'row', gap: 12 },
  field: { gap: 6 },
  fieldLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  input: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.textPrimary,
    fontSize: 15,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  btnDim: { opacity: 0.4 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  errorText: { color: '#f87171', fontSize: 13, textAlign: 'center', marginBottom: 16 },
})
