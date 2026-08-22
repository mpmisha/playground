// Player settings + best-score persistence via localStorage.
// Mirrors the shared Playground pattern used by other games in this hub.

const KEYS = {
  sound: 'soundEnabled',
  haptics: 'hapticsEnabled',
  difficulty: 'flappyDifficulty',
  best: 'flappyBest',
};

const DIFFICULTIES = ['calm', 'easy', 'normal'];
const DEFAULT_DIFFICULTY = 'easy';

function readBool(key, fallback) {
  const v = localStorage.getItem(key);
  if (v === null) return fallback;
  return v === 'true';
}

const SettingsStore = {
  get isSoundEnabled() {
    return readBool(KEYS.sound, true);
  },
  set isSoundEnabled(value) {
    localStorage.setItem(KEYS.sound, value ? 'true' : 'false');
  },
  get areHapticsEnabled() {
    return readBool(KEYS.haptics, true);
  },
  set areHapticsEnabled(value) {
    localStorage.setItem(KEYS.haptics, value ? 'true' : 'false');
  },
  get difficulty() {
    const stored = localStorage.getItem(KEYS.difficulty);
    return DIFFICULTIES.includes(stored) ? stored : DEFAULT_DIFFICULTY;
  },
  set difficulty(value) {
    if (!DIFFICULTIES.includes(value)) return;
    localStorage.setItem(KEYS.difficulty, value);
  },
};

const BestScoreStore = {
  get() {
    const stored = parseInt(localStorage.getItem(KEYS.best) || '', 10);
    return Number.isFinite(stored) && stored > 0 ? stored : 0;
  },
  set(value) {
    localStorage.setItem(KEYS.best, String(Math.max(0, Math.floor(value))));
  },
  reset() {
    localStorage.setItem(KEYS.best, '0');
  },
};

export { SettingsStore, BestScoreStore, DIFFICULTIES };
