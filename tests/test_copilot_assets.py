"""Focused, isolated stdlib tests; never installs into the real Copilot home."""

from contextlib import redirect_stderr, redirect_stdout
import errno
import io
import os
from pathlib import Path
import re
import shutil
import stat
import subprocess
import sys
import tempfile
import unittest
from unittest import mock


ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(ROOT / "scripts"))
import sync_copilot_assets as sync


AGENT_FILES = (
    "playground-orchestrator.agent.md",
    "game-creator.agent.md",
    "playground-docs-keeper.agent.md",
)


def contents(path):
    """Independent disk evidence, including empty dirs and un-followed symlinks."""
    if path.is_symlink():
        return ("symlink", os.readlink(path))
    if not path.exists():
        return None
    if path.is_file():
        return path.read_bytes()
    if path.is_dir():
        return {child.name: contents(child) for child in sorted(path.iterdir())}
    return ("special", stat.S_IFMT(path.lstat().st_mode))


def metadata(path):
    return {str(item.relative_to(path)): (item.lstat().st_mode, item.lstat().st_mtime_ns,
                                         item.lstat().st_ino)
            for item in (path, *path.rglob("*"))}


class CopilotSyncTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory(prefix="playground-assets-test-")
        self.addCleanup(self.temporary.cleanup)
        self.base = Path(self.temporary.name)
        self.repo = self.base / "source"
        self.home = self.base / "copilot-home"
        self.github = self.repo / ".github"
        (self.github / "agents").mkdir(parents=True)
        for name in AGENT_FILES:
            shutil.copy2(ROOT / ".github/agents" / name, self.github / "agents" / name)
        shutil.copytree(ROOT / ".github" / sync.SKILL, self.github / sync.SKILL)

    def call(self, *arguments):
        output = io.StringIO()
        with mock.patch.object(sync, "SOURCE_ROOT", self.repo), redirect_stdout(output), redirect_stderr(output):
            result = sync.main(["--copilot-home", str(self.home), *arguments])
        return result, output.getvalue()

    def install(self):
        code, output = self.call("--apply")
        self.assertEqual(code, 0, output)
        self.assert_installed()

    def assert_installed(self):
        for name in AGENT_FILES:
            target = self.home / "agents" / name
            self.assertFalse(target.is_symlink())
            self.assertEqual(target.read_bytes(), (self.github / "agents" / name).read_bytes())
        self.assertFalse((self.home / sync.SKILL).is_symlink())
        self.assertEqual(contents(self.home / sync.SKILL), contents(self.github / sync.SKILL))
        # exists() alone aliases these spellings on case-insensitive macOS disks.
        names = {path.name for path in (self.home / "skills").iterdir()}
        self.assertIn(sync.SKILL.name, names)
        self.assertNotIn(sync.LEGACY_SKILL.name, names)

    def backup_runs(self):
        root = self.home / "playground-backups"
        return sorted(root.iterdir()) if root.exists() else []

    def change_agents(self):
        originals = {}
        for name in AGENT_FILES[:2]:
            path = self.home / "agents" / name
            data = f"Personal original for {name}\n".encode()
            path.write_bytes(data)
            originals[name] = data
        return originals

    def test_default_and_explicit_check_are_read_only_for_missing_home(self):
        for arguments in ((), ("--check",)):
            with self.subTest(arguments=arguments):
                code, output = self.call(*arguments)
                self.assertEqual(code, 1, output)
                self.assertIn("Read-only check", output)
                self.assertFalse(self.home.exists())

    def test_fresh_install_copies_complete_resources_as_regular_snapshots(self):
        skill = self.github / sync.SKILL
        (skill / "references/empty").mkdir(parents=True)
        (skill / "references/notes.md").write_text("Game notes\n", encoding="utf-8")
        (skill / "assets").mkdir()
        (skill / "assets/palette.bin").write_bytes(b"\x00\xff\x80\x01")
        (skill / "scripts").mkdir()
        helper = skill / "scripts/helper.py"
        helper.write_text("print('example')\n", encoding="utf-8")
        helper.chmod(0o755)
        self.install()
        self.assertEqual(stat.S_IMODE((self.home / sync.SKILL / "scripts/helper.py").stat().st_mode), 0o755)
        self.assertTrue((self.home / sync.SKILL / "references/empty").is_dir())
        self.assertFalse((self.home / "playground-backups").exists())
        for path in (self.home / sync.SKILL).rglob("*"):
            self.assertFalse(path.is_symlink())
        # Snapshots remain usable after removal of the checkout they came from.
        installed = contents(self.home)
        shutil.rmtree(self.repo)
        self.assertEqual(contents(self.home), installed)

    def test_noop_check_and_apply_do_not_write_or_make_backups(self):
        self.install()
        before = contents(self.home)
        before_metadata = metadata(self.home)
        for arguments in ((), ("--check",), ("--apply",), ("--apply",)):
            with self.subTest(arguments=arguments):
                code, output = self.call(*arguments)
                self.assertEqual(code, 0, output)
                self.assertIn("No writes", output)
                self.assertEqual(contents(self.home), before)
                self.assertEqual(metadata(self.home), before_metadata)
                self.assertEqual(self.backup_runs(), [])

    def test_chmod_only_resource_change_is_backed_up_installed_and_then_idempotent(self):
        relative = Path("scripts/helper.py")
        helper = self.github / sync.SKILL / relative
        helper.parent.mkdir()
        helper.write_bytes(b"#!/usr/bin/env python3\nprint('example')\n")
        helper.chmod(0o644)
        source_contents = contents(self.github / sync.SKILL)
        self.install()
        target = self.home / sync.SKILL / relative
        self.assertEqual(stat.S_IMODE(target.stat().st_mode), 0o644)
        before, before_metadata = contents(self.home), metadata(self.home)

        helper.chmod(0o755)
        self.assertEqual(contents(self.github / sync.SKILL), source_contents)
        code, output = self.call("--check")
        self.assertEqual(code, 1, output)
        self.assertIn("drift:", output)
        self.assertEqual(contents(self.home), before)
        self.assertEqual(metadata(self.home), before_metadata)
        self.assertEqual(self.backup_runs(), [])

        self.install()
        self.assertEqual(target.read_bytes(), helper.read_bytes())
        self.assertEqual(stat.S_IMODE(target.stat().st_mode), 0o755)
        run, = self.backup_runs()
        backup = run / sync.SKILL / relative
        self.assertEqual(contents(run / sync.SKILL), source_contents)
        self.assertEqual(backup.read_bytes(), helper.read_bytes())
        self.assertEqual(stat.S_IMODE(backup.stat().st_mode), 0o644)

        installed, installed_metadata = contents(self.home), metadata(self.home)
        for arguments in ((), ("--check",), ("--apply",), ("--apply",)):
            with self.subTest(arguments=arguments):
                code, output = self.call(*arguments)
                self.assertEqual(code, 0, output)
                self.assertIn("No writes", output)
                self.assertEqual(self.backup_runs(), [run])
                self.assertEqual(contents(self.home), installed)
                self.assertEqual(metadata(self.home), installed_metadata)

    def test_drift_check_preserves_existing_copies(self):
        self.install()
        self.change_agents()
        (self.home / sync.SKILL / "personal-notes.txt").write_text("keep me", encoding="utf-8")
        before, before_metadata = contents(self.home), metadata(self.home)
        code, output = self.call("--check")
        self.assertEqual(code, 1, output)
        self.assertIn("drift:", output)
        self.assertEqual(contents(self.home), before)
        self.assertEqual(metadata(self.home), before_metadata)
        self.assertEqual(self.backup_runs(), [])

    def test_changed_copies_have_complete_recoverable_backups_and_unique_runs(self):
        self.install()
        originals = self.change_agents()
        skill = self.home / sync.SKILL
        (skill / "SKILL.md").write_text("personal skill\n", encoding="utf-8")
        (skill / "private-resource/empty").mkdir(parents=True)
        (skill / "private-resource/data.bin").write_bytes(b"\xfe\x00original")
        before_skill = contents(skill)
        code, output = self.call("--apply")
        self.assertEqual(code, 0, output)
        self.assert_installed()
        runs = self.backup_runs()
        self.assertEqual(len(runs), 1)
        run = runs[0]
        self.assertRegex(run.name, r"^\d{8}T\d{6}\.\d{6}Z-[a-z0-9_]+$")
        self.assertIn(str(run), output)
        self.assertIn(str(run / "RECOVERY.txt"), output)
        for name, data in originals.items():
            self.assertEqual((run / "agents" / name).read_bytes(), data)
        self.assertEqual(contents(run / sync.SKILL), before_skill)
        self.assertFalse((run / "agents" / AGENT_FILES[2]).exists())
        self.assertFalse((run / ".staged").exists())
        recovery = (run / "RECOVERY.txt").read_text(encoding="utf-8")
        self.assertIn(str(self.home / sync.SKILL), recovery)
        self.assertIn("Do not merge skill directories", recovery)
        restored = self.base / "recovered"
        shutil.copytree(run / sync.SKILL, restored)
        self.assertEqual(contents(restored), before_skill)
        before, before_metadata = contents(self.home), metadata(self.home)
        self.assertEqual(self.call("--apply")[0], 0)
        self.assertEqual(contents(self.home), before)
        self.assertEqual(metadata(self.home), before_metadata)
        (self.home / "agents" / AGENT_FILES[0]).write_bytes(b"another original")
        self.assertEqual(self.call("--apply")[0], 0)
        self.assertEqual(len(self.backup_runs()), 2)
        self.assertEqual(contents(run / sync.SKILL), before_skill)

    def test_legacy_only_is_backed_up_and_retired_with_exact_lowercase_name(self):
        legacy = self.home / sync.LEGACY_SKILL
        shutil.copytree(self.github / sync.SKILL, legacy)
        (legacy / "SKILL.md").write_text("legacy personal skill\n", encoding="utf-8")
        (legacy / "resource.bin").write_bytes(b"\x00legacy")
        original = contents(legacy)
        before = contents(self.home)
        code, output = self.call("--check")
        self.assertEqual(code, 1, output)
        self.assertIn("legacy duplicate", output)
        self.assertEqual(contents(self.home), before)
        self.install()
        run, = self.backup_runs()
        self.assertEqual(contents(run / sync.LEGACY_SKILL), original)
        self.assertEqual({path.name for path in (run / "skills").iterdir()}, {sync.LEGACY_SKILL.name})
        self.assertIn("Originally absent:", (run / "RECOVERY.txt").read_text(encoding="utf-8"))
        self.assertEqual({path.name for path in (self.home / "skills").iterdir()}, {sync.SKILL.name})
        installed, installed_metadata = contents(self.home), metadata(self.home)
        for arguments in ((), ("--check",), ("--apply",), ("--check",), ("--apply",)):
            with self.subTest(arguments=arguments):
                code, output = self.call(*arguments)
                self.assertEqual(code, 0, output)
                self.assertIn("No writes", output)
                self.assert_installed()
                self.assertEqual(self.backup_runs(), [run])
                self.assertEqual(contents(self.home), installed)
                self.assertEqual(metadata(self.home), installed_metadata)

    def test_both_skill_names_retire_only_legacy_and_leave_identical_canonical_untouched(self):
        self.install()
        legacy = self.home / sync.LEGACY_SKILL
        try:
            same_directory = legacy.samefile(self.home / sync.SKILL)
        except FileNotFoundError:
            same_directory = False
        if same_directory:
            self.skipTest("Case-insensitive filesystem; case-only migration is covered separately")
        shutil.copytree(self.home / sync.SKILL, legacy)
        (legacy / "resource.txt").write_text("legacy extra", encoding="utf-8")
        original, canonical_metadata = contents(legacy), metadata(self.home / sync.SKILL)
        self.assertEqual(self.call("--check")[0], 1)
        code, output = self.call("--apply")
        self.assertEqual(code, 0, output)
        self.assert_installed()
        self.assertEqual(metadata(self.home / sync.SKILL), canonical_metadata)
        run, = self.backup_runs()
        self.assertEqual(contents(run / sync.LEGACY_SKILL), original)
        self.assertEqual({path.name for path in (run / "skills").iterdir()}, {sync.LEGACY_SKILL.name})
        installed, installed_metadata = contents(self.home), metadata(self.home)
        for arguments in (("--check",), ("--apply",)):
            with self.subTest(arguments=arguments):
                code, output = self.call(*arguments)
                self.assertEqual(code, 0, output)
                self.assertIn("No writes", output)
                self.assertEqual(self.backup_runs(), [run])
                self.assertEqual(contents(self.home), installed)
                self.assertEqual(metadata(self.home), installed_metadata)

    def test_unrelated_agents_skills_config_and_symlinks_are_untouched(self):
        other_agent = self.home / "agents/unrelated.agent.md"
        other_agent.parent.mkdir(parents=True)
        other_agent.write_bytes(b"Unrelated agent\n")
        other_skill = self.home / "skills/unrelated"
        other_skill.mkdir(parents=True)
        (other_skill / "SKILL.md").write_bytes(b"Unrelated skill\n")
        (other_skill / "extra.bin").write_bytes(b"\x00\xff")
        outside = self.base / "outside.txt"
        outside.write_bytes(b"Outside data")
        link = self.home / "agents/unrelated-link.agent.md"
        link.symlink_to(outside)
        config = self.home / "config.json"
        config.write_bytes(b'{"unrelated": true}\n')
        preserved = {path: contents(path) for path in (other_agent, other_skill, link, config, outside)}
        self.install()
        self.change_agents()
        self.install()
        for path, data in preserved.items():
            self.assertEqual(contents(path), data)

    def test_missing_source_rejected_before_any_existing_or_legacy_copy_changes(self):
        (self.github / "agents" / AGENT_FILES[-1]).unlink()
        target = self.home / "agents" / AGENT_FILES[0]
        target.parent.mkdir(parents=True)
        target.write_bytes(b"Keep the existing personal definition")
        legacy = self.home / sync.LEGACY_SKILL
        legacy.mkdir(parents=True)
        (legacy / "SKILL.md").write_bytes(b"Keep legacy too")
        before = contents(self.home)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Missing", output)
        self.assertEqual(contents(self.home), before)

    def test_missing_skill_document_rejected_before_any_changes(self):
        (self.github / sync.SKILL / "SKILL.md").unlink()
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("source definition", output)
        self.assertFalse(self.home.exists())

    def test_malformed_source_definitions_rejected_before_any_changes(self):
        document = self.github / sync.SKILL / "SKILL.md"
        original = document.read_bytes()
        bad_inputs = (
            b"",
            b"\xff",
            original.replace(b"name: new-game-orchestration", b"name: New-Game-Orchestration"),
            b"---\nname: new-game-orchestration\ndescription: >-\n  no closing marker\n",
            b"---\nname: new-game-orchestration\ndescription: >-\n  \n---\nbody\n",
            original + b"\n" * 500,
        )
        for bad in bad_inputs:
            with self.subTest(prefix=bad[:60]):
                document.write_bytes(bad)
                code, output = self.call("--apply")
                self.assertEqual(code, 2, output)
                self.assertIn("ERROR:", output)
                self.assertFalse(self.home.exists())

    def test_source_agent_symlink_is_not_followed(self):
        document = self.github / "agents" / AGENT_FILES[0]
        outside = self.base / "outside-agent.md"
        document.rename(outside)
        document.symlink_to(outside)
        before = outside.read_bytes()
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Unsafe asset symlink", output)
        self.assertEqual(outside.read_bytes(), before)
        self.assertFalse(self.home.exists())

    def test_source_parent_symlink_is_rejected(self):
        skills = self.github / "skills"
        other = self.base / "source-skills"
        skills.rename(other)
        skills.symlink_to(other, target_is_directory=True)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Unsafe directory symlink", output)
        self.assertFalse(self.home.exists())

    def test_nested_source_resource_symlink_is_rejected(self):
        outside = self.base / "outside-resources"
        outside.mkdir()
        (outside / "data").write_bytes(b"outside")
        (self.github / sync.SKILL / "resources").symlink_to(outside, target_is_directory=True)
        before = contents(outside)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Unsafe asset symlink", output)
        self.assertEqual(contents(outside), before)
        self.assertFalse(self.home.exists())

    def test_intentional_symlinked_parent_dirs_are_preserved_through_migration(self):
        self.home.mkdir()
        shared = self.base / "shared"
        for bucket in ("agents", "skills"):
            target = shared / bucket
            target.mkdir(parents=True)
            (self.home / bucket).symlink_to(target, target_is_directory=True)
        (shared / "agents/unrelated.agent.md").write_bytes(b"unrelated")
        legacy = shared / sync.LEGACY_SKILL
        shutil.copytree(self.github / sync.SKILL, legacy)
        (legacy / "local.txt").write_bytes(b"local resource")
        before_legacy = contents(legacy)
        self.install()
        for bucket in ("agents", "skills"):
            self.assertTrue((self.home / bucket).is_symlink())
            self.assertEqual(os.readlink(self.home / bucket), str(shared / bucket))
        self.assertEqual((shared / "agents/unrelated.agent.md").read_bytes(), b"unrelated")
        run, = self.backup_runs()
        self.assertEqual(contents(run / sync.LEGACY_SKILL), before_legacy)
        self.assertEqual(run.parent, self.home / "playground-backups")
        self.assertFalse((shared / "playground-backups").exists())
        installed, installed_metadata = contents(shared), metadata(shared)
        for arguments in (("--check",), ("--apply",)):
            with self.subTest(arguments=arguments):
                code, output = self.call(*arguments)
                self.assertEqual(code, 0, output)
                self.assertIn("No writes", output)
                self.assert_installed()
                self.assertEqual(self.backup_runs(), [run])
                self.assertEqual(contents(shared), installed)
                self.assertEqual(metadata(shared), installed_metadata)

    def test_unsafe_destination_asset_symlinks_fail_before_changes(self):
        outside = self.base / "outside"
        outside.mkdir()
        (outside / "data").write_bytes(b"never touch")
        for relative in (*sync.MANAGED, sync.LEGACY_SKILL):
            with self.subTest(relative=relative):
                target = self.home / relative
                target.parent.mkdir(parents=True, exist_ok=True)
                target.symlink_to(outside, target_is_directory=True)
                before = contents(self.home)
                code, output = self.call("--apply")
                self.assertEqual(code, 2, output)
                self.assertIn("Unsafe asset symlink", output)
                self.assertEqual(contents(self.home), before)
                self.assertEqual((outside / "data").read_bytes(), b"never touch")
                target.unlink()

    def test_nested_destination_symlink_fails_before_changes(self):
        self.install()
        outside = self.base / "outside.txt"
        outside.write_bytes(b"external data")
        (self.home / sync.SKILL / "linked.txt").symlink_to(outside)
        self.change_agents()
        before = contents(self.home)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Unsafe asset symlink", output)
        self.assertEqual(contents(self.home), before)
        self.assertEqual(outside.read_bytes(), b"external data")

    def test_broken_parent_and_asset_symlinks_are_errors_not_missing_assets(self):
        self.home.mkdir()
        agents = self.home / "agents"
        agents.symlink_to(self.base / "missing-directory", target_is_directory=True)
        before = contents(self.home)
        code, output = self.call("--check")
        self.assertEqual(code, 2, output)
        self.assertEqual(contents(self.home), before)
        agents.unlink()
        agents.mkdir()
        (agents / AGENT_FILES[0]).symlink_to(self.base / "missing-file")
        before = contents(self.home)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Unsafe asset symlink", output)
        self.assertEqual(contents(self.home), before)

    def test_unexpected_destination_file_kinds_are_rejected(self):
        agent = self.home / "agents" / AGENT_FILES[0]
        agent.mkdir(parents=True)
        (agent / "user-data").write_bytes(b"preserve directory")
        before = contents(self.home)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Expected regular file", output)
        self.assertEqual(contents(self.home), before)
        shutil.rmtree(agent)
        skill = self.home / sync.SKILL
        skill.parent.mkdir()
        skill.write_bytes(b"preserve unexpected file")
        before = contents(self.home)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Expected directory", output)
        self.assertEqual(contents(self.home), before)

    @unittest.skipUnless(hasattr(os, "mkfifo"), "FIFO test requires POSIX")
    def test_special_resource_file_fails_without_reading_or_hanging(self):
        special = self.github / sync.SKILL / "pipe"
        os.mkfifo(special)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Unexpected file kind", output)
        self.assertFalse(self.home.exists())

    def test_unexpected_case_alias_is_not_treated_as_an_owned_agent(self):
        alternate = self.home / "agents/GAME-CREATOR.agent.md"
        alternate.parent.mkdir(parents=True)
        alternate.write_bytes(b"do not replace this differently named file")
        if not (self.home / "agents/game-creator.agent.md").exists():
            self.skipTest("Alias rejection requires a case-insensitive filesystem")
        before = contents(self.home)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("differently-cased", output)
        self.assertEqual(contents(self.home), before)

    def test_backup_root_symlink_or_file_is_rejected_before_mutation(self):
        self.install()
        self.change_agents()
        before_agents = contents(self.home / "agents")
        root = self.home / "playground-backups"
        outside = self.base / "outside-backups"
        outside.mkdir()
        root.symlink_to(outside, target_is_directory=True)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Unsafe directory symlink", output)
        self.assertEqual(contents(self.home / "agents"), before_agents)
        self.assertEqual(contents(outside), {})
        root.unlink()
        root.write_bytes(b"unrelated backup-root file")
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Expected directory", output)
        self.assertEqual(contents(self.home / "agents"), before_agents)
        self.assertEqual(root.read_bytes(), b"unrelated backup-root file")

    def test_overlapping_discovery_or_source_paths_are_rejected(self):
        self.home.mkdir()
        (self.home / "agents").mkdir()
        (self.home / "skills").symlink_to(self.home / "agents", target_is_directory=True)
        before = contents(self.home)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("non-overlapping", output)
        self.assertEqual(contents(self.home), before)
        (self.home / "skills").unlink()
        (self.home / "skills").symlink_to(self.github / "skills", target_is_directory=True)
        before_sources = contents(self.github)
        code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("canonical .github sources", output)
        self.assertEqual(contents(self.github), before_sources)

    def test_backup_failure_never_changes_active_assets(self):
        self.install()
        self.change_agents()
        before_agents, before_skills = contents(self.home / "agents"), contents(self.home / "skills")
        real_write = sync.write_snapshot

        def fail_backup(snapshot, path):
            if "playground-backups" in path.parts and ".staged" not in path.parts:
                raise PermissionError("backup storage is not writable")
            real_write(snapshot, path)

        with mock.patch.object(sync, "write_snapshot", side_effect=fail_backup):
            code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("backup storage is not writable", output)
        self.assertIn("Active assets were not changed", output)
        self.assertEqual(contents(self.home / "agents"), before_agents)
        self.assertEqual(contents(self.home / "skills"), before_skills)
        run, = self.backup_runs()
        self.assertIn(str(run), output)

    def test_staging_failure_preserves_originals_and_reports_incomplete_run(self):
        self.install()
        originals = self.change_agents()
        before = contents(self.home / "agents")
        real_write = sync.write_snapshot

        def fail_staging(snapshot, path):
            if ".staged" in path.parts:
                raise PermissionError("staging write failed")
            real_write(snapshot, path)

        with mock.patch.object(sync, "write_snapshot", side_effect=fail_staging):
            code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Active assets were not changed", output)
        self.assertEqual(contents(self.home / "agents"), before)
        run, = self.backup_runs()
        self.assertEqual((run / "agents" / AGENT_FILES[0]).read_bytes(), originals[AGENT_FILES[0]])
        self.assertFalse((run / "RECOVERY.txt").exists())
        self.assertIn("do not treat incomplete copies as backups", output)

    def test_install_failure_rolls_back_all_touched_assets_and_keeps_backups(self):
        self.install()
        originals = self.change_agents()
        before_agents, before_skills = contents(self.home / "agents"), contents(self.home / "skills")
        real_replace = sync.os.replace

        def fail_second(source, destination):
            if destination == self.home / "agents" / AGENT_FILES[1]:
                raise PermissionError("install rename blocked")
            return real_replace(source, destination)

        with mock.patch.object(sync.os, "replace", side_effect=fail_second):
            code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Original managed assets restored", output)
        self.assertNotIn("All four Playground assets installed and verified", output)
        self.assertEqual(contents(self.home / "agents"), before_agents)
        self.assertEqual(contents(self.home / "skills"), before_skills)
        run, = self.backup_runs()
        for name, data in originals.items():
            self.assertEqual((run / "agents" / name).read_bytes(), data)
        self.assertTrue((run / "RECOVERY.txt").is_file())

    def test_failed_atomic_file_replace_does_not_rewrite_untouched_original(self):
        self.install()
        target = self.home / "agents" / AGENT_FILES[0]
        target.write_bytes(b"original survives a failed atomic rename")
        before, before_metadata = contents(self.home / "agents"), metadata(self.home / "agents")
        with mock.patch.object(sync.os, "replace", side_effect=PermissionError("rename blocked")):
            code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertEqual(contents(self.home / "agents"), before)
        self.assertEqual(metadata(self.home / "agents"), before_metadata)
        run, = self.backup_runs()
        self.assertEqual((run / "agents" / AGENT_FILES[0]).read_bytes(), target.read_bytes())

    def test_rollback_failure_is_explicit_and_original_data_remains_recoverable(self):
        self.install()
        originals = self.change_agents()
        real_replace, real_write = sync.os.replace, sync.write_snapshot

        def fail_install(source, destination):
            if destination == self.home / "agents" / AGENT_FILES[1]:
                raise PermissionError("install blocked")
            return real_replace(source, destination)

        def fail_restore(snapshot, path):
            if path == self.home / "agents" / AGENT_FILES[0]:
                raise PermissionError("restore blocked")
            real_write(snapshot, path)

        with mock.patch.object(sync.os, "replace", side_effect=fail_install), \
                mock.patch.object(sync, "write_snapshot", side_effect=fail_restore):
            code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("ROLLBACK INCOMPLETE", output)
        self.assertIn("restore blocked", output)
        self.assertNotIn("All four Playground assets installed and verified", output)
        run, = self.backup_runs()
        self.assertIn(str(run), output)
        for name, data in originals.items():
            self.assertEqual((run / "agents" / name).read_bytes(), data)
        self.assertTrue((run / "RECOVERY.txt").is_file())

    def test_failed_legacy_migration_restores_original_spelling_and_resources(self):
        legacy = self.home / sync.LEGACY_SKILL
        shutil.copytree(self.github / sync.SKILL, legacy)
        (legacy / "original-resource.bin").write_bytes(b"\xfflegacy")
        original = contents(legacy)
        real_replace = sync.os.replace

        def fail_canonical_skill(source, destination):
            if destination == self.home / sync.SKILL:
                raise PermissionError("canonical skill installation blocked")
            return real_replace(source, destination)

        with mock.patch.object(sync.os, "replace", side_effect=fail_canonical_skill):
            code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("Original managed assets restored", output)
        self.assertEqual(contents(self.home / "skills"), {sync.LEGACY_SKILL.name: original})
        self.assertEqual(contents(self.home / "agents"), {})
        run, = self.backup_runs()
        self.assertEqual(contents(run / sync.LEGACY_SKILL), original)
        self.assertTrue((run / "RECOVERY.txt").is_file())

    def test_cross_filesystem_parent_install_uses_complete_snapshot_copy(self):
        with mock.patch.object(sync.os, "replace", side_effect=OSError(errno.EXDEV, "different filesystem")):
            code, output = self.call("--apply")
        self.assertEqual(code, 0, output)
        self.assertIn("Cross-filesystem snapshot copy", output)
        self.assert_installed()
        self.assertEqual(self.backup_runs(), [])

    def test_destination_changed_during_staging_is_preserved_not_overwritten(self):
        self.install()
        self.change_agents()
        target = self.home / "agents" / AGENT_FILES[0]
        real_write = sync.write_snapshot

        def concurrent_edit(snapshot, path):
            real_write(snapshot, path)
            if ".staged" in path.parts:
                target.write_bytes(b"newer user edit")

        with mock.patch.object(sync, "write_snapshot", side_effect=concurrent_edit):
            code, output = self.call("--apply")
        self.assertEqual(code, 2, output)
        self.assertIn("changed during staging", output)
        self.assertEqual(target.read_bytes(), b"newer user edit")

    def test_cli_default_home_is_read_only_and_flags_are_mutually_exclusive(self):
        script = ROOT / "scripts/sync_copilot_assets.py"
        environment = dict(os.environ, HOME=str(self.base), PYTHONDONTWRITEBYTECODE="1")
        result = subprocess.run([sys.executable, str(script)], cwd=self.base, env=environment,
                                capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 1, result.stdout + result.stderr)
        self.assertFalse((self.base / ".copilot").exists())
        for arguments in (["--check", "--apply"], ["--unknown-option"]):
            with self.subTest(arguments=arguments):
                result = subprocess.run(
                    [sys.executable, str(script), "--copilot-home", str(self.home), *arguments],
                    cwd=self.base, env=environment, capture_output=True, text=True, check=False)
                self.assertEqual(result.returncode, 2, result.stdout + result.stderr)
                self.assertFalse(self.home.exists())

    def test_cli_uses_script_checkout_not_current_working_directory(self):
        result = subprocess.run(
            [sys.executable, str(ROOT / "scripts/sync_copilot_assets.py"),
             "--apply", "--copilot-home", str(self.home)],
            cwd=self.base, env=dict(os.environ, PYTHONDONTWRITEBYTECODE="1"),
            capture_output=True, text=True, check=False)
        self.assertEqual(result.returncode, 0, result.stdout + result.stderr)
        self.assert_installed()


class CanonicalDefinitionTests(unittest.TestCase):
    def test_explicit_asset_set_and_canonical_frontmatter(self):
        self.assertEqual(set(sync.MANAGED),
                         {*(Path("agents") / name for name in AGENT_FILES),
                          Path("skills/new-game-orchestration")})
        self.assertEqual(sync.LEGACY_SKILL, Path("skills/New-Game-Orchestration"))
        sources = sync.load_sources(ROOT)
        self.assertEqual(len(sources), 4)
        for relative in sync.MANAGED:
            document = ROOT / ".github" / relative
            if relative == sync.SKILL:
                document /= "SKILL.md"
            text = document.read_text(encoding="utf-8")
            header = text.split("---", 2)[1]
            self.assertNotRegex(header, r"(?m)^tools:")
            self.assertIn("description: >-", header)
            self.assertLess(len(text), 30001)
            for token in (".github/agents", ".github/skills", ".github/workflows",
                          "generated snapshots", "git remote -v",
                          "README.md", "shared/ADDING_A_GAME.md", "docs/screenshots"):
                self.assertIn(token, text, f"{document}: {token}")
        skill = (ROOT / ".github" / sync.SKILL / "SKILL.md").read_text(encoding="utf-8")
        self.assertLess(len(skill.splitlines()), 500)
        for trigger in ("[New Game]", "(new game)", "build/create a game"):
            self.assertIn(trigger, skill)
        for role in ("Playground Orchestrator", "Game Creator", "Playground Docs Keeper"):
            self.assertIn(role, skill)

    def test_definitions_are_portable_and_publicly_shareable(self):
        documents = [ROOT / ".github/agents" / name for name in AGENT_FILES]
        documents.append(ROOT / ".github" / sync.SKILL / "SKILL.md")
        for document in documents:
            text = document.read_text(encoding="utf-8")
            for stale in (".github-private", "~/Private/", "/Users/",
                          "General Project Manager", "General Researcher"):
                self.assertNotIn(stale, text, str(document))
            self.assertNotRegex(text, r"(?i)\b[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}\b")
            self.assertNotRegex(text, r"[\w.+-]+@[\w.-]+\.[a-zA-Z]{2,}")

    def test_game_creator_retains_detailed_cross_cutting_contracts(self):
        text = (ROOT / ".github/agents/game-creator.agent.md").read_text(encoding="utf-8")
        required = (
            '--panel-bg: rgb(51, 59, 107)', '--panel-stroke: rgba(255, 255, 255, 0.18)',
            '--gold: rgb(255, 204, 61)', '--primary: rgb(87, 199, 112)',
            '--secondary: rgb(92, 107, 173)', '--danger: rgb(237, 102, 107)',
            '--toggle-off: rgba(255, 255, 255, 0.22)', '"Baloo 2"', '#20264f',
            'Candy, Sunset, Ocean, Neon', 'Twilight, Grape, Forest, Ember',
            'brightness×0.62', 'lightened 0.22', 'lightened 0.62',
            'SoundPlayer.unlock()', 'createBufferSource()', 'start(0)', 'Haptics',
            'viewport-fit=cover', 'manifest.webmanifest', 'cache-first',
            'playground:back', 'window.parent.postMessage', 'playground:lang',
            'navigator.language(s)', 'localStorage', 'Fredoka', 'inset-inline-start/end',
            'Settings=הגדרות', 'Sound=צליל', 'Vibration=רטט', 'Back to Games=חזרה למשחקים',
            'You found them all!=מצאתם את כולם!', 'byte-identical', 'telemetry.js',
            'DNT', 'Global Privacy Control', "localStorage['telemetry']='off'",
            'pg_sid', 'sessionStorage', 'game_open', 'session_end', 'duration_bucket',
            'game_launch', 'setting_changed', 'sendBeacon', 'bucketed/aggregate',
        )
        for token in required:
            self.assertIn(token, text, token)

    def test_ci_is_focused_read_only_and_matches_checkout_convention(self):
        text = (ROOT / ".github/workflows/copilot-assets.yml").read_text(encoding="utf-8")
        pages = (ROOT / ".github/workflows/pages.yml").read_text(encoding="utf-8")
        checkout = re.search(r"uses: actions/checkout@\S+", pages).group()
        self.assertIn(checkout, text)
        self.assertIn("contents: read", text)
        self.assertNotIn("contents: write", text)
        self.assertIn("pull_request:", text)
        self.assertIn("push:", text)
        self.assertIn("python3 -m unittest discover -s tests -p 'test_copilot_assets.py' -v", text)
        for path in (".github/skills/new-game-orchestration/**", "scripts/sync_copilot_assets.py",
                     "tests/test_copilot_assets.py", ".github/workflows/copilot-assets.yml"):
            self.assertEqual(text.count(f"- '{path}'"), 2)
        self.assertNotIn("--apply", text)


if __name__ == "__main__":
    unittest.main()
