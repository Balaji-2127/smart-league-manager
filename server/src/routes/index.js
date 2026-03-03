/**
 * src/routes/index.js
 * Central router – mounts all route modules.
 * Add new route groups here as the API grows.
 */
'use strict'

const { Router } = require('express')
const db = require('../db/pool')

const router = Router()

// ─── Health / test route ──────────────────────────────────────────────────────

/**
 * GET /api/health
 * Returns server status and a live database ping.
 * Use this to verify the server + DB connection are working.
 */
router.get('/health', async (req, res) => {
    try {
        const { rows } = await db.query('SELECT NOW() AS server_time')
        res.json({
            status: 'ok',
            server_time: rows[0].server_time,
            uptime_s: Math.floor(process.uptime()),
            node_version: process.version,
            environment: process.env.NODE_ENV,
        })
    } catch (err) {
        res.status(503).json({
            status: 'error',
            message: 'Database unreachable',
            detail: err.message,
        })
    }
})

// ─── Route modules ────────────────────────────────────────────────────────────
const authRoutes = require('./auth')
// const teamRoutes        = require('./teams')        // coming soon
// const tournamentRoutes  = require('./tournaments')  // coming soon
// const matchRoutes       = require('./matches')      // coming soon
// const scoreRoutes       = require('./scores')       // coming soon
// const leaderboardRoutes = require('./leaderboard')  // coming soon
// const playerRoutes      = require('./players')      // coming soon
// const uploadRoutes      = require('./upload')       // coming soon

router.use('/auth', authRoutes)
// router.use('/teams',       teamRoutes)
// router.use('/tournaments', tournamentRoutes)
// router.use('/matches',     matchRoutes)
// router.use('/leaderboard', leaderboardRoutes)
// router.use('/players',     playerRoutes)
// router.use('/upload',      uploadRoutes)

module.exports = router
