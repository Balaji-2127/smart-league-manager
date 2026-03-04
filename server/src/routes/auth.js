'use strict'
/**
 * src/routes/auth.js
 * POST /api/auth/register  – create account + return JWT
 * POST /api/auth/login     – verify credentials + return JWT
 */

const { Router } = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db/pool')
const env = require('../config/env')
const validate = require('../middleware/validate')
const logger = require('../utils/logger')

const router = Router()

// ── helpers ───────────────────────────────────────────────────────────────────
const signToken = (user) =>
    jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
    )

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', validate.register, async (req, res) => {
    const { name, email, password, role = 'viewer' } = req.body
    try {
        // Check duplicate email
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
        if (existing.rows.length > 0) {
            logger.warn(`Register failed – email already exists: ${email}`)
            return res.status(409).json({ status: 'error', message: 'Email already registered' })
        }

        const password_hash = await bcrypt.hash(password, 12)

        const { rows } = await db.query(
            `INSERT INTO users (name, email, password_hash, role)
             VALUES ($1, $2, $3, $4)
             RETURNING id, name, email, role, created_at`,
            [name.trim(), email.toLowerCase().trim(), password_hash, role]
        )
        const user = rows[0]

        // Auto-create player record for player/captain
        if (role === 'player' || role === 'captain') {
            await db.query('INSERT INTO players (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id])
        }

        const token = signToken(user)
        logger.info(`New user registered: ${user.email} (role: ${user.role}, id: ${user.id})`)

        return res.status(201).json({
            status: 'ok',
            message: 'Account created successfully',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        })
    } catch (err) {
        logger.error(`Register error for ${email}: ${err.message}`, { stack: err.stack })
        return res.status(500).json({ status: 'error', message: 'Registration failed' })
    }
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', validate.login, async (req, res) => {
    const { email, password } = req.body
    try {
        const { rows } = await db.query(
            'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        )
        if (rows.length === 0) {
            logger.warn(`Login failed – user not found: ${email}`)
            return res.status(401).json({ status: 'error', message: 'Invalid email or password' })
        }

        const user = rows[0]
        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid) {
            logger.warn(`Login failed – wrong password for: ${email}`)
            return res.status(401).json({ status: 'error', message: 'Invalid email or password' })
        }

        const token = signToken(user)
        logger.info(`Login successful: ${user.email} (role: ${user.role}, id: ${user.id})`)

        return res.json({
            status: 'ok',
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        })
    } catch (err) {
        logger.error(`Login error for ${email}: ${err.message}`, { stack: err.stack })
        return res.status(500).json({ status: 'error', message: 'Login failed' })
    }
})

module.exports = router
