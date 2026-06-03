import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { Platform } from 'react-native'
import type { Database } from './database.types'

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!
const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient<Database>(url, key, {
  auth: {
    // Persist the session token to device storage so it survives app kills.
    // AsyncStorage is the standard React Native adapter for Supabase auth.
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    // detectSessionInUrl is only meaningful on web (OAuth redirect in the URL).
    // On native, deep links are handled by expo-router + expo-linking — enabling
    // this on native causes Supabase to misread the throttlist:// scheme as a
    // session URL, which can silently break auth on cold start.
    detectSessionInUrl: Platform.OS === 'web',
  },
})
