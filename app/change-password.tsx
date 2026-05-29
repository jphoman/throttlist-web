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
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { ArrowLeft, Eye, EyeOff, CheckCircle } from '@/components/Icons'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { colors } from '@/constants/throttlist'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import PasswordStrengthMeter from '@/components/PasswordStrengthMeter'
import { validatePassword } from '@/lib/passwordValidation'

export default function ChangePasswordScreen() {
  const insets = useSafeAreaInsets()
  const { user: authUser } = useAuth()

  const [current, setCurrent]         = useState('')
  const [next, setNext]               = useState('')
  const [confirm, setConfirm]         = useState('')
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNext, setShowNext]       = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  const [saving, setSaving]         = useState(false)
  const [done, setDone]             = useState(false)
  const [error, setError]           = useState<string | null>(null)

  const [resetSending, setResetSending] = useState(false)
  const [resetSent, setResetSent]       = useState(false)
  const [resetError, setResetError]     = useState<string | null>(null)

  async function handleSave() {
    setError(null)
    if (!current.trim()) { setError('Please enter your current password.'); return }
    if (!validatePassword(next).isValid) { setError('Password does not meet requirements.'); return }
    if (next !== confirm)  { setError('New passwords do not match.'); return }

    setSaving(true)
    try {
      // Re-authenticate with current password to verify it's correct
      const email = authUser?.email ?? ''
      const { error: signInErr } = await supabase.auth.signInWithPassword({ email, password: current })
      if (signInErr) {
        setError('Current password is incorrect.')
        return
      }

      // Update to new password
      const { error: updateErr } = await supabase.auth.updateUser({ password: next })
      if (updateErr) throw updateErr

      setDone(true)
    } catch (err: any) {
      setError(err?.message ?? 'Something went wrong. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  async function handleForgotPassword() {
    setResetError(null)
    const email = authUser?.email ?? ''
    if (!email) { setResetError('No email address on file.'); return }

    setResetSending(true)
    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://throttlist.com',
      })
      if (resetErr) throw resetErr
      setResetSent(true)
    } catch (err: any) {
      setResetError(err?.message ?? 'Failed to send reset email.')
    } finally {
      setResetSending(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.bg }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.dismiss()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Change Password</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: 48 }}
      >
        {done ? (
          /* ── Success state ── */
          <View style={styles.successBox}>
            <CheckCircle size={40} color={colors.accent} />
            <Text style={styles.successTitle}>Password updated</Text>
            <Text style={styles.successBody}>Your password has been changed successfully.</Text>
            <Pressable style={styles.doneBtn} onPress={() => router.dismiss()}>
              <Text style={styles.doneBtnText}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {/* ── Change password form ── */}
            <Text style={styles.sectionLabel}>Update Password</Text>
            <View style={styles.group}>

              {/* Current password */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Current Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={current}
                    onChangeText={setCurrent}
                    placeholder="Enter current password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showCurrent}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowCurrent(v => !v)} style={styles.eyeBtn} hitSlop={8}>
                    {showCurrent
                      ? <EyeOff size={18} color={colors.textTertiary} />
                      : <Eye    size={18} color={colors.textTertiary} />}
                  </Pressable>
                </View>
              </View>

              <View style={styles.separator} />

              {/* New password */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={next}
                    onChangeText={setNext}
                    placeholder="At least 12 characters"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showNext}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowNext(v => !v)} style={styles.eyeBtn} hitSlop={8}>
                    {showNext
                      ? <EyeOff size={18} color={colors.textTertiary} />
                      : <Eye    size={18} color={colors.textTertiary} />}
                  </Pressable>
                </View>
              </View>

              <PasswordStrengthMeter password={next} />

              <View style={styles.separator} />

              {/* Confirm new password */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Confirm New Password</Text>
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={confirm}
                    onChangeText={setConfirm}
                    placeholder="Re-enter new password"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!showConfirm}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <Pressable onPress={() => setShowConfirm(v => !v)} style={styles.eyeBtn} hitSlop={8}>
                    {showConfirm
                      ? <EyeOff size={18} color={colors.textTertiary} />
                      : <Eye    size={18} color={colors.textTertiary} />}
                  </Pressable>
                </View>
              </View>

            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable
              style={[styles.saveBtn, (saving || !current || !next || !confirm) && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
            >
              {saving
                ? <ActivityIndicator size="small" color="#fff" />
                : <Text style={styles.saveBtnText}>Update Password</Text>}
            </Pressable>

            {/* ── Forgot password ── */}
            <Text style={styles.sectionLabel}>Forgot Your Password?</Text>
            <View style={styles.group}>
              <View style={styles.forgotRow}>
                <Text style={styles.forgotBody}>
                  We'll send a reset link to{' '}
                  <Text style={styles.forgotEmail}>{authUser?.email ?? 'your email'}</Text>
                </Text>
                {resetSent ? (
                  <View style={styles.resetSentRow}>
                    <CheckCircle size={16} color={colors.accent} />
                    <Text style={styles.resetSentText}>Reset email sent!</Text>
                  </View>
                ) : (
                  <Pressable
                    style={[styles.resetBtn, resetSending && styles.saveBtnDisabled]}
                    onPress={handleForgotPassword}
                    disabled={resetSending}
                  >
                    {resetSending
                      ? <ActivityIndicator size="small" color="#fff" />
                      : <Text style={styles.resetBtnText}>Send Reset Link</Text>}
                  </Pressable>
                )}
                {resetError && <Text style={styles.errorText}>{resetError}</Text>}
              </View>
            </View>
          </>
        )}
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
  group: {
    backgroundColor: colors.surface1,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  field: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 6,
  },
  fieldLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 15,
    paddingVertical: 4,
  },
  eyeBtn: {
    paddingLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: 16,
  },
  errorText: {
    color: colors.accent,
    fontSize: 13,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  saveBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  // Forgot password
  forgotRow: {
    padding: 16,
    gap: 12,
  },
  forgotBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  forgotEmail: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  resetBtn: {
    backgroundColor: colors.surface2,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 44,
  },
  resetBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  resetSentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  resetSentText: {
    color: colors.accent,
    fontSize: 14,
    fontWeight: '600',
  },
  // Success
  successBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    gap: 12,
  },
  successTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 8,
  },
  successBody: {
    color: colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  doneBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingHorizontal: 48,
    paddingVertical: 14,
    marginTop: 8,
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
})
