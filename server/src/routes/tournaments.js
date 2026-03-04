'use strict'
/**
 * src/routes/tournaments.js
 * JWT-protected routes for Tournament management.
 */

const { Router } = require('express')
const db = require('../db/pool')
const { authenticateUser, authorizeRoles } = require('../middleware/auth')
const validate = require('../middleware/validate')
const logger = require('../utils/logger')

const router = Router()

// GET /api/tournaments
router.get('/', authenticateUser, async (req, res, next) => {
    try {
        const { status } = req.query
        let query = 'SELECT * FROM tournaments'
        const params = []
        if (status) { query += ' WHERE status = $1'; params.push(status) }
        query += ' ORDER BY created_at DESC'
        const { rows } = await db.query(query, params)
        logger.debug(`Tournaments fetched – ${rows.length} results (filter: ${status || 'none'})`)
        res.json({ status: 'ok', data: rows })
    } catch (err) {
        logger.error(`GET /tournaments error: ${err.message}`)
        next(err)
    }
})

// GET /api/tournaments/:id
router.get('/:id', authenticateUser, async (req, res, next) => {
    try {
        const { rows: [tournament] } = await db.query('SELECT * FROM tournaments WHERE id = $1', [req.params.id])
        if (!tournament) return res.status(404).json({ status: 'error', message: 'Tournament not found' })
        res.json({ status: 'ok', data: tournament })
    } catch (err) {
        logger.error(`GET /tournaments/${req.params.id} error: ${err.message}`)
        next(err)
    }
})

// POST /api/tournaments (admin only)
router.post('/', authenticateUser, authorizeRoles(['admin']), validate.createTournament, async (req, res, next) => {
    try {
        const { name, year } = req.body
        const { rows: [tournament] } = await db.query(
            'INSERT INTO tournaments (name, year) VALUES ($1, $2) RETURNING *',
            [name, year]
        )
        logger.info(`Tournament created: "${tournament.name}" (${tournament.year}) by admin:${req.user.id}`)
        res.status(201).json({ status: 'ok', data: tournament })
    } catch (err) {
        logger.error(`POST /tournaments error: ${err.message}`)
        next(err)
    }
})

// PUT /api/tournaments/:id (admin only)
router.put('/:id', authenticateUser, authorizeRoles(['admin']), validate.updateTournamentStatus, async (req, res, next) => {
    try {
        const { status } = req.body
        const { rows: [tournament] } = await db.query(
            'UPDATE tournaments SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        )
        if (!tournament) return res.status(404).json({ status: 'error', message: 'Tournament not found' })
        logger.info(`Tournament id:${req.params.id} status → "${status}" by admin:${req.user.id}`)
        res.json({ status: 'ok', data: tournament })
    } catch (err) {
        logger.error(`PUT /tournaments/${req.params.id} error: ${err.message}`)
        next(err)
    }
})

module.exports = router
