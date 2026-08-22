import './telemetry.js';
// Entry point: wires the DOM HUD/overlays to the canvas FlappyGame.
import { FlappyGame } from './game.js';
import { SettingsStore } from './storage.js';
import { I18n } from './i18n.js';

// Resolve + apply the platform language before anything renders.
I18n.init();

const $ = (id) => document.getElementById(id);

// Apply all static (non-dynamic) strings from the active locale. Dynamic ones
// (best score, game-over title) are set where they render.
function applyStaticTranslations() {
  for (const el of document.querySelectorAll('[data-i18n]')) {
    el.textContent = I18n.t(el.getAttribute('data-i18n'));
  }
  for (const el of document.querySelectorAll('[data-i18n-aria]')) {
    el.setAttribute('aria-label', I18n.t(el.getAttribute('data-i18n-aria')));
  }
}

const canvas = $('game');
const bestBadge = $('best-badge');
const hudScoreEl = $('hud-score');

function pulseScore() {
  hudScoreEl.classList.remove('pulse');
  // eslint-disable-next-line no-void
  void hudScoreEl.offsetWidth;
  hudScoreEl.classList.add('pulse');
}
function pulseBest() {
  bestBadge.classList.remove('celebrate');
  // eslint-disable-next-line no-void
  void bestBadge.offsetWidth;
  bestBadge.classList.add('celebrate');
}

const dom = {
  hudScore: hudScoreEl,
  hudBest: $('hud-best'),
  pulseScore,
  pulseBest,
  onGameOver: openGameOver,
};

const game = new FlappyGame(canvas, dom);

// Optional end-to-end test hook (only when explicitly requested via ?e2e=1).
if (new URLSearchParams(location.search).get('e2e') === '1') {
  window.__game = game;
}

// Gear button.
$('gear').addEventListener('click', () => {
  game.sound.unlock();
  game.sound.play('button');
  openSettings();
});

// ---- Settings overlay ----

const settingsOverlay = $('settings-overlay');
const settingsBest = $('settings-best');
const difficultySeg = $('difficulty-seg');
const toggleSound = $('toggle-sound');
const toggleHaptics = $('toggle-haptics');
const resetBtn = $('btn-reset-best');
let resetArmed = false;
let resetTimer = null;

function syncSettingsUi() {
  settingsBest.textContent = I18n.t('bestScoreLabel', { n: game.bestScore });
  for (const btn of difficultySeg.querySelectorAll('button')) {
    btn.classList.toggle('active', btn.dataset.difficulty === game.difficultyKey);
  }
  toggleSound.classList.toggle('on', SettingsStore.isSoundEnabled);
  toggleHaptics.classList.toggle('on', SettingsStore.areHapticsEnabled);
  disarmReset();
}

function disarmReset() {
  resetArmed = false;
  if (resetTimer) { clearTimeout(resetTimer); resetTimer = null; }
  resetBtn.textContent = I18n.t('resetBest');
}

function openSettings() {
  syncSettingsUi();
  settingsOverlay.hidden = false;
}

function closeSettings() {
  settingsOverlay.hidden = true;
  disarmReset();
}

difficultySeg.addEventListener('click', (e) => {
  const btn = e.target.closest('button');
  if (!btn) return;
  game.sound.play('button');
  game.changeDifficulty(btn.dataset.difficulty);
  syncSettingsUi();
});

toggleSound.addEventListener('click', () => {
  SettingsStore.isSoundEnabled = !SettingsStore.isSoundEnabled;
  toggleSound.classList.toggle('on', SettingsStore.isSoundEnabled);
  game.sound.play('button');
});

toggleHaptics.addEventListener('click', () => {
  SettingsStore.areHapticsEnabled = !SettingsStore.areHapticsEnabled;
  toggleHaptics.classList.toggle('on', SettingsStore.areHapticsEnabled);
  game.haptics.flap();
});

$('btn-new-game').addEventListener('click', () => {
  game.sound.play('button');
  closeSettings();
  game.startNewGame();
});

// Reset requires a confirming second tap.
resetBtn.addEventListener('click', () => {
  game.sound.play('button');
  if (!resetArmed) {
    resetArmed = true;
    resetBtn.textContent = I18n.t('resetConfirm');
    resetTimer = setTimeout(disarmReset, 3000);
    return;
  }
  disarmReset();
  game.resetBestScore();
  settingsBest.textContent = I18n.t('bestScoreLabel', { n: 0 });
});

$('btn-close').addEventListener('click', () => {
  game.sound.play('button');
  closeSettings();
});

// ---- Back to hub ----
// The hub can pass ?hub=<url>; the button only appears when it's present.
const HUB_URL = (() => {
  const param = new URLSearchParams(location.search).get('hub');
  if (param) { try { return new URL(param, location.href).href; } catch { /* ignore */ } }
  return 'https://mpmisha.github.io/playground/';
})();
const backHubBtn = $('btn-back-hub');
const hasHubParam = !!new URLSearchParams(location.search).get('hub');
const embeddedInHub = window.parent !== window;
backHubBtn.href = HUB_URL;
backHubBtn.hidden = !hasHubParam;
if (embeddedInHub) {
  // Sound/Vibration are global — controlled from the hub when embedded.
  toggleSound.closest('.row').hidden = true;
  toggleHaptics.closest('.row').hidden = true;
}
backHubBtn.addEventListener('click', (e) => {
  game.sound.play('button');
  if (embeddedInHub) {
    e.preventDefault();
    try {
      window.parent.postMessage({ type: 'playground:back' }, new URL(HUB_URL).origin);
    } catch {
      window.parent.postMessage({ type: 'playground:back' }, '*');
    }
  } else {
    e.preventDefault();
    location.href = HUB_URL;
  }
});

settingsOverlay.querySelector('[data-dismiss="settings"]').addEventListener('click', closeSettings);

// ---- Game over overlay (soft & friendly — never a harsh "Game Over") ----

const gameoverOverlay = $('gameover-overlay');

function openGameOver({ score, bestScore, isNewBest }) {
  $('go-emoji').textContent = isNewBest ? '🎉' : '🐣';
  $('go-title').textContent = isNewBest ? I18n.t('newBest') : I18n.t('oops');
  $('go-score').textContent = String(score);
  $('go-best').textContent = `👑 ${I18n.t('bestBadge', { n: bestScore })}`;
  gameoverOverlay.hidden = false;
}

$('btn-play-again').addEventListener('click', () => {
  game.sound.play('button');
  gameoverOverlay.hidden = true;
  game.startNewGame();
});

// ---- Localization ----
// Apply the resolved locale now, and re-apply live when the hub switches it
// (I18n dispatches to onChange after updating <html lang/dir>).
applyStaticTranslations();
I18n.onChange(() => {
  applyStaticTranslations();
  if (!settingsOverlay.hidden) syncSettingsUi();
  if (!gameoverOverlay.hidden) {
    openGameOver({
      score: game.score,
      bestScore: game.bestScore,
      isNewBest: $('go-emoji').textContent === '🎉',
    });
  }
});

// ---- Service worker (offline support) ----

if ('serviceWorker' in navigator) {
  // Auto-reload once when a new SW takes control so installed users get updates.
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloading) return;
    reloading = true;
    location.reload();
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
