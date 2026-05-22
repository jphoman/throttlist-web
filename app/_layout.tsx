import { useFrameworkReady } from '@/hooks/useFrameworkReady'
import { AuthProvider, useAuth } from '@/lib/auth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router, Stack, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { View } from 'react-native'
import TabBar from '@/components/TabBar'

const queryClient = new QueryClient()

const HIDE_TAB_BAR = new Set(['onboarding', 'signup', 'login', 'compose', 'settings', 'pro', 'pro-signup'])
const PUBLIC_ROUTES = new Set(['onboarding', 'signup', 'login'])

function RootLayoutInner() {
  useFrameworkReady()
  const segments = useSegments()
  const { session, loading } = useAuth()

  const showTabBar = !HIDE_TAB_BAR.has(segments[0] as string) && segments[1] !== 'capture'

  useEffect(() => {
    if (loading) return
    const inPublicRoute = PUBLIC_ROUTES.has(segments[0] as string)
    if (!session && !inPublicRoute) {
      router.replace('/onboarding')
    }
  }, [session, loading, segments])

  return (
    <View style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="login" />
        <Stack.Screen name="compose" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="following" />
        <Stack.Screen name="pro" />
        <Stack.Screen name="pro-signup" />
        <Stack.Screen name="build/[username]/[slug]" />
        <Stack.Screen name="user/[username]" />
        <Stack.Screen name="post/[postId]" />
        <Stack.Screen name="conversation/[id]" />
        <Stack.Screen name="+not-found" />
      </Stack>
      {showTabBar && <TabBar />}
    </View>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootLayoutInner />
      </AuthProvider>
      <StatusBar style="light" />
    </QueryClientProvider>
  )
}
