// Playground hub: loads the game registry and renders a calm menu.
// Each game is an independent site; we launch it with ?hub=<this url> so the
// game's "Back to Games" button returns here.

import { resolveLang, applyLang, getLang, isValidLang, t } from './i18n.js';

const HUB_URL = location.href.split('?')[0].split('#')[0];

function launchUrl(gameUrl) {
  try {
    const u = new URL(gameUrl, location.href);
    u.searchParams.set('hub', HUB_URL);
    u.searchParams.set('lang', getLang());
    return u.href;
  } catch {
    return gameUrl;
  }
}

// Some game icons are drawn as artwork centered on the twilight plate with a
// margin, so on a tile they read as a small "inner square". This zooms each
// tile's image to crop that padding so the illustration fills the tile —
// detecting the padding per icon (same-origin canvas), so already full-bleed
// icons are left untouched and future games self-correct too.
function autoFillTile(img) {
  const fit = () => {
    const nw = img.naturalWidth;
    const nh = img.naturalHeight;
    if (!nw || !nh) return;
    try {
      const S = 64; // downscale sample — plenty to find the content box.
      const cv = document.createElement('canvas');
      cv.width = S;
      cv.height = S;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, S, S);
      const data = ctx.getImageData(0, 0, S, S).data;
      // The plate padding is the twilight background gradient
      // (rgb 92,120,219 → 56,66,153, top→bottom). Anything that deviates is
      // "content"; find its tight bounding box.
      let minX = S, minY = S, maxX = -1, maxY = -1;
      for (let y = 0; y < S; y++) {
        const r = y / (S - 1);
        const tr = 92 + (56 - 92) * r;
        const tg = 120 + (66 - 120) * r;
        const tb = 219 + (153 - 219) * r;
        for (let x = 0; x < S; x++) {
          const i = (y * S + x) * 4;
          const d = Math.abs(data[i] - tr) + Math.abs(data[i + 1] - tg) + Math.abs(data[i + 2] - tb);
          if (d > 40) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
          }
        }
      }
      if (maxX < 0) return; // all background — nothing to do.
      const cw = (maxX - minX + 1) / S;
      const ch = (maxY - minY + 1) / S;
      const cx = (minX + maxX + 1) / 2 / S;
      const cy = (minY + maxY + 1) / 2 / S;
      const span = (cw + ch) / 2; // balanced fill for ~square artwork.
      if (span > 0.92) return; // already fills the tile — leave it be.
      const s = Math.min(1 / span, 1.6);
      const tx = (0.5 - s * cx) * 100;
      const ty = (0.5 - s * cy) * 100;
      img.style.transformOrigin = '0 0';
      img.style.transform = `translate(${tx}%, ${ty}%) scale(${s})`;
    } catch {
      // Cross-origin (e.g. local dev against remote icons) taints the canvas;
      // leave the icon at its natural framing.
    }
  };
  if (img.complete && img.naturalWidth) fit();
  else img.addEventListener('load', fit, { once: true });
}

function card(game) {
  const label = game.name || game.id;
  const a = document.createElement('a');
  a.className = 'game-tile';
  a.href = launchUrl(game.url);
  a.setAttribute('aria-label', label);
  a.title = label;
  a.addEventListener('click', (e) => {
    // Let modified / non-primary clicks fall through (open in new tab, etc.).
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    e.preventDefault();
    openPlayer(game);
  });

  const icon = document.createElement('div');
  icon.className = 'game-icon';
  if (game.image) {
    const img = document.createElement('img');
    img.className = 'game-icon-img';
    img.src = game.image;
    img.alt = '';
    img.loading = 'lazy';
    icon.append(img);
    autoFillTile(img);
  } else {
    if (game.color) icon.style.background = game.color;
    icon.textContent = game.icon || '🎮';
  }

  a.append(icon);
  return a;
}

async function loadGames() {
  const grid = document.getElementById('game-grid');
  const empty = document.getElementById('hub-empty');
  try {
    const resp = await fetch('./games.json', { cache: 'no-cache' });
    const data = await resp.json();
    const games = Array.isArray(data.games) ? data.games : [];
    if (games.length === 0) {
      empty.textContent = t('noGames');
      empty.hidden = false;
      return;
    }
    // Tiles: 2 columns (≈ 1/4 of the page) for up to 4 games, then 3 columns
    // (≈ 1/9, the smallest) beyond that. --tracks centers a partial last row.
    const cols = games.length <= 4 ? 2 : 3;
    const tracks = Math.min(games.length, cols);
    const root = document.documentElement.style;
    root.setProperty('--cols', String(cols));
    root.setProperty('--tracks', String(tracks));
    const frag = document.createDocumentFragment();
    for (const game of games) frag.append(card(game));
    grid.append(frag);
  } catch {
    hubEmptyError = true;
    empty.textContent = t('couldNotLoad');
    empty.hidden = false;
  }
}

// ---- In-app player: run games in an iframe so an installed hub stays
// standalone (no browser address bar). Same-origin, so this is seamless.
const player = document.getElementById('player');
const playerFrame = document.getElementById('player-frame');
const playerTitle = document.getElementById('player-title');
const playerBack = document.getElementById('player-back');
let playerOpen = false;

function openPlayer(game) {
  playerTitle.textContent = game.name || '';
  playerFrame.src = launchUrl(game.url);
  player.hidden = false;
  document.documentElement.classList.add('playing');
  playerOpen = true;
  // A history entry lets the phone's back gesture/button close the game
  // instead of exiting the app.
  history.pushState({ player: true }, '');
}

function closePlayer() {
  if (!playerOpen) return;
  playerOpen = false;
  player.hidden = true;
  playerFrame.src = 'about:blank';
  document.documentElement.classList.remove('playing');
}

playerBack.addEventListener('click', () => {
  if (history.state && history.state.player) history.back();
  else closePlayer();
});

window.addEventListener('popstate', () => {
  if (playerOpen) closePlayer();
});

// A game embedded in the player can ask to return to the menu.
window.addEventListener('message', (e) => {
  if (e.origin !== location.origin) return;
  if (e.data && e.data.type === 'playground:back') playerBack.click();
});

// ---- Localization (see i18n.js). Hub strings + aria-labels; tile names
// (game names) stay as authored. `dir`/`lang` are set by applyLang.
let hubEmptyError = false;

function localizeHub() {
  document.getElementById('settings-title').textContent = t('settings');
  document.getElementById('settings-sub').textContent = t('appliesToEvery');
  document.getElementById('label-sound').textContent = t('sound');
  document.getElementById('label-haptics').textContent = t('vibration');
  document.getElementById('label-language').textContent = t('language');
  document.getElementById('lang-en').textContent = t('english');
  document.getElementById('lang-he').textContent = t('hebrew');
  document.getElementById('btn-close').textContent = t('close');
  document.getElementById('player-back-label').textContent = t('games');

  const gear = document.getElementById('hub-gear');
  gear.setAttribute('aria-label', t('settings'));
  document.querySelector('.panel[role="dialog"]').setAttribute('aria-label', t('settingsAria'));
  playerBack.setAttribute('aria-label', t('backToGames'));

  const empty = document.getElementById('hub-empty');
  if (!empty.hidden) empty.textContent = hubEmptyError ? t('couldNotLoad') : t('noGames');

  // Reflect active language in the chooser.
  document.getElementById('lang-en').classList.toggle('active', getLang() === 'en');
  document.getElementById('lang-he').classList.toggle('active', getLang() === 'he');
}

// Resolve + apply the locale before rendering anything.
applyLang(resolveLang());
localizeHub();

loadGames();

// ---- Global settings (shared with every game via same-origin localStorage).
// Games read `soundEnabled` / `hapticsEnabled` live, so toggles here apply to
// the running game on its next sound — no reload needed.
const SETTINGS_KEYS = { sound: 'soundEnabled', haptics: 'hapticsEnabled' };
const readBool = (key, fallback) => {
  const v = localStorage.getItem(key);
  return v === null ? fallback : v === 'true';
};

const settingsOverlay = document.getElementById('settings-overlay');
const hubGear = document.getElementById('hub-gear');
const toggleSound = document.getElementById('toggle-sound');
const toggleHaptics = document.getElementById('toggle-haptics');

function syncSettingsUi() {
  toggleSound.classList.toggle('on', readBool(SETTINGS_KEYS.sound, true));
  toggleHaptics.classList.toggle('on', readBool(SETTINGS_KEYS.haptics, true));
}

hubGear.addEventListener('click', () => {
  syncSettingsUi();
  settingsOverlay.hidden = false;
});

function closeSettings() { settingsOverlay.hidden = true; }

toggleSound.addEventListener('click', () => {
  const next = !readBool(SETTINGS_KEYS.sound, true);
  localStorage.setItem(SETTINGS_KEYS.sound, String(next));
  toggleSound.classList.toggle('on', next);
});

toggleHaptics.addEventListener('click', () => {
  const next = !readBool(SETTINGS_KEYS.haptics, true);
  localStorage.setItem(SETTINGS_KEYS.haptics, String(next));
  toggleHaptics.classList.toggle('on', next);
});

// ---- Language chooser: persist explicit choice, apply to the hub live, and
// tell an open game (in the player iframe) to re-locale in place.
const langChooser = document.getElementById('lang-chooser');
langChooser.addEventListener('click', (e) => {
  const btn = e.target.closest('.seg-btn');
  if (!btn) return;
  const code = btn.dataset.lang;
  if (!isValidLang(code) || code === getLang()) return;
  applyLang(code, true); // persist explicit choice to localStorage 'lang'
  localizeHub();
  // Update the launched game's URL param for the next launch is automatic
  // (launchUrl reads getLang()). Notify a currently-open game immediately.
  if (playerOpen && playerFrame.contentWindow) {
    playerFrame.contentWindow.postMessage(
      { type: 'playground:lang', lang: code }, location.origin,
    );
  }
});

document.getElementById('btn-close').addEventListener('click', closeSettings);
settingsOverlay.querySelector('[data-dismiss="settings"]').addEventListener('click', closeSettings);

if ('serviceWorker' in navigator) {
  // Robust self-update: promote a waiting worker, reload once the new worker
  // takes control, and proactively check for updates on load + when the tab
  // becomes visible again — so users actually receive new hub versions.
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').then((reg) => {
      const promote = () => {
        if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      };
      promote();
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) promote();
        });
      });
      const checkForUpdate = () => reg.update().catch(() => {});
      checkForUpdate();
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') checkForUpdate();
      });
    }).catch(() => {});
  });
}
