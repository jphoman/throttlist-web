import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Image,
} from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, CheckCircle, ChevronRight, Send } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { ThrottlistLogo } from '@/components/ThrottlistLogo'
import { supabase } from '@/lib/supabase'

type Step = 'account' | 'terms' | 'confirm'

const CARD_W = 130
const CARD_H = 100
const CARD_GAP = 10
const CARD_STEP = CARD_W + CARD_GAP

// Fallback cards shown when builds have no cover photo or DB returns nothing
const FALLBACK_COLORS = [
  '#1a1a1a', '#1e1e1e', '#222222', '#252525',
  '#191919', '#1c1c1c', '#202020', '#232323',
]

const CATEGORY_PLACEHOLDERS: ShowcaseItem[] = [
  { id: 'p1',  coverPhotoUrl: null, label: 'Café Racer' },
  { id: 'p2',  coverPhotoUrl: null, label: 'Scrambler' },
  { id: 'p3',  coverPhotoUrl: null, label: 'Tracker' },
  { id: 'p4',  coverPhotoUrl: null, label: 'Bobber' },
  { id: 'p5',  coverPhotoUrl: null, label: 'Chopper' },
  { id: 'p6',  coverPhotoUrl: null, label: 'Adventure' },
  { id: 'p7',  coverPhotoUrl: null, label: 'Bagger' },
  { id: 'p8',  coverPhotoUrl: null, label: 'Supermoto' },
  { id: 'p9',  coverPhotoUrl: null, label: 'Street Fighter' },
  { id: 'p10', coverPhotoUrl: null, label: 'Naked Bike' },
]

const TC_TEXT = `THROTTLIST TERMS & CONDITIONS

Last updated: January 1, 2025

1. ACCEPTANCE OF TERMS
By creating an account on Throttlist you agree to be bound by these Terms and Conditions. If you do not agree, do not use the platform.

2. USER ACCOUNTS
You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to create an account. You agree to provide accurate information and keep it up to date.

3. CONTENT OWNERSHIP
You retain ownership of all content you post. By posting content you grant Throttlist a non-exclusive, royalty-free, worldwide license to display and distribute your content on the platform.

4. AFFILIATE LINKS
Part links may include Throttlist affiliate codes. Pro subscribers earn a share of commissions generated through their part links, subject to the Pro payout terms.

5. PROHIBITED CONDUCT
You agree not to post illegal content, spam, or content that violates third-party intellectual property rights. Throttlist reserves the right to remove content and terminate accounts that violate these terms.

6. PRIVACY
Your use of Throttlist is also governed by our Privacy Policy. We do not sell your personal data to third parties.

7. DISCLAIMER
Throttlist is provided "as is." We make no warranties regarding uptime, accuracy of part information, or affiliate commission amounts.

8. GOVERNING LAW
These terms are governed by the laws of the State of California, United States.

9. CHANGES TO TERMS
We may update these terms at any time. Continued use of Throttlist after updates constitutes acceptance.

Contact: legal@throttlist.com`

function Field({
  value,
  onChangeText,
  placeholder,
  secureTextEntry,
  keyboardType,
  autoCapitalize,
  autoCorrect,
}: {
  value: string
  onChangeText: (v: string) => void
  placeholder?: string
  secureTextEntry?: boolean
  keyboardType?: 'default' | 'email-address'
  autoCapitalize?: 'none' | 'words'
  autoCorrect?: boolean
}) {
  return (
    <View style={styles.field}>
      <TextInput
        style={[styles.fieldInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'sentences'}
        autoCorrect={autoCorrect ?? false}
      />
    </View>
  )
}

// ─── Infinite-scroll row ─────────────────────────────────────────────────────
interface ShowcaseItem {
  id: string
  coverPhotoUrl: string | null
  label: string
}

function ScrollRow({ items, duration, reverse }: {
  items: ShowcaseItem[]
  duration: number
  reverse?: boolean
}) {
  const anim = useRef(new Animated.Value(0)).current
  const doubled = [...items, ...items] // duplicate for seamless loop
  const totalW = CARD_STEP * items.length

  useEffect(() => {
    if (items.length === 0) return
    // reverse rows start from -totalW so they appear to scroll right
    if (reverse) anim.setValue(-totalW)
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: reverse ? 0 : -totalW,
        duration,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    )
    loop.start()
    return () => loop.stop()
  }, [items.length])

  if (items.length === 0) return null

  return (
    <View style={styles.rowClip}>
      <Animated.View style={[styles.rowTrack, { transform: [{ translateX: anim }] }]}>
        {doubled.map((item, i) => (
          <View key={`${item.id}-${i}`} style={styles.card}>
            {item.coverPhotoUrl ? (
              <Image
                source={{ uri: item.coverPhotoUrl }}
                style={styles.cardImage}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.cardImage, { backgroundColor: FALLBACK_COLORS[i % FALLBACK_COLORS.length] }]} />
            )}
            <View style={styles.cardLabel}>
              <Text style={styles.cardLabelText} numberOfLines={1}>{item.label}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    </View>
  )
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function SignupScreen() {
  const [step, setStep] = useState<Step>('account')

  // Account fields
  const [displayName, setDisplayName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  // Terms
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Confirm
  const [resending, setResending] = useState(false)
  const [resent, setResent] = useState(false)
  const [row1, setRow1] = useState<ShowcaseItem[]>(CATEGORY_PLACEHOLDERS.slice(0, 8))
  const [row2, setRow2] = useState<ShowcaseItem[]>([...CATEGORY_PLACEHOLDERS.slice(3), ...CATEGORY_PLACEHOLDERS.slice(0, 1)])
  const [row3, setRow3] = useState<ShowcaseItem[]>([...CATEGORY_PLACEHOLDERS.slice(6), ...CATEGORY_PLACEHOLDERS.slice(0, 4)])

  const accountValid = displayName.trim() && username.trim() && email.trim() && password.length >= 8

  // Fetch showcase builds when entering confirm step
  useEffect(() => {
    if (step !== 'confirm') return
    supabase
      .from('builds')
      .select('id, cover_photo_url, nickname, make, model, build_type')
      .not('cover_photo_url', 'is', null)
      .limit(36)
      .then(({ data }) => {
        const items: ShowcaseItem[] = (data ?? []).map((b: any) => ({
          id: b.id,
          coverPhotoUrl: b.cover_photo_url,
          label: b.nickname || `${b.make} ${b.model}`,
        }))
        // Pad with placeholders so each row has at least 8 items
        const pad = (arr: ShowcaseItem[], start: number): ShowcaseItem[] => {
          const needed = Math.max(8, arr.length)
          while (arr.length < needed) {
            arr.push({ id: `ph-${start + arr.length}`, coverPhotoUrl: null, label: '' })
          }
          return arr
        }
        // If not enough real builds, fill with category placeholders
        const source = items.length >= 12 ? items : [
          ...items,
          ...CATEGORY_PLACEHOLDERS.slice(0, Math.max(0, 24 - items.length)),
        ]
        const chunkSize = Math.ceil(source.length / 3) || 8
        setRow1(pad([...source.slice(0, chunkSize)], 0))
        setRow2(pad([...source.slice(chunkSize, chunkSize * 2)], chunkSize))
        setRow3(pad([...source.slice(chunkSize * 2)], chunkSize * 2))
      })
  }, [step])

  function handleBack() {
    if (step === 'account') { router.back(); return }
    if (step === 'terms') { setStep('account'); return }
    // On confirm, back goes to feed (already created account)
    router.replace('/feed')
  }

  async function handleNext() {
    if (step === 'account') { setStep('terms'); return }
    if (step === 'terms' && accepted) {
      setSubmitting(true)
      setError(null)
      try {
        const { error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              username: username.trim().toLowerCase(),
              display_name: displayName.trim(),
            },
          },
        })
        if (signUpError) throw signUpError
        setStep('confirm')
      } catch (err: any) {
        setError(err.message ?? 'Something went wrong. Please try again.')
      } finally {
        setSubmitting(false)
      }
    }
  }

  async function handleResend() {
    setResending(true)
    await supabase.auth.resend({ type: 'signup', email: email.trim() })
    setResending(false)
    setResent(true)
    setTimeout(() => setResent(false), 4000)
  }

  const stepIndex = step === 'account' ? 0 : step === 'terms' ? 1 : 2

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={handleBack} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <View style={{ width: 44 }} />
      </View>

      {/* Progress dots */}
      <View style={styles.progress}>
        {[0, 1, 2].map(i => (
          <View key={i} style={[styles.dot, i <= stepIndex && styles.dotActive]} />
        ))}
      </View>

      {/* ── Page 1: Account ── */}
      {step === 'account' && (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <ThrottlistLogo color={colors.accent} height={36} />
          </View>
          <Text style={styles.sub}>Join the builders and creators community.</Text>

          <View style={styles.form}>
            <Field value={displayName} onChangeText={setDisplayName} placeholder="FULL NAME" autoCapitalize="words" />
            <Field value={username} onChangeText={setUsername} placeholder="USERNAME" autoCapitalize="none" />
            <Field value={email} onChangeText={setEmail} placeholder="EMAIL" keyboardType="email-address" autoCapitalize="none" />
            <Field value={password} onChangeText={setPassword} placeholder="PASSWORD" secureTextEntry />
          </View>

          <Pressable
            style={[styles.primaryBtn, !accountValid && styles.primaryBtnDim]}
            onPress={handleNext}
            disabled={!accountValid}
          >
            <Text style={styles.primaryBtnText}>Continue</Text>
            <ChevronRight size={18} color="#fff" />
          </Pressable>

          <Text style={styles.termsNote}>
            {'By signing up, you agree to our '}
            <Text style={styles.termsLink} onPress={() => router.push({ pathname: '/privacy', params: { section: 'terms' } })}>Terms</Text>
            {', '}
            <Text style={styles.termsLink} onPress={() => router.push({ pathname: '/privacy', params: { section: 'privacy' } })}>Privacy Policy</Text>
            {' and '}
            <Text style={styles.termsLink} onPress={() => router.push({ pathname: '/privacy', params: { section: 'cookies' } })}>Cookies Policy</Text>
            {'.'}
          </Text>

          <View style={{ flex: 1, minHeight: 32 }} />

          <Text style={styles.switchText}>Already have an account?</Text>
          <Pressable style={styles.loginBtn} onPress={() => router.replace('/login')}>
            <Text style={styles.loginBtnText}>Log in</Text>
          </Pressable>
        </ScrollView>
      )}

      {/* ── Page 2: Terms ── */}
      {step === 'terms' && (
        <View style={styles.termsWrap}>
          <Text style={styles.headline}>Terms & Conditions</Text>
          <Text style={styles.sub}>Please read and accept before continuing.</Text>
          <ScrollView style={styles.tcScroll} showsVerticalScrollIndicator={false}>
            <Text style={styles.tcText}>{TC_TEXT}</Text>
          </ScrollView>
          <Pressable style={styles.checkRow} onPress={() => setAccepted(v => !v)}>
            <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
              {accepted && <CheckCircle size={14} color="#fff" />}
            </View>
            <Text style={styles.checkLabel}>I have read and agree to the Terms & Conditions</Text>
          </Pressable>
          {error && <Text style={styles.errorText}>{error}</Text>}
          <Pressable
            style={[styles.primaryBtn, (!accepted || submitting) && styles.primaryBtnDim]}
            onPress={handleNext}
            disabled={!accepted || submitting}
          >
            {submitting
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.primaryBtnText}>Accept & Continue</Text>
            }
          </Pressable>
        </View>
      )}

      {/* ── Page 3: Confirm email ── */}
      {step === 'confirm' && (
        <View style={styles.confirmWrap}>
          {/* Message card */}
          <View style={styles.confirmCard}>
            <View style={styles.confirmIconRing}>
              <Send size={28} color={colors.accent} />
            </View>
            <Text style={styles.confirmHeadline}>Check your inbox</Text>
            <Text style={styles.confirmBody}>
              {'We sent a confirmation link to\n'}
              <Text style={styles.confirmEmail}>{email.trim()}</Text>
            </Text>
            <Text style={styles.confirmHint}>
              Click the link in the email to verify your account and unlock full access.
            </Text>

            <Pressable onPress={handleResend} disabled={resending || resent} style={styles.resendBtn}>
              {resending
                ? <ActivityIndicator size="small" color={colors.accent} />
                : <Text style={[styles.resendText, resent && styles.resendTextSent]}>
                    {resent ? '✓ Email sent' : 'Resend email'}
                  </Text>
              }
            </Pressable>
          </View>

          {/* Animated build showcase */}
          <View style={styles.showcaseWrap}>
            <Text style={styles.showcaseLabel}>See what's being built</Text>
            <View style={styles.rows}>
              <ScrollRow items={row1} duration={20000} />
              <ScrollRow items={row2} duration={25000} reverse />
              <ScrollRow items={row3} duration={18000} />
            </View>
          </View>

          {/* CTA */}
          <View style={styles.confirmFooter}>
            <Pressable style={styles.primaryBtn} onPress={() => router.replace('/feed')}>
              <Text style={styles.primaryBtnText}>Continue to explore</Text>
              <ChevronRight size={18} color="#fff" />
            </Pressable>
          </View>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
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
  progress: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  dot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: colors.surface3,
  },
  dotActive: { backgroundColor: colors.accent },

  // Page 1 & shared
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoWrap: { alignItems: 'center', marginTop: 24, marginBottom: 16 },
  sub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 28,
    textAlign: 'center',
  },
  termsNote: {
    color: colors.textTertiary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  termsLink: { color: colors.accent, textDecorationLine: 'underline' },
  form: { gap: 16, marginBottom: 28 },
  field: { gap: 6 },
  fieldInput: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.textPrimary,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
  },
  primaryBtnDim: { opacity: 0.4 },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  switchText: { color: colors.textTertiary, fontSize: 14, textAlign: 'center', marginBottom: 12 },
  loginBtn: {
    borderWidth: 1, borderColor: colors.accent, borderRadius: 10,
    paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 16,
  },
  loginBtnText: { color: colors.accent, fontSize: 16, fontWeight: '700' },
  errorText: { color: '#f87171', fontSize: 13, marginBottom: 12, textAlign: 'center' },
  headline: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },

  // Page 2: Terms
  termsWrap: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    paddingTop: 4,
  },
  tcScroll: {
    flex: 1,
    backgroundColor: colors.surface1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
    padding: 14,
  },
  tcText: { color: colors.textSecondary, fontSize: 12, lineHeight: 18 },
  checkRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  checkbox: {
    width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: colors.surface3,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: colors.accent, borderColor: colors.accent },
  checkLabel: { color: colors.textSecondary, fontSize: 13, flex: 1, lineHeight: 18 },

  // Page 3: Confirm
  confirmWrap: { flex: 1 },
  confirmCard: {
    marginHorizontal: 20,
    marginTop: 8,
    backgroundColor: colors.surface1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  confirmIconRing: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: colors.accent + '18',
    borderWidth: 1.5, borderColor: colors.accent + '44',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 4,
  },
  confirmHeadline: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  confirmBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
  },
  confirmEmail: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  confirmHint: {
    color: colors.textTertiary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
  },
  resendBtn: { paddingVertical: 4, paddingHorizontal: 8, marginTop: 2 },
  resendText: { color: colors.accent, fontSize: 13, fontWeight: '600' },
  resendTextSent: { color: colors.textTertiary },

  // Showcase rows
  showcaseWrap: { marginTop: 20, gap: 10 },
  showcaseLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 4,
  },
  rows: { gap: 10 },
  rowClip: {
    overflow: 'hidden',
    height: CARD_H,
    width: '100%',
  },
  rowTrack: {
    flexDirection: 'row',
    gap: CARD_GAP,
    paddingHorizontal: CARD_GAP / 2,
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: colors.surface2,
    flexShrink: 0,
  },
  cardImage: { width: '100%', height: '100%' },
  cardLabel: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  cardLabelText: { color: '#fff', fontSize: 10, fontWeight: '600' },

  // Footer CTA
  confirmFooter: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
})
