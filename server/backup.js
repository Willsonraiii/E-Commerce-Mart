/**
 * Backup of the Supabase Postgres database via pg_dump.
 *
 *   npm run backup                  -> backups/yalambar-<timestamp>.sql
 *   npm run backup -- /path/out.sql -> explicit destination
 *
 * Requires the `pg_dump` client tool on whatever machine runs this script
 * (ships with a local Postgres install; otherwise `brew install libpq` on
 * macOS or `apt install postgresql-client` on Debian/Ubuntu) and
 * DATABASE_URL to be set. This is separate from Supabase's own automatic
 * backups — use this when you want a portable copy of your own.
 *
 * To restore: psql "$DATABASE_URL" -f "<backup file>"
 */
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import fs from 'node:fs'
import path from 'node:path'
import { sql } from './db.js'
import { ROOT } from './config.js'

const run = promisify(execFile)

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const arg = process.argv[2]
const dest = arg
  ? (path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg))
  : path.join(ROOT, 'backups', `yalambar-${stamp}.sql`)

fs.mkdirSync(path.dirname(dest), { recursive: true })

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('[backup] DATABASE_URL is not set.')
  process.exit(1)
}

try {
  await run('pg_dump', [connectionString, '--no-owner', '--no-privileges', '-f', dest])

  const { size } = fs.statSync(dest)
  const [{ c: products }] = await sql`select count(*)::int as c from products`
  const [{ c: orders }] = await sql`select count(*)::int as c from orders`
  const [{ c: users }] = await sql`select count(*)::int as c from users`

  console.log(`[backup] written : ${dest} (${(size / 1024).toFixed(0)} KB)`)
  console.log(`[backup] contains: ${products} products · ${orders} orders · ${users} users`)
  console.log(`[backup] restore with: psql "$DATABASE_URL" -f "${dest}"`)
} catch (err) {
  console.error('[backup] failed:', err.message)
  process.exitCode = 1
} finally {
  await sql.end()
}
