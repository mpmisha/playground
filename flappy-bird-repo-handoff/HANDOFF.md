# ⚠️ Temporary handoff — not part of the hub

This folder is **not** part of the Playground hub. It's a temporary staging
location for the complete, tested **Flappy Bird** game, built to go into its
own repo at **github.com/mpmisha/Flappy-bird** (already created, currently
only has a README).

## Why this is here instead of already pushed

This session's GitHub App / Copilot coding-agent installation only has write
access to `mpmisha/playground` (this repo), scoped to this PR's branch. It
does **not** have write access to `mpmisha/Flappy-bird`, so the game could be
built and validated here, but could not be pushed to its real repo directly.

## What to do

1. Copy this folder's contents (everything except this `HANDOFF.md`) into a
   local clone of `mpmisha/Flappy-bird`, at the **repo root**:
   ```bash
   git clone https://github.com/mpmisha/Flappy-bird
   cd Flappy-bird
   # copy everything from flappy-bird-repo-handoff/ (except HANDOFF.md) here
   git add -A
   git commit -m "flappy-bird: add calm, kid-friendly Flappy Bird PWA"
   git push origin main
   ```
2. Enable Pages (best-effort, `pages.yml` also turns it on via
   `actions/configure-pages@v5` with `enablement: true`):
   ```bash
   gh api -X POST repos/mpmisha/Flappy-bird/pages -f build_type=workflow
   ```
3. Wait for the "Deploy to GitHub Pages" Action to go green, then confirm:
   ```bash
   curl -sI https://mpmisha.github.io/Flappy-bird/
   ```
4. Once live, delete this `flappy-bird-repo-handoff/` folder from the
   `playground` repo (it should never be merged into `main` — the hub repo
   must stay game-code-free) before merging this PR. The `games.json` entry
   added in this same PR already points at the final live URLs, so once step 3
   succeeds the hub tile will work immediately.

## What's included

A complete, self-contained static PWA:
- Calm, kid-friendly Flappy Bird gameplay (tap/click/space to flap), tuned
  for smaller kids — big forgiving gap, soft colors, no scary game-over.
- Full Playground design system (Baloo 2, `#20264f` twilight palette, shared
  panel/toggle/button UI kit, beveled candy-block visuals for the bird/pipes
  via the shared `skins.js` palettes).
- English + Hebrew (RTL) i18n, following the hub's shared `?lang=`/postMessage
  contract.
- Byte-identical `js/telemetry.js` (anonymous, privacy-first usage counters).
- Offline-first PWA: `manifest.webmanifest` + `service-worker.js` precaching
  every shipped file.
- Hub back-button handshake (`?hub=`, `postMessage({type:'playground:back'})`).
- `tools/generate_icon.py` (Pillow) regenerates the app icon art from scratch
  if needed.

Verified locally in this session: `node --check` passed on every JS module,
`python3 -m json.tool` validated the manifest, and every asset referenced by
`index.html`/`service-worker.js` was confirmed servable (200) via
`python3 -m http.server`.
