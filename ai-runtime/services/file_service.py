"""File service — diff generator, approval checkpoint, rollback."""

import os
import shutil
import difflib
from pathlib import Path


class FileService:
    def __init__(self, repo_path: str):
        self.repo = Path(repo_path).resolve()
        self._backup_dir = self.repo / ".swarm_backup"

    def read(self, rel_path: str) -> str:
        p = self.repo / rel_path
        return p.read_text(errors="replace") if p.exists() else ""

    def diff(self, rel_path: str, new_content: str) -> dict:
        """Return a unified diff payload ready to send over WebSocket."""
        old = self.read(rel_path)
        unified = list(difflib.unified_diff(
            old.splitlines(keepends=True),
            new_content.splitlines(keepends=True),
            fromfile=f"a/{rel_path}",
            tofile=f"b/{rel_path}",
        ))
        return {
            "file_path": rel_path,
            "old_content": old,
            "new_content": new_content,
            "unified_diff": "".join(unified),
            "is_new_file": not (self.repo / rel_path).exists(),
        }

    def backup(self, rel_path: str):
        """Copy current file to backup dir before overwriting."""
        src = self.repo / rel_path
        if src.exists():
            dest = self._backup_dir / rel_path
            dest.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(src, dest)

    def write(self, rel_path: str, content: str):
        """Backup then write."""
        self.backup(rel_path)
        dest = self.repo / rel_path
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(content)

    def rollback(self, rel_path: str) -> bool:
        """Restore file from backup. Returns True if backup existed."""
        src = self._backup_dir / rel_path
        if src.exists():
            dest = self.repo / rel_path
            shutil.copy2(src, dest)
            return True
        return False

    def rollback_all(self):
        """Restore all backed-up files."""
        if not self._backup_dir.exists():
            return
        for f in self._backup_dir.rglob("*"):
            if f.is_file():
                rel = f.relative_to(self._backup_dir)
                dest = self.repo / rel
                dest.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, dest)
