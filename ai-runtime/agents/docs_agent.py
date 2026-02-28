"""Docs Agent — generates documentation for any language/framework."""

import os
import traceback
from crewai import Agent, Task, Crew
from tools.file_tools import make_tools
from utils.rate_limiter import get_llm, run_with_retry, trim_summary


def run_docs_agent(code_summary: str, task_description: str, task_id: str, repo_path: str) -> dict:
    """Execute the Docs Agent — reads codebase and generates/updates docs."""
    scan_repo, read_file, write_file, patch_file = make_tools(repo_path)

    agent = Agent(
        role="Senior Technical Writer",
        goal="Generate developer-friendly docs from actual code. Auto-detect stack.",
        backstory=(
            "Tech writer: README with setup, API docs with curl examples, "
            "component docs for frontend, schema docs for DB. "
            "Detect package manager, update existing docs when possible."
        ),
        tools=[scan_repo, read_file, write_file, patch_file],
        llm=get_llm(0.2),
        verbose=True,
        max_iter=8,
    )

    task = Task(
        description=(
            f"Document: {task_description}\n"
            f"Code summary: {trim_summary(code_summary)}\n"
            f"Repo: {repo_path}\n\n"
            f"1. scan_repo → read source files\n"
            f"2. Read or create README.md\n"
            f"3. Add: setup, API endpoints, schema overview, test commands"
        ),
        expected_output="Summary of docs files created or updated.",
        agent=agent,
    )

    def _run():
        crew = Crew(agents=[agent], tasks=[task], verbose=True)
        return crew.kickoff()

    try:
        result = run_with_retry(_run)
    except Exception as e:
        print(f"[DOCS AGENT ERROR] {traceback.format_exc()}")
        raise

    files = []
    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d != "node_modules" and not d.startswith(".")]
        for f in filenames:
            if f.endswith(".md"):
                files.append(os.path.relpath(os.path.join(root, f), repo_path))

    return {"docs": str(result), "files": files}
