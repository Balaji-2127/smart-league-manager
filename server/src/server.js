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
const express = require('express')
const app = require('./app')
const env = require('./config/env')
const db = require('./db/pool')
const { ApolloServer } = require('@apollo/server')
const { expressMiddleware } = require('@apollo/server/express4')
const { initWebSocket } = require('./ws/wsServer')
const { optionalAuth } = require('./middleware/auth')
const typeDefs = require('./graphql/typeDefs')
const resolvers = require('./graphql/resolvers')
const client = require('prom-client')

// ─── Prometheus Metrics Setup ─────────────────────────────────────────────────
// Collects default Node.js metrics (CPU, memory, event loop, etc.)
client.collectDefaultMetrics()
const register = client.register

const server = http.createServer(app)

/**
 * startServer
 * Initializes Apollo, WebSockets, and starts the HTTP server.
 */
const startServer = async () => {
    try {
        // 1. Initialize Apollo Server
        const apollo = new ApolloServer({
            typeDefs,
            resolvers,
        })
        await apollo.start()

        // 2. Mount GraphQL at /graphql
        // Apollo Server v4's expressMiddleware requires express.json() on the route
        app.use('/graphql', express.json(), optionalAuth, expressMiddleware(apollo, {
            context: async ({ req }) => ({
                db,
                user: req.user,
            }),
        }))

        // 3. Prometheus metrics endpoint
        app.get('/metrics', async (req, res) => {
            res.set('Content-Type', register.contentType)
            res.end(await register.metrics())
        })

        // 4. 404 catch-all (must be registered AFTER Apollo, so /graphql isn't intercepted)
        app.use((req, res) => {
            res.status(404).json({ status: 'error', message: `Route not found: ${req.method} ${req.path}` })
        })

        // 3. Initialize WebSocket server
        initWebSocket(server)

        // 4. Catch listen errors (e.g. port already in use)
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

        // 5. Start listening
        server.listen(env.PORT, async () => {
            console.log('─────────────────────────────────────────────')
            console.log(` 🏏  Smart League Manager – API Server`)
            console.log(`     Environment : ${env.NODE_ENV}`)
            console.log(`     REST API    : http://localhost:${env.PORT}/api`)
            console.log(`     GraphQL     : http://localhost:${env.PORT}/graphql`)
            console.log(`     WebSocket   : ws://localhost:${env.PORT}/ws`)
            console.log(`     Metrics     : http://localhost:${env.PORT}/metrics`)
            console.log('─────────────────────────────────────────────')

            // Verify DB connection on startup
            try {
                const { rows } = await db.query('SELECT NOW() AS now')
                console.log(` ✅  PostgreSQL connected  (${rows[0].now})`)
            } catch (err) {
                console.error(` ❌  PostgreSQL connection FAILED: ${err.message}`)
            }
            console.log('─────────────────────────────────────────────')
        })
    } catch (err) {
        console.error(' ❌  Failed to start server:', err.message)
        process.exit(1)
    }
}

startServer()

// ─── Graceful shutdown ────────────────────────────────────────────────────────
const shutdown = async (signal) => {
    console.log(`\n[SERVER] ${signal} received – shutting down gracefully…`)
    server.close(async () => {
        await db.close()
        console.log('[SERVER] HTTP server closed. Bye! 👋')
        process.exit(0)
    })

    // Force-exit after timeout
    setTimeout(() => {
        console.error('[SERVER] Forced exit after 10 s timeout.')
        process.exit(1)
    }, 10_000)
}

process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('SIGINT', () => shutdown('SIGINT'))

process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason)
})

module.exports = server
