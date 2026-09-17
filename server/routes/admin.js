import { Router } from 'express'
import multer from 'multer'
import { createClient } from '@supabase/supabase-js'
import { sql, mapProduct, mapOrder, publicUser, STOCK_LABEL } from '../db.js'
import { requireAdmin } from '../auth.js'

// Product images now go to Supabase Storage instead of local disk — a local
// `public/uploads/` folder doesn't survive a Vercel deploy (or even a
// restart on some hosts). Create a public bucket in the Supabase dashboard
// (Storage -> New bucket) and set its name below via env if it isn't
// "product-images". The client is created lazily so the server can boot
// fine without SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY set — it only errors
// if the /uploads route is actually used without them configured.
let supabaseAdmin = null
function getSupabaseAdmin() {
  if (!supabaseAdmin) {
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Image uploads need SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY set in .env.')
    }
    supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
  }
  return supabaseAdmin
}
const BUCKET = process.env.SUPABASE_UPLOAD_BUCKET || 'product-images'

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 4 * 1024 * 1024 },
  fileFilter: (_r, file, cb) => cb(null, /^image\//.test(file.mimetype)),
})

const router = Router()
router.use(requireAdmin)

/* ------------------------------- dashboard -------------------------------- */

router.get('/stats', async (_req, res) => {
  const [{ v: revenue }] = await sql`SELECT COALESCE(SUM(total),0)::float8 AS v FROM orders WHERE status != 'cancelled'`
  const [{ c: orders }] = await sql`SELECT COUNT(*)::int AS c FROM orders`
  const [{ c: customers }] = await sql`SELECT COUNT(*)::int AS c FROM users WHERE role = 'customer'`
  const [{ c: products }] = await sql`SELECT COUNT(*)::int AS c FROM products WHERE archived = false`
  const lowStock = await sql`SELECT id, name, stock, image FROM products WHERE stock IN ('low','out') AND archived = false`

  // Dense 14-day window so the chart always has a real date axis, padding
  // days with no orders as zero instead of collapsing them. Note: day
  // boundaries here are UTC (same as the old `date('now')` in SQLite was),
  // so double-check this lines up with local-time expectations for Nepal
  // (UTC+5:45) once you're looking at real data.
  const rows = await sql`
    SELECT created_at::date AS d, COALESCE(SUM(total),0)::float8 AS v, COUNT(*)::int AS n
    FROM orders WHERE created_at::date >= current_date - interval '13 days'
    GROUP BY created_at::date
  `
  const byDay = new Map(rows.map((r) => [r.d.toISOString().slice(0, 10), r]))
  const series = Array.from({ length: 14 }, (_, i) => {
    const dt = new Date()
    dt.setDate(dt.getDate() - (13 - i))
    const d = dt.toISOString().slice(0, 10)
    return byDay.get(d) || { d, v: 0, n: 0 }
  })

  // 12 months of revenue so the dashboard's bar chart has real history.
  const monthRows = await sql`
    SELECT to_char(created_at, 'YYYY-MM') AS m, COALESCE(SUM(total),0)::float8 AS v, COUNT(*)::int AS n
    FROM orders WHERE status != 'cancelled'
      AND created_at::date >= date_trunc('month', current_date) - interval '11 months'
    GROUP BY m
  `
  const byMonth = new Map(monthRows.map((r) => [r.m, r]))
  const months = Array.from({ length: 12 }, (_, i) => {
    const dt = new Date()
    dt.setDate(1)
    dt.setMonth(dt.getMonth() - (11 - i))
    const m = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
    const hit = byMonth.get(m)
    return { m, label: dt.toLocaleString('en-US', { month: 'short' }), v: hit ? hit.v : 0, n: hit ? hit.n : 0 }
  })

  const topProducts = await sql`
    SELECT oi.product_id AS id, oi.name, SUM(oi.qty)::int AS units, SUM(oi.subtotal)::float8 AS revenue
    FROM order_items oi GROUP BY oi.product_id, oi.name ORDER BY units DESC LIMIT 6
  `

  const byStatus = await sql`SELECT status, COUNT(*)::int AS c FROM orders GROUP BY status`
  const recentOrders = await sql`SELECT * FROM orders ORDER BY created_at DESC LIMIT 6`
  const recent = await Promise.all(recentOrders.map(async (o) => {
    const its = await sql`SELECT * FROM order_items WHERE order_id = ${o.id}`
    return mapOrder(o, its)
  }))

  res.json({
    success: true,
    data: {
      totals: { revenue, orders, customers, products, aov: orders ? revenue / orders : 0 },
      series, months, topProducts, byStatus, lowStock, recent,
    },
  })
})

/* -------------------------------- products -------------------------------- */

router.get('/products', async (req, res) => {
  const q = `%${String(req.query.q || '').toLowerCase()}%`
  const rows = await sql`
    SELECT p.*, (SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.product_id = p.id) AS rating
    FROM products p
    WHERE (lower(p.name) LIKE ${q} OR lower(p.brand) LIKE ${q} OR lower(p.id) LIKE ${q})
    ORDER BY p.archived ASC, p.name ASC
  `
  res.json({ success: true, data: { items: rows.map((r) => ({ ...mapProduct(r), archived: !!r.archived })) } })
})

const slug = (s) => String(s).toLowerCase().trim().replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')

router.post('/products', async (req, res) => {
  const b = req.body || {}
  if (!b.name?.trim()) return res.status(400).json({ success: false, error: { message: 'Name is required.' } })
  const id = b.id?.trim() || slug(b.name)
  const [exists] = await sql`SELECT 1 FROM products WHERE id = ${id}`
  if (exists) {
    return res.status(409).json({ success: false, error: { message: 'A product with that ID exists.' } })
  }
  const price = Number(b.price) || 0
  const original = b.originalPrice ? Number(b.originalPrice) : null
  await sql`
    INSERT INTO products
      (id, name, brand, category_id, description, price, original_price, discount, stock, weight, image, featured,
       created_at, popular, keywords, model, model_color, note)
    VALUES
      (${id}, ${b.name.trim()}, ${b.brand || ''}, ${b.category || null}, ${b.description || ''}, ${price}, ${original},
       ${original ? Math.round((1 - price / original) * 100) : 0}, ${b.stock || 'in'}, ${b.weight || ''},
       ${b.image || '/images/apple.jpg'}, ${!!b.featured}, current_date, ${Number(b.popular) || 50},
       ${Array.isArray(b.keywords) ? b.keywords.join(',') : (b.keywords || '')},
       ${b.model || null}, ${b.modelColor || '#c45d2c'}, ${b.note || ''})
  `
  const [row] = await sql`SELECT * FROM products WHERE id = ${id}`
  res.status(201).json({ success: true, data: { product: mapProduct(row) } })
})

router.patch('/products/:id', async (req, res) => {
  const [cur] = await sql`SELECT * FROM products WHERE id = ${req.params.id}`
  if (!cur) return res.status(404).json({ success: false, error: { message: 'Product not found.' } })
  const b = req.body || {}
  const price = b.price != null ? Number(b.price) : Number(cur.price)
  const original = b.originalPrice !== undefined
    ? (b.originalPrice ? Number(b.originalPrice) : null)
    : cur.original_price

  await sql`
    UPDATE products SET
      name = ${b.name ?? cur.name},
      brand = ${b.brand ?? cur.brand},
      category_id = ${b.category ?? cur.category_id},
      description = ${b.description ?? cur.description},
      price = ${price},
      original_price = ${original},
      discount = ${original ? Math.round((1 - price / original) * 100) : 0},
      stock = ${b.stock ?? cur.stock},
      weight = ${b.weight ?? cur.weight},
      image = ${b.image ?? cur.image},
      featured = ${b.featured != null ? !!b.featured : cur.featured},
      popular = ${b.popular != null ? Number(b.popular) : cur.popular},
      keywords = ${b.keywords != null ? (Array.isArray(b.keywords) ? b.keywords.join(',') : b.keywords) : cur.keywords},
      model = ${b.model !== undefined ? b.model : cur.model},
      model_color = ${b.modelColor ?? cur.model_color},
      note = ${b.note ?? cur.note},
      archived = ${b.archived != null ? !!b.archived : cur.archived}
    WHERE id = ${req.params.id}
  `
  const [row] = await sql`SELECT * FROM products WHERE id = ${req.params.id}`
  res.json({ success: true, data: { product: mapProduct(row) } })
})

router.delete('/products/:id', async (req, res) => {
  await sql`UPDATE products SET archived = true WHERE id = ${req.params.id}`
  res.json({ success: true, data: { ok: true } })
})

router.post('/uploads', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, error: { message: 'No image uploaded.' } })
  let client
  try {
    client = getSupabaseAdmin()
  } catch (e) {
    return res.status(500).json({ success: false, error: { message: e.message } })
  }
  const filename = `${Date.now()}-${req.file.originalname.replace(/[^\w.\-]/g, '_')}`
  const { error } = await client.storage
    .from(BUCKET)
    .upload(filename, req.file.buffer, { contentType: req.file.mimetype })
  if (error) {
    console.error('[uploads]', error.message)
    return res.status(500).json({ success: false, error: { message: 'Upload failed.' } })
  }
  const { data } = client.storage.from(BUCKET).getPublicUrl(filename)
  res.status(201).json({ success: true, data: { url: data.publicUrl } })
})

/* ------------------------------- categories ------------------------------- */

router.get('/categories', async (_req, res) => {
  const rows = await sql`
    SELECT c.*, (SELECT COUNT(*)::int FROM products p WHERE p.category_id = c.id AND p.archived = false) AS count
    FROM categories c ORDER BY c.sort_order
  `
  res.json({ success: true, data: { items: rows } })
})

router.post('/categories', async (req, res) => {
  const b = req.body || {}
  const id = b.id?.trim() || slug(b.name || '')
  if (!id) return res.status(400).json({ success: false, error: { message: 'Name is required.' } })
  const [{ v: n }] = await sql`SELECT COALESCE(MAX(sort_order), 0) + 1 AS v FROM categories`
  await sql`
    INSERT INTO categories (id, name, tone, blurb, sort_order)
    VALUES (${id}, ${b.name || id}, ${b.tone || 'leaf'}, ${b.blurb || ''}, ${b.sortOrder ?? n})
    ON CONFLICT (id) DO UPDATE SET
      name = excluded.name, tone = excluded.tone, blurb = excluded.blurb, sort_order = excluded.sort_order
  `
  res.status(201).json({ success: true, data: { ok: true } })
})

router.patch('/categories/:id', async (req, res) => {
  const [cur] = await sql`SELECT * FROM categories WHERE id = ${req.params.id}`
  if (!cur) return res.status(404).json({ success: false, error: { message: 'Not found.' } })
  const b = req.body || {}
  await sql`
    UPDATE categories SET name = ${b.name ?? cur.name}, tone = ${b.tone ?? cur.tone}, blurb = ${b.blurb ?? cur.blurb}
    WHERE id = ${req.params.id}
  `
  res.json({ success: true, data: { ok: true } })
})

router.delete('/categories/:id', async (req, res) => {
  const [{ c: used }] = await sql`SELECT COUNT(*)::int AS c FROM products WHERE category_id = ${req.params.id}`
  if (used) return res.status(400).json({ success: false, error: { message: `${used} products still use this category.` } })
  await sql`DELETE FROM categories WHERE id = ${req.params.id}`
  res.json({ success: true, data: { ok: true } })
})

/* --------------------------------- offers --------------------------------- */

router.get('/offers', async (_req, res) => {
  const rows = await sql`SELECT * FROM offers ORDER BY sort_order`
  const items = rows.map((o) => ({ ...o, to: o.to_path, sortOrder: o.sort_order }))
  res.json({ success: true, data: { items } })
})

router.post('/offers', async (req, res) => {
  const b = req.body || {}
  const id = b.id?.trim() || slug(b.title || 'offer')
  await sql`
    INSERT INTO offers (id, kicker, title, tag, detail, cta, to_path, theme, sort_order)
    VALUES (${id}, ${b.kicker || ''}, ${b.title || ''}, ${b.tag || ''}, ${b.detail || ''},
            ${b.cta || 'Shop now'}, ${b.to || b.to_path || '/shop'}, ${b.theme || 'leaf'}, ${Number(b.sortOrder) || 0})
    ON CONFLICT (id) DO UPDATE SET
      kicker = excluded.kicker, title = excluded.title, tag = excluded.tag, detail = excluded.detail,
      cta = excluded.cta, to_path = excluded.to_path, theme = excluded.theme, sort_order = excluded.sort_order
  `
  res.status(201).json({ success: true, data: { ok: true } })
})

router.delete('/offers/:id', async (req, res) => {
  await sql`DELETE FROM offers WHERE id = ${req.params.id}`
  res.json({ success: true, data: { ok: true } })
})

/* --------------------------------- orders --------------------------------- */

router.get('/orders', async (req, res) => {
  const status = req.query.status
  const rows = status && status !== 'all'
    ? await sql`SELECT * FROM orders WHERE status = ${status} ORDER BY created_at DESC`
    : await sql`SELECT * FROM orders ORDER BY created_at DESC`
  const items = await Promise.all(rows.map(async (o) => {
    const its = await sql`SELECT * FROM order_items WHERE order_id = ${o.id}`
    return mapOrder(o, its)
  }))
  res.json({ success: true, data: { items } })
})

const STATUSES = ['confirmed', 'packing', 'out-for-delivery', 'delivered', 'cancelled']

router.patch('/orders/:id', async (req, res) => {
  const s = req.body?.status
  if (!STATUSES.includes(s)) return res.status(400).json({ success: false, error: { message: 'Unknown status.' } })
  const result = await sql`UPDATE orders SET status = ${s} WHERE id = ${req.params.id}`
  if (!result.count) return res.status(404).json({ success: false, error: { message: 'Order not found.' } })
  res.json({ success: true, data: { ok: true, status: s } })
})

/* -------------------------------- customers ------------------------------- */

router.get('/customers', async (_req, res) => {
  const rows = await sql`
    SELECT u.*,
      (SELECT COUNT(*)::int FROM orders o WHERE o.user_id = u.id) AS orders,
      (SELECT COALESCE(SUM(total),0)::float8 FROM orders o WHERE o.user_id = u.id) AS spent
    FROM users u ORDER BY u.created_at DESC
  `
  res.json({
    success: true,
    data: { items: rows.map((u) => ({ ...publicUser(u), orders: u.orders, spent: Number(u.spent) })) },
  })
})

/* -------------------------------- settings -------------------------------- */

router.get('/settings', async (_req, res) => {
  const [row] = await sql`SELECT value FROM settings WHERE key = 'store'`
  res.json({ success: true, data: { store: row ? JSON.parse(row.value) : {} } })
})

router.put('/settings', async (req, res) => {
  await sql`
    INSERT INTO settings (key, value) VALUES ('store', ${JSON.stringify(req.body || {})})
    ON CONFLICT (key) DO UPDATE SET value = excluded.value
  `
  res.json({ success: true, data: { ok: true } })
})

router.get('/inventory', async (_req, res) => {
  const rows = await sql`SELECT * FROM products WHERE archived = false ORDER BY stock DESC, name ASC`
  res.json({
    success: true,
    data: { items: rows.map((r) => ({ ...mapProduct(r), stockLabel: STOCK_LABEL[r.stock] })) },
  })
})

export default router