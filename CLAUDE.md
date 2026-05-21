# Throttlist Web — Claude Instructions

## Active production repo

This directory (`~/Desktop/throttlist-web`) is the **only active production project**.

- GitHub: `jphoman/throttlist-web`
- Deploys to: `throttlist.com` via Vercel (auto-deploy on push to `main`)
- Repo type: **static build output** — the built files are committed directly here, not source code

## Before every change

Confirm the working directory is `~/Desktop/throttlist-web`.
Never operate in `~/Desktop/throttlist-community-platform` — that repo is inactive and must not be touched.

## Deployment workflow

1. Build the Expo web app from the source project (outputs static files)
2. Copy built files into this repo
3. Commit and push to `main` on `jphoman/throttlist-web`
4. Vercel auto-deploys to `throttlist.com`

## What's in this repo

Static output from `npx expo export --platform web`:
- `index.html` — app shell
- `_expo/` — JS bundles and assets
- `avatars/` — user avatar images
- `builds/` — build/post photo assets
- `CNAME` — `throttlist.com` (do not modify)
- `_redirects` — SPA fallback routing
