import { useState, useCallback, Fragment } from 'react'
import { useSwarmWS, type WSEvent } from './hooks/useSwarmWS'

// ── Types ────────────────────────────────────────────────────────
type FeedItem = { id: number; type: string; text: string; time: string }
type AgentStatus = 'idle' | 'active' | 'done' | 'error' | 'waiting'
type FileItem = { path: string; content: string; expanded: boolean }

const AGENTS = ['code_agent', 'test_agent', 'docs_agent', 'deploy_agent'] as const
const AGENT_ICONS: Record<string, string> = { code_agent: '💻', test_agent: '🧪', docs_agent: '📝', deploy_agent: '🚀' }

let feedId = 0
function now() { return new Date().toLocaleTimeString() }

export default function App() {
    const [description, setDescription] = useState('')
    const [repoPath, setRepoPath] = useState('')
    const [running, setRunning] = useState(false)
    const [feed, setFeed] = useState<FeedItem[]>([])
    const [agentStatus, setAgentStatus] = useState<Record<string, AgentStatus>>({})
    const [files, setFiles] = useState<FileItem[]>([])
    const [approval, setApproval] = useState<null | { task_id: string; files: string[] }>(null)
    const [tab, setTab] = useState<'files' | 'feed'>('feed')
    const [taskId, setTaskId] = useState<string | null>(null)

    const addFeed = (type: string, text: string) =>
        setFeed(f => [{ id: feedId++, type, text, time: now() }, ...f.slice(0, 99)])

    const handleEvent = useCallback((e: WSEvent) => {
        const d = e.data as Record<string, string & string[]>
        switch (e.event) {
            case 'workflow_start':
                addFeed('info', `▶ Started: ${d.description}`)
                setAgentStatus({})
                setFiles([])
                break
            case 'rate_limit_wait':
                addFeed('info', `⏳ ${d.agent} — cooling down (rate limit protection)...`)
                setAgentStatus(s => ({ ...s, [d.agent]: 'waiting' }))
                break
            case 'agent_start':
                addFeed('start', `⚡ ${d.agent} working...`)
                setAgentStatus(s => ({ ...s, [d.agent]: 'active' }))
                break
            case 'agent_done':
                addFeed('done', `✓ ${d.agent} done  — ${(d.files as unknown as string[])?.length ?? 0} file(s)`)
                setAgentStatus(s => ({ ...s, [d.agent]: 'done' }))
                break
            case 'agent_error':
                addFeed('error', `✗ ${d.agent} error: ${d.error}`)
                setAgentStatus(s => ({ ...s, [d.agent]: 'error' }))
                break
            case 'approval_request':
                addFeed('approval', '⏸ Waiting for your approval before writing...')
                setApproval({ task_id: d.task_id, files: [...(d.code_files as unknown as string[] ?? []), ...(d.test_files as unknown as string[] ?? []), ...(d.docs_files as unknown as string[] ?? [])] })
                break
            case 'workflow_complete':
                addFeed('done', '🎉 Workflow complete!')
                setRunning(false)
                fetchFiles(d.repo_path as unknown as string)
                break
            case 'workflow_failed':
                addFeed('error', `❌ Workflow failed: ${d.error}`)
                setRunning(false)
                break
        }
    }, [])

    const { connected, send } = useSwarmWS(handleEvent)

    const fetchFiles = async (rp?: string) => {
        const path = rp ?? repoPath
        if (!path) return
        const res = await fetch(`/files?repo_path=${encodeURIComponent(path)}`)
        const data = await res.json()
        setFiles(data.files.map((f: { path: string; content: string }) => ({ ...f, expanded: false })))
        setTab('files')
    }

    const submitTask = async () => {
        if (!description) return
        setRunning(true)
        addFeed('info', `📤 Submitting task...`)
        const body: Record<string, string> = { description }
        if (repoPath) body.repo_path = repoPath
        const res = await fetch('/task', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json()
        setTaskId(data.task_id)
        setRunning(false)
    }

    const handleApproval = async (approved: boolean) => {
        if (!approval) return
        send({ event: 'approval_response', task_id: approval.task_id, approved })
        await fetch('/approve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ task_id: approval.task_id, approved }) })
        addFeed(approved ? 'done' : 'error', approved ? '✓ Approved — writing to disk' : '✗ Rejected — changes discarded')
        setApproval(null)
    }

    const toggleFile = (i: number) =>
        setFiles(fs => fs.map((f, idx) => idx === i ? { ...f, expanded: !f.expanded } : f))

    return (
        <div className="app">
            {/* Header */}
            <header className="header">
                <span>🤖</span>
                <h1>AI Developer Swarm</h1>
                <span className={`badge ${connected ? 'connected' : ''}`}>{connected ? '● connected' : '○ disconnected'}</span>
                {taskId && <span className="badge">task: {taskId}</span>}
            </header>

            {/* Sidebar */}
            <aside className="sidebar">
                <p className="section-title">Submit Task</p>
                <div className="task-form">
                    <textarea
                        placeholder="Build JWT authentication with role-based access control..."
                        value={description}
                        onChange={e => setDescription(e.target.value)}
                    />
                    <input
                        placeholder="Repo path (optional, e.g. /home/dev/my-project)"
                        value={repoPath}
                        onChange={e => setRepoPath(e.target.value)}
                    />
                    <button className="btn btn-primary" onClick={submitTask} disabled={running || !description}>
                        {running ? 'Running…' : '▶ Run Swarm'}
                    </button>
                </div>

                {/* Agent pipeline */}
                <p className="section-title">Agent Pipeline</p>
                <div className="pipeline">
                    {AGENTS.map((a, i) => (
                        <Fragment key={a}>
                            <div className="agent-step">
                                <div className={`agent-dot ${agentStatus[a] ?? ''}`}>{AGENT_ICONS[a]}</div>
                                <span className="agent-label">{a.replace('_agent', '')}</span>
                            </div>
                            {i < AGENTS.length - 1 && <span className="pipeline-arrow" key={`arrow-${i}`}>›</span>}
                        </Fragment>
                    ))}
                </div>

                {/* Feed */}
                <p className="section-title">Activity</p>
                <div className="feed">
                    {feed.map(item => (
                        <div key={item.id} className={`feed-item ${item.type}`}>
                            <span style={{ opacity: 0.5, fontSize: 10 }}>{item.time}</span> {item.text}
                        </div>
                    ))}
                    {feed.length === 0 && <p style={{ fontSize: 12, color: '#374151' }}>No activity yet.</p>}
                </div>
            </aside>

            {/* Main panel */}
            <main className="main">
                {/* Approval banner */}
                {approval && (
                    <div className="approval-banner">
                        <h3>⏸ Approval Required</h3>
                        <p>{approval.files.length} file(s) ready to write. Review and approve or reject.</p>
                        <ul style={{ fontSize: 11, color: '#6b7280', marginBottom: 12, paddingLeft: 16 }}>
                            {approval.files.map(f => <li key={f}>{f}</li>)}
                        </ul>
                        <div className="approval-actions">
                            <button className="btn btn-success" onClick={() => handleApproval(true)}>✓ Approve & Write</button>
                            <button className="btn btn-danger" onClick={() => handleApproval(false)}>✗ Reject</button>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="tabs">
                    <button className={`tab ${tab === 'feed' ? 'active' : ''}`} onClick={() => setTab('feed')}>Activity</button>
                    <button className={`tab ${tab === 'files' ? 'active' : ''}`} onClick={() => setTab('files')}>
                        Files {files.length > 0 && `(${files.length})`}
                    </button>
                </div>

                <div className="panel">
                    {tab === 'feed' && (
                        <div>
                            {!running && !taskId && (
                                <p style={{ color: '#374151', fontSize: 13, textAlign: 'center', marginTop: 40 }}>
                                    Submit a task to watch agents work in real-time.
                                </p>
                            )}
                        </div>
                    )}

                    {tab === 'files' && (
                        <div className="file-list">
                            {files.length === 0 && <p style={{ color: '#374151', fontSize: 13 }}>No files yet. Run a task first.</p>}
                            {files.map((f, i) => (
                                <div className="file-card" key={f.path}>
                                    <div className="file-card-header" onClick={() => toggleFile(i)}>
                                        <span>{f.path}</span>
                                        <span>{f.expanded ? '▲' : '▼'}</span>
                                    </div>
                                    {f.expanded && (
                                        <div className="file-card-body">
                                            <pre>{f.content}</pre>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    )
}
