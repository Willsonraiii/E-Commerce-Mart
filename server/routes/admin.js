import { Router } from 'express'
import multer from 'multer'
import { UPLOAD_DIR } from '../config.js'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { db, mapProduct, mapOrder, publicUser, STOCK_LABEL } from '../db.js'
import { requireAdmin } from '../auth.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const uploadDir = UPLOAD_DIR
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })

const upload = multer({
  storage: multer.diskStorage({
    destination: (_r, _f, cb) => cb(null, uploadDir),
    filename: (_r, file, cb) =>
      cb(null, `${Date.now()}-${file.originalname.replace(/[^\w.\-]/g, '_')}`),
  }),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_r, file, cb) => cb(null, /^image\//.test(file.mimetype)),
})

const router = Router()
router.use(requireAdmin)

/* ------------------------------- dashboard -------------------------------- */

router.get('/stats', (_req, res) => {
  const g = (sql, ...a) => db.prepare(sql).get(...a)
  const revenue = g("SELECT COALESCE(SUM(total),0) v FROM orders WHERE status != 'cancelled'").v
  const orders = g('SELECT COUNT(*) c FROM orders').c
  const customers = g("SELECT COUNT(*) c FROM users WHERE role = 'customer'").c
  const products = g('SELECT COUNT(*) c FROM products WHERE archived = 0').c
  const lowStock = db.prepare("SELECT id,name,stock,image FROM products WHERE stock IN ('low','out') AND archived=0").all()

  // Build a dense 14-day window so the chart always has a real date axis,
  // padding days with no orders as zero instead of collapsing them.
  const rows = db.prepare(`
    SELECT date(created_at) d, COALESCE(SUM(total),0) v, COUNT(*) n
    FROM orders WHERE date(created_at) >= date('now','-13 days')
    GROUP BY date(created_at)`).all()
  const byDay = new Map(rows.map((r) => [r.d, r]))
  const series = Array.from({ length: 14 }, (_, i) => {
    const dt = new Date()
    dt.setDate(dt.getDate() - (13 - i))
    const d = dt.toISOString().slice(0, 10)
    return byDay.get(d) || { d, v: 0, n: 0 }
  })

  const topProducts = db.prepare(`
    SELECT oi.product_id id, oi.name, SUM(oi.qty) units, SUM(oi.subtotal) revenue
    FROM order_items oi GROUP BY oi.product_id ORDER BY units DESC LIMIT 6`).all()

  const byStatus = db.prepare('SELECT status, COUNT(*) c FROM orders GROUP BY status').all()
  const recent = db.prepare('SELECT * FROM orders ORDER BY created_at DESC LIMIT 6').all()
    .map((o) => mapOrder(o, db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id)))

  res.json({
    success: true,
    data: {
      totals: { revenue, orders, customers, products, aov: orders ? revenue / orders : 0 },
      series, topProducts, byStatus, lowStock, recent,
    },
  })
})

/* -------------------------------- products -------------------------------- */

router.get('/products', (req, res) => {
  const q = `%${String(req.query.q || '').toLowerCase()}%`
  const rows = db.prepare(`
    SELECT p.*, (SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.product_id=p.id) rating
    FROM products p
    WHERE (lower(p.name) LIKE ? OR lower(p.brand) LIKE ? OR lower(p.id) LIKE ?)
    ORDER BY p.archived ASC, p.name ASC`).all(q, q, q)
  res.json({ success: true, data: { items: rows.map((r) => ({ ...mapProduct(r), archived: !!r.archived })) } })
})

const slug = (s) => String(s).toLowerCase().trim().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')

router.post('/products', (req, res) => {
  const b = req.body || {}
  if (!b.name?.trim()) return res.status(400).json({ success: false, error: { message: 'Name is required.' } })
  const id = b.id?.trim() || slug(b.name)
  if (db.prepare('SELECT 1 FROM products WHERE id=?').get(id)) {
    return res.status(409).json({ success: false, error: { message: 'A product with that ID exists.' } })
  }
  const price = Number(b.price) || 0
  const original = b.originalPrice ? Number(b.originalPrice) : null
  db.prepare(`INSERT INTO products
    (id,name,brand,category_id,description,price,original_price,discount,stock,weight,image,featured,
     created_at,popular,keywords,model,model_color,note)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,date('now'),?,?,?,?,?)`)
    .run(id, b.name.trim(), b.brand || '', b.category || null, b.description || '', price, original,
      original ? Math.round((1 - price / original) * 100) : 0, b.stock || 'in', b.weight || '',
      b.image || '/images/apple.jpg', b.featured ? 1 : 0, Number(b.popular) || 50,
      Array.isArray(b.keywords) ? b.keywords.join(',') : (b.keywords || ''),
      b.model || null, b.modelColor || '#c45d2c', b.note || '')
  res.status(201).json({ success: true, data: { product: mapProduct(db.prepare('SELECT * FROM products WHERE id=?').get(id)) } })
})

router.patch('/products/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id)
  if (!cur) return res.status(404).json({ success: false, error: { message: 'Product not found.' } })
  const b = req.body || {}
  const price = b.price != null ? Number(b.price) : Number(cur.price)
  const original = b.originalPrice !== undefined
    ? (b.originalPrice ? Number(b.originalPrice) : null)
    : cur.original_price
  db.prepare(`UPDATE products SET name=?,brand=?,category_id=?,description=?,price=?,original_price=?,
    discount=?,stock=?,weight=?,image=?,featured=?,popular=?,keywords=?,model=?,model_color=?,note=?,archived=?
    WHERE id=?`).run(
    b.name ?? cur.name, b.brand ?? cur.brand, b.category ?? cur.category_id, b.description ?? cur.description,
    price, original, original ? Math.round((1 - price / original) * 100) : 0,
    b.stock ?? cur.stock, b.weight ?? cur.weight, b.image ?? cur.image,
    b.featured != null ? (b.featured ? 1 : 0) : cur.featured,
    b.popular != null ? Number(b.popular) : cur.popular,
    b.keywords != null ? (Array.isArray(b.keywords) ? b.keywords.join(',') : b.keywords) : cur.keywords,
    b.model !== undefined ? b.model : cur.model, b.modelColor ?? cur.model_color,
    b.note ?? cur.note, b.archived != null ? (b.archived ? 1 : 0) : cur.archived, req.params.id)
  res.json({ success: true, data: { product: mapProduct(db.prepare('SELECT * FROM products WHERE id=?').get(req.params.id)) } })
})

router.delete('/products/:id', (req, res) => {
  db.prepare('UPDATE products SET archived = 1 WHERE id = ?').run(req.params.id)
  res.json({ success: true, data: { ok: true } })
})

router.post('/uploads', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: { message: 'No image uploaded.' } })
  res.status(201).json({ success: true, data: { url: `/uploads/${req.file.filename}` } })
})

/* ------------------------------- categories ------------------------------- */

router.get('/categories', (_req, res) => {
  const rows = db.prepare(`SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id=c.id AND p.archived=0) count
    FROM categories c ORDER BY c.sort_order`).all()
  res.json({ success: true, data: { items: rows } })
})

router.post('/categories', (req, res) => {
  const b = req.body || {}
  const id = b.id?.trim() || slug(b.name || '')
  if (!id) return res.status(400).json({ success: false, error: { message: 'Name is required.' } })
  const n = db.prepare('SELECT COALESCE(MAX(sort_order),0)+1 v FROM categories').get().v
  db.prepare('INSERT OR REPLACE INTO categories (id,name,tone,blurb,sort_order) VALUES (?,?,?,?,?)')
    .run(id, b.name || id, b.tone || 'leaf', b.blurb || '', b.sortOrder ?? n)
  res.status(201).json({ success: true, data: { ok: true } })
})

router.patch('/categories/:id', (req, res) => {
  const cur = db.prepare('SELECT * FROM categories WHERE id=?').get(req.params.id)
  if (!cur) return res.status(404).json({ success: false, error: { message: 'Not found.' } })
  const b = req.body || {}
  db.prepare('UPDATE categories SET name=?,tone=?,blurb=? WHERE id=?')
    .run(b.name ?? cur.name, b.tone ?? cur.tone, b.blurb ?? cur.blurb, req.params.id)
  res.json({ success: true, data: { ok: true } })
})

router.delete('/categories/:id', (req, res) => {
  const used = db.prepare('SELECT COUNT(*) c FROM products WHERE category_id=?').get(req.params.id).c
  if (used) return res.status(400).json({ success: false, error: { message: `${used} products still use this category.` } })
  db.prepare('DELETE FROM categories WHERE id=?').run(req.params.id)
  res.json({ success: true, data: { ok: true } })
})

/* --------------------------------- offers --------------------------------- */

router.get('/offers', (_req, res) => {
  // Normalise to the same camelCase shape the public catalog returns.
  const items = db.prepare('SELECT * FROM offers ORDER BY sort_order').all()
    .map((o) => ({ ...o, to: o.to_path, sortOrder: o.sort_order }))
  res.json({ success: true, data: { items } })
})

router.post('/offers', (req, res) => {
  const b = req.body || {}
  const id = b.id?.trim() || slug(b.title || 'offer')
  db.prepare(`INSERT OR REPLACE INTO offers (id,kicker,title,tag,detail,cta,to_path,theme,sort_order)
    VALUES (?,?,?,?,?,?,?,?,?)`).run(id, b.kicker || '', b.title || '', b.tag || '', b.detail || '',
    b.cta || 'Shop now', b.to || b.to_path || '/shop', b.theme || 'leaf', Number(b.sortOrder) || 0)
  res.status(201).json({ success: true, data: { ok: true } })
})

router.delete('/offers/:id', (req, res) => {
  db.prepare('DELETE FROM offers WHERE id=?').run(req.params.id)
  res.json({ success: true, data: { ok: true } })
})

/* --------------------------------- orders --------------------------------- */

router.get('/orders', (req, res) => {
  const status = req.query.status
  const rows = status && status !== 'all'
    ? db.prepare('SELECT * FROM orders WHERE status=? ORDER BY created_at DESC').all(status)
    : db.prepare('SELECT * FROM orders ORDER BY created_at DESC').all()
  res.json({
    success: true,
    data: { items: rows.map((o) => mapOrder(o, db.prepare('SELECT * FROM order_items WHERE order_id=?').all(o.id))) },
  })
})

const STATUSES = ['confirmed', 'packing', 'out-for-delivery', 'delivered', 'cancelled']

router.patch('/orders/:id', (req, res) => {
  const s = req.body?.status
  if (!STATUSES.includes(s)) return res.status(400).json({ success: false, error: { message: 'Unknown status.' } })
  const r = db.prepare('UPDATE orders SET status=? WHERE id=?').run(s, req.params.id)
  if (!r.changes) return res.status(404).json({ success: false, error: { message: 'Order not found.' } })
  res.json({ success: true, data: { ok: true, status: s } })
})

/* -------------------------------- customers ------------------------------- */

router.get('/customers', (_req, res) => {
  const rows = db.prepare(`
    SELECT u.*, (SELECT COUNT(*) FROM orders o WHERE o.user_id=u.id) orders,
      (SELECT COALESCE(SUM(total),0) FROM orders o WHERE o.user_id=u.id) spent
    FROM users u ORDER BY u.created_at DESC`).all()
  res.json({
    success: true,
    data: { items: rows.map((u) => ({ ...publicUser(u), orders: u.orders, spent: Number(u.spent) })) },
  })
})

/* -------------------------------- settings -------------------------------- */

router.get('/settings', (_req, res) => {
  const row = db.prepare("SELECT value FROM settings WHERE key='store'").get()
  res.json({ success: true, data: { store: row ? JSON.parse(row.value) : {} } })
})

router.put('/settings', (req, res) => {
  db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('store',?)").run(JSON.stringify(req.body || {}))
  res.json({ success: true, data: { ok: true } })
})

router.get('/inventory', (_req, res) => {
  const rows = db.prepare('SELECT * FROM products WHERE archived=0 ORDER BY stock DESC, name ASC').all()
  res.json({
    success: true,
    data: { items: rows.map((r) => ({ ...mapProduct(r), stockLabel: STOCK_LABEL[r.stock] })) },
  })
})

export default router
