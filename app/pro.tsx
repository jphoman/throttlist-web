import React, { useEffect, useRef } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Animated,
} from 'react-native'
import { router } from 'expo-router'
import {
  ArrowLeft,
  CheckCircle,
  ProBadge,
} from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'


const INCLUDED = [
  'Everything in Basic — always free',
  'Customized storefront on your profile',
  'Minimal hassle earnings on affiliate linked items',
  'Monthly bank payouts via Stripe',
  'Analytics dashboard',
  'Pro badge',
  'Priority Discover placement',
]

export default function ProScreen() {
  const insets = useSafeAreaInsets()
  const scale = useRef(new Animated.Value(1)).current

  useEffect(() => {
    const beat = () => {
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.22, duration: 110, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 110, useNativeDriver: true }),
        Animated.delay(120),
        Animated.timing(scale, { toValue: 1.14, duration: 100, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1,    duration: 100, useNativeDriver: true }),
      ]).start()
    }
    beat()
    const id = setInterval(beat, 8000)
    return () => clearInterval(id)
  }, [])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Throttlist Pro</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.starCircle}>
            <Animated.View style={{ transform: [{ scale }] }}>
              <ProBadge size={48} />
            </Animated.View>
          </View>
          <Text style={styles.heroTitle}>Get paid to build.</Text>
          <Text style={styles.heroSub}>
            Every tag link you share can earn you money. Pro unlocks your payouts and puts your builds front and center.
          </Text>
        </View>

        {/* Pricing */}
        <View style={styles.pricingCard}>
          <View style={styles.pricingTop}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>$5</Text>
              <Text style={styles.pricePer}>/month</Text>
            </View>
            <Text style={styles.pricingNote}>
              Cancel any time.{'\n'}First month free{'\n'}for Beta users.
            </Text>
          </View>
        </View>

        {/* What's included */}
        <Text style={styles.sectionTitle}>What's included</Text>
        <View style={styles.includedList}>
          {INCLUDED.map((item, i) => (
            <View key={i} style={styles.includedRow}>
              <CheckCircle size={16} color={colors.green} />
              <Text style={styles.includedText}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Earnings callout */}
        <View style={styles.callout}>
          <Text style={styles.calloutText}>
            Pro Builders with just 1000 followers can generate{' '}
            <Text style={styles.calloutAccent}>$100 - $500</Text>
            {' '}or more a month from tags.
          </Text>
        </View>

        {/* CTA */}
        <Pressable style={styles.ctaBtn} onPress={() => router.push('/pro-signup')}>
          <Text style={styles.ctaBtnText}>Set up payouts & unlock Pro</Text>
        </Pressable>

        <Text style={styles.legalNote}>
          By upgrading you agree to the Throttlist Pro Terms and the Stripe Connected Account Agreement. Payout amounts depend on affiliate partner rates and are not guaranteed.
        </Text>

        <View style={{ height: 32 }} />
      </ScrollView>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  backBtn: { padding: 4, width: 44 },
  content: {
    padding: 20,
  },
  // Hero
  hero: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  starCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.accent + '44',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroTitle: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
    textAlign: 'center',
  },
  heroSub: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
  // Pricing
  pricingCard: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.accent + '55',
    borderRadius: 14,
    padding: 20,
    marginBottom: 28,
  },
  pricingTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    color: colors.textPrimary,
    fontSize: 42,
    fontWeight: '800',
    lineHeight: 46,
  },
  pricePer: {
    color: colors.textTertiary,
    fontSize: 14,
  },
  proBadge: {
    backgroundColor: colors.accent,
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  proBadgeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1,
  },
  pricingNote: {
    color: colors.textTertiary,
    fontSize: 12,
    textAlign: 'right',
    lineHeight: 18,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 14,
  },
  // Included
  includedList: {
    backgroundColor: colors.surface1,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginBottom: 28,
    gap: 0,
  },
  includedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  includedText: {
    color: colors.textSecondary,
    fontSize: 14,
    flex: 1,
  },
  // Features
  featureList: {
    gap: 10,
    marginBottom: 24,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: colors.surface1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
    gap: 14,
    alignItems: 'flex-start',
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: colors.accent + '18',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  featureBody: { flex: 1 },
  featureTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  featureText: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  // Callout
  callout: {
    backgroundColor: colors.accent + '18',
    borderWidth: 1,
    borderColor: colors.accent + '44',
    borderRadius: 10,
    padding: 16,
    marginBottom: 24,
  },
  calloutText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  calloutAccent: {
    color: colors.accent,
    fontWeight: '700',
  },
  // CTA
  ctaBtn: {
    backgroundColor: colors.accent,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  legalNote: {
    color: colors.textTertiary,
    fontSize: 11,
    lineHeight: 16,
    textAlign: 'center',
  },
})
