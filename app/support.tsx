import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  KeyboardAvoidingView,
} from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, ChevronRight } from '@/components/Icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { useQuery } from '@tanstack/react-query'
import { fetchProfile } from '@/lib/supabaseQueries'
import { colors } from '@/constants/throttlist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const CATEGORIES = [
  'Bug Report',
  'Account Issue',
  'Billing & Pro',
  'Content & Posts',
  'Privacy & Safety',
  'Feature Request',
  'Build or Parts Help',
  'Other',
]

const FAQS: { q: string; a: string }[] = [
  {
    q: 'What is Throttlist?',
    a: 'Turn your hobby or side project into income.\n\nDocument your motorcycle, car, or custom build, tag the parts or gear you use, and earn commission every time someone buys through your link—monetizing your expertise and passion.',
  },
  {
    q: 'How do I add a build?',
    a: 'Tap the + button on the Capture tab and select "Add Build." Choose your build type — motorcycles, cars, bicycles, drones, PC rigs, audio setups, cameras, guitars, 3D printers, camping kits, and more. Fill in the details, add a cover photo, and start posting right away.',
  },
  {
    q: 'How do I post a photo?',
    a: 'Go to the Capture tab, select a build, and upload a photo. You can tag parts, components, or gear directly on the image — whatever you\'re running on your build — so viewers can see exactly what went into it.',
  },
  {
    q: 'What is Throttlist Pro?',
    a: 'Pro is a $5/month membership that unlocks affiliate commission earnings on any tagged parts or gear, a custom storefront on your profile, analytics, priority Discover placement, and a Pro badge. It works across every build type on the platform.',
  },
  {
    q: 'How do affiliate commissions work?',
    a: 'When you tag a part, component, or piece of gear with a product link, anyone who purchases through that link earns you a commission — whether it\'s exhaust pipes, guitar pickups, camera lenses, or filament spools. Pro members receive monthly payouts directly to their bank account via Stripe.',
  },
  {
    q: 'What are Top 8 builds?',
    a: 'A throwback to vintage social media platforms, Top 8 is your curated favorite builds across the Throttlist app that you want to highlight. Mix types freely: a motorcycle next to a PC rig, a camera setup alongside a camping kit. Edit it from Settings → Top 8.',
  },
  {
    q: 'How do I follow a build?',
    a: 'Visit any build page and tap Follow. Updates from that build will appear in your feed. You can follow individual builds selectively, so your feed stays focused on what you actually care about.',
  },
  {
    q: 'Can I have multiple builds on my profile?',
    a: 'Yes — add as many builds as you have projects, across any mix of categories. A motorcycle, a guitar rig, a PC build, and a camping setup can all live on the same profile. Each gets its own page with photos, parts list, and followers.',
  },
  {
    q: 'How do I edit my profile?',
    a: 'Go to the Profile tab, tap the Settings icon in the top right, then select Edit Profile. From there you can update your display name, bio, location, social links, and website.',
  },
  {
    q: 'How do I report a problem or inappropriate content?',
    a: 'Use the contact form below to reach us directly. Describe the issue and we\'ll respond as quickly as possible — typically within 24–48 hours.',
  },
]

export default function SupportScreen() {
  const insets = useSafeAreaInsets()
  const { user: authUser } = useAuth()
  const userId = authUser?.id ?? ''

  const { data: profile } = useQuery({
    queryKey: ['settings-profile', userId],
    queryFn: () => fetchProfile(userId),
    enabled: !!userId,
  })

  const [openIndex, setOpenIndex] = useState<number | null>(null)

  // Contact form
  const [name, setName] = useState(profile?.displayName ?? '')
  const [email, setEmail] = useState(authUser?.email ?? '')
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Pre-fill once profile loads
  React.useEffect(() => {
    if (profile?.displayName && !name) setName(profile.displayName)
  }, [profile])
  React.useEffect(() => {
    if (authUser?.email && !email) setEmail(authUser.email)
  }, [authUser])

  async function handleSubmit() {
    if (!name.trim() || !email.trim() || !subject || !message.trim()) {
      setError('Please fill in all fields and select a subject.')
      return
    }
    setError(null)
    setSubmitting(true)
    try {
      const { error: dbError } = await supabase.from('support_requests').insert({
        user_id: userId || null,
        name: name.trim(),
        email: email.trim(),
        subject,
        message: message.trim(),
      })
      if (dbError) throw dbError
      setSubmitted(true)
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.dismiss()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Support & Contact</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">

        {/* FAQ */}
        <Text style={styles.sectionLabel}>Frequently Asked Questions</Text>
        <View style={styles.faqGroup}>
          {FAQS.map((faq, i) => {
            const isOpen = openIndex === i
            const isLast = i === FAQS.length - 1
            return (
              <View key={i}>
                <Pressable
                  style={styles.faqRow}
                  onPress={() => setOpenIndex(isOpen ? null : i)}
                >
                  <Text style={styles.faqQuestion}>{faq.q}</Text>
                  <ChevronRight
                    size={16}
                    color={colors.textTertiary}
                    style={{ transform: [{ rotate: isOpen ? '90deg' : '0deg' }] }}
                  />
                </Pressable>
                {isOpen && (
                  <View style={styles.faqAnswer}>
                    <Text style={styles.faqAnswerText}>{faq.a}</Text>
                  </View>
                )}
                {!isLast && <View style={styles.separator} />}
              </View>
            )
          })}
        </View>

        {/* Contact form */}
        <Text style={styles.sectionLabel}>Contact Us</Text>

        {submitted ? (
          <View style={styles.successBox}>
            <Text style={styles.successTitle}>Message sent!</Text>
            <Text style={styles.successText}>
              We'll get back to you at {email} within 24–48 hours.
            </Text>
          </View>
        ) : (
          <View style={styles.formGroup}>
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                style={styles.fieldInput}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Email</Text>
              <TextInput
                style={styles.fieldInput}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
            <View style={styles.separator} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Subject</Text>
              <View style={styles.chipsWrap}>
                {CATEGORIES.map(cat => {
                  const active = subject === cat
                  return (
                    <Pressable
                      key={cat}
                      style={[styles.chip, active && styles.chipActive]}
                      onPress={() => setSubject(cat)}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>
                        {cat}
                      </Text>
                    </Pressable>
                  )
                })}
              </View>
            </View>
            <View style={styles.separator} />
            <View style={styles.field}>
              <Text style={styles.fieldLabel}>Message</Text>
              <TextInput
                style={[styles.fieldInput, styles.fieldInputMulti]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your question or issue…"
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
            {error && <Text style={styles.errorText}>{error}</Text>}
            <Pressable
              style={[styles.submitBtn, (submitting || !subject || !message.trim()) && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              <Text style={styles.submitBtnText}>
                {submitting ? 'Sending…' : 'Send Message'}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={{ height: 48 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.bg,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: { padding: 4, width: 44 },
  sectionLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    paddingTop: 24,
    paddingBottom: 8,
  },
  // FAQ
  faqGroup: {
    backgroundColor: colors.surface1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  faqQuestion: {
    color: colors.textPrimary,
    fontSize: 15,
    flex: 1,
  },
  faqAnswer: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  faqAnswerText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
  // Form
  formGroup: {
    backgroundColor: colors.surface1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    paddingBottom: 16,
  },
  field: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
    gap: 5,
  },
  fieldLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fieldInput: {
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 6,
  },
  fieldInputMulti: {
    minHeight: 100,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingTop: 4,
    paddingBottom: 6,
  },
  chip: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.surface2,
  },
  chipActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '22',
  },
  chipText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  chipTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
  errorText: {
    color: colors.accent,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  submitBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.5,
  },
  submitBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Success
  successBox: {
    backgroundColor: colors.surface1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
    padding: 24,
    alignItems: 'center',
    gap: 8,
  },
  successTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  successText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
})
