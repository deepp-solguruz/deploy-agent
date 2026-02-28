import * as vscode from 'vscode'
import * as WebSocket from 'ws'
import * as path from 'path'
import * as fs from 'fs'

const API = 'http://localhost:8000'
const WS_URL = 'ws://localhost:8000/ws'

let ws: WebSocket | null = null
let statusBar: vscode.StatusBarItem
let outputChannel: vscode.OutputChannel

// ── Activation ────────────────────────────────────────────────────

export function activate(ctx: vscode.ExtensionContext) {
    outputChannel = vscode.window.createOutputChannel('AI Dev Swarm')
    statusBar = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left, 100)
    statusBar.text = '$(robot) Swarm'
    statusBar.command = 'devswarm.submitTask'
    statusBar.show()
    ctx.subscriptions.push(statusBar, outputChannel)

    connectWebSocket()

    ctx.subscriptions.push(
        vscode.commands.registerCommand('devswarm.submitTask', submitTask),
        vscode.commands.registerCommand('devswarm.viewFiles', viewFiles),
        vscode.commands.registerCommand('devswarm.rollback', rollback),
    )
}

export function deactivate() { ws?.close() }

// ── WebSocket ─────────────────────────────────────────────────────

function connectWebSocket() {
    ws = new WebSocket(WS_URL)

    ws.on('open', () => {
        statusBar.text = '$(robot) Swarm $(check)'
        log('Connected to AI Developer Swarm backend')
    })

    ws.on('close', () => {
        statusBar.text = '$(robot) Swarm $(x)'
        setTimeout(connectWebSocket, 3000)      // reconnect
    })

    ws.on('message', async (raw: Buffer) => {
        const msg = JSON.parse(raw.toString()) as { event: string; data: Record<string, unknown> }
        await handleEvent(msg.event, msg.data)
    })
}

function send(msg: object) { ws?.send(JSON.stringify(msg)) }

// ── Event handler ─────────────────────────────────────────────────

async function handleEvent(event: string, data: Record<string, unknown>) {
    switch (event) {
        case 'workflow_start':
            log(`▶ Workflow started: ${data.description}`)
            statusBar.text = '$(loading~spin) Swarm running...'
            break

        case 'agent_start':
            log(`⚡ ${data.agent} working...`)
            vscode.window.setStatusBarMessage(`AI Swarm: ${data.agent} active...`, 5000)
            break

        case 'agent_done':
            log(`✓ ${data.agent} done`)
            break

        case 'agent_error':
            log(`✗ ${data.agent} error: ${data.error}`)
            vscode.window.showWarningMessage(`Swarm: ${data.agent} failed — ${data.error}`)
            break

        case 'approval_request':
            await handleApproval(data as Record<string, string[]> & { task_id: string })
            break

        case 'workflow_complete': {
            statusBar.text = '$(robot) Swarm $(check)'
            log('🎉 Workflow complete!')
            const files = [...(data.code_files as string[] ?? []), ...(data.test_files as string[] ?? []), ...(data.docs_files as string[] ?? [])]
            const action = await vscode.window.showInformationMessage(
                `AI Swarm: Done! ${files.length} file(s) generated.`,
                'View Files',
            )
            if (action === 'View Files') vscode.commands.executeCommand('devswarm.viewFiles')
            break
        }

        case 'workflow_failed':
            statusBar.text = '$(robot) Swarm $(x)'
            vscode.window.showErrorMessage(`Swarm failed: ${data.error}`)
            break
    }
}

// ── Approval flow ─────────────────────────────────────────────────

async function handleApproval(data: { task_id: string; code_files?: string[]; test_files?: string[]; docs_files?: string[] }) {
    const allFiles = [...(data.code_files ?? []), ...(data.test_files ?? []), ...(data.docs_files ?? [])]
    const preview = allFiles.slice(0, 8).join('\n') + (allFiles.length > 8 ? `\n...+${allFiles.length - 8} more` : '')

    const chosen = await vscode.window.showInformationMessage(
        `AI Swarm: ${allFiles.length} file(s) ready to write to disk.\n\n${preview}`,
        { modal: true },
        'Approve & Write',
        'Reject',
        'Show Diff',
    )

    if (chosen === 'Show Diff') {
        // Open the output channel so user can inspect
        outputChannel.show()
        log('Files to be written:\n' + allFiles.map(f => `  • ${f}`).join('\n'))
        // Re-ask
        const final = await vscode.window.showInformationMessage(
            'Proceed after reviewing the output panel?',
            { modal: true },
            'Approve & Write',
            'Reject',
        )
        await resolveApproval(data.task_id, final === 'Approve & Write')
    } else {
        await resolveApproval(data.task_id, chosen === 'Approve & Write')
    }
}

async function resolveApproval(task_id: string, approved: boolean) {
    send({ event: 'approval_response', task_id, approved })
    await apiFetch('/approve', 'POST', { task_id, approved })
    log(approved ? '✓ Approved — files written to disk' : '✗ Rejected — no files written')
}

// ── Commands ─────────────────────────────────────────────────────

async function submitTask() {
    const description = await vscode.window.showInputBox({
        prompt: 'Describe the feature to build',
        placeHolder: 'Build JWT auth with RBAC in NestJS...',
    })
    if (!description) return

    // Use current workspace folder as repo_path
    const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

    const customPath = await vscode.window.showInputBox({
        prompt: 'Repo path to update (Enter to use workspace)',
        value: repoPath ?? '',
    })

    log(`Submitting: ${description}`)
    statusBar.text = '$(loading~spin) Swarm running...'

    try {
        const result = await apiFetch('/task', 'POST', {
            description,
            repo_path: customPath || repoPath,
        })
        log(`Task completed: ${JSON.stringify(result, null, 2)}`)
    } catch (e) {
        vscode.window.showErrorMessage(`Swarm error: ${e}`)
        statusBar.text = '$(robot) Swarm $(x)'
    }
}

async function viewFiles() {
    const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (!repoPath) { vscode.window.showErrorMessage('No workspace open'); return }

    const data = await apiFetch(`/files?repo_path=${encodeURIComponent(repoPath)}`, 'GET')
    const files: { path: string; content: string }[] = data.files ?? []
    if (!files.length) { vscode.window.showInformationMessage('No generated files found.'); return }

    const picked = await vscode.window.showQuickPick(files.map(f => f.path), { placeHolder: 'Select file to view' })
    if (!picked) return

    const file = files.find(f => f.path === picked)!
    const fullPath = path.join(repoPath, file.path)

    // Open the actual file if it exists, otherwise preview in untitled
    if (fs.existsSync(fullPath)) {
        vscode.workspace.openTextDocument(vscode.Uri.file(fullPath)).then(doc =>
            vscode.window.showTextDocument(doc)
        )
    } else {
        const doc = await vscode.workspace.openTextDocument({ content: file.content, language: 'typescript' })
        vscode.window.showTextDocument(doc)
    }
}

async function rollback() {
    const repoPath = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
    if (!repoPath) return

    const confirm = await vscode.window.showWarningMessage(
        'Roll back all files to the state before the last swarm run?',
        { modal: true },
        'Yes, Rollback',
    )
    if (confirm !== 'Yes, Rollback') return

    await apiFetch(`/rollback?repo_path=${encodeURIComponent(repoPath)}`, 'POST')
    vscode.window.showInformationMessage('Rolled back successfully.')
}

// ── Helpers ───────────────────────────────────────────────────────

function log(msg: string) { outputChannel.appendLine(`[${new Date().toLocaleTimeString()}] ${msg}`) }

async function apiFetch(endpoint: string, method: string, body?: object) {
    const url = `${API}${endpoint}`
    const opts: RequestInit = { method, headers: { 'Content-Type': 'application/json' } }
    if (body) opts.body = JSON.stringify(body)
    const res = await fetch(url, opts)
    return res.json()
}
