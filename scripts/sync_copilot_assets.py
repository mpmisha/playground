#!/usr/bin/env python3
"""One-way snapshots of the four Playground-owned Copilot assets.

No flags means a read-only check. Exit codes: 0 = synchronized, 1 = drift,
2 = invalid input or an I/O error. Sources are relative to this script, not cwd.
Only --apply writes. Do not edit managed destinations or run another installer
concurrently. Backups contain complete trees/file contents and file permissions;
filesystem timestamps, directory permissions, and extended attributes are not
part of the snapshot contract.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from datetime import datetime, timezone
import errno
import os
from pathlib import Path
import stat
import sys
import tempfile


SOURCE_ROOT = Path(__file__).resolve().parent.parent
AGENTS = {
    "playground-orchestrator.agent.md": "Playground Orchestrator",
    "game-creator.agent.md": "Game Creator",
    "playground-docs-keeper.agent.md": "Playground Docs Keeper",
}
SKILL = Path("skills/new-game-orchestration")
LEGACY_SKILL = Path("skills/New-Game-Orchestration")
MANAGED = tuple(Path("agents") / name for name in AGENTS) + (SKILL,)


class AssetError(Exception):
    """An unsafe layout, malformed definition, or failed synchronization."""


@dataclass
class Snapshot:
    # None denotes a directory, including empty directories; "." is the root.
    entries: dict[Path, bytes | None]
    file_modes: dict[Path, int]


def read_snapshot(path: Path, directory: bool) -> Snapshot | None:
    """Read only regular files/directories. Never accept an asset symlink."""
    try:
        root_stat = path.lstat()
    except FileNotFoundError:
        return None
    if stat.S_ISLNK(root_stat.st_mode):
        raise AssetError(f"Unsafe asset symlink: {path}")
    expected_kind = stat.S_ISDIR if directory else stat.S_ISREG
    if not expected_kind(root_stat.st_mode):
        raise AssetError(f"Expected {'directory' if directory else 'regular file'}: {path}")

    entries = {}
    modes = {}

    def visit(node: Path, relative: Path) -> None:
        info = node.lstat()
        if stat.S_ISLNK(info.st_mode):
            raise AssetError(f"Unsafe asset symlink: {node}")
        if stat.S_ISDIR(info.st_mode):
            entries[relative] = None
            for child in sorted(node.iterdir()):
                visit(child, relative / child.name)
        elif stat.S_ISREG(info.st_mode):
            entries[relative] = node.read_bytes()
            modes[relative] = stat.S_IMODE(info.st_mode)
        else:
            raise AssetError(f"Unexpected file kind: {node}")

    visit(path, Path("."))
    return Snapshot(entries, modes)


def require_directory(path: Path, *, missing_ok=False, allow_symlink=False) -> None:
    try:
        info = path.lstat()
    except FileNotFoundError:
        if missing_ok:
            return
        raise AssetError(f"Missing source directory: {path}")
    if stat.S_ISLNK(info.st_mode):
        if not allow_symlink:
            raise AssetError(f"Unsafe directory symlink: {path}")
        try:
            info = path.stat()
        except OSError as error:
            raise AssetError(f"Invalid parent directory symlink {path}: {error}") from error
    if not stat.S_ISDIR(info.st_mode):
        raise AssetError(f"Expected directory: {path}")


def validate_definition(data: bytes, name: str, path: Path, *, skill=False) -> None:
    """Validate our deliberately small frontmatter format, not arbitrary YAML."""
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as error:
        raise AssetError(f"Definition is not UTF-8: {path}") from error
    lines = text.splitlines()
    prefix = ["---", f"name: {name}", "description: >-"]
    if lines[:3] != prefix or "---" not in lines[3:]:
        raise AssetError(f"Malformed definition {path}: expected name '{name}' and folded description")
    end = lines.index("---", 3)
    description = lines[3:end]
    if (not description or not any(line.strip() for line in description)
            or any(not line.startswith("  ") for line in description)
            or not "\n".join(lines[end + 1:]).strip()):
        raise AssetError(f"Malformed description/body: {path}")
    if (skill and len(lines) >= 500) or (not skill and len(text) > 30000):
        raise AssetError(f"Definition exceeds its size limit: {path}")


def load_sources(root: Path) -> dict[Path, Snapshot]:
    github = root / ".github"
    for directory in (github, github / "agents", github / "skills"):
        require_directory(directory)
    sources = {}
    for relative in MANAGED:
        path = github / relative
        if relative.name not in {child.name for child in path.parent.iterdir()}:
            raise AssetError(f"Missing exact source asset name: {path}")
        snapshot = read_snapshot(path, relative == SKILL)
        if snapshot is None:
            raise AssetError(f"Missing source asset: {path}")
        document = Path("SKILL.md") if relative == SKILL else Path(".")
        data = snapshot.entries.get(document)
        if data is None:
            raise AssetError(f"Missing or non-file source definition: {path / document}")
        name = "new-game-orchestration" if relative == SKILL else AGENTS[relative.name]
        validate_definition(data, name, path / document, skill=relative == SKILL)
        sources[relative] = snapshot
    return sources


def resolved(path: Path) -> Path:
    try:
        return path.resolve()
    except RuntimeError as error:
        raise AssetError(f"Cannot resolve path {path}: {error}") from error


def overlaps(first: Path, second: Path) -> bool:
    return first == second or first in second.parents or second in first.parents


def validate_layout(home: Path, root: Path) -> tuple[Path, ...]:
    # These parent directory symlinks are intentional on some personal installs.
    for parent in (home, home / "agents", home / "skills"):
        require_directory(parent, missing_ok=True, allow_symlink=True)
    agents, skills, backups = (resolved(home / name)
                               for name in ("agents", "skills", "playground-backups"))
    if any(overlaps(first, second) for first, second in
           ((agents, skills), (agents, backups), (skills, backups))):
        raise AssetError("Agents, skills, and playground-backups must be separate, non-overlapping directories")
    source = resolved(root / ".github")
    if any(overlaps(path, source) for path in (agents, skills, backups)):
        raise AssetError("Personal installation/backup directories must not overlap canonical .github sources")
    return resolved(home), agents, skills, backups


def read_targets(home: Path) -> dict[Path, Snapshot | None]:
    # Case-insensitive macOS volumes alias the legacy and canonical spellings.
    # Inspect directory entries rather than mistaking that alias for two assets.
    names = {}
    for bucket in ("agents", "skills"):
        try:
            names[bucket] = {child.name for child in (home / bucket).iterdir()}
        except FileNotFoundError:
            names[bucket] = set()
    targets = {}
    for relative in (*MANAGED, LEGACY_SKILL):
        path = home / relative
        if relative.name in names[relative.parts[0]]:
            targets[relative] = read_snapshot(path, relative in (SKILL, LEGACY_SKILL))
            continue
        try:
            path.lstat()
        except FileNotFoundError:
            pass
        else:
            counterpart = LEGACY_SKILL if relative == SKILL else SKILL
            if relative not in (SKILL, LEGACY_SKILL) or counterpart.name not in names["skills"]:
                raise AssetError(f"Unexpected differently-cased asset aliases {path}; refusing replacement")
        targets[relative] = None
    return targets


def write_snapshot(snapshot: Snapshot, path: Path) -> None:
    """Create exclusively from validated bytes; never follow a source symlink."""
    path.parent.mkdir(parents=True, exist_ok=True)
    for relative, data in sorted(snapshot.entries.items(), key=lambda item: (len(item[0].parts), item[0])):
        target = path / relative
        if data is None:
            target.mkdir()
        else:
            with target.open("xb") as stream:
                stream.write(data)
            target.chmod(snapshot.file_modes[relative])


def remove_asset(path: Path, directory: bool) -> None:
    """Remove one validated, explicitly named asset, not a parent or wildcard."""
    snapshot = read_snapshot(path, directory)
    if snapshot is None:
        return
    for relative, data in sorted(snapshot.entries.items(),
                                 key=lambda item: (len(item[0].parts), item[0]), reverse=True):
        target = path / relative
        if data is None:
            target.rmdir()
        else:
            target.unlink()


def recovery_text(home: Path, run: Path, changes: list[Path],
                  originals: dict[Path, Snapshot | None]) -> str:
    lines = [
        "Playground Copilot snapshot recovery",
        "All backups listed below were verified before changing active assets.",
        f"Copilot home: {home}",
        "",
        "Stop Copilot and other editors/installers before recovery.",
        "Move aside only each current managed destination outside agents/skills,",
        "then copy the complete saved file/tree to its exact destination below.",
        "Keep the parent agents/skills directory symlinks; do not replace them.",
        "Do not merge skill directories: restore the complete original tree.",
        "",
    ]
    for relative in changes:
        if originals[relative] is None:
            lines.append(f"Originally absent: {home / relative} (remove this new snapshot to undo).")
        else:
            lines.append(f"Restore: {run / relative} -> {home / relative}")
    lines.extend([
        "",
        "Legacy recovery may restore the old name New-Game-Orchestration.",
        "Before resuming Copilot, keep only the intended active skill name, not both.",
        "Never copy RECOVERY.txt or .staged into active discovery directories.",
        "After editing canonical repo sources, --check reports personal drift.",
    ])
    return "\n".join(lines) + "\n"


def apply_changes(root: Path, home: Path, sources: dict[Path, Snapshot],
                  originals: dict[Path, Snapshot | None], changes: list[Path],
                  layout: tuple[Path, ...]) -> None:
    backup_root = home / "playground-backups"
    require_directory(backup_root, missing_ok=True)
    backup_root_existed = backup_root.exists()
    backup_root.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S.%fZ-")
    run = Path(tempfile.mkdtemp(prefix=stamp, dir=backup_root))
    staged = run / ".staged"
    print(f"Preparing snapshots outside discovery directories: {run}")
    touched = []
    try:
        # Stage every source and back up every original before replacing ANY asset.
        for relative in changes:
            original = originals[relative]
            directory = relative in (SKILL, LEGACY_SKILL)
            if original is not None:
                write_snapshot(original, run / relative)
                if read_snapshot(run / relative, directory) != original:
                    raise AssetError(f"Backup verification failed: {run / relative}")
                print(f"Saved original: {run / relative}")
            if relative in sources:
                write_snapshot(sources[relative], staged / relative)
                if read_snapshot(staged / relative, directory) != sources[relative]:
                    raise AssetError(f"Staging verification failed: {staged / relative}")
        (run / "RECOVERY.txt").write_text(recovery_text(home, run, changes, originals), encoding="utf-8")

        if (validate_layout(home, root) != layout or load_sources(root) != sources
                or read_targets(home) != originals):
            raise AssetError("Sources or destinations changed during staging; retry without concurrent edits")

        for relative in changes:
            target = home / relative
            directory = relative in (SKILL, LEGACY_SKILL)
            if read_snapshot(target, directory) != originals[relative]:
                raise AssetError(f"Destination changed before replacement: {target}")
            target.parent.mkdir(parents=True, exist_ok=True)
            touched.append(relative)
            if directory:
                remove_asset(target, True)
            if relative in sources:
                try:
                    # Regular-file replacement stays atomic on the same filesystem.
                    os.replace(staged / relative, target)
                except OSError as error:
                    if error.errno != errno.EXDEV:
                        raise
                    # Symlinked parents may be on another filesystem. Backups
                    # are already complete; exclusive copying is rollback-safe.
                    print(f"Cross-filesystem snapshot copy: {target}")
                    remove_asset(target, directory)
                    write_snapshot(sources[relative], target)

        if read_targets(home) != {**sources, LEGACY_SKILL: None}:
            raise AssetError("Installed snapshot verification failed")
    except (OSError, AssetError) as error:
        rollback_errors = []
        if touched:
            try:
                if validate_layout(home, root) != layout:
                    raise AssetError("Directory layout changed; refusing rollback into different targets")
                for relative in reversed(touched):
                    try:
                        target = home / relative
                        directory = relative in (SKILL, LEGACY_SKILL)
                        if read_snapshot(target, directory) == originals[relative]:
                            continue
                        remove_asset(target, directory)
                        if originals[relative] is not None:
                            write_snapshot(originals[relative], target)
                        if read_snapshot(target, directory) != originals[relative]:
                            raise AssetError(f"Rollback verification failed: {target}")
                    except (OSError, AssetError) as rollback_error:
                        rollback_errors.append(f"{relative}: {rollback_error}")
            except (OSError, AssetError) as rollback_error:
                rollback_errors.append(str(rollback_error))
        state = "Original managed assets restored." if touched else "Active assets were not changed."
        if rollback_errors:
            state = "ROLLBACK INCOMPLETE: " + "; ".join(rollback_errors)
        raise AssetError(
            f"Apply failed: {error}\n{state}\n"
            f"Retained recovery/staging directory: {run}\n"
            "Use RECOVERY.txt if present for verified backups. If staging failed before it was written, "
            "active originals are unchanged; do not treat incomplete copies as backups."
        ) from error

    has_originals = any(originals[relative] is not None for relative in changes)
    try:
        remove_asset(staged, True)
        if not has_originals:
            (run / "RECOVERY.txt").unlink()
            run.rmdir()
            if not backup_root_existed:
                backup_root.rmdir()
    except (OSError, AssetError) as error:
        raise AssetError(
            f"Snapshots installed and verified, but staging cleanup failed: {error}\n"
            f"Inspect only this run's directory: {run}"
        ) from error
    if has_originals:
        print(f"Backups retained: {run}")
        print(f"Recovery instructions: {run / 'RECOVERY.txt'}")
    else:
        print("Fresh install: temporary staging removed; no originals needed a backup.")


def synchronize(root: Path, home: Path, *, apply=False) -> int:
    root, home = root.absolute(), home.expanduser().absolute()
    sources = load_sources(root)
    layout = validate_layout(home, root)
    originals = read_targets(home)
    expected = {**sources, LEGACY_SKILL: None}
    # Retire the old spelling first, also allowing a case-only migration on macOS.
    changes = [relative for relative in (LEGACY_SKILL, *MANAGED)
               if originals[relative] != expected[relative]]
    if not changes:
        print("All four Playground assets are in sync; no legacy duplicate. No writes.")
        return 0
    for relative in changes:
        status = "legacy duplicate" if relative == LEGACY_SKILL else (
            "missing" if originals[relative] is None else "drift")
        print(f"{status}: {home / relative}")
    if not apply:
        print("Read-only check; run with --apply to install snapshots with backups.")
        return 1
    apply_changes(root, home, sources, originals, changes, layout)
    print("All four Playground assets installed and verified; no legacy duplicate.")
    return 0


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    mode = parser.add_mutually_exclusive_group()
    mode.add_argument("--check", action="store_true", help="read-only check (the default)")
    mode.add_argument("--apply", action="store_true", help="install this explicit set, backing up replaced originals")
    parser.add_argument("--copilot-home", type=Path, default=Path.home() / ".copilot",
                        help="personal install directory (default: ~/.copilot)")
    args = parser.parse_args(argv)
    try:
        return synchronize(SOURCE_ROOT, args.copilot_home, apply=args.apply)
    except (OSError, AssetError) as error:
        print(f"ERROR: {error}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
