# Adding a game to Playground

Every game is a **self-contained static site** (its own repo + GitHub Pages) that
the hub links to. Games stay dumb and independent — the hub only needs a URL.

Follow these conventions so games feel like one calm collection.

## 1. Be self-contained

- Plain HTML/CSS/JS (or a build that outputs static files). No server.
- Use **relative** asset paths (`./`, `js/...`, `icons/...`) so the site works
  under a `/<repo>/` subpath on GitHub Pages.
- Ship a `manifest.webmanifest` + `service-worker.js` so the game is installable
  and works offline on its own too.

## 2. Support returning to the hub

When launched from the hub, the game receives a query param:

```
https://mpmisha.github.io/<game>/?hub=https://mpmisha.github.io/playground/
```

Add a calm **← Back to Games** control (a link is enough) that navigates to that
URL. Fall back to the known hub URL when the param is absent:

```js
const HUB_URL = new URLSearchParams(location.search).get('hub')
  || 'https://mpmisha.github.io/playground/';
```

Keep it out of the way (e.g. inside a settings panel) so it never distracts play.

## 3. Follow the calm rules

- **No** ads, purchases, analytics, tracking, or external links.
- **No** timers, streak pressure, or scary game-over states.
- Muted palette; gentle sound that can be **muted**; minimal splashes/animation.
- Works with touch, offline, and portrait orientation.

## 4. Register it

Add one entry to the hub's `games.json`:

```json
{
  "id": "<slug>",
  "name": "<Display name>",
  "tagline": "<one short line>",
  "icon": "<emoji>",
  "color": "<hex tile color>",
  "url": "https://mpmisha.github.io/<game>/"
}
```

That's it — no code changes to the hub.
