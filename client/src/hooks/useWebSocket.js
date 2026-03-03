import { useEffect, useRef, useCallback } from 'react'

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000'

/**
 * useWebSocket – connects to the WS server and calls onMessage with parsed data.
 * Re-connects automatically on disconnect.
 */
export const useWebSocket = (onMessage) => {
    const ws = useRef(null)
    const reconnectTimer = useRef(null)

    const connect = useCallback(() => {
        ws.current = new WebSocket(WS_URL)

        ws.current.onopen = () => {
            console.log('[WS] Connected to Smart League Manager')
        }

        ws.current.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data)
                onMessage(data)
            } catch (e) {
                console.error('[WS] Failed to parse message:', e)
            }
        }

        ws.current.onclose = () => {
            console.log('[WS] Disconnected – reconnecting in 3s…')
            reconnectTimer.current = setTimeout(connect, 3000)
        }

        ws.current.onerror = (err) => {
            console.error('[WS] Error:', err)
            ws.current.close()
        }
    }, [onMessage])

    useEffect(() => {
        connect()
        return () => {
            clearTimeout(reconnectTimer.current)
            ws.current?.close()
        }
    }, [connect])

    const send = (data) => {
        if (ws.current?.readyState === WebSocket.OPEN) {
            ws.current.send(JSON.stringify(data))
        }
    }

    return { send }
}
