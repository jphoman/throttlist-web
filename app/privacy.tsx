import React, { useState, useRef, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { X } from '@/components/Icons'
import { colors } from '@/constants/throttlist'

type Section = 'terms' | 'privacy' | 'cookies'

const TABS: { id: Section; label: string }[] = [
  { id: 'terms', label: 'Terms' },
  { id: 'privacy', label: 'Privacy' },
  { id: 'cookies', label: 'Cookies' },
]

const UPDATED = 'Last updated: May 22, 2026'
const COMPANY = '[Throttlist, Inc.]'

const TERMS_SECTIONS = [
  {
    heading: '1. Who Can Use Throttlist',
    body: `You must be at least 18 years old to create an account. By signing up, you confirm you meet this requirement and that the information you provide is accurate and up to date.`,
  },
  {
    heading: '2. Your Account',
    body: `You're responsible for keeping your login credentials secure. Don't share your password with anyone. If you think your account has been compromised, contact us immediately. You may only operate one account per person.`,
  },
  {
    heading: "3. What You Can and Can't Do",
    body: `You agree not to:\n\n• Harass, bully, or threaten other users\n• Post spam, fake content, or deliberately misleading information\n• Impersonate another person, brand, or public figure\n• Post illegal content or content that infringes someone else's intellectual property rights\n• Scrape, mirror, or redistribute Throttlist content without written permission\n• Use bots, scrapers, or other automated tools to access or interact with the platform`,
  },
  {
    heading: '4. Content You Post',
    body: `You own the photos, captions, build details, and other content you share on Throttlist. By posting, you grant ${COMPANY} a non-exclusive, royalty-free, worldwide license to display, distribute, and promote your content on the platform and in marketing materials. You can delete your content at any time, which ends this license going forward.`,
  },
  {
    heading: '5. Account Termination',
    body: `We may suspend or permanently remove accounts that violate these terms. In serious cases — harassment, illegal content, coordinated abuse — we may act without prior notice. You can delete your account at any time from the Settings screen.`,
  },
  {
    heading: '6. Limitation of Liability',
    body: `Throttlist is provided as-is. We're not responsible for content posted by other users, service interruptions, or any indirect, incidental, or consequential damages arising from your use of the platform. Our total liability to you is limited to the greater of $100 or the amount you paid us in the last 12 months.`,
  },
  {
    heading: '7. Changes to These Terms',
    body: `We'll post updates here and, for significant changes, notify you in the app. Continued use of Throttlist after an update means you accept the revised terms.`,
  },
  {
    heading: '8. Governing Law',
    body: `These terms are governed by the laws of the State of California, United States. Disputes will be resolved in the state or federal courts located in San Francisco County, California.`,
  },
  {
    heading: 'Questions?',
    body: `Email us at legal@throttlist.com`,
  },
]

const PRIVACY_SECTIONS = [
  {
    heading: '1. What We Collect',
    body: `When you use Throttlist, we collect:\n\n• Account information: your name, username, email address, and password (stored encrypted)\n• Content you post: photos, captions, comments, build details, part lists, and tags\n• Usage data: which posts you view, like, or comment on; how you navigate the app; time spent on features\n• Device information: device type, operating system version, and app version\n• Approximate location: derived from your IP address. We do not request precise GPS location.`,
  },
  {
    heading: '2. How We Use Your Data',
    body: `We use your information to:\n\n• Operate and improve Throttlist\n• Personalize your feed and surface builds you're likely to enjoy\n• Send you notifications about activity on your content\n• Measure and analyze platform usage so we can fix bugs and prioritize features\n• Detect and prevent spam, abuse, and policy violations`,
  },
  {
    heading: '3. Who We Share It With',
    body: `We do not sell your personal data. We may share it with:\n\n• Hosting and infrastructure providers that power the platform (under strict data processing agreements)\n• Analytics services that help us understand usage — data is aggregated and anonymized where possible\n• Law enforcement or government authorities when required by law or to protect user safety`,
  },
  {
    heading: '4. Your Rights',
    body: `You can:\n\n• Edit or delete your posts at any time from within the app\n• Delete your account from Settings — we'll remove your personal data within 30 days\n• Request a copy of your data by emailing privacy@throttlist.com\n• Opt out of non-essential communications from your notification settings`,
  },
  {
    heading: '5. Data Retention',
    body: `We keep your data for as long as your account is active. After you delete your account, your personal data is queued for deletion within 30 days. Encrypted backups may retain data for up to 90 additional days before being permanently purged.`,
  },
  {
    heading: '6. Security',
    body: `We use industry-standard security measures including encrypted connections (HTTPS), hashed passwords, and access controls on our infrastructure. No system is 100% secure, so we also recommend using a strong, unique password and enabling any available two-factor authentication.`,
  },
  {
    heading: 'Contact',
    body: `For privacy questions or data requests, email us at privacy@throttlist.com`,
  },
]

const COOKIES_SECTIONS = [
  {
    heading: 'What Are Cookies?',
    body: `Cookies are small text files stored on your device that help us recognize you across sessions and remember your preferences. We also use similar technologies like local storage and session tokens to keep you logged in and personalize your experience.`,
  },
  {
    heading: 'Essential Cookies',
    body: `These are required for Throttlist to function. They include your authentication session token, which keeps you logged in between visits. You cannot opt out of essential cookies without also logging out of the app.`,
  },
  {
    heading: 'Analytics Cookies',
    body: `These help us understand how people use Throttlist — which features are popular, where users drop off, and how the app performs across different devices. Data collected for analytics is aggregated and does not personally identify you.`,
  },
  {
    heading: 'Preference Cookies',
    body: `These remember your settings and display preferences across sessions, so you don't have to reconfigure things every time you open the app.`,
  },
  {
    heading: 'How to Opt Out',
    body: `You can clear cookies and local storage through your browser or device settings at any time. Clearing essential cookies will log you out of Throttlist.\n\nTo opt out of analytics tracking specifically, email us at privacy@throttlist.com and we will disable analytics for your account.`,
  },
  {
    heading: 'Changes to This Policy',
    body: `We may update this policy as our practices evolve. We'll post the latest version here with an updated date at the top.`,
  },
  {
    heading: 'Contact',
    body: `Questions? Email privacy@throttlist.com`,
  },
]

function PolicySection({ heading, body }: { heading: string; body: string }) {
  return (
    <View style={styles.policySection}>
      <Text style={styles.policySectionHeading}>{heading}</Text>
      <Text style={styles.policySectionBody}>{body}</Text>
    </View>
  )
}

export default function PrivacyScreen() {
  const params = useLocalSearchParams<{ section?: string }>()
  const initialSection: Section =
    params.section === 'terms' ? 'terms'
    : params.section === 'cookies' ? 'cookies'
    : 'privacy'

  const [activeTab, setActiveTab] = useState<Section>(initialSection)
  const scrollRef = useRef<ScrollView>(null)

  // Scroll to top whenever tab changes
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false })
  }, [activeTab])

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Legal</Text>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <X size={20} color={colors.textSecondary} />
        </Pressable>
      </View>

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <Pressable
            key={tab.id}
            style={styles.tabItem}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabLabel, activeTab === tab.id && styles.tabLabelActive]}>
              {tab.label}
            </Text>
            {activeTab === tab.id && <View style={styles.tabUnderline} />}
          </Pressable>
        ))}
      </View>

      <ScrollView ref={scrollRef} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.updated}>{UPDATED}</Text>

        {activeTab === 'terms' && (
          <>
            <Text style={styles.sectionTitle}>Terms of Service</Text>
            <Text style={styles.intro}>
              These Terms of Service govern your use of Throttlist, the social platform for motorcycle builders and riders. Please read them — they're written to be clear.
            </Text>
            {TERMS_SECTIONS.map(s => <PolicySection key={s.heading} heading={s.heading} body={s.body} />)}
          </>
        )}

        {activeTab === 'privacy' && (
          <>
            <Text style={styles.sectionTitle}>Privacy Policy</Text>
            <Text style={styles.intro}>
              This policy explains what data Throttlist collects, how we use it, and the choices you have. We'll keep it straightforward.
            </Text>
            {PRIVACY_SECTIONS.map(s => <PolicySection key={s.heading} heading={s.heading} body={s.body} />)}
          </>
        )}

        {activeTab === 'cookies' && (
          <>
            <Text style={styles.sectionTitle}>Cookies Policy</Text>
            <Text style={styles.intro}>
              Throttlist uses cookies and similar technologies to keep you logged in and help us improve the app. Here's what we use and why.
            </Text>
            {COOKIES_SECTIONS.map(s => <PolicySection key={s.heading} heading={s.heading} body={s.body} />)}
          </>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    position: 'absolute',
    right: 16,
    top: Platform.OS === 'ios' ? 54 : 16,
    padding: 4,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  tabLabelActive: {
    color: colors.textPrimary,
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 12,
    right: 12,
    height: 2,
    backgroundColor: colors.accent,
    borderRadius: 1,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  updated: {
    color: colors.textSecondary,
    fontSize: 12,
    marginBottom: 6,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  intro: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  policySection: {
    marginBottom: 24,
  },
  policySectionHeading: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  policySectionBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
  },
})
