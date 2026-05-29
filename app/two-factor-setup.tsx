import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ArrowLeft, CheckCircle, Copy } from '@/components/Icons'
import OtpInput from '@/components/OtpInput'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/lib/auth'
import { colors } from '@/constants/throttlist'

type Step = 'enroll' | 'verify' | 'backup' | 'done'

const BACKUP_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function generateBackupCode(): string {
  const rand = (n: number) => Math.floor(Math.random() * n)
  const part = (len: number) =>
    Array.from({ length: len }, () => BACKUP_CHARS[rand(BACKUP_CHARS.length)]).join('')
  return `${part(4)}-${part(4)}`
}

function generateBackupCodes(count = 8): string[] {
  return Array.from({ length: count }, generateBackupCode)
}

export default function TwoFactorSetupScreen() {
  const insets = useSafeAreaInsets()
  const { user: authUser } = useAuth()

  const [step, setStep] = useState<Step>('enroll')

  // Enroll step
  const [factorId, setFactorId] = useState<string>('')
  const [qrCode, setQrCode] = useState<string>('')
  const [secret, setSecret] = useState<string>('')
  const [enrollLoading, setEnrollLoading] = useState(true)
  const [enrollError, setEnrollError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  // Verify step
  const [code, setCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyError, setVerifyError] = useState<string | null>(null)

  // Backup step
  const [backupCodes, setBackupCodes] = useState<string[]>([])
  const [backupCopied, setBackupCopied] = useState(false)

  useEffect(() => {
    async function enroll() {
      try {
        const { data, error } = await (supabase.auth.mfa as any).enroll({ factorType: 'totp' })
        if (error) throw error
        setFactorId(data.id)
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
      } catch (err: any) {
        setEnrollError(err?.message ?? 'Failed to start 2FA enrollment.')
      } finally {
        setEnrollLoading(false)
      }
    }
    enroll()
  }, [])

  // Auto-verify when 6 digits entered
  useEffect(() => {
    if (step === 'verify' && code.length === 6 && !verifying) {
      handleVerify(code)
    }
  }, [code, step])

  async function handleVerify(otp: string) {
    setVerifying(true)
    setVerifyError(null)
    try {
      const { error } = await (supabase.auth.mfa as any).challengeAndVerify({ factorId, code: otp })
      if (error) throw error

      // Generate backup codes
      const codes = generateBackupCodes(8)
      setBackupCodes(codes)

      // Save to mfa_backup_codes table
      if (authUser?.id) {
        const rows = codes.map(c => ({ user_id: authUser.id, code: c, used: false }))
        await supabase.from('mfa_backup_codes').insert(rows)
      }

      setStep('backup')
    } catch (err: any) {
      setVerifyError(err?.message ?? 'Verification failed. Check your code and try again.')
      setCode('')
    } finally {
      setVerifying(false)
    }
  }

  function handleCopySecret() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(secret)
    }
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleCopyAllBackupCodes() {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(backupCodes.join('\n'))
    }
    setBackupCopied(true)
    setTimeout(() => setBackupCopied(false), 2000)
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.dismiss()} style={styles.backBtn}>
          <ArrowLeft size={20} color={colors.textSecondary} />
        </Pressable>
        <Text style={styles.headerTitle}>Two-Factor Auth</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── ENROLL ── */}
        {step === 'enroll' && (
          <View style={styles.stepContainer}>
            {enrollLoading ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={styles.loadingText}>Setting up 2FA…</Text>
              </View>
            ) : enrollError ? (
              <View style={styles.centerBox}>
                <Text style={styles.errorText}>{enrollError}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.stepTitle}>Scan QR Code</Text>
                <Text style={styles.stepBody}>
                  Open your authenticator app (e.g. Google Authenticator, Authy) and scan the QR code below.
                </Text>

                <View style={styles.qrContainer}>
                  <Image
                    source={{ uri: qrCode }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                </View>

                {/* Can't scan section */}
                <View style={styles.manualSection}>
                  <Text style={styles.manualTitle}>Can't scan?</Text>
                  <Text style={styles.manualBody}>Enter this key manually in your authenticator app:</Text>
                  <View style={styles.secretBox}>
                    <Text style={styles.secretText} selectable>{secret}</Text>
                    <Pressable onPress={handleCopySecret} style={styles.copyBtn}>
                      <Copy size={16} color={copied ? '#22C55E' : colors.textTertiary} />
                      <Text style={[styles.copyBtnText, copied && { color: '#22C55E' }]}>
                        {copied ? 'Copied!' : 'Copy'}
                      </Text>
                    </Pressable>
                  </View>
                </View>

                <Pressable
                  style={styles.primaryBtn}
                  onPress={() => setStep('verify')}
                >
                  <Text style={styles.primaryBtnText}>Next</Text>
                </Pressable>
              </>
            )}
          </View>
        )}

        {/* ── VERIFY ── */}
        {step === 'verify' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Verify Setup</Text>
            <Text style={styles.stepBody}>
              Enter the 6-digit code from your authenticator app to confirm setup.
            </Text>

            <View style={styles.otpWrapper}>
              <OtpInput value={code} onChange={setCode} autoFocus />
            </View>

            {verifying && (
              <View style={styles.verifyingRow}>
                <ActivityIndicator size="small" color={colors.accent} />
                <Text style={styles.verifyingText}>Verifying…</Text>
              </View>
            )}

            {verifyError && (
              <Text style={styles.errorText}>{verifyError}</Text>
            )}
          </View>
        )}

        {/* ── BACKUP ── */}
        {step === 'backup' && (
          <View style={styles.stepContainer}>
            <Text style={styles.stepTitle}>Save Your Backup Codes</Text>
            <Text style={styles.stepBody}>
              If you lose access to your authenticator, these codes let you sign in. Each code can only be used once. Store them somewhere safe.
            </Text>

            <View style={styles.backupGrid}>
              {backupCodes.map((c, i) => (
                <View key={i} style={styles.backupCodeBox}>
                  <Text style={styles.backupCodeText}>{c}</Text>
                </View>
              ))}
            </View>

            <Pressable onPress={handleCopyAllBackupCodes} style={styles.secondaryBtn}>
              <Copy size={16} color={backupCopied ? '#22C55E' : colors.textPrimary} />
              <Text style={[styles.secondaryBtnText, backupCopied && { color: '#22C55E' }]}>
                {backupCopied ? 'Copied!' : 'Copy All'}
              </Text>
            </Pressable>

            <Pressable
              style={[styles.primaryBtn, { marginTop: 12 }]}
              onPress={() => setStep('done')}
            >
              <Text style={styles.primaryBtnText}>I've saved my codes</Text>
            </Pressable>
          </View>
        )}

        {/* ── DONE ── */}
        {step === 'done' && (
          <View style={styles.doneContainer}>
            <CheckCircle size={48} color={colors.accent} />
            <Text style={styles.doneTitle}>2FA Enabled!</Text>
            <Text style={styles.doneBody}>
              Your account is now protected with two-factor authentication.
            </Text>
            <Pressable style={styles.primaryBtn} onPress={() => router.dismiss()}>
              <Text style={styles.primaryBtnText}>Done</Text>
            </Pressable>
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
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
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 48,
  },
  stepContainer: {
    paddingTop: 32,
    gap: 16,
  },
  stepTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  stepBody: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
  },
  centerBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 48,
    gap: 16,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  qrContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  qrImage: {
    width: 200,
    height: 200,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  manualSection: {
    backgroundColor: colors.surface1,
    borderRadius: 10,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  manualTitle: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
  },
  manualBody: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
  },
  secretBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 6,
    padding: 10,
    gap: 10,
  },
  secretText: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  copyBtnText: {
    color: colors.textTertiary,
    fontSize: 12,
    fontWeight: '600',
  },
  otpWrapper: {
    paddingTop: 8,
    paddingBottom: 8,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 4,
  },
  verifyingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  errorText: {
    color: colors.accent,
    fontSize: 13,
    textAlign: 'center',
  },
  backupGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  backupCodeBox: {
    width: '47%',
    backgroundColor: colors.surface2,
    borderRadius: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  backupCodeText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Courier New' : 'monospace',
    letterSpacing: 1,
    fontWeight: '600',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  secondaryBtnText: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  primaryBtn: {
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  doneContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 16,
    paddingHorizontal: 8,
  },
  doneTitle: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  doneBody: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
  },
})
