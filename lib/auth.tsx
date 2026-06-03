import React, { createContext, useContext, useEffect, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from './supabase'

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue>({
  session: null,
  user: null,
  loading: true,
  signOut: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Restore session from AsyncStorage on mount
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    // Keep state in sync with auth events (sign-in, sign-out, token refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
    })

    // Pause/resume the token auto-refresh as the app moves between background
    // and foreground. Without this the refresh timer fires while backgrounded,
    // and the token can silently expire if the app is killed between refreshes.
    function handleAppStateChange(nextState: AppStateStatus) {
      if (nextState === 'active') {
        supabase.auth.startAutoRefresh()
      } else {
        supabase.auth.stopAutoRefresh()
      }
    }
    const appStateSub = AppState.addEventListener('change', handleAppStateChange)

    return () => {
      subscription.unsubscribe()
      appStateSub.remove()
    }
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <AuthContext.Provider value={{ session, user: session?.user ?? null, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
