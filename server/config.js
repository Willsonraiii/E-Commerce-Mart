import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const ROOT = path.join(__dirname, '..')

// Load .env from the project root. Real hosts (Render, Railway, Fly, a systemd
// unit) inject real environment variables instead — dotenv never overwrites
// those, so both styles work.
dotenv.config({ path: path.join(ROOT, '.env') })

export const PORT = Number(process.env.PORT) || 4000

const DEFAULT_SECRET = 'yalamber-dev-secret-change-me'
export const JWT_SECRET = process.env.JWT_SECRET || DEFAULT_SECRET
export const COOKIE_NAME = process.env.COOKIE_NAME || 'ym_session'
export const IS_PROD = process.env.NODE_ENV === 'production'

/**
 * Where the SQLite file lives. Override with DB_FILE to point at a mounted
 * disk — e.g. DB_FILE=/var/data/yalamber.db on a host with ephemeral storage.
 * Relative paths resolve from the project root, not the current directory,
 * so `npm start` behaves the same wherever it is invoked from.
 */
const rawDb = process.env.DB_FILE || 'server/data/yalamber.db'
export const DB_FILE = path.isAbsolute(rawDb) ? rawDb : path.join(ROOT, rawDb)

/**
 * Where admin-uploaded product photos are written. Same reasoning as DB_FILE:
 * point it at the mounted disk so images survive a redeploy.
 *   UPLOAD_DIR=/var/data/uploads
 */
const rawUp = process.env.UPLOAD_DIR || 'public/uploads'
export const UPLOAD_DIR = path.isAbsolute(rawUp) ? rawUp : path.join(ROOT, rawUp)

/**
 * Browsers block cross-site cookies unless the server names the exact origin.
 * With the site on Vercel and the API elsewhere, set CORS_ORIGIN to the site's
 * URL (comma-separate several). Unset = reflect any origin (fine for local dev).
 */
export const CORS_ORIGIN = (process.env.CORS_ORIGIN || '')
  .split(',').map((s) => s.trim()).filter(Boolean)

export function warnIfUnsafe() {
  const problems = []
  if (JWT_SECRET === DEFAULT_SECRET || JWT_SECRET === 'change-me-in-production') {
    problems.push('JWT_SECRET is still the default — set a long random value or every session breaks when you rotate it later.')
  }
  if ((process.env.ADMIN_PASSWORD || 'admin123') === 'admin123') {
    problems.push('ADMIN_PASSWORD is still "admin123" — change it before going live.')
  }
  if (process.env.VITE_SHOW_DEMO_LOGINS === 'true') {
    problems.push('VITE_SHOW_DEMO_LOGINS=true publishes demo credentials on the sign-in page. Set it to false and rebuild.')
  }
  if (problems.length) {
    console.warn('\n\x1b[33m[security] Review before launch:\x1b[0m')
    problems.forEach((p) => console.warn(`  • ${p}`))
    console.warn('')
  }
}
