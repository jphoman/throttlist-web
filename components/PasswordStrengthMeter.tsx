import React from 'react'
import { View, Text, StyleSheet } from 'react-native'
import { validatePassword } from '@/lib/passwordValidation'
import { colors } from '@/constants/throttlist'

interface Props {
  password: string
}

const STRENGTH_COLORS = {
  weak: '#CC0000',
  medium: '#F59E0B',
  strong: '#22C55E',
}

const STRENGTH_LABELS = {
  weak: 'Weak',
  medium: 'Medium',
  strong: 'Strong',
}

const CHECK_LABELS = {
  minLength: 'At least 12 characters',
  hasUppercase: 'One uppercase letter (A–Z)',
  hasLowercase: 'One lowercase letter (a–z)',
  hasNumber: 'One number (0–9)',
  hasSpecial: 'One special character (!@#$%^&*)',
  noSpaces: 'No spaces',
} as const

type CheckKey = keyof typeof CHECK_LABELS

const CHECK_KEYS: CheckKey[] = [
  'minLength',
  'hasUppercase',
  'hasLowercase',
  'hasNumber',
  'hasSpecial',
  'noSpaces',
]

export default function PasswordStrengthMeter({ password }: Props) {
  const { checks, strength } = validatePassword(password)
  const strengthColor = STRENGTH_COLORS[strength]

  const segmentsFilled =
    strength === 'weak' ? 1 : strength === 'medium' ? 2 : 3

  return (
    <View style={styles.container}>
      {/* Strength bar */}
      <View style={styles.barRow}>
        <View style={styles.segments}>
          {[0, 1, 2].map(i => (
            <View
              key={i}
              style={[
                styles.segment,
                { backgroundColor: i < segmentsFilled ? strengthColor : colors.surface2 },
              ]}
            />
          ))}
        </View>
        {password.length > 0 && (
          <Text style={[styles.strengthLabel, { color: strengthColor }]}>
            {STRENGTH_LABELS[strength]}
          </Text>
        )}
      </View>

      {/* Checklist */}
      {password.length > 0 && (
        <View style={styles.checklist}>
          {CHECK_KEYS.map(key => {
            const passed = checks[key]
            const dotColor = passed ? '#22C55E' : '#CC0000'
            return (
              <View key={key} style={styles.checkRow}>
                <View style={[styles.dot, { backgroundColor: dotColor }]} />
                <Text style={[styles.checkLabel, { color: passed ? '#22C55E' : colors.textSecondary }]}>
                  {CHECK_LABELS[key]}
                </Text>
              </View>
            )
          })}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    gap: 8,
  },
  barRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  segments: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
    height: 4,
  },
  segment: {
    flex: 1,
    borderRadius: 2,
  },
  strengthLabel: {
    fontSize: 12,
    fontWeight: '600',
    minWidth: 48,
    textAlign: 'right',
  },
  checklist: {
    gap: 5,
    marginTop: 2,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  checkLabel: {
    fontSize: 12,
    lineHeight: 16,
  },
})
