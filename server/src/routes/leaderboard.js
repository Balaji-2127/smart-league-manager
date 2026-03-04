'use strict'
/**
 * src/routes/leaderboard.js
 * JWT-protected route returning the full leaderboard.
 * - GET /api/leaderboard → any authenticated user
 */

const { Router } = require('express')
const db = require('../db/pool')
const { authenticateUser } = require('../middleware/auth')

const router = Router()

// ─── GET /api/leaderboard ─────────────────────────────────────────────────────
router.get('/', authenticateUser, async (req, res, next) => {
    try {
        // Top batsmen by runs
        const { rows: topBatsmen } = await db.query(`
            SELECT p.*, u.name, u.email, t.name AS team_name
            FROM players p
            JOIN users u ON u.id = p.user_id
            LEFT JOIN teams t ON t.id = p.team_id
            WHERE p.runs > 0
            ORDER BY p.runs DESC
            LIMIT 10
        `)

        // Top bowlers by wickets
        const { rows: topBowlers } = await db.query(`
            SELECT p.*, u.name, u.email, t.name AS team_name
            FROM players p
            JOIN users u ON u.id = p.user_id
            LEFT JOIN teams t ON t.id = p.team_id
            WHERE p.wickets > 0
            ORDER BY p.wickets DESC
            LIMIT 10
        `)

        // Points table: wins = 2 pts, loss = 0
        const { rows: pointsTable } = await db.query(`
            SELECT
                t.id,
                t.name AS team_name,
                COUNT(m.id)::int AS played,
                COUNT(CASE WHEN m.winner_id = t.id THEN 1 END)::int AS won,
                COUNT(CASE WHEN m.status = 'completed' AND m.winner_id != t.id THEN 1 END)::int AS lost,
                (COUNT(CASE WHEN m.winner_id = t.id THEN 1 END) * 2)::int AS points
            FROM teams t
            LEFT JOIN matches m ON (m.team1_id = t.id OR m.team2_id = t.id) AND m.status = 'completed'
            GROUP BY t.id, t.name
            ORDER BY points DESC, won DESC
        `)

        res.json({
            status: 'ok',
            data: {
                top_batsmen: topBatsmen,
                top_bowlers: topBowlers,
                points_table: pointsTable,
            }
        })
    } catch (err) {
        next(err)
    }
})

module.exports = router
