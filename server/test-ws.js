/**
 * test-ws.js
 * Run: node test-ws.js  (from /server directory)
 */
const WebSocket = require('ws')

const WS_URL = 'ws://localhost:5000/ws'
console.log(`\n🔌 Connecting to ${WS_URL}...\n`)

const ws = new WebSocket(WS_URL)

ws.on('open', () => {
    console.log('✅  WebSocket CONNECTED successfully!')
    console.log('    Server is running and accepting connections.')
    console.log('    Listening for messages for 10 seconds...\n')
    setTimeout(() => { ws.close(); process.exit(0) }, 10000)
})

ws.on('message', (data) => {
    try {
        console.log('📨  Message received:', JSON.stringify(JSON.parse(data), null, 2))
    } catch {
        console.log('📨  Raw message:', data.toString())
    }
})

ws.on('error', (err) => {
    console.error('❌  FAILED to connect:', err.message)
    console.error('    Make sure the server is running: npm run dev (in /server)\n')
    process.exit(1)
})

ws.on('close', (code) => {
    console.log(`\n🔌  Connection closed (code: ${code})`)
})
