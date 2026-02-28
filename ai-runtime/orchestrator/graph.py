"""LangGraph workflow with approval checkpoint node."""

import uuid
import time
import asyncio
from langgraph.graph import StateGraph, END
from orchestrator.state import SwarmState
from utils.rate_limiter import wait_for_rate_limit
from agents.code_agent import run_code_agent
from agents.test_agent import run_test_agent
from agents.docs_agent import run_docs_agent
from agents.deploy_agent import run_deploy_agent

# Imported lazily to avoid circular imports at module load
def _manager():
    from websocket.manager import manager
    return manager


# ── Nodes ─────────────────────────────────────────────────────────

def intake_node(state: SwarmState) -> dict:
    return {
        "task_id": state.get("task_id") or str(uuid.uuid4())[:8],
        "phase": "coding",
        "retry_count": 0,
        "code_output": "", "code_files": [],
        "test_output": "", "test_files": [],
        "docs_output": "", "docs_files": [],
        "deploy_output": "", "deploy_files": [],
        "error": None,
        "pending_diff": None,
        "approval_result": None,
    }



_main_loop = None

def _broadcast_sync(event: str, data: dict):
    """Fire-and-forget broadcast from sync context to the main loop."""
    try:
        if _main_loop and _main_loop.is_running():
            asyncio.run_coroutine_threadsafe(_manager().broadcast(event, data), _main_loop)
    except Exception:
        pass


def code_node(state: SwarmState) -> dict:
    _broadcast_sync("agent_start", {"task_id": state["task_id"], "agent": "code_agent"})
    try:
        from agents.code_agent import run_code_agent
        result = run_code_agent(state["task_description"], state["task_id"], state["repo_path"])
        _broadcast_sync("agent_done", {"task_id": state["task_id"], "agent": "code_agent", "files": result["files"]})
        return {"phase": "testing", "code_output": result["code"], "code_files": result["files"], "error": None}
    except Exception as e:
        _broadcast_sync("agent_error", {"task_id": state["task_id"], "agent": "code_agent", "error": str(e)})
        return {"error": str(e), "retry_count": state["retry_count"] + 1}


def test_node(state: SwarmState) -> dict:
    # Cooldown to avoid rate limits
    _broadcast_sync("rate_limit_wait", {"task_id": state["task_id"], "agent": "test_agent", "message": "Cooling down before next agent..."})
    wait_for_rate_limit()
    _broadcast_sync("agent_start", {"task_id": state["task_id"], "agent": "test_agent"})
    try:
        from agents.test_agent import run_test_agent
        result = run_test_agent(state["code_output"], state["task_description"], state["task_id"], state["repo_path"])
        _broadcast_sync("agent_done", {"task_id": state["task_id"], "agent": "test_agent", "files": result["files"]})
        return {"phase": "documenting", "test_output": result["tests"], "test_files": result["files"], "error": None}
    except Exception as e:
        _broadcast_sync("agent_error", {"task_id": state["task_id"], "agent": "test_agent", "error": str(e)})
        return {"error": str(e), "retry_count": state["retry_count"] + 1}


def docs_node(state: SwarmState) -> dict:
    _broadcast_sync("rate_limit_wait", {"task_id": state["task_id"], "agent": "docs_agent", "message": "Cooling down before next agent..."})
    wait_for_rate_limit()
    _broadcast_sync("agent_start", {"task_id": state["task_id"], "agent": "docs_agent"})
    try:
        from agents.docs_agent import run_docs_agent
        result = run_docs_agent(state["code_output"], state["task_description"], state["task_id"], state["repo_path"])
        _broadcast_sync("agent_done", {"task_id": state["task_id"], "agent": "docs_agent", "files": result["files"]})
        return {"phase": "deploying", "docs_output": result["docs"], "docs_files": result["files"], "error": None}
    except Exception as e:
        _broadcast_sync("agent_error", {"task_id": state["task_id"], "agent": "docs_agent", "error": str(e)})
        return {"error": str(e), "retry_count": state["retry_count"] + 1}


def deploy_node(state: SwarmState) -> dict:
    _broadcast_sync("rate_limit_wait", {"task_id": state["task_id"], "agent": "deploy_agent", "message": "Cooling down before next agent..."})
    wait_for_rate_limit()
    _broadcast_sync("agent_start", {"task_id": state["task_id"], "agent": "deploy_agent"})
    try:
        from agents.deploy_agent import run_deploy_agent
        result = run_deploy_agent(
            state["code_output"], state["test_output"], state["docs_output"],
            state["task_description"], state["task_id"], state["repo_path"]
        )
        _broadcast_sync("agent_done", {"task_id": state["task_id"], "agent": "deploy_agent", "files": result["files"]})
        return {"phase": "approval", "deploy_output": result["deploy"], "deploy_files": result["files"], "error": None}
    except Exception as e:
        _broadcast_sync("agent_error", {"task_id": state["task_id"], "agent": "deploy_agent", "error": str(e)})
        return {"error": str(e), "retry_count": state["retry_count"] + 1}


def approval_node(state: SwarmState) -> dict:
    """Broadcast pending_diff and wait for human approval (async via WS)."""
    _broadcast_sync("approval_request", {
        "task_id": state["task_id"],
        "code_files": state["code_files"],
        "test_files": state["test_files"],
        "docs_files": state["docs_files"],
        "message": "Review the generated files. Approve to write to disk.",
    })
    # Actual async approval is handled in main.py; here we just mark pending
    return {"phase": "done"}


def error_node(state: SwarmState) -> dict:
    _broadcast_sync("workflow_failed", {"task_id": state["task_id"], "error": state.get("error")})
    return {"phase": "failed"}


def finalize_node(state: SwarmState) -> dict:
    _broadcast_sync("workflow_complete", {
        "task_id": state["task_id"],
        "code_files": state["code_files"],
        "test_files": state["test_files"],
        "docs_files": state["docs_files"],
        "deploy_files": state["deploy_files"],
    })
    return {"phase": "done"}


# ── Routing ───────────────────────────────────────────────────────

def after_agent(state: SwarmState) -> str:
    if state.get("error"):
        return "fail" if state["retry_count"] >= 2 else "retry"
    return "continue"


# ── Graph ─────────────────────────────────────────────────────────

def build_swarm():
    g = StateGraph(SwarmState)
    g.add_node("intake",    intake_node)
    g.add_node("code_agent", code_node)
    g.add_node("test_agent", test_node)
    g.add_node("docs_agent", docs_node)
    g.add_node("deploy_agent", deploy_node)
    g.add_node("approval",   approval_node)
    g.add_node("finalize",   finalize_node)
    g.add_node("error_handler", error_node)

    g.set_entry_point("intake")
    g.add_edge("intake", "code_agent")

    g.add_conditional_edges("code_agent", after_agent, {"continue": "test_agent", "retry": "code_agent", "fail": "error_handler"})
    g.add_conditional_edges("test_agent", after_agent, {"continue": "docs_agent", "retry": "test_agent", "fail": "error_handler"})
    g.add_conditional_edges("docs_agent", after_agent, {"continue": "deploy_agent", "retry": "docs_agent", "fail": "error_handler"})
    g.add_conditional_edges("deploy_agent", after_agent, {"continue": "approval", "retry": "deploy_agent", "fail": "error_handler"})
    g.add_edge("approval", "finalize")
    g.add_edge("finalize", END)
    g.add_edge("error_handler", END)
    return g.compile()


swarm = build_swarm()
