/**
 * src/config/env.js
 * Loads and validates all environment variables at startup.
 * The app will crash immediately with a clear error if required vars are missing.
 */
'use strict'

require('dotenv').config()

const required = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']

const missing = required.filter((key) => !process.env[key])
if (missing.length > 0) {
    console.error(`[CONFIG] Missing required environment variables: ${missing.join(', ')}`)
    console.error('[CONFIG] Please copy .env.example → .env and fill in your values.')
    process.exit(1)
}

module.exports = {
    // Server
    PORT: parseInt(process.env.PORT, 10) || 5000,
    NODE_ENV: process.env.NODE_ENV || 'development',

    // Database
    db: {
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT, 10) || 5432,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        // Connection pool tuning
        max: 10,   // max pool size
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
    },

    // JWT (wired up later when auth is added)
    jwt: {
        secret: process.env.JWT_SECRET || 'change_me',
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },

    isDev: process.env.NODE_ENV !== 'production',
    isProd: process.env.NODE_ENV === 'production',
}
