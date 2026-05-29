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
import { ArrowLeft } from '@/components/Icons'
import { colors } from '@/constants/throttlist'
import { ThrottlistLogo } from '@/components/ThrottlistLogo'
import { supabase } from '@/lib/supabase'
import OtpInput from '@/components/OtpInput'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [step, setStep] = useState<'credentials' | 'mfa'>('credentials')
  const [mfaFactorId, setMfaFactorId] = useState<string>('')
  const [mfaChallengeId, setMfaChallengeId] = useState<string>('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaError, setMfaError] = useState<string | null>(null)
  const [mfaVerifying, setMfaVerifying] = useState(false)

  const valid = email.trim().length > 0 && password.length >= 1

  // Auto-verify MFA when 6 digits entered
  useEffect(() => {
    if (step === 'mfa' && mfaCode.length === 6 && !mfaVerifying) {
      handleVerifyMfa(mfaCode)
    }
  }, [mfaCode, step])

  async function handleLogin() {
    setSubmitting(true)
    setError(null)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })
      if (signInError) throw signInError

      // Check if 2FA is required
      const { data: aal } = await (supabase.auth.mfa as any).getAuthenticatorAssuranceLevel()
      if (aal?.nextLevel === 'aal2') {
        const { data: factors } = await (supabase.auth.mfa as any).listFactors()
        const totp = factors?.totp?.find((f: any) => f.status === 'verified')
        if (totp) {
          const { data: challengeData } = await (supabase.auth.mfa as any).challenge({ factorId: totp.id })
          setMfaFactorId(totp.id)
          setMfaChallengeId(challengeData.id)
          setStep('mfa')
          return
        }
      }
      router.replace('/feed')
    } catch (err: any) {
      setError(err.message ?? 'Login failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleVerifyMfa(otp: string) {
    setMfaVerifying(true)
    setMfaError(null)
    try {
      const { error } = await (supabase.auth.mfa as any).verify({
        factorId: mfaFactorId,
        challengeId: mfaChallengeId,
        code: otp,
      })
      if (error) throw error
      router.replace('/feed')
    } catch (err: any) {
      setMfaError(err?.message ?? 'Verification failed. Please try again.')
      setMfaCode('')
    } finally {
      setMfaVerifying(false)
    }
  }

  function handleBackToCredentials() {
    setStep('credentials')
    setMfaCode('')
    setMfaError(null)
    setMfaFactorId('')
    setMfaChallengeId('')
  }

  if (step === 'mfa') {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={handleBackToCredentials} style={styles.backBtn}>
            <ArrowLeft size={20} color={colors.textSecondary} />
          </Pressable>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={styles.logoWrap}>
            <ThrottlistLogo color={colors.accent} height={36} />
          </View>
          <Text style={styles.headline}>Two-Factor Auth</Text>
          <Text style={styles.sub}>Enter the 6-digit code from your authenticator app.</Text>

          <View style={styles.otpWrapper}>
            <OtpInput value={mfaCode} onChange={setMfaCode} autoFocus />
          </View>

          {mfaVerifying && (
            <View style={styles.verifyingRow}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.verifyingText}>Verifying…</Text>
            </View>
          )}

          {mfaError && <Text style={styles.errorText}>{mfaError}</Text>}

          <Pressable onPress={handleBackToCredentials} style={styles.forgotBtn}>
            <Text style={styles.forgotText}>← Back</Text>
          </Pressable>
        </ScrollView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logoWrap}>
          <ThrottlistLogo color={colors.accent} height={36} />
        </View>
        <Text style={styles.headline}>Welcome back.</Text>
        <Text style={styles.sub}>Log in to your account.</Text>

        <View style={styles.form}>
          <TextInput
            style={[styles.fieldInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            value={email}
            onChangeText={setEmail}
            placeholder="EMAIL"
            placeholderTextColor={colors.textTertiary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={[styles.fieldInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            value={password}
            onChangeText={setPassword}
            placeholder="PASSWORD"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            autoCapitalize="none"
          />
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <Pressable
          style={[styles.primaryBtn, (!valid || submitting) && styles.primaryBtnDim]}
          onPress={handleLogin}
          disabled={!valid || submitting}
        >
          {submitting
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.primaryBtnText}>Log in</Text>
          }
        </Pressable>

        <Pressable onPress={() => router.push('/forgot-password')} style={styles.forgotBtn}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </Pressable>

        <View style={{ flex: 1, minHeight: 32 }} />

        <Text style={styles.switchText}>Don't have an account?</Text>
        <Pressable style={styles.signupBtn} onPress={() => router.replace('/signup')}>
          <Text style={styles.signupBtnText}>Sign up</Text>
        </Pressable>
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
    paddingTop: Platform.OS === 'ios' ? 54 : 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { padding: 4, width: 44 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  logoWrap: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.3,
    textAlign: 'center',
    marginBottom: 6,
  },
  sub: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
    textAlign: 'center',
  },
  form: {
    gap: 16,
    marginBottom: 28,
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
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 50,
  },
  primaryBtnDim: { opacity: 0.4 },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  forgotBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  forgotText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  switchText: {
    color: colors.textTertiary,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 12,
  },
  signupBtn: {
    borderWidth: 1,
    borderColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  signupBtnText: {
    color: colors.accent,
    fontSize: 16,
    fontWeight: '700',
  },
  errorText: {
    color: '#f87171',
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
  },
  otpWrapper: {
    paddingTop: 8,
    paddingBottom: 16,
    alignItems: 'center',
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },
  verifyingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
})
