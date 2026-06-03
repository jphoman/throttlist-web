import { Platform } from 'react-native'
import { supabase } from './supabase'

/**
 * Decode a plain base64 string (no "data:…" prefix) to a Uint8Array.
 * Uses the globally available `atob` — works in React Native 0.60+ and web.
 */
function b64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64)
  const arr = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i)
  return arr
}

/**
 * Upload an image to Supabase Storage and return the public URL.
 *
 * **Native**: pass `base64` (plain string, no "data:…" prefix).
 *   This avoids the React Native `fetch(file://).blob()` empty-body bug where
 *   Supabase receives a 0-byte upload and stores nothing.
 *
 * **Web**: pass `uri` (data:, blob:, or http: URL). `fetch → blob` works fine
 *   on web and preserves the original MIME type.
 */
export async function uploadImage(opts: {
  bucket: string
  path: string
  base64?: string | null  // native: plain base64, no data: prefix
  uri?: string | null     // web: any fetch-able URL
  contentType?: string
  upsert?: boolean
}): Promise<string> {
  const { bucket, path, base64, uri, contentType = 'image/jpeg', upsert = false } = opts

  if (Platform.OS !== 'web' && base64) {
    // Native path — decode base64 → Uint8Array → upload
    const bytes = b64ToUint8Array(base64)
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, bytes, { contentType, upsert })
    if (error) throw error
  } else if (uri) {
    // Web path — fetch URI as blob (works for data:, blob:, and http: URLs)
    const resp = await fetch(uri)
    const blob = await resp.blob()
    const { error } = await supabase.storage
      .from(bucket)
      .upload(path, blob, { contentType: blob.type || contentType, upsert })
    if (error) throw error
  } else {
    throw new Error('uploadImage: provide base64 (native) or uri (web)')
  }

  const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(path)
  return publicUrl
}
