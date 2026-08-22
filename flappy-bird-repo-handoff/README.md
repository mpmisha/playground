# Flappy Bird 🐦

A calm, kid-friendly Flappy-Bird-style game built for the [Playground](https://mpmisha.github.io/playground/)
hub. Tap, click, or press space to flap through the gaps.

- No ads, no accounts, no purchases, no tracking beyond anonymous, aggregate
  usage counts (see `js/telemetry.js`).
- No timers, no streak pressure, no scary game-over screen — a round ends
  softly with a friendly "Oops!" and a big "Play Again" button.
- Works fully offline once installed (a Progressive Web App), in portrait,
  with big touch targets tuned for smaller kids.
- English and Hebrew (right-to-left) supported; language follows the
  Playground hub's setting automatically.

## Play it

Live at **https://mpmisha.github.io/Flappy-bird/**

## Add to Home Screen

Open the live link on a phone, then use your browser's "Add to Home Screen"
(iOS Safari) or "Install app" (Android Chrome) option. It installs as a
standalone, offline-capable app.

## Local development

This is a plain static site — no build step required.

```bash
python3 -m http.server 8080
```

Then open http://localhost:8080/ in a browser.

## Structure

- `index.html` / `styles.css` — shared Playground design system (Baloo 2 font,
  twilight palette, panel/toggle/button UI kit).
- `js/game.js` — the game engine + canvas renderer (physics, pipes, scoring).
- `js/skins.js`, `js/color.js` — shared candy-block color palettes, reused for
  the pipe and bird artwork.
- `js/audio.js` — gentle synthesized sound effects (Web Audio API).
- `js/storage.js` — settings + best-score persistence (localStorage only).
- `js/i18n.js` — English/Hebrew localization.
- `js/telemetry.js` — anonymous, privacy-first usage counters (byte-identical
  across every Playground game).
- `manifest.webmanifest` / `service-worker.js` — installable, offline-first PWA.
