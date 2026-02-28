"""Tools factory — creates file tools bound to a specific repo path."""

import os
import json
from pathlib import Path
from crewai.tools import tool


def make_tools(repo_path: str):
    """
    Create a set of file tools bound to the given repo_path.
    All reads/writes are relative to repo_path.
    """
    repo = Path(repo_path).resolve()
    repo.mkdir(parents=True, exist_ok=True)

    # ── Scanner ──────────────────────────────────────────────────────

    @tool("scan_repo")
    def scan_repo(dummy: str = "") -> str:
        """
        Scan the repository and return a JSON summary of every file with its relative path.
        Call this FIRST before reading or writing anything.
        Args:
            dummy: ignored, pass empty string
        """
        result = {}
        for root, dirs, files in os.walk(repo):
            # Skip hidden dirs and node_modules
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']
            for f in files:
                full = Path(root) / f
                rel = str(full.relative_to(repo))
                try:
                    size = full.stat().st_size
                    result[rel] = {"size_bytes": size}
                except Exception:
                    pass
        if not result:
            return json.dumps({"status": "empty", "message": "No files found. Repository is empty — generate the full structure."})
        return json.dumps({"status": "existing", "files": result}, indent=2)

    # ── Reader ───────────────────────────────────────────────────────

    @tool("read_file")
    def read_file(file_path: str) -> str:
        """
        Read an existing file from the repository.
        Args:
            file_path: Relative path (e.g., 'src/auth/auth.service.ts')
        """
        full = repo / file_path
        if not full.exists():
            return f"ERROR: File '{file_path}' does not exist in the repository."
        try:
            return full.read_text(errors="replace")
        except Exception as e:
            return f"ERROR reading file: {e}"

    # ── Writer ───────────────────────────────────────────────────────

    @tool("write_file")
    def write_file(file_path: str, content: str) -> str:
        """
        Write or overwrite a file in the repository.
        Use this to CREATE new files or REPLACE existing file contents entirely.
        Args:
            file_path: Relative path (e.g., 'src/auth/auth.service.ts')
            content: Full file contents to write
        """
        full = repo / file_path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_text(content)
        return f"Written: {file_path}"

    # ── Patcher ──────────────────────────────────────────────────────

    @tool("patch_file")
    def patch_file(file_path: str, old_snippet: str, new_snippet: str) -> str:
        """
        Replace a specific snippet inside an existing file (surgical edit).
        Use this when you only need to change part of a file.
        Args:
            file_path: Relative path to the file
            old_snippet: Exact text to find and replace (must exist verbatim in the file)
            new_snippet: Replacement text
        """
        full = repo / file_path
        if not full.exists():
            return f"ERROR: File '{file_path}' does not exist. Use write_file instead."
        content = full.read_text(errors="replace")
        if old_snippet not in content:
            return f"ERROR: snippet not found in '{file_path}'. Check your old_snippet exactly."
        patched = content.replace(old_snippet, new_snippet, 1)
        full.write_text(patched)
        return f"Patched: {file_path}"

    return scan_repo, read_file, write_file, patch_file
