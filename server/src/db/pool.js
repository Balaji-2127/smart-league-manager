/**
 * src/db/pool.js
 * Singleton pg.Pool – shared across the entire application.
 *
 * Usage:
 *   const db = require('../db/pool')
 *   const { rows } = await db.query('SELECT $1::text AS message', ['hello'])
 */
'use strict'

const { Pool } = require('pg')
const env = require('../config/env')

const pool = new Pool(env.db)

// Surface connection errors immediately so startup fails clearly
pool.on('error', (err) => {
    console.error('[DB] Unexpected error on idle client:', err.message)
})

/**
 * Convenience wrapper – returns the pg QueryResult directly.
 * @param {string} text   – parameterised SQL, e.g. 'SELECT * FROM users WHERE id = $1'
 * @param {Array=} params – query parameters
 */
const query = (text, params) => pool.query(text, params)

/**
 * Borrow a client from the pool for multi-statement transactions.
 * Always call client.release() in a finally block.
 */
const connect = () => pool.connect()

/**
 * Graceful shutdown helper – called in server.js on SIGTERM / SIGINT.
 */
const close = () => pool.end()

module.exports = { query, connect, close, pool }
