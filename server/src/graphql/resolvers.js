/**
 * src/graphql/resolvers.js
 * GraphQL resolvers for the Smart League Manager.
 * Connects GraphQL queries/mutations to the PostgreSQL database.
 */
'use strict'

const db = require('../db/pool')

const resolvers = {
    Query: {
        me: (parent, args, context) => context.user,

        users: async () => {
            const { rows } = await db.query('SELECT * FROM users ORDER BY created_at DESC')
            return rows
        },

        teams: async () => {
            const { rows } = await db.query('SELECT * FROM teams ORDER BY name ASC')
            return rows
        },

        team: async (_, { id }) => {
            const { rows } = await db.query('SELECT * FROM teams WHERE id = $1', [id])
            return rows[0]
        },

        players: async () => {
            const { rows } = await db.query('SELECT * FROM players')
            return rows
        },

        tournaments: async () => {
            const { rows } = await db.query('SELECT * FROM tournaments ORDER BY year DESC, created_at DESC')
            return rows
        },

        matches: async (_, { tournament_id, status }) => {
            let query = 'SELECT * FROM matches WHERE 1=1'
            const params = []
            if (tournament_id) {
                params.push(tournament_id)
                query += ` AND tournament_id = $${params.length}`
            }
            if (status) {
                params.push(status)
                query += ` AND status = $${params.length}`
            }
            query += ' ORDER BY scheduled_date ASC'
            const { rows } = await db.query(query, params)
            return rows
        },

        match: async (_, { id }) => {
            const { rows } = await db.query('SELECT * FROM matches WHERE id = $1', [id])
            return rows[0]
        },
    },

    // ─── Shared Field Resolvers (for nesting) ───────────────────────────────────

    Team: {
        captain: async (team) => {
            if (!team.captain_id) return null
            const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [team.captain_id])
            return rows[0]
        },
        players: async (team) => {
            const { rows } = await db.query('SELECT * FROM players WHERE team_id = $1', [team.id])
            return rows
        }
    },

    Player: {
        user: async (player) => {
            const { rows } = await db.query('SELECT * FROM users WHERE id = $1', [player.user_id])
            return rows[0]
        },
        team: async (player) => {
            if (!player.team_id) return null
            const { rows } = await db.query('SELECT * FROM teams WHERE id = $1', [player.team_id])
            return rows[0]
        }
    },

    Match: {
        tournament: async (match) => {
            if (!match.tournament_id) return null
            const { rows } = await db.query('SELECT * FROM tournaments WHERE id = $1', [match.tournament_id])
            return rows[0]
        },
        team1: async (match) => {
            const { rows } = await db.query('SELECT * FROM teams WHERE id = $1', [match.team1_id])
            return rows[0]
        },
        team2: async (match) => {
            const { rows } = await db.query('SELECT * FROM teams WHERE id = $1', [match.team2_id])
            return rows[0]
        },
        winner: async (match) => {
            if (!match.winner_id) return null
            const { rows } = await db.query('SELECT * FROM teams WHERE id = $1', [match.winner_id])
            return rows[0]
        },
        score1: async (match) => {
            const { rows } = await db.query('SELECT * FROM scores WHERE match_id = $1 AND team_id = $2', [match.id, match.team1_id])
            return rows[0]
        },
        score2: async (match) => {
            const { rows } = await db.query('SELECT * FROM scores WHERE match_id = $1 AND team_id = $2', [match.id, match.team2_id])
            return rows[0]
        }
    },

    Mutation: {
        createTeam: async (_, { name, captain_id, logo_url }, { user }) => {
            if (!user) throw new Error('Unauthorized')
            if (user.role !== 'admin' && user.id !== parseInt(captain_id)) {
                throw new Error('Forbidden: Only admins or the captain themselves can create a team.')
            }

            const { rows } = await db.query(
                'INSERT INTO teams (name, captain_id, logo_url) VALUES ($1, $2, $3) RETURNING *',
                [name, captain_id, logo_url]
            )
            return rows[0]
        },

        addPlayerToTeam: async (_, { team_id, user_id, role }, { user }) => {
            if (!user) throw new Error('Unauthorized')

            // Verifying permission (admin or team captain)
            if (user.role !== 'admin') {
                const { rows: teamRows } = await db.query('SELECT captain_id FROM teams WHERE id = $1', [team_id])
                if (!teamRows[0] || teamRows[0].captain_id !== user.id) {
                    throw new Error('Forbidden: Only the team captain or admin can add players.')
                }
            }

            const { rows } = await db.query(
                `INSERT INTO players (user_id, team_id, role) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (user_id) DO UPDATE SET team_id = EXCLUDED.team_id, role = EXCLUDED.role
                 RETURNING *`,
                [user_id, team_id, role]
            )
            return rows[0]
        },

        createTournament: async (_, { name, year }, { user }) => {
            if (user?.role !== 'admin') throw new Error('Forbidden: Admin only')
            const { rows } = await db.query(
                'INSERT INTO tournaments (name, year) VALUES ($1, $2) RETURNING *',
                [name, year]
            )
            return rows[0]
        },

        createMatch: async (_, { tournament_id, team1_id, team2_id, scheduled_date }, { user }) => {
            if (user?.role !== 'admin') throw new Error('Forbidden: Admin only')
            const { rows } = await db.query(
                'INSERT INTO matches (tournament_id, team1_id, team2_id, scheduled_date) VALUES ($1, $2, $3, $4) RETURNING *',
                [tournament_id, team1_id, team2_id, scheduled_date]
            )
            return rows[0]
        },

        updateScore: async (_, { match_id, team_id, runs, wickets, overs, extras }, { user }) => {
            if (user?.role !== 'admin') throw new Error('Forbidden: Admin only')

            const { rows } = await db.query(
                `INSERT INTO scores (match_id, team_id, runs, wickets, overs, extras)
                 VALUES ($1, $2, $3, $4, $5, $6)
                 ON CONFLICT (match_id, team_id) DO UPDATE SET
                 runs = EXCLUDED.runs, wickets = EXCLUDED.wickets, overs = EXCLUDED.overs, extras = EXCLUDED.extras, updated_at = NOW()
                 RETURNING *`,
                [match_id, team_id, runs, wickets, overs, extras || 0]
            )

            // Trigger WebSocket broadcast through global utility
            const { broadcast } = require('../ws/wsServer')
            broadcast({ type: 'SCORE_UPDATE', match_id, team_id, runs, wickets, overs, extras: extras || 0 })

            return rows[0]
        }
    }
}

module.exports = resolvers
