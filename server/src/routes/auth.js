/**
 * src/routes/auth.js
 * POST /api/auth/register  – create account + return JWT
 * POST /api/auth/login     – verify credentials + return JWT
 */
'use strict'

const { Router } = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const db = require('../db/pool')
const env = require('../config/env')

const router = Router()

// ── helpers ───────────────────────────────────────────────────────────────────
const signToken = (user) =>
    jwt.sign(
        { id: user.id, name: user.name, email: user.email, role: user.role },
        env.jwt.secret,
        { expiresIn: env.jwt.expiresIn }
    )

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// ── POST /api/auth/register ───────────────────────────────────────────────────
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role = 'viewer' } = req.body

        // Validation
        if (!name || !email || !password)
            return res.status(400).json({ status: 'error', message: 'name, email and password are required' })
        if (!EMAIL_RE.test(email))
            return res.status(400).json({ status: 'error', message: 'Invalid email address' })
        if (password.length < 6)
            return res.status(400).json({ status: 'error', message: 'Password must be at least 6 characters' })
        const allowedRoles = ['admin', 'captain', 'player', 'viewer']
        if (!allowedRoles.includes(role))
            return res.status(400).json({ status: 'error', message: `Role must be one of: ${allowedRoles.join(', ')}` })

        // Check duplicate email
        const existing = await db.query('SELECT id FROM users WHERE email = $1', [email.toLowerCase()])
        if (existing.rows.length > 0)
            return res.status(409).json({ status: 'error', message: 'Email already registered' })

        // Hash password
        const password_hash = await bcrypt.hash(password, 12)

        // Insert user
        const { rows } = await db.query(
            `INSERT INTO users (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role, created_at`,
            [name.trim(), email.toLowerCase().trim(), password_hash, role]
        )
        const user = rows[0]

        // If player/captain, also create a players record
        if (role === 'player' || role === 'captain') {
            await db.query('INSERT INTO players (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [user.id])
        }

        const token = signToken(user)

        return res.status(201).json({
            status: 'ok',
            message: 'Account created successfully',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        })
    } catch (err) {
        console.error('[AUTH/register]', err.message)
        return res.status(500).json({ status: 'error', message: 'Registration failed' })
    }
})

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body

        if (!email || !password)
            return res.status(400).json({ status: 'error', message: 'email and password are required' })

        // Fetch user
        const { rows } = await db.query(
            'SELECT id, name, email, password_hash, role FROM users WHERE email = $1',
            [email.toLowerCase().trim()]
        )
        if (rows.length === 0)
            return res.status(401).json({ status: 'error', message: 'Invalid email or password' })

        const user = rows[0]

        // Verify password
        const valid = await bcrypt.compare(password, user.password_hash)
        if (!valid)
            return res.status(401).json({ status: 'error', message: 'Invalid email or password' })

        const token = signToken(user)

        return res.json({
            status: 'ok',
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, role: user.role },
        })
    } catch (err) {
        console.error('[AUTH/login]', err.message)
        return res.status(500).json({ status: 'error', message: 'Login failed' })
    }
})

module.exports = router
