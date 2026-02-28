"""Deploy Agent — generates PR, creates branch, pushes, opens GitHub PR."""

import os
import re
import traceback
from crewai import Agent, Task, Crew
from tools.file_tools import make_tools
from utils.rate_limiter import get_llm, run_with_retry, trim_summary
from services.git_service import (
    git_create_branch_and_commit,
    git_push,
    github_create_pr,
)


def _slugify(text: str) -> str:
    """Turn task description into a branch name."""
    slug = re.sub(r'[^a-z0-9]+', '-', text.lower().strip())
    return f"feat/{slug[:50].strip('-')}"


def run_deploy_agent(code_summary: str, test_summary: str, docs_summary: str,
                     task_description: str, task_id: str, repo_path: str) -> dict:
    """Generate PR artifacts, then auto-create branch + PR on GitHub."""
    scan_repo, read_file, write_file, patch_file = make_tools(repo_path)

    agent = Agent(
        role="Senior DevOps & Release Engineer",
        goal="Prepare PR description, changelog, and CI workflow from the codebase.",
        backstory=(
            "Release engineer: write PR descriptions, CHANGELOG.md (Keep a Changelog), "
            "GitHub Actions CI workflows. Read changed files first."
        ),
        tools=[scan_repo, read_file, write_file, patch_file],
        llm=get_llm(0.2),
        verbose=True,
        max_iter=8,
    )

    task = Task(
        description=(
            f"Prepare PR for: {task_description}\n"
            f"Code: {trim_summary(code_summary, 800)}\n"
            f"Tests: {trim_summary(test_summary, 300)}\n"
            f"Docs: {trim_summary(docs_summary, 300)}\n"
            f"Repo: {repo_path}\n\n"
            f"Generate: PR_DESCRIPTION.md, CHANGELOG.md, .github/workflows/ci.yml"
        ),
        expected_output="Summary of deployment artifacts created.",
        agent=agent,
    )

    def _run():
        crew = Crew(agents=[agent], tasks=[task], verbose=True)
        return crew.kickoff()

    try:
        result = run_with_retry(_run)
    except Exception as e:
        print(f"[DEPLOY AGENT ERROR] {traceback.format_exc()}")
        raise

    # ── Auto-create branch, commit, push, and open PR ──────────────

    branch_name = _slugify(task_description)
    pr_body = ""
    pr_title = f"feat: {task_description[:80]}"

    pr_desc_path = os.path.join(repo_path, "PR_DESCRIPTION.md")
    if os.path.exists(pr_desc_path):
        with open(pr_desc_path) as f:
            pr_body = f.read()
        for line in pr_body.split("\n"):
            if line.startswith("# "):
                pr_title = line[2:].strip()
                break

    git_result = {"branch": branch_name, "pr_url": None, "steps": []}

    try:
        commit_result = git_create_branch_and_commit(
            repo_path, branch_name, f"feat: {task_description[:72]}"
        )
        git_result["steps"].append(f"Branch created: {branch_name}")
        git_result["base_branch"] = commit_result.get("base_branch", "main")

        push_result = git_push(repo_path, branch_name)
        if push_result["success"]:
            git_result["steps"].append("Pushed to origin")
        else:
            git_result["steps"].append(f"Push failed: {push_result['output'][:100]}")

        pr_result = github_create_pr(
            repo_path, branch_name,
            commit_result.get("base_branch", "main"),
            pr_title, pr_body or str(result),
        )
        if pr_result["success"]:
            git_result["pr_url"] = pr_result["pr_url"]
            git_result["pr_number"] = pr_result["pr_number"]
            git_result["steps"].append(f"PR created: {pr_result['pr_url']}")
        else:
            git_result["steps"].append(f"PR creation failed: {pr_result.get('error', 'unknown')}")

    except Exception as e:
        git_result["steps"].append(f"Git error: {str(e)[:200]}")
        print(f"[DEPLOY GIT ERROR] {traceback.format_exc()}")

    files = []
    deploy_patterns = ('PR_DESCRIPTION', 'CHANGELOG', 'ci.yml', '.gitlab-ci', 'deploy', 'Dockerfile')
    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d != "node_modules" and (not d.startswith(".") or d == ".github")]
        for f in filenames:
            if any(p in f for p in deploy_patterns) or f.endswith(('.yml', '.yaml')):
                files.append(os.path.relpath(os.path.join(root, f), repo_path))

    return {"deploy": str(result), "files": files, "git": git_result}
