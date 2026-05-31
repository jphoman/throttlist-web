# Throttlist — Project Status

> Last updated: 2026-05-30  
> Current build: iOS 1.0.0 (4) on TestFlight · Web live at throttlist.com

---

## What's Working End-to-End

### Core Social Loop
- ✅ Sign up / log in / password reset (email + deep link on iOS)
- ✅ Onboarding flow
- ✅ Create a Build (10 categories, 2-step wizard: type → details)
- ✅ Post creation: multi-photo, caption, product tag, build selector
- ✅ Feed: For You (scored RPC), Most Recent, Following (followed builds only)
- ✅ Post card: photo carousel, like, comment sheet, product tag tap → affiliate URL + click tracked
- ✅ Discover: scored users grid, builds grid, posts grid, search
- ✅ Build profile page (cover photo, posts, pinned post, parts list)
- ✅ User profile page (public)
- ✅ Own profile (edit inline, reorder builds, Top 8 picker, pinned posts)
- ✅ Follow / unfollow users and builds (with optimistic UI)
- ✅ Direct messages: inbox + thread + send
- ✅ Notifications: likes on own posts, comments on own posts, new build followers
- ✅ Settings: edit profile, avatar upload (native image picker), change password, 2FA (TOTP enrol + verify), sign out

### iOS Specific
- ✅ Native camera viewfinder on capture screen (`expo-camera`)
- ✅ Shutter takes photo → compose screen
- ✅ Gallery picker → compose screen
- ✅ Camera permission request flow
- ✅ Auth deep link (`throttlist://reset-password`)
- ✅ Tab bar uses expo-router `usePathname()` (not `window.location`)
- ✅ TestFlight live (build 4, 2026-05-30)

### Web Specific
- ✅ Camera uses `MediaDevices.getUserMedia` with rear-camera preference
- ✅ File input for gallery (Safari-safe `<label htmlFor>` pattern)
- ✅ Deployed to throttlist.com via Vercel

---

## What's Partially Built / Stubbed

### Store Items (`app/store-items.tsx`)
- UI is complete: item cards, add/remove flow, "Add from Meta Shop" search
- **Data is mocked**: reads from `lib/data.ts` `getUserStoreItems()`/`setUserStoreItems()` (in-memory, resets on refresh)
- "Add from Meta Shop" results are hardcoded `MOCK_META_RESULTS` strings
- **TODO**: Replace with real Supabase table for store items; wire Meta Shop search to real API or approved product catalogue

### Settings: Export & Delete Data
- UI shows confirmation Alert dialogs
- **No backend implementation** — neither actually exports data nor deletes anything
- **TODO**: Export → generate JSON of user's posts/builds → download. Delete → call Supabase to cascade-delete profile.

### Settings: Reorder Profile
- Drag-to-reorder UI works locally in React state
- `saveReorderProfile()` invalidates the query cache but does **not write to DB**
- **TODO**: Persist reordered `top_build_ids` array to `profiles.top_build_ids` via `updateTopBuildIds()`

### Settings: "Show Store" Toggle
- Toggle state is local React state only
- **TODO**: Persist to `profiles.show_store` (column doesn't exist yet) or similar flag

### Tag Browsing (`app/tag/[name].tsx`)
- Route exists and is navigable
- Tag pills in Discover show hardcoded static counts
- **TODO**: Add `tags` or `post_tags` table; surface real tag-based browsing

### Pro / Stripe (`app/pro.tsx`, `app/pro-signup.tsx`, `app/membership.tsx`)
- Marketing screen (`pro.tsx`): fully built, $5/mo pitch, animated ProBadge, feature list
- `pro-signup.tsx`: screen exists, Stripe integration status unknown/incomplete
- `membership.tsx`: screen exists
- **TODO**: Complete Stripe checkout flow; webhook to flip `profiles.is_pro = true`; handle cancellation

### Analytics (`app/analytics.tsx`)
- Screen exists in the Pro section
- `product_tags` and `tag_click_events` tables are live and recording data
- UI content of analytics screen not fully audited — assumed partially stubbed
- **TODO**: Wire to real aggregation queries over `tag_click_events`

### Pro Store Items Feature
- Settings "Store Items" row navigates to `store-items.tsx` (visible to Pro users only)
- Entire store items feature is mock data (see above)

### Comment Replies
- `comments` table has `parent_id` column
- `addComment()` accepts optional `parentId`
- **UI does not surface replies** — comment sheet only shows top-level comments
- **TODO**: Implement threaded reply UI in `CommentSheet`

---

## Known Issues

### iOS: EAS Simulator Standalone Build Crashes
- **Symptom**: `EXC_CRASH (SIGABRT)` on `com.meta.react.turbomodulemanager.queue` immediately on launch
- **Affected**: EAS builds with `--profile simulator` (standalone `.app`)
- **Not affected**: Local debug builds (`npx expo run:ios`), production device builds (TestFlight)
- **Suspected cause**: `react-native-reanimated` TurboModule initialization in a standalone (non-dev-client) Hermes environment. Production device builds don't hit it.
- **Workaround**: Use `npx expo run:ios` for simulator testing; use TestFlight for real device testing
- **TODO**: Investigate reanimated worklet init sequence in standalone simulator builds

### Web: `window.location` Guard
- Fixed this session. `TabBar` previously used `window.location.pathname` directly, crashing on native because `window.location` is undefined in Hermes. Now uses `usePathname()` from expo-router.

### `app.json` Build Number vs Native
- `app.json` `ios.buildNumber` is "4" but EAS ignores this when an `ios/` directory exists (from `expo run:ios` prebuild). EAS reads the native value instead.
- **TODO**: Either remove the `ios/` directory from the repo (rely on EAS prebuild) or keep it in sync with `eas.json` `autoIncrement`.

### `ios/` Directory in Repo
- `expo run:ios` generated an `ios/` native directory. This is committed to the repo.
- This causes EAS to read native values (Info.plist, Podfile) rather than `app.json` for some fields, and silently ignores `app.json` `ios.bundleIdentifier`.
- **TODO**: Decide: keep `ios/` (full control, manual sync) or add to `.gitignore` and regenerate via `npx expo prebuild --clean` each build.

---

## Build History (iOS)

| Build | Date | Profile | Result | Notes |
|---|---|---|---|---|
| 1.0.0 (1) | 2026-05-28 | production | ✅ Submitted | First TestFlight upload |
| 1.0.0 (2) | 2026-05-29 | production | ✅ Submitted | Duplicate (double-click) |
| 1.0.0 (3) | 2026-05-29 | production | ✅ Submitted | Fixed hermesc/babel issues |
| 1.0.0 (4) | 2026-05-30 | production | ✅ Live | Added expo-camera native viewfinder |

---

## Immediate Next Steps (Prioritised)

1. **Test capture → compose → post flow on real device** — confirm camera + photo upload works end-to-end on TestFlight build 4
2. **Fix Store Items** — wire to Supabase table instead of mock data
3. **Pro / Stripe** — complete checkout flow and `is_pro` webhook
4. **Settings: Export & Delete** — implement backend for these GDPR-adjacent features
5. **Persist profile reorder** — one-line fix: call `updateTopBuildIds` in `saveReorderProfile`
6. **Resolve `ios/` directory strategy** — commit or gitignore
7. **Fix EAS simulator crash** — investigate reanimated init in standalone builds (lower priority since TestFlight works)

---

## Session Accomplishments (2026-05-29 → 2026-05-30)

### Web
- Deleted `/terms` route; `/privacy` is canonical
- Settings: Store section standalone for Pro users; back button always goes to profile tab; Terms/Privacy use in-app router
- TabBar: replaced `window.location` with expo-router `usePathname()` (fixes crash on native)
- `_layout.tsx`: removed `terms` from Stack and PUBLIC_ROUTES

### iOS Build Infrastructure
- Diagnosed and fixed 10+ hermesc compilation failures:
  - **Root cause**: `babel-preset-expo@56` installed for SDK 54 — v56 emits native class declarations inside Metro module factory functions that hermesc (RN 0.81.5) cannot compile. Downgraded to `babel-preset-expo@54.0.11`.
  - `metro.config.js`: added CJS overrides for `@tanstack/react-query`, `@tanstack/query-core` (private class fields in modern build), and `@supabase/supabase-js` (dynamic `import()` for OTEL in MJS build)
- Set up EAS credentials (distribution cert + provisioning profile)
- Created app record in App Store Connect with bundle ID `com.throttlist.app`
- Shipped 4 production builds to TestFlight; user able to log in and use core features on real device

### Camera
- Installed `expo-camera`, added `NSCameraUsageDescription`
- Rewrote `capture.tsx`: `CameraView` on native (live viewfinder + `takePictureAsync`), `MediaDevices` stream on web
- Handles permission request/denied states gracefully

---

## Tech Debt Log

| Item | Priority | Notes |
|---|---|---|
| Mock data in `lib/data.ts` | High | Used by store-items and seeding; should not be in production paths |
| `ios/` directory in git | Medium | Causes `app.json` ios fields to be ignored by EAS |
| Comment replies not surfaced | Medium | Backend supports it; UI doesn't |
| Tag browsing not backed by DB | Medium | `tag/[name].tsx` exists but no tags table |
| Analytics screen content | Medium | Tables recording data; UI not audited |
| Pro/Stripe incomplete | High | Core monetisation not functional |
| Export/Delete data stubs | Medium | Show dialog but do nothing |
| Profile reorder not persisted | Low | One-line fix |
| Show Store toggle not persisted | Low | One-line fix |
