// Playground i18n (v1). Shared contract across the hub and every game.
// Canonical store: localStorage 'lang' ∈ {'en','he'}. Same origin, so the hub
// and all games share this key. English is LTR + fallback; Hebrew is RTL.

export const LANGS = ['en', 'he'];

const STRINGS = {
  en: {
    settings: 'Settings',
    appliesToEvery: 'Applies to every game',
    sound: 'Sound',
    vibration: 'Vibration',
    language: 'Language',
    close: 'Close',
    english: 'English',
    hebrew: 'עברית',
    games: 'Games',
    noGames: 'No games yet.',
    couldNotLoad: 'Could not load games.',
    backToGames: 'Back to games',
    settingsAria: 'Settings',
    about: 'About',
    aboutIntro: 'Playground is a cozy little collection of calm games for kids — no ads, no sign-ups, no timers, and no scary “game over”. Just tap a game and play.',
    installTitle: 'Add it to your home screen',
    installSub: 'so it opens like a real app — full-screen, and even works offline.',
    iosTitle: 'On iPhone / iPad (Safari)',
    iosSteps: [
      'Tap the Share button (a square with an arrow ↑) at the bottom.',
      'Scroll down and choose “Add to Home Screen”.',
      'Tap “Add” — the Playground icon appears on your home screen.',
    ],
    androidTitle: 'On Android (Chrome)',
    androidSteps: [
      'Tap the menu (⋮) in the top corner of Chrome.',
      'Choose “Add to Home screen” (or “Install app”).',
      'Tap “Add” — the Playground icon appears on your home screen.',
    ],
  },
  he: {
    settings: 'הגדרות',
    appliesToEvery: 'חל על כל המשחקים.',
    sound: 'צליל',
    vibration: 'רטט',
    language: 'שפה',
    close: 'סגירה',
    english: 'English',
    hebrew: 'עברית',
    games: 'משחקים',
    noGames: 'אין עדיין משחקים.',
    couldNotLoad: 'לא ניתן לטעון משחקים.',
    backToGames: 'חזרה למשחקים',
    settingsAria: 'הגדרות',
    about: 'אודות',
    aboutIntro: 'פלייגראונד הוא אוסף קטן ונעים של משחקים רגועים לילדים — בלי פרסומות, בלי הרשמה, בלי טיימרים ובלי “סוף משחק” מפחיד. פשוט נגעו במשחק ושחקו.',
    installTitle: 'הוסיפו למסך הבית',
    installSub: 'כדי שהמשחק ייפתח כמו אפליקציה אמיתית — במסך מלא, ואפילו עובד בלי אינטרנט.',
    iosTitle: 'באייפון / אייפד (Safari)',
    iosSteps: [
      'הקישו על כפתור השיתוף (ריבוע עם חץ ↑) בתחתית המסך.',
      'גללו מטה ובחרו ב“הוספה למסך הבית”.',
      'הקישו “הוספה” — הסמל של פלייגראונד יופיע במסך הבית.',
    ],
    androidTitle: 'באנדרואיד (Chrome)',
    androidSteps: [
      'הקישו על התפריט (⋮) בפינה העליונה של Chrome.',
      'בחרו ב“הוספה למסך הבית” (או “התקנת אפליקציה”).',
      'הקישו “הוספה” — הסמל של פלייגראונד יופיע במסך הבית.',
    ],
  },
};

export function isValidLang(code) {
  return LANGS.includes(code);
}

function detectFromNavigator() {
  const list = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language || ''];
  for (const raw of list) {
    const code = String(raw).toLowerCase();
    if (code.startsWith('he') || code.startsWith('iw')) return 'he';
    if (code.startsWith('en')) return 'en';
  }
  return 'en';
}

// Resolution order: (1) URL ?lang= if valid → also persist; (2) stored 'lang';
// (3) auto-detect. Never let auto-detect overwrite an explicit stored choice.
export function resolveLang() {
  try {
    const param = new URLSearchParams(location.search).get('lang');
    if (param && isValidLang(param)) {
      localStorage.setItem('lang', param);
      return param;
    }
  } catch { /* ignore */ }

  const stored = localStorage.getItem('lang');
  if (stored && isValidLang(stored)) return stored;

  return detectFromNavigator();
}

let currentLang = 'en';

export function getLang() { return currentLang; }

export function t(key) {
  const dict = STRINGS[currentLang] || STRINGS.en;
  return dict[key] != null ? dict[key] : (STRINGS.en[key] != null ? STRINGS.en[key] : key);
}

// Apply the locale to the document chrome. `persist` writes an explicit choice.
export function applyLang(code, persist = false) {
  const lang = isValidLang(code) ? code : 'en';
  currentLang = lang;
  if (persist) {
    try { localStorage.setItem('lang', lang); } catch { /* ignore */ }
  }
  const el = document.documentElement;
  el.lang = lang;
  el.dir = lang === 'he' ? 'rtl' : 'ltr';
  return lang;
}
