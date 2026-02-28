"""State schema for the LangGraph swarm orchestrator."""

from typing import TypedDict, Literal


class SwarmState(TypedDict):
    """Minimal state that flows through the LangGraph pipeline."""

    task_id: str
    task_description: str
    repo_path: str          # <-- dynamic: actual codebase directory

    phase: Literal["intake", "coding", "testing", "documenting", "deploying", "done", "failed"]

    # Agent outputs (accumulated)
    code_output: str        # Summary from code agent
    code_files: list[str]   # Paths of written/modified files
    test_output: str        # Summary from test agent
    test_files: list[str]   # Paths of test files
    docs_output: str        # Summary from docs agent
    docs_files: list[str]   # Paths of doc files
    deploy_output: str      # Summary from deploy agent
    deploy_files: list[str] # PR desc, changelog, CI workflow

    # Error handling
    error: str | None
    retry_count: int

    # Approval checkpoint
    pending_diff: dict | None        # {file_path, old_content, new_content}
    approval_result: str | None      # "approved" | "rejected"
