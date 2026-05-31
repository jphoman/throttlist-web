# Throttlist — Architecture

> Last updated: 2026-05-30  
> Stack: Expo SDK 54 · React Native 0.81.5 · React 19 · expo-router v6 · Supabase · TypeScript

---

## Table of Contents

1. [High-Level Overview](#high-level-overview)
2. [Repository Layout](#repository-layout)
3. [Data Model](#data-model)
4. [Affiliate & Attribution System](#affiliate--attribution-system)
5. [Feed Scoring](#feed-scoring)
6. [Discovery Scoring](#discovery-scoring)
7. [Authentication & Auth Flow](#authentication--auth-flow)
8. [iOS / Native Build](#ios--native-build)
9. [Key Libraries & Why](#key-libraries--why)
10. [Environment Variables](#environment-variables)

---

## High-Level Overview

Throttlist is a social platform for vehicle/hobby build enthusiasts. Users create **Builds** (a motorcycle, car, guitar, etc.), post photos tagged to their builds, discover other builds, and monetise through affiliate links on the products they use. The web app and iOS app share a single Expo codebase.

```
throttlist.com (Vercel)   ←→   Supabase (Postgres + Auth + Storage + Realtime)
iOS (TestFlight / App Store)  ↑
         same codebase
```

---

## Repository Layout

```
throttlist-web/
├── app/                        # expo-router file-system routes
│   ├── _layout.tsx             # Root layout: AuthProvider + QueryClient + TabBar
│   ├── index.tsx               # Root redirect (→ /feed or /signup)
│   ├── (tabs)/                 # Bottom-nav screens
│   │   ├── feed.tsx            # Main feed (For You / Recent / Following)
│   │   ├── discover.tsx        # Discovery (scored users, builds, posts)
│   │   ├── capture.tsx         # Camera / gallery → compose
│   │   ├── messages.tsx        # DM inbox
│   │   └── profile.tsx         # Own profile
│   ├── build/[username]/[slug].tsx
│   ├── post/[postId].tsx
│   ├── user/[username].tsx
│   ├── conversation/[id].tsx
│   ├── followers/[userId].tsx
│   ├── tag/[name].tsx
│   ├── add-build.tsx           # 2-step build creation wizard
│   ├── compose.tsx             # Post creation (photo + caption + product tags)
│   ├── settings.tsx            # Settings, edit profile, 2FA, Pro toggle
│   ├── top-builds-edit.tsx     # "Top 8" build picker
│   ├── analytics.tsx           # Pro: analytics dashboard
│   ├── pro.tsx                 # Pro upgrade marketing screen
│   ├── pro-signup.tsx          # Pro checkout / Stripe onboarding
│   ├── membership.tsx          # Active Pro member view
│   ├── store-items.tsx         # Pro: store item management (partially stubbed)
│   ├── login.tsx / signup.tsx / onboarding.tsx
│   ├── forgot-password.tsx / reset-password.tsx / change-password.tsx
│   ├── two-factor-setup.tsx
│   ├── admin.tsx / privacy.tsx / support.tsx
│   └── +not-found.tsx
├── components/                 # Shared UI components
├── lib/
│   ├── supabase.ts             # Supabase JS client (singleton)
│   ├── auth.tsx                # AuthProvider context
│   ├── supabaseQueries.ts      # All DB query functions
│   ├── affiliateUtils.ts       # URL tagging, tracking ID generation
│   ├── database.types.ts       # Generated Supabase TypeScript types
│   ├── data.ts                 # Mock data (seed / stub only — NOT production)
│   └── passwordValidation.ts
├── constants/
│   ├── throttlist.ts           # Colours, AFFILIATE_TAG, utilities
│   ├── buildTypes.ts           # 10 build categories + part categories
│   ├── animations.ts
│   └── platform.ts
├── assets/images/
├── app.json                    # Expo config (bundle ID, plugins, permissions)
├── eas.json                    # EAS build profiles
├── babel.config.js             # babel-preset-expo@54 (pinned — see iOS section)
└── metro.config.js             # Metro resolver overrides (see iOS section)
```

---

## Data Model

### `profiles`

Extends `auth.users` (trigger `handle_new_user()` auto-creates on signup).

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | = auth.users.id |
| `username` | text unique | URL-safe handle |
| `display_name` | text | |
| `bio` | text | |
| `avatar_url` | text | Supabase Storage URL |
| `location` | text | |
| `instagram_handle` | text | |
| `youtube_handle` | text | |
| `website_url` | text | |
| `website_title` | text | |
| `build_style` | text | e.g. "cafe racer", "bobber" |
| `is_pro` | bool | Pro subscriber flag |
| `top_build_ids` | text[] | ordered list for "Top 8" section |
| `created_at` | timestamptz | |

### `builds`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK profiles | |
| `year` | int | |
| `make` | text | |
| `model` | text | |
| `nickname` | text | User-given name e.g. "Scarlett" |
| `slug` | text | URL slug, unique per user |
| `cover_photo_url` | text | |
| `build_type` | text | one of 10 categories |
| `status` | text | 'active' \| 'sold' \| 'project' |
| `is_public` | bool | |
| `follower_count` | int | denormalised; updated via RPC |
| `created_at` | timestamptz | |

### `parts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `build_id` | uuid FK builds | |
| `name` | text | |
| `category` | text | e.g. "Exhaust", "Suspension" |
| `type` | text | 'linkable' \| 'reference' \| 'service' |
| `source_url` | text | Original product URL |
| `notes` | text | |
| `is_current` | bool | Is it still on the build? |
| `replaced_by_part_id` | uuid | Self-ref for part history |
| `created_at` | timestamptz | |

### `posts`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid FK profiles | |
| `build_id` | uuid FK builds | |
| `photos` | text[] | Array of Storage URLs |
| `caption` | text | |
| `tagged_part_ids` | text[] | Parts tagged in this post |
| `linked_products` | jsonb | Array of product tag objects (see below) |
| `like_count` | int | Denormalised |
| `comment_count` | int | Denormalised |
| `view_count` | int | Denormalised |
| `is_pinned` | bool | Pinned to top of build profile |
| `created_at` | timestamptz | |

**`linked_products` JSONB shape:**
```jsonb
[
  {
    "id": "uuid",
    "title": "Akrapovic Slip-On",
    "url": "https://amazon.com/...",
    "affiliateUrl": "https://amazon.com/...?tag=throttlist-20&...",
    "imageUrl": "https://...",
    "trackingId": "tl_abc123_xyz",
    "sourceDomain": "amazon.com",
    "category": "Exhaust"
  }
]
```

### `likes`

| Column | Type |
|---|---|
| `user_id` | uuid |
| `post_id` | uuid |
| `created_at` | timestamptz |

PK: `(user_id, post_id)`

### `comments`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | |
| `post_id` | uuid | |
| `parent_id` | uuid nullable | For replies (not yet surfaced in UI) |
| `body` | text | |
| `likes` | int | |
| `is_pinned` | bool | |
| `created_at` | timestamptz | |

### `follows` (user → user)

| Column | Type |
|---|---|
| `follower_id` | uuid |
| `following_id` | uuid |
| `created_at` | timestamptz |

PK: `(follower_id, following_id)`. Check constraint: `follower_id ≠ following_id`.

### `build_follows` (user → build)

| Column | Type |
|---|---|
| `follower_id` | uuid |
| `build_id` | uuid |
| `created_at` | timestamptz |

### `messages` (DMs)

| Column | Type |
|---|---|
| `id` | uuid PK |
| `sender_id` | uuid |
| `recipient_id` | uuid |
| `body` | text |
| `is_read` | bool |
| `created_at` | timestamptz |

### `product_tags` (affiliate attribution)

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `user_id` | uuid | Who tagged it |
| `build_id` | uuid | Build context |
| `post_id` | uuid | Post context |
| `tracking_id` | text | `tl_{postId}_{nonce}` |
| `product_url` | text | Original URL |
| `affiliate_url` | text | URL with tracking appended |
| `product_title` | text | |
| `product_image_url` | text | |
| `source_domain` | text | e.g. "amazon.com" |
| `category` | text | e.g. "Exhaust" |
| `created_at` | timestamptz | |

### `tag_click_events` (click analytics)

| Column | Type |
|---|---|
| `id` | uuid PK |
| `post_id` | uuid |
| `build_id` | uuid |
| `user_id` | uuid nullable |
| `product_url` | text |
| `created_at` | timestamptz |

### Other tables

| Table | Purpose |
|---|---|
| `views` | Post view events (user_id, post_id, created_at) |
| `support_requests` | User-submitted support tickets |
| `mfa_backup_codes` | TOTP backup codes for 2FA |

### Postgres Functions / RPCs

| Function | Purpose |
|---|---|
| `handle_new_user()` | Trigger: auto-create profile on auth.users INSERT |
| `get_for_you_feed(p_user_id, p_limit)` | Scored personalised feed |
| `get_discover_users(p_limit, p_exclude_user_id)` | Scored user discovery list |
| `increment_build_follower(bid)` | Atomic follower_count++ |
| `decrement_build_follower(bid)` | Atomic follower_count-- |

### Storage Buckets

| Bucket | Contents |
|---|---|
| `posts` | Post photos and user avatars |
| `avatars` | Avatar uploads (some overlap with posts bucket) |
| `builds` | Build cover photos |

---

## Affiliate & Attribution System

### Goal

Every product link in a post becomes a trackable affiliate URL. Revenue source: Amazon Associates (`tag=throttlist-20`). Future: expand to other affiliate networks.

### How it Works

1. **User tags a product** in compose screen via `ProductSheet`:
   - Searches Amazon (or enters URL manually)
   - `lib/affiliateUtils.ts` processes the URL:
     - `isAmazonUrl(url)` — detects amazon.com, amzn.to, etc.
     - `generateTrackingId(postId)` — creates `tl_{postId}_{6-char nonce}`
     - `appendAffiliateTag(url, trackingId)` — appends `tag=throttlist-20&ascsubtag=beta&ref=tl_{trackingId}`

2. **Stored in two places:**
   - `posts.linked_products` JSONB — fast retrieval with post, shown in UI
   - `product_tags` table — analytics/attribution record with full metadata

3. **Click tracking:**
   - `trackTagClick(postId, buildId, userId, productUrl)` inserts into `tag_click_events`
   - Called in `PostCard` when user taps a product tag
   - `tag_click_events` is the source of truth for affiliate analytics

4. **Analytics surface:**
   - `analytics.tsx` (Pro feature) — shows click data to creators
   - `get_discover_users` RPC weights tag clicks ×10 in discovery scoring (see below)

### Constants

```ts
// constants/throttlist.ts
AFFILIATE_TAG = 'tag=throttlist-20&ascsubtag=beta'

// lib/affiliateUtils.ts
function appendAffiliateTag(url, trackingId):
  → url + '&tag=throttlist-20&ascsubtag=beta&ref=tl_' + trackingId
```

---

## Feed Scoring

The For You feed is powered by the `get_for_you_feed` Postgres RPC. Scoring formula (server-side):

```
score = engagement_score
      × recency_decay
      + social_signal
      + content_affinity
      + trending_spike × follow_boost
```

- **engagement_score**: weighted sum of likes, comments, views on the post
- **recency_decay**: exponential falloff based on age
- **social_signal**: boost if viewer follows the build or has mutual followers with creator
- **content_affinity**: match between viewer's followed build types and post's build type
- **trending_spike**: short-window engagement velocity
- **follow_boost**: multiplier for posts from followed builds

Additional context fields returned per post:
- `userFollowsBuild` — bool: does viewer follow this post's build?
- `mutualFollowers` — count of mutual connections with post author

---

## Discovery Scoring

`get_discover_users` RPC scores users for the Discover tab. 14-day rolling window:

| Signal | Weight |
|---|---|
| Tag clicks | ×10 |
| Comments | ×5 |
| New followers | ×3 |
| Likes received | ×2 |
| Post views | ×1 |

Excludes the requesting user. Used on the Discover screen's "People" section.

---

## Authentication & Auth Flow

- **Provider**: Supabase Auth (email + password)
- **2FA**: TOTP via `supabase.auth.mfa.*` — enrol, challenge, verify. Backup codes stored in `mfa_backup_codes` table.
- **Password reset**: Deep-link based. Email sends link to `throttlist://reset-password` (iOS) or `https://throttlist.com/reset-password` (web). `reset-password.tsx` picks up the token from the URL and calls `supabase.auth.updateUser`.
- **Session persistence**: `persistSession: true` in Supabase client; session survives app restart.
- **Auth context** (`lib/auth.tsx`): exposes `{ session, user, loading, signOut }` via React context. `_layout.tsx` wraps the entire app in `<AuthProvider>`.
- **Route guard**: `_layout.tsx` `useEffect` redirects unauthenticated users to `/signup` unless on a PUBLIC_ROUTES path.

**PUBLIC_ROUTES**: `onboarding`, `signup`, `login`, `privacy`, `admin`, `forgot-password`, `reset-password`

---

## iOS / Native Build

### Build Toolchain

| Tool | Version | Notes |
|---|---|---|
| Expo SDK | 54.0.x | |
| React Native | 0.81.5 | |
| EAS CLI | latest (npx) | Always use `npx eas-cli@latest` |
| babel-preset-expo | **54.0.11** | **MUST match SDK 54** — v56 emits class declarations that hermesc rejects |
| CocoaPods | 1.16.2 | Auto-installed by `expo run:ios` |

### Critical Config Files

**`babel.config.js`** — minimal, no custom transform profile:
```js
presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]]
```

**`metro.config.js`** — three resolver overrides required:
1. `@tanstack/react-query` → `build/legacy/index.cjs` (modern build has private class fields hermesc rejects)
2. `@tanstack/query-core` → `build/legacy/index.cjs` (same reason)
3. `@supabase/supabase-js` → `dist/index.cjs` (MJS build uses dynamic `import()` for OpenTelemetry that hermesc can't compile)

Also sets `unstable_conditionNames: ['require']` to prefer CJS in package exports resolution.

### EAS Build Profiles (`eas.json`)

| Profile | Purpose | Notes |
|---|---|---|
| `simulator` | Standalone `.app` for iOS Simulator | No dev client. **Known crash** — see Known Issues. |
| `preview` | Signed `.ipa` for real devices (internal) | |
| `production` | App Store / TestFlight `.ipa` | `autoIncrement: true` |

### Permissions (`app.json`)

```json
"NSCameraUsageDescription": "Throttlist needs camera access to take photos of your build."
"NSPhotoLibraryUsageDescription": "Throttlist needs access to your photos..."
"ITSAppUsesNonExemptEncryption": false
```

Plugins: `expo-router`, `expo-font`, `expo-web-browser`, `expo-camera`, `expo-image-picker`

### App Store

| Field | Value |
|---|---|
| Bundle ID | `com.throttlist.app` |
| EAS Project ID | `2ec04c81-41c4-441a-9aac-8d312aecb7da` |
| Apple Team | `F48FLG5SLS` (JACOB PAUL HOMAN Individual) |
| Distribution cert serial | `441C5A071A84CBA8A5C4C4C5B4F7DC9A` (exp May 2027) |
| Deep link scheme | `throttlist://` |

### Running Locally

```bash
# Web dev server
npx expo start --web

# Web deploy
npx expo export --platform web && vercel --prod --yes

# iOS debug on simulator (works reliably)
cd throttlist-web && npx expo run:ios

# iOS production build
npx eas-cli@latest build --platform ios --profile production

# Submit to TestFlight
npx eas-cli@latest submit --platform ios --latest
```

---

## Key Libraries & Why

| Library | Why |
|---|---|
| `expo-router v6` | File-system routing; works on web + native from one codebase |
| `@tanstack/react-query v5` | Server-state cache; `useQuery`/`useMutation` throughout |
| `@supabase/supabase-js ^2` | Auth + DB + Storage + Realtime |
| `react-native-reanimated ~4.1` | Animations (ThrottlistLogo SVG animation, scroll effects); **requires New Architecture** |
| `expo-camera ~17` | Native camera viewfinder on iOS; web falls back to `MediaDevices` |
| `expo-image-picker ~17` | Gallery access for avatar + post uploads |
| `expo-image ~3` | Optimised image rendering (SDWebImage on iOS) |
| `zustand ^5` | Lightweight global state (used sparingly) |
| `@legendapp/list ^2` | Performant list rendering for feed |
| `react-native-svg 15` | SVG support (ThrottlistLogo, icons) |

---

## Environment Variables

Set in `.env.local` (web) and EAS environment variables (iOS builds):

```
EXPO_PUBLIC_SUPABASE_URL=https://[project].supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_ADMIN_EMAIL=...
EXPO_PUBLIC_ADMIN_PASSWORD=...
```

All `EXPO_PUBLIC_` prefixed variables are inlined at bundle time and safe for client-side use. Do not put service-role keys here.
