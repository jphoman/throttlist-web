import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { ThrottlistLogo } from '@/components/ThrottlistLogo'
import { colors } from '@/constants/throttlist'

const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? ''
const ADMIN_PASSWORD = process.env.EXPO_PUBLIC_ADMIN_PASSWORD ?? ''

export default function AdminScreen() {
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle')
  const [message, setMessage] = useState('')

  async function handleEnter() {
    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      setStatus('error')
      setMessage('EXPO_PUBLIC_ADMIN_EMAIL / EXPO_PUBLIC_ADMIN_PASSWORD not set in .env.local')
      return
    }

    setStatus('loading')
    setMessage('')

    // Try sign in first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    })

    if (!signInError) {
      router.replace('/feed')
      return
    }

    // Account doesn't exist yet — create it
    if (signInError.message.includes('Invalid login credentials') || signInError.message.includes('invalid_credentials')) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        options: {
          data: {
            username: 'jacob',
            display_name: 'Jacob',
          },
        },
      })

      if (signUpError) {
        setStatus('error')
        setMessage(signUpError.message)
        return
      }

      // Sign in immediately after sign up
      const { error: retryError } = await supabase.auth.signInWithPassword({
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
      })

      if (retryError) {
        setStatus('error')
        setMessage('Account created. To skip email confirmation: go to Supabase dashboard → Authentication → Settings → disable "Enable email confirmations". Then tap Enter again.')
        return
      }

      router.replace('/feed')
      return
    }

    setStatus('error')
    setMessage(signInError.message)
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ThrottlistLogo color={colors.accent} height={32} />
        <Text style={styles.label}>Admin Access</Text>

        {status === 'error' && (
          <Text style={styles.error}>{message}</Text>
        )}

        <Pressable
          style={[styles.btn, status === 'loading' && styles.btnDim]}
          onPress={handleEnter}
          disabled={status === 'loading'}
        >
          {status === 'loading'
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Enter</Text>
          }
        </Pressable>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: Platform.OS === 'ios' ? 54 : 0,
  },
  content: {
    width: '100%',
    alignItems: 'center',
    gap: 12,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 8,
  },
  email: {
    color: colors.textTertiary,
    fontSize: 14,
    marginBottom: 8,
  },
  btn: {
    width: '100%',
    backgroundColor: colors.accent,
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    marginTop: 4,
  },
  btnDim: { opacity: 0.5 },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
})
