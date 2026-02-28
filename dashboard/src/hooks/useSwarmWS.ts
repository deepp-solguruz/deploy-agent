import { useEffect, useRef, useState, useCallback } from 'react'

export type WSEvent = {
    event: string
    data: Record<string, unknown>
}

export function useSwarmWS(onEvent: (e: WSEvent) => void) {
    const ws = useRef<WebSocket | null>(null)
    const [connected, setConnected] = useState(false)

    useEffect(() => {
        const connect = () => {
            const socket = new WebSocket('ws://localhost:8000/ws')
            ws.current = socket

            socket.onopen = () => setConnected(true)
            socket.onclose = () => { setConnected(false); setTimeout(connect, 2000) }
            socket.onmessage = (e) => {
                try { onEvent(JSON.parse(e.data)) } catch { /* ignore */ }
            }
        }
        connect()
        return () => ws.current?.close()
    }, []) // eslint-disable-line

    const send = useCallback((msg: object) => {
        ws.current?.send(JSON.stringify(msg))
    }, [])

    return { connected, send }
}
