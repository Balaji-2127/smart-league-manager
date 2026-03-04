'use strict'
/**
 * src/routes/players.js
 * JWT-protected routes for Player profiles.
 */

const { Router } = require('express')
const db = require('../db/pool')
const { authenticateUser } = require('../middleware/auth')
const validate = require('../middleware/validate')
const logger = require('../utils/logger')

const router = Router()

// GET /api/players
router.get('/', authenticateUser, async (req, res, next) => {
    try {
        const { team_id, search } = req.query
        const params = []
        const conditions = []

        if (team_id) { conditions.push(`p.team_id = $${params.length + 1}`); params.push(team_id) }
        if (search) { conditions.push(`u.name ILIKE $${params.length + 1}`); params.push(`%${search}%`) }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
        const { rows } = await db.query(`
            SELECT p.*, u.name, u.email, t.name AS team_name
            FROM players p JOIN users u ON u.id = p.user_id
            LEFT JOIN teams t ON t.id = p.team_id
            ${where} ORDER BY p.runs DESC
        `, params)

        logger.debug(`Players fetched – ${rows.length} results`)
        res.json({ status: 'ok', data: rows })
    } catch (err) {
        logger.error(`GET /players error: ${err.message}`)
        next(err)
    }
})

// GET /api/players/:id
router.get('/:id', authenticateUser, async (req, res, next) => {
    try {
        const { rows: [player] } = await db.query(`
            SELECT p.*, u.name, u.email, t.name AS team_name
            FROM players p JOIN users u ON u.id = p.user_id
            LEFT JOIN teams t ON t.id = p.team_id
            WHERE p.id = $1
        `, [req.params.id])

        if (!player) return res.status(404).json({ status: 'error', message: 'Player not found' })
        res.json({ status: 'ok', data: player })
    } catch (err) {
        logger.error(`GET /players/${req.params.id} error: ${err.message}`)
        next(err)
    }
})

// PUT /api/players/:id  – admin, captain of that team, or the player themselves
router.put('/:id', authenticateUser, validate.updatePlayer, async (req, res, next) => {
    try {
        const { rows: [player] } = await db.query(
            'SELECT p.*, t.captain_id FROM players p LEFT JOIN teams t ON t.id = p.team_id WHERE p.id = $1',
            [req.params.id]
        )
        if (!player) return res.status(404).json({ status: 'error', message: 'Player not found' })

        const isSelf = player.user_id === req.user.id
        const isCaptain = player.captain_id === req.user.id
        const isAdmin = req.user.role === 'admin'

        if (!isAdmin && !isSelf && !isCaptain) {
            logger.warn(`Unauthorized player update attempt: user:${req.user.id} on player:${req.params.id}`)
            return res.status(403).json({ status: 'error', message: 'Access denied: Not authorized to update this player' })
        }

        const { role, photo_url, runs, wickets, matches_played, batting_avg, strike_rate, economy } = req.body
        const { rows: [updated] } = await db.query(`
            UPDATE players SET
                role = COALESCE($1, role), photo_url = COALESCE($2, photo_url),
                runs = COALESCE($3, runs), wickets = COALESCE($4, wickets),
                matches_played = COALESCE($5, matches_played), batting_avg = COALESCE($6, batting_avg),
                strike_rate = COALESCE($7, strike_rate), economy = COALESCE($8, economy)
            WHERE id = $9 RETURNING *
        `, [role, photo_url, runs, wickets, matches_played, batting_avg, strike_rate, economy, req.params.id])

        logger.info(`Player id:${req.params.id} updated by user:${req.user.id}`)
        res.json({ status: 'ok', data: updated })
    } catch (err) {
        logger.error(`PUT /players/${req.params.id} error: ${err.message}`)
        next(err)
    }
})

module.exports = router
