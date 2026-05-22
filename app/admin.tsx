import React, { useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ActivityIndicator,
  Platform,
} from 'react-native'
import { router } from 'expo-router'
import { supabase } from '@/lib/supabase'
import { ThrottlistLogo } from '@/components/ThrottlistLogo'
import { colors } from '@/constants/throttlist'

const ADMIN_EMAIL = process.env.EXPO_PUBLIC_ADMIN_EMAIL ?? ''

export default function AdminScreen() {
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleLogin() {
    if (!ADMIN_EMAIL) {
      setError('EXPO_PUBLIC_ADMIN_EMAIL not set in .env.local')
      return
    }
    setLoading(true)
    setError(null)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: ADMIN_EMAIL,
      password,
    })
    setLoading(false)
    if (!signInError) {
      router.replace('/feed')
    } else {
      setError('Incorrect password')
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ThrottlistLogo color={colors.accent} height={32} />

        <View style={styles.fieldWrap}>
          <TextInput
            style={[styles.fieldInput, Platform.OS === 'web' && ({ outlineStyle: 'none' } as any)]}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={colors.textTertiary}
            secureTextEntry
            autoCapitalize="none"
            onSubmitEditing={handleLogin}
          />
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={[styles.btn, (!password || loading) && styles.btnDim]}
          onPress={handleLogin}
          disabled={!password || loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" />
            : <Text style={styles.btnText}>Log in</Text>
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
    gap: 14,
  },
  fieldWrap: {
    gap: 6,
  },
  fieldLabel: {
    color: colors.textTertiary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  fieldStatic: {
    backgroundColor: colors.surface1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  fieldStaticText: {
    color: colors.textSecondary,
    fontSize: 15,
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
  btnDim: { opacity: 0.4 },
  btnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  error: {
    color: '#f87171',
    fontSize: 13,
    textAlign: 'center',
  },
})
