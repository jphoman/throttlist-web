# Throttlist — TestFlight Build Runbook

This is the iOS/TestFlight guide for the Throttlist Expo app (same repo that ships
the web app to throttlist.com). The recommended path is **EAS Build + EAS Submit**
(cloud build — no manual Xcode archiving needed). A manual Xcode/Transporter
fallback is at the bottom.

---

## 0. What's already configured (done in-repo)

- `app.json`
  - `ios.bundleIdentifier` = `com.throttlist.app` (also `android.package`)
  - `ios.buildNumber` = `1`
  - `ios.infoPlist.NSPhotoLibraryUsageDescription` (photo picker is used)
  - `ios.infoPlist.ITSAppUsesNonExemptEncryption` = `false` (skips export-compliance prompt each upload)
  - splash `backgroundColor` = `#ED1F24` (brand red)
- `eas.json` — `development` / `preview` / `production` build profiles + an iOS submit profile
- Icons regenerated from `ThrottlistIcon.png`:
  - `assets/images/icon.png` — 1024×1024, **no alpha** (App Store requirement)
  - `adaptive-icon.png`, `splash-icon.png`, `favicon.png`

**Still placeholder:** `app.json` → `extra.eas.projectId` is `your-project-id-here`.
`eas init` (step 2) fills this automatically.

---

## 1. Prerequisites

- Apple Developer Program membership (you have this).
- An Expo account — you'll create one during `eas login` (free).
- `eas-cli` — no global install needed; commands below use `npx eas`.

---

## 2. Build & submit with EAS (recommended)

Run all commands from `~/Desktop/throttlist-web`.

```bash
# 2.1 Log in / create your Expo account
npx eas login

# 2.2 Link this project to EAS (writes a real extra.eas.projectId into app.json)
npx eas init

# 2.3 Commit the iOS config so the cloud build includes it.
#     A LOCAL commit is enough — you do NOT have to push.
#     (Pushing to main triggers the throttlist.com web deploy — see warning below.)
git add app.json eas.json assets/images/icon.png assets/images/adaptive-icon.png \
        assets/images/splash-icon.png assets/images/favicon.png TESTFLIGHT.md
git commit -m "Add iOS build config for TestFlight"

# 2.4 Cloud build a release .ipa. EAS will offer to generate your
#     Distribution certificate + provisioning profile automatically — say yes.
npx eas build --platform ios --profile production

# 2.5 Upload the finished build to App Store Connect / TestFlight.
#     It will prompt for the values listed in step 3 the first time.
npx eas submit --platform ios --profile production --latest
```

`eas build` runs ~10–20 min in the cloud and prints a build URL you can watch.

### ⚠️ Web-deploy warning
This repo auto-deploys to **throttlist.com via Vercel on push to `main`**. The
iOS config changes are safe for web, but the new `icon.png`/`favicon.png` would
also become the live web favicon if you push. The EAS build only needs a **local
commit**, so you can build for TestFlight without pushing. Push only when you're
ready for the web side too. Also note your working tree has unrelated in-progress
edits — commit only the files listed in 2.3 unless you intend to ship the rest.

---

## 3. Values `eas submit` will ask for (gather these first)

| Prompt | Where to find it |
|---|---|
| **Apple ID** (email) | Your Apple Developer login email. |
| **App Store Connect App ID** (`ascAppId`) | Create the app record first (step 4), then App Store Connect → your app → **App Information → General Information → Apple ID** (a numeric value). |
| **Apple Team ID** | developer.apple.com → **Membership** → Team ID (10-char). |

You can also pre-fill these in `eas.json` under `submit.production.ios`
(`appleId`, `ascAppId`, `appleTeamId`) to skip the prompts on future submits.

---

## 4. Create the app in App Store Connect (one-time, before first submit)

1. https://appstoreconnect.apple.com → **Apps → +  → New App**
2. Platform **iOS**; Name **Throttlist**; Primary language; SKU (any unique string,
   e.g. `throttlist-ios`).
3. **Bundle ID:** select `com.throttlist.app`. If it's not in the list, register it
   first at developer.apple.com → Certificates, IDs & Profiles → **Identifiers → +**.
4. After the build finishes processing, set **App Privacy** and the
   **Privacy Policy URL**: `https://throttlist.com/privacy`
   (⚠️ confirm this page actually resolves before adding external testers).

---

## 5. Configure TestFlight

1. App Store Connect → your app → **TestFlight** tab.
2. Wait for the uploaded build to finish **Processing** (5–15 min).
3. **Internal testers** (up to 100, no review): **Internal Testing → +**, add testers
   by Apple ID email, assign the build. They get an email + Apple's TestFlight app.
4. **External testers** (up to 10,000, requires a quick Beta App Review):
   create a group, add the build, fill **Test Information** (below), submit for
   review, then share the **public TestFlight link** the group generates.

### Sharing the link with testers
- Internal: testers accept the email invite, install **TestFlight** from the App
  Store, and the build appears there.
- External: send them the public link (e.g. `https://testflight.apple.com/join/XXXXXXXX`).
  They install TestFlight, open the link, and tap Install.

---

## 6. Sample test notes (paste into TestFlight "What to Test")

```
Throttlist beta build 1.0.0 (1)

Thanks for testing! Please try:
• Sign up / log in (password must be 12+ chars).
• Set up and log in with 2FA.
• Browse your feed — posts from people you follow should appear.
• Create a post: pick a photo from your library, tag a build, add product/affiliate links.
• Open the Discover tab and a few user profiles.
• Check the Alerts tab.

Known limitations in this build:
• The in-app "capture" tab opens your photo library (live camera preview is web-only for now).

Please report: anything that crashes, looks broken, or behaves unexpectedly —
include your device model and iOS version.
```

---

## 7. Pre-flight checklist (verify before inviting testers)

- [ ] `eas build` finished without errors
- [ ] Build shows up and finished Processing in App Store Connect
- [ ] App icon renders correctly (red bolt, no transparent edges)
- [ ] App launches past the splash screen
- [ ] Supabase env vars present (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`) and point at the intended (prod?) project
- [ ] Password validation works (12+ chars, requirements shown)
- [ ] 2FA enrollment + login tested
- [ ] Feed shows posts from followed users
- [ ] Photo picker → product tagging + affiliate links work
- [ ] Privacy Policy URL resolves (`https://throttlist.com/privacy`)
- [ ] Version (1.0.0) / build number (1) correct

---

## 8. Notes & follow-ups (not blockers)

- **Live camera on iOS:** `app/(tabs)/capture.tsx` uses the browser `getUserMedia`
  API, which is web-only. On iOS the shutter falls back to the photo-library picker.
  To get a real native camera, add `expo-camera` (or `ImagePicker.launchCameraAsync`)
  and re-add `NSCameraUsageDescription` to `ios.infoPlist`.
- **Secrets:** `EXPO_PUBLIC_ADMIN_PASSWORD` in `.env.local` is **unused** (not
  referenced in code) so it is NOT embedded in the bundle — safe to delete for
  hygiene. `EXPO_PUBLIC_ADMIN_EMAIL` **is** referenced, so it gets embedded in the
  app bundle (this is already true on the web build). Consider moving admin login
  off a client-embedded email if that's a concern.
- **Unused native deps:** `expo-location` / `expo-av` are installed but not called;
  no permission strings were added for them. Add the matching `infoPlist` keys if
  you start using them.

---

## Appendix — Manual Xcode + Transporter (only if not using EAS)

1. `npx expo prebuild --platform ios` to generate the native `ios/` project.
2. Open `ios/Throttlist.xcworkspace` in Xcode.
3. Signing & Capabilities → select your Team; bundle id `com.throttlist.app`.
4. Set the run destination to **Any iOS Device (arm64)**.
5. **Product → Archive**.
6. In the Organizer: **Distribute App → App Store Connect → Export** to produce a
   `.ipa`, or **Upload** to send it directly.
7. If you exported a `.ipa`, open the **Transporter** app (Mac App Store), sign in
   with your Apple ID, drag in the `.ipa`, and click **Deliver**.
8. Continue from step 5 (TestFlight) above.
