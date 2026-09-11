# playground-resercher — standalone research guide

Use **`playground-resercher`** before design or implementation to investigate a game,
variant, or concept and build a reusable, evidence-linked game knowledge base.
The spelling is intentional. The [canonical agent profile](../../.github/agents/playground-resercher.agent.md)
defines the full workflow and output schema. This guide is not evidence of a completed research run.

## Manual use

In a host that has loaded the profile, select it explicitly:

```sh
copilot --agent playground-resercher
```

Then supply a request, for example:

> Research Sokoban for Playground; prepare its pre-design knowledge base.

Other prompt examples (replace the URL placeholder with a public reference):

- **Concept:** “Research a turn-free color-matching concept for younger children;
  compare analogous mechanics without inventing canonical rules.”
- **Reference URL:** “Research the game at `<public-reference-url>` for Playground;
  compare its rules, controls, and recovery options with other versions.”

A new session or agent reload may be needed after installation or an update.
The agent is user-invocable, with automatic model invocation disabled; it has no
model/tool overrides and uses only capabilities available in its host.

## Optional inputs and scope

Optionally specify the variant/public URL, audience/reading assumptions, device or
language focus, rules/visual priorities, research budget, checkout, and output root.
The default audience assumption is younger children in short, calm mobile sessions.
The agent reports scope, assumptions, a bounded search plan, and its stopping reason;
coverage is not a promise of exhaustive research.

## What a requested research run produces

In an explicitly identified, writable Playground checkout, use
`docs/research/<game-slug>/` with a short lowercase hyphenated slug. Otherwise, use
`<game-slug>/` under a user-approved output root or host-provided session-artifact root.
If neither is available, the agent asks before writing—not into an unrelated repository
or its installation directory.

```text
docs/research/<game-slug>/
  README.md                 # overview, readiness, scope, coverage, navigation
  rules.md                  # detailed gameplay, variants, edge cases, worked example
  versions-and-visuals.md    # comparison and annotated, source-linked visual gallery
  sources.md                # source ledger, access log, conflicts
  handoff.md                # nonbinding options, decisions/gaps, acceptance considerations
  assets/
    manifest.json           # visual provenance, inspection, rights, storage inventory
    V001-<version>-<state>.png  # optional: cleared AND publication-authorized
```

The same files apply outside the hub. No bundles or placeholder images are created
just to install/document the agent. The session report includes the entry point,
readiness/reason, actual coverage, findings, open decisions, validation, and limitations.

## Sources and visual evidence

- Claims link to stable source **S001…**, version/analogue **E001…**, and visual
  **V001…** IDs. Source pages—not search snippets alone—support findings.
- Distinguish **Verified (documented)**, **Verified (observed)**, **Inferred**, and
  **Proposed**, with confidence and reasons. Preserve version differences/conflicts.
- The agent must attempt to obtain and visually inspect real screenshots/images
  from existing versions. It never fabricates screenshots or copies production assets.
  Missing or inaccessible evidence is recorded honestly; **linked-only** references
  and uninspected images do not count as inspected visual evidence.
- Captions say **image-only observation** unless actual interaction occurred.
  A screenshot cannot establish hidden rules, solvability, or unobserved behavior.
- The manifest records provenance, source/version/state, inspection status, rights,
  storage, and gaps; saved images also need measured dimensions and a file hash.

**Shareable versus local-only:** repository images require established redistribution
rights **and explicit user authorization for that publication use**. Public availability
is not a license. Rights-uncertain/non-redistributable images stay in permitted
local-only evidence storage **outside the repository**; if retention is not allowed,
retain only safe source links/metadata and record the gap.

Public Markdown links source pages and labels local-only evidence; it must not embed
private files, hotlink uncertain images, or expose private paths/tokens. The manifest
uses storage tiers and root-relative paths; any private evidence-root mapping is
reported only in session text. Storage permission does not authorize publication.

## How to interpret readiness

| Status | Meaning |
| --- | --- |
| **ready for design** | Core rules/identity, useful visuals, and comparisons are supported, with no critical evidence, rights, or authority gaps; nonblocking gaps remain listed. |
| **provisional** | Useful findings exist, but specific unverified rules, missing visuals/variants, or unavailable live context constrain decisions. |
| **blocked** | Ambiguity, access/rights/output permission, or missing critical evidence prevents a sound handoff; the required resolution is named. |

Without a visually inspected authentic image, research is **not ready for design**.
Live play is not mandatory if documented rules and authentic inspected images suffice;
the image-only limitation must still be explicit. Acceptance considerations are
observable research-derived inputs, not finalized requirements or executable tests.

## Boundaries and maintenance

This agent remains **standalone and manual-only**. Playground Orchestrator integration
is deferred: no orchestrated trigger, skill, automatic delegation, or downstream launch.
Every status is a **research handoff, not design approval**. The researcher does not
finalize designs, create prototypes, implement games, or write tests. No commit, push,
upload, publication, or deployment follows automatically; the user chooses the next step.

Maintain the linked repository profile as the source of truth. The personal
`~/.copilot/agents/playground-resercher.agent.md` is an installed **regular-file
snapshot**, never the authority or a worktree symlink; refresh it separately through
an authorized installation/update process. This guide performs no installation.
Research updates preserve useful evidence and stable IDs in the agreed per-game
bundle; the researcher does not edit this guide, platform indexes, or agent profiles.
