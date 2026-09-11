# Playground agent tooling

[Back to the Playground README](../README.md#copilot-tooling)

## One editable source, global availability

**The Playground repo is the main and only editable source of truth** for its
agents, orchestration skill, and GitHub Actions workflow definitions. Make changes
here through the normal branch/review flow.

Personal `~/.copilot/agents` and `~/.copilot/skills` copies are installed snapshots,
not a competing source. They make the Playground agents and skill available
globally, including while working in independent game repos. **Do not edit these
global copies.** Before applying a refresh, move any intentional existing personal
edits into the corresponding repository sources and review them there.

GitHub Actions workflows are different: they remain in this repo and are never
installed into personal Copilot directories.

This repository is public. Keep credentials, private/internal configuration, and
machine-specific paths out of the canonical sources and this guide.

## Canonical assets

| Repository source | Responsibility |
| --- | --- |
| [`.github/agents/playground-orchestrator.agent.md`](../.github/agents/playground-orchestrator.agent.md) | Coordinator: plans and delegates Playground work. |
| [`.github/agents/playground-resercher.agent.md`](../.github/agents/playground-resercher.agent.md) | Pre-design researcher: builds evidence-linked game knowledge bases before new-game design or implementation. |
| [`.github/agents/game-creator.agent.md`](../.github/agents/game-creator.agent.md) | Developer: implements games and hub changes. |
| [`.github/agents/playground-docs-keeper.agent.md`](../.github/agents/playground-docs-keeper.agent.md) | Documentation-only knowledge-base owner. |
| [`.github/skills/new-game-orchestration/SKILL.md`](../.github/skills/new-game-orchestration/SKILL.md) | Agent orchestration for creating a game; canonical name is `new-game-orchestration`, with `[New Game]`, `(new game)`, and natural-language new-game requests retained as triggers. |
| [`.github/workflows/pages.yml`](../.github/workflows/pages.yml) | Existing GitHub Pages deployment workflow; unchanged by this migration. |
| [`.github/workflows/copilot-assets.yml`](../.github/workflows/copilot-assets.yml) | Focused agent-assets and installer CI validation, separate from gameplay and deployment orchestration. |
| [`scripts/sync_copilot_assets.py`](../scripts/sync_copilot_assets.py) | Explicit, one-way repository → personal snapshot installer; Python 3.9+ standard library only. |
| [`tests/test_copilot_assets.py`](../tests/test_copilot_assets.py) | Agent-assets and installer tests. |

The four Playground agent roles above are canonical. The standalone
`playground-resercher` agent is required by the New Game skill before Game Creator
design or implementation; it produces research evidence and does not implement
games or automatically launch downstream work. The New Game skill is an agent
workflow, not a GitHub Actions workflow or a replacement for Pages deployment.

The skill folder and its `name` must use lowercase kebab-case; keep both as
`new-game-orchestration`.

## Discovery: repository versus personal

- **Inside Playground:** native repository discovery uses
  `.github/agents/*.agent.md` and `.github/skills/<name>/SKILL.md`.
- **Across repositories:** explicitly install the four agent files into
  `~/.copilot/agents/` with their existing filenames, and the whole
  `new-game-orchestration` skill directory, including bundled resources, into
  `~/.copilot/skills/`. Repository discovery alone does not provide this global
  availability.

Discovery depends on the Copilot host and session. Do not assume a particular
precedence when repository and personal definitions have the same name: keeping
the snapshots in sync avoids conflicting versions. Refresh discovery after changes
as described below; agent-profile and skill reloads are distinct.

Official references: [custom agents](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/create-custom-agents),
[agent skills](https://docs.github.com/en/copilot/concepts/agents/about-agent-skills),
and [Copilot CLI skills](https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-skills).

## Install or refresh explicitly

Use Python 3.9 or newer for both the installer and tests.

Run these commands from the Playground checkout containing the reviewed source
you want to install. The installer anchors its sources to its own Playground
checkout, not to whichever independent game repo you might otherwise be working
in.

1. Pull the reviewed repository updates. If you intentionally changed a personal
   copy, reconcile that change into the repository through branch/review **before**
   applying anything.
2. Check the current personal installation without writing:

   ```bash
   python3 scripts/sync_copilot_assets.py --check
   ```

   Omitting the flag also defaults to this read-only check. Exit `0` means in
   sync; exit `1` means drift, missing managed assets, or the active legacy
   `New-Game-Orchestration` skill. Explicit errors are reported with a nonzero
   exit status.
3. After reviewing the source and any drift, install or refresh:

   ```bash
   python3 scripts/sync_copilot_assets.py --apply
   python3 scripts/sync_copilot_assets.py --check
   ```

4. Refresh discovery after installation:
   - **Agent profiles:** start a fresh Copilot session or use an agent-profile
     reload explicitly supported by your host.
   - **CLI skills:** start a new CLI session or run `/skills reload`. Use
     `/skills info new-game-orchestration` to check the loaded skill location.
     `/skills reload` refreshes skills only, **not agent profiles**.
5. From a directory **outside Playground**, such as an independent game repo,
   verify global skill discovery after installation:

   ```bash
   copilot skill list --json
   ```

   Confirm `new-game-orchestration` appears with source `personal-copilot` and the
   legacy `New-Game-Orchestration` entry is no longer active. This checks skill
   discovery, not agent-profile loading or refresh of an existing session.

`--apply` installs only the three named agents and the `new-game-orchestration`
skill, including its bundled resources. It leaves unrelated agents and skills
alone and is a no-op when already in sync. The legacy `New-Game-Orchestration`
skill is retired into backups outside active discovery, not left alongside the
canonical lowercase-kebab name.

Use `--copilot-home PATH` with either mode to target an isolated test home instead
of `~/.copilot`; its backups also stay under that selected home.

Cloning, pulling, and CI do **not** install into your personal Copilot home. There
is no live auto-sync: explicitly check and apply after reviewed source updates.
This guide describes the procedure, not evidence that it has already been run on
any particular machine.

## Backups, recovery, and filesystem safety

Before replacing changed existing managed assets, `--apply` backs them up under
`<copilot-home>/playground-backups/<unique timestamp>/`. Retired legacy skill
content goes there too. This directory is deliberately **outside** active
`agents/` and `skills/` discovery.

- **Recover edits to keep:** inspect the saved content in the backup directory,
  port the intended changes into the canonical repository sources, review them,
  then refresh the installed snapshots.
- **Temporary local rollback:** restore the saved managed agent file or skill
  directory to its corresponding installed location, replacing the current
  snapshot rather than adding a second profile. Expect `--check` to report drift
  until you reconcile it with the repository. Do not restore the legacy
  `New-Game-Orchestration` skill alongside `new-game-orchestration`.
- **Keep backups inactive:** never put backup `.agent.md` files or directories
  containing backup `SKILL.md` files under personal `agents/` or `skills/`.
  Keep the recovery archive in `playground-backups/`.

Active installed assets are regular snapshot files, not symlinks into a checkout
or temporary worktree. Preserve existing symlinked parent directories, such as a
cloud-synced Copilot home; do not replace them to refresh assets. Avoid absolute,
per-machine symlinks into the repository: global tooling must not depend on that
worktree continuing to exist.

## Validate tooling changes

From the Playground checkout:

```bash
python3 -m unittest discover -s tests -p 'test_copilot_assets.py'
```

The focused `copilot-assets.yml` CI workflow validates the tooling; it does not
globally install agents or skills, run the New Game orchestration, or replace the
existing `pages.yml` deployment workflow. Use `--copilot-home PATH` for isolated
manual installer checks rather than experimenting on your personal installation.
