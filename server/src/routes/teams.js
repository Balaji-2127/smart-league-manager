'use strict'
/**
 * src/routes/teams.js
 * JWT-protected routes for Team management.
 */

const { Router } = require('express')
const db = require('../db/pool')
const { authenticateUser, authorizeRoles } = require('../middleware/auth')
const validate = require('../middleware/validate')
const logger = require('../utils/logger')

const router = Router()

// GET /api/teams
router.get('/', authenticateUser, async (req, res, next) => {
    try {
        const { rows } = await db.query(`
            SELECT t.*, u.name AS captain_name
            FROM teams t
            LEFT JOIN users u ON u.id = t.captain_id
            ORDER BY t.created_at DESC
        `)
        logger.debug(`Teams list fetched – ${rows.length} results`)
        res.json({ status: 'ok', data: rows })
    } catch (err) {
        logger.error(`GET /teams error: ${err.message}`)
        next(err)
    }
})

// GET /api/teams/:id
router.get('/:id', authenticateUser, async (req, res, next) => {
    try {
        const { rows: [team] } = await db.query(
            'SELECT t.*, u.name AS captain_name FROM teams t LEFT JOIN users u ON u.id = t.captain_id WHERE t.id = $1',
            [req.params.id]
        )
        if (!team) return res.status(404).json({ status: 'error', message: 'Team not found' })

        const { rows: players } = await db.query(`
            SELECT p.*, u.name, u.email FROM players p
            JOIN users u ON u.id = p.user_id WHERE p.team_id = $1
        `, [req.params.id])

        res.json({ status: 'ok', data: { ...team, players } })
    } catch (err) {
        logger.error(`GET /teams/${req.params.id} error: ${err.message}`)
        next(err)
    }
})

// POST /api/teams
router.post('/', authenticateUser, authorizeRoles(['admin', 'captain']), validate.createTeam, async (req, res, next) => {
    try {
        const { name, logo_url } = req.body
        const captain_id = req.user.role === 'admin' ? (req.body.captain_id ?? req.user.id) : req.user.id

        const { rows: [team] } = await db.query(
            'INSERT INTO teams (name, captain_id, logo_url) VALUES ($1, $2, $3) RETURNING *',
            [name, captain_id, logo_url || null]
        )
        logger.info(`Team created: "${team.name}" (id: ${team.id}) by user ${req.user.id}`)
        res.status(201).json({ status: 'ok', data: team })
    } catch (err) {
        logger.error(`POST /teams error: ${err.message}`)
        next(err)
    }
})

// POST /api/teams/:id/players
router.post('/:id/players', authenticateUser, authorizeRoles(['admin', 'captain']), validate.addPlayer, async (req, res, next) => {
    try {
        const team_id = req.params.id
        const { user_id, role: playerRole } = req.body

        if (req.user.role === 'captain') {
            const { rows: [team] } = await db.query('SELECT captain_id FROM teams WHERE id = $1', [team_id])
            if (!team || team.captain_id !== req.user.id) {
                logger.warn(`Captain ${req.user.id} tried to add player to team ${team_id} (not their team)`)
                return res.status(403).json({ status: 'error', message: 'You can only manage your own team' })
            }
        }

        const { rows: [player] } = await db.query(
            `INSERT INTO players (user_id, team_id, role)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id) DO UPDATE SET team_id = EXCLUDED.team_id, role = EXCLUDED.role
             RETURNING *`,
            [user_id, team_id, playerRole || 'batsman']
        )
        logger.info(`Player user:${user_id} added to team:${team_id} by user:${req.user.id}`)
        res.status(201).json({ status: 'ok', data: player })
    } catch (err) {
        logger.error(`POST /teams/${req.params.id}/players error: ${err.message}`)
        next(err)
    }
})

module.exports = router
