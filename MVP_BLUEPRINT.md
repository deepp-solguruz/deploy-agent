# AI Developer Swarm — Hackathon MVP Blueprint

## 1️⃣ MVP Architecture

```
┌──────────────────────────────────────────────────┐
│                  Web UI (React)                   │
│              localhost:3000                        │
└──────────────┬───────────────────────────────────┘
               │ REST + WebSocket
               ▼
┌──────────────────────────────────────────────────┐
│            Backend API (NestJS)                   │
│              localhost:4000                        │
│  • Task intake     • WebSocket updates            │
│  • Result storage  • Serves generated artifacts   │
└──────────────┬───────────────────────────────────┘
               │ HTTP (task request/response)
               ▼
┌──────────────────────────────────────────────────┐
│          AI Runtime (Python FastAPI)              │
│              localhost:8000                        │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │      LangGraph Orchestrator                  │ │
│  │  intake → code_agent → test_agent →          │ │
│  │  docs_agent → done                           │ │
│  └──────────────┬──────────────────────────────┘ │
│                 │                                 │
│  ┌──────────────▼──────────────────────────────┐ │
│  │         CrewAI Agents                        │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐    │ │
│  │  │  Code    │ │  Test    │ │  Docs    │    │ │
│  │  │  Agent   │ │  Agent   │ │  Agent   │    │ │
│  │  └──────────┘ └──────────┘ └──────────┘    │ │
│  └─────────────────────────────────────────────┘ │
│                 │                                 │
│  ┌──────────────▼──────────────────────────────┐ │
│  │    ChromaDB (local vector memory)            │ │
│  │    Stores: code patterns, repo context       │ │
│  └─────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

**Data Flow:** User submits task → NestJS forwards to Python → LangGraph runs agents sequentially → Each agent writes artifacts to `/output` → NestJS serves results back.

---

## 2️⃣ Folder Structure

```
hackathon-devagent/
├── backend/                      # NestJS API
│   ├── src/
│   │   ├── app.module.ts
│   │   ├── main.ts
│   │   ├── task/
│   │   │   ├── task.controller.ts    # POST /task, GET /task/:id
│   │   │   ├── task.service.ts       # Calls Python runtime
│   │   │   ├── task.gateway.ts       # WebSocket for live updates
│   │   │   └── task.dto.ts
│   │   └── output/
│   │       └── output.controller.ts  # Serve generated files
│   └── package.json
│
├── ai-runtime/                   # Python FastAPI + LangGraph + CrewAI
│   ├── main.py                   # FastAPI app entry
│   ├── orchestrator/
│   │   ├── __init__.py
│   │   ├── graph.py              # LangGraph workflow definition
│   │   └── state.py              # State schema
│   ├── agents/
│   │   ├── __init__.py
│   │   ├── code_agent.py         # CrewAI Code Agent
│   │   ├── test_agent.py         # CrewAI Test Agent
│   │   └── docs_agent.py         # CrewAI Docs Agent
│   ├── tools/
│   │   ├── __init__.py
│   │   ├── file_writer.py        # Write generated files to /output
│   │   ├── code_generator.py     # LLM code generation wrapper
│   │   └── test_generator.py     # LLM test generation wrapper
│   ├── memory/
│   │   ├── __init__.py
│   │   └── chroma_store.py       # ChromaDB shared memory
│   ├── output/                   # Generated artifacts land here
│   ├── requirements.txt
│   └── .env
│
└── README.md
```

---

## 3️⃣ LangGraph Workflow

### State Schema

```python
# ai-runtime/orchestrator/state.py
from typing import TypedDict, Literal

class SwarmState(TypedDict):
    task_id: str
    task_description: str
    phase: Literal["intake", "coding", "testing", "documenting", "done", "failed"]
    code_output: str          # Generated code (file contents)
    code_files: list[str]     # List of output file paths
    test_output: str          # Generated tests
    docs_output: str          # Generated docs
    error: str | None
    retry_count: int
```

### Graph Definition

```python
# ai-runtime/orchestrator/graph.py
from langgraph.graph import StateGraph, END
from orchestrator.state import SwarmState
from agents.code_agent import run_code_agent
from agents.test_agent import run_test_agent
from agents.docs_agent import run_docs_agent

def should_continue(state: SwarmState) -> str:
    if state.get("error") and state["retry_count"] < 2:
        return "retry"
    if state.get("error"):
        return "fail"
    return "continue"

def intake_node(state: SwarmState) -> dict:
    return {"phase": "coding", "retry_count": 0}

def code_node(state: SwarmState) -> dict:
    result = run_code_agent(state["task_description"])
    return {
        "phase": "testing",
        "code_output": result["code"],
        "code_files": result["files"],
    }

def test_node(state: SwarmState) -> dict:
    result = run_test_agent(state["code_output"], state["task_description"])
    return {"phase": "documenting", "test_output": result["tests"]}

def docs_node(state: SwarmState) -> dict:
    result = run_docs_agent(state["code_output"], state["task_description"])
    return {"phase": "done", "docs_output": result["docs"]}

def error_node(state: SwarmState) -> dict:
    return {"phase": "failed"}

# Build graph
graph = StateGraph(SwarmState)
graph.add_node("intake", intake_node)
graph.add_node("code_agent", code_node)
graph.add_node("test_agent", test_node)
graph.add_node("docs_agent", docs_node)
graph.add_node("error_handler", error_node)

graph.set_entry_point("intake")
graph.add_edge("intake", "code_agent")

graph.add_conditional_edges("code_agent", should_continue, {
    "continue": "test_agent",
    "retry": "code_agent",
    "fail": "error_handler",
})
graph.add_conditional_edges("test_agent", should_continue, {
    "continue": "docs_agent",
    "retry": "test_agent",
    "fail": "error_handler",
})
graph.add_edge("docs_agent", END)
graph.add_edge("error_handler", END)

swarm = graph.compile()
```

---

## 4️⃣ CrewAI Agent Definitions

### Code Agent

```python
# ai-runtime/agents/code_agent.py
from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
from tools.file_writer import FileWriterTool

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1)

code_agent = Agent(
    role="Senior Developer",
    goal="Generate clean, working code from a task description",
    backstory="You write production-quality code. You follow NestJS conventions.",
    tools=[FileWriterTool()],
    llm=llm,
    verbose=True,
)

def run_code_agent(task_description: str) -> dict:
    task = Task(
        description=f"""Generate the code for: {task_description}
        Output working NestJS/TypeScript files.
        Include: module, controller, service, DTOs, guards.
        Write each file using the file_writer tool.""",
        expected_output="List of generated file paths and their contents",
        agent=code_agent,
    )
    crew = Crew(agents=[code_agent], tasks=[task], verbose=True)
    result = crew.kickoff()
    return {"code": str(result), "files": result.output_files if hasattr(result, 'output_files') else []}
```

### Test Agent

```python
# ai-runtime/agents/test_agent.py
from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
from tools.file_writer import FileWriterTool

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1)

test_agent = Agent(
    role="QA Engineer",
    goal="Generate unit tests for the provided code",
    backstory="You write thorough Jest tests. You cover happy paths and edge cases.",
    tools=[FileWriterTool()],
    llm=llm,
    verbose=True,
)

def run_test_agent(code: str, task_description: str) -> dict:
    task = Task(
        description=f"""Generate Jest unit tests for this code:
        ---
        {code}
        ---
        Original task: {task_description}
        Cover: happy path, edge cases, error handling.
        Write .spec.ts files using file_writer tool.""",
        expected_output="Test files with comprehensive coverage",
        agent=test_agent,
    )
    crew = Crew(agents=[test_agent], tasks=[task], verbose=True)
    result = crew.kickoff()
    return {"tests": str(result)}
```

### Docs Agent

```python
# ai-runtime/agents/docs_agent.py
from crewai import Agent, Task, Crew
from langchain_openai import ChatOpenAI
from tools.file_writer import FileWriterTool

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0.1)

docs_agent = Agent(
    role="Technical Writer",
    goal="Generate README and API documentation from code",
    backstory="You write concise, developer-friendly docs with usage examples.",
    tools=[FileWriterTool()],
    llm=llm,
    verbose=True,
)

def run_docs_agent(code: str, task_description: str) -> dict:
    task = Task(
        description=f"""Generate documentation for:
        ---
        {code}
        ---
        Original task: {task_description}
        Output: README.md with setup, API endpoints, usage examples.
        Write files using file_writer tool.""",
        expected_output="README.md with complete documentation",
        agent=docs_agent,
    )
    crew = Crew(agents=[docs_agent], tasks=[task], verbose=True)
    result = crew.kickoff()
    return {"docs": str(result)}
```

---

## 5️⃣ Example Execution Flow

**Input:** `"Build JWT authentication in NestJS with role-based access control"`

```
Step 1 — INTAKE (0s)
  → Task received, state initialized
  → phase: "coding"

Step 2 — CODE AGENT (30s)
  → Generates:
     output/src/auth/auth.module.ts
     output/src/auth/auth.controller.ts
     output/src/auth/auth.service.ts
     output/src/auth/guards/jwt.guard.ts
     output/src/auth/guards/roles.guard.ts
     output/src/auth/dto/login.dto.ts
  → phase: "testing"

Step 3 — TEST AGENT (20s)
  → Reads code from Step 2
  → Generates:
     output/src/auth/__tests__/auth.service.spec.ts
     output/src/auth/__tests__/auth.controller.spec.ts
     output/src/auth/__tests__/roles.guard.spec.ts
  → phase: "documenting"

Step 4 — DOCS AGENT (15s)
  → Reads code from Step 2
  → Generates:
     output/README.md         (setup + API docs)
     output/API.md            (endpoint reference)
  → phase: "done"

Step 5 — DONE (~65s total)
  → All artifacts in /output
  → API returns file list + contents to frontend
```

---

## 6️⃣ Demo Plan (5-Minute Hackathon Pitch)

### Flow
1. **0:00–0:30** — Problem slide: "Devs spend 40% of time context-switching"
2. **0:30–1:00** — Solution slide: "AI agent swarm that codes, tests, and documents for you"
3. **1:00–4:00** — **Live demo:**
   - Type into UI: "Build JWT auth with RBAC in NestJS"
   - Hit submit → show real-time agent progress via WebSocket
   - Code Agent produces auth module files → show in UI
   - Test Agent auto-generates tests → show coverage
   - Docs Agent generates README → show rendered markdown
   - Total time: ~60 seconds
4. **4:00–4:30** — Architecture slide: show the ASCII diagram above
5. **4:30–5:00** — Future vision: "Add Deploy Agent, multi-repo support, CI/CD automation"

### What Judges See
- **Working demo** — not slides, real generated code
- **Agent collaboration** — sequential handoff with shared context
- **Speed** — full feature + tests + docs in ~60 seconds
- **Quality** — generated code follows real NestJS patterns

### Why It's Innovative
- Not a single chatbot — a **team of specialized agents**
- LangGraph gives **deterministic, resumable** orchestration (not random chat loops)
- Shared memory means agents **build on each other's work**
- First step toward autonomous engineering teams

### Future (30-second mention)
- Deploy Agent → CI/CD generation
- Multi-repo awareness
- PR review agent
- Incident auto-response
