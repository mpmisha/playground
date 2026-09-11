# Existing versions and visual evidence

## Comparison

| Version ID/name | Publisher, platform, version/date | Material mechanics/input differences | Visual/a11y pattern | Playground fit/conflict | Evidence |
| --- | --- | --- | --- | --- | --- |
| E001 Traditional maze | Broad puzzle form; paper/digital; longstanding | One start-to-goal path constrained by walls; pencil/fingertip tracing | Clear corridors and endpoints; complexity can scale by branches | Strong baseline; silhouettes and calm tracing fit | [S004](sources.md#s004), [V006](#v006) |
| E002 Traffic Maze in Floyd's Knob | Robert Abbott; print; 1962 | Arrows at intersections; legal exits depend on arrival direction | Street-grid arrows carry rule meaning | Directional identity is relevant, but multi-state semantics are too complex for initial levels | [S005](sources.md#s005), [S006](sources.md#s006) |
| E003 Nikoli Numberlink | Nikoli; print/web samples; current page accessed 2026 | Connect several matching pairs; no crossing, branching, or cell reuse | Sparse grid, numbered endpoints, path-centered cells | Useful input precedent; numbers and multiple paths add reading/planning load | [S007](sources.md#s007), [V001](#v001)-[V003](#v003) |
| E004 Flow Free | Big Duck Games; mobile; 2012 onward | Touch-drawn colored pipes, all pairs and full board; variants add walls, bridges, hexes, warps, shapes | High-contrast colors, rounded pipes, portrait boards | Strong touch/progression reference; ads, purchases, timed play, color reliance conflict | [S008](sources.md#s008), [S009](sources.md#s009), [V004](#v004) |
| E005 Theseus and the Minotaur | Robert Abbott; print/electronic variants | Player movement also advances a pursuing adversary; state changes every turn | Characters and walls communicate moving-state puzzle | Demonstrates logic-maze state, but threat and cognitive load conflict with calm initial scope | [S005](sources.md#s005), [S006](sources.md#s006), [V005](#v005) |

## Version records

### E001

Traditional maze. **Verified (documented), high confidence:** a maze is a path or
collection of paths, typically from an entrance to a goal; printed mazes can be traced
with pencil or fingertip. Picture mazes may form an image. This supplies the clearest
precedent for a single continuous start-to-goal trace, but not for arrow rules or
infinite silhouette generation.

### E002

Traffic Maze in Floyd's Knob. **Verified (documented), medium-high confidence:** the
maze resembles a street grid with arrows at intersections, and legal exits depend on
the road from which the intersection was entered. The description is secondary rather
than Abbott's original publication. It establishes that arrow-governed navigation is
a known logic-maze family, not that its exact rule should be copied.

### E003

Nikoli Numberlink. **Verified (documented), high confidence:** matching numbers are
joined by continuous orthogonal lines; lines do not reuse a cell, cross, branch, or
pass through other numbered cells. The official page exposes sample, progress, and
solution images, but they were not successfully downloaded and visually inspected.

### E004

Flow Free. **Verified (documented), high confidence:** matching colors are connected
with pipes, all colors are paired, the board is covered, and crossing/overlap breaks a
pipe. The official publisher describes free-play and timed modes. Secondary reporting
documents grid-size progression and later bridges, hexes, warps, and shaped-cell
variants. The proposed game should borrow neither art nor monetization/pressure.

### E005

Theseus and the Minotaur. **Verified (documented), medium confidence:** a notable
Abbott logic maze with print and electronic versions. It is relevant as a contrast:
moving threats and multi-entity state can deepen a maze, but are unnecessary and
potentially frightening for the proposed audience.

## State coverage and capture gaps

Six references were identified across traditional maze, Numberlink, Flow Free, and
logic-maze families. All remain **linked-only** because the batch download attempt
failed before local image inspection. Therefore no reference counts as inspected
visual evidence. Missing states include child onboarding, touch drag feedback,
invalid-move recovery, settings/accessibility, Hebrew/RTL, silhouette-shaped boards,
and success feedback. No live interaction occurred.

## Annotated gallery

### V001

- Version/state and source: [E003](#e003); [S007](sources.md#s007); official Numberlink
  sample image.
- Inspection: **linked-only; not inspected**.
- Evidence: [Nikoli Numberlink source page](https://www.nikoli.co.jp/en/puzzles/numberlink/)
- Intended relevance: compare endpoint clarity and sparse starting state.
- Rights: Nikoli copyright/redistribution permission was not established; no retention
  or repository copy.

### V002

- Version/state and source: [E003](#e003); [S007](sources.md#s007); official
  "Progressing" image.
- Inspection: **linked-only; not inspected**.
- Evidence: [Nikoli Numberlink source page](https://www.nikoli.co.jp/en/puzzles/numberlink/)
- Intended relevance: compare in-progress path legibility and correction state.
- Rights: unknown; no retention or reuse.

### V003

- Version/state and source: [E003](#e003); [S007](sources.md#s007); official solution
  image.
- Inspection: **linked-only; not inspected**.
- Evidence: [Nikoli Numberlink source page](https://www.nikoli.co.jp/en/puzzles/numberlink/)
- Intended relevance: compare completed-path density.
- Rights: unknown; no retention or reuse.

### V004

- Version/state and source: [E004](#e004); [S009](sources.md#s009); Flow Free gameplay.
- Inspection: **linked-only; not inspected**.
- Evidence: [Flow Free article and screenshot](https://en.wikipedia.org/wiki/Flow_Free)
- Intended relevance: portrait grid, rounded touch paths, color differentiation.
- Rights: the screenshot is explicitly non-free/fair-use media on English Wikipedia;
  it must not be copied into this bundle or reused as production art.

### V005

- Version/state and source: [E005](#e005); [S005](sources.md#s005); sample Theseus and
  the Minotaur board.
- Inspection: **linked-only; not inspected**.
- Evidence:
  [Wikimedia Commons file page](https://commons.wikimedia.org/wiki/File:Theseus_and_the_Minotaur_puzzle.png)
- Intended relevance: how walls, two entities, and a goal are distinguished.
- Rights: file metadata declares CC0, but publication use was not needed or authorized
  for this bundle; no copy retained.

### V006

- Version/state and source: [E001](#e001); [S004](sources.md#s004); simple maze.
- Inspection: **linked-only; not inspected**.
- Evidence:
  [Wikimedia Commons file page](https://commons.wikimedia.org/wiki/File:Maze_simple.svg)
- Intended relevance: basic wall/corridor hierarchy and endpoint readability.
- Rights: file metadata declares CC0; no copy retained because visual inspection did
  not complete and third-party art is unnecessary for the handoff.
