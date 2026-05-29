# Throttlist — Claude Instructions

## Active production repo

This directory (`~/Desktop/throttlist-web`) is the **only active production project**.

- GitHub: `jphoman/throttlist-web`
- Deploys to: `throttlist.com` via Vercel (auto-deploy on push to `main`)
- Repo type: **full Expo (SDK 54) Router source app** — `app/`, `components/`, `lib/`,
  `package.json`, etc. are committed source. (This is NOT a static-output repo; an
  earlier version of this file incorrectly described it that way.)

## Before every change

Confirm the working directory is `~/Desktop/throttlist-web`.
Never operate in `~/Desktop/throttlist-community-platform` — that repo is inactive and must not be touched.

## Targets

- **Web** — Vercel runs the build in `vercel.json`
  (`npx expo export --platform web && node scripts/post-build.js`, output `dist/`).
- **iOS / TestFlight** — bundle id `com.throttlist.app`, built via EAS
  (`eas.json` profiles). See `TESTFLIGHT.md` for the full build/submit runbook.

## Deployment workflow (web)

A **local commit does not deploy** — only pushing to `main` does.

1. Make changes to the Expo source in this repo.
2. Commit and push to `main` on `jphoman/throttlist-web`.
3. Vercel auto-builds (`expo export`) and deploys to `throttlist.com`.

⚠️ Because push = deploy, be deliberate about what you push. iOS/EAS builds only
require a local commit, so you can build for TestFlight without publishing the web app.

## Notes

- Camera capture (`app/(tabs)/capture.tsx`) is web-only (`getUserMedia`); on native
  iOS the shutter falls back to the photo-library picker.
- `EXPO_PUBLIC_*` env vars are embedded in the client bundle at build time when
  referenced in code — keep secrets out of them.
