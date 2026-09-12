/**
 * Seed a realistic spread of past orders so the admin charts have something
 * to draw. Dev/demo helper only — never run against real data.
 *
 *   node server/seed-demo-orders.mjs [days]
 */
import { randomUUID } from 'node:crypto'
import { db } from './db.js'

const DAYS = Number(process.argv[2]) || 120

const products = db.prepare('SELECT id,name,price,image FROM products WHERE archived=0').all()
const customers = db.prepare("SELECT id,name,email,phone FROM users WHERE role='customer'").all()
if (!products.length || !customers.length) {
  console.error('Need products and customers first — run `npm run seed`.')
  process.exit(1)
}

const STATUSES = ['delivered', 'delivered', 'delivered', 'delivered', 'confirmed', 'packing', 'out-for-delivery', 'cancelled']
const PAYMENTS = ['cash', 'esewa', 'khalti', 'card']
const rand = (n) => Math.floor(Math.random() * n)
const pick = (a) => a[rand(a.length)]

const existing = db.prepare("SELECT COUNT(*) c FROM orders WHERE id LIKE 'demo-%'").get().c
if (existing) {
  db.prepare("DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE id LIKE 'demo-%')").run()
  db.prepare("DELETE FROM orders WHERE id LIKE 'demo-%'").run()
  console.log(`[demo] cleared ${existing} previous demo order(s)`)
}

const insOrder = db.prepare(`
  INSERT INTO orders (id,user_id,customer_name,customer_email,customer_phone,address_line,landmark,city,notes,
                      payment_method,status,subtotal,discount,delivery_fee,total,eta,created_at)
  VALUES (@id,@user_id,@customer_name,@customer_email,@customer_phone,@address_line,@landmark,@city,@notes,
          @payment_method,@status,@subtotal,@discount,@delivery_fee,@total,@eta,@created_at)`)
const insItem = db.prepare(`
  INSERT INTO order_items (order_id,product_id,name,qty,unit_price,subtotal,image)
  VALUES (?,?,?,?,?,?,?)`)

let made = 0
const tx = db.transaction(() => {
  for (let d = DAYS; d >= 0; d -= 1) {
    // Busier on weekends, quieter midweek; some days get nothing.
    const dt = new Date()
    dt.setDate(dt.getDate() - d)
    const weekend = [5, 6].includes(dt.getDay())
    const n = Math.max(0, rand(weekend ? 6 : 4) - (Math.random() < 0.15 ? 3 : 0))

    for (let k = 0; k < n; k += 1) {
      const cust = pick(customers)
      const lines = []
      const count = 1 + rand(4)
      for (let i = 0; i < count; i += 1) {
        const p = pick(products)
        if (lines.some((l) => l.id === p.id)) continue
        const qty = 1 + rand(3)
        lines.push({ ...p, qty, subtotal: p.price * qty })
      }
      const subtotal = lines.reduce((t, l) => t + l.subtotal, 0)
      const delivery = subtotal >= 1500 ? 0 : 60
      const id = `demo-${randomUUID().slice(0, 8)}`
      dt.setHours(8 + rand(12), rand(60), rand(60), 0)

      insOrder.run({
        id, user_id: cust.id,
        customer_name: cust.name, customer_email: cust.email, customer_phone: cust.phone || '+977 9800000000',
        address_line: `${100 + rand(400)} New Baneshwor`, landmark: 'Near the chowk', city: 'Kathmandu', notes: '',
        payment_method: pick(PAYMENTS), status: pick(STATUSES),
        subtotal, discount: 0, delivery_fee: delivery, total: subtotal + delivery,
        eta: '45-90 min', created_at: dt.toISOString(),
      })
      lines.forEach((l) => insItem.run(id, l.id, l.name, l.qty, l.price, l.subtotal, l.image))
      made += 1
    }
  }
})
tx()

db.pragma('wal_checkpoint(TRUNCATE)')
const total = db.prepare('SELECT COUNT(*) c FROM orders').get().c
const rev = db.prepare("SELECT COALESCE(SUM(total),0) v FROM orders WHERE status!='cancelled'").get().v
console.log(`[demo] created ${made} orders across ${DAYS} days`)
console.log(`[demo] orders now: ${total} · revenue Rs. ${Math.round(rev).toLocaleString('en-IN')}`)
console.log('[demo] remove later with:  DELETE FROM orders WHERE id LIKE \'demo-%\';')
