'use strict'
/**
 * src/routes/index.js
 * Central router – mounts all route modules.
 */

const { Router } = require('express')
const db = require('../db/pool')

const router = Router()

// ─── Health / test route ──────────────────────────────────────────────────────
/**
 * GET /api/health
 * Returns server status and a live database ping.
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
        res.status(503).json({ status: 'error', message: 'Database unreachable', detail: err.message })
    }
})

// ─── Route modules ────────────────────────────────────────────────────────────
const authRoutes = require('./auth')
const teamRoutes = require('./teams')
const tournamentRoutes = require('./tournaments')
const matchRoutes = require('./matches')
const leaderboardRoutes = require('./leaderboard')
const playerRoutes = require('./players')

router.use('/auth', authRoutes)          // Public: register, login
router.use('/teams', teamRoutes)          // Protected: all users read, admin/captain write
router.use('/tournaments', tournamentRoutes)    // Protected: all users read, admin write
router.use('/matches', matchRoutes)         // Protected: all users read, admin write + score
router.use('/leaderboard', leaderboardRoutes)   // Protected: all users read
router.use('/players', playerRoutes)        // Protected: all users read, admin/captain/self write

module.exports = router
