// Playground telemetry — privacy-first, anonymous, aggregate-only usage
// insights for the whole platform (hub + every game). It posts small custom
// events straight to Azure Application Insights' ingestion endpoint.
//
// Deliberately calm & kid-safe:
//   • No cookies, no persistent user id, no cross-site tracking, no fingerprint.
//   • Session id lives in sessionStorage only — it resets when the tab/app
//     closes, so a child is never followed across sessions.
//   • No PII is ever sent. Azure masks the client IP (keeps country/city only).
//   • Honors Do-Not-Track / Global Privacy Control and a one-tap opt-out
//     (localStorage['telemetry'] = 'off', toggled from the hub's Settings).
//
// The ingestion "instrumentation key" below is write-only and is meant to be
// public in browser apps (it cannot read any data) — so it is safe in a repo.
//
// This file is byte-identical across the hub and all games: the app role is
// auto-derived from the URL path ('hub' for the menu, otherwise the game slug),
// so the same shared module drops into every repo with no per-app config.

const IKEY = '4309a9dd-3e2a-4d77-bd61-f385d84f33a9';
const ENDPOINT = 'https://westeurope-5.in.applicationinsights.azure.com/v2/track';

function role() {
  try {
    const seg = location.pathname.split('/').filter(Boolean)[0] || 'root';
    return seg === 'playground' ? 'hub' : seg;
  } catch { return 'root'; }
}

function optedOut() {
  try { if (localStorage.getItem('telemetry') === 'off') return true; } catch {}
  const dnt = navigator.doNotTrack || window.doNotTrack || navigator.msDoNotTrack;
  if (dnt === '1' || dnt === 'yes') return true;
  if (navigator.globalPrivacyControl === true) return true;
  return false;
}

function rand() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// Per-session anonymous id (sessionStorage — no long-term/cross-session link).
function sessionId() {
  try {
    let id = sessionStorage.getItem('pg_sid');
    if (!id) { id = rand(); sessionStorage.setItem('pg_sid', id); }
    return id;
  } catch { return rand(); }
}

function lang() {
  try { return document.documentElement.lang || localStorage.getItem('lang') || 'en'; }
  catch { return 'en'; }
}

function displayMode() {
  try {
    if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) return 'standalone';
    if (navigator.standalone) return 'standalone';
  } catch {}
  return 'browser';
}

function envelope(name, properties, measurements) {
  return {
    name: 'Microsoft.ApplicationInsights.Event',
    time: new Date().toISOString(),
    iKey: IKEY,
    tags: {
      'ai.cloud.role': role(),
      'ai.session.id': sessionId(),
      'ai.device.type': 'Browser',
      'ai.operation.name': name,
    },
    data: {
      baseType: 'EventData',
      baseData: {
        ver: 2,
        name,
        properties: properties || {},
        measurements: measurements || {},
      },
    },
  };
}

// Fire-and-forget; never blocks gameplay, never throws, silent when offline.
export function track(name, properties, measurements) {
  if (optedOut()) return;
  try {
    const body = JSON.stringify(envelope(name, properties, measurements));
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
    } else {
      fetch(ENDPOINT, {
        method: 'POST', body, keepalive: true,
        headers: { 'Content-Type': 'application/json' },
      }).catch(() => {});
    }
  } catch {}
}

function durationBucket(ms) {
  const s = ms / 1000;
  if (s < 10) return '0-10s';
  if (s < 30) return '10-30s';
  if (s < 60) return '30-60s';
  if (s < 180) return '1-3m';
  if (s < 600) return '3-10m';
  return '10m+';
}

// ---- Auto-instrumentation (runs once on import) --------------------------
// Every app gets a consistent open + session-length signal for free; apps can
// still call track() for richer events (game_launch, setting_changed, …).
const R = role();
const started = Date.now();

// Fire the open event AFTER the app has resolved & applied the platform
// language. i18n sets <html lang/dir> during main.js's synchronous top-level
// module eval, which runs *after* this module is imported — so reading lang()
// right here would capture the static <html lang="en"> and mis-report every
// session as 'en'. A microtask defer lets the language apply first, so we log
// the language the user actually sees (e.g. the Hebrew default).
function fireOpen() {
  track(R === 'hub' ? 'hub_open' : 'game_open', {
    game: R,
    lang: lang(),
    embedded: (window.parent !== window) ? 'yes' : 'no',
    display: displayMode(),
  });
}
if (typeof queueMicrotask === 'function') queueMicrotask(fireOpen);
else Promise.resolve().then(fireOpen);

// ---- Error capture -------------------------------------------------------
// Uncaught script errors + unhandled promise rejections are the signals that
// matter most when the games run on friends' uncontrolled devices (iOS audio,
// private-mode storage throws, etc.). Capped + deduped so a render-loop error
// can never flood ingestion, and messages are trimmed to stay PII-free/small.
const ERR_CAP = 8;
let errCount = 0;
const errSeen = new Set();

function trim(s, n) {
  s = String(s == null ? '' : s);
  return s.length > n ? s.slice(0, n) : s;
}

function reportError(kind, message, source, line, col) {
  if (errCount >= ERR_CAP) return;
  const msg = trim(message, 300);
  const src = trim(source, 200);
  const sig = kind + '|' + msg + '|' + src + '|' + (line || '');
  if (errSeen.has(sig)) return;
  errSeen.add(sig);
  errCount++;
  track('error', {
    game: R,
    kind,
    message: msg,
    source: src,
    lang: lang(),
    display: displayMode(),
    embedded: (window.parent !== window) ? 'yes' : 'no',
  }, {
    line: Number(line) || 0,
    col: Number(col) || 0,
  });
}

window.addEventListener('error', (e) => {
  // Ignore resource-load failures (img/script/link) — they have no .message
  // and .target is the element, not an ErrorEvent — to avoid noise.
  if (e && e.message) {
    reportError('error', e.message, e.filename, e.lineno, e.colno);
  }
}, true);

window.addEventListener('unhandledrejection', (e) => {
  let reason = e && e.reason;
  if (reason && reason.message) reason = reason.message;
  reportError('unhandledrejection', reason, '', 0, 0);
});

let ended = false;
function sessionEnd() {
  if (ended) return;
  ended = true;
  const ms = Date.now() - started;
  track('session_end', {
    game: R,
    lang: lang(),
    duration_bucket: durationBucket(ms),
  }, { duration_ms: ms });
}
// pagehide is the reliable "leaving" signal on mobile Safari; visibility→hidden
// covers app backgrounding. Whichever fires first wins (guarded by `ended`).
window.addEventListener('pagehide', sessionEnd, { capture: true });
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') sessionEnd();
});
