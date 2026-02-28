"""FastAPI — WebSocket + task submission + approval endpoint."""

import os
import asyncio
from pathlib import Path
from contextlib import asynccontextmanager
from concurrent.futures import ThreadPoolExecutor

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from websocket.manager import manager
from orchestrator.graph import swarm
from services.file_service import FileService

DEFAULT_REPO = os.getenv("OUTPUT_DIR", "./output")
executor = ThreadPoolExecutor(max_workers=4)


@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(DEFAULT_REPO, exist_ok=True)
    yield


app = FastAPI(title="AI Developer Swarm", version="0.2.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])


# ── Schemas ───────────────────────────────────────────────────────

class TaskRequest(BaseModel):
    description: str
    repo_path: str | None = None


class ApprovalRequest(BaseModel):
    task_id: str
    approved: bool


# ── WebSocket ─────────────────────────────────────────────────────

@app.websocket("/ws")
async def websocket_endpoint(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            msg = await ws.receive_json()
            # Client can send approval responses
            if msg.get("event") == "approval_response":
                manager.resolve_approval(msg["task_id"], msg["approved"])
    except WebSocketDisconnect:
        manager.disconnect(ws)


# ── Task submission ───────────────────────────────────────────────

@app.post("/task")
async def run_task(req: TaskRequest):
    repo_path = str(Path(req.repo_path or DEFAULT_REPO).resolve())
    os.makedirs(repo_path, exist_ok=True)

    task_id = ""
    initial = {
        "task_id": task_id,
        "task_description": req.description,
        "repo_path": repo_path,
        "phase": "intake",
        "code_output": "", "code_files": [],
        "test_output": "", "test_files": [],
        "docs_output": "", "docs_files": [],
        "deploy_output": "", "deploy_files": [],
        "error": None, "retry_count": 0,
        "pending_diff": None, "approval_result": None,
    }

    await manager.broadcast("workflow_start", {"description": req.description, "repo_path": repo_path})

    # Run LangGraph in thread (it's sync internally)
    loop = asyncio.get_event_loop()
    from orchestrator import graph
    graph._main_loop = loop
    result = await loop.run_in_executor(executor, lambda: swarm.invoke(initial))

    return {
        "task_id": result["task_id"],
        "phase": result["phase"],
        "repo_path": repo_path,
        "code_files": result.get("code_files", []),
        "test_files": result.get("test_files", []),
        "docs_files": result.get("docs_files", []),
        "deploy_files": result.get("deploy_files", []),
        "error": result.get("error"),
    }


# ── Approval ──────────────────────────────────────────────────────

@app.post("/approve")
async def approve(req: ApprovalRequest):
    """Dashboard or VS Code extension calls this to approve/reject."""
    manager.resolve_approval(req.task_id, req.approved)
    return {"status": "ok", "approved": req.approved}


# ── File listing ──────────────────────────────────────────────────

@app.get("/files")
async def list_files(repo_path: str):
    path = Path(repo_path)
    if not path.exists():
        raise HTTPException(404, "repo_path not found")
    files = []
    for f in path.rglob("*"):
        if f.is_file() and "node_modules" not in str(f) and ".swarm_backup" not in str(f):
            rel = str(f.relative_to(path))
            try:
                content = f.read_text(errors="replace")
            except Exception:
                content = "<binary>"
            files.append({"path": rel, "content": content})
    return {"repo_path": str(path), "files": files}


# ── Rollback ─────────────────────────────────────────────────────

@app.post("/rollback")
async def rollback(repo_path: str, file_path: str | None = None):
    svc = FileService(repo_path)
    if file_path:
        ok = svc.rollback(file_path)
        return {"rolled_back": file_path, "had_backup": ok}
    svc.rollback_all()
    return {"rolled_back": "all"}


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
