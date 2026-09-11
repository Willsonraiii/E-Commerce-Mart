import { PORT, ROOT as root, warnIfUnsafe, UPLOAD_DIR, CORS_ORIGIN } from './config.js'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { optionalAuth } from './auth.js'
import { seed } from './seed.js'
import { db, dbFile } from './db.js'
import catalogRoutes from './routes/catalog.js'
import accountRoutes from './routes/account.js'
import adminRoutes from './routes/admin.js'

const app = express()

app.set('trust proxy', 1)
app.use(cors({
  origin: CORS_ORIGIN.length ? CORS_ORIGIN : true,
  credentials: true,
}))
app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())
app.use(optionalAuth)

app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '7d' }))

app.get('/api/health', (_req, res) =>
  res.json({ success: true, data: { ok: true, at: new Date().toISOString() } }))

app.use('/api', catalogRoutes)
app.use('/api', accountRoutes)
app.use('/api/admin', adminRoutes)

app.use('/api', (_req, res) =>
  res.status(404).json({ success: false, error: { message: 'Endpoint not found.' } }))

// Serve built SPA in production
const dist = path.join(root, 'dist')
if (fs.existsSync(dist)) {
  app.use(express.static(dist))
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')))
}

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[api]', err.message)
  res.status(err.status || 500).json({
    success: false,
    error: { message: err.message || 'Something went wrong on our side.' },
  })
})

const result = seed()
console.log('[db]', result.skipped ? 'already seeded' : `seeded ${result.products} products`)
console.log('[db] file:', dbFile)
warnIfUnsafe()

const server = app.listen(PORT, '0.0.0.0', () => console.log(`[api] listening on http://0.0.0.0:${PORT}`))

/**
 * Fold the write-ahead log back into the main .db file before exiting so a
 * restart, redeploy or container stop can never strand committed rows in a
 * stray -wal file.
 */
function shutdown(signal) {
  console.log(`\n[api] ${signal} — checkpointing database…`)
  server.close(() => {
    try {
      db.pragma('wal_checkpoint(TRUNCATE)')
      db.close()
      console.log('[db] checkpoint complete, data flushed to disk.')
    } catch (e) {
      console.error('[db] checkpoint failed:', e.message)
    }
    process.exit(0)
  })
  setTimeout(() => process.exit(0), 4000).unref()
}
process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
