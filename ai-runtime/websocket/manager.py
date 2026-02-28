"""WebSocket connection manager — broadcasts to dashboard and VS Code extension."""

import json
import asyncio
from fastapi import WebSocket


class ConnectionManager:
    def __init__(self):
        self.active: list[WebSocket] = []
        # Pending approvals: task_id -> asyncio.Event + result
        self._approvals: dict[str, dict] = {}

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        self.active.remove(ws)

    async def broadcast(self, event: str, data: dict):
        """Send a structured event to all connected clients."""
        msg = json.dumps({"event": event, "data": data})
        dead = []
        for ws in self.active:
            try:
                await ws.send_text(msg)
            except Exception:
                dead.append(ws)
        for ws in dead:
            self.active.remove(ws)

    # ── Approval flow ─────────────────────────────────────────────

    async def request_approval(self, task_id: str, diff_payload: dict) -> str:
        """
        Broadcast a diff to clients and wait for approval/reject.
        Returns "approved" or "rejected".
        Times out after 60s → auto-approves.
        """
        event = asyncio.Event()
        self._approvals[task_id] = {"event": event, "result": "approved"}

        await self.broadcast("approval_request", {
            "task_id": task_id,
            **diff_payload,
        })

        try:
            await asyncio.wait_for(event.wait(), timeout=60.0)
        except asyncio.TimeoutError:
            pass  # Default to approved on timeout

        result = self._approvals.pop(task_id)["result"]
        return result

    def resolve_approval(self, task_id: str, approved: bool):
        """Called when client sends approve/reject response."""
        entry = self._approvals.get(task_id)
        if entry:
            entry["result"] = "approved" if approved else "rejected"
            entry["event"].set()


manager = ConnectionManager()
