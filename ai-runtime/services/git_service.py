"""Git + GitHub tools — branch, commit, push, create PR."""

import os
import json
import subprocess
from urllib import request as urllib_request
from pathlib import Path


GITHUB_TOKEN = os.getenv("GITHUB_TOKEN", "")


def _run_git(repo_path: str, *args: str) -> tuple[int, str]:
    """Run a git command in the repo directory."""
    result = subprocess.run(
        ["git", *args],
        cwd=repo_path,
        capture_output=True,
        text=True,
    )
    output = result.stdout.strip() + "\n" + result.stderr.strip()
    return result.returncode, output.strip()


def _get_remote_info(repo_path: str) -> tuple[str, str] | None:
    """Extract GitHub owner/repo from git remote URL."""
    code, output = _run_git(repo_path, "remote", "get-url", "origin")
    if code != 0:
        return None
    url = output.strip()
    # git@github.com:owner/repo.git  OR  https://github.com/owner/repo.git
    if "github.com" not in url:
        return None
    if url.startswith("git@"):
        path = url.split(":")[-1]
    else:
        path = url.split("github.com/")[-1]
    path = path.rstrip(".git")
    parts = path.split("/")
    if len(parts) >= 2:
        return parts[0], parts[1]
    return None


def git_create_branch_and_commit(repo_path: str, branch_name: str, commit_message: str) -> dict:
    """Create a new branch, stage all changes, and commit."""
    results = []

    # Make sure we're in a git repo
    code, out = _run_git(repo_path, "rev-parse", "--is-inside-work-tree")
    if code != 0:
        # Initialize git repo if not already
        _run_git(repo_path, "init")
        _run_git(repo_path, "checkout", "-b", "main")
        results.append("Initialized new git repo")

    # Get current branch for later
    _, current_branch = _run_git(repo_path, "rev-parse", "--abbrev-ref", "HEAD")

    # Create and switch to new branch
    code, out = _run_git(repo_path, "checkout", "-b", branch_name)
    if code != 0:
        # Branch might already exist
        code, out = _run_git(repo_path, "checkout", branch_name)
    results.append(f"Branch: {branch_name}")

    # Stage all changes
    _run_git(repo_path, "add", "-A")

    # Commit
    code, out = _run_git(repo_path, "commit", "-m", commit_message)
    results.append(f"Commit: {out[:200]}")

    return {
        "branch": branch_name,
        "base_branch": current_branch,
        "results": results,
    }


def git_push(repo_path: str, branch_name: str) -> dict:
    """Push the branch to origin using token auth if available."""
    remote = _get_remote_info(repo_path)
    if not remote:
        return {"success": False, "output": "No valid GitHub remote 'origin' found."}
    
    owner, repo = remote

    # Try pushing with token in URL to bypass interactive prompt
    if GITHUB_TOKEN:
        auth_url = f"https://x-access-token:{GITHUB_TOKEN}@github.com/{owner}/{repo}.git"
        # Temporarily change remote
        _run_git(repo_path, "remote", "set-url", "origin", auth_url)
        
        code, out = _run_git(repo_path, "push", "-u", "origin", branch_name)
        
        # Restore remote to safe version
        safe_url = f"https://github.com/{owner}/{repo}.git"
        _run_git(repo_path, "remote", "set-url", "origin", safe_url)
    else:
        # Fallback to normal push (might hang if it needs creds)
        code, out = _run_git(repo_path, "push", "-u", "origin", branch_name)

    return {"success": code == 0, "output": out[:500]}


def github_create_pr(repo_path: str, branch_name: str, base_branch: str,
                     title: str, body: str) -> dict:
    """Create a GitHub PR via the API."""
    if not GITHUB_TOKEN:
        return {"success": False, "error": "GITHUB_TOKEN not set in .env"}

    remote = _get_remote_info(repo_path)
    if not remote:
        return {"success": False, "error": "Could not detect GitHub remote. Set origin to a GitHub URL."}

    owner, repo = remote
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls"
    payload = json.dumps({
        "title": title,
        "body": body,
        "head": branch_name,
        "base": base_branch,
    }).encode()

    req = urllib_request.Request(url, data=payload, method="POST", headers={
        "Authorization": f"Bearer {GITHUB_TOKEN}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
    })

    try:
        with urllib_request.urlopen(req) as resp:
            data = json.loads(resp.read())
            return {
                "success": True,
                "pr_number": data.get("number"),
                "pr_url": data.get("html_url"),
            }
    except Exception as e:
        return {"success": False, "error": str(e)}
