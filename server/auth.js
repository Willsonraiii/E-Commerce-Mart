import jwt from 'jsonwebtoken'
import { db, publicUser } from './db.js'

import { JWT_SECRET as SECRET, COOKIE_NAME } from './config.js'

export const COOKIE = COOKIE_NAME

export function signToken(user) {
  return jwt.sign({ sub: user.id, role: user.role }, SECRET, { expiresIn: '7d' })
}

function isHttps(req) {
  const proto = (req.get('x-forwarded-proto') || req.protocol || 'http').split(',')[0].trim()
  if (proto === 'https') return true
  const host = (req.get('x-forwarded-host') || req.get('host') || '').toLowerCase()
  if (host.includes('e2b.app')) return true
  const origin = req.get('origin') || ''
  return origin.startsWith('https:')
}

export function cookieOptions(req) {
  const https = isHttps(req)
  return {
    httpOnly: true,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    sameSite: https ? 'none' : 'lax',
    secure: https,
  }
}

export function setAuthCookie(req, res, token) {
  res.cookie(COOKIE, token, cookieOptions(req))
}

export function clearAuthCookie(req, res) {
  const opts = cookieOptions(req)
  delete opts.maxAge
  res.clearCookie(COOKIE, opts)
}

function readToken(req) {
  const header = req.get('authorization') || ''
  if (header.toLowerCase().startsWith('bearer ')) {
    const t = header.slice(7).trim()
    if (t) return t
  }
  const x = (req.get('x-auth-token') || '').trim()
  if (x) return x
  return req.cookies?.[COOKIE] || null
}

export function optionalAuth(req, _res, next) {
  try {
    const token = readToken(req)
    if (!token) { req.user = null; return next() }
    const payload = jwt.verify(token, SECRET)
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(payload.sub)
    req.user = row ? publicUser(row) : null
  } catch {
    req.user = null
  }
  next()
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: { message: 'Please sign in to continue.' } })
    }
    next()
  })
}

export function requireAdmin(req, res, next) {
  requireAuth(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { message: 'Admin access only.' } })
    }
    next()
  })
}
