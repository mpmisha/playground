# Arrow Maze Kids — research knowledge base

- Status: **Provisional**
- Researched / last verified: 2026-09-11
- Subject: an original, child-friendly path-tracing maze with arrow cues, generated
  levels, and traversable board silhouettes such as arrows, geometric forms, and
  friendly animals.
- Audience assumptions: younger children; short, calm sessions; portrait mobile and
  touch first; keyboard supported; English and Hebrew/RTL.
- Coverage: five materially distinct maze/path analogues, twelve source records, and
  six linked-only visual references across four analogue families. No live interaction
  or visually inspected authentic screenshot was completed.
- Context read: repository `README.md`, `games.json`, `shared/ADDING_A_GAME.md`,
  `docs/research/README.md`, and `.github/agents/playground-resercher.agent.md` as
  present on 2026-09-11.
- Missing/stale context and authority conflicts: the live repository does not define
  a game-specific design system beyond its calm rules and integration conventions.
  The supplied concept is original, so no external source is authoritative for its
  final rules. Flow Free includes ads, purchases, and a timed mode that conflict with
  Playground policy.
- Search budget and stop reason: two focused discovery passes plus one visual/source
  gap pass. Research stopped at the user's requested deadline after the visual
  download attempt failed; linked-only references are retained honestly.
- Storage: source links and metadata only. No third-party image or artwork is stored
  in this repository.

## Key evidence-based findings

- **Verified (documented), high confidence:** ordinary mazes ask the player to find a
  route through fixed paths from an entrance to a goal; paper mazes may be followed
  with a pencil or fingertip. This is the most legible baseline for younger children
  ([S004](sources.md#s004), [E001](versions-and-visuals.md#e001)).
- **Verified (documented), high confidence:** logic mazes can restrict movement with
  rules beyond walls. Abbott's traffic maze used arrows at intersections and made
  available exits depend on the direction of arrival
  ([S005](sources.md#s005), [S006](sources.md#s006),
  [E002](versions-and-visuals.md#e002)).
- **Verified (documented), high confidence:** Numberlink and Flow Free demonstrate
  continuous touch-drawn paths, clear invalid-crossing rules, and progressive board
  complexity, but their pair-connection and board-cover goals are not the proposed
  game's identity ([S007](sources.md#s007), [S008](sources.md#s008),
  [E003](versions-and-visuals.md#e003), [E004](versions-and-visuals.md#e004)).
- **Proposed, medium confidence:** the strongest child-friendly identity is one
  start-to-goal trace where arrows are visual route cues or one-way permissions,
  while silhouette shape changes provide variety without introducing timers,
  scoring pressure, enemies, or multiple simultaneous paths.
- **Proposed, high confidence:** generation must construct a known-valid solution
  first and validate every published level; "infinite" should mean an effectively
  unbounded deterministic level stream, not unchecked random boards.

## Overlap with the existing Playground catalog

No registered game is a maze or continuous path-tracing game. `Slide Puzzle` and
`2048` share spatial planning; `Snake` shares directional movement; `Block Grid` and
`Bubble Pop` share grid-based touch interaction. None duplicates start-to-goal tracing
or arrow-constrained navigation ([S003](sources.md#s003)).

## Limitations and exact readiness gaps

The comparison and rules are sufficient to begin a design discussion, but the bundle
is not **Ready** because no authentic image was successfully downloaded and visually
inspected. The proposed arrow semantics, whether a trace may revisit cells, and how
silhouette masks affect generation remain design decisions. No generator,
solvability distribution, portrait density, Hebrew layout, or child usability has
been empirically tested.

## Navigate

[Rules](rules.md) · [Versions and visuals](versions-and-visuals.md) ·
[Sources](sources.md) · [Handoff](handoff.md) ·
[Asset manifest](assets/manifest.json)
