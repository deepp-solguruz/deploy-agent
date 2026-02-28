"""Git + GitHub tools — branch, commit, push, create PR."""

import os
import json
import logging
import subprocess
from urllib import request as urllib_request

logger = logging.getLogger("git_service")


def _run_git(repo_path: str, *args: str) -> tuple[int, str]:
    """Run a git command in the repo directory (non-interactive, with timeout)."""
    env = os.environ.copy()
    env["GIT_TERMINAL_PROMPT"] = "0"      # Never prompt for credentials
    env["GIT_ASKPASS"] = ""                # Disable askpass helper
    env["GIT_SSH_COMMAND"] = "ssh -o BatchMode=yes"  # Non-interactive SSH

    try:
        result = subprocess.run(
            ["git", *args],
            cwd=repo_path,
            env=env,
            capture_output=True,
            text=True,
            timeout=60,  # 60 second timeout to prevent hanging
        )
        output = (result.stdout.strip() + "\n" + result.stderr.strip()).strip()
        logger.info(f"git {' '.join(args[:3])} → exit={result.returncode}")
        return result.returncode, output
    except subprocess.TimeoutExpired:
        logger.error(f"git {' '.join(args[:3])} timed out after 60s")
        return 1, "Command timed out after 60 seconds"


def _get_remote_info(repo_path: str) -> tuple[str, str] | None:
    """Extract GitHub owner/repo from git remote URL."""
    code, output = _run_git(repo_path, "remote", "get-url", "origin")
    if code != 0:
        return None
    url = output.strip()
    if "github.com" not in url:
        return None
    if url.startswith("git@"):
        path = url.split(":")[-1]
    else:
        path = url.split("github.com/")[-1]
    path = path.rstrip("/").removesuffix(".git")
    parts = path.split("/")
    if len(parts) >= 2:
        return parts[0], parts[1]
    return None


def git_create_branch_and_commit(repo_path: str, branch_name: str, commit_message: str) -> dict:
    """Create a new branch, stage all changes, and commit."""
    results = []

    # Ensure we're inside a git repo
    code, out = _run_git(repo_path, "rev-parse", "--is-inside-work-tree")
    if code != 0:
        _run_git(repo_path, "init")
        _run_git(repo_path, "checkout", "-b", "main")
        results.append("Initialized new git repo")

    # Set git user if not configured
    _run_git(repo_path, "config", "user.email", "ai@devswarm.local")
    _run_git(repo_path, "config", "user.name", "DevSwarm AI")

    # Determine the base/default branch — use the LATEST remote branch
    base_branch = "main"  # ultimate fallback

    # Fetch latest remote refs so we know all pushed branches
    github_token = os.getenv("GITHUB_TOKEN", "").strip()
    remote = _get_remote_info(repo_path)
    if remote and github_token:
        owner, repo_name = remote
        auth_url = f"https://x-access-token:{github_token}@github.com/{owner}/{repo_name}.git"
        _run_git(repo_path, "fetch", auth_url, "--prune")
    else:
        _run_git(repo_path, "fetch", "--prune")

    # List remote branches sorted by most recent commit date
    code, out = _run_git(
        repo_path, "for-each-ref",
        "--sort=-committerdate",
        "--format=%(refname:short)",
        "refs/remotes/origin/"
    )
    if code == 0 and out.strip():
        remote_branches = [
            b.replace("origin/", "")
            for b in out.strip().split("\n")
            if b.strip() and "HEAD" not in b
        ]
        if remote_branches:
            # Use the most recently pushed branch as base
            base_branch = remote_branches[0]
            logger.info(f"Remote branches (newest first): {remote_branches[:5]}")

    logger.info(f"Base branch for PR: {base_branch}")

    # Switch to base branch before creating feature branch (so they share history)
    _run_git(repo_path, "checkout", base_branch)

    # Create and switch to the new feature branch
    code, out = _run_git(repo_path, "checkout", "-b", branch_name)
    if code != 0:
        code, out = _run_git(repo_path, "checkout", branch_name)
    results.append(f"Branch: {branch_name} (from {base_branch})")

    # Stage all changes
    _run_git(repo_path, "add", "-A")

    # Commit
    code, out = _run_git(repo_path, "commit", "-m", commit_message)
    results.append(f"Commit: {out[:200]}")

    return {
        "success": code == 0,
        "branch": branch_name,
        "base_branch": base_branch,
        "results": results,
    }


def git_push(repo_path: str, branch_name: str, base_branch: str = "main") -> dict:
    """Push the branch to origin using GITHUB_TOKEN for auth."""
    github_token = os.getenv("GITHUB_TOKEN", "").strip()
    remote = _get_remote_info(repo_path)

    logger.info(f"git_push: branch={branch_name}, base={base_branch}, remote={remote}, token_len={len(github_token)}")

    if not remote:
        return {"success": False, "output": "No GitHub remote 'origin' found."}

    owner, repo = remote

    if not github_token:
        return {"success": False, "output": "GITHUB_TOKEN not set — cannot push."}

    # Push directly to authenticated URL (bypasses all credential helpers)
    auth_url = f"https://x-access-token:{github_token}@github.com/{owner}/{repo}.git"

    # Push the feature branch
    code, out = _run_git(repo_path, "push", "--set-upstream", auth_url, branch_name)

    logger.info(f"git_push result: code={code}, output={out[:200]}")
    return {"success": code == 0, "output": out[:500]}


def github_create_pr(repo_path: str, branch_name: str, base_branch: str,
                     title: str, body: str) -> dict:
    """Create a GitHub PR via the REST API."""
    github_token = os.getenv("GITHUB_TOKEN", "").strip()
    if not github_token:
        return {"success": False, "error": "GITHUB_TOKEN not set in .env"}

    remote = _get_remote_info(repo_path)
    if not remote:
        return {"success": False, "error": "Could not detect GitHub remote."}

    owner, repo = remote
    url = f"https://api.github.com/repos/{owner}/{repo}/pulls"

    payload = json.dumps({
        "title": title,
        "body": body,
        "head": branch_name,
        "base": base_branch,
    }).encode()

    req = urllib_request.Request(url, data=payload, method="POST", headers={
        "Authorization": f"Bearer {github_token}",
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
    })

    logger.info(f"Creating PR: {owner}/{repo} {branch_name} -> {base_branch}")

    try:
        with urllib_request.urlopen(req) as resp:
            data = json.loads(resp.read())
            logger.info(f"PR created: #{data.get('number')} {data.get('html_url')}")
            return {
                "success": True,
                "pr_number": data.get("number"),
                "pr_url": data.get("html_url"),
            }
    except urllib_request.HTTPError as e:
        error_body = e.read().decode("utf-8", errors="replace")
        logger.error(f"PR creation failed: HTTP {e.code}: {error_body[:300]}")
        return {"success": False, "error": f"HTTP {e.code}: {error_body[:300]}"}
    except Exception as e:
        logger.error(f"PR creation error: {e}")
        return {"success": False, "error": str(e)}


# Quick smoke-test
if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    import sys
    repo = sys.argv[1] if len(sys.argv) > 1 else "."

    print("Remote:", _get_remote_info(repo))

    tok = os.getenv("GITHUB_TOKEN", "")
    print(f"Token: len={len(tok)}, prefix={tok[:10]}...")

    branch = "test/deploy-smoke"
    c = git_create_branch_and_commit(repo, branch, "test: smoke test commit")
    print("Commit:", json.dumps(c, indent=2))

    if c.get("success"):
        p = git_push(repo, branch)
        print("Push:", json.dumps(p, indent=2))

        if p.get("success"):
            pr = github_create_pr(repo, branch, c["base_branch"], "Test PR", "Smoke test")
            print("PR:", json.dumps(pr, indent=2))