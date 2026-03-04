/**
 * src/ws/wsServer.js
 * WebSocket server for real-time score updates.
 */
'use strict'

const { WebSocketServer } = require('ws')

let wss = null

/**
 * initWebSocket
 * Attaches a WebSocket server to the existing HTTP server.
 */
const initWebSocket = (server) => {
    wss = new WebSocketServer({ server, path: '/ws' })

    wss.on('connection', (ws) => {
        console.log('[WS] Client connected')

        ws.on('close', () => console.log('[WS] Client disconnected'))
    })

    console.log(' ✅  WebSocket server attached at /ws')
    return wss
}

/**
 * broadcast
 * Sends data to all connected clients.
 */
const broadcast = (data) => {
    if (!wss) return
    const message = JSON.stringify(data)
    wss.clients.forEach((client) => {
        if (client.readyState === 1) { // OPEN
            client.send(message)
        }
    })
}

module.exports = { initWebSocket, broadcast }
