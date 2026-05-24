import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { colors } from '@/constants/throttlist'
import { ThrottlistLogo } from '@/components/ThrottlistLogo'
import { BUILD_CATEGORIES } from '@/constants/buildTypes'
import { CategoryIcon } from '@/components/Icons'

export default function OnboardingScreen() {
  const [selected, setSelected] = useState<string | null>(null)

  function handleContinue() {
    router.replace('/signup')
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.logoWrap}>
        <ThrottlistLogo color={colors.accent} height={30} />
      </View>

      <Text style={styles.headline}>What's your build?</Text>
      <Text style={styles.sub}>
        We'll personalize your feed and discover page for your build style.
      </Text>

      <View style={styles.grid}>
        {BUILD_CATEGORIES.map(type => (
          <Pressable
            key={type.id}
            style={[styles.card, selected === type.id && styles.cardSelected]}
            onPress={() => setSelected(type.id)}
          >
            <CategoryIcon
              id={type.id}
              size={28}
              color={selected === type.id ? colors.accent : colors.textSecondary}
            />
            <Text style={[styles.cardLabel, selected === type.id && styles.cardLabelSelected]}>
              {type.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <Pressable
        style={[styles.continueBtn, !selected && styles.continueBtnDim]}
        onPress={handleContinue}
        disabled={!selected}
      >
        <Text style={styles.continueBtnText}>Get Started</Text>
      </Pressable>

      <Pressable onPress={handleContinue} style={styles.skip} testID="skip-btn">
        <Text style={styles.skipText}>Skip for now</Text>
      </Pressable>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 72 : 48,
    paddingBottom: 48,
  },
  logoWrap: {
    marginBottom: 40,
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.5,
    marginBottom: 10,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 32,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 32,
  },
  card: {
    width: '47%',
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.surface2,
    borderRadius: 12,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    gap: 8,
  },
  cardSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '18',
  },
  cardLabel: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  cardLabelSelected: {
    color: colors.accent,
  },
  continueBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  continueBtnDim: {
    opacity: 0.4,
  },
  continueBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  skip: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  skipText: {
    color: colors.textTertiary,
    fontSize: 14,
  },
})
