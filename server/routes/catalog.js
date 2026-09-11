import { Router } from 'express'
import { db, mapProduct } from '../db.js'

const router = Router()
const PAGE_SIZE = 12

export const SORTS = [
  { id: 'popular', label: 'Popular' },
  { id: 'newest', label: 'Newest' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'name-asc', label: 'Name A–Z' },
  { id: 'discount', label: 'Discount' },
]

const ORDER_BY = {
  popular: 'p.popular DESC, p.name ASC',
  newest: 'p.created_at DESC, p.popular DESC',
  'price-asc': 'p.price ASC',
  'price-desc': 'p.price DESC',
  'name-asc': 'p.name ASC',
  discount: 'p.discount DESC, p.price ASC',
}

const BASE = `
  SELECT p.*, c.name AS category_name,
    (SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.product_id = p.id) AS rating,
    (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id) AS review_count
  FROM products p LEFT JOIN categories c ON c.id = p.category_id
  WHERE p.archived = 0`

router.get('/products', (req, res) => {
  const {
    q = '', category = '', sort = 'popular', minPrice, maxPrice,
    availability = 'all', discounted, featured, page = 1, pageSize = PAGE_SIZE, limit,
  } = req.query

  const where = []
  const args = []

  if (category) { where.push('p.category_id = ?'); args.push(category) }
  if (featured === '1' || featured === 'true') where.push('p.featured = 1')
  if (discounted === '1' || discounted === 'true') where.push('p.discount > 0')
  if (minPrice) { where.push('p.price >= ?'); args.push(Number(minPrice)) }
  if (maxPrice) { where.push('p.price <= ?'); args.push(Number(maxPrice)) }
  if (availability === 'in') where.push("p.stock = 'in'")
  if (availability === 'low') where.push("p.stock = 'low'")
  if (availability === 'available') where.push("p.stock != 'out'")

  const tokens = String(q).trim().toLowerCase().split(/\s+/).filter(Boolean)
  for (const t of tokens) {
    where.push(`(lower(p.name) LIKE ? OR lower(p.brand) LIKE ? OR lower(p.keywords) LIKE ?
      OR lower(p.description) LIKE ? OR lower(p.note) LIKE ? OR lower(COALESCE(c.name,'')) LIKE ?
      OR lower(p.category_id) LIKE ? OR lower(p.weight) LIKE ?)`)
    args.push(...Array(8).fill(`%${t}%`))
  }

  const clause = where.length ? ` AND ${where.join(' AND ')}` : ''
  const total = db.prepare(
    `SELECT COUNT(*) c FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.archived = 0${clause}`,
  ).get(...args).c

  const size = Math.max(1, Number(limit || pageSize) || PAGE_SIZE)
  const safePage = Math.max(1, Number(page) || 1)
  const rows = db.prepare(
    `${BASE}${clause} ORDER BY ${ORDER_BY[sort] || ORDER_BY.popular} LIMIT ? OFFSET ?`,
  ).all(...args, size, (safePage - 1) * size)

  res.json({
    success: true,
    data: {
      items: rows.map(mapProduct),
      total, page: safePage, pageSize: size,
      pageCount: Math.max(1, Math.ceil(total / size)),
      sorts: SORTS,
    },
  })
})

router.get('/products/:id', (req, res) => {
  const row = db.prepare(`${BASE} AND p.id = ?`).get(req.params.id)
  if (!row) return res.status(404).json({ success: false, error: { message: 'Product not found.' } })
  const product = mapProduct(row)
  const related = db.prepare(
    `${BASE} AND p.category_id = ? AND p.id != ? ORDER BY p.popular DESC LIMIT 4`,
  ).all(row.category_id, row.id).map(mapProduct)
  const reviews = db.prepare(
    'SELECT id,author,rating,body,created_at AS createdAt FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
  ).all(row.id)
  res.json({ success: true, data: { product, related, reviews } })
})

router.get('/categories', (_req, res) => {
  const rows = db.prepare(`
    SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.archived = 0) AS count
    FROM categories c ORDER BY c.sort_order ASC`).all()
  res.json({ success: true, data: { items: rows } })
})

router.get('/offers', (_req, res) => {
  const rows = db.prepare('SELECT * FROM offers ORDER BY sort_order ASC').all()
  res.json({
    success: true,
    data: {
      items: rows.map((o) => ({
        id: o.id, kicker: o.kicker, title: o.title, tag: o.tag,
        detail: o.detail, cta: o.cta, to: o.to_path, theme: o.theme,
      })),
    },
  })
})

router.get('/meta', (_req, res) => {
  const b = db.prepare('SELECT MIN(price) mn, MAX(price) mx FROM products WHERE archived = 0').get()
  const store = db.prepare("SELECT value FROM settings WHERE key = 'store'").get()
  res.json({
    success: true,
    data: {
      priceBounds: { min: Math.floor(b.mn || 0), max: Math.ceil(b.mx || 0) },
      sorts: SORTS,
      store: store ? JSON.parse(store.value) : null,
    },
  })
})

router.post('/products/:id/reviews', (req, res) => {
  const { author = 'Anonymous', rating = 5, body = '' } = req.body || {}
  const exists = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id)
  if (!exists) return res.status(404).json({ success: false, error: { message: 'Product not found.' } })
  const r = Math.min(5, Math.max(1, Number(rating) || 5))
  db.prepare('INSERT INTO reviews (product_id,user_id,author,rating,body) VALUES (?,?,?,?,?)')
    .run(req.params.id, req.user?.id || null, req.user?.name || author, r, String(body).slice(0, 600))
  const reviews = db.prepare(
    'SELECT id,author,rating,body,created_at AS createdAt FROM reviews WHERE product_id = ? ORDER BY created_at DESC',
  ).all(req.params.id)
  res.status(201).json({ success: true, data: { reviews } })
})

export default router
