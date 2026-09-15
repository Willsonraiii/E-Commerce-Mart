import { Router } from 'express'
import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { sql, publicUser, mapProduct, mapOrder } from '../db.js'
import { signToken, setAuthCookie, clearAuthCookie, requireAuth } from '../auth.js'

const router = Router()
const bad = (res, message, code = 400) =>
  res.status(code).json({ success: false, error: { message } })

/* ---------------------------------- auth --------------------------------- */

router.get('/auth/me', (req, res) => {
  res.json({ success: true, data: { user: req.user || null } })
})

router.post('/auth/register', async (req, res) => {
  const { name = '', email = '', phone = '', password = '', address = '', city = 'New Baneshwor', landmark = '' } = req.body || {}
  if (name.trim().length < 2) return bad(res, 'Please enter your full name.')
  if (!/^\S+@\S+\.\S+$/.test(email)) return bad(res, 'Enter a valid email address.')
  if (!/^[\d+\-\s()]{7,}$/.test(phone)) return bad(res, 'Enter a valid phone number.')
  if (String(password).length < 6) return bad(res, 'Password must be at least 6 characters.')

  const [dupe] = await sql`SELECT id FROM users WHERE lower(email) = lower(${email}) OR phone = ${phone}`
  if (dupe) return bad(res, 'An account with that email or phone already exists.', 409)

  const id = crypto.randomUUID()
  await sql`
    INSERT INTO users (id, name, phone, email, password_hash, role, address, city, landmark)
    VALUES (${id}, ${name.trim()}, ${phone.trim()}, ${email.trim().toLowerCase()},
            ${bcrypt.hashSync(password, 10)}, 'customer', ${address}, ${city}, ${landmark})
  `

  const [row] = await sql`SELECT * FROM users WHERE id = ${id}`
  const user = publicUser(row)
  const token = signToken(user)
  setAuthCookie(req, res, token)
  res.status(201).json({ success: true, data: { user, token } })
})

router.post('/auth/login', async (req, res) => {
  const login = (req.body?.email || req.body?.login || req.body?.phone || '').trim()
  const password = req.body?.password || ''
  if (!login || !password) return bad(res, 'Enter your email and password.')
  const [row] = await sql`SELECT * FROM users WHERE lower(email) = lower(${login}) OR phone = ${login}`
  if (!row || !bcrypt.compareSync(password, row.password_hash)) {
    return bad(res, 'Those details did not match an account.', 401)
  }
  const user = publicUser(row)
  const token = signToken(user)
  setAuthCookie(req, res, token)
  res.json({ success: true, data: { user, token } })
})

router.post('/auth/logout', (req, res) => {
  clearAuthCookie(req, res)
  res.json({ success: true, data: { user: null } })
})

router.patch('/auth/profile', requireAuth, async (req, res) => {
  const { name, phone, address, city, landmark, password } = req.body || {}
  const [cur] = await sql`SELECT * FROM users WHERE id = ${req.user.id}`
  const next = {
    name: name?.trim() || cur.name,
    phone: phone?.trim() || cur.phone,
    address: address ?? cur.address,
    city: city ?? cur.city,
    landmark: landmark ?? cur.landmark,
    hash: password && String(password).length >= 6 ? bcrypt.hashSync(password, 10) : cur.password_hash,
  }
  await sql`
    UPDATE users SET name = ${next.name}, phone = ${next.phone}, address = ${next.address},
      city = ${next.city}, landmark = ${next.landmark}, password_hash = ${next.hash}
    WHERE id = ${req.user.id}
  `
  const [updated] = await sql`SELECT * FROM users WHERE id = ${req.user.id}`
  res.json({ success: true, data: { user: publicUser(updated) } })
})

/* ---------------------------------- cart --------------------------------- */

async function cartFor(userId) {
  const rows = await sql`
    SELECT ci.qty, p.*, c.name AS category_name,
      (SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.product_id = p.id) AS rating
    FROM cart_items ci JOIN products p ON p.id = ci.product_id
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE ci.user_id = ${userId}
  `
  return rows.map((r) => ({ ...mapProduct(r), qty: r.qty }))
}

router.get('/cart', requireAuth, async (req, res) => {
  res.json({ success: true, data: { items: await cartFor(req.user.id) } })
})

router.put('/cart', requireAuth, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : []
  await sql.begin(async (tx) => {
    await tx`DELETE FROM cart_items WHERE user_id = ${req.user.id}`
    for (const it of items) {
      const qty = Math.max(1, Number(it.qty) || 1)
      const pid = it.id || it.productId
      const [exists] = await tx`SELECT 1 FROM products WHERE id = ${pid}`
      if (exists) {
        await tx`
          INSERT INTO cart_items (user_id, product_id, qty) VALUES (${req.user.id}, ${pid}, ${qty})
          ON CONFLICT (user_id, product_id) DO UPDATE SET qty = excluded.qty
        `
      }
    }
  })
  res.json({ success: true, data: { items: await cartFor(req.user.id) } })
})

router.post('/cart/merge', requireAuth, async (req, res) => {
  const items = Array.isArray(req.body?.items) ? req.body.items : []
  await sql.begin(async (tx) => {
    for (const it of items) {
      const pid = it.id || it.productId
      const qty = Math.max(1, Number(it.qty) || 1)
      const [exists] = await tx`SELECT 1 FROM products WHERE id = ${pid}`
      if (!exists) continue
      const [cur] = await tx`SELECT qty FROM cart_items WHERE user_id = ${req.user.id} AND product_id = ${pid}`
      if (cur) {
        await tx`UPDATE cart_items SET qty = ${Math.max(cur.qty, qty)} WHERE user_id = ${req.user.id} AND product_id = ${pid}`
      } else {
        await tx`INSERT INTO cart_items (user_id, product_id, qty) VALUES (${req.user.id}, ${pid}, ${qty})`
      }
    }
  })
  res.json({ success: true, data: { items: await cartFor(req.user.id) } })
})

/* -------------------------------- wishlist -------------------------------- */

router.get('/wishlist', requireAuth, async (req, res) => {
  const rows = await sql`
    SELECT p.*, (SELECT ROUND(AVG(rating),1) FROM reviews r WHERE r.product_id = p.id) AS rating
    FROM wishlist w JOIN products p ON p.id = w.product_id WHERE w.user_id = ${req.user.id}
  `
  res.json({ success: true, data: { items: rows.map(mapProduct) } })
})

router.post('/wishlist/:id', requireAuth, async (req, res) => {
  await sql`
    INSERT INTO wishlist (user_id, product_id) VALUES (${req.user.id}, ${req.params.id})
    ON CONFLICT (user_id, product_id) DO NOTHING
  `
  res.json({ success: true, data: { ok: true } })
})

router.delete('/wishlist/:id', requireAuth, async (req, res) => {
  await sql`DELETE FROM wishlist WHERE user_id = ${req.user.id} AND product_id = ${req.params.id}`
  res.json({ success: true, data: { ok: true } })
})

/* --------------------------------- orders --------------------------------- */

const DELIVERY_FEE = 60
const FREE_OVER = 1500

router.post('/orders', async (req, res) => {
  const { customer = {}, items = [], paymentMethod = 'cod', notes = '' } = req.body || {}
  if (!Array.isArray(items) || !items.length) return bad(res, 'Your bag is empty.')
  if (!customer.name?.trim()) return bad(res, 'Delivery name is required.')
  if (!customer.phone?.trim()) return bad(res, 'A phone number is required for delivery.')
  if (!customer.address?.trim()) return bad(res, 'Delivery address is required.')

  const priced = []
  for (const it of items) {
    const [p] = await sql`SELECT * FROM products WHERE id = ${it.id || it.productId} AND archived = false`
    if (!p) return bad(res, `"${it.name || it.id}" is no longer available.`)
    if (p.stock === 'out') return bad(res, `${p.name} just went out of stock.`)
    const qty = Math.max(1, Number(it.qty) || 1)
    priced.push({
      id: p.id, name: p.name, qty, price: Number(p.price),
      subtotal: Number(p.price) * qty, image: p.image, brand: p.brand, weight: p.weight,
      original: p.original_price ? Number(p.original_price) : null,
    })
  }

  const subtotal = priced.reduce((s, i) => s + i.subtotal, 0)
  const savings = priced.reduce((s, i) => s + (i.original ? (i.original - i.price) * i.qty : 0), 0)
  const delivery = subtotal >= FREE_OVER ? 0 : DELIVERY_FEE
  const total = subtotal + delivery
  const id = `YM-${Date.now().toString(36).toUpperCase()}${Math.floor(Math.random() * 90 + 10)}`
  const eta = 'Today, 45–90 minutes'

  await sql.begin(async (tx) => {
    await tx`
      INSERT INTO orders
        (id, user_id, customer_name, customer_phone, customer_email, address_line, landmark, city, notes,
         payment_method, status, subtotal, discount, delivery_fee, total, eta)
      VALUES
        (${id}, ${req.user?.id || null}, ${customer.name.trim()}, ${customer.phone.trim()}, ${customer.email || null},
         ${customer.address.trim()}, ${customer.landmark || ''}, ${customer.city || 'New Baneshwor'}, ${notes},
         ${paymentMethod}, 'confirmed', ${subtotal}, ${savings}, ${delivery}, ${total}, ${eta})
    `
    for (const i of priced) {
      await tx`
        INSERT INTO order_items (order_id, product_id, name, qty, unit_price, subtotal, image, brand, weight)
        VALUES (${id}, ${i.id}, ${i.name}, ${i.qty}, ${i.price}, ${i.subtotal}, ${i.image}, ${i.brand}, ${i.weight})
      `
    }
    if (req.user) await tx`DELETE FROM cart_items WHERE user_id = ${req.user.id}`
  })

  const [o] = await sql`SELECT * FROM orders WHERE id = ${id}`
  const its = await sql`SELECT * FROM order_items WHERE order_id = ${id}`
  res.status(201).json({ success: true, data: { order: mapOrder(o, its) } })
})

router.get('/orders', requireAuth, async (req, res) => {
  const rows = await sql`SELECT * FROM orders WHERE user_id = ${req.user.id} ORDER BY created_at DESC`
  const items = await Promise.all(rows.map(async (o) => {
    const its = await sql`SELECT * FROM order_items WHERE order_id = ${o.id}`
    return mapOrder(o, its)
  }))
  res.json({ success: true, data: { items } })
})

router.get('/orders/:id', async (req, res) => {
  const [o] = await sql`SELECT * FROM orders WHERE id = ${req.params.id}`
  if (!o) return bad(res, 'Order not found.', 404)
  if (o.user_id && (!req.user || (req.user.id !== o.user_id && req.user.role !== 'admin'))) {
    return bad(res, 'You do not have access to this order.', 403)
  }
  const its = await sql`SELECT * FROM order_items WHERE order_id = ${o.id}`
  res.json({ success: true, data: { order: mapOrder(o, its) } })
})

export default router
