/**
 * src/middleware/auth.js
 * JWT authentication + RBAC role authorization middleware.
 *
 * Usage:
 *   router.get('/admin-only', authenticateUser, authorizeRoles(['admin']), handler)
 */
'use strict'

const jwt = require('jsonwebtoken')
const env = require('../config/env')

/**
 * authenticateUser
 * Verifies the Bearer JWT in the Authorization header.
 * Attaches decoded payload to req.user on success.
 */
const authenticateUser = (req, res, next) => {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
        return res.status(401).json({ status: 'error', message: 'No token provided' })
    }

    const token = header.split(' ')[1]
    try {
        req.user = jwt.verify(token, env.jwt.secret)
        next()
    } catch (err) {
        const message = err.name === 'TokenExpiredError' ? 'Token expired' : 'Invalid token'
        return res.status(401).json({ status: 'error', message })
    }
}

/**
 * authorizeRoles
 * Must be used AFTER authenticateUser.
 * @param {string[]} roles – allowed roles, e.g. ['admin', 'captain']
 */
const authorizeRoles = (roles) => (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
        return res.status(403).json({
            status: 'error',
            message: `Access denied. Required role(s): ${roles.join(' | ')}`,
        })
    }
    next()
}

module.exports = { authenticateUser, authorizeRoles }
