import { PORT, ROOT as root, warnIfUnsafe, CORS_ORIGIN } from './config.js'
import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { optionalAuth } from './auth.js'
import { seed } from './seed.js'
import { sql } from './db.js'
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

// No more /uploads static route — product images now live in Supabase
// Storage and are served from their own public URL (see routes/admin.js).

app.get('/api/health', (_req, res) =>
  res.json({ success: true, data: { ok: true, at: new Date().toISOString() } }))

app.use('/api', catalogRoutes)
app.use('/api', accountRoutes)
app.use('/api/admin', adminRoutes)

app.use('/api', (_req, res) =>
  res.status(404).json({ success: false, error: { message: 'Endpoint not found.' } }))

// Serve built SPA when this file runs as a normal long-lived process (local
// `npm start`, or any host other than Vercel). On Vercel, the built dist/ is
// served directly as static output per vercel.json, so this block is simply
// never reached there — the fs.existsSync(dist) check keeps it harmless either way.
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

// Vercel (api/index.js) imports this for the `app` export only — it never
// executes the block below, since VERCEL=1 is set automatically in that
// environment. Locally and on any other host, this is what actually starts
// the server, same as before.
export default app

if (process.env.VERCEL !== '1') {
  const result = await seed()
  console.log('[db]', result.skipped ? 'already seeded' : `seeded ${result.products} products`)
  warnIfUnsafe()

  const server = app.listen(PORT, '0.0.0.0', () => console.log(`[api] listening on http://0.0.0.0:${PORT}`))

  /**
   * Close the Postgres connection pool cleanly before exiting, so a
   * restart or container stop never leaves sockets dangling.
   */
  function shutdown(signal) {
    console.log(`\n[api] ${signal} — closing…`)
    server.close(async () => {
      try {
        await sql.end()
        console.log('[db] connection pool closed.')
      } catch (e) {
        console.error('[db] close failed:', e.message)
      }
      process.exit(0)
    })
    setTimeout(() => process.exit(0), 4000).unref()
  }
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('SIGTERM', () => shutdown('SIGTERM'))
}
