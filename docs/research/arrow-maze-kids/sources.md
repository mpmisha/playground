# Source ledger

## Search/access log

Research ran on 2026-09-11. Queries covered arrow/logic mazes, Robert Abbott,
Numberlink, Flow Free, children's/shape mazes, maze generation, touch target sizing,
and RTL direction. Bing and DuckDuckGo result pages returned irrelevant or blocked
content, so claims rely on directly opened source pages. `logicmazes.com` failed at the
transport layer. Google Play returned machine-oriented HTML and the Apple App Store
fetch surfaced a user review rather than reliable product metadata, so neither supports
claims here. A six-file visual download/fingerprint attempt failed with HTTP 400 before
inspection. The user then requested immediate finalization with honest linked-only
evidence. Further searching stopped because the main mechanics had saturated and the
remaining gap was visual inspection, not another rules source.

## Sources

### S001

- Title / publisher / type: `Playground` README; mpmisha/playground; live internal
  project authority.
- URL/path: `README.md`
- Updated date: repository version current on 2026-09-11; accessed 2026-09-11.
- Related IDs: proposed game integration.
- Supported claims: hub architecture, independent game repositories, GitHub Pages,
  hub return parameter, offline expectation, and calm rules.
- Confidence: **Verified (documented), high**; direct project authority.
- Rights: repository documentation; summarized, not copied into production assets.

### S002

- Title / publisher / type: `Adding a game to Playground`; mpmisha/playground; live
  integration authority.
- URL/path: `shared/ADDING_A_GAME.md`
- Accessed: 2026-09-11.
- Supported claims: static self-contained site, relative assets, manifest/service
  worker, `hub` return behavior, no ads/purchases/tracking/timers, touch and portrait.
- Confidence: **Verified (documented), high**.
- Rights: repository documentation.

### S003

- Title / publisher / type: Playground game registry; mpmisha/playground; live catalog.
- URL/path: `games.json`
- Accessed: 2026-09-11.
- Related IDs: catalog-overlap analysis.
- Supported claims: eleven current games and no registered maze/path-tracing
  equivalent.
- Confidence: **Verified (documented), high**.
- Rights: repository data.

### S004

- Title / publisher / type: `Maze`; Wikipedia contributors; secondary overview.
- URL: https://en.wikipedia.org/wiki/Maze
- Published/updated: continuously maintained; accessed 2026-09-11.
- Related IDs: [E001](versions-and-visuals.md#e001), [V006](versions-and-visuals.md#v006).
- Supported claims: entrance-to-goal definition, pencil/fingertip tracing, picture
  mazes, perfect mazes, and carving-passages/adding-walls generation families.
- Confidence: **Verified (documented), medium-high**; useful secondary synthesis.
- Rights: text under Wikipedia terms; summarized. Linked Commons visual has separate
  CC0 metadata.

### S005

- Title / publisher / type: `Logic maze`; Wikipedia contributors; secondary overview.
- URL: https://en.wikipedia.org/wiki/Logic_maze
- Accessed: 2026-09-11.
- Related IDs: [E002](versions-and-visuals.md#e002),
  [E005](versions-and-visuals.md#e005), [V005](versions-and-visuals.md#v005).
- Supported claims: rules beyond walls, multi-state mazes, Abbott's role, and examples.
- Confidence: **Verified (documented), medium**; secondary and not specific enough to
  define the proposed rules.
- Rights: summarized; no image retained.

### S006

- Title / publisher / type: `Robert Abbott (game designer)`; Wikipedia contributors;
  secondary biographical/rules description.
- URL: https://en.wikipedia.org/wiki/Robert_Abbott_(game_designer)
- Accessed: 2026-09-11.
- Related IDs: [E002](versions-and-visuals.md#e002),
  [E005](versions-and-visuals.md#e005).
- Supported claims: 1962 Traffic Maze publication; arrows at street intersections;
  legal exits vary by arrival direction; logic-maze state.
- Confidence: **Verified (documented), medium-high** for the summarized mechanism;
  original publication was not accessed.
- Rights: summarized in original words.

### S007

- Title / publisher / type: `Numberlink`; Nikoli; primary publisher rules page.
- URL: https://www.nikoli.co.jp/en/puzzles/numberlink/
- Updated date: unknown; accessed 2026-09-11.
- Related IDs: [E003](versions-and-visuals.md#e003),
  [V001](versions-and-visuals.md#v001)-[V003](versions-and-visuals.md#v003).
- Supported claims: continuous same-number connections, orthogonal cell-center lines,
  no cell reuse, crossing, branching, or passing through number cells.
- Confidence: **Verified (documented), high**; primary rules source.
- Rights: image license/redistribution not established; links only.

### S008

- Title / publisher / type: `Flow Free`; Big Duck Games; primary product page.
- URL: https://www.bigduckgames.com/flowfree
- Updated date: unknown; accessed 2026-09-11.
- Related IDs: [E004](versions-and-visuals.md#e004).
- Supported claims: matching-color pipes, pair all colors, cover the board, pipes
  break on crossing/overlap, free-play and time-trial modes, many puzzles.
- Confidence: **Verified (documented), high**.
- Rights: product text summarized; no assets retained.

### S009

- Title / publisher / type: `Flow Free`; Wikipedia contributors; secondary overview.
- URL: https://en.wikipedia.org/wiki/Flow_Free
- Accessed: 2026-09-11.
- Related IDs: [E004](versions-and-visuals.md#e004),
  [V004](versions-and-visuals.md#v004).
- Supported claims: 2012 mobile release, grid-size progression, walls, full-board goal,
  and Bridges/Hexes/Warps/Shapes variants.
- Confidence: **Verified (documented), medium-high**; secondary, with version-specific
  details that should be rechecked before design decisions depend on them.
- Rights: linked screenshot is marked non-free/fair use; no retention or reuse.

### S010

- Title / publisher / type: `Understanding Success Criterion 2.5.8: Target Size
  (Minimum)`; W3C WAI; normative-supporting accessibility guidance.
- URL: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Accessed: 2026-09-11.
- Supported claims: 24-by-24 CSS pixel minimum/spacing concept and benefits for touch
  users and people with limited dexterity; larger targets are recommended.
- Confidence: **Verified (documented), high**.
- Rights: summarized accessibility guidance.

### S011

- Title / publisher / type: `Structural markup and right-to-left text in HTML`; W3C
  Internationalization; technical guidance.
- URL: https://www.w3.org/International/questions/qa-html-dir
- Accessed: 2026-09-11.
- Supported claims: `dir="auto"` for mixed-direction text fields and the importance of
  explicit base direction.
- Confidence: **Verified (documented), high** for text direction; it does not say
  spatial game rules should mirror.
- Rights: summarized technical guidance.

### S012

- Title / publisher / type: `Making PWAs installable`; MDN contributors; secondary web
  platform guide.
- URL: https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Making_PWAs_installable
- Accessed: 2026-09-11; fetch returned title-only simplified content.
- Supported claims: none beyond identifying an installability reference for later
  implementation verification.
- Confidence: **Unverified / low** for this run; do not use it as current evidence.
- Rights: link only.

## Conflicts and reconciliation

- **Arrow semantics:** Abbott's traffic maze makes choices depend on arrival direction
  ([S006](#s006)); the proposed child game has no authoritative rule. The handoff
  recommends a simpler one-way "leave in the arrow direction" rule, labeled Proposed.
- **Board coverage:** Wikipedia describes many Numberlink designs as filling all cells,
  while Nikoli's displayed rules do not state full coverage ([S004](#s004),
  [S007](#s007)). Treat coverage as version-specific, never a universal rule.
- **Calm play:** Flow Free offers relaxed free play but also ads/purchases and timed
  play ([S008](#s008), product-store evidence encountered but not relied upon).
  Playground authority prohibits those patterns ([S001](#s001), [S002](#s002)).
- **Visual rights:** two Commons references report CC0 metadata, Flow Free's screenshot
  is explicitly non-free, and Nikoli image rights are unknown. No external visual is
  needed for production, so all remain links and original artwork is required.
