import React from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft } from '@/components/Icons'
import { colors } from '@/constants/throttlist'

const SECTIONS = [
  {
    title: 'Terms of Service',
    updated: 'Last updated: January 1, 2025',
    body: `1. ACCEPTANCE OF TERMS
By creating an account on Throttlist you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.

2. USER ACCOUNTS
You are responsible for maintaining the confidentiality of your account credentials. You must be at least 18 years old to create an account. You agree to provide accurate information and keep it up to date.

3. CONTENT OWNERSHIP
You retain ownership of all content you post. By posting content you grant Throttlist a non-exclusive, royalty-free, worldwide license to display and distribute your content on the platform.

4. AFFILIATE LINKS
Part links may include Throttlist affiliate codes. Pro subscribers earn a share of commissions generated through their part links, subject to the Pro payout terms.

5. PROHIBITED CONDUCT
You agree not to post illegal content, spam, or content that violates third-party intellectual property rights. Throttlist reserves the right to remove content and terminate accounts that violate these terms.

6. DISCLAIMER
Throttlist is provided "as is." We make no warranties regarding uptime, accuracy of part information, or affiliate commission amounts.

7. GOVERNING LAW
These terms are governed by the laws of the State of California, United States.

8. CHANGES TO TERMS
We may update these terms at any time. Continued use of Throttlist after updates constitutes acceptance.

Contact: legal@throttlist.com`,
  },
  {
    title: 'Data Policy',
    updated: 'Last updated: January 1, 2025',
    body: `1. INFORMATION WE COLLECT
We collect information you provide when creating an account (name, email, username), content you post (photos, captions, build details), and usage data (pages visited, interactions).

2. HOW WE USE YOUR DATA
We use your information to operate and improve Throttlist, personalize your experience, send you service-related communications, and process affiliate commissions for Pro subscribers.

3. DATA SHARING
We do not sell your personal data to third parties. We may share data with service providers who assist us in operating the platform (hosting, analytics) under strict confidentiality agreements.

4. AFFILIATE DATA
When you click affiliate links, the destination retailer may receive referral data per their standard tracking practices. We do not share your personal profile with affiliate partners.

5. DATA RETENTION
We retain your data for as long as your account is active. You may request deletion of your account and associated data by contacting support@throttlist.com.

6. SECURITY
We implement industry-standard security measures to protect your data. No system is 100% secure; use a strong, unique password.

7. CONTACT
For data-related questions: privacy@throttlist.com`,
  },
  {
    title: 'Cookies Policy',
    updated: 'Last updated: January 1, 2025',
    body: `1. WHAT ARE COOKIES
Cookies are small text files stored on your device that help us recognize you and remember your preferences.

2. HOW WE USE COOKIES
We use cookies to keep you logged in, remember your settings, understand how you use Throttlist (analytics), and measure the effectiveness of affiliate links.

3. TYPES OF COOKIES WE USE
• Essential cookies — required for the app to function (authentication session).
• Analytics cookies — help us understand usage patterns (anonymized).
• Affiliate cookies — track referrals to partner retailers when you click part links.

4. YOUR CHOICES
You can clear cookies through your browser or device settings at any time. Clearing essential cookies will log you out of Throttlist.

5. THIRD-PARTY COOKIES
Affiliate retailers may set their own cookies when you follow a part link. Their cookie practices are governed by their own policies.

6. CHANGES
We may update this policy as our practices evolve. Check this page for the latest version.

Contact: privacy@throttlist.com`,
  },
]

export default function TermsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Legal</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {SECTIONS.map((section, i) => (
          <View key={section.title} style={[styles.section, i > 0 && styles.sectionBorder]}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <Text style={styles.updated}>{section.updated}</Text>
            <Text style={styles.body}>{section.body}</Text>
          </View>
        ))}
        <View style={{ height: 48 }} />
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
  content: { paddingHorizontal: 20 },
  section: { paddingVertical: 28 },
  sectionBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  updated: {
    color: colors.textTertiary,
    fontSize: 11,
    marginBottom: 16,
  },
  body: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
  },
})
