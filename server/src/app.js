/**
 * src/app.js
 * Express application factory.
 * Configures middleware and mounts the router.
 * Deliberately kept separate from the HTTP server so it can be imported
 * by test suites without binding to a port.
 */
'use strict'

const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const morgan = require('morgan')
const env = require('./config/env')
const routes = require('./routes')

const app = express()

// ─── Security headers ─────────────────────────────────────────────────────────
app.use(helmet())

// ─── CORS ─────────────────────────────────────────────────────────────────────
app.use(cors({
    origin: env.isDev
        ? (origin, callback) => {
            // Allow any localhost / 127.0.0.1 origin in development
            if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
                callback(null, true)
            } else {
                callback(new Error(`CORS blocked: ${origin}`))
            }
        }
        : process.env.CLIENT_ORIGIN,
    credentials: true,
}))

// ─── Request logging ──────────────────────────────────────────────────────────
// 'dev'  → concise coloured output in development
// 'combined' → Apache-style log in production
app.use(morgan(env.isDev ? 'dev' : 'combined'))

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// ─── API routes ───────────────────────────────────────────────────────────────
app.use('/api', routes)

// ─── 404 catch-all ────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ status: 'error', message: `Route not found: ${req.method} ${req.path}` })
})

// ─── Global error handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.stack || err.message)
    const status = err.status || err.statusCode || 500
    res.status(status).json({
        status: 'error',
        message: env.isDev ? err.message : 'Internal server error',
        ...(env.isDev && { stack: err.stack }),
    })
})

module.exports = app
