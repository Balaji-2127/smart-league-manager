/**
 * src/server.js
 * HTTP server entry point.
 * Imports the Express app, starts listening, and wires up graceful shutdown.
 *
 * Run with:
 *   node src/server.js          → production
 *   nodemon src/server.js       → development (auto-restarts on change)
 */
'use strict'

const http = require('http')
const app = require('./app')
const env = require('./config/env')
const db = require('./db/pool')

const server = http.createServer(app)

// Catch listen errors (e.g. port already in use) with a clear message
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`\n ❌  Port ${env.PORT} is already in use.`)
        console.error(`     Kill the existing process first:`)
        console.error(`     Get-NetTCPConnection -LocalPort ${env.PORT} -State Listen | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force }\n`)
    } else {
        console.error(' ❌  Server error:', err.message)
    }
    process.exit(1)
})

// ─── Start listening ──────────────────────────────────────────────────────────
server.listen(env.PORT, async () => {
    console.log('─────────────────────────────────────────────')
    console.log(` 🏏  Smart League Manager – API Server`)
    console.log(`     Environment : ${env.NODE_ENV}`)
    console.log(`     Listening   : http://localhost:${env.PORT}`)
    console.log(`     Health      : http://localhost:${env.PORT}/api/health`)
    console.log('─────────────────────────────────────────────')

    // Verify DB connection on startup
    try {
        const { rows } = await db.query('SELECT NOW() AS now')
        console.log(` ✅  PostgreSQL connected  (${rows[0].now})`)
    } catch (err) {
        console.error(` ❌  PostgreSQL connection FAILED: ${err.message}`)
        console.error('     Check DB_* values in your .env file.')
    }

    console.log('─────────────────────────────────────────────')
})

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
    console.log(`\n[SERVER] ${signal} received – shutting down gracefully…`)
    server.close(async () => {
        await db.close()
        console.log('[SERVER] HTTP server closed. Bye! 👋')
        process.exit(0)
    })

    // Force-exit if graceful shutdown hangs
    setTimeout(() => {
        console.error('[SERVER] Forced exit after 10 s timeout.')
        process.exit(1)
    }, 10_000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

// Catch unhandled rejections so the process doesn't silently die
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason)
})

module.exports = server // exported for tests
