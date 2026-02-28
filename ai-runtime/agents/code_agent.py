"""Code Agent — dynamically generates or updates code for any stack."""

import os
import traceback
from crewai import Agent, Task, Crew
from tools.file_tools import make_tools
from utils.rate_limiter import get_llm, run_with_retry


def run_code_agent(task_description: str, task_id: str, repo_path: str) -> dict:
    """Execute the Code Agent — reads existing repo structure before writing."""
    scan_repo, read_file, write_file, patch_file = make_tools(repo_path)

    agent = Agent(
        role="Senior Full-Stack Software Engineer",
        goal="Analyze the codebase and generate or update code. Auto-detect the tech stack.",
        backstory=(
            "Polyglot engineer: NestJS, Express, FastAPI, Django, React, Vue, Angular. "
            "Generate schemas, migrations, DTOs, controllers, services, components. "
            "Scan repo first, detect stack, follow existing patterns."
        ),
        tools=[scan_repo, read_file, write_file, patch_file],
        llm=get_llm(0.1),
        verbose=True,
        # max_iter=8,
    )

    task = Task(
        description=(
            f"Task: {task_description}\n"
            f"Repo: {repo_path}\n\n"
            f"1. scan_repo → detect stack\n"
            f"2. Read key files to understand patterns\n"
            f"3. Generate: source code, DB schemas/migrations, DTOs, config\n"
            f"4. Use relative paths (e.g. src/auth/auth.service.ts)"
        ),
        expected_output="Summary of files created/modified and tech stack detected.",
        agent=agent,
    )

    def _run():
        crew = Crew(agents=[agent], tasks=[task], verbose=True)
        return crew.kickoff()

    try:
        result = run_with_retry(_run)
    except Exception as e:
        print(f"[CODE AGENT ERROR] {traceback.format_exc()}")
        raise

    files = []
    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d != "node_modules" and not d.startswith(".")]
        for f in filenames:
            files.append(os.path.relpath(os.path.join(root, f), repo_path))

    return {"code": str(result), "files": files}
