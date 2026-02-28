# AI Developer Swarm — How to Run

## Step 1 — Backend (FastAPI)
```bash
cd ai-runtime
cp .env.example .env      # add ANTHROPIC_API_KEY
pip install -r requirements.txt
python3 main.py            # → localhost:8000
```

## Step 2 — Dashboard (React)
```bash
cd dashboard
npm install
npm run dev               # → localhost:3000
```

## Step 3 — VS Code Extension
```bash
cd vscode-extension
npm install
npm run compile
# In VS Code: F5 → opens Extension Development Host
# Ctrl+Shift+P → "Dev Swarm: Submit Task"
```

## API Quick Test
```bash
# Submit a task (agentless test)
curl -X POST http://localhost:8000/task \
  -H "Content-Type: application/json" \
  -d '{"description": "Build JWT auth with RBAC in NestJS"}'

# Approve pending changes
curl -X POST http://localhost:8000/approve \
  -H "Content-Type: application/json" \
  -d '{"task_id": "YOUR_TASK_ID", "approved": true}'

# Rollback
curl -X POST "http://localhost:8000/rollback?repo_path=/path/to/repo"
```

## WebSocket Events (ws://localhost:8000/ws)

| Event | Direction | Payload |
|---|---|---|
| `workflow_start` | Server → Client | `{description, repo_path}` |
| `agent_start` | Server → Client | `{task_id, agent}` |
| `agent_done` | Server → Client | `{task_id, agent, files}` |
| `agent_error` | Server → Client | `{task_id, agent, error}` |
| `approval_request` | Server → Client | `{task_id, code_files, test_files, docs_files}` |
| `approval_response` | Client → Server | `{task_id, approved: bool}` |
| `workflow_complete` | Server → Client | `{task_id, code_files, test_files, docs_files}` |
