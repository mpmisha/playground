---
name: new-game-orchestration
description: >-
  Coordinate a new kids' game for the Playground hub. Use when the prompt
  contains [New Game] or (new game), or asks to build/create a game for
  Playground. Hands implementation to Game Creator, preserving the shared
  design system and calm rules through local validation, registration, and
  deployment only when in scope and authorized.
---

# New Game Orchestration

## Authority and workspace

This skill's source is **`mpmisha/playground/.github/skills/new-game-orchestration/SKILL.md`**.
Authoritative agents are in `.github/agents/`; GitHub Actions are in
`.github/workflows/`. Personal `~/.copilot/agents` and `~/.copilot/skills` copies
are generated snapshots for cross-repository use, never editable sources.
Use `python3 scripts/sync_copilot_assets.py --check` from the explicitly located
Playground checkout to inspect drift; an authorized `--apply` installs the
canonical lowercase name and backs up/retires legacy `New-Game-Orchestration`.
Do not invent a precedence guarantee between project and personal discovery.

Resolve an explicit provided checkout or the current workspace with
`git rev-parse --show-toplevel`, then verify `git remote -v` identifies the
intended repository. Do not assume cwd is the hub. Outside Playground, use an
explicitly located hub checkout or read `https://github.com/mpmisha/playground`
for canonical definitions/context. Ask for a location before hub writes if none
is authorized; never operate in someone else's main checkout by assumption.
Resolve game/reference checkouts similarly, without private filesystem paths.

Read applicable repository instructions. Preserve the managed session's branch,
worktree, existing changes, file ownership, and higher-priority task boundaries.
This skill is not standing approval to commit, push, publish, or install assets.
Read existing knowledge-base notes if present; a checkout may only contain
`docs/screenshots`. Fall back to `README.md`, `shared/ADDING_A_GAME.md`, and actual
code rather than requiring or inventing missing Markdown documents.

## What Game Creator owns

**Game Creator**, defined in `.github/agents/game-creator.agent.md` in the hub,
holds the complete platform context and tokens. It:

1. **Designs** a tiny loop for smaller kids: no ads, purchases, timers, streak
   pressure, behavioral tracking, or scary game-over; forgiving input, gentle
   mutable sound, portrait touch play, and offline support.
2. **Enforces one shared look:** Baloo 2, `#20264f` twilight, beveled-candy blocks,
   shared palettes and panel/toggle/button kit. The canonical template is the
   public `mpmisha/block-grid-kids` repo's `web/` port, read from an explicitly
   resolved reference checkout or permitted public source.
3. **Scaffolds** a self-contained static PWA in its own authorized game repo,
   preferably at the site root: HTML/CSS, fresh engine/render modules, reused
   `color.js` / `audio.js` / `skins.js` / `storage.js`, manifest, complete
   cache-first SW, original icons, and a repository Pages workflow.
4. **Preserves cross-cutting behavior:** English + Hebrew/RTL (`i18n.js`, Fredoka
   for Hebrew, hub-only language selection, same-origin stored/live propagation);
   shared sound/haptics and synchronous silent-buffer iOS audio unlock;
   byte-identical privacy-first aggregate `telemetry.js` honoring DNT, Global
   Privacy Control, and opt-out; and the `?hub=` / `playground:back` iframe
   `postMessage` handshake.
5. **Registers** one game in the verified hub checkout's `games.json`, preserving
   existing entries and matching actual served paths.
6. **Deploys when authorized:** creates the public game repo, pushes through the
   requested branch/release process, enables Pages, integrates the hub registry,
   and verifies both sites. No deployment is presumed; local-only requests stop
   after implementation/tests with remaining release steps clearly reported.

## Orchestrator steps

1. Clarify only genuine concept/scope ambiguity with one focused question.
   Identify exact game/hub locations, allowed files, and publication authority.
2. Delegate one bounded implementation task to **Game Creator**, including the
   idea, constraints, platform standards, branch/worktree rules, and definition
   of done. Use the available agent hand-off tool or hand off explicitly by name.
   If already acting as Game Creator, execute its scoped workflow rather than
   delegating recursively. If delegation is unavailable or prohibited, report
   that boundary; do not silently spawn a substitute or bypass task ownership.
3. Track progress in the current session. No generic project-manager agent,
   external service, private MCP configuration, or additional specialist is a
   required dependency. Relay any focused clarification back to the user.
4. Verify Game Creator's evidence against scope: syntax and gameplay checks,
   both locales on a notched mobile viewport, chrome mirroring/no clipping,
   first-gesture audio, touch/portrait/offline, iframe return, and valid registry.
   Runtime changes need a suitable cache bump and complete precache list;
   **docs/agent metadata/tooling-only work needs neither an SW bump nor a deploy**.
5. For an authorized release, require observed game/hub Actions results and live
   HTTP checks. Report exact failures and recovery steps, never partial success
   as a completed release. Do not claim a feature-branch push deployed Pages.
6. Relay the final report: game repo URL, live game URL, hub URL, registry entry,
   validations, publication status, and follow-ups. Suggest phone testing through
   **Add to Home Screen**. If a documentation refresh is requested and permitted,
   give **Playground Docs Keeper** a separate bounded hand-off; do not edit its files.

## Completion criteria

- Game code stays in its own repo; the hub remains a menu, not a game container.
- Shared design tokens, calm rules, i18n, audio/haptics, privacy gates, offline
  shell, and same-origin handshake are preserved rather than simplified away.
- Validation evidence distinguishes passed, failed, and unrun checks.
- Branch/worktree boundaries and current authorization are respected.
- Personal generated definitions are not edited; canonical role names are
  **Playground Orchestrator**, **Game Creator**, and **Playground Docs Keeper**.
