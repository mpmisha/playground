// Playground hub: loads the game registry and renders a calm menu.
// Each game is an independent site; we launch it with ?hub=<this url> so the
// game's "Back to Games" button returns here.

const HUB_URL = location.href.split('?')[0].split('#')[0];

function launchUrl(gameUrl) {
  try {
    const u = new URL(gameUrl, location.href);
    u.searchParams.set('hub', HUB_URL);
    return u.href;
  } catch {
    return gameUrl;
  }
}

function card(game) {
  const a = document.createElement('a');
  a.className = 'game-card';
  a.href = launchUrl(game.url);
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
  } else {
    if (game.color) icon.style.background = game.color;
    icon.textContent = game.icon || '🎮';
  }

  const name = document.createElement('div');
  name.className = 'game-name';
  name.textContent = game.name || game.id;

  a.append(icon, name);

  if (game.tagline) {
    const tag = document.createElement('p');
    tag.className = 'game-tagline';
    tag.textContent = game.tagline;
    a.append(tag);
  }

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
      empty.hidden = false;
      return;
    }
    const frag = document.createDocumentFragment();
    for (const game of games) frag.append(card(game));
    grid.append(frag);
  } catch {
    empty.textContent = 'Could not load games.';
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

loadGames();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
