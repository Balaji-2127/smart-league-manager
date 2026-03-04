/**
 * test-ws.js
 * Run with: node test-ws.js
 * Tests the WebSocket connection to the Smart League Manager server.
 */

const WebSocket = require('ws')

const WS_URL = 'ws://localhost:5000/ws'
console.log(`\n🔌 Connecting to ${WS_URL} ...\n`)

const ws = new WebSocket(WS_URL)

ws.on('open', () => {
    console.log('✅  WebSocket CONNECTED successfully!')
    console.log('    Waiting for broadcast messages...')
    console.log('    (Trigger an updateScore mutation to see a live message)\n')

    // Keep alive for 30 seconds then close
    setTimeout(() => {
        console.log('\n⏰  30s timeout reached – closing connection.')
        ws.close()
    }, 30000)
})

ws.on('message', (data) => {
    try {
        const msg = JSON.parse(data)
        console.log('📨  Message received:', JSON.stringify(msg, null, 2))
    } catch {
        console.log('📨  Raw message:', data.toString())
    }
})

ws.on('error', (err) => {
    console.error('❌  WebSocket ERROR:', err.message)
    console.error('\n   Is the server running? Start it with:')
    console.error('   cd server && npm run dev\n')
})

ws.on('close', (code, reason) => {
    console.log(`\n🔌  WebSocket CLOSED (code: ${code}${reason ? ', reason: ' + reason : ''})`)
})
