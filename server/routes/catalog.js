import { Router } from 'express'
import { sql, mapProduct } from '../db.js'

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
  WHERE p.archived = false`

router.get('/products', async (req, res) => {
  const {
    q = '', category = '', sort = 'popular', minPrice, maxPrice,
    availability = 'all', discounted, featured, page = 1, pageSize = PAGE_SIZE, limit,
  } = req.query

  // Postgres needs numbered $1,$2... placeholders instead of SQLite's `?`,
  // and the number of filters varies per request — so this builds the WHERE
  // clause and its matching args array in lockstep, same shape as before,
  // then runs it with sql.unsafe (safe here: values are still bound
  // parameters, never string-concatenated into the query text).
  const where = []
  const args = []
  const bind = (v) => { args.push(v); return `$${args.length}` }

  if (category) where.push(`p.category_id = ${bind(category)}`)
  if (featured === '1' || featured === 'true') where.push('p.featured = true')
  if (discounted === '1' || discounted === 'true') where.push('p.discount > 0')
  if (minPrice) where.push(`p.price >= ${bind(Number(minPrice))}`)
  if (maxPrice) where.push(`p.price <= ${bind(Number(maxPrice))}`)
  if (availability === 'in') where.push("p.stock = 'in'")
  if (availability === 'low') where.push("p.stock = 'low'")
  if (availability === 'available') where.push("p.stock != 'out'")

  const tokens = String(q).trim().toLowerCase().split(/\s+/).filter(Boolean)
  for (const t of tokens) {
    const like = `%${t}%`
    const cols = [
      'lower(p.name)', 'lower(p.brand)', 'lower(p.keywords)', 'lower(p.description)',
      'lower(p.note)', "lower(COALESCE(c.name,''))", 'lower(p.category_id)', 'lower(p.weight)',
    ]
    where.push(`(${cols.map((c) => `${c} LIKE ${bind(like)}`).join(' OR ')})`)
  }

  const clause = where.length ? ` AND ${where.join(' AND ')}` : ''

  // Snapshot the filter args before adding LIMIT/OFFSET below — the count
  // query only needs the WHERE clause's placeholders.
  const filterArgs = [...args]
  const [{ c: total }] = await sql.unsafe(
    `SELECT COUNT(*)::int c FROM products p LEFT JOIN categories c ON c.id = p.category_id
     WHERE p.archived = false${clause}`,
    filterArgs,
  )

  const size = Math.max(1, Number(limit || pageSize) || PAGE_SIZE)
  const safePage = Math.max(1, Number(page) || 1)
  const limitPh = bind(size)
  const offsetPh = bind((safePage - 1) * size)
  const rows = await sql.unsafe(
    `${BASE}${clause} ORDER BY ${ORDER_BY[sort] || ORDER_BY.popular} LIMIT ${limitPh} OFFSET ${offsetPh}`,
    args,
  )

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

router.get('/products/:id', async (req, res) => {
  const [row] = await sql.unsafe(`${BASE} AND p.id = $1`, [req.params.id])
  if (!row) return res.status(404).json({ success: false, error: { message: 'Product not found.' } })
  const product = mapProduct(row)
  const related = (await sql.unsafe(
    `${BASE} AND p.category_id = $1 AND p.id != $2 ORDER BY p.popular DESC LIMIT 4`,
    [row.category_id, row.id],
  )).map(mapProduct)
  const reviews = await sql`
    SELECT id, author, rating, body, created_at AS "createdAt"
    FROM reviews WHERE product_id = ${row.id} ORDER BY created_at DESC
  `
  res.json({ success: true, data: { product, related, reviews } })
})

router.get('/categories', async (_req, res) => {
  const rows = await sql`
    SELECT c.*, (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id AND p.archived = false) AS count
    FROM categories c ORDER BY c.sort_order ASC
  `
  res.json({ success: true, data: { items: rows } })
})

router.get('/offers', async (_req, res) => {
  const rows = await sql`SELECT * FROM offers ORDER BY sort_order ASC`
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

router.get('/meta', async (_req, res) => {
  const [b] = await sql`SELECT MIN(price)::float8 AS mn, MAX(price)::float8 AS mx FROM products WHERE archived = false`
  const [store] = await sql`SELECT value FROM settings WHERE key = 'store'`
  res.json({
    success: true,
    data: {
      priceBounds: { min: Math.floor(b.mn || 0), max: Math.ceil(b.mx || 0) },
      sorts: SORTS,
      store: store ? JSON.parse(store.value) : null,
    },
  })
})

router.post('/products/:id/reviews', async (req, res) => {
  const { author = 'Anonymous', rating = 5, body = '' } = req.body || {}
  const [exists] = await sql`SELECT id FROM products WHERE id = ${req.params.id}`
  if (!exists) return res.status(404).json({ success: false, error: { message: 'Product not found.' } })
  const r = Math.min(5, Math.max(1, Number(rating) || 5))
  await sql`
    INSERT INTO reviews (product_id, user_id, author, rating, body)
    VALUES (${req.params.id}, ${req.user?.id || null}, ${req.user?.name || author}, ${r}, ${String(body).slice(0, 600)})
  `
  const reviews = await sql`
    SELECT id, author, rating, body, created_at AS "createdAt"
    FROM reviews WHERE product_id = ${req.params.id} ORDER BY created_at DESC
  `
  res.status(201).json({ success: true, data: { reviews } })
})

export default router
