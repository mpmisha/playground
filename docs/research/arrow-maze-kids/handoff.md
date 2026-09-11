# Pre-design / pre-implementation inputs

- Readiness: **Provisional**
- Exact evidence gaps: no authentic screenshot was successfully downloaded and
  visually inspected; arrow semantics and cell-revisit rules are undecided; procedural
  generation, difficulty ordering, small-phone portrait fit, child usability, and
  Hebrew/RTL behavior are untested.

## Essential mechanics versus optional additions

Essential, evidence-supported identity:

- One clear start and one clear goal in a fixed maze-like traversable region.
- One continuous, forgiving touch trace with an equivalent keyboard path.
- Stable directional rules communicated by arrows without reading.
- Every published/generated level is solvable.
- Gradual progression from direct routes to forks and directional constraints.
- Calm correction, unlimited undo/reset, and no punitive failure.

Optional, non-essential additions:

- Picture/silhouette masks, themed families, route-cover variants, daily seeds,
  multiple paths, portals, bridges, collectibles, optimal-route stars, or moving
  characters.
- Most should be deferred. Silhouettes are central to the proposal's visual variety
  but not to the maze rule itself. Multiple paths and board coverage move the game
  toward Numberlink/Flow Free; moving hazards move it toward multi-state logic mazes.

## Compatible and incompatible existing patterns

Compatible with Playground:

- Independent static PWA repository, relative assets, offline shell, GitHub Pages,
  and hub return parameter ([S001](sources.md#s001), [S002](sources.md#s002)).
- Portrait-first, touch-friendly play; local-only progress; mutable sound/vibration;
  brief, optional celebration.
- Baloo 2/twilight/candy-surface styling may be considered at design time if confirmed
  by the implementing repository's current authority.

Incompatible:

- Ads, purchases, analytics/tracking, external links, countdowns, streak pressure,
  limited lives/hints, frightening pursuit, or forced autoplay.
- Color-only paths, tiny cells, drag-only operation, hidden focus, or mirroring
  physical arrow semantics in RTL.
- Copying Flow Free pipes, Nikoli samples, the supplied reference artwork, published
  levels, characters, icons, or third-party silhouettes.

## Non-binding adaptation options and tradeoffs

- **Option A — walls plus occasional one-way arrows (recommended starting point):**
  most familiar and teachable; silhouettes can mask the board. Tradeoff: arrows may
  feel decorative until forks appear.
- **Option B — every traversable cell contains a direction:** stronger arrow identity
  and generator structure. Tradeoff: higher visual density and planning load.
- **Option C — draw a path that fills the silhouette:** produces satisfying completed
  pictures. Tradeoff: becomes a Hamiltonian/Numberlink-like planning puzzle and is
  much harder to generate, explain, and operate on small screens.
- **Option D — tap/step marker movement instead of free tracing:** more accessible and
  easier to correct. Tradeoff: loses some pencil-maze/path-drawing feel. A hybrid can
  expose both interactions over the same state model.

## Suggested non-binding initial scope

- One start, one goal, orthogonal movement, walls/masked cells, optional simple
  one-way arrows, no revisits, unlimited backtrack/Undo/Reset, next-step Hint.
- Deterministic generated levels in bounded difficulty bands, beginning with tiny
  rectangular or arrow-shaped masks before animal silhouettes.
- A small original set of silhouette masks represented as geometry, not copied art.
- English and Hebrew UI, physical board directions unchanged in RTL.
- Touch drag plus keyboard/step controls, reduced motion, mute, optional vibration,
  local progress, offline play, and hub return.
- Defer multi-path connection, full-board coverage, diagonal movement, portals,
  moving hazards, scores, collectibles, and online features.

## Decisions and unresolved questions for user/designer/developer

| Decision | Impact | Evidence / confidence | Blocking? |
| --- | --- | --- | --- |
| Exact arrow meaning | Tutorial, generator, accessibility labels | Abbott precedent is more complex than recommended child rule ([S006](sources.md#s006)); medium | Yes |
| Revisit and self-cross rules | Recovery and solver validation | Numberlink forbids reuse/crossing ([S007](sources.md#s007)); medium | Yes |
| Drag, step, or hybrid primary input | Motor demand and interaction feel | Touch tracing precedent exists, but no child testing; medium | Yes |
| Unique solution required | Generator cost and hint behavior | Maze and Numberlink traditions differ; low-medium | No for prototype, yes before progression claims |
| Silhouette fidelity versus cell size | Visual appeal and portrait usability | Proposed only; high impact | Yes |
| Difficulty metrics and progression | "Starts easy and progresses" promise | No child calibration evidence | Yes |
| Persistence model for infinite levels | Replay, migration, offline determinism | Proposed seeded/versioned stream; medium | Yes |
| Whether progress celebrations auto-advance | Calm agency | Playground policy favors no pressure; high | No |

## Research-derived observable acceptance considerations

- A first-time child can identify start, goal, and the next legal action without
  reading a paragraph.
- Every generated level presented by a fixed generator version/seed passes an
  independent solvability check; invalid masks and outward arrows are rejected.
- Early progression introduces tracing, turns, forks, and arrows separately before
  combining them.
- Touch can extend, reverse, pause, and resume a trace without accidental jumps across
  cells; invalid moves preserve the last valid state.
- Every pointer action has a visible-focus keyboard equivalent, including start,
  directional movement, undo, reset, hint, replay, next, settings, and hub return.
- Start, goal, arrows, valid path, invalid move, and completion remain distinguishable
  in grayscale and without sound, motion, or vibration.
- Controls meet WCAG's 24 CSS pixel minimum/spacing guidance, with larger effective
  targets chosen for children where feasible ([S010](sources.md#s010)).
- The active board fits supported portrait phones without page scrolling or cells
  becoming impractically small; complex silhouettes simplify rather than shrink.
- English and Hebrew layouts render correctly; UI chrome mirrors where appropriate,
  while board geometry, arrow meaning, and physical keyboard directions do not.
- A fresh install and resumed session work offline after initial caching; progress is
  local and no network, ad, analytics, purchase, or external-link dependency exists.
- Hub launch honors the supplied `hub` URL and a calm settings/back control returns to
  it, following current Playground guidance ([S002](sources.md#s002)).
- All production visuals, silhouettes, sounds, and levels are original or separately
  rights-cleared; none is traced or extracted from research references.

## Research limitations and next evidence needed

Before calling the design evidence complete, inspect authentic visuals from at least
two analogue families, including start, in-progress, invalid/recovery, and completion
states. Then create original low-fidelity concepts and test them—not third-party
assets—on a small portrait phone with children or appropriate adult proxies. Validate
drag tolerance, cell size, color independence, keyboard flow, screen-reader verbosity,
Hebrew copy/layout, generator solvability, and difficulty ordering.

## Boundary

Research complete does not mean design approved. No implementation has been started.
