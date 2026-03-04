'use strict'
/**
 * src/middleware/validate.js
 * Reusable express-validator schemas for all routes.
 *
 * Usage:
 *   router.post('/register', validate.register, handler)
 *
 * The `handleValidation` middleware reads express-validator results
 * and returns a 422 with all errors if any field is invalid.
 */

const { body, param, query, validationResult } = require('express-validator')

// ─── handleValidation ─────────────────────────────────────────────────────────
// Place this AFTER the validation chain, BEFORE the route handler.
const handleValidation = (req, res, next) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        return res.status(422).json({
            status: 'error',
            message: 'Validation failed',
            errors: errors.array().map(e => ({ field: e.path, message: e.msg })),
        })
    }
    next()
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
const register = [
    body('name')
        .trim()
        .notEmpty().withMessage('Name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters'),

    body('email')
        .trim()
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
        .matches(/[A-Za-z]/).withMessage('Password must contain at least one letter')
        .matches(/[0-9]/).withMessage('Password must contain at least one number'),

    body('role')
        .optional()
        .isIn(['admin', 'captain', 'player', 'viewer'])
        .withMessage('Role must be: admin | captain | player | viewer'),

    handleValidation,
]

const login = [
    body('email')
        .trim().notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Must be a valid email address')
        .normalizeEmail(),

    body('password')
        .notEmpty().withMessage('Password is required'),

    handleValidation,
]

// ─── Teams ────────────────────────────────────────────────────────────────────
const createTeam = [
    body('name')
        .trim().notEmpty().withMessage('Team name is required')
        .isLength({ min: 2, max: 100 }).withMessage('Team name must be 2–100 characters'),

    body('captain_id')
        .optional()
        .isInt({ min: 1 }).withMessage('captain_id must be a positive integer'),

    handleValidation,
]

const addPlayer = [
    param('id').isInt({ min: 1 }).withMessage('Team ID must be a positive integer'),

    body('user_id')
        .notEmpty().withMessage('user_id is required')
        .isInt({ min: 1 }).withMessage('user_id must be a positive integer'),

    body('role')
        .optional()
        .isIn(['batsman', 'bowler', 'all-rounder', 'wicket-keeper', 'captain'])
        .withMessage('Player role must be: batsman | bowler | all-rounder | wicket-keeper | captain'),

    handleValidation,
]

// ─── Tournaments ──────────────────────────────────────────────────────────────
const createTournament = [
    body('name')
        .trim().notEmpty().withMessage('Tournament name is required')
        .isLength({ min: 2, max: 150 }).withMessage('Name must be 2–150 characters'),

    body('year')
        .notEmpty().withMessage('Year is required')
        .isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100'),

    handleValidation,
]

const updateTournamentStatus = [
    param('id').isInt({ min: 1 }).withMessage('Tournament ID must be a positive integer'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['upcoming', 'ongoing', 'completed'])
        .withMessage('Status must be: upcoming | ongoing | completed'),

    handleValidation,
]

// ─── Matches ──────────────────────────────────────────────────────────────────
const createMatch = [
    body('team1_id')
        .notEmpty().withMessage('team1_id is required')
        .isInt({ min: 1 }).withMessage('team1_id must be a positive integer'),

    body('team2_id')
        .notEmpty().withMessage('team2_id is required')
        .isInt({ min: 1 }).withMessage('team2_id must be a positive integer')
        .custom((val, { req }) => {
            if (parseInt(val) === parseInt(req.body.team1_id))
                throw new Error('team1_id and team2_id must be different teams')
            return true
        }),

    body('tournament_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('tournament_id must be a positive integer'),

    body('scheduled_date')
        .optional({ nullable: true })
        .isISO8601().withMessage('scheduled_date must be a valid ISO 8601 date'),

    handleValidation,
]

const updateMatchStatus = [
    param('id').isInt({ min: 1 }).withMessage('Match ID must be a positive integer'),

    body('status')
        .notEmpty().withMessage('Status is required')
        .isIn(['upcoming', 'live', 'completed', 'cancelled'])
        .withMessage('Status must be: upcoming | live | completed | cancelled'),

    body('winner_id')
        .optional({ nullable: true })
        .isInt({ min: 1 }).withMessage('winner_id must be a positive integer'),

    handleValidation,
]

const updateScore = [
    param('id').isInt({ min: 1 }).withMessage('Match ID must be a positive integer'),

    body('team_id')
        .notEmpty().withMessage('team_id is required')
        .isInt({ min: 1 }).withMessage('team_id must be a positive integer'),

    body('runs')
        .notEmpty().withMessage('runs is required')
        .isInt({ min: 0 }).withMessage('runs must be a non-negative integer'),

    body('wickets')
        .notEmpty().withMessage('wickets is required')
        .isInt({ min: 0, max: 10 }).withMessage('wickets must be 0–10'),

    body('overs')
        .notEmpty().withMessage('overs is required')
        .isFloat({ min: 0 }).withMessage('overs must be a non-negative number'),

    body('extras')
        .optional()
        .isInt({ min: 0 }).withMessage('extras must be a non-negative integer'),

    handleValidation,
]

// ─── Players ──────────────────────────────────────────────────────────────────
const updatePlayer = [
    param('id').isInt({ min: 1 }).withMessage('Player ID must be a positive integer'),

    body('runs').optional().isInt({ min: 0 }).withMessage('runs must be non-negative'),
    body('wickets').optional().isInt({ min: 0 }).withMessage('wickets must be non-negative'),
    body('matches_played').optional().isInt({ min: 0 }).withMessage('matches_played must be non-negative'),
    body('batting_avg').optional().isFloat({ min: 0 }).withMessage('batting_avg must be non-negative'),
    body('strike_rate').optional().isFloat({ min: 0 }).withMessage('strike_rate must be non-negative'),
    body('economy').optional().isFloat({ min: 0 }).withMessage('economy must be non-negative'),

    handleValidation,
]

module.exports = {
    handleValidation,
    register,
    login,
    createTeam,
    addPlayer,
    createTournament,
    updateTournamentStatus,
    createMatch,
    updateMatchStatus,
    updateScore,
    updatePlayer,
}
