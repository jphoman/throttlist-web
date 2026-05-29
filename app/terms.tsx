import { Redirect, useLocalSearchParams } from 'expo-router'

// Legacy route — the Legal page now lives at /privacy.
// Kept so existing https://throttlist.com/terms links keep working.
export default function TermsRedirect() {
  const params = useLocalSearchParams<{ section?: string }>()
  return <Redirect href={{ pathname: '/privacy', params: params.section ? { section: params.section } : {} }} />
}
