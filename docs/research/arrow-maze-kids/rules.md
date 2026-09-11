# Rules and gameplay

## Baseline version and rule authority

`arrow-maze-kids` is a new concept, not an established ruleset. Everything below
labeled **Proposed** is a non-binding synthesis. The nearest documented precedents are
ordinary start-to-goal mazes ([E001](versions-and-visuals.md#e001)), arrow-governed
logic mazes ([E002](versions-and-visuals.md#e002)), and continuous path drawing in
Numberlink/Flow Free ([E003](versions-and-visuals.md#e003),
[E004](versions-and-visuals.md#e004)).

## Goal, setup, state, and pieces

- **Proposed:** guide a friendly marker from a clearly distinguished start to a goal
  by tracing one continuous route through traversable cells or corridors.
- A level contains a silhouette mask, traversable and blocked areas, start and goal,
  arrow cues or restrictions, and a guaranteed solution.
- The path is the only player-controlled state. No lives, currency, countdown, score
  multiplier, opponent, or consumable resource is required.
- A silhouette may resemble an arrow, circle, heart, fish, turtle, cat face, flower,
  rocket, or other friendly form, but the playable route must remain visually clearer
  than the outer picture.

## Legal/illegal actions, inputs, and state transitions

- **Proposed baseline:** press/touch the start, drag through orthogonally adjacent
  traversable cells, and release at the goal. Diagonal movement is invalid unless a
  later design explicitly introduces it.
- Arrows should have one stable meaning. Recommended interpretation: when leaving an
  arrow cell, the next cell must be in the arrow's direction. This is simpler than
  Abbott's arrival-direction-dependent intersections ([S006](sources.md#s006)).
- The path cannot enter blocked cells, jump over cells, leave the silhouette, or
  violate an arrow. Whether revisiting a cell is allowed is an open decision; the
  simpler baseline forbids it.
- Dragging backward over the immediately previous segment should erase that segment,
  giving touch users a forgiving undo gesture. A separate large Undo control should
  offer equivalent keyboard and switch access.
- Keyboard proposal: focus the start or board, use Arrow keys to extend/retract the
  path, Enter/Space to start or confirm, Escape to cancel the current trace, and a
  visible Reset button. Keyboard direction remains physical, not mirrored in Hebrew.

## Feedback, success/failure, deadlocks, and recovery

- Valid extension: immediate visual growth, optional quiet tone, and optional subtle
  haptic tick.
- Invalid move: do not commit it; gently pulse the blocking edge/cell and preserve the
  valid prefix. Avoid red-only feedback, buzzers, shaking, loss language, or life loss.
- Releasing before the goal preserves or clears the prefix only if that behavior is
  taught consistently. Recommended: preserve it and show a calm "Keep going" cue.
- Success occurs when the continuous legal path reaches the goal. Celebrate briefly,
  then let the child choose Next or replay; never auto-rush to the next level.
- A wrong branch is not game failure. Undo, backtracking, Reset, and an optional hint
  restore progress. A generated board with no legal solution is a content defect and
  must never be presented as a challenge.

## Scoring, hints/undo/reset, session loop, and progression

- **Proposed:** no numeric score, stars for optimality, streak, timer, or limited hint
  economy. Completion itself is sufficient.
- A hint may reveal only the next legal step, highlight a reachable junction, or
  briefly animate the next arrow. Repeated hints should remain available.
- Session loop: choose or resume a level, trace, calmly correct, celebrate, optionally
  continue. Progress should persist locally and remain usable offline.
- Difficulty knobs: solution length, board dimensions, branch count, dead-end depth,
  number and spacing of arrows, similarity of choices, required turns, silhouette
  concavity, and whether the route must cover all traversable cells.
- Early levels should isolate one concept at a time: tracing, one turn, a simple fork,
  one arrow, then combined constraints.

## Meaningful variant differences

- **Ordinary maze:** walls alone constrain a single route
  ([E001](versions-and-visuals.md#e001)).
- **Directional logic maze:** arrows or arrival state govern legal exits
  ([E002](versions-and-visuals.md#e002)).
- **Pair connection:** several paths connect matching endpoints without crossing
  ([E003](versions-and-visuals.md#e003)).
- **Board cover:** every usable cell must be filled, increasing planning demand
  ([E004](versions-and-visuals.md#e004)).
- **Moving hazard:** the puzzle state changes after each move
  ([E005](versions-and-visuals.md#e005)); this is unsuitable for the initial calm,
  younger-child scope.

## Edge cases and original textual worked example

Edge cases to decide and validate:

- A finger starts outside the start cell, leaves/re-enters the board, moves too fast
  across several cells, or crosses a cell corner.
- The finger obscures the next junction; the drawn path needs sufficient offset or
  visible leading feedback.
- A move reverses over one segment versus revisits an older cell.
- Two adjacent arrows point into each other; an arrow points outside the silhouette;
  the goal is placed on an arrow; or the start has no legal first move.
- The silhouette contains disconnected islands, one-cell bottlenecks, holes, thin
  appendages, or cells too small for touch.
- The viewport rotates, resizes, resumes from background, or reloads mid-trace.
- A saved generator version changes; old progress must not point to a different level.
- Reduced motion, muted sound, and unavailable vibration must not hide state changes.
- In RTL, text and panel order may mirror, but board coordinates and arrow meaning must
  remain spatially consistent.

**Proposed explanatory example:** A 4-by-5 fish-shaped mask has a green start at the
tail and a star goal at the nose. The child drags right, up, then reaches a cell with
an arrow pointing right. Dragging down is rejected with a soft outline; the existing
path remains. The child drags right, then down and right to the star. A short
celebration appears with `Next` and `Play again`. This is hypothetical, not an
observed level or copied published puzzle.

## Accessibility, child demands, touch/keyboard, Hebrew/RTL, orientation

- Reading demand should be near zero during play. Teach with motion, symbols, and one
  short localized sentence; never rely on arrow names such as "east."
- Spatial planning and working-memory demand rise quickly with forks and long dead
  ends. Very easy levels should keep the full route or next meaningful decision within
  a small visual span.
- Touch tracing requires more precision than tapping. Corridors should be generous,
  with forgiving hit testing that never visually misrepresents the chosen cell.
- WCAG 2.2's minimum target guidance is 24 by 24 CSS pixels, while larger controls are
  a documented best practice ([S010](sources.md#s010)). For young children, board cells
  and controls should target materially larger effective areas where portrait space
  permits.
- Use shape, icon, outline, and position in addition to color for start, goal, valid
  route, and errors. Maintain visible keyboard focus and announce concise state changes
  without narrating every dragged cell.
- Provide complete non-drag operation: step controls or Arrow keys, Undo, Reset, Hint,
  and confirmation. Do not make swipe gestures the only input.
- Hebrew UI uses `lang="he"` and `dir="rtl"`; mixed-direction dynamic labels may use
  `dir="auto"` as W3C guidance describes ([S011](sources.md#s011)). Do not mirror
  directional arrows or physical Arrow-key behavior merely because chrome is RTL.
- Portrait is primary. The board must fit without browser-page scrolling during an
  active trace; controls should remain reachable without shrinking cells below usable
  size. Landscape may be supported responsively but need not be the optimized layout.

## Research findings and open generation/solvability/performance questions

Ordinary mazes can be generated by carving passages or adding walls
([S004](sources.md#s004)). This does not prove that arbitrary silhouette masks and
directional constraints will be solvable or appropriately difficult.

Open implementation questions:

- Which generator constructs a valid path first, adds branches second, and proves at
  least one solution without leaking the answer?
- Must every level have exactly one solution, and is uniqueness worth the validation
  cost for the youngest difficulty bands?
- How are silhouettes normalized so narrow ears, tails, and arrow tips do not create
  unusable cells or disconnected regions?
- Is each level derived from a stable seed and generator version so offline replay and
  progress are deterministic?
- Which metrics reliably order difficulty for children, and how will they be calibrated
  without timers or punitive telemetry?
- What maximum board size preserves touch targets and frame responsiveness on small
  portrait phones?
