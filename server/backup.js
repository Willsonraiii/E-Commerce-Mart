/**
 * Safe hot backup of the SQLite store.
 *
 *   npm run backup                 -> backups/yalamber-<timestamp>.db
 *   npm run backup -- /path/out.db -> explicit destination
 *
 * Uses SQLite's online backup API, so it is safe to run while the server is
 * live — you get a consistent snapshot including anything sitting in the WAL.
 * Copying the .db file by hand while the server runs can miss WAL contents;
 * this cannot.
 */
import fs from 'node:fs'
import path from 'node:path'
import { db, dbFile } from './db.js'
import { ROOT } from './config.js'

const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
const arg = process.argv[2]
const dest = arg
  ? (path.isAbsolute(arg) ? arg : path.join(process.cwd(), arg))
  : path.join(ROOT, 'backups', `yalamber-${stamp}.db`)

fs.mkdirSync(path.dirname(dest), { recursive: true })

try {
  await db.backup(dest)
  const { size } = fs.statSync(dest)
  const rows = db.prepare('SELECT COUNT(*) c FROM products').get().c
  const orders = db.prepare('SELECT COUNT(*) c FROM orders').get().c
  const users = db.prepare('SELECT COUNT(*) c FROM users').get().c
  console.log(`[backup] source : ${dbFile}`)
  console.log(`[backup] written: ${dest} (${(size / 1024).toFixed(0)} KB)`)
  console.log(`[backup] contains ${rows} products · ${orders} orders · ${users} users`)
  console.log('[backup] restore with: cp "<backup>" "' + dbFile + '"  (server stopped)')
} catch (err) {
  console.error('[backup] failed:', err.message)
  process.exitCode = 1
}
