"""Test Agent — generates tests for any language/framework."""

import os
import traceback
from crewai import Agent, Task, Crew
from tools.file_tools import make_tools
from utils.rate_limiter import get_llm, run_with_retry, trim_summary


def run_test_agent(code_summary: str, task_description: str, task_id: str, repo_path: str) -> dict:
    """Execute the Test Agent — auto-detects stack and writes appropriate tests."""
    scan_repo, read_file, write_file, patch_file = make_tools(repo_path)

    agent = Agent(
        role="Senior QA Automation Engineer",
        goal="Generate comprehensive tests. Auto-detect testing framework from project config.",
        backstory=(
            "Polyglot QA: Jest/Vitest for TS/JS, Pytest for Python, JUnit for Java. "
            "Mock dependencies, test happy paths, edge cases, error handling. "
            "Read existing tests first to avoid duplication."
        ),
        tools=[scan_repo, read_file, write_file, patch_file],
        llm=get_llm(0.1),
        verbose=True,
        max_iter=8,
    )

    task = Task(
        description=(
            f"Write tests for: {task_description}\n"
            f"Code summary: {trim_summary(code_summary)}\n"
            f"Repo: {repo_path}\n\n"
            f"1. scan_repo → detect test framework\n"
            f"2. Read source files\n"
            f"3. Write unit + integration tests"
        ),
        expected_output="Summary of test files created and testing framework used.",
        agent=agent,
    )

    def _run():
        crew = Crew(agents=[agent], tasks=[task], verbose=True)
        return crew.kickoff()

    try:
        result = run_with_retry(_run)
    except Exception as e:
        print(f"[TEST AGENT ERROR] {traceback.format_exc()}")
        raise

    files = []
    test_patterns = ('.spec.', '.test.', '_test.', '_spec.', 'test_', 'spec_')
    for root, dirs, filenames in os.walk(repo_path):
        dirs[:] = [d for d in dirs if d != "node_modules" and not d.startswith(".")]
        for f in filenames:
            if any(p in f for p in test_patterns):
                files.append(os.path.relpath(os.path.join(root, f), repo_path))

    return {"tests": str(result), "files": files}
