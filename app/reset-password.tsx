import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { colors } from '@/constants/throttlist'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordScreen() {
  const [ready, setReady] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Supabase fires PASSWORD_RECOVERY when the user arrives via the reset link.
  // The client automatically exchanges the token in the URL hash for a session.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const mismatch = confirm.length > 0 && password !== confirm
  const valid = password.length >= 8 && password === confirm

  async function handleUpdate() {
    setSubmitting(true)
    setError(null)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) throw updateError
      setDone(true)
      setTimeout(() => router.replace('/feed'), 2000)
    } catch (err: any) {
      setError(err.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.headline}>Choose a new password</Text>

        {done ? (
          <Text style={styles.successText}>Password updated. Taking you to your feed…</Text>
        ) : !ready ? (
          <Text style={styles.waitText}>
            Verifying your reset link… if nothing happens, try clicking the link in your email again.
          </Text>
        ) : (
          <>
            <Text style={styles.sub}>Must be at least 8 characters.</Text>

            <TextInput
              style={[styles.fieldInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
              value={password}
              onChangeText={setPassword}
              placeholder="NEW PASSWORD"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={[
                styles.fieldInput,
                mismatch && styles.fieldInputError,
                Platform.OS === 'web' && ({ outlineStyle: 'none' } as any),
              ]}
              value={confirm}
              onChangeText={setConfirm}
              placeholder="CONFIRM PASSWORD"
              placeholderTextColor={colors.textTertiary}
              secureTextEntry
              autoCapitalize="none"
            />
            {mismatch && <Text style={styles.errorText}>Passwords don't match</Text>}
            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={[styles.primaryBtn, (!valid || submitting) && styles.primaryBtnDim]}
              onPress={handleUpdate}
              disabled={!valid || submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.primaryBtnText}>Update password</Text>
              }
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 80 : 48,
    paddingBottom: 40,
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginBottom: 10,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },
  waitText: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 8,
  },
  fieldInput: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
    color: colors.textPrimary,
    fontSize: 15,
    marginBottom: 14,
  },
  fieldInputError: {
    borderColor: '#f87171',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 4,
  },
  primaryBtnDim: { opacity: 0.4 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    marginBottom: 12,
  },
  successText: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    marginTop: 8,
  },
})
