/**
 * src/db/migrate.js
 * One-time schema migration script.
 * Run: node src/db/migrate.js
 */
'use strict'

const fs = require('fs')
const path = require('path')
const db = require('./pool')

const run = async () => {
    try {
        const sql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8')
        console.log('[MIGRATE] Running schema migration…')
        await db.query(sql)
        console.log('[MIGRATE] ✅ All tables created successfully.')
    } catch (err) {
        console.error('[MIGRATE] ❌ Migration failed:', err.message)
        process.exit(1)
    } finally {
        await db.close()
    }
}

run()
