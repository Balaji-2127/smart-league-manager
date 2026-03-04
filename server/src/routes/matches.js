'use strict'
/**
 * src/routes/matches.js
 * JWT-protected routes for Match management.
 */

const { Router } = require('express')
const db = require('../db/pool')
const { authenticateUser, authorizeRoles } = require('../middleware/auth')
const validate = require('../middleware/validate')
const logger = require('../utils/logger')
const { broadcast } = require('../ws/wsServer')

const router = Router()

// GET /api/matches
router.get('/', authenticateUser, async (req, res, next) => {
    try {
        const { status, tournament_id, page = 1, limit = 10 } = req.query
        const params = []
        const conditions = []

        if (status) { conditions.push(`m.status = $${params.length + 1}`); params.push(status) }
        if (tournament_id) { conditions.push(`m.tournament_id = $${params.length + 1}`); params.push(tournament_id) }

        const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
        const offset = (parseInt(page) - 1) * parseInt(limit)

        const { rows } = await db.query(`
            SELECT m.*,
                t1.name AS team1_name, t2.name AS team2_name, tn.name AS tournament_name,
                s1.runs AS team1_runs, s1.wickets AS team1_wickets, s1.overs AS team1_overs,
                s2.runs AS team2_runs, s2.wickets AS team2_wickets, s2.overs AS team2_overs
            FROM matches m
            LEFT JOIN teams t1 ON t1.id = m.team1_id
            LEFT JOIN teams t2 ON t2.id = m.team2_id
            LEFT JOIN tournaments tn ON tn.id = m.tournament_id
            LEFT JOIN scores s1 ON s1.match_id = m.id AND s1.team_id = m.team1_id
            LEFT JOIN scores s2 ON s2.match_id = m.id AND s2.team_id = m.team2_id
            ${where}
            ORDER BY m.scheduled_date DESC
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `, [...params, limit, offset])

        const { rows: [{ total }] } = await db.query(`SELECT COUNT(*) AS total FROM matches m ${where}`, params)

        logger.debug(`Matches fetched – ${rows.length}/${total} (page ${page})`)
        res.json({ status: 'ok', data: rows, pagination: { total: parseInt(total), page: parseInt(page), limit: parseInt(limit) } })
    } catch (err) {
        logger.error(`GET /matches error: ${err.message}`)
        next(err)
    }
})

// GET /api/matches/:id
router.get('/:id', authenticateUser, async (req, res, next) => {
    try {
        const { rows: [match] } = await db.query(`
            SELECT m.*,
                t1.name AS team1_name, t2.name AS team2_name, tn.name AS tournament_name,
                s1.runs AS team1_runs, s1.wickets AS team1_wickets, s1.overs AS team1_overs, s1.extras AS team1_extras,
                s2.runs AS team2_runs, s2.wickets AS team2_wickets, s2.overs AS team2_overs, s2.extras AS team2_extras
            FROM matches m
            LEFT JOIN teams t1 ON t1.id = m.team1_id
            LEFT JOIN teams t2 ON t2.id = m.team2_id
            LEFT JOIN tournaments tn ON tn.id = m.tournament_id
            LEFT JOIN scores s1 ON s1.match_id = m.id AND s1.team_id = m.team1_id
            LEFT JOIN scores s2 ON s2.match_id = m.id AND s2.team_id = m.team2_id
            WHERE m.id = $1
        `, [req.params.id])

        if (!match) return res.status(404).json({ status: 'error', message: 'Match not found' })
        res.json({ status: 'ok', data: match })
    } catch (err) {
        logger.error(`GET /matches/${req.params.id} error: ${err.message}`)
        next(err)
    }
})

// POST /api/matches (admin only)
router.post('/', authenticateUser, authorizeRoles(['admin']), validate.createMatch, async (req, res, next) => {
    try {
        const { tournament_id, team1_id, team2_id, scheduled_date } = req.body
        const { rows: [match] } = await db.query(
            'INSERT INTO matches (tournament_id, team1_id, team2_id, scheduled_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [tournament_id || null, team1_id, team2_id, scheduled_date || null]
        )
        logger.info(`Match scheduled: team${team1_id} vs team${team2_id} (id:${match.id}) by admin:${req.user.id}`)
        res.status(201).json({ status: 'ok', data: match })
    } catch (err) {
        logger.error(`POST /matches error: ${err.message}`)
        next(err)
    }
})

// PUT /api/matches/:id (admin only)
router.put('/:id', authenticateUser, authorizeRoles(['admin']), validate.updateMatchStatus, async (req, res, next) => {
    try {
        const { status, winner_id } = req.body
        const { rows: [match] } = await db.query(
            'UPDATE matches SET status = $1, winner_id = $2 WHERE id = $3 RETURNING *',
            [status, winner_id || null, req.params.id]
        )
        if (!match) return res.status(404).json({ status: 'error', message: 'Match not found' })
        logger.info(`Match id:${req.params.id} status → "${status}" by admin:${req.user.id}`)
        res.json({ status: 'ok', data: match })
    } catch (err) {
        logger.error(`PUT /matches/${req.params.id} error: ${err.message}`)
        next(err)
    }
})

// PUT /api/matches/:id/score  ── admin only, broadcasts via WebSocket
router.put('/:id/score', authenticateUser, authorizeRoles(['admin']), validate.updateScore, async (req, res, next) => {
    try {
        const match_id = req.params.id
        const { team_id, runs, wickets, overs, extras = 0 } = req.body

        const { rows: [score] } = await db.query(
            `INSERT INTO scores (match_id, team_id, runs, wickets, overs, extras)
             VALUES ($1, $2, $3, $4, $5, $6)
             ON CONFLICT (match_id, team_id) DO UPDATE SET
               runs = EXCLUDED.runs, wickets = EXCLUDED.wickets,
               overs = EXCLUDED.overs, extras = EXCLUDED.extras,
               updated_at = NOW()
             RETURNING *`,
            [match_id, team_id, runs, wickets, overs, extras]
        )

        broadcast({ type: 'SCORE_UPDATE', match_id, team_id, runs, wickets, overs, extras })
        logger.info(`Score updated: match:${match_id} team:${team_id} → ${runs}/${wickets} (${overs}ov) by admin:${req.user.id}`)
        res.json({ status: 'ok', data: score })
    } catch (err) {
        logger.error(`PUT /matches/${req.params.id}/score error: ${err.message}`)
        next(err)
    }
})

module.exports = router
