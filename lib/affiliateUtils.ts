/**
 * Affiliate & tracking utilities for Throttlist product tags.
 *
 * Architecture
 * ────────────
 * Every product tag gets a unique tracking ID stored alongside the
 * affiliate URL. The ID embeds the user + build so any future
 * conversion event can be attributed back to the creator:
 *
 *   tl_{userIdPrefix}_{buildIdPrefix}_{randomSuffix}
 *
 * For Amazon links the affiliate tag (throttlist-20) is appended as
 * the `tag` query param; the tracking ID goes into `ref`.
 * For all other retailers only `ref` is appended (future-proofing for
 * partner programmes beyond Amazon).
 */

export const AMAZON_TAG = 'throttlist-20'

/**
 * Generate a unique per-tag tracking ID.
 * Kept short (<40 chars) so it fits cleanly in Amazon's `ref` param.
 */
export function generateTrackingId(userId: string, buildId?: string): string {
  const uid = userId.replace(/-/g, '').slice(0, 8)
  const bid = buildId ? buildId.replace(/-/g, '').slice(0, 8) : '00000000'
  const rand = Math.random().toString(36).slice(2, 8)
  return `tl_${uid}_${bid}_${rand}`
}

/**
 * Append the affiliate tag + tracking ref to a product URL.
 *
 * Amazon  →  ?tag=throttlist-20&ref={trackingId}
 * Others  →  ?ref={trackingId}
 *
 * Handles existing query strings correctly (uses URLSearchParams).
 */
export function appendAffiliateTag(rawUrl: string, trackingId: string): string {
  try {
    const url = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`)
    if (url.hostname.includes('amazon.')) {
      url.searchParams.set('tag', AMAZON_TAG)
    }
    url.searchParams.set('ref', trackingId)
    return url.toString()
  } catch {
    return rawUrl
  }
}

/**
 * Detect whether a string is an Amazon URL.
 */
export function isAmazonUrl(url: string): boolean {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`)
      .hostname.includes('amazon.')
  } catch {
    return false
  }
}

/**
 * Extract the readable domain from a URL (strips www.).
 */
export function extractDomain(url: string): string {
  try {
    return new URL(url.startsWith('http') ? url : `https://${url}`)
      .hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}
