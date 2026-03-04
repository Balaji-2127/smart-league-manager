'use strict'
/**
 * src/utils/logger.js
 * Centralised Winston logger.
 *
 * Log levels:  error  warn  info  http  debug
 * Outputs:
 *   - Console (coloured, dev-only)
 *   - logs/app-YYYY-MM-DD.log  (daily rotating, max 14 days)
 *   - logs/error-YYYY-MM-DD.log (errors only, max 30 days)
 */

const { createLogger, format, transports } = require('winston')
const DailyRotateFile = require('winston-daily-rotate-file')
const path = require('path')
const env = require('../config/env')

const { combine, timestamp, colorize, printf, json, errors } = format

// ─── Console format (pretty, human-readable) ──────────────────────────────────
const consoleFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
    const metaStr = Object.keys(meta).length ? ' ' + JSON.stringify(meta) : ''
    return `${timestamp} [${level}] ${stack || message}${metaStr}`
})

// ─── File format (structured JSON for log analysis) ───────────────────────────
const fileFormat = combine(timestamp(), errors({ stack: true }), json())

// ─── Log directory ────────────────────────────────────────────────────────────
const LOG_DIR = path.join(__dirname, '../../logs')

const logger = createLogger({
    level: env.isDev ? 'debug' : 'info',
    defaultMeta: { service: 'smart-league-api' },

    transports: [
        // ── Console ──
        new transports.Console({
            format: combine(
                colorize({ all: true }),
                timestamp({ format: 'HH:mm:ss' }),
                errors({ stack: true }),
                consoleFormat
            ),
        }),

        // ── All logs (daily rotate) ──
        new DailyRotateFile({
            dirname: LOG_DIR,
            filename: 'app-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '14d',
            format: fileFormat,
        }),

        // ── Error-only log ──
        new DailyRotateFile({
            level: 'error',
            dirname: LOG_DIR,
            filename: 'error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxFiles: '30d',
            format: fileFormat,
        }),
    ],
})

// ─── Morgan-compatible stream ──────────────────────────────────────────────────
// Usage: app.use(morgan('combined', { stream: logger.stream }))
logger.stream = {
    write: (message) => logger.http(message.trim()),
}

module.exports = logger
